import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HasActionDirective } from '../../shared/directives/has-action.directive';
import { Actions } from '../../core/constants/actions';
import { AlertService } from '../../core/services/alert.service';

type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';
interface Approval {
  id: number;
  recipient: string;
  email: string;
  item: string;
  type: 'Credential' | 'Batch' | 'Template';
  requestedBy: string;
  requestedAt: string;
  note?: string;
  count?: number;
  status: ApprovalStatus;
  decidedBy?: string | null;
  decidedAt?: string | null;
  reason?: string | null;
}

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [DatePipe, LowerCasePipe, FormsModule, HasActionDirective],
  template: `
  <div class="head">
    <div>
      <h1>Approvals</h1>
      <p class="cf-muted">Review credentials and workflow steps that are waiting on you.</p>
    </div>
    @if (tab() === 'Pending' && count('Pending') > 1) {
      <button class="cf-btn cf-btn-primary" (click)="approveAll()"
              [appHasAction]="A.Credential_Approve" [tooltipMessage]="'🔒 Approving isn\\'t in your plan.'">
        <span class="material-icons">done_all</span> Approve all
      </button>
    }
  </div>

  <div class="tabs">
    @for (t of tabs; track t) {
      <button [class.on]="tab() === t" (click)="tab.set(t)">{{ t }} <span class="cnt">{{ count(t) }}</span></button>
    }
  </div>

  @if (filtered().length === 0) {
    <div class="state">
      <span class="material-icons">{{ tab() === 'Pending' ? 'task_alt' : 'inbox' }}</span>
      <h3>{{ tab() === 'Pending' ? 'You are all caught up' : 'Nothing here' }}</h3>
      <p class="cf-muted">No {{ tab().toLowerCase() }} items right now.</p>
    </div>
  } @else {
    <div class="rows">
      @for (a of filtered(); track a.id) {
        <div class="card row">
          <span class="ava">{{ initials(a.recipient) }}</span>
          <div class="info">
            <div class="top"><strong>{{ a.recipient }}</strong><span class="cf-badge">{{ a.type }}</span></div>
            <div class="sub cf-muted">{{ a.item }}@if (a.count) { · {{ a.count }} recipients } · requested by {{ a.requestedBy }} · {{ a.requestedAt | date: 'mediumDate' }}</div>
            @if (a.note) { <div class="note"><span class="material-icons">sticky_note_2</span> {{ a.note }}</div> }
            @if (a.status === 'Rejected' && a.reason) { <div class="note rej"><span class="material-icons">block</span> {{ a.reason }}</div> }
          </div>
          <div class="act">
            @if (a.status === 'Pending') {
              <button class="cf-btn cf-btn-secondary sm rejbtn" (click)="openReject(a)"
                      [appHasAction]="A.Credential_Approve" [tooltipMessage]="'🔒 Not in your plan.'">Reject</button>
              <button class="cf-btn cf-btn-primary sm" (click)="approve(a)"
                      [appHasAction]="A.Credential_Approve" [tooltipMessage]="'🔒 Not in your plan.'">Approve</button>
            } @else {
              <span class="badge" [class.ok]="a.status === 'Approved'" [class.no]="a.status === 'Rejected'">{{ a.status }}</span>
              <small class="cf-muted">{{ a.decidedBy }} · {{ a.decidedAt | date: 'mediumDate' }}</small>
            }
          </div>
        </div>
      }
    </div>
  }

  @if (rejectTarget(); as a) {
    <div class="overlay" (click)="rejectTarget.set(null)">
      <div class="modal" (click)="$event.stopPropagation()">
        <button class="close" (click)="rejectTarget.set(null)"><span class="material-icons">close</span></button>
        <h3>Reject approval</h3>
        <p class="cf-muted">Rejecting the {{ a.type | lowercase }} for <strong>{{ a.recipient }}</strong>.</p>
        <label class="fld">Reason (optional)<textarea [(ngModel)]="rejectReason" rows="3" placeholder="Let the requester know what to fix…"></textarea></label>
        <div class="modal-actions">
          <button class="cf-btn cf-btn-secondary" (click)="rejectTarget.set(null)">Cancel</button>
          <button class="cf-btn rej-confirm" (click)="submitReject()">Reject</button>
        </div>
      </div>
    </div>
  }
  `,
  styles: [`
    :host{display:block}
    .head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px}
    .head h1{font-size:22px}
    .cf-btn .material-icons{font-size:18px}
    .tabs{display:flex;gap:6px;margin-bottom:16px;border-bottom:1px solid var(--cf-line)}
    .tabs button{display:flex;align-items:center;gap:7px;padding:9px 14px;border:0;background:none;color:var(--cf-ink-500);font:inherit;font-size:13.5px;font-weight:600;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}
    .tabs button:hover{color:var(--cf-ink-900)}
    .tabs button.on{color:var(--cf-brand-700);border-bottom-color:var(--cf-brand-600)}
    .tabs .cnt{min-width:20px;height:20px;padding:0 6px;display:inline-grid;place-items:center;font-size:11px;border-radius:999px;background:var(--cf-surface-2);color:var(--cf-ink-600)}
    .tabs button.on .cnt{background:var(--cf-brand-600);color:#fff}
    .rows{display:flex;flex-direction:column;gap:12px}
    .row{display:flex;align-items:center;gap:14px;padding:15px 16px}
    .ava{width:40px;height:40px;border-radius:50%;background:var(--cf-brand-50);color:var(--cf-brand-600);display:grid;place-items:center;font-weight:600;font-size:14px;flex:none}
    .info{flex:1;min-width:0}
    .top{display:flex;align-items:center;gap:9px}
    .top strong{font-size:14.5px;color:var(--cf-ink-900)}
    .sub{font-size:12.5px;margin-top:2px}
    .note{display:flex;align-items:flex-start;gap:7px;margin-top:9px;padding:8px 11px;background:var(--cf-surface-2);border-radius:var(--cf-radius-sm);font-size:12.5px;color:var(--cf-ink-700)}
    .note .material-icons{font-size:16px;color:var(--cf-ink-400)}
    .note.rej{background:var(--cf-danger-soft);color:var(--cf-danger)}
    .note.rej .material-icons{color:var(--cf-danger)}
    .act{display:flex;align-items:center;gap:8px;flex:none}
    .cf-btn.sm{padding:7px 14px;font-size:13px}
    .rejbtn:hover{color:var(--cf-danger);border-color:color-mix(in srgb,var(--cf-danger) 30%,transparent);background:var(--cf-danger-soft)}
    .act .badge{font-size:11.5px;font-weight:600;padding:4px 10px;border-radius:999px}
    .act .badge.ok{background:#dcfce7;color:#15803d}
    .act .badge.no{background:var(--cf-danger-soft);color:var(--cf-danger)}
    .act small{font-size:11.5px}
    .state{max-width:420px;margin:9vh auto;text-align:center;color:var(--cf-ink-600)}
    .state .material-icons{font-size:44px;color:var(--cf-brand-500)}
    .state h3{margin:10px 0 4px;color:var(--cf-ink-900)}
    .overlay{position:fixed;inset:0;background:rgba(2,6,23,.5);display:grid;place-items:center;z-index:60;padding:20px}
    .modal{position:relative;width:100%;max-width:420px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:var(--cf-radius-lg);box-shadow:var(--cf-shadow-lg);padding:22px}
    .modal h3{font-size:17px;margin-bottom:4px}
    .modal>p{font-size:13px;margin-bottom:14px}
    .close{position:absolute;top:12px;inset-inline-end:12px;border:0;background:none;color:var(--cf-ink-400);cursor:pointer}
    .fld{display:flex;flex-direction:column;gap:5px;font-size:12.5px;font-weight:500;color:var(--cf-ink-600)}
    .fld textarea{border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);padding:9px 10px;font:inherit;font-size:14px;background:var(--cf-surface);color:var(--cf-ink-900);outline:none;resize:vertical}
    .fld textarea:focus{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}
    .rej-confirm{background:var(--cf-danger);border-color:var(--cf-danger);color:#fff}
    .rej-confirm:hover{filter:brightness(.94)}
    @media(max-width:680px){.row{flex-wrap:wrap}.act{width:100%;justify-content:flex-end}}
  `],
})
export class ApprovalsPage {
  readonly A = Actions;
  private alerts = inject(AlertService);

