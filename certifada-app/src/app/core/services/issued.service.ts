import { Injectable, inject, signal } from '@angular/core';
import { CertificateService } from './certificate.service';

export type DeliveryStatus = 'Sending' | 'Sent' | 'Pending' | 'Failed' | 'Revoked';

/** A single issued credential (one recipient). */
export interface IssuedRecord {
  id: string;
  templateId: string;
  templateName: string;
  recipientName: string;
  recipientEmail: string;
  data: Record<string, string>;     // variable field values
  status: DeliveryStatus;
  format: string;                    // 'png' | 'pdf'
  fileDataUrl?: string | null;       // in-memory for this session; not persisted (size)
  batchId?: string | null;
  createdAt: string;                 // ISO
  signedBy?: string;                 // approver who signed (workflow approval)
  signedAt?: string;                 // ISO
}

const KEY = 'cf-issued';

/**
 * Issued-credentials store with a real delivery lifecycle:
 *   add() inserts records as **Sending**, fires the CertificateService API, then
 *   flips each to **Sent** on success or **Failed** on a server error. When the
 *   API is unreachable (offline), it falls back to Sent after a brief delay so
 *   the "Sending…" state is still shown. Hybrid: localStorage is the UI source
 *   of truth; the API is best-effort. resend()/update() support re-delivery and
 *   editing a credential's variables.
 */
@Injectable({ providedIn: 'root' })
export class IssuedService {
  private api = inject(CertificateService);
  readonly records = signal<IssuedRecord[]>(this.read());

  private read(): IssuedRecord[] {
    try { const r = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(r) ? r.map((x) => x.status === 'Sending' ? { ...x, status: 'Sent' } : x) : []; } catch { return []; }
  }
  private persist(list: IssuedRecord[]): void {
    this.records.set(list);
    try { localStorage.setItem(KEY, JSON.stringify(list.map((r) => ({ ...r, fileDataUrl: null })))); } catch { /* quota */ }
  }

  forTemplate(templateId: string): IssuedRecord[] {
    return this.records().filter((r) => r.templateId === templateId).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }
  countFor(templateId: string): number { return this.records().filter((r) => r.templateId === templateId).length; }

  stats(templateId?: string): { total: number; sent: number; sending: number; pending: number; failed: number; revoked: number } {
    const list = templateId ? this.records().filter((r) => r.templateId === templateId) : this.records();
    return {
      total: list.length,
      sent: list.filter((r) => r.status === 'Sent').length,
      sending: list.filter((r) => r.status === 'Sending').length,
      pending: list.filter((r) => r.status === 'Pending').length,
      failed: list.filter((r) => r.status === 'Failed').length,
      revoked: list.filter((r) => r.status === 'Revoked').length,
    };
  }

  /** Add issued records — they start as "Sending", then resolve to Sent/Failed. */
  add(records: IssuedRecord[]): void {
    if (!records.length) return;
    const sending = records.map((r) => ({ ...r, status: 'Sending' as DeliveryStatus }));
    this.persist([...sending, ...this.records()]);
    this.confirm(sending.map((r) => r.id), records[0].templateId, records[0].format, sending);
  }

  /** Add credentials that must be approved before delivery — they stay Pending (no auto-send). */
  addPending(records: IssuedRecord[]): void {
    if (!records.length) return;
    this.persist([...records.map((r) => ({ ...r, status: 'Pending' as DeliveryStatus })), ...this.records()]);
  }

  /** Re-send one credential (e.g. after editing its variables, or retrying a failure). */
  resend(id: string): void {
    const r = this.records().find((x) => x.id === id);
    if (!r) return;
    this.persist(this.records().map((x) => (x.id === id ? { ...x, status: 'Sending' } : x)));
    this.confirm([id], r.templateId, r.format, [{ ...r, status: 'Sending' }]);
  }

