import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { DatePipe, LowerCasePipe, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HasActionDirective } from '../../shared/directives/has-action.directive';
import { Actions } from '../../core/constants/actions';
import { AlertService } from '../../core/services/alert.service';
import { ApprovalService, Approval, ApprovalStatus, ApprovalType } from '../../core/services/approval.service';
import { AuthService } from '../../core/services/auth.service';
import { IssuedService, IssuedRecord } from '../../core/services/issued.service';
import { TemplateService } from '../../core/services/template.service';
import { SignaturePadComponent } from '../../shared/components/signature/signature-pad';
import { mergeDataIntoJson, renderJsonToPng } from '../../core/utils/render.util';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [DatePipe, LowerCasePipe, NgTemplateOutlet, FormsModule, HasActionDirective, SignaturePadComponent],
  template: `
  <div class="head">
    <div>
      <h1>Approvals</h1>
      <p class="cf-muted">Credentials assigned to you for approval — sign off to release them with your signature.</p>
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
        <button [class.on]="tab() === t" (click)="tab.set(t); clearSel(); tplFilter.set('all')">{{ t }} <span class="cnt">{{ svc.countOf(t) }}</span></button>
      }
    </div>
    <div class="t-right">
      <div class="search"><span class="material-icons">search</span><input [value]="query()" (input)="query.set($any($event.target).value)" placeholder="Search recipient, item, requester…" />@if (query()) { <button class="clr" (click)="query.set('')"><span class="material-icons">close</span></button> }</div>
      <div class="chips">
        @for (f of typeFilters; track f) { <button [class.on]="typeFilter() === f" (click)="typeFilter.set(f)">{{ f }}</button> }
      </div>
      @if (tplOptions().length > 0) {
        <div class="tplsel" [class.open]="tplOpen()">
          <button class="tplsel-btn" (click)="toggleTpl($event)" title="Filter by template">
            @if (tplFilter() !== 'all') {
              <span class="ts-thumb"><span class="material-icons">workspace_premium</span></span>
              <span class="ts-name">{{ tplFilter() }}</span>
            } @else {
              <span class="ts-thumb all"><span class="material-icons">apps</span></span>
              <span class="ts-name">All templates</span>
            }
            <span class="material-icons ts-chev">expand_more</span>
          </button>
          @if (tplOpen()) {
            <div class="tplmenu" (click)="$event.stopPropagation()">
              <button class="tplopt" [class.on]="tplFilter() === 'all'" (click)="pickTpl('all')">
                <span class="to-thumb all"><span class="material-icons">apps</span></span>
                <span class="to-tx"><b>All templates</b><small>{{ tplTotal() }} credential{{ tplTotal() === 1 ? '' : 's' }}</small></span>
                @if (tplFilter() === 'all') { <span class="material-icons to-check">check_circle</span> }
              </button>
              @for (t of tplOptions(); track t.name) {
                <button class="tplopt" [class.on]="tplFilter() === t.name" (click)="pickTpl(t.name)">
                  <span class="to-thumb"><span class="material-icons">workspace_premium</span></span>
                  <span class="to-tx"><b>{{ t.name }}</b><small>{{ t.count }} credential{{ t.count === 1 ? '' : 's' }}</small></span>
                  @if (tplFilter() === t.name) { <span class="material-icons to-check">check_circle</span> }
                </button>
              }
            </div>
          }
        </div>
      }
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
      <p class="cf-muted">{{ query() || typeFilter() !== 'All' || tplFilter() !== 'all' ? 'No items match your search or filter.' : 'No ' + tab().toLowerCase() + ' items right now.' }}</p>
    </div>
  } @else {
    @if (tab() === 'Pending') {
      <label class="selectall"><input type="checkbox" [checked]="allSel()" (change)="toggleAll()" /><span></span> Select all {{ filtered().length }}</label>
    }
    @for (tg of tplGroups(); track tg.name) {
      <section class="tsec" [class.closed]="!isTplOpen(tg.name)">
        <button type="button" class="tsec-head" (click)="toggleTplOpen(tg.name)">
          <span class="tsec-ava" [style.background]="tplGrad(tg.name)"><span class="material-icons">workspace_premium</span></span>
          <span class="tsec-meta">
            <span class="tsec-name">{{ tg.name }}</span>
            <span class="tsec-sub">
              @if (tg.batches.length) { <span><span class="material-icons">groups</span>{{ tg.batches.length }} batch{{ tg.batches.length === 1 ? '' : 'es' }}</span> }
              @if (tg.individ.length) { <span><span class="material-icons">person</span>{{ tg.individ.length }} individual</span> }
            </span>
          </span>
          <span class="tsec-count">{{ tg.recips }}</span>
          <span class="material-icons tsec-chev">expand_more</span>
        </button>
        @if (isTplOpen(tg.name)) {
          <div class="tsec-body">
            @if (tg.batches.length) {
              <div class="subsec">
                <div class="subsec-head bulk"><span class="material-icons">groups</span> Bulk batches <span class="ss-cnt">{{ tg.batches.length }}</span></div>
                <div class="rows">
                  @for (a of tg.batches; track a.id) { <ng-container [ngTemplateOutlet]="rowTpl" [ngTemplateOutletContext]="{ $implicit: a }"></ng-container> }
                </div>
              </div>
            }
            @if (tg.individ.length) {
              <div class="subsec">
                <div class="subsec-head indiv"><span class="material-icons">workspace_premium</span> Individual credentials <span class="ss-cnt">{{ tg.individ.length }}</span></div>
                <div class="rows">
                  @for (a of tg.individ; track a.id) { <ng-container [ngTemplateOutlet]="rowTpl" [ngTemplateOutletContext]="{ $implicit: a }"></ng-container> }
                </div>
              </div>
            }
          </div>
        }
      </section>
    }

    <ng-template #rowTpl let-a>
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
              @if (a.type === 'Batch') {
                <button class="cf-btn cf-btn-secondary sm rejbtn" (click)="openReject(a)" [appHasAction]="A.Credential_Approve" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">close</span> Reject all</button>
                <button class="cf-btn cf-btn-primary sm" (click)="openBatch(a)" [appHasAction]="A.Credential_Approve" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">groups</span> Review &amp; approve</button>
              } @else {
                <button class="cf-btn cf-btn-secondary sm rejbtn" (click)="openReject(a)" [appHasAction]="A.Credential_Approve" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">close</span> Reject</button>
                <button class="cf-btn cf-btn-primary sm" (click)="approve(a)" [appHasAction]="A.Credential_Approve" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">check</span> Approve</button>
              }
            } @else {
              <span class="badge" [class.ok]="a.status === 'Approved'" [class.no]="a.status === 'Rejected'"><span class="material-icons">{{ a.status === 'Approved' ? 'check_circle' : 'cancel' }}</span>{{ a.status }}</span>
              <small class="cf-muted">{{ a.decidedBy }} · {{ a.decidedAt | date: 'mediumDate' }}</small>
            }
          </div>
        </div>
    </ng-template>
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
            @if (viewImg()) {
              <img class="vm-real" [src]="viewImg()!" alt="credential preview" />
              @if (a.count) { <span class="vm-batchcap"><span class="material-icons">groups</span> {{ a.count }} recipients in this batch</span> }
            } @else {
            <div class="cert-mock">
              <span class="cm-seal"><span class="material-icons">workspace_premium</span></span>
              <span class="cm-eyebrow">CERTIFICATE</span>
              <span class="cm-title">{{ a.item }}</span>
              <span class="cm-pres">This is proudly presented to</span>
              <span class="cm-name">{{ a.recipient }}</span>
              <span class="cm-rule"></span>
              @if (a.count) { <span class="cm-batch"><span class="material-icons">groups</span> {{ a.count }} recipients in this batch</span> }
            </div>
            }
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
              <div class="signbox" [class.nosig]="!hasSig()">
                <span class="sb-lbl"><span class="material-icons">draw</span> Sign as approver</span>
                @if (hasSig()) {
                  <img class="sb-img" [src]="mySig()!" alt="Your signature" />
                  <span class="sb-name cf-muted">{{ approver() }} · {{ today() }}</span>
                } @else {
                  <span class="sb-missing">No signature on file. <button class="sb-add" (click)="addSignatureNow()">Add your signature</button> to sign &amp; approve.</span>
                }
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

  @if (batchTarget(); as a) {
    <div class="overlay" (click)="closeBatch()">
      <div class="bmodal" (click)="$event.stopPropagation()">
        <button class="close" (click)="closeBatch()"><span class="material-icons">close</span></button>
        <div class="bm-head">
          <span class="bm-bigav"><span class="material-icons">groups</span></span>
          <div class="bm-h-txt">
            <h3>{{ a.item }}</h3>
            <span class="cf-muted">{{ batchRecs().length }} awaiting approval · requested by {{ a.requestedBy }}</span>
          </div>
        </div>
        <div class="bm-progrow">
          <span class="bm-prog-lbl">{{ batchDone() }} / {{ batchTotal() }} approved</span>
          <div class="bm-prog-bar"><i [style.width.%]="batchPct()"></i></div>
          <span class="bm-prog-pct">{{ batchPct() }}%</span>
        </div>
        <div class="bm-grid">
          <div class="bm-list">
            <div class="bm-tools">
              <label class="cbx" (click)="$event.stopPropagation()"><input type="checkbox" [checked]="batchAllSel()" (change)="toggleBatchAll()" /><span></span></label>
              <span>{{ batchSelCount() ? batchSelCount() + ' selected' : 'Select recipients' }}</span>
            </div>
            <div class="bm-rows">
              @for (r of batchRecs(); track r.id) {
                <div class="bm-row" [class.sel]="batchSel().has(r.id)" [class.active]="batchPreview()?.rec?.id === r.id" (click)="pickRecord(r)">
                  <label class="cbx" (click)="$event.stopPropagation()"><input type="checkbox" [checked]="batchSel().has(r.id)" (change)="toggleBatchSel(r.id)" /><span></span></label>
                  <span class="bm-ava" [style.background]="avColor(r.recipientEmail || r.recipientName || '?')">{{ initials(r.recipientName || '?') }}</span>
                  <div class="bm-info"><strong>{{ r.recipientName || 'Recipient' }}</strong><small class="cf-muted">{{ r.recipientEmail || '—' }}</small></div>
                </div>
              }
              @if (!batchRecs().length) { <div class="bm-empty"><span class="material-icons">task_alt</span> All recipients approved.</div> }
            </div>
          </div>
          <div class="bm-prev">
            @if (batchPreview(); as p) {
              @if (p.img) { <img class="bm-img" [src]="p.img" alt="certificate preview" /> }
              @else { <div class="bm-loading"><span class="material-icons spin">autorenew</span> Rendering…</div> }
              <div class="bm-prev-foot">
                <div class="bm-prev-who"><strong>{{ p.rec.recipientName || 'Recipient' }}</strong><small class="cf-muted">{{ p.rec.recipientEmail }}</small></div>
                <span class="bm-prev-btns">
                  <button class="cf-btn cf-btn-secondary sm bm-rej" (click)="rejectOne(p.rec)" [appHasAction]="A.Credential_Approve" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">close</span> Reject</button>
                  <button class="cf-btn cf-btn-primary sm" (click)="approveOne(p.rec)" [appHasAction]="A.Credential_Approve" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">check</span> Approve this</button>
                </span>
              </div>
            } @else {
              <div class="bm-noprev"><span class="material-icons">image_search</span> Select a recipient to preview</div>
            }
          </div>
        </div>
        <div class="bm-foot">
          <span class="bm-foot-sig" [class.nosig]="!hasSig()">
            @if (hasSig()) { <img [src]="mySig()!" alt="signature" /> <span class="cf-muted">Signing as {{ approver() }}</span> }
            @else { <button class="sb-add" (click)="addSignatureNow()">Add your signature to approve</button> }
          </span>
          <span class="bm-foot-actions">
            @if (batchSelCount()) {
              <button class="cf-btn cf-btn-secondary sm bm-rej" (click)="rejectBatchSelected()" [appHasAction]="A.Credential_Approve" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">close</span> Reject ({{ batchSelCount() }})</button>
            }
            <button class="cf-btn cf-btn-secondary sm" [disabled]="!batchSelCount()" (click)="approveBatchSelected()" [appHasAction]="A.Credential_Approve" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">done</span> Approve selected ({{ batchSelCount() }})</button>
            <button class="cf-btn cf-btn-primary sm" (click)="approveBatchAll()" [appHasAction]="A.Credential_Approve" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">done_all</span> Approve all ({{ batchRecs().length }})</button>
          </span>
        </div>
      </div>
    </div>
  }

  @if (noSigWarn()) {
    <div class="overlay" (click)="dismissWarn()">
      <div class="modal nosig-modal" (click)="$event.stopPropagation()">
        <button class="close" (click)="dismissWarn()"><span class="material-icons">close</span></button>
        <div class="ns-ic"><span class="material-icons">draw</span></div>
        <h3>Add your signature to approve</h3>
        <p class="cf-muted">You do not have a signature on file yet. Approving applies your signature to the credential — add one from your profile menu, or add it now.</p>
        <div class="modal-actions">
          <button class="cf-btn cf-btn-secondary" (click)="dismissWarn()">Cancel</button>
          <button class="cf-btn cf-btn-primary" (click)="addSignatureNow()"><span class="material-icons">edit</span> Add signature now</button>
        </div>
      </div>
    </div>
  }
  <app-signature-pad [open]="addSigOpen()" (closed)="onSigClosed()" />
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
    .tplsel{position:relative}
    .tplsel-btn{display:inline-flex;align-items:center;gap:9px;height:34px;padding:0 9px 0 7px;border:1px solid var(--cf-line);border-radius:10px;background:var(--cf-surface);cursor:pointer;font:inherit;color:var(--cf-ink-800);min-width:178px;transition:border-color .14s,box-shadow .14s}
    .tplsel-btn:hover{border-color:var(--cf-brand-400)}
    .tplsel.open .tplsel-btn{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .ts-thumb{width:26px;height:26px;border-radius:7px;display:grid;place-items:center;overflow:hidden;flex:none;background:var(--cf-surface-2);border:1px solid var(--cf-line)}
    .ts-thumb .material-icons{font-size:15px;color:var(--cf-brand-600)}
    .ts-thumb.all{background:var(--cf-brand-50);border-color:var(--cf-brand-100)}
    .ts-name{flex:1;font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px;text-align:start}
    .ts-chev{font-size:18px;color:var(--cf-ink-400);transition:transform .2s}
    .tplsel.open .ts-chev{transform:rotate(180deg)}
    .tplmenu{position:absolute;top:calc(100% + 6px);inset-inline-end:0;min-width:288px;max-height:344px;overflow:auto;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:13px;box-shadow:0 22px 48px -16px rgba(2,6,23,.42);padding:6px;z-index:50;animation:tpl-in .15s ease;scrollbar-width:thin}
    @keyframes tpl-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
    .tplopt{display:flex;align-items:center;gap:11px;width:100%;border:0;background:none;padding:8px;border-radius:10px;cursor:pointer;text-align:start;transition:background .13s}
    .tplopt:hover{background:var(--cf-surface-2)}
    .tplopt.on{background:var(--cf-brand-50)}
    .to-thumb{width:44px;height:31px;border-radius:7px;overflow:hidden;flex:none;display:grid;place-items:center;background:var(--cf-surface-2);border:1px solid var(--cf-line);box-shadow:0 1px 3px rgba(15,23,42,.1)}
    .to-thumb .material-icons{font-size:16px;color:var(--cf-brand-600)}
    .to-thumb.all{background:var(--cf-brand-50);border-color:var(--cf-brand-100)}
    .to-tx{flex:1;display:flex;flex-direction:column;min-width:0}
    .to-tx b{font-size:13px;font-weight:700;color:var(--cf-ink-900);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .to-tx small{font-size:11.5px;color:var(--cf-ink-500)}
    .to-check{font-size:19px;color:var(--cf-brand-600);flex:none}
    /* ---- Template -> Bulk/Individual hierarchy ---- */
    .tsec{border:1px solid var(--cf-line);border-radius:16px;background:var(--cf-surface);margin-bottom:14px;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,.04)}
    .tsec-head{display:flex;align-items:center;gap:13px;width:100%;border:0;background:none;padding:13px 16px;cursor:pointer;text-align:start;font:inherit}
    .tsec-head:hover{background:var(--cf-surface-2)}
    .tsec-ava{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;flex:none;box-shadow:0 5px 12px -4px rgba(15,23,42,.4)}
    .tsec-ava .material-icons{font-size:22px;color:#fff}
    .tsec-meta{flex:1;display:flex;flex-direction:column;gap:3px;min-width:0}
    .tsec-name{font-size:15px;font-weight:800;color:var(--cf-ink-900);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .tsec-sub{display:flex;align-items:center;gap:14px;font-size:12px;color:var(--cf-ink-500)}
    .tsec-sub>span{display:inline-flex;align-items:center;gap:4px}
    .tsec-sub .material-icons{font-size:14px;color:var(--cf-ink-400)}
    .tsec-count{min-width:30px;height:26px;padding:0 11px;border-radius:13px;display:grid;place-items:center;background:var(--cf-brand-50);color:var(--cf-brand-700);font-size:13px;font-weight:800;flex:none}
    .tsec-chev{font-size:22px;color:var(--cf-ink-400);transition:transform .22s;flex:none}
    .tsec.closed .tsec-chev{transform:rotate(-90deg)}
    .tsec-body{padding:2px 12px 10px;border-top:1px solid var(--cf-line);animation:tpl-in .16s ease}
    .subsec{margin-top:10px}
    .subsec-head{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--cf-ink-500);padding:6px 4px 8px}
    .subsec-head .material-icons{font-size:16px}
    .subsec-head.bulk .material-icons{color:#7c3aed}
    .subsec-head.indiv .material-icons{color:var(--cf-brand-600)}
    .ss-cnt{min-width:18px;height:18px;padding:0 6px;border-radius:9px;display:inline-grid;place-items:center;background:var(--cf-surface-2);color:var(--cf-ink-600);font-size:11px;font-weight:700;border:1px solid var(--cf-line)}
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
    .vm-cert{padding:24px;background:radial-gradient(130% 100% at 50% 0%,color-mix(in srgb,var(--cf-brand-500) 15%,var(--cf-surface-2)),color-mix(in srgb,var(--cf-ink-900) 6%,var(--cf-surface-2)));display:grid;place-items:center}
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
    .vm-meta>div{display:flex;align-items:center;gap:10px;min-width:0;font-size:12.5px}
    .vm-meta .material-icons{font-size:16px;color:var(--cf-brand-600);flex:none;width:28px;height:28px;border-radius:8px;background:var(--cf-brand-50);display:grid;place-items:center}
    .vm-real{transition:transform .3s cubic-bezier(.2,.8,.25,1)}
    .vm-real:hover{transform:scale(1.02)}
    .signbox{margin-top:15px;border:1px dashed color-mix(in srgb,var(--cf-brand-500) 40%,var(--cf-line));border-radius:12px;padding:11px 14px;background:var(--cf-brand-50);display:flex;flex-direction:column;gap:1px}
    .sb-lbl{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--cf-brand-700)}
    .sb-sign{font-family:'Brush Script MT','Segoe Script',cursive;font-size:30px;line-height:1.15;color:var(--cf-ink-900)}
    .signbox .sb-lbl{display:inline-flex;align-items:center;gap:5px}.signbox .sb-lbl .material-icons{font-size:13px}
    .signbox{position:relative;overflow:hidden;padding:8px 13px 8px 16px;margin-top:12px;gap:0;background:linear-gradient(135deg,var(--cf-brand-50),var(--cf-surface))}
    .signbox:not(.nosig)::before{content:'';position:absolute;inset-inline-start:0;top:0;bottom:0;width:3px;background:linear-gradient(180deg,var(--cf-brand-500),var(--cf-brand-700))}
    .signbox .sb-img{max-height:42px;max-width:160px;margin:2px 0}
    .signbox .sb-sign{font-size:21px}
    .signbox .sb-name{font-size:10.5px}
    .signbox .sb-lbl{font-size:9.5px}
    .sb-img{max-width:230px;max-height:74px;object-fit:contain;align-self:flex-start;margin:3px 0}
    .vm-real{max-width:100%;max-height:440px;width:auto;object-fit:contain;border-radius:9px;box-shadow:0 16px 40px -16px rgba(15,23,42,.45),0 2px 8px rgba(15,23,42,.07)}
    .vm-batchcap{display:inline-flex;align-items:center;gap:6px;margin-top:12px;font-size:12px;font-weight:600;color:var(--cf-ink-500)}.vm-batchcap .material-icons{font-size:15px;color:var(--cf-brand-600)}
    .signbox.nosig{border-color:color-mix(in srgb,#d97706 45%,var(--cf-line));background:color-mix(in srgb,#d97706 8%,transparent)}
    .sb-missing{font-size:12.5px;color:#b45309;line-height:1.5}
    .sb-add{border:0;background:none;color:var(--cf-brand-600);font:inherit;font-size:12.5px;font-weight:700;text-decoration:underline;cursor:pointer;padding:0}
    .agroup{margin-bottom:18px}
    .agroup-head{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--cf-ink-500);margin:2px 2px 10px}
    .agroup-head .material-icons{font-size:16px;color:var(--cf-brand-600)}
    .agroup-head .g-cnt{margin-inline-start:4px;min-width:20px;height:18px;padding:0 6px;border-radius:999px;background:var(--cf-surface-2);border:1px solid var(--cf-line);display:inline-grid;place-items:center;font-size:11px;font-weight:700;color:var(--cf-ink-600)}
    .nosig-modal{text-align:center}
    .nosig-modal .ns-ic{width:56px;height:56px;border-radius:50%;display:grid;place-items:center;margin:6px auto 12px;background:color-mix(in srgb,#d97706 14%,transparent);color:#d97706}
    .nosig-modal .ns-ic .material-icons{font-size:28px}
    .nosig-modal h3{margin:0 0 6px}.nosig-modal p{margin:0 0 18px}
    .nosig-modal .modal-actions{justify-content:center}
    .sb-name{font-size:11px}
    .vm-actions{display:flex;gap:10px;margin-top:auto;padding-top:16px}
    .vm-actions{justify-content:flex-end;gap:9px}
    .vm-actions .cf-btn{flex:none;height:40px;padding:0 16px;border-radius:11px;font-size:13px;justify-content:center}
    .vm-actions .cf-btn-secondary{color:var(--cf-ink-600)}
    .vm-actions .cf-btn-primary{background:linear-gradient(135deg,#16a34a,#15803d);border:0;color:#fff;font-weight:700;padding:0 18px;box-shadow:0 8px 18px -8px rgba(22,163,74,.65);transition:transform .14s,box-shadow .14s,filter .14s}
    .vm-actions .cf-btn-primary:hover{transform:translateY(-1px);box-shadow:0 12px 22px -8px rgba(22,163,74,.78);filter:brightness(1.04)}
    .vm-actions .cf-btn-primary .material-icons{font-size:17px}
    .vm-decided{display:flex;align-items:center;gap:7px;margin-top:15px;font-size:13px;font-weight:600;color:var(--cf-ink-700)}.vm-decided .material-icons{font-size:18px;color:var(--cf-brand-600)}
    @media(max-width:680px){.vm-grid{grid-template-columns:1fr}.vm-cert{padding:18px}}
    .bmodal{position:relative;width:100%;max-width:900px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:20px;box-shadow:0 30px 80px rgba(15,23,42,.34);overflow:hidden;display:flex;flex-direction:column;height:min(680px,90vh);max-height:90vh;animation:bmIn .26s cubic-bezier(.2,.8,.25,1)}
    .bmodal .close{position:absolute;top:14px;inset-inline-end:14px;z-index:6;width:32px;height:32px;border:0;border-radius:9px;background:var(--cf-surface);box-shadow:0 1px 5px rgba(15,23,42,.18);display:grid;place-items:center;color:var(--cf-ink-500);cursor:pointer;transition:background .12s,color .12s}
    .bmodal .close:hover{background:var(--cf-surface-2);color:var(--cf-ink-800)}
    @keyframes bmIn{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}
    .bm-head{display:flex;align-items:center;gap:14px;padding:18px 22px;padding-inline-end:56px;background:linear-gradient(135deg,color-mix(in srgb,var(--cf-brand-500) 12%,var(--cf-surface)),var(--cf-surface));border-bottom:1px solid var(--cf-line)}
    .bm-h-txt{flex:1;min-width:0}
    .bm-progrow{display:flex;align-items:center;gap:12px;padding:11px 22px;border-bottom:1px solid var(--cf-line);background:var(--cf-surface)}
    .bm-prog-pct{font-size:11px;font-weight:800;color:var(--cf-brand-700);white-space:nowrap;min-width:32px;text-align:end}
    .bm-prog-bar{flex:1;height:7px;border-radius:999px;background:var(--cf-surface-2);overflow:hidden;border:1px solid var(--cf-line)}
    .bm-prog-bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#6366f1,#22c55e);transition:width .45s cubic-bezier(.2,.8,.25,1)}
    .bm-prog-lbl{font-size:11px;font-weight:800;color:var(--cf-ink-600);white-space:nowrap}
    .bm-bigav{width:46px;height:46px;flex:none;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;box-shadow:0 8px 20px rgba(99,102,241,.4)}
    .bm-bigav .material-icons{font-size:24px}
    .bm-h-txt h3{font-size:16px;margin:0}.bm-h-txt span{font-size:12.5px}
    .bm-grid{display:grid;grid-template-columns:322px 1fr;min-height:0;flex:1}
    .bm-list{display:flex;flex-direction:column;border-inline-end:1px solid var(--cf-line);min-height:0}
    .bm-tools{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--cf-line);font-size:12px;font-weight:600;color:var(--cf-ink-600)}
    .bm-rows{overflow:auto;padding:6px;display:flex;flex-direction:column;gap:4px}
    .bm-row{display:flex;align-items:center;gap:11px;padding:9px 11px;border-radius:12px;cursor:pointer;border:1px solid transparent;transition:background .14s,box-shadow .14s;position:relative}
    .bm-row:hover{background:var(--cf-surface-2)}
    .bm-row.active{background:var(--cf-brand-50);box-shadow:inset 3px 0 0 var(--cf-brand-500)}
    .bm-row.sel{background:color-mix(in srgb,var(--cf-brand-500) 9%,transparent)}
    .bm-ava{width:34px;height:34px;border-radius:50%;flex:none;display:grid;place-items:center;background:linear-gradient(135deg,#818cf8,#a78bfa);color:#fff;font-size:12px;font-weight:800;transition:box-shadow .14s}
    .bm-row.sel .bm-ava{box-shadow:0 0 0 3px color-mix(in srgb,var(--cf-brand-500) 35%,transparent)}
    .bm-ava{position:relative}
    .bm-row.sel .bm-ava::after{content:'✓';position:absolute;bottom:-3px;inset-inline-end:-3px;width:16px;height:16px;border-radius:50%;background:#16a34a;color:#fff;font-size:10px;font-weight:800;display:grid;place-items:center;border:2px solid var(--cf-surface)}
    .bm-img{transition:transform .3s cubic-bezier(.2,.8,.25,1)}
    .bm-img:hover{transform:scale(1.015)}
    .bm-prog-bar i{position:relative;overflow:hidden}
    .bm-prog-bar i::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);transform:translateX(-100%);animation:bmShim 1.9s ease-in-out infinite}
    @keyframes bmShim{to{transform:translateX(100%)}}
    .bm-empty .material-icons{animation:bmPop .5s cubic-bezier(.2,1.3,.5,1)}
    @keyframes bmPop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
    .bm-info{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.2}
    .bm-info strong{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .bm-info small{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .bm-empty{padding:30px 16px;text-align:center;color:var(--cf-ink-500);font-size:13px;display:flex;flex-direction:column;align-items:center;gap:8px}
    .bm-empty .material-icons{font-size:30px;color:var(--cf-brand-500)}
    .bm-prev{display:flex;flex-direction:column;background:radial-gradient(120% 80% at 50% 0%,var(--cf-surface-2),color-mix(in srgb,var(--cf-ink-900) 7%,var(--cf-surface-2)));min-height:0}
    .bm-img{width:100%;flex:1;min-height:0;object-fit:contain;padding:22px;box-sizing:border-box;filter:drop-shadow(0 14px 30px rgba(15,23,42,.24))}
    .bm-loading,.bm-noprev{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--cf-ink-500);font-size:13px}
    .bm-noprev .material-icons,.bm-loading .material-icons{font-size:34px;color:var(--cf-ink-300,#cbd5e1)}
    .bm-prev-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-top:1px solid var(--cf-line);background:var(--cf-surface)}
    .bm-prev-btns{display:flex;gap:8px;flex:none}
    .bm-rej .material-icons{color:var(--cf-danger)}
    .bm-rej:hover{border-color:color-mix(in srgb,var(--cf-danger) 50%,var(--cf-line));color:var(--cf-danger);background:var(--cf-danger-soft)}
    .bm-prev-who{display:flex;flex-direction:column;line-height:1.2}.bm-prev-who strong{font-size:13px}.bm-prev-who small{font-size:11px}
    .bm-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;border-top:1px solid var(--cf-line);flex-wrap:wrap}
    .bm-foot-sig{display:inline-flex;align-items:center;gap:9px;font-size:12px;background:var(--cf-surface-2);border:1px solid var(--cf-line);border-radius:999px;padding:5px 13px 5px 8px}
    .bm-foot-sig img{height:26px;max-width:96px;object-fit:contain}
    .bm-foot-sig.nosig .sb-add{background:none;border:0;color:var(--cf-brand-600);font:inherit;font-weight:700;cursor:pointer;text-decoration:underline}
    .bm-foot-actions{display:flex;gap:10px}
    .spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
    @media(max-width:680px){.bm-grid{grid-template-columns:1fr}.bm-list{border-inline-end:0;border-bottom:1px solid var(--cf-line);max-height:190px}.bm-img{min-height:220px}}
  `],
})
export class ApprovalsPage {
  readonly A = Actions;
  private alerts = inject(AlertService);
  readonly svc = inject(ApprovalService);
  private auth = inject(AuthService);
  private issued = inject(IssuedService);
  private templates = inject(TemplateService);