  tabs: ApprovalStatus[] = ['Pending', 'Approved', 'Rejected'];
  tab = signal<ApprovalStatus>('Pending');

  rejectTarget = signal<Approval | null>(null);
  rejectReason = '';

  items = signal<Approval[]>([
    { id: 1, recipient: 'Layla Hassan', email: 'layla.h@example.com', item: 'Excellence Award', type: 'Credential', requestedBy: 'Lina Saeed', requestedAt: '2026-06-13', note: 'Check the recipient name and award title are correct.', status: 'Pending' },
    { id: 2, recipient: 'Workshop — June cohort', email: '', item: 'Workshop Attendance', type: 'Batch', requestedBy: 'Automation', requestedAt: '2026-06-12', note: 'Generated by "Approve awards before sending".', count: 38, status: 'Pending' },
    { id: 3, recipient: 'Aisha Noor', email: 'aisha.n@example.com', item: 'Completion Certificate', type: 'Credential', requestedBy: 'Karim Adel', requestedAt: '2026-06-13', status: 'Pending' },
    { id: 4, recipient: 'Omar Khalil', email: 'omar.k@example.com', item: 'Completion Certificate', type: 'Credential', requestedBy: 'Lina Saeed', requestedAt: '2026-06-09', status: 'Approved', decidedBy: 'You', decidedAt: '2026-06-10' },
    { id: 5, recipient: 'Mariam Fawzy', email: 'mariam.f@example.com', item: 'Excellence Award', type: 'Credential', requestedBy: 'Karim Adel', requestedAt: '2026-05-18', status: 'Rejected', decidedBy: 'You', decidedAt: '2026-05-19', reason: 'Name misspelled — please correct and resubmit.' },
  ]);

