import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HasActionDirective } from '../../shared/directives/has-action.directive';
import { Actions } from '../../core/constants/actions';
import { AlertService } from '../../core/services/alert.service';

type CredStatus = 'Issued' | 'Pending' | 'Revoked';
interface Credential {
  id: number;
  recipient: string;
  email: string;
  template: string;
  status: CredStatus;
  batch: string | null;
  issuedAt: string;
}

@Component({
  selector: 'app-credentials',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, HasActionDirective],
  template: `
  <div class="head">
    <div>
      <h1>Credentials</h1>
      <p class="cf-muted">Every certificate you've issued — search, download, or revoke.</p>
    </div>
    <a class="cf-btn cf-btn-primary" routerLink="/app/templates"
       [appHasAction]="A.Credential_Generate" [tooltipMessage]="'🔒 Generating credentials isn\\'t in your plan.'">
      <span class="material-icons">add</span> Generate
    </a>
  </div>

  <div class="stats">
    <div class="card quota">
      <div class="qrow"><span>Monthly usage</span><strong>{{ quota().created }} / {{ quota().limit }}</strong></div>
      <div class="bar"><div class="fill" [style.width.%]="quotaPct()" [class.warn]="quotaPct() > 85"></div></div>
      <small class="cf-muted">{{ quota().limit - quota().created }} credentials left this month</small>
    </div>
    <div class="card mini"><span class="material-icons ok">verified</span><div><strong>{{ count('Issued') }}</strong><small class="cf-muted">Issued</small></div></div>
    <div class="card mini"><span class="material-icons pend">schedule</span><div><strong>{{ count('Pending') }}</strong><small class="cf-muted">Pending</small></div></div>
    <div class="card mini"><span class="material-icons rev">block</span><div><strong>{{ count('Revoked') }}</strong><small class="cf-muted">Revoked</small></div></div>
  </div>

  <div class="toolbar card">
    <div class="search"><span class="material-icons">search</span>
      <input [(ngModel)]="search" placeholder="Search recipient, email or template…" /></div>
    <select [(ngModel)]="statusFilter">
      <option value="">All statuses</option>
      <option value="Issued">Issued</option>
      <option value="Pending">Pending</option>
      <option value="Revoked">Revoked</option>
    </select>
  </div>

  @if (filtered().length === 0) {
    <div class="state"><span class="material-icons">workspace_premium</span><h3>No credentials found</h3>
      <p class="cf-muted">Try a different search, or generate your first credential from a template.</p></div>
  } @else {
    <div class="card table-wrap">
      <table class="cf-table">
        <thead><tr><th>Recipient</th><th>Template</th><th>Issued</th><th>Status</th><th class="r">Actions</th></tr></thead>
        <tbody>
          @for (c of filtered(); track c.id) {
            <tr>
              <td>
                <div class="who"><span class="ava">{{ initials(c.recipient) }}</span>
                  <div><strong>{{ c.recipient }}</strong><small class="cf-muted">{{ c.email }}</small></div></div>
              </td>
              <td>{{ c.template }}@if (c.batch) { <span class="cf-badge">{{ c.batch }}</span> }</td>
              <td>{{ c.issuedAt | date: 'mediumDate' }}</td>
              <td><span class="badge" [class.issued]="c.status==='Issued'" [class.pending]="c.status==='Pending'" [class.revoked]="c.status==='Revoked'">{{ c.status }}</span></td>
              <td class="r">
                <button class="ic" title="Download" (click)="flash('Download started for ' + c.recipient)"><span class="material-icons">download</span></button>
                <button class="ic" title="Resend" (click)="flash('Re-sent to ' + c.email)"><span class="material-icons">forward_to_inbox</span></button>
                <button class="ic danger" title="Revoke" [disabled]="c.status==='Revoked'" (click)="revoke(c)"
                        [appHasAction]="A.Credential_Approve" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">block</span></button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  }

  @if (msg()) { <div class="toast">{{ msg() }}</div> }
  `,
  styles: [`
    :host{display:block}
    .head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:18px}
    .head h1{font-size:22px}
    .cf-btn .material-icons{font-size:18px}
    .stats{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:14px;margin-bottom:16px}
    .quota{padding:16px}
    .qrow{display:flex;justify-content:space-between;align-items:baseline;font-size:13px;color:var(--cf-ink-600)}
    .qrow strong{font-size:16px;color:var(--cf-ink-900)}
    .bar{height:8px;border-radius:999px;background:var(--cf-surface-2);margin:8px 0 6px;overflow:hidden}
    .fill{height:100%;border-radius:999px;background:var(--cf-brand-600);transition:width .3s}
    .fill.warn{background:#f59e0b}
    .mini{display:flex;align-items:center;gap:12px;padding:14px 16px}
    .mini .material-icons{font-size:26px}.mini .ok{color:#16a34a}.mini .pend{color:#f59e0b}.mini .rev{color:var(--cf-danger)}
    .mini strong{display:block;font-size:18px;color:var(--cf-ink-900)}
    .toolbar{display:flex;gap:10px;align-items:center;padding:12px 14px;margin-bottom:14px}
    .search{flex:1;display:flex;align-items:center;gap:8px;height:38px;padding:0 12px;border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);background:var(--cf-surface-2)}
    .search .material-icons{font-size:18px;color:var(--cf-ink-400)}
    .search input{flex:1;border:0;background:none;outline:none;font:inherit;font-size:13.5px;color:var(--cf-ink-900)}
    .toolbar select{height:38px;border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);background:var(--cf-surface);padding:0 10px;font:inherit;font-size:13.5px;color:var(--cf-ink-900)}
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
    td .cf-badge{margin-inline-start:8px}
    .badge{font-size:11.5px;font-weight:600;padding:3px 9px;border-radius:999px}
    .badge.issued{background:#dcfce7;color:#15803d}
    .badge.pending{background:#fef3c7;color:#b45309}
    .badge.revoked{background:var(--cf-danger-soft);color:var(--cf-danger)}
    .ic{width:32px;height:32px;border-radius:8px;border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-500);display:inline-grid;place-items:center;cursor:pointer;margin-inline-start:4px}
    .ic:hover{background:var(--cf-surface-2);color:var(--cf-ink-900)}
    .ic:disabled{opacity:.4;cursor:default}
    .ic.danger:hover{background:var(--cf-danger-soft);color:var(--cf-danger)}
    .ic .material-icons{font-size:17px}
    .state{max-width:420px;margin:8vh auto;text-align:center;color:var(--cf-ink-600)}
    .state .material-icons{font-size:42px;color:var(--cf-brand-500)}
    .state h3{margin:10px 0 4px;color:var(--cf-ink-900)}
    .toast{position:fixed;bottom:22px;inset-inline-end:22px;background:var(--cf-ink-900);color:#fff;padding:11px 16px;border-radius:var(--cf-radius-md);box-shadow:var(--cf-shadow-lg);font-size:13.5px;z-index:80}
    @media(max-width:760px){.stats{grid-template-columns:1fr 1fr}}
  `],
})
export class CredentialsPage {
  readonly A = Actions;
  private alerts = inject(AlertService);
  search = '';
  statusFilter = '';
  msg = signal('');