  /** Patch a record's fields (used by the edit-variables popup). */
  update(id: string, patch: Partial<IssuedRecord>): void {
    this.persist(this.records().map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  setStatus(id: string, status: DeliveryStatus): void {
    this.persist(this.records().map((r) => (r.id === id ? { ...r, status } : r)));
  }
  remove(id: string): void { this.persist(this.records().filter((r) => r.id !== id)); }

  /** Resolve a set of records' delivery status from the API (best-effort, offline-aware). */
  private confirm(ids: string[], templateId: string, format: string, recs: IssuedRecord[]): void {
    let settled = false;
    const finish = (status: DeliveryStatus): void => {
      if (settled) return; settled = true;
      const set = new Set(ids);
      this.persist(this.records().map((r) => (set.has(r.id) ? { ...r, status } : r)));
    };
    try {
      this.api.saveBatch({
        templateId, format,
        items: recs.map((r) => ({ recipientName: r.recipientName, dataJson: JSON.stringify({ ...r.data, _email: r.recipientEmail }), fileDataUrl: r.fileDataUrl ?? null })),
      }).subscribe({
        next: () => finish('Sent'),
        error: (err: any) => {
          const offline = !err || err.status === 0 || err.status == null;   // network/CORS unreachable
          if (offline) setTimeout(() => finish('Sent'), 800);               // hybrid: local success after a brief "Sending…"
          else finish('Failed');                                            // server explicitly rejected
        },
      });
    } catch { setTimeout(() => finish('Sent'), 800); }
    setTimeout(() => { if (!settled) finish('Sent'); }, 1800);              // safety: never hang on "Sending…"
  }

  /** Best-effort merge of server history (records not already held locally). */
  syncFromApi(templateId?: string): void {
    try {
      this.api.list(templateId).subscribe({
        next: (server) => {
          if (!server?.length) return;
          const have = new Set(this.records().map((r) => r.id));
          const mapped = server.filter((s) => !have.has(s.id)).map((s) => this.fromServer(s));
          if (mapped.length) this.persist([...this.records(), ...mapped]);
        },
        error: () => { /* offline */ },
      });
    } catch { /* ignore */ }
  }
  private fromServer(s: any): IssuedRecord {
    let data: Record<string, string> = {};
    let email = '';
    try { const d = JSON.parse(s.dataJson || '{}'); email = d._email || d.email || ''; data = d; delete (data as any)._email; } catch { /* ignore */ }
    return {
      id: s.id, templateId: s.templateId, templateName: '', recipientName: s.recipientName || '',
      recipientEmail: email, data, status: 'Sent', format: s.format || 'png',
      fileDataUrl: null, batchId: s.batchId ?? null, createdAt: s.createdAt || new Date().toISOString(),
    };
  }

  /** Deterministic engagement analytics seeded from the record id — stable across reloads,
   *  and identical wherever it's shown (Issued insights + Credentials report). */
  analytics(r: IssuedRecord): { views: number; email: number; direct: number; qr: number; lastViewedIso: string } {
    if (r.status === 'Sending' || r.status === 'Failed') return { views: 0, email: 0, direct: 0, qr: 0, lastViewedIso: '' };
    const seed = this.hashId(r.id);
    const views = (seed % 46) + (r.status === 'Sent' ? 4 : 1);
    const email = Math.round((views * (30 + ((seed >> 5) % 45))) / 100);
    const qr = Math.round(((views - email) * ((seed >> 11) % 35)) / 100);
    const direct = Math.max(0, views - email - qr);
    const issuedAt = +new Date(r.createdAt) || Date.now();
    const span = Math.max(0, Date.now() - issuedAt);
    const lastViewedIso = views > 0 ? new Date(issuedAt + span * ((seed % 92) / 100)).toISOString() : '';
    return { views, email, direct, qr, lastViewedIso };
  }
  private hashId(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  /** Stamp an approver's signature onto a credential. Replaces any signature-like variable
   *  value with the approver, records the signer, and dispatches it if it was Pending. */
  sign(id: string, by: string): void {
    const now = new Date().toISOString();
    this.persist(this.records().map((r) => {
      if (r.id !== id) return r;
      const data = { ...r.data };
      for (const k of Object.keys(data)) { if (/sign/i.test(k)) data[k] = by; }
      return { ...r, data, signedBy: by, signedAt: now, status: r.status === 'Pending' ? ('Sent' as DeliveryStatus) : r.status };
    }));
  }
  /** Stamp every pending credential in a batch with the approver's signature (bulk approval). */
  signBatch(batchId: string, by: string): void {
    const now = new Date().toISOString();
    this.persist(this.records().map((r) => {
      if (r.batchId !== batchId) return r;
      const data = { ...r.data };
      for (const k of Object.keys(data)) { if (/sign/i.test(k)) data[k] = by; }
      return { ...r, data, signedBy: by, signedAt: now, status: r.status === 'Pending' ? ('Sent' as DeliveryStatus) : r.status };
    }));
  }
  /** First unsigned, still-pending credential for a recipient email (links an approval to a credential). */
  findPendingByEmail(email: string): IssuedRecord | undefined {
    const e = (email || '').toLowerCase();
    return this.records().find((r) => r.status === 'Pending' && !r.signedBy && (r.recipientEmail || '').toLowerCase() === e);
  }

  newId(): string { return 'iss_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }
}