  filtered = computed(() => this.items().filter((a) => a.status === this.tab()));
  count(s: ApprovalStatus): number { return this.items().filter((a) => a.status === s).length; }
  initials(n: string): string { return n.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase(); }

  approve(a: Approval): void {
    this.decide(a.id, 'Approved');
    this.alerts.success('Approved — ' + a.recipient + '.');
  }

  async approveAll(): Promise<void> {
    const n = this.count('Pending');
    const ok = await this.alerts.confirm({ title: 'Approve all', message: 'Approve all ' + n + ' pending item' + (n === 1 ? '' : 's') + '?', confirmText: 'Approve all' });
    if (!ok) return;
    const now = new Date().toISOString();
    this.items.update((l) => l.map((a) => (a.status === 'Pending' ? { ...a, status: 'Approved' as ApprovalStatus, decidedBy: 'You', decidedAt: now } : a)));
    this.alerts.success(n + ' approved.');
  }

  openReject(a: Approval): void { this.rejectReason = ''; this.rejectTarget.set(a); }
  submitReject(): void {
    const a = this.rejectTarget();
    if (!a) return;
    this.decide(a.id, 'Rejected', this.rejectReason.trim() || null);
    this.rejectTarget.set(null);
    this.alerts.info('Rejected — ' + a.recipient + '.');
  }

  private decide(id: number, status: ApprovalStatus, reason: string | null = null): void {
    const now = new Date().toISOString();
    this.items.update((l) => l.map((a) => (a.id === id ? { ...a, status, decidedBy: 'You', decidedAt: now, reason } : a)));
  }
}