  items = signal<Credential[]>([
    { id: 1, recipient: 'Sara Al-Mansoori', email: 'sara.m@example.com', template: 'Completion Certificate', status: 'Issued', batch: 'Batch #A12', issuedAt: '2026-06-10' },
    { id: 2, recipient: 'Omar Khalil', email: 'omar.k@example.com', template: 'Completion Certificate', status: 'Issued', batch: 'Batch #A12', issuedAt: '2026-06-10' },
    { id: 3, recipient: 'Layla Hassan', email: 'layla.h@example.com', template: 'Excellence Award', status: 'Pending', batch: null, issuedAt: '2026-06-12' },
    { id: 4, recipient: 'James Carter', email: 'j.carter@example.com', template: 'Workshop Attendance', status: 'Issued', batch: 'Batch #B03', issuedAt: '2026-05-28' },
    { id: 5, recipient: 'Mariam Fawzy', email: 'mariam.f@example.com', template: 'Excellence Award', status: 'Revoked', batch: null, issuedAt: '2026-05-19' },
    { id: 6, recipient: 'Daniel Reyes', email: 'd.reyes@example.com', template: 'Workshop Attendance', status: 'Issued', batch: 'Batch #B03', issuedAt: '2026-05-28' },
    { id: 7, recipient: 'Aisha Noor', email: 'aisha.n@example.com', template: 'Completion Certificate', status: 'Pending', batch: null, issuedAt: '2026-06-13' },
  ]);
  quota = signal({ created: 4, limit: 50 });

  filtered = computed(() => {
    const q = this.search.trim().toLowerCase();
    const s = this.statusFilter;
    return this.items().filter((c) =>
      (!s || c.status === s) &&
      (!q || (c.recipient + ' ' + c.email + ' ' + c.template).toLowerCase().includes(q)));
  });
  quotaPct = computed(() => Math.min(100, Math.round((this.quota().created / this.quota().limit) * 100)));
  count(s: CredStatus): number { return this.items().filter((c) => c.status === s).length; }

  initials(n: string): string { return n.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase(); }

  async revoke(c: Credential): Promise<void> {
    const ok = await this.alerts.confirm({ title: 'Revoke credential', message: 'Revoke the credential issued to ' + c.recipient + '?', danger: true, confirmText: 'Revoke' });
    if (!ok) return;
    this.items.update((l) => l.map((x) => (x.id === c.id ? { ...x, status: 'Revoked' as CredStatus } : x)));
    this.alerts.success('Credential revoked.');
  }

  flash(text: string): void { this.alerts.info(text); }
}
