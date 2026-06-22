import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HasActionDirective } from '../../shared/directives/has-action.directive';
import { Actions } from '../../core/constants/actions';
import { AlertService } from '../../core/services/alert.service';

type UStatus = 'Active' | 'Invited' | 'Suspended';
interface AppUser {
  id: number;
  name: string;
  email: string;
  role: string;
  status: UStatus;
  lastActive: string | null;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [DatePipe, FormsModule, HasActionDirective],
  template: `
  <div class="head">
    <div>
      <h1>Users</h1>
      <p class="cf-muted">Invite teammates and control what they can do.</p>
    </div>
    <button class="cf-btn cf-btn-primary" (click)="openInvite()"
            [appHasAction]="A.User_Manage" [tooltipMessage]="'🔒 Managing users isn\\'t in your plan.'">
      <span class="material-icons">person_add</span> Invite user
    </button>
  </div>

  <div class="toolbar card">
    <div class="search"><span class="material-icons">search</span>
      <input [(ngModel)]="search" placeholder="Search name or email…" /></div>
    <span class="count cf-muted">{{ filtered().length }} of {{ users().length }}</span>
  </div>

  <div class="card table-wrap">
    <table class="cf-table">
      <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Last active</th><th class="r">Actions</th></tr></thead>
      <tbody>
        @for (u of filtered(); track u.id) {
          <tr>
            <td><div class="who"><span class="ava">{{ initials(u.name) }}</span>
              <div><strong>{{ u.name }}</strong><small class="cf-muted">{{ u.email }}</small></div></div></td>
            <td>
              <select class="role" [ngModel]="u.role" (ngModelChange)="setRole(u, $event)">
                @for (r of roles; track r) { <option [value]="r">{{ r }}</option> }
              </select>
            </td>
            <td><span class="badge" [class.active]="u.status==='Active'" [class.invited]="u.status==='Invited'" [class.susp]="u.status==='Suspended'">{{ u.status }}</span></td>
            <td>{{ u.lastActive ? (u.lastActive | date: 'mediumDate') : '—' }}</td>
            <td class="r">
              @if (u.status === 'Active') {
                <button class="ic" title="Suspend" (click)="toggle(u)" [appHasAction]="A.User_Manage" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">pause_circle</span></button>
              } @else if (u.status === 'Suspended') {
                <button class="ic" title="Reactivate" (click)="toggle(u)" [appHasAction]="A.User_Manage" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">play_circle</span></button>
              } @else {
                <button class="ic" title="Resend invite" (click)="flash('Invite re-sent to ' + u.email)" [appHasAction]="A.User_Manage" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">forward_to_inbox</span></button>
              }
              <button class="ic danger" title="Remove" (click)="remove(u)" [appHasAction]="A.User_Manage" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">delete</span></button>
            </td>
          </tr>
        }
      </tbody>
    </table>
  </div>

  @if (inviteOpen()) {
    <div class="overlay" (click)="inviteOpen.set(false)">
      <div class="modal" (click)="$event.stopPropagation()">
        <button class="close" (click)="inviteOpen.set(false)"><span class="material-icons">close</span></button>
        <h3>Invite a user</h3>
        <label class="fld">Email address<input [(ngModel)]="inviteEmail" type="email" placeholder="name@company.com" /></label>
        <label class="fld">Role<select [(ngModel)]="inviteRole">@for (r of roles; track r) { <option [value]="r">{{ r }}</option> }</select></label>
        <div class="modal-actions">
          <button class="cf-btn cf-btn-secondary" (click)="inviteOpen.set(false)">Cancel</button>
          <button class="cf-btn cf-btn-primary" [disabled]="!inviteEmail.trim()" (click)="sendInvite()">Send invite</button>
        </div>
      </div>
    </div>
  }

  @if (msg()) { <div class="toast">{{ msg() }}</div> }
  `,
  styles: [`
    :host{display:block}
    .head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:18px}
    .head h1{font-size:22px}
    .cf-btn .material-icons{font-size:18px}
    .toolbar{display:flex;gap:12px;align-items:center;padding:12px 14px;margin-bottom:14px}
    .search{flex:1;display:flex;align-items:center;gap:8px;height:38px;padding:0 12px;border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);background:var(--cf-surface-2)}
    .search .material-icons{font-size:18px;color:var(--cf-ink-400)}
    .search input{flex:1;border:0;background:none;outline:none;font:inherit;font-size:13.5px;color:var(--cf-ink-900)}
    .count{font-size:12.5px;white-space:nowrap}
    .table-wrap{padding:0;overflow:auto}
    table{width:100%;border-collapse:collapse}
    thead th{text-align:start;font-size:11.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--cf-ink-400);padding:12px 14px;border-bottom:1px solid var(--cf-line)}
    th.r,td.r{text-align:end}
    tbody td{padding:11px 14px;border-bottom:1px solid var(--cf-line);font-size:13.5px;color:var(--cf-ink-700);vertical-align:middle}
    tbody tr:last-child td{border-bottom:0}
    tbody tr:hover{background:var(--cf-surface-2)}
    .who{display:flex;align-items:center;gap:10px}
    .who strong{display:block;color:var(--cf-ink-900);font-size:13.5px}
    .who small{font-size:12px}
    .ava{width:34px;height:34px;border-radius:50%;background:var(--cf-brand-50);color:var(--cf-brand-600);display:grid;place-items:center;font-weight:600;font-size:12.5px;flex:none}
    .role{height:32px;border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);background:var(--cf-surface);padding:0 8px;font:inherit;font-size:13px;color:var(--cf-ink-900)}
    .badge{font-size:11.5px;font-weight:600;padding:3px 9px;border-radius:999px}
    .badge.active{background:#dcfce7;color:#15803d}
    .badge.invited{background:var(--cf-brand-50);color:var(--cf-brand-700)}
    .badge.susp{background:#fef3c7;color:#b45309}
    .ic{width:32px;height:32px;border-radius:8px;border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-500);display:inline-grid;place-items:center;cursor:pointer;margin-inline-start:4px}
    .ic:hover{background:var(--cf-surface-2);color:var(--cf-ink-900)}
    .ic.danger:hover{background:var(--cf-danger-soft);color:var(--cf-danger)}
    .ic .material-icons{font-size:17px}
    .overlay{position:fixed;inset:0;background:rgba(2,6,23,.5);display:grid;place-items:center;z-index:60;padding:20px}
    .modal{position:relative;width:100%;max-width:400px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:var(--cf-radius-lg);box-shadow:var(--cf-shadow-lg);padding:22px}
    .modal h3{font-size:17px;margin-bottom:16px}
    .close{position:absolute;top:12px;inset-inline-end:12px;border:0;background:none;color:var(--cf-ink-400);cursor:pointer}
    .fld{display:flex;flex-direction:column;gap:5px;font-size:12.5px;font-weight:500;color:var(--cf-ink-600);margin-bottom:14px}
    .fld input,.fld select{height:40px;border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);padding:0 10px;font:inherit;font-size:14px;background:var(--cf-surface);color:var(--cf-ink-900);outline:none}
    .fld input:focus,.fld select:focus{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:6px}
    .toast{position:fixed;bottom:22px;inset-inline-end:22px;background:var(--cf-ink-900);color:#fff;padding:11px 16px;border-radius:var(--cf-radius-md);box-shadow:var(--cf-shadow-lg);font-size:13.5px;z-index:80}
  `],
})
export class UsersPage {
  readonly A = Actions;
  private alerts = inject(AlertService);
  roles = ['Admin', 'Editor', 'Viewer'];
  search = '';
  msg = signal('');

