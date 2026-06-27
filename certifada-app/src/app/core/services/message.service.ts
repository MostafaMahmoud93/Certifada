import { Injectable, computed, signal } from '@angular/core';

export interface MsgReply { body: string; at: string; by: string; }
export interface CfMessage {
  id: number;
  from: string;
  email: string;
  body: string;
  credentialId?: string;
  credentialName?: string;
  createdAt: string;          // ISO
  read: boolean;
  starred: boolean;
  archived: boolean;
  replies: MsgReply[];
}

const KEY = 'cf-messages';

/**
 * Inbox for messages sent from public credential pages ("Questions or feedback?").
 * Persists to localStorage (`cf-messages`) and powers the header badge + Message Center.
 */
@Injectable({ providedIn: 'root' })
export class MessageService {
  readonly items = signal<CfMessage[]>(this.load());

  unread = computed(() => this.items().filter((m) => !m.read && !m.archived).length);
  inboxCount = computed(() => this.items().filter((m) => !m.archived).length);
  starredCount = computed(() => this.items().filter((m) => m.starred && !m.archived).length);
  archivedCount = computed(() => this.items().filter((m) => m.archived).length);

  /** Queue a new inbound message (from the public verify/credential page). */
  add(m: { from: string; email: string; body: string; credentialId?: string; credentialName?: string }): CfMessage {
    const id = Math.max(0, ...this.items().map((x) => x.id)) + 1;
    const msg: CfMessage = {
      id, from: m.from.trim() || 'Anonymous', email: m.email.trim(), body: m.body.trim(),
      credentialId: m.credentialId, credentialName: m.credentialName,
      createdAt: new Date().toISOString(), read: false, starred: false, archived: false, replies: [],
    };
    this.persist([msg, ...this.items()]);
    return msg;
  }

  markRead(id: number, read = true): void { this.persist(this.items().map((m) => (m.id === id ? { ...m, read } : m))); }
  markAllRead(): void { this.persist(this.items().map((m) => (m.archived ? m : { ...m, read: true }))); }
  toggleStar(id: number): void { this.persist(this.items().map((m) => (m.id === id ? { ...m, starred: !m.starred } : m))); }
  setArchived(id: number, archived: boolean): void { this.persist(this.items().map((m) => (m.id === id ? { ...m, archived, read: archived ? true : m.read } : m))); }
  remove(id: number): void { this.persist(this.items().filter((m) => m.id !== id)); }
  reply(id: number, body: string, by = 'You'): void {
    const b = body.trim(); if (!b) return;
    this.persist(this.items().map((m) => (m.id === id ? { ...m, read: true, replies: [...m.replies, { body: b, at: new Date().toISOString(), by }] } : m)));
  }

  private persist(list: CfMessage[]): void { this.items.set(list); try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* quota */ } }
  private load(): CfMessage[] {
    try { const raw = localStorage.getItem(KEY); if (raw) { const a = JSON.parse(raw); if (Array.isArray(a)) return a; } } catch { /* ignore */ }
    return this.seed();
  }
  private seed(): CfMessage[] {
    const ago = (h: number) => new Date(Date.now() - h * 3600000).toISOString();
    return [
      { id: 1, from: 'Sara Mahmoud', email: 'sara.m@example.com', body: 'Hi! Could you confirm whether this certificate can be added to my LinkedIn profile? I verified it from the public link and it looks great.', credentialId: '', credentialName: 'Advanced Web Development', createdAt: ago(3), read: false, starred: false, archived: false, replies: [] },
      { id: 2, from: 'Omar Adel', email: 'omar.adel@example.com', body: 'The recipient name on my credential is misspelled — it should be "Omar Adel" not "Omar Adl". Can you reissue it?', credentialId: '', credentialName: 'Workshop Attendance', createdAt: ago(26), read: false, starred: true, archived: false, replies: [] },
      { id: 3, from: 'Layla Hassan', email: 'layla.h@example.com', body: 'Thank you for the certificate! Verified successfully. Just wanted to say the design is beautiful.', credentialId: '', credentialName: 'Excellence Award', createdAt: ago(72), read: true, starred: false, archived: false, replies: [{ body: 'Thank you so much, Layla — glad you liked it!', at: ago(70), by: 'You' }] },
    ];
  }
}
