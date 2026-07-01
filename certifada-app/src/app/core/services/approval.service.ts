import { Injectable, computed, inject, signal } from '@angular/core';
import { IssuedService } from './issued.service';

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';
export type ApprovalType = 'Credential' | 'Batch' | 'Template';
export interface Approval {
  id: number;
  recipient: string;
  email: string;
  item: string;
  type: ApprovalType;
  requestedBy: string;
  requestedAt: string;
  note?: string;
  count?: number;
  status: ApprovalStatus;
  decidedBy?: string | null;
  decidedAt?: string | null;
  reason?: string | null;
  credentialId?: string;
  batchId?: string;
}

/**
 * Shared approval queue — the single source of truth for the Approvals page
 * and the Dashboard "Pending approvals" shortcut. Decisions persist to
 * localStorage (`cf-approvals`) so both surfaces stay in sync across reloads.
 */
@Injectable({ providedIn: 'root' })
export class ApprovalService {
  private readonly KEY = 'cf-approvals';
  readonly items = signal<Approval[]>(this.load());
  private issued = inject(IssuedService);
  constructor() { this.ensureFromIssued(); }

  pending = computed(() => this.items().filter((a) => a.status === 'Pending'));
  pendingCount = computed(() => this.pending().length);
  countOf(s: ApprovalStatus): number { return this.items().filter((a) => a.status === s).length; }

  /** Age (in days) of the oldest still-pending request. */
  oldestPendingDays = computed(() => {
    const ts = this.pending().map((a) => +new Date(a.requestedAt)).filter((n) => !!n);
    return ts.length ? Math.floor((Date.now() - Math.min(...ts)) / 86400000) : 0;
  });

  approve(id: number, by = 'You'): void { const a = this.items().find((x) => x.id === id); this.decide(id, 'Approved', null, by); this.stamp(a, by); }
  reject(id: number, reason: string | null = null, by = 'You'): void { this.decide(id, 'Rejected', reason, by); }

  /** Queue a new approval request (used when a signed credential is issued and must be approved first). */
  add(req: Omit<Approval, 'id' | 'status'> & { status?: ApprovalStatus }): Approval {
    const id = Math.max(0, ...this.items().map((a) => a.id)) + 1;
    const a: Approval = { ...req, id, status: req.status ?? 'Pending' };
    this.items.update((l) => [a, ...l]);
    this.persist();
    return a;
  }

  /** Replace a credential's approval-signature with the approver's signature once approved. */
  private stamp(a: Approval | undefined, by: string): void {
    if (!a) return;
    if (a.batchId) { this.issued.signBatch(a.batchId, by); return; }
    if (a.credentialId) { this.issued.sign(a.credentialId, by); return; }
    if (a.email) { const r = this.issued.findPendingByEmail(a.email); if (r) this.issued.sign(r.id, by); }
  }

  approveAll(by = 'You'): number {
    const pend = this.pending(); const now = new Date().toISOString();
    this.items.update((l) => l.map((a) => (a.status === 'Pending' ? { ...a, status: 'Approved' as ApprovalStatus, decidedBy: by, decidedAt: now } : a)));
    this.persist(); pend.forEach((a) => this.stamp(a, by)); return pend.length;
  }
  approveMany(ids: number[], by = 'You'): void {
    const set = new Set(ids); const now = new Date().toISOString();
    const toStamp = this.items().filter((a) => set.has(a.id) && a.status === 'Pending');
    this.items.update((l) => l.map((a) => (set.has(a.id) && a.status === 'Pending' ? { ...a, status: 'Approved' as ApprovalStatus, decidedBy: by, decidedAt: now } : a)));
    this.persist(); toStamp.forEach((a) => this.stamp(a, by));
  }

  /** Approve a subset of a batch's credentials by record id; resolves the batch entry once none remain. */
  approveBatchSubset(approval: Approval, recordIds: string[], by = 'You'): number {
    recordIds.forEach((id) => this.issued.sign(id, by));
    return this.reconcileBatch(approval, by, 'Approved', null);
  }
  /** Reject a subset of a batch's credentials by record id. */
  rejectBatchSubset(approval: Approval, recordIds: string[], by = 'You', reason: string | null = null): number {
    recordIds.forEach((id) => this.issued.setStatus(id, 'Revoked'));
    return this.reconcileBatch(approval, by, 'Rejected', reason);
  }
  /** After a partial batch decision, update the batch's remaining count or close it out. */
  private reconcileBatch(approval: Approval, by: string, finalStatus: ApprovalStatus, reason: string | null): number {
    const remaining = this.issued.records().filter((r) => r.batchId === approval.batchId && r.status === 'Pending' && !r.signedBy).length;
    const now = new Date().toISOString();
    this.items.update((l) => l.map((a) => {
      if (a.id !== approval.id) return a;
      if (remaining <= 0) return { ...a, status: finalStatus, decidedBy: by, decidedAt: now, reason };
      return { ...a, count: remaining };
    }));
    this.persist();
    return remaining;
  }

  private decide(id: number, status: ApprovalStatus, reason: string | null, by: string): void {
    const now = new Date().toISOString();
    this.items.update((l) => l.map((a) => (a.id === id ? { ...a, status, decidedBy: by, decidedAt: now, reason } : a)));
    this.persist();
  }
  private persist(): void { try { localStorage.setItem(this.KEY, JSON.stringify(this.items())); } catch { /* ignore */ } }
  private load(): Approval[] {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const a = JSON.parse(raw);
        // Keep only approvals tied to a real issued credential/batch — purges legacy demo seed.
        if (Array.isArray(a)) return a.filter((x: Approval) => !!x.credentialId || !!x.batchId);
      }
    } catch { /* ignore */ }
    return [];
  }

  /** Surface real pending issued credentials in the queue (individuals + one entry per bulk batch). */
  ensureFromIssued(by = 'You'): void {
    const haveCred = new Set(this.items().filter((a) => a.credentialId).map((a) => a.credentialId));
    const haveBatch = new Set(this.items().filter((a) => a.batchId).map((a) => a.batchId));
    const pend = this.issued.records().filter((r) => r.status === 'Pending' && !r.signedBy);
    const adds: Approval[] = [];
    const seenBatch = new Set<string>();
    for (const r of pend) {
      if (r.batchId) {
        if (haveBatch.has(r.batchId) || seenBatch.has(r.batchId)) continue;
        seenBatch.add(r.batchId);
        const n = pend.filter((x) => x.batchId === r.batchId).length;
        adds.push({ id: 0, recipient: (r.templateName || 'Certificate') + ' — ' + n + ' recipients', email: '', item: r.templateName || 'Certificate', type: 'Batch', requestedBy: by, requestedAt: r.createdAt, count: n, status: 'Pending', batchId: r.batchId });
      } else {
        if (haveCred.has(r.id)) continue;
        adds.push({ id: 0, recipient: r.recipientName, email: r.recipientEmail, item: r.templateName || 'Certificate', type: 'Credential', requestedBy: by, requestedAt: r.createdAt, status: 'Pending', credentialId: r.id });
      }
    }
    if (adds.length) {
      let maxId = Math.max(0, ...this.items().map((a) => a.id));
      this.items.update((l) => [...adds.map((a) => ({ ...a, id: ++maxId })), ...l]);
      this.persist();
    }
  }
}
