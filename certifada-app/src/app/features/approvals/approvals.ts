import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HasActionDirective } from '../../shared/directives/has-action.directive';
import { Actions } from '../../core/constants/actions';
import { AlertService } from '../../core/services/alert.service';
import { ApprovalService, Approval, ApprovalStatus, ApprovalType } from '../../core/services/approval.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [DatePipe, LowerCasePipe, FormsModule, HasActionDirective],
  template: `
  <div class="head">
    <div>
      <h1>Approvals</h1>
      <p class="cf-muted">Review credentials and workflow steps that are waiting on your team.</p>
    </div>
    @if (tab() === 'Pending' && svc.pendingCount() > 1) {
      <button class="cf-btn cf-btn-primary" (click)="approveAll()"
              [appHasAction]="A.Credential_Approve" [tooltipMessage]="'🔒 Approving isn\\'t in your plan.'">
        <span class="material-icons">done_all</span> Approve all ({{ svc.pendingCount() }})
      </button>
    }
  </div>

  <!-- ===================== STAT STRIP ===================== -->
  <div class="stats">
    <div class="stat pend" [class.live]="svc.pendingCount() > 0">
      <div class="s-ic"><span class="material-icons">hourglass_top</span></div>
      <div><div class="s-val">{{ svc.countOf('Pending') }}</div><div class="s-lbl">Awaiting you</div></div>
    </div>
    <div class="stat ok"><div class="s-ic"><span class="material-icons">task_alt</span></div><div><div class="s-val">{{ svc.countOf('Approved') }}</div><div class="s-lbl">Approved</div></div></div>
    <div class="stat no"><div class="s-ic"><span class="material-icons">block</span></div><div><div class="s-val">{{ svc.countOf('Rejected') }}</div><div class="s-lbl">Rejected</div></div></div>
    <div class="stat wait" [class.warn]="svc.oldestPendingDays() >= 3">
      <div class="s-ic"><span class="material-icons">schedule</span></div>
      <div><div class="s-val">{{ svc.oldestPendingDays() }}<small>d</small></div><div class="s-lbl">Oldest waiting</div></div>
    </div>
  </div>

  <!-- ===================== TOOLBAR ===================== -->
  <div class="toolbar">
    <div class="tabs">
      @for (t of tabs; track t) {
        <button [class.on]="tab() === t" (click)="tab.set(t); clearSel()">{{ t }} <span class="cnt">{{ svc.countOf(t) }}</span></button>
      }
    </div>
    <div class="t-right">
      <div class="search"><span class="material-icons">search</span><input [value]="query()" (input)="query.set($any($event.target).value)" placeholder="Search recipient, item, requester…" />@if (query()) { <button class="clr" (click)="query.set('')"><span class="material-icons">close</span></button> }</div>
      <div class="chips">
        @for (f of typeFilters; track f) { <button [class.on]="typeFilter() === f" (click)="typeFilter.set(f)">{{ f }}</button> }
      </div>
    </div>
  </div>

  <!-- ===================== BULK BAR ===================== -->
  @if (tab() === 'Pending' && selCount() > 0) {
    <div class="bulkbar">
      <span class="bb-tx"><b>{{ selCount() }}</b> selected</span>
      <button class="cf-btn cf-btn-primary sm" (click)="approveSelected()" [appHasAction]="A.Credential_Approve" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">done_all</span> Approve selected</button>
      <button class="bb-clear" (click)="clearSel()">Clear</button>
    </div>
  }

  @if (filtered().length === 0) {
    <div class="state">
      <div class="st-badge" [class.done]="tab() === 'Pending'"><span class="material-icons">{{ tab() === 'Pending' ? 'task_alt' : 'inbox' }}</span></div>
      <h3>{{ tab() === 'Pending' ? 'You’re all caught up' : 'Nothing here' }}</h3>
      <p class="cf-muted">{{ query() || typeFilter() !== 'All' ? 'No items match your search or filter.' : 'No ' + tab().toLowerCase() + ' items right now.' }}</p>
    </div>
  } @else {
    @if (tab() === 'Pending') {
      <label class="selectall"><input type="checkbox" [checked]="allSel()" (change)="toggleAll()" /><span></span> Select all {{ filtered().length }}</label>
    }
    <div class="rows">
      @for (a of filtered(); track a.id) {
        <div class="card row" [class.sel]="isSel(a.id)" [class.urgent]="a.status === 'Pending' && ageDays(a) >= 7">
          @if (a.status === 'Pending') {
            <label class="cbx" (click)="$event.stopPropagation()"><input type="checkbox" [checked]="isSel(a.id)" (change)="toggleSel(a.id)" /><span></span></label>
          }
          <span class="ava" [class]="'t-' + a.type.toLowerCase()"><span class="material-icons">{{ typeIcon(a.type) }}</span></span>
          <div class="info">
            <div class="top">
              <strong>{{ a.recipient }}</strong>
              <span class="tchip" [class]="'t-' + a.type.toLowerCase()">{{ a.type }}</span>
              @if (a.count) { <span class="ncount"><span class="material-icons">groups</span>{{ a.count }}</span> }
              @if (a.status === 'Pending') { <span class="age" [class.warn]="ageDays(a) >= 3" [class.old]="ageDays(a) >= 7"><span class="material-icons">schedule</span>{{ ageLabel(a) }}</span> }
            </div>
            <div class="sub cf-muted">{{ a.item }} · requested by <b>{{ a.requestedBy }}</b> · {{ a.requestedAt | date: 'mediumDate' }}</div>
            @if (a.note) { <div class="note"><span class="material-icons">sticky_note_2</span> {{ a.note }}</div> }
            @if (a.status === 'Rejected' && a.reason) { <div class="note rej"><span class="material-icons">block</span> {{ a.reason }}</div> }
          </div>
          <div class="act">
            <button class="iconbtn" (click)="openView(a)" title="View details"><span class="material-icons">visibility</span></button>
            @if (a.status === 'Pending') {
              <button class="cf-btn cf-btn-secondary sm rejbtn" (click)="openReject(a)" [appHasAction]="A.Credential_Approve" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">close</span> Reject</button>
              <button class="cf-btn cf-btn-primary sm" (click)="approve(a)" [appHasAction]="A.Credential_Approve" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">check</span> Approve</button>
            } @else {
              <span class="badge" [class.ok]="a.status === 'Approved'" [class.no]="a.status === 'Rejected'"><span class="material-icons">{{ a.status === 'Approved' ? 'check_circle' : 'cancel' }}</span>{{ a.status }}</span>
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
          <button class="cf-btn rej-confirm" (click)="submitReject()"><span class="material-icons">block</span> Reject</button>
        </div>
      </div>
    </div>
  }

  @if (viewTarget(); as a) {
    <div class="overlay" (click)="closeView()">
      <div class="vmodal" (click)="$event.stopPropagation()">
        <button class="close" (click)="closeView()"><span class="material-icons">close</span></button>
        <div class="vm-grid">
          <div class="vm-cert">
            <div class="cert-mock">
              <span class="cm-seal"><span class="material-icons">workspace_premium</span></span>
              <span class="cm-eyebrow">CERTIFICATE</span>
              <span class="cm-title">{{ a.item }}</span>
              <span class="cm-pres">This is proudly presented to</span>
              <span class="cm-name">{{ a.recipient }}</span>
              <span class="cm-rule"></span>
              @if (a.count) { <span class="cm-batch"><span class="material-icons">groups</span> {{ a.count }} recipients in this batch</span> }
            </div>
          </div>
          <div class="vm-body">
            <div class="vm-head">
              <span class="tchip" [class]="'t-' + a.type.toLowerCase()">{{ a.type }}</span>
              @if (a.status === 'Pending') { <span class="age" [class.warn]="ageDays(a) >= 3" [class.old]="ageDays(a) >= 7"><span class="material-icons">schedule</span>{{ ageLabel(a) }} waiting</span> }
              @else { <span class="badge" [class.ok]="a.status === 'Approved'" [class.no]="a.status === 'Rejected'"><span class="material-icons">{{ a.status === 'Approved' ? 'check_circle' : 'cancel' }}</span>{{ a.status }}</span> }
            </div>
            <h3>{{ a.recipient }}</h3>
            <div class="vm-meta">
              @if (a.email) { <div><span class="material-icons">mail</span> {{ a.email }}</div> }
              <div><span class="material-icons">workspace_premium</span> {{ a.item }}</div>
              <div><span class="material-icons">person</span> Requested by {{ a.requestedBy }}</div>
              <div><span class="material-icons">event</span> {{ a.requestedAt | date: 'medium' }}</div>
            </div>
            @if (a.note) { <div class="note"><span class="material-icons">sticky_note_2</span> {{ a.note }}</div> }
            @if (a.status === 'Rejected' && a.reason) { <div class="note rej"><span class="material-icons">block</span> {{ a.reason }}</div> }
            @if (a.status === 'Pending') {
              <div class="signbox">
                <span class="sb-lbl">Sign as approver</span>
                <span class="sb-sign">{{ approver() }}</span>
                <span class="sb-name cf-muted">{{ approver() }} · {{ today() }}</span>
              </div>
              <div class="vm-actions">
                <button class="cf-btn cf-btn-secondary rejbtn" (click)="rejectFromView(a)" [appHasAction]="A.Credential_Approve" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">close</span> Reject</button>
                <button class="cf-btn cf-btn-primary" (click)="signApprove(a)" [appHasAction]="A.Credential_Approve" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">draw</span> Sign &amp; Approve Now</button>
              </div>
            } @else {
              <div class="vm-decided"><span class="material-icons">{{ a.status === 'Approved' ? 'verified' : 'cancel' }}</span> {{ a.status }} by {{ a.decidedBy }} · {{ a.decidedAt | date: 'mediumDate' }}</div>
            }
          </div>
        </div>
      </div>
    </div>
  }
  `,
  styles: [`
    :host{display:block}
    .head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px}
    .head h1{font-size:22px;font-weight:800;letter-spacing:-.02em}
    .cf-btn .material-icons{font-size:18px}

    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}
    @media(max-width:680px){.stats{grid-template-columns:1fr 1fr}}
    .stat{display:flex;align-items:center;gap:12px;padding:14px 16px;border:1px solid var(--cf-line);border-radius:14px;background:var(--cf-surface);box-shadow:0 1px 2px rgba(15,23,42,.04)}
    .s-ic{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;flex:none}.s-ic .material-icons{font-size:20px}
    .stat.pend .s-ic{background:var(--cf-warning-soft);color:var(--cf-warning)}
    .stat.pend.live{border-color:color-mix(in srgb,var(--cf-warning) 40%,var(--cf-line));box-shadow:0 8px 20px -14px var(--cf-warning)}
    .stat.ok .s-ic{background:#dcfce7;color:#15803d}
    .stat.no .s-ic{background:var(--cf-danger-soft);color:var(--cf-danger)}
    .stat.wait .s-ic{background:var(--cf-brand-50);color:var(--cf-brand-600)}
    .stat.wait.warn .s-ic{background:var(--cf-danger-soft);color:var(--cf-danger)}
    .s-val{font-size:22px;font-weight:800;letter-spacing:-.02em;color:var(--cf-ink-900);line-height:1}.s-val small{font-size:13px;font-weight:700;color:var(--cf-ink-400)}
    .s-lbl{font-size:12px;color:var(--cf-ink-500);margin-top:3px}

    .toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:14px;border-bottom:1px solid var(--cf-line)}
    .tabs{display:flex;gap:4px}
    .tabs button{display:flex;align-items:center;gap:7px;padding:9px 14px;border:0;background:none;color:var(--cf-ink-500);font:inherit;font-size:13.5px;font-weight:600;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}
    .tabs button:hover{color:var(--cf-ink-900)}
    .tabs button.on{color:var(--cf-brand-700);border-bottom-color:var(--cf-brand-600)}
    .tabs .cnt{min-width:20px;height:20px;padding:0 6px;display:inline-grid;place-items:center;font-size:11px;border-radius:999px;background:var(--cf-surface-2);color:var(--cf-ink-600)}
    .tabs button.on .cnt{background:var(--cf-brand-600);color:#fff}
    .t-right{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding-bottom:8px}
    .search{display:flex;align-items:center;gap:7px;height:36px;padding:0 11px;border:1px solid var(--cf-line);border-radius:10px;background:var(--cf-surface);min-width:210px;transition:border-color .14s,box-shadow .14s}
    .search:focus-within{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .search .material-icons{font-size:18px;color:var(--cf-ink-400)}
    .search input{border:0;background:none;outline:none;font:inherit;font-size:13px;color:var(--cf-ink-900);flex:1;min-width:0}
    .clr{border:0;background:none;color:var(--cf-ink-400);cursor:pointer;display:grid;place-items:center}.clr .material-icons{font-size:16px}
    .chips{display:inline-flex;gap:3px;padding:3px;background:var(--cf-surface-2);border:1px solid var(--cf-line);border-radius:10px}
    .chips button{border:0;background:none;color:var(--cf-ink-600);font:inherit;font-size:12px;font-weight:600;padding:6px 11px;border-radius:7px;cursor:pointer}
    .chips button.on{background:var(--cf-surface);color:var(--cf-brand-700);box-shadow:var(--cf-shadow-sm)}

    .bulkbar{display:flex;align-items:center;gap:12px;padding:10px 14px;margin-bottom:12px;border:1px solid var(--cf-brand-200);background:var(--cf-brand-50);border-radius:12px;animation:bbIn .2s ease}
    @keyframes bbIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}
    .bb-tx{font-size:13px;color:var(--cf-ink-700)}.bb-tx b{color:var(--cf-brand-700)}
    .cf-btn.sm{padding:7px 12px;font-size:12.5px}
    .bb-clear{margin-inline-start:auto;border:0;background:none;color:var(--cf-ink-500);font:inherit;font-size:12.5px;font-weight:600;cursor:pointer}
    .bb-clear:hover{color:var(--cf-ink-900)}

    .selectall{display:inline-flex;align-items:center;gap:9px;font-size:12.5px;font-weight:600;color:var(--cf-ink-500);margin-bottom:11px;cursor:pointer}
    .cbx,.selectall{position:relative}
    .cbx input,.selectall input{position:absolute;opacity:0;width:0;height:0}
    .cbx span,.selectall span{width:17px;height:17px;border:1.5px solid var(--cf-line);border-radius:5px;display:inline-grid;place-items:center;transition:.14s;flex:none}
    .cbx input:checked + span,.selectall input:checked + span{background:var(--cf-brand-600);border-color:var(--cf-brand-600)}
    .cbx input:checked + span::after,.selectall input:checked + span::after{content:'';width:5px;height:9px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg);margin-top:-2px}

    .rows{display:flex;flex-direction:column;gap:12px}
    .card{background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:14px;box-shadow:0 1px 2px rgba(15,23,42,.04)}
    .row{display:flex;align-items:center;gap:14px;padding:14px 16px;transition:border-color .15s,box-shadow .15s,transform .12s;animation:rowIn .3s ease backwards}
    @keyframes rowIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    .rows .row:nth-child(2){animation-delay:.04s}.rows .row:nth-child(3){animation-delay:.08s}.rows .row:nth-child(n+4){animation-delay:.12s}
    .row:hover{border-color:color-mix(in srgb,var(--cf-brand-500) 26%,var(--cf-line));box-shadow:0 10px 24px -16px rgba(15,23,42,.4)}
    .row.sel{border-color:var(--cf-brand-500);background:color-mix(in srgb,var(--cf-brand-50) 55%,var(--cf-surface))}
    .row.urgent{border-inline-start:3px solid var(--cf-danger)}
    .ava{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;flex:none}
    .ava .material-icons{font-size:20px}
    .ava.t-credential{background:var(--cf-brand-50);color:var(--cf-brand-600)}
    .ava.t-batch{background:color-mix(in srgb,#8b5cf6 14%,transparent);color:#7c3aed}
    .ava.t-template{background:var(--cf-gold-soft);color:var(--cf-gold-ink)}
    .info{flex:1;min-width:0}
    .top{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
    .top strong{font-size:14.5px;color:var(--cf-ink-900)}
    .tchip{display:inline-flex;align-items:center;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;padding:3px 8px;border-radius:999px}
    .tchip.t-credential{background:var(--cf-brand-50);color:var(--cf-brand-700)}
    .tchip.t-batch{background:color-mix(in srgb,#8b5cf6 14%,transparent);color:#7c3aed}
    .tchip.t-template{background:var(--cf-gold-soft);color:var(--cf-gold-ink)}
    .ncount{display:inline-flex;align-items:center;gap:3px;font-size:11.5px;font-weight:600;color:var(--cf-ink-500)}.ncount .material-icons{font-size:13px}
    .age{display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:700;color:var(--cf-ink-400);background:var(--cf-surface-2);border:1px solid var(--cf-line);padding:2px 8px;border-radius:999px}.age .material-icons{font-size:12px}
    .age.warn{color:var(--cf-warning);background:var(--cf-warning-soft);border-color:transparent}
    .age.old{color:var(--cf-danger);background:var(--cf-danger-soft);border-color:transparent}
    .sub{font-size:12.5px;margin-top:3px}.sub b{color:var(--cf-ink-700);font-weight:600}
    .note{display:flex;align-items:flex-start;gap:7px;margin-top:9px;padding:8px 11px;background:var(--cf-surface-2);border-radius:var(--cf-radius-sm);font-size:12.5px;color:var(--cf-ink-700)}
    .note .material-icons{font-size:16px;color:var(--cf-ink-400)}
    .note.rej{background:var(--cf-danger-soft);color:var(--cf-danger)}.note.rej .material-icons{color:var(--cf-danger)}
    .act{display:flex;align-items:center;gap:8px;flex:none}
    .rejbtn:hover{color:var(--cf-danger);border-color:color-mix(in srgb,var(--cf-danger) 30%,transparent)}
    .act .badge{display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:700;padding:5px 11px;border-radius:999px}.act .badge .material-icons{font-size:14px}
    .act .badge.ok{background:#dcfce7;color:#15803d}
    .act .badge.no{background:var(--cf-danger-soft);color:var(--cf-danger)}
    .act small{font-size:11.5px}
    @media(max-width:680px){.row{flex-wrap:wrap}.act{width:100%;justify-content:flex-end}}

    .state{max-width:420px;margin:8vh auto;text-align:center;color:var(--cf-ink-600)}
    .st-badge{width:64px;height:64px;border-radius:18px;display:grid;place-items:center;margin:0 auto 8px;background:var(--cf-surface-2);color:var(--cf-ink-400)}
    .st-badge.done{background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;box-shadow:0 14px 30px -14px #15803d}
    .st-badge .material-icons{font-size:30px}
    .state h3{margin:8px 0 4px;color:var(--cf-ink-900);font-size:16px}
    .overlay{position:fixed;inset:0;background:rgba(2,6,23,.5);display:grid;place-items:center;z-index:60;padding:20px}
    .modal{position:relative;width:100%;max-width:420px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:var(--cf-radius-lg);box-shadow:var(--cf-shadow-lg);padding:22px}
    .modal h3{font-size:17px;margin-bottom:4px}.modal>p{font-size:13px;margin-bottom:14px}
    .close{position:absolute;top:12px;inset-inline-end:12px;border:0;background:none;color:var(--cf-ink-400);cursor:pointer}
    .fld{display:flex;flex-direction:column;gap:5px;font-size:12.5px;font-weight:500;color:var(--cf-ink-600)}
    .fld textarea{border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);padding:9px 10px;font:inherit;font-size:14px;background:var(--cf-surface);color:var(--cf-ink-900);outline:none;resize:vertical}
    .fld textarea:focus{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}
    .rej-confirm{background:var(--cf-danger);border-color:var(--cf-danger);color:#fff}
    .rej-confirm:hover:not(:disabled){filter:brightness(.94)}
    .iconbtn{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-400);cursor:pointer;transition:.14s}
    .iconbtn .material-icons{font-size:18px}
    .iconbtn:hover{color:var(--cf-brand-600);border-color:color-mix(in srgb,var(--cf-brand-500) 35%,var(--cf-line));background:var(--cf-brand-50)}
    .vmodal{position:relative;width:100%;max-width:760px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:18px;box-shadow:var(--cf-shadow-lg);overflow:hidden;animation:vmIn .2s ease}
    @keyframes vmIn{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
    .vmodal .close{position:absolute;top:12px;inset-inline-end:12px;z-index:3;border:0;background:rgba(255,255,255,.7);border-radius:8px;width:30px;height:30px;display:grid;place-items:center;color:var(--cf-ink-600);cursor:pointer}
    .vm-grid{display:grid;grid-template-columns:1.05fr 1fr}
    .vm-cert{padding:24px;background:linear-gradient(135deg,color-mix(in srgb,var(--cf-brand-500) 12%,var(--cf-surface-2)),var(--cf-surface-2));display:grid;place-items:center}
    .cert-mock{width:100%;background:var(--cf-surface);border:1px solid var(--cf-line);border-top:4px solid var(--cf-brand-600);border-radius:12px;padding:26px 22px;text-align:center;box-shadow:0 18px 40px -22px rgba(2,6,23,.5);display:flex;flex-direction:column;align-items:center;gap:4px}
    .cm-seal{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,var(--cf-brand-500),var(--cf-brand-700));color:#fff;margin-bottom:6px;box-shadow:0 8px 18px -8px color-mix(in srgb,var(--cf-brand-600) 80%,transparent)}
    .cm-seal .material-icons{font-size:24px}
    .cm-eyebrow{font-size:10px;font-weight:800;letter-spacing:.22em;color:var(--cf-ink-400)}
    .cm-title{font-size:17px;font-weight:800;color:var(--cf-ink-900);letter-spacing:-.01em}
    .cm-pres{font-size:11px;color:var(--cf-ink-500);margin-top:6px}
    .cm-name{font-size:21px;font-weight:800;color:var(--cf-brand-700);font-family:'Playfair Display',Georgia,serif}
    .cm-rule{width:80px;height:2px;border-radius:2px;background:linear-gradient(90deg,transparent,var(--cf-brand-500),transparent);margin:7px 0}
    .cm-batch{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:var(--cf-ink-500)}.cm-batch .material-icons{font-size:14px}
    .vm-body{padding:22px 22px 20px;display:flex;flex-direction:column;min-width:0}
    .vm-head{display:flex;align-items:center;gap:8px;margin-bottom:9px}
    .vm-body h3{font-size:18px;font-weight:800;color:var(--cf-ink-900);margin-bottom:12px}
    .vm-meta{display:flex;flex-direction:column;gap:8px;font-size:12.5px;color:var(--cf-ink-700)}
    .vm-meta>div{display:flex;align-items:center;gap:8px;min-width:0}.vm-meta .material-icons{font-size:16px;color:var(--cf-ink-400);flex:none}
    .signbox{margin-top:15px;border:1px dashed color-mix(in srgb,var(--cf-brand-500) 40%,var(--cf-line));border-radius:12px;padding:11px 14px;background:var(--cf-brand-50);display:flex;flex-direction:column;gap:1px}
    .sb-lbl{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--cf-brand-700)}
    .sb-sign{font-family:'Brush Script MT','Segoe Script',cursive;font-size:30px;line-height:1.15;color:var(--cf-ink-900)}
    .sb-name{font-size:11px}
    .vm-actions{display:flex;gap:10px;margin-top:auto;padding-top:16px}
    .vm-actions .cf-btn{flex:1;justify-content:center}
    .vm-decided{display:flex;align-items:center;gap:7px;margin-top:15px;font-size:13px;font-weight:600;color:var(--cf-ink-700)}.vm-decided .material-icons{font-size:18px;color:var(--cf-brand-600)}
    @media(max-width:680px){.vm-grid{grid-template-columns:1fr}.vm-cert{padding:18px}}
  `],
})
export class ApprovalsPage {
  readonly A = Actions;
  private alerts = inject(AlertService);
  readonly svc = inject(ApprovalService);
  private auth = inject(AuthService);