  mySig = signal<string | null>(this.readSig());
  hasSig = computed(() => !!this.mySig());
  noSigWarn = signal(false);
  addSigOpen = signal(false);
  private pendingApprove: (() => void) | null = null;
  private readSig(): string | null { try { return localStorage.getItem('cf-signature'); } catch { return null; } }
  refreshSig(): void { this.mySig.set(this.readSig()); }

  tabs: ApprovalStatus[] = ['Pending', 'Approved', 'Rejected'];
  typeFilters: ('All' | ApprovalType)[] = ['All', 'Credential', 'Batch'];
  tab = signal<ApprovalStatus>('Pending');
  query = signal('');
  typeFilter = signal<'All' | ApprovalType>('All');
  /** Filter the queue to one template (by name). 'all' = every template. */
  tplFilter = signal<string>('all');
  tplOpen = signal(false);
  @HostListener('document:click') closeTpl(): void { if (this.tplOpen()) this.tplOpen.set(false); }
  toggleTpl(e: Event): void { e.stopPropagation(); this.tplOpen.update((v) => !v); }
  pickTpl(name: string): void { this.tplFilter.set(name); this.tplOpen.set(false); }
  /** Template names in the current tab with credential counts (for the template DDL). */
  readonly tplOptions = computed(() => {
    const counts = new Map<string, number>();
    for (const a of this.svc.items()) if (a.status === this.tab()) { const k = a.item || 'Untitled'; counts.set(k, (counts.get(k) || 0) + (a.count || 1)); }
    return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((x, y) => y.count - x.count || x.name.localeCompare(y.name));
  });
  readonly tplTotal = computed(() => this.tplOptions().reduce((n, t) => n + t.count, 0));
  selected = signal<Set<number>>(new Set<number>());

