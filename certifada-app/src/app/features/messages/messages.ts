import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MessageService, CfMessage } from '../../core/services/message.service';

type Filter = 'inbox' | 'unread' | 'starred' | 'archived';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [RouterLink],
  template: `
  <div class="head">
    <div class="h-l">
      <span class="h-ic"><span class="material-icons">forum</span></span>
      <div><h1>Message Center</h1><p class="cf-muted">Questions &amp; feedback sent from your public credential pages.</p></div>
    </div>
    <button class="cf-btn cf-btn-secondary sm" (click)="svc.markAllRead()" [disabled]="!svc.unread()"><span class="material-icons">done_all</span> Mark all read</button>
  </div>

  <div class="stats">
    <button class="stat" [class.on]="filter()==='inbox'" (click)="setFilter('inbox')"><span class="s-ic in"><span class="material-icons">inbox</span></span><div><div class="s-val">{{ svc.inboxCount() }}</div><div class="s-lbl">Inbox</div></div></button>
    <button class="stat" [class.on]="filter()==='unread'" (click)="setFilter('unread')"><span class="s-ic un"><span class="material-icons">mark_email_unread</span></span><div><div class="s-val">{{ svc.unread() }}</div><div class="s-lbl">Unread</div></div></button>
    <button class="stat" [class.on]="filter()==='starred'" (click)="setFilter('starred')"><span class="s-ic st"><span class="material-icons">star</span></span><div><div class="s-val">{{ svc.starredCount() }}</div><div class="s-lbl">Starred</div></div></button>
    <button class="stat" [class.on]="filter()==='archived'" (click)="setFilter('archived')"><span class="s-ic ar"><span class="material-icons">archive</span></span><div><div class="s-val">{{ svc.archivedCount() }}</div><div class="s-lbl">Archived</div></div></button>
  </div>

  <div class="mc" [class.has-sel]="!!selected()">
    <div class="mc-list">
      <div class="lsearch"><span class="material-icons">search</span><input [value]="query()" (input)="query.set($any($event.target).value)" placeholder="Search messages…" />@if (query()) { <button class="clr" (click)="query.set('')"><span class="material-icons">close</span></button> }</div>
      <div class="rows">
        @for (m of list(); track m.id) {
          <button class="row" [class.unread]="!m.read" [class.sel]="selectedId()===m.id" (click)="open(m)">
            <span class="ava" [style.background]="tone(m.from)">{{ initials(m.from) }}</span>
            <span class="r-body">
              <span class="r-top"><b>{{ m.from }}</b><span class="r-time">{{ ago(m.createdAt) }}</span></span>
              <span class="r-sub">{{ m.credentialName || 'Credential message' }}</span>
              <span class="r-prev">{{ m.body }}</span>
            </span>
            <span class="r-marks">
              @if (!m.read) { <span class="dot"></span> }
              <span class="star material-icons" [class.on]="m.starred" (click)="star(m, $event)">{{ m.starred ? 'star' : 'star_border' }}</span>
            </span>
          </button>
        } @empty {
          <div class="empty"><span class="material-icons">{{ filter()==='archived' ? 'archive' : 'mark_email_read' }}</span><p>{{ query() ? 'No messages match your search.' : 'Nothing here yet.' }}</p></div>
        }
      </div>
    </div>

    <div class="mc-reader">
      @if (selected(); as m) {
        <div class="rd-head">
          <button class="mc-back ic" (click)="back()" title="Back"><span class="material-icons">arrow_back</span></button>
          <span class="ava lg" [style.background]="tone(m.from)">{{ initials(m.from) }}</span>
          <div class="rd-who"><b>{{ m.from }}</b><a class="rd-mail" [href]="'mailto:' + m.email">{{ m.email }}</a></div>
          <div class="rd-tools">
            <button class="ic" [class.on]="m.starred" (click)="star(m)" title="Star"><span class="material-icons">{{ m.starred ? 'star' : 'star_border' }}</span></button>
            <button class="ic" (click)="markUnread(m)" title="Mark unread"><span class="material-icons">mark_email_unread</span></button>
            <button class="ic" (click)="archive(m)" [title]="m.archived ? 'Move to inbox' : 'Archive'"><span class="material-icons">{{ m.archived ? 'unarchive' : 'archive' }}</span></button>
            <button class="ic danger" (click)="del(m)" title="Delete"><span class="material-icons">delete</span></button>
          </div>
        </div>
        <div class="rd-meta">
          <span><span class="material-icons">schedule</span> {{ fullDate(m.createdAt) }}</span>
          @if (m.credentialName) {
            @if (m.credentialId) { <a class="cred" [routerLink]="['/verify', m.credentialId]"><span class="material-icons">workspace_premium</span> {{ m.credentialName }} <span class="material-icons go">open_in_new</span></a> }
            @else { <span class="cred"><span class="material-icons">workspace_premium</span> {{ m.credentialName }}</span> }
          }
        </div>
        <div class="rd-scroll">
          <div class="bubble in"><p>{{ m.body }}</p></div>
          @for (rp of m.replies; track $index) {
            <div class="bubble out"><span class="b-by">{{ rp.by }} · {{ ago(rp.at) }}</span><p>{{ rp.body }}</p></div>
          }
        </div>
        <div class="rd-reply">
          <textarea [value]="reply()" (input)="reply.set($any($event.target).value)" rows="2" placeholder="Write a reply…" (keydown.meta.enter)="send(m)" (keydown.control.enter)="send(m)"></textarea>
          <button class="cf-btn cf-btn-primary" (click)="send(m)" [disabled]="!reply().trim()"><span class="material-icons">send</span> Reply</button>
        </div>
      } @else {
        <div class="rd-empty"><span class="re-ic"><span class="material-icons">drafts</span></span><h3>Select a message</h3><p>Choose a conversation on the left to read and reply.</p></div>
      }
    </div>
  </div>
  `,
  styles: [`
    :host{display:block}
    .head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:18px}
    .h-l{display:flex;align-items:center;gap:13px}
    .h-ic{width:46px;height:46px;border-radius:13px;display:grid;place-items:center;flex:none;color:#fff;background:linear-gradient(135deg,var(--cf-brand-500),var(--cf-brand-700));box-shadow:0 8px 18px -8px color-mix(in srgb,var(--cf-brand-600) 75%,transparent)}
    .h-ic .material-icons{font-size:23px}
    .head h1{font-size:23px;font-weight:800;letter-spacing:-.02em;color:var(--cf-ink-900)}
    .head p{font-size:13px;margin-top:2px}
    .cf-btn{display:inline-flex;align-items:center;gap:6px}.cf-btn .material-icons{font-size:17px}

    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}
    @media(max-width:680px){.stats{grid-template-columns:1fr 1fr}}
    .stat{display:flex;align-items:center;gap:12px;padding:13px 15px;border:1px solid var(--cf-line);border-radius:14px;background:var(--cf-surface);cursor:pointer;text-align:start;transition:border-color .15s,box-shadow .15s,transform .12s}
    .stat:hover{transform:translateY(-1px);box-shadow:0 8px 18px -12px rgba(2,6,23,.4)}
    .stat.on{border-color:var(--cf-brand-500);box-shadow:0 0 0 3px color-mix(in srgb,var(--cf-brand-500) 16%,transparent)}
    .s-ic{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex:none}.s-ic .material-icons{font-size:19px}
    .s-ic.in{background:color-mix(in srgb,var(--cf-brand-500) 13%,transparent);color:var(--cf-brand-600)}
    .s-ic.un{background:color-mix(in srgb,#dc2626 12%,transparent);color:#dc2626}
    .s-ic.st{background:color-mix(in srgb,#d9af3e 16%,transparent);color:#b45309}
    .s-ic.ar{background:var(--cf-surface-2);color:var(--cf-ink-500)}
    .s-val{font-size:19px;font-weight:800;color:var(--cf-ink-900);line-height:1}
    .s-lbl{font-size:12px;color:var(--cf-ink-500);margin-top:3px}

    .mc{display:grid;grid-template-columns:354px 1fr;border:1px solid var(--cf-line);border-radius:16px;overflow:hidden;background:var(--cf-surface);min-height:540px;box-shadow:0 1px 2px rgba(15,23,42,.04)}
    .mc-list{border-inline-end:1px solid var(--cf-line);display:flex;flex-direction:column;min-height:0}
    .lsearch{display:flex;align-items:center;gap:8px;padding:11px 13px;border-bottom:1px solid var(--cf-line)}
    .lsearch .material-icons{font-size:18px;color:var(--cf-ink-400)}
    .lsearch input{flex:1;border:0;background:none;outline:none;font:inherit;font-size:13.5px;color:var(--cf-ink-900)}
    .lsearch .clr{border:0;background:none;cursor:pointer;color:var(--cf-ink-400);display:grid;place-items:center}.lsearch .clr .material-icons{font-size:16px}
    .rows{overflow-y:auto;flex:1;max-height:560px}
    .row{position:relative;display:flex;gap:11px;width:100%;text-align:start;padding:13px 14px;border:0;border-bottom:1px solid var(--cf-line);background:none;cursor:pointer;transition:background .14s}
    .row:hover{background:var(--cf-surface-2)}
    .row.sel{background:color-mix(in srgb,var(--cf-brand-500) 8%,transparent)}
    .ava{width:40px;height:40px;border-radius:11px;flex:none;display:grid;place-items:center;color:#fff;font-size:13px;font-weight:800;letter-spacing:.02em}
    .ava.lg{width:46px;height:46px;border-radius:13px;font-size:15px}
    .r-body{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
    .r-top{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
    .r-top b{font-size:13.5px;font-weight:600;color:var(--cf-ink-800);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .row.unread .r-top b{font-weight:800;color:var(--cf-ink-900)}
    .r-time{font-size:11px;color:var(--cf-ink-400);flex:none}
    .r-sub{font-size:12px;font-weight:700;color:var(--cf-brand-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .r-prev{font-size:12.5px;color:var(--cf-ink-500);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .r-marks{display:flex;flex-direction:column;align-items:center;gap:7px;flex:none}
    .r-marks .dot{width:8px;height:8px;border-radius:50%;background:var(--cf-brand-500)}
    .star{font-size:18px;color:var(--cf-ink-300,#cbd5e1);cursor:pointer}.star.on{color:#e6a700}
    .empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:50px 20px;color:var(--cf-ink-400);text-align:center}.empty .material-icons{font-size:34px}.empty p{font-size:13px}

    .mc-reader{display:flex;flex-direction:column;min-height:0}
    .rd-head{display:flex;align-items:center;gap:12px;padding:15px 18px;border-bottom:1px solid var(--cf-line)}
    .mc-back{display:none}
    .rd-who{display:flex;flex-direction:column;min-width:0;flex:1}
    .rd-who b{font-size:15px;font-weight:800;color:var(--cf-ink-900)}
    .rd-mail{font-size:12.5px;color:var(--cf-ink-500);text-decoration:none}.rd-mail:hover{text-decoration:underline}
    .rd-tools{display:flex;gap:4px}
    .ic{width:34px;height:34px;border-radius:9px;border:1px solid transparent;background:none;cursor:pointer;display:grid;place-items:center;color:var(--cf-ink-500);transition:background .14s,color .14s}
    .ic:hover{background:var(--cf-surface-2);color:var(--cf-ink-800)}.ic.on{color:#e6a700}.ic.danger:hover{background:color-mix(in srgb,#dc2626 12%,transparent);color:#dc2626}
    .ic .material-icons{font-size:19px}
    .rd-meta{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:12px 18px;border-bottom:1px solid var(--cf-line);font-size:12.5px;color:var(--cf-ink-500)}
    .rd-meta>span{display:inline-flex;align-items:center;gap:6px}.rd-meta .material-icons{font-size:15px}
    .cred{display:inline-flex;align-items:center;gap:6px;text-decoration:none;color:var(--cf-brand-600);font-weight:700;padding:4px 10px;border-radius:999px;background:color-mix(in srgb,var(--cf-brand-500) 9%,transparent);border:1px solid color-mix(in srgb,var(--cf-brand-500) 22%,transparent)}
    .cred .go{font-size:13px;opacity:.7}
    .rd-scroll{flex:1;overflow-y:auto;padding:20px 18px;display:flex;flex-direction:column;gap:12px;max-height:430px}
    .bubble{max-width:80%;padding:13px 15px;border-radius:15px;font-size:13.5px;line-height:1.6}
    .bubble p{margin:0;white-space:pre-wrap;word-break:break-word}
    .bubble.in{align-self:flex-start;background:var(--cf-surface-2);color:var(--cf-ink-800);border:1px solid var(--cf-line);border-bottom-left-radius:5px}
    .bubble.out{align-self:flex-end;background:linear-gradient(135deg,var(--cf-brand-500),var(--cf-brand-700));color:#fff;border-bottom-right-radius:5px}
    .b-by{display:block;font-size:11px;font-weight:700;opacity:.85;margin-bottom:4px}
    .rd-reply{display:flex;gap:10px;align-items:flex-end;padding:13px 16px;border-top:1px solid var(--cf-line);background:var(--cf-surface-2)}
    .rd-reply textarea{flex:1;border:1px solid var(--cf-line);border-radius:11px;padding:10px 12px;font:inherit;font-size:13.5px;background:var(--cf-surface);color:var(--cf-ink-900);outline:none;resize:vertical;min-height:42px;transition:border-color .14s,box-shadow .14s}
    .rd-reply textarea:focus{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .rd-reply .cf-btn{flex:none}
    .rd-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:40px;text-align:center;color:var(--cf-ink-400)}
    .re-ic{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:var(--cf-surface-2);color:var(--cf-ink-300,#cbd5e1);margin-bottom:4px}.re-ic .material-icons{font-size:30px}
    .rd-empty h3{font-size:16px;color:var(--cf-ink-700)}.rd-empty p{font-size:13px}

    @media(max-width:860px){
      .mc{grid-template-columns:1fr}
      .mc-reader{display:none}
      .mc.has-sel .mc-list{display:none}
      .mc.has-sel .mc-reader{display:flex}
      .mc-back{display:grid}
    }
  `],
})
export class MessagesPage {
  readonly svc = inject(MessageService);
  filter = signal<Filter>('inbox');
  query = signal('');
  selectedId = signal<number | null>(null);
  reply = signal('');