  tabs: ApprovalStatus[] = ['Pending', 'Approved', 'Rejected'];
  typeFilters: ('All' | ApprovalType)[] = ['All', 'Credential', 'Batch', 'Template'];
  tab = signal<ApprovalStatus>('Pending');
  query = signal('');
  typeFilter = signal<'All' | ApprovalType>('All');
  selected = signal<Set<number>>(new Set<number>());

  rejectTarget = signal<Approval | null>(null);
  rejectReason = '';

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const tf = this.typeFilter();
    const list = this.svc.items().filter((a) => {
      if (a.status !== this.tab()) return false;
      if (tf !== 'All' && a.type !== tf) return false;
      if (q && !(a.recipient.toLowerCase().includes(q) || a.item.toLowerCase().includes(q) || a.requestedBy.toLowerCase().includes(q) || (a.email || '').toLowerCase().includes(q))) return false;
      return true;
    });
    return this.tab() === 'Pending'
      ? [...list].sort((a, b) => +new Date(a.requestedAt) - +new Date(b.requestedAt))
      : [...list].sort((a, b) => +new Date(b.decidedAt || b.requestedAt) - +new Date(a.decidedAt || a.requestedAt));
  });

  selCount = computed(() => this.selected().size);
  isSel(id: number): boolean { return this.selected().has(id); }
  allSel = computed(() => { const f = this.filtered(); return f.length > 0 && f.every((a) => this.selected().has(a.id)); });
  toggleSel(id: number): void { const s = new Set(this.selected()); s.has(id) ? s.delete(id) : s.add(id); this.selected.set(s); }
  toggleAll(): void { const f = this.filtered(); const s = new Set(this.selected()); const all = f.every((a) => s.has(a.id)); f.forEach((a) => (all ? s.delete(a.id) : s.add(a.id))); this.selected.set(s); }
  clearSel(): void { this.selected.set(new Set<number>()); }
  approveSelected(): void { const ids = [...this.selected()]; if (!ids.length) return; this.svc.approveMany(ids); this.clearSel(); this.alerts.success(`${ids.length} approved.`); }

  initials(n: string): string { return n.split(/[\s—-]+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase(); }
  typeIcon(t: ApprovalType): string { return t === 'Batch' ? 'groups' : t === 'Template' ? 'dashboard_customize' : 'workspace_premium'; }
  ageDays(a: Approval): number { const d = +new Date(a.requestedAt); return d ? Math.floor((Date.now() - d) / 86400000) : 0; }
  ageLabel(a: Approval): string { const d = this.ageDays(a); return d <= 0 ? 'today' : d === 1 ? '1 day' : `${d} days`; }

  approve(a: Approval): void { this.svc.approve(a.id); this.alerts.success('Approved — ' + a.recipient + '.'); }
  async approveAll(): Promise<void> {
    const n = this.svc.pendingCount();
    const ok = await this.alerts.confirm({ title: 'Approve all', message: 'Approve all ' + n + ' pending item' + (n === 1 ? '' : 's') + '?', confirmText: 'Approve all' });
    if (!ok) return;
    this.svc.approveAll();
    this.alerts.success(n + ' approved.');
  }
  openReject(a: Approval): void { this.rejectReason = ''; this.rejectTarget.set(a); }
  submitReject(): void {
    const a = this.rejectTarget(); if (!a) return;
    this.svc.reject(a.id, this.rejectReason.trim() || null);
    this.rejectTarget.set(null);
    this.alerts.info('Rejected — ' + a.recipient + '.');
  }
  viewTarget = signal<Approval | null>(null);
  openView(a: Approval): void { this.viewTarget.set(a); }
  closeView(): void { this.viewTarget.set(null); }
  rejectFromView(a: Approval): void { this.closeView(); this.openReject(a); }
  approver = computed(() => { const n = (this.auth.userName || '').trim(); return n ? n.charAt(0).toUpperCase() + n.slice(1) : 'You'; });
  today(): string { return new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
  signApprove(a: Approval): void { this.svc.approve(a.id, this.approver()); this.closeView(); this.alerts.success('Signed & approved — ' + a.recipient + '.'); }
}