  rejectTarget = signal<Approval | null>(null);
  rejectReason = '';

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const tf = this.typeFilter();
    const tpl = this.tplFilter();
    const list = this.svc.items().filter((a) => {
      if (a.status !== this.tab()) return false;
      if (tf !== 'All' && a.type !== tf) return false;
      if (tpl !== 'all' && (a.item || 'Untitled') !== tpl) return false;
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
  async approveSelected(): Promise<void> {
    const ids = [...this.selected()]; if (!ids.length) return;
    if (!(await this.confirmApprove(ids.length))) return;
    this.guard(() => { const items = this.svc.pending().filter((a) => ids.includes(a.id)); this.svc.approveMany(ids, this.approver()); items.forEach((a) => this.resign(a)); this.clearSel(); this.alerts.success(ids.length + ' approved & signed.'); });
  }

  initials(n: string): string { return n.split(/[\s—-]+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase(); }
  typeIcon(t: ApprovalType): string { return t === 'Batch' ? 'groups' : t === 'Template' ? 'dashboard_customize' : 'workspace_premium'; }
  ageDays(a: Approval): number { const d = +new Date(a.requestedAt); return d ? Math.floor((Date.now() - d) / 86400000) : 0; }
  ageLabel(a: Approval): string { const d = this.ageDays(a); return d <= 0 ? 'today' : d === 1 ? '1 day' : `${d} days`; }

  /** Attractive, professional approve confirmation (green tone). */
  private confirmApprove(n: number): Promise<boolean> {
    return this.alerts.confirm({
      tone: 'success', icon: 'verified',
      title: n > 1 ? 'Approve ' + n + ' certificates?' : 'Approve & sign this certificate?',
      message: 'Your approver signature will be applied and ' + (n > 1 ? 'all ' + n + ' credentials' : 'the credential') + ' finalized for delivery.',
      confirmText: n > 1 ? 'Approve all ' + n : 'Approve & sign',
      cancelText: 'Cancel',
    });
  }
  async approve(a: Approval): Promise<void> {
    if (!(await this.confirmApprove(a.count || 1))) return;
    this.guard(() => { this.svc.approve(a.id, this.approver()); this.resign(a); this.alerts.success('Approved & signed — ' + a.recipient + '.'); });
  }
  async approveAll(): Promise<void> {
    if (!this.hasSig()) { this.guard(() => {}); return; }
    const n = this.svc.pendingCount();
    const ok = await this.alerts.confirm({ tone: 'success', icon: 'verified', title: 'Approve all ' + n + ' item' + (n === 1 ? '' : 's') + '?', message: 'Your approver signature will be applied and all pending credentials finalized for delivery.', confirmText: 'Approve all', cancelText: 'Cancel' });
    if (!ok) return;
    const items = this.svc.pending();
    this.svc.approveAll(this.approver());
    items.forEach((a) => this.resign(a));
    this.alerts.success(n + ' approved & signed.');
  }
  openReject(a: Approval): void { this.rejectReason = ''; this.rejectTarget.set(a); }
  submitReject(): void {
    const a = this.rejectTarget(); if (!a) return;
    this.svc.reject(a.id, this.rejectReason.trim() || null);
    this.rejectTarget.set(null);
    this.alerts.info('Rejected — ' + a.recipient + '.');
  }
  viewTarget = signal<Approval | null>(null);
  viewImg = signal<string | null>(null);
  openView(a: Approval): void { if (a.type === 'Batch') { this.openBatch(a); return; } this.viewTarget.set(a); this.viewImg.set(null); this.loadViewImg(a); }
  closeView(): void { this.viewTarget.set(null); this.viewImg.set(null); }
  /** Render the real credential for the approval being viewed (signed preview, or pending stamp if no signature). */
  private async loadViewImg(a: Approval): Promise<void> {
    const rec = this.issued.records().find((r) =>
      a.credentialId ? r.id === a.credentialId : (a.batchId ? r.batchId === a.batchId : (!!a.email && r.recipientEmail === a.email)));
    if (!rec) return;
    if (rec.fileDataUrl) this.viewImg.set(rec.fileDataUrl);
    try {
      const t = await firstValueFrom(this.templates.get(rec.templateId));
      if (!t?.canvasJson || this.viewTarget()?.id !== a.id) return;
      const data = { ...rec.data };
      for (const k of Object.keys(data)) { if (/signature/i.test(k)) delete data[k]; }
      const json = mergeDataIntoJson(t.canvasJson, data);
      const img = await renderJsonToPng(json, t.width, t.height, 2, this.mySig(), !this.hasSig());
      if (this.viewTarget()?.id === a.id) this.viewImg.set(img);
    } catch { /* keep fallback mock */ }
  }
  rejectFromView(a: Approval): void { this.closeView(); this.openReject(a); }
  approver = computed(() => { const raw = (this.auth.userName || '').trim(); const n = raw && raw.toLowerCase() !== 'there' ? raw : ''; return n ? n.charAt(0).toUpperCase() + n.slice(1) : 'You'; });
  today(): string { return new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
  async signApprove(a: Approval): Promise<void> {
    if (!(await this.confirmApprove(a.count || 1))) return;
    this.guard(() => { this.svc.approve(a.id, this.approver()); this.resign(a); this.closeView(); this.alerts.success('Signed & approved — ' + a.recipient + '.'); });
  }

  private guard(run: () => void): void {
    if (this.hasSig()) { run(); return; }
    this.pendingApprove = run; this.noSigWarn.set(true);
  }
  addSignatureNow(): void { this.noSigWarn.set(false); this.addSigOpen.set(true); }
  dismissWarn(): void { this.noSigWarn.set(false); this.pendingApprove = null; }
  onSigClosed(): void {
    this.addSigOpen.set(false); this.refreshSig();
    const run = this.pendingApprove; this.pendingApprove = null;
    if (this.hasSig() && run) run();
  }
  /** After approval, re-render the credential(s) with the approver's saved signature and persist the signed image. */
  private async resign(a: Approval): Promise<void> {
    const sig = this.mySig();
    const recs = this.issued.records().filter((r) =>
      a.batchId ? r.batchId === a.batchId : (a.credentialId ? r.id === a.credentialId : (!!a.email && r.recipientEmail === a.email)));
    for (const r of recs) {
      try {
        const t = await firstValueFrom(this.templates.get(r.templateId));
        if (!t?.canvasJson) continue;
        const data = { ...r.data };
        for (const k of Object.keys(data)) { if (/signature/i.test(k)) delete data[k]; }
        const json = mergeDataIntoJson(t.canvasJson, data);
        const file = await renderJsonToPng(json, t.width, t.height, 2, sig);
        this.issued.update(r.id, { fileDataUrl: file });
      } catch { /* keep existing image */ }
    }
  }
  /** Pending items split into Bulk batches vs Individual credentials. */
  groups = computed(() => {
    const f = this.filtered();
    const batch = f.filter((a) => a.type === 'Batch');
    const indiv = f.filter((a) => a.type !== 'Batch');
    const out: { key: string; label: string; icon: string; items: Approval[] }[] = [];
    if (batch.length) out.push({ key: 'Batch', label: 'Bulk batches', icon: 'groups', items: batch });
    if (indiv.length) out.push({ key: 'Individual', label: 'Individual credentials', icon: 'workspace_premium', items: indiv });
    return out;
  });

  /** Collapsed template sections (by template name). */
  collapsedTpls = signal<Set<string>>(new Set<string>());
  isTplOpen(name: string): boolean { return !this.collapsedTpls().has(name); }
  toggleTplOpen(name: string): void {
    const set = new Set(this.collapsedTpls());
    if (set.has(name)) set.delete(name); else set.add(name);
    this.collapsedTpls.set(set);
  }
  /** Gradient avatar per template (hashed hue) — visual variety without thumbnails. */
  tplGrad(name: string): string {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
    return `linear-gradient(135deg, hsl(${h},68%,54%), hsl(${(h + 28) % 360},70%,44%))`;
  }
  /** Two-level grouping: Template -> { Bulk batches, Individual credentials }. */
  tplGroups = computed(() => {
    const f = this.filtered();
    const map = new Map<string, Approval[]>();
    for (const a of f) { const k = a.item || 'Untitled'; const arr = map.get(k) ?? map.set(k, []).get(k)!; arr.push(a); }
    const byDate = (a: Approval, b: Approval) => this.tab() === 'Pending'
      ? +new Date(a.requestedAt) - +new Date(b.requestedAt)
      : +new Date(b.decidedAt || b.requestedAt) - +new Date(a.decidedAt || a.requestedAt);
    return [...map.entries()]
      .map(([name, items]) => ({
        name,
        batches: items.filter((a) => a.type === 'Batch').sort(byDate),
        individ: items.filter((a) => a.type !== 'Batch').sort(byDate),
        recips: items.reduce((n, a) => n + (a.count || 1), 0),
      }))
      .sort((x, y) => y.recips - x.recips || x.name.localeCompare(y.name));
  });

  // ---- Bulk batch review (approve all / some, preview one) ---------------
  batchTarget = signal<Approval | null>(null);
  batchSel = signal<Set<string>>(new Set<string>());
  batchPreview = signal<{ rec: IssuedRecord; img: string | null } | null>(null);
  batchRecs = computed<IssuedRecord[]>(() => {
    const a = this.batchTarget(); if (!a?.batchId) return [];
    return this.issued.records().filter((r) => r.batchId === a.batchId && r.status === 'Pending' && !r.signedBy);
  });
  batchSelCount = computed(() => this.batchSel().size);
  batchAllSel = computed(() => { const recs = this.batchRecs(); return recs.length > 0 && recs.every((r) => this.batchSel().has(r.id)); });
  batchTotal = computed(() => { const a = this.batchTarget(); if (!a?.batchId) return 0; return this.issued.records().filter((r) => r.batchId === a.batchId).length; });
  batchDone = computed(() => Math.max(0, this.batchTotal() - this.batchRecs().length));
  batchPct = computed(() => { const t = this.batchTotal(); return t ? Math.round((this.batchDone() / t) * 100) : 0; });
  openBatch(a: Approval): void {
    this.refreshSig();
    this.batchTarget.set(a); this.batchSel.set(new Set<string>());
    const recs = this.batchRecs();
    if (recs[0]) this.previewRecord(recs[0]); else this.batchPreview.set(null);
  }
  /** Click a recipient row: select it (for "Approve selected") and preview it. */
  pickRecord(rec: IssuedRecord): void { this.toggleBatchSel(rec.id); this.previewRecord(rec); }
  /** Deterministic gradient avatar colour per recipient (so each person is visually distinct). */
  avColor(s: string): string {
    const p = [['#6366f1', '#8b5cf6'], ['#0ea5e9', '#22d3ee'], ['#14b8a6', '#10b981'], ['#f59e0b', '#f97316'], ['#ec4899', '#f43f5e'], ['#8b5cf6', '#6366f1'], ['#0284c7', '#38bdf8'], ['#16a34a', '#4ade80']];
    const str = s || '?';
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    const c = p[h % p.length];
    return 'linear-gradient(135deg,' + c[0] + ',' + c[1] + ')';
  }
  closeBatch(): void { this.batchTarget.set(null); this.batchSel.set(new Set<string>()); this.batchPreview.set(null); }
  toggleBatchSel(id: string): void { const s = new Set(this.batchSel()); s.has(id) ? s.delete(id) : s.add(id); this.batchSel.set(s); }
  toggleBatchAll(): void { const recs = this.batchRecs(); const all = this.batchAllSel(); const s = new Set(this.batchSel()); recs.forEach((r) => (all ? s.delete(r.id) : s.add(r.id))); this.batchSel.set(s); }
  previewRecord(rec: IssuedRecord): void { this.batchPreview.set({ rec, img: rec.fileDataUrl ?? null }); this.renderBatchPreview(rec); }
  rejectOne(rec: IssuedRecord): void {
    const a = this.batchTarget(); if (!a) return;
    this.alerts.confirm({ tone: 'danger', icon: 'block', title: 'Reject this certificate?', message: (rec.recipientName || 'This recipient') + '’s credential will be rejected and won’t be delivered.', confirmText: 'Reject', cancelText: 'Cancel' }).then((ok) => {
      if (!ok) return;
      const remaining = this.svc.rejectBatchSubset(a, [rec.id], this.approver());
      this.batchPreview.set(null);
      const recs = this.batchRecs();
      if (remaining <= 0 || !recs.length) this.closeBatch(); else this.previewRecord(recs[0]);
      this.alerts.info('Rejected — ' + (rec.recipientName || 'recipient') + '.');
    });
  }
  rejectBatchSelected(): void {
    const a = this.batchTarget(); if (!a) return;
    const ids = [...this.batchSel()]; if (!ids.length) return;
    this.alerts.confirm({ tone: 'danger', icon: 'block', title: 'Reject ' + ids.length + ' certificate' + (ids.length === 1 ? '' : 's') + '?', message: 'The selected credentials will be rejected and won’t be delivered.', confirmText: 'Reject ' + ids.length, cancelText: 'Cancel' }).then((ok) => {
      if (!ok) return;
      const remaining = this.svc.rejectBatchSubset(a, ids, this.approver());
      this.batchSel.set(new Set<string>()); this.batchPreview.set(null);
      const recs = this.batchRecs();
      if (remaining <= 0 || !recs.length) this.closeBatch(); else this.previewRecord(recs[0]);
      this.alerts.info(ids.length + ' rejected.');
    });
  }
  private async renderBatchPreview(rec: IssuedRecord): Promise<void> {
    try {
      const t = await firstValueFrom(this.templates.get(rec.templateId));
      if (!t?.canvasJson || this.batchPreview()?.rec.id !== rec.id) return;
      const data = { ...rec.data };
      for (const k of Object.keys(data)) { if (/signature/i.test(k)) delete data[k]; }
      const json = mergeDataIntoJson(t.canvasJson, data);
      const img = await renderJsonToPng(json, t.width, t.height, 2, this.mySig(), !this.hasSig());
      if (this.batchPreview()?.rec.id === rec.id) this.batchPreview.set({ rec, img });
    } catch { /* keep fallback */ }
  }
  async approveOne(rec: IssuedRecord): Promise<void> {
    const a = this.batchTarget(); if (!a) return;
    if (!(await this.confirmApprove(1))) return;
    this.guard(async () => {
      const remaining = this.svc.approveBatchSubset(a, [rec.id], this.approver());
      await this.resignRecords([rec.id]);
      this.alerts.success('Approved & signed — ' + (rec.recipientName || 'recipient') + '.');
      this.batchPreview.set(null);
      const recs = this.batchRecs();
      if (remaining <= 0 || !recs.length) this.closeBatch(); else this.previewRecord(recs[0]);
    });
  }
  async approveBatchSelected(): Promise<void> {
    const a = this.batchTarget(); if (!a) return;
    const ids = [...this.batchSel()]; if (!ids.length) return;
    if (!(await this.confirmApprove(ids.length))) return;
    this.guard(async () => {
      const n = ids.length;
      const remaining = this.svc.approveBatchSubset(a, ids, this.approver());
      await this.resignRecords(ids);
      this.alerts.success(n + ' approved & signed.');
      this.batchSel.set(new Set<string>()); this.batchPreview.set(null);
      const recs = this.batchRecs();
      if (remaining <= 0 || !recs.length) this.closeBatch(); else this.previewRecord(recs[0]);
    });
  }
  async approveBatchAll(): Promise<void> {
    const a = this.batchTarget(); if (!a) return;
    const n = this.batchRecs().length;
    if (!(await this.confirmApprove(n))) return;
    this.guard(() => { this.svc.approve(a.id, this.approver()); this.resign(a); this.closeBatch(); this.alerts.success('Approved & signed all ' + n + ' recipient' + (n === 1 ? '' : 's') + '.'); });
  }
  private async resignRecords(ids: string[]): Promise<void> {
    const sig = this.mySig();
    const recs = this.issued.records().filter((r) => ids.includes(r.id));
    for (const r of recs) {
      try {
        const t = await firstValueFrom(this.templates.get(r.templateId));
        if (!t?.canvasJson) continue;
        const data = { ...r.data };
        for (const k of Object.keys(data)) { if (/signature/i.test(k)) delete data[k]; }
        const json = mergeDataIntoJson(t.canvasJson, data);
        const file = await renderJsonToPng(json, t.width, t.height, 2, sig);
        this.issued.update(r.id, { fileDataUrl: file });
      } catch { /* keep existing image */ }
    }
  }
}