  list = computed(() => {
    const q = this.query().trim().toLowerCase(); const f = this.filter();
    let l = this.svc.items().filter((m) => {
      if (f === 'archived') return m.archived;
      if (m.archived) return false;
      if (f === 'unread') return !m.read;
      if (f === 'starred') return m.starred;
      return true;
    });
    if (q) l = l.filter((m) => (m.from + ' ' + m.email + ' ' + m.body + ' ' + (m.credentialName || '')).toLowerCase().includes(q));
    return [...l].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  });
  selected = computed(() => this.svc.items().find((m) => m.id === this.selectedId()) || null);

  setFilter(f: Filter): void { this.filter.set(f); }
  open(m: CfMessage): void { this.selectedId.set(m.id); if (!m.read) this.svc.markRead(m.id, true); this.reply.set(''); }
  back(): void { this.selectedId.set(null); }
  star(m: CfMessage, ev?: Event): void { ev?.stopPropagation(); this.svc.toggleStar(m.id); }
  markUnread(m: CfMessage): void { this.svc.markRead(m.id, false); }
  archive(m: CfMessage): void { this.svc.setArchived(m.id, !m.archived); if (this.selectedId() === m.id) this.selectedId.set(null); }
  del(m: CfMessage): void { this.svc.remove(m.id); if (this.selectedId() === m.id) this.selectedId.set(null); }
  send(m: CfMessage): void { const b = this.reply().trim(); if (!b) return; this.svc.reply(m.id, b); this.reply.set(''); }

  initials(n: string): string { const p = (n || '?').trim().split(/[\s@._-]+/).filter(Boolean); return (((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase()) || (n || '?').charAt(0).toUpperCase(); }
  tone(n: string): string {
    const colors = ['#6366f1', '#0ea5e9', '#16a34a', '#d97706', '#db2777', '#7c3aed', '#0d9488'];
    let h = 0; for (let i = 0; i < (n || '').length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
    return colors[h % colors.length];
  }
  ago(iso: string): string {
    const s = Math.max(0, (Date.now() - +new Date(iso)) / 1000);
    if (s < 60) return 'now'; if (s < 3600) return Math.floor(s / 60) + 'm';
    if (s < 86400) return Math.floor(s / 3600) + 'h';
    const d = Math.floor(s / 86400); if (d === 1) return 'Yesterday'; if (d < 7) return d + 'd';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  fullDate(iso: string): string { return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
}