  inviteOpen = signal(false);
  inviteEmail = '';
  inviteRole = 'Editor';

  private seq = 100;
  users = signal<AppUser[]>([
    { id: 1, name: 'Mostafa Mahmoud', email: 'mostafa.ibrahim@binghatti.com', role: 'Admin', status: 'Active', lastActive: '2026-06-14' },
    { id: 2, name: 'Lina Saeed', email: 'lina.s@example.com', role: 'Editor', status: 'Active', lastActive: '2026-06-13' },
    { id: 3, name: 'Karim Adel', email: 'karim.a@example.com', role: 'Editor', status: 'Suspended', lastActive: '2026-05-30' },
    { id: 4, name: 'Nour Tarek', email: 'nour.t@example.com', role: 'Viewer', status: 'Active', lastActive: '2026-06-11' },
    { id: 5, name: 'Hana Yousef', email: 'hana.y@example.com', role: 'Viewer', status: 'Invited', lastActive: null },
  ]);

  filtered = computed(() => {
    const q = this.search.trim().toLowerCase();
    return this.users().filter((u) => !q || (u.name + ' ' + u.email).toLowerCase().includes(q));
  });

  initials(n: string): string { return n.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase(); }

  setRole(u: AppUser, role: string): void {
    this.users.update((l) => l.map((x) => (x.id === u.id ? { ...x, role } : x)));
  }
  toggle(u: AppUser): void {
    const status: UStatus = u.status === 'Active' ? 'Suspended' : 'Active';
    this.users.update((l) => l.map((x) => (x.id === u.id ? { ...x, status } : x)));
  }
  async remove(u: AppUser): Promise<void> {
    const ok = await this.alerts.confirm({ title: 'Remove user', message: 'Remove ' + u.name + ' from the workspace?', danger: true, confirmText: 'Remove' });
    if (!ok) return;
    this.users.update((l) => l.filter((x) => x.id !== u.id));
    this.alerts.success(u.name + ' removed.');
  }

  openInvite(): void { this.inviteEmail = ''; this.inviteRole = 'Editor'; this.inviteOpen.set(true); }
  sendInvite(): void {
    const email = this.inviteEmail.trim();
    if (!email) return;
    const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
    this.users.update((l) => [...l, { id: ++this.seq, name, email, role: this.inviteRole, status: 'Invited', lastActive: null }]);
    this.inviteOpen.set(false);
    this.flash('Invitation sent to ' + email);
  }

  flash(text: string): void { this.alerts.success(text); }
}
