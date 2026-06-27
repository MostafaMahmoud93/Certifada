import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import * as XLSX from 'xlsx';
import { TemplateService } from '../../core/services/template.service';
import { TemplateDetail } from '../../core/models/models';
import { IssuedService, IssuedRecord, DeliveryStatus } from '../../core/services/issued.service';
import { PlanService } from '../../core/services/plan.service';
import { AlertService } from '../../core/services/alert.service';
import { ApprovalService } from '../../core/services/approval.service';
import { HasActionDirective } from '../../shared/directives/has-action.directive';
import { Actions } from '../../core/constants/actions';
import { mergeDataIntoJson, renderJsonToPng } from '../../core/utils/render.util';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';

interface BulkRow { email: string; data: Record<string, string>; }
interface Confetti { left: number; delay: number; dur: number; color: string; }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-issue',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, HasActionDirective, PaginatorComponent],
  template: `
  <nav class="crumbs"><a routerLink="/app/templates">Templates</a><span class="material-icons">chevron_right</span><span class="cur">Issue</span><a class="crumb-right" [routerLink]="['/app/templates', id, 'issued']"><span class="material-icons">insights</span> Insights</a></nav>

  @if (loading()) {
    <div class="state"><span class="material-icons spin">progress_activity</span><p class="cf-muted">Loading template…</p></div>
  } @else if (error()) {
    <div class="state"><span class="material-icons">cloud_off</span><h3>Couldn't load this template</h3><p class="cf-muted">{{ error() }}</p>
      <a class="cf-btn cf-btn-secondary" routerLink="/app/templates">Back to templates</a></div>
  } @else {

    <div class="hcard">
      <a class="back" routerLink="/app/templates" title="Back"><span class="material-icons">arrow_back</span></a>
      <span class="h-thumb">@if (template()?.thumbnailDataUrl) { <img [src]="template()!.thumbnailDataUrl" alt="" /> } @else { <span class="material-icons">workspace_premium</span> }</span>
      <div class="h-id">
        <h1>Issue certificates</h1>
        <div class="h-sub"><strong>{{ template()?.name || 'Template' }}</strong><span class="dot">·</span><span>{{ template()?.width }}×{{ template()?.height }}</span><span class="dot">·</span><span>{{ vars().length }} variable{{ vars().length === 1 ? '' : 's' }}</span>@if (offline()) { <span class="dot">·</span><span class="off"><span class="material-icons">wifi_off</span> offline</span> }</div>
      </div>
      <div class="h-quota" [class.warn]="quotaPct() >= 100">
        <div class="q-top"><span class="material-icons">bolt</span> Issued this period <b>{{ issuesUsed() }} / {{ quotaLabel() }}</b></div>
        <div class="q-bar"><span [style.width.%]="quotaPct()"></span></div>
      </div>
    </div>

    <div class="stats">
      <div class="stat"><div class="s-ic brand"><span class="material-icons">verified</span></div><div><div class="s-val">{{ stats().total }}</div><div class="s-lbl">Total issued</div></div></div>
      <div class="stat"><div class="s-ic ok"><span class="material-icons">mark_email_read</span></div><div><div class="s-val">{{ stats().sent }}</div><div class="s-lbl">Successfully sent</div>@if (stats().total) { <div class="s-sub">{{ successRate() }}% success</div> }</div></div>
      <div class="stat"><div class="s-ic warn"><span class="material-icons">schedule</span></div><div><div class="s-val">{{ stats().sending + stats().pending }}</div><div class="s-lbl">In progress</div></div></div>
      <div class="stat"><div class="s-ic bad"><span class="material-icons">error_outline</span></div><div><div class="s-val">{{ stats().failed + stats().revoked }}</div><div class="s-lbl">Failed / revoked</div></div></div>
    </div>

    <div class="tabs">
      <button [class.on]="tab() === 'one'" (click)="tab.set('one')"><span class="material-icons">person_add</span><span class="t-txt"><b>Issue One by One</b><small>Single recipient + live preview</small></span></button>
      <button [class.on]="tab() === 'bulk'" (click)="tab.set('bulk')"><span class="material-icons">groups</span><span class="t-txt"><b>Issue Bulk</b><small>Many at once from a sheet</small></span></button>
    </div>

    @if (tab() === 'one') {
      <div class="panel">
        @if (lastIssued(); as r) {
          <div class="success">
            <div class="confetti">@for (c of confetti; track $index) { <i [style.left.%]="c.left" [style.animation-delay.s]="c.delay" [style.animation-duration.s]="c.dur" [style.background]="c.color"></i> }</div>
            <div class="su-badge"><span class="material-icons">check</span></div>
            <h2>@if (r.status === 'Pending') { Submitted for approval ⏳ } @else { Certificate issued! 🎉 }</h2>
            <p>@if (r.status === 'Pending') { Waiting for an approver — <strong>{{ r.recipientEmail }}</strong> receives it once the signature is approved. } @else { On its way to <strong>{{ r.recipientEmail }}</strong> — track delivery in the history below. }</p>
            @if (r.fileDataUrl || template()?.thumbnailDataUrl) { <div class="su-cert"><img [src]="r.fileDataUrl || template()!.thumbnailDataUrl" alt="issued certificate" /></div> }
            <div class="su-actions">
              <button class="cf-btn cf-btn-primary" (click)="issueAnother()"><span class="material-icons">add</span> Issue another</button>
              @if (r.fileDataUrl) { <button class="cf-btn cf-btn-secondary" (click)="download(r)"><span class="material-icons">download</span> Download</button> }
            </div>
          </div>
        } @else {
          <p class="lead"><span class="material-icons">tips_and_updates</span> Fill in the recipient, watch the live preview, and send — done in seconds.</p>
          <div class="two-col" [class.solo]="!showPreview()">
            <div class="form-side">
              <div class="sec-row"><span class="sec-ic"><span class="material-icons">badge</span></span><h3 class="sec">Recipient details</h3>@if (totalFields()) { <span class="fld-prog" [class.done]="filledFields() === totalFields()"><span class="material-icons">{{ filledFields() === totalFields() ? 'task_alt' : 'pending' }}</span>{{ filledFields() }}/{{ totalFields() }}</span> }</div>
              <div class="field">
                <label>Recipient Email <span class="req">*</span></label>
                <div class="inp" [class.bad]="email() && !emailOk()" [class.ok]="emailOk()"><span class="material-icons">mail</span><input type="email" [value]="email()" (input)="email.set($any($event.target).value)" placeholder="recipient@email.com" />@if (emailOk()) { <span class="material-icons tick">check_circle</span> }</div>
                @if (email() && !emailOk()) { <small class="err">Enter a valid email address.</small> }
              </div>
              @if (vars().length) {
                <div class="fields-grid">
                  @for (v of vars(); track v) {
                    <div class="field" [class.full]="longField(v)"><label>{{ pretty(v) }} <span class="req">*</span></label><div class="inp" [class.ok]="fieldFilled(v)"><span class="material-icons">data_object</span><input [value]="form()[v] || ''" (input)="setField(v, $any($event.target).value)" [placeholder]="pretty(v)" />@if (fieldFilled(v)) { <span class="material-icons tick">check_circle</span> }</div></div>
                  }
                </div>
              }
              @if (!vars().length) { <p class="cf-muted sm">This template has no variables — only the recipient email is needed.</p> }
              @if (hasSignature()) {
                <div class="sig-note"><span class="material-icons">draw</span><div class="sn-txt"><b>Signature handled for you</b><span>Your saved signature is applied automatically. This credential is sent for approval, and the signature appears once approved.</span></div></div>
              }
              <div class="form-actions">
                <button class="cf-btn cf-btn-secondary" (click)="updatePreview()" [disabled]="previewing()"><span class="material-icons">{{ previewing() ? 'progress_activity' : (showPreview() ? 'refresh' : 'visibility') }}</span> {{ previewing() ? 'Rendering…' : (showPreview() ? 'Update preview' : 'Show preview') }}</button>
                <button class="cf-btn cf-btn-primary" (click)="issueOne()" [disabled]="!oneValid() || issuing()" [appHasAction]="A.Credential_Generate" [tooltipMessage]="'🔒 Issuing isn\\'t in your plan.'"><span class="material-icons">send</span> {{ issuing() ? 'Issuing…' : 'Issue & send' }}</button>
              </div>
              <div class="ready" [class.go]="oneValid()"><span class="material-icons">{{ oneValid() ? 'check_circle' : 'edit_note' }}</span>{{ oneValid() ? 'Ready to issue to ' + email() : 'Fill the email and all fields to issue.' }}</div>
            </div>
            @if (showPreview()) {
            <div class="preview-side">
              <div class="pv-head"><span class="sec">Preview design</span><div class="pv-tools"><span class="live"><span class="d"></span>Live</span>@if (previewUrl()) { <button class="ic sm" (click)="downloadPreview()" title="Download preview"><span class="material-icons">download</span></button> }<button class="ic sm" (click)="showPreview.set(false)" title="Hide preview"><span class="material-icons">visibility_off</span></button></div></div>
              @if (hasSignature()) { <div class="pv-pending"><span class="material-icons">verified_user</span> Has a signature — it is sent for approval; the signature appears once approved.</div> }
              <div class="preview-frame">
                @if (previewUrl()) { <img [src]="previewUrl()" alt="preview" /> }
                @else if (template()?.thumbnailDataUrl) { <img [src]="template()!.thumbnailDataUrl" alt="preview" /> }
                @else { <div class="pv-empty"><span class="material-icons">image</span><span>Fill the fields and update the preview</span></div> }
              </div>
              <small class="cf-muted sm">Your values are merged into the real design and rendered above.</small>
            </div>
            }
          </div>
        }
      </div>
    } @else {
      <div class="panel">
        @if (bulkResult(); as br) {
          <div class="success">
            <div class="confetti">@for (c of confetti; track $index) { <i [style.left.%]="c.left" [style.animation-delay.s]="c.delay" [style.animation-duration.s]="c.dur" [style.background]="c.color"></i> }</div>
            <div class="su-badge"><span class="material-icons">check</span></div>
            <h2>{{ br.count }} certificate{{ br.count === 1 ? '' : 's' }} issued! 🎉</h2>
            <p>Delivery is tracked live in the history below.</p>
            <div class="su-actions"><button class="cf-btn cf-btn-primary" (click)="bulkResult.set(null)"><span class="material-icons">upload_file</span> Issue more</button></div>
          </div>
        } @else {
          <p class="lead"><span class="material-icons">tips_and_updates</span> Have many recipients? Grab the ready-made sheet, fill a row each, upload, and we'll issue them all.</p>
          <div class="steps">
            <div class="step"><span class="step-n">1</span><div class="bi-txt"><strong>Download the tailored sheet</strong><span class="cf-muted">Exact columns — Recipient Email + {{ vars().length }} field{{ vars().length === 1 ? '' : 's' }}.</span></div><button class="cf-btn cf-btn-secondary" (click)="downloadCsvTemplate()"><span class="material-icons">download</span> Download CSV</button></div>
            <div class="step-line"></div>
            <div class="step"><span class="step-n">2</span><div class="bi-txt"><strong>Fill it, then drop it back</strong><span class="cf-muted">One recipient per row.</span></div></div>
          </div>
          <label class="dropzone" [class.drag]="dragOver()" [class.has]="rows().length" (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)" (drop)="onDrop($event)">
            <input type="file" accept=".csv,.xlsx,.xls" hidden (change)="onFile($event)" />
            @if (parsing()) { <span class="dz-in"><span class="material-icons spin">progress_activity</span> Reading…</span> }
            @else if (fileName()) { <span class="dz-in"><span class="material-icons">description</span><b>{{ fileName() }}</b><em>{{ rows().length }} row{{ rows().length === 1 ? '' : 's' }} · click to replace</em></span> }
            @else { <span class="dz-in ph"><span class="material-icons">cloud_upload</span><b>Drop your spreadsheet</b><em>CSV, XLSX or XLS</em></span> }
          </label>

          @if (rows().length) {
            <div class="valgrid">
              <div class="vstat ok"><span class="material-icons">check_circle</span><b>{{ validRows().length }}</b> ready</div>
              <div class="vstat bad" [class.zero]="bulkErrors().length === 0"><span class="material-icons">error_outline</span><b>{{ bulkErrors().length }}</b> to fix</div>
              <div class="vstat tot"><span class="material-icons">table_rows</span><b>{{ rows().length }}</b> rows</div>
            </div>
            <div class="tablewrap">
              <table class="cf-table b-table">
                <thead><tr><th>#</th><th>Recipient Email</th>@for (v of vars(); track v) { <th>{{ pretty(v) }}</th> }<th>Status</th><th></th></tr></thead>
                <tbody>
                  @for (r of rows(); track $index) {
                    <tr [class.row-bad]="!rowOk(r)">
                      <td class="cf-muted">{{ $index + 1 }}</td>
                      <td [class.cell-bad]="!emailValid(r.email)">{{ r.email || '—' }}</td>
                      @for (v of vars(); track v) { <td>{{ r.data[v] || '—' }}</td> }
                      <td>@if (rowOk(r)) { <span class="cf-badge cf-badge-success">Valid</span> } @else { <span class="cf-badge cf-badge-danger">{{ rowProblem(r) }}</span> }</td>
                      <td><button class="ic sm" (click)="removeRow($index)" title="Remove row"><span class="material-icons">close</span></button></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            @if (issuingBulk()) {
              <div class="bprog"><div class="bp-top"><span class="material-icons spin">progress_activity</span> Issuing… <b>{{ bulkProgress() }} / {{ bulkTotal() }}</b></div><div class="bp-bar"><span [style.width.%]="bulkPct()"></span></div></div>
            } @else {
              <div class="form-actions end">
                <button class="cf-btn cf-btn-secondary" (click)="clearRows()">Clear</button>
                <button class="cf-btn cf-btn-primary" (click)="issueBulk()" [disabled]="!validRows().length" [appHasAction]="A.Credential_Bulk" [tooltipMessage]="'🔒 Bulk issuing isn\\'t in your plan.'"><span class="material-icons">send</span> Issue {{ validRows().length }} certificate{{ validRows().length === 1 ? '' : 's' }}</button>
              </div>
            }
          }
        }
      </div>
    }

    <!-- history -->
    <div class="hist">
      <div class="hist-head">
        <div class="sec-row"><span class="sec-ic"><span class="material-icons">history</span></span><h3 class="sec">Issued credentials history</h3></div>
        @if (history().length) {
          <div class="hist-tools">
            <div class="hsearch"><span class="material-icons">search</span><input [value]="historyQuery()" (input)="historyQuery.set($any($event.target).value); histPage.set(1)" placeholder="Search email or fields…" /></div>
            <div class="chips"><button [class.on]="historyStatus() === 'all'" (click)="historyStatus.set('all'); histPage.set(1)">All</button><button [class.on]="historyStatus() === 'Sent'" (click)="historyStatus.set('Sent'); histPage.set(1)">Sent</button><button [class.on]="historyStatus() === 'Failed'" (click)="historyStatus.set('Failed'); histPage.set(1)">Failed</button><button [class.on]="historyStatus() === 'Revoked'" (click)="historyStatus.set('Revoked'); histPage.set(1)">Revoked</button></div>
          </div>
        }
      </div>
      @if (history().length === 0) {
        <div class="hist-empty"><div class="he-badge"><span class="material-icons">workspace_premium</span></div><p>No credentials issued yet</p><span class="cf-muted sm">Issue your first one above — it'll appear here instantly.</span></div>
      } @else if (filteredHistory().length === 0) {
        <div class="hist-empty"><div class="he-badge muted"><span class="material-icons">search_off</span></div><p>No matches</p><span class="cf-muted sm">Try a different search or filter.</span></div>
      } @else {
        <div class="tablewrap">
          <table class="cf-table h-table">
            <thead><tr><th>Recipient</th><th>Variable fields</th><th>Delivery status</th><th>Issued on</th><th class="ta-end">Actions</th></tr></thead>
            <tbody>
              @for (r of pagedHistory(); track r.id) {
                <tr [class.sending-row]="r.status === 'Sending'">
                  <td><div class="recip"><span class="av">{{ initials(r) }}</span><div class="rc"><strong>{{ r.recipientEmail || '—' }}</strong>@if (r.recipientName && r.recipientName !== r.recipientEmail) { <small class="cf-muted">{{ r.recipientName }}</small> }</div></div></td>
                  <td class="fields" [title]="fieldsText(r)">{{ fieldsText(r) || '—' }}</td>
                  <td><span class="cf-badge st" [ngClass]="badgeClass(r.status)">@if (r.status === 'Sending') { <span class="spin-dot"></span> } @else { <span class="dot"></span> }{{ statusLabel(r.status) }}</span></td>
                  <td><div class="when"><span>{{ r.createdAt | date: 'mediumDate' }}</span><small class="cf-muted">{{ relativeTime(r.createdAt) }}</small></div></td>
                  <td class="ta-end">
                    <div class="actbar">
                      @if (vars().length) {
                        <button class="act edit" (click)="openEdit(r)" [disabled]="r.status === 'Sending'" title="Edit variables"><span class="material-icons">tune</span></button>
                      }
                      <button class="act dl" (click)="download(r)" title="Download"><span class="material-icons">download</span></button>
                      @if (r.status === 'Failed') {
                        <button class="act retry" (click)="resendRow(r)" title="Retry sending"><span class="material-icons">refresh</span></button>
                      } @else {
                        <button class="act send" (click)="resendRow(r)" [disabled]="r.status === 'Sending'" title="Resend"><span class="material-icons">forward_to_inbox</span></button>
                      }
                      <span class="act-div"></span>
                      <button class="act danger" (click)="revoke(r)" [disabled]="r.status === 'Sending'" title="Revoke"><span class="material-icons">block</span></button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <app-paginator [total]="filteredHistory().length" [page]="histSafe()" [pageSize]="histSize()" (pageChange)="histPage.set($event)" (pageSizeChange)="histSize.set($event); histPage.set(1)" icon="verified" label="credentials"></app-paginator>
      }
    </div>

    <!-- edit-variables popup -->
    @if (editRec(); as er) {
      <div class="overlay" (click)="closeEdit()">
        <div class="emodal" (click)="$event.stopPropagation()">
          <button class="close" (click)="closeEdit()"><span class="material-icons">close</span></button>
          <div class="m-head"><span class="m-ic"><span class="material-icons">tune</span></span><div><h3>Edit credential</h3><p class="cf-muted sm">Update the values and re-send to the recipient.</p></div></div>
          <div class="field"><label>Recipient Email <span class="req">*</span></label><div class="inp" [class.bad]="editEmail() && !editEmailOk()"><span class="material-icons">mail</span><input type="email" [value]="editEmail()" (input)="editEmail.set($any($event.target).value)" /></div></div>
          @for (v of vars(); track v) { <div class="field"><label>{{ pretty(v) }} <span class="req">*</span></label><div class="inp"><span class="material-icons">data_object</span><input [value]="editForm()[v] || ''" (input)="setEditField(v, $any($event.target).value)" /></div></div> }
          @if (!vars().length) { <p class="cf-muted sm">This template has no variables — you can update the recipient email.</p> }
          <div class="modal-actions"><button class="cf-btn cf-btn-secondary" (click)="closeEdit()">Cancel</button><button class="cf-btn cf-btn-primary" (click)="saveEdit()" [disabled]="!editValid() || savingEdit()"><span class="material-icons">send</span> {{ savingEdit() ? 'Saving…' : 'Save & re-send' }}</button></div>
        </div>
      </div>
    }
  }
  `,
  styles: [`
    :host{display:block;width:100%}
    .crumbs{display:flex;align-items:center;gap:4px;font-size:12.5px;margin-bottom:14px;color:var(--cf-ink-400)}
    .crumbs a{color:var(--cf-ink-500);text-decoration:none}.crumbs a:hover{color:var(--cf-brand-600)}
    .crumbs .material-icons{font-size:16px}.crumbs .cur{color:var(--cf-ink-800);font-weight:600}.crumb-right{margin-inline-start:auto;display:inline-flex;align-items:center;gap:4px;color:var(--cf-brand-600);text-decoration:none;font-weight:600}.crumb-right:hover{text-decoration:underline}.crumb-right .material-icons{font-size:15px}
    .state{max-width:420px;margin:12vh auto;text-align:center;color:var(--cf-ink-600)}
    .state .material-icons{font-size:42px;color:var(--cf-brand-500)}
    .spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}

    .hcard{display:flex;align-items:center;gap:14px;padding:16px 18px;border:1px solid var(--cf-line);border-radius:16px;background:linear-gradient(120deg,color-mix(in srgb,var(--cf-brand-500) 8%,var(--cf-surface)),var(--cf-surface) 62%);box-shadow:0 1px 2px rgba(15,23,42,.04);margin-bottom:16px}
    .back{width:38px;height:38px;border-radius:10px;border:1px solid var(--cf-line);display:grid;place-items:center;color:var(--cf-ink-600);text-decoration:none;flex:none;background:var(--cf-surface)}
    .back:hover{background:var(--cf-surface-2);color:var(--cf-ink-900)}
    .h-thumb{width:56px;height:42px;border-radius:10px;background:var(--cf-surface-2);border:1px solid var(--cf-line);display:grid;place-items:center;overflow:hidden;flex:none;color:var(--cf-brand-600)}
    .h-thumb img{width:100%;height:100%;object-fit:cover}
    .h-id{flex:1;min-width:0}.h-id h1{font-size:20px;font-weight:800;letter-spacing:-.02em;color:var(--cf-ink-900)}
    .h-sub{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12.5px;color:var(--cf-ink-500);margin-top:3px}
    .h-sub strong{color:var(--cf-ink-800)}.h-sub .dot{color:var(--cf-ink-300)}
    .off{display:inline-flex;align-items:center;gap:3px;color:var(--cf-warning);font-weight:600}.off .material-icons{font-size:14px}
    .h-quota{min-width:190px;flex:none}
    .q-top{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--cf-ink-600)}
    .q-top b{margin-inline-start:auto;color:var(--cf-ink-900);font-variant-numeric:tabular-nums}.q-top .material-icons{font-size:15px;color:var(--cf-brand-600)}
    .q-bar{height:6px;border-radius:999px;background:var(--cf-surface-2);border:1px solid var(--cf-line);margin-top:6px;overflow:hidden}
    .q-bar span{display:block;height:100%;background:linear-gradient(90deg,var(--cf-brand-500),var(--cf-brand-600));transition:width .5s}
    .h-quota.warn .q-bar span{background:linear-gradient(90deg,#f59e0b,var(--cf-danger))}
    @media(max-width:720px){.h-quota{display:none}}

    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}
    .stat{display:flex;align-items:center;gap:12px;padding:14px 16px;border:1px solid var(--cf-line);border-radius:14px;background:var(--cf-surface);box-shadow:0 1px 2px rgba(15,23,42,.04)}
    .s-ic{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;flex:none}.s-ic .material-icons{font-size:21px}
    .s-ic.brand{background:var(--cf-brand-50);color:var(--cf-brand-600)}.s-ic.ok{background:color-mix(in srgb,#16a34a 14%,transparent);color:#16a34a}
    .s-ic.warn{background:color-mix(in srgb,#f59e0b 16%,transparent);color:#d97706}.s-ic.bad{background:var(--cf-danger-soft);color:var(--cf-danger)}
    .s-val{font-size:23px;font-weight:800;letter-spacing:-.02em;color:var(--cf-ink-900);line-height:1}
    .s-lbl{font-size:12px;color:var(--cf-ink-500);margin-top:3px}.s-sub{font-size:10.5px;color:#16a34a;font-weight:700;margin-top:2px}
    @media(max-width:760px){.stats{grid-template-columns:repeat(2,1fr)}}

    .tabs{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
    .tabs button{display:flex;align-items:center;gap:11px;border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-600);font:inherit;padding:13px 16px;border-radius:13px;cursor:pointer;text-align:start;transition:border-color .14s,box-shadow .14s,background .14s}
    .tabs button .material-icons{font-size:22px;color:var(--cf-ink-400)}
    .tabs button .t-txt{display:flex;flex-direction:column;gap:1px}.tabs button .t-txt b{font-size:14px;color:var(--cf-ink-800)}.tabs button .t-txt small{font-size:11.5px;color:var(--cf-ink-400)}
    .tabs button.on{border-color:var(--cf-brand-500);background:var(--cf-brand-50);box-shadow:0 6px 18px -10px color-mix(in srgb,var(--cf-brand-600) 60%,transparent)}
    .tabs button.on .material-icons{color:var(--cf-brand-600)}.tabs button.on .t-txt b{color:var(--cf-brand-700)}

    .panel{position:relative;border:1px solid var(--cf-line);border-radius:16px;background:var(--cf-surface);padding:22px;box-shadow:0 1px 2px rgba(15,23,42,.04)}
    .lead{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--cf-ink-600);background:var(--cf-surface-2);border:1px solid var(--cf-line);border-radius:11px;padding:10px 13px;margin-bottom:18px}
    .lead .material-icons{font-size:18px;color:var(--cf-brand-600)}
    .two-col{display:grid;grid-template-columns:1fr 1.05fr;gap:26px}
    .two-col.solo{grid-template-columns:1fr}
    @media(max-width:820px){.two-col{grid-template-columns:1fr}}
    .pv-pending{display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:9px 12px;border-radius:10px;font-size:12px;font-weight:600;background:color-mix(in srgb,#d97706 12%,transparent);color:#b45309;border:1px solid color-mix(in srgb,#d97706 28%,transparent)}
    .pv-pending .material-icons{font-size:16px}
    .sec-row{display:flex;align-items:center;gap:9px;margin-bottom:15px}
    .sec-ic{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:color-mix(in srgb,var(--cf-brand-500) 12%,transparent);color:var(--cf-brand-600)}.sec-ic .material-icons{font-size:16px}
    .sec{font-size:13.5px;font-weight:700;color:var(--cf-ink-900)}
    .field{display:flex;flex-direction:column;gap:6px;margin-bottom:13px}
    .fields-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(232px,1fr));gap:13px 16px;margin-bottom:2px}
    .fields-grid .field{margin-bottom:0}
    .field.full{grid-column:1 / -1}
    .two-col:not(.solo) .fields-grid{grid-template-columns:1fr}
    .fld-prog{display:inline-flex;align-items:center;gap:4px;margin-inline-start:auto;font-size:11px;font-weight:700;color:var(--cf-ink-500);background:var(--cf-surface-2);border:1px solid var(--cf-line);padding:3px 9px 3px 7px;border-radius:999px;transition:color .16s,background .16s,border-color .16s}
    .fld-prog .material-icons{font-size:13px}
    .fld-prog.done{color:#15803d;background:color-mix(in srgb,#16a34a 12%,transparent);border-color:color-mix(in srgb,#16a34a 30%,transparent)}
    .field label{font-size:12.5px;font-weight:600;color:var(--cf-ink-700)}.req{color:var(--cf-danger)}
    .inp{display:flex;align-items:center;gap:8px;height:42px;padding:0 12px;border:1px solid var(--cf-line);border-radius:10px;background:var(--cf-surface);transition:border-color .14s,box-shadow .14s}
    .inp:hover{border-color:color-mix(in srgb,var(--cf-brand-500) 38%,var(--cf-line))}
    .inp:focus-within{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .inp.bad{border-color:var(--cf-danger)}.inp.ok{border-color:color-mix(in srgb,#16a34a 50%,var(--cf-line))}
    .inp>.material-icons{font-size:18px;color:var(--cf-ink-400)}.inp .tick{color:#16a34a;margin-inline-start:auto}
    .inp input{flex:1;border:0;background:none;outline:none;font:inherit;font-size:13.5px;color:var(--cf-ink-900)}
    .err{font-size:11.5px;color:var(--cf-danger)}.sm{font-size:12.5px}
    .form-actions{display:flex;gap:10px;margin-top:6px}.form-actions.end{justify-content:flex-end;margin-top:16px}
    .form-actions .cf-btn{display:inline-flex;align-items:center;gap:6px}.form-actions .material-icons{font-size:17px}
    .cf-btn:disabled{opacity:.5;cursor:not-allowed}
    .ready{display:flex;align-items:center;gap:7px;margin-top:13px;padding:10px 12px;border-radius:10px;font-size:12.5px;font-weight:600;background:var(--cf-surface-2);color:var(--cf-ink-500);border:1px solid var(--cf-line)}
    .ready .material-icons{font-size:17px}
    .sig-note{display:flex;align-items:flex-start;gap:10px;margin:4px 0 8px;padding:11px 13px;border-radius:11px;background:color-mix(in srgb,var(--cf-brand-500) 7%,transparent);border:1px solid color-mix(in srgb,var(--cf-brand-500) 22%,transparent)}
    .sig-note>.material-icons{font-size:18px;color:var(--cf-brand-600);margin-top:1px}
    .sig-note .sn-txt{display:flex;flex-direction:column;gap:2px}
    .sig-note .sn-txt b{font-size:12.5px;color:var(--cf-ink-900)}
    .sig-note .sn-txt span{font-size:11.5px;color:var(--cf-ink-500);line-height:1.45}
    .ready.go{background:color-mix(in srgb,#16a34a 10%,transparent);color:#15803d;border-color:color-mix(in srgb,#16a34a 26%,transparent)}
    .preview-side{position:sticky;top:14px;align-self:start}
    @media(max-width:820px){.preview-side{position:static}}
    .pv-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
    .pv-tools{display:flex;align-items:center;gap:8px}
    .live{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:#16a34a}
    .live .d{width:7px;height:7px;border-radius:50%;background:#16a34a;animation:pulse 1.6s infinite}
    @keyframes pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,#16a34a 55%,transparent)}70%{box-shadow:0 0 0 6px transparent}100%{box-shadow:0 0 0 0 transparent}}
    .preview-frame{position:relative;border:1px solid var(--cf-line);border-radius:14px;overflow:hidden;padding:18px;background:radial-gradient(130% 90% at 50% -15%,color-mix(in srgb,var(--cf-brand-500) 7%,var(--cf-surface-2)),var(--cf-surface-2));min-height:240px;display:grid;place-items:center}
    .preview-frame img{max-width:100%;max-height:540px;width:auto;height:auto;object-fit:contain;display:block;border-radius:7px;box-shadow:0 16px 38px -16px rgba(15,23,42,.36),0 2px 8px rgba(15,23,42,.06)}
    .pv-empty{display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--cf-ink-400);padding:44px;text-align:center;font-size:12.5px}.pv-empty .material-icons{font-size:34px}

    .success{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;padding:26px 16px 8px;overflow:hidden}
    .su-badge{width:72px;height:72px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;box-shadow:0 14px 34px -12px rgba(22,163,74,.7);animation:pop .45s cubic-bezier(.2,1.3,.4,1) both;z-index:2}
    .su-badge .material-icons{font-size:40px}
    @keyframes pop{0%{transform:scale(0)}60%{transform:scale(1.18)}100%{transform:scale(1)}}
    .success h2{font-size:21px;font-weight:800;letter-spacing:-.02em;color:var(--cf-ink-900);margin-top:16px}
    .success p{font-size:14px;color:var(--cf-ink-600);margin-top:5px}.success p strong{color:var(--cf-ink-900)}
    .su-cert{margin-top:16px;max-width:340px;width:100%;border:1px solid var(--cf-line);border-radius:12px;overflow:hidden;box-shadow:0 16px 40px -18px rgba(15,23,42,.4);animation:rise .5s ease both;animation-delay:.1s}
    .su-cert img{width:100%;display:block}
    @keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
    .su-actions{display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;justify-content:center}
    .su-actions .cf-btn{display:inline-flex;align-items:center;gap:6px}.su-actions .material-icons{font-size:17px}
    .confetti{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:1}
    .confetti i{position:absolute;top:-14px;width:8px;height:13px;border-radius:2px;opacity:0;animation-name:fall;animation-timing-function:linear;animation-fill-mode:forwards}
    @keyframes fall{0%{transform:translateY(-10px) rotate(0);opacity:1}100%{transform:translateY(360px) rotate(560deg);opacity:0}}

    .steps{display:flex;align-items:center;gap:14px;margin-bottom:16px;flex-wrap:wrap}
    .step{display:flex;align-items:center;gap:12px;flex:1;min-width:240px}
    .step-line{flex:0 0 30px;height:2px;background:var(--cf-line);border-radius:2px}
    .step-n{width:28px;height:28px;border-radius:50%;background:var(--cf-brand-600);color:#fff;font-size:13px;font-weight:700;display:grid;place-items:center;flex:none}
    .bi-txt{flex:1;display:flex;flex-direction:column}.bi-txt strong{font-size:13.5px;color:var(--cf-ink-900)}.bi-txt .cf-muted{font-size:12px}
    .step .cf-btn{flex:none;display:inline-flex;align-items:center;gap:6px}.step .material-icons{font-size:17px}
    .dropzone{display:grid;place-items:center;min-height:128px;border:1.5px dashed var(--cf-line);border-radius:14px;cursor:pointer;background:var(--cf-surface-2);transition:border-color .14s,box-shadow .14s,background .14s;text-align:center}
    .dropzone:hover{border-color:var(--cf-brand-400)}.dropzone.drag{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring);background:var(--cf-brand-50)}
    .dropzone.has{border-style:solid;border-color:color-mix(in srgb,#16a34a 40%,var(--cf-line));background:color-mix(in srgb,#16a34a 6%,var(--cf-surface))}
    .dz-in{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:13px;color:var(--cf-ink-700)}
    .dz-in b{color:var(--cf-ink-900);font-size:13.5px}.dz-in em{font-size:11px;font-style:normal;color:var(--cf-ink-400)}
    .dz-in.ph .material-icons{font-size:30px;color:var(--cf-brand-500)}.dz-in .material-icons{font-size:24px;color:#16a34a}
    .valgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:16px}
    .vstat{display:flex;align-items:center;gap:8px;padding:10px 13px;border-radius:11px;font-size:13px;font-weight:600;border:1px solid var(--cf-line);background:var(--cf-surface)}
    .vstat b{font-size:16px;font-weight:800}.vstat .material-icons{font-size:18px}
    .vstat.ok{color:#15803d}.vstat.ok .material-icons{color:#16a34a}
    .vstat.bad{color:var(--cf-danger)}.vstat.bad .material-icons{color:var(--cf-danger)}
    .vstat.bad.zero{color:var(--cf-ink-400);opacity:.7}.vstat.bad.zero .material-icons{color:var(--cf-ink-400)}
    .vstat.tot{color:var(--cf-ink-600)}.vstat.tot .material-icons{color:var(--cf-ink-400)}
    .bprog{margin-top:16px;padding:14px 16px;border:1px solid var(--cf-line);border-radius:12px;background:var(--cf-surface-2)}
    .bp-top{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--cf-ink-700)}
    .bp-top b{margin-inline-start:auto;color:var(--cf-ink-900)}.bp-top .material-icons{font-size:18px;color:var(--cf-brand-600)}
    .bp-bar{height:8px;border-radius:999px;background:var(--cf-surface);border:1px solid var(--cf-line);margin-top:9px;overflow:hidden}
    .bp-bar span{display:block;height:100%;background:linear-gradient(90deg,var(--cf-brand-500),var(--cf-brand-600));transition:width .3s}

    .tablewrap{overflow-x:auto;border:1px solid var(--cf-line);border-radius:12px;margin-top:14px;background:var(--cf-surface)}
    .cf-table{width:100%;border-collapse:collapse;font-size:13px}
    .cf-table th{position:sticky;top:0;background:var(--cf-surface-2);font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--cf-ink-500);font-weight:700;text-align:start;padding:10px 13px;border-bottom:1px solid var(--cf-line);white-space:nowrap}
    .cf-table td{padding:9px 13px;border-bottom:1px solid var(--cf-line-soft);vertical-align:middle}
    .cf-table tr:last-child td{border-bottom:0}
    .ta-end{text-align:end}.row-bad{background:var(--cf-danger-soft)}.cell-bad{color:var(--cf-danger);font-weight:600}
    .sending-row{background:color-mix(in srgb,var(--cf-brand-500) 5%,transparent)}
    @keyframes rowInI{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
    .h-table tbody tr,.b-table tbody tr{animation:rowInI .3s ease both}
    .h-table tbody tr:nth-child(2),.b-table tbody tr:nth-child(2){animation-delay:.03s}.h-table tbody tr:nth-child(3),.b-table tbody tr:nth-child(3){animation-delay:.06s}.h-table tbody tr:nth-child(4),.b-table tbody tr:nth-child(4){animation-delay:.09s}.h-table tbody tr:nth-child(5),.b-table tbody tr:nth-child(5){animation-delay:.12s}.h-table tbody tr:nth-child(n+6),.b-table tbody tr:nth-child(n+6){animation-delay:.15s}
    .h-table .fields{max-width:240px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--cf-ink-600)}
    .recip{display:flex;align-items:center;gap:10px}
    .av{width:32px;height:32px;border-radius:50%;background:var(--cf-brand-50);color:var(--cf-brand-700);border:1px solid var(--cf-brand-100);display:grid;place-items:center;font-size:11.5px;font-weight:700;flex:none}
    .rc{display:flex;flex-direction:column;min-width:0}.rc strong{font-size:13px;color:var(--cf-ink-900);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px}.rc small{font-size:11px}
    .when{display:flex;flex-direction:column}.when span{font-size:12.5px;color:var(--cf-ink-700)}.when small{font-size:10.5px}
    .cf-badge.st{display:inline-flex;align-items:center}
    .cf-badge .dot{width:6px;height:6px;border-radius:50%;background:currentColor;display:inline-block;margin-inline-end:5px;vertical-align:middle}
    .spin-dot{width:10px;height:10px;border-radius:50%;border:2px solid currentColor;border-top-color:transparent;display:inline-block;margin-inline-end:6px;vertical-align:middle;animation:spin .7s linear infinite}
    .st-sending{background:var(--cf-brand-50);color:var(--cf-brand-700);border:1px solid var(--cf-brand-100)}
    .st-revoked{background:var(--cf-surface-2);color:var(--cf-ink-500);border:1px solid var(--cf-line)}
    .actbar{display:inline-flex;align-items:center;gap:1px;padding:3px;border:1px solid var(--cf-line);border-radius:10px;background:var(--cf-surface);box-shadow:0 1px 2px rgba(15,23,42,.05);transition:box-shadow .16s,border-color .16s}
    .actbar:hover{box-shadow:0 6px 16px -10px rgba(15,23,42,.3);border-color:color-mix(in srgb,var(--cf-brand-500) 24%,var(--cf-line))}
    .act{width:28px;height:28px;display:grid;place-items:center;border:0;background:none;border-radius:8px;color:var(--cf-ink-400);cursor:pointer;transition:background .15s,color .15s,transform .12s}
    .act .material-icons{font-size:16px;transition:transform .25s cubic-bezier(.2,1.3,.4,1)}
    .act:hover:not(:disabled){background:var(--cf-surface-2)}
    .act:active:not(:disabled){transform:scale(.88)}
    .act:disabled{opacity:.4;cursor:not-allowed}
    .act.edit:hover:not(:disabled){color:var(--cf-brand-600)}
    .act.edit:hover:not(:disabled) .material-icons{transform:rotate(90deg)}
    .act.dl:hover:not(:disabled){color:#0284c7}
    .act.dl:hover:not(:disabled) .material-icons{transform:translateY(2px)}
    .act.send:hover:not(:disabled){color:#16a34a}
    .act.send:hover:not(:disabled) .material-icons{transform:translateX(2px) rotate(-8deg)}
    .act.danger:hover:not(:disabled){color:var(--cf-danger)}
    .act.danger:hover:not(:disabled) .material-icons{transform:rotate(90deg)}
    .act.retry{color:#d97706;background:color-mix(in srgb,#f59e0b 14%,transparent);animation:retry-pulse 2.2s ease-in-out infinite}
    .act.retry:hover .material-icons{transform:rotate(180deg)}
    @keyframes retry-pulse{0%,100%{box-shadow:0 0 0 0 transparent}50%{box-shadow:0 0 0 2px color-mix(in srgb,#f59e0b 26%,transparent)}}
    .act-div{width:1px;height:16px;background:var(--cf-line);margin:0 2px}
    .ic{width:32px;height:32px;border-radius:8px;border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-500);display:grid;place-items:center;cursor:pointer}
    .ic.sm{width:28px;height:28px}.ic:hover{background:var(--cf-surface-2);color:var(--cf-ink-900)}.ic .material-icons{font-size:16px}

    .hist{margin-top:24px}
    .hist-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;flex-wrap:wrap}
    .hist-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .hsearch{display:flex;align-items:center;gap:7px;height:38px;padding:0 11px;border:1px solid var(--cf-line);border-radius:10px;background:var(--cf-surface)}
    .hsearch:focus-within{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .hsearch .material-icons{font-size:17px;color:var(--cf-ink-400)}.hsearch input{border:0;background:none;outline:none;font:inherit;font-size:13px;color:var(--cf-ink-900);width:170px}
    .chips{display:inline-flex;gap:4px;padding:3px;background:var(--cf-surface-2);border:1px solid var(--cf-line);border-radius:10px;flex-wrap:wrap}
    .chips button{border:0;background:none;color:var(--cf-ink-600);font:inherit;font-size:12px;font-weight:600;padding:6px 11px;border-radius:7px;cursor:pointer}
    .chips button.on{background:var(--cf-surface);color:var(--cf-brand-700);box-shadow:var(--cf-shadow-sm)}
    .hist-empty{display:flex;flex-direction:column;align-items:center;gap:6px;padding:40px;border:1px dashed var(--cf-line);border-radius:14px;text-align:center}
    .he-badge{width:60px;height:60px;border-radius:18px;display:grid;place-items:center;background:linear-gradient(135deg,var(--cf-brand-500),var(--cf-brand-700));color:#fff;box-shadow:0 14px 30px -14px color-mix(in srgb,var(--cf-brand-600) 80%,transparent);margin-bottom:6px}
    .he-badge.muted{background:var(--cf-surface-2);color:var(--cf-ink-400);box-shadow:none}
    .he-badge .material-icons{font-size:28px}
    .hist-empty p{font-size:14px;font-weight:600;color:var(--cf-ink-800)}

    .overlay{position:fixed;inset:0;background:rgba(2,6,23,.5);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);display:grid;place-items:center;z-index:60;padding:20px}
    .emodal{position:relative;width:100%;max-width:460px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:18px;box-shadow:var(--cf-shadow-lg);padding:24px;max-height:88vh;overflow:auto}
    .emodal .close{position:absolute;top:14px;inset-inline-end:14px;border:0;background:none;color:var(--cf-ink-400);cursor:pointer}
    .m-head{display:flex;align-items:center;gap:12px;margin-bottom:16px;padding-inline-end:26px}
    .m-ic{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;background:color-mix(in srgb,var(--cf-brand-500) 12%,transparent);color:var(--cf-brand-600);flex:none}.m-ic .material-icons{font-size:20px}
    .m-head h3{font-size:17px;color:var(--cf-ink-900)}
    .modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}
    .modal-actions .cf-btn{display:inline-flex;align-items:center;gap:6px}.modal-actions .material-icons{font-size:17px}
  `],
})
export class IssueComponent {
  private route = inject(ActivatedRoute);
  private templates = inject(TemplateService);
  private alerts = inject(AlertService);
  readonly issued = inject(IssuedService);
  readonly plan = inject(PlanService);
  private approvals = inject(ApprovalService);
  readonly A = Actions;

  id = this.route.snapshot.paramMap.get('id') || '';
  template = signal<TemplateDetail | null>(null);
  offline = signal(false);
  loading = signal(true);
  error = signal('');
  tab = signal<'one' | 'bulk'>('one');

  form = signal<Record<string, string>>({});
  email = signal('');
  previewUrl = signal('');
  previewing = signal(false);
  showPreview = signal(false);   // preview design is hidden by default
  issuing = signal(false);
  lastIssued = signal<IssuedRecord | null>(null);

  rows = signal<BulkRow[]>([]);
  fileName = signal('');
  parsing = signal(false);
  dragOver = signal(false);
  issuingBulk = signal(false);
  bulkProgress = signal(0);
  bulkTotal = signal(0);
  bulkResult = signal<{ count: number } | null>(null);

  historyQuery = signal('');
  historyStatus = signal<'all' | DeliveryStatus>('all');

  // edit-variables popup
  editRec = signal<IssuedRecord | null>(null);
  editForm = signal<Record<string, string>>({});
  editEmail = signal('');
  savingEdit = signal(false);
  editEmailOk = computed(() => EMAIL_RE.test(this.editEmail().trim()));
  editValid = computed(() => this.editEmailOk() && this.vars().every((v) => (this.editForm()[v] || '').trim().length > 0));

  readonly confetti: Confetti[] = Array.from({ length: 16 }, (_, i) => ({
    left: Math.round(((i + 0.5) / 16) * 100),
    delay: (i % 8) * 0.11,
    dur: 1.8 + (i % 5) * 0.28,
    color: ['#4f46e5', '#16a34a', '#f59e0b', '#0ea5e9', '#db2777', '#10b981', '#8b5cf6'][i % 7],
  }));

  rawVars = computed(() => {
    const t = this.template();
    if (!t) return [];
    try { const a = JSON.parse(t.placeholdersJson) as string[]; return Array.isArray(a) ? a : []; } catch { return []; }
  });
  /** Fields shown in the form — signature variables are applied automatically, never typed. */
  vars = computed(() => this.rawVars().filter((v) => !/signature/i.test(v)));
  hasSignature = computed(() => {
    const j = this.template()?.canvasJson || '';
    if (/"objType"\s*:\s*"signature"/.test(j) || /\{\{\s*signature\d*\s*\}\}/i.test(j)) return true;
    return this.rawVars().some((v) => /signature/i.test(v));
  });
  private sig(): string | null { try { return localStorage.getItem('cf-signature'); } catch { return null; } }
  history = computed(() => this.issued.forTemplate(this.id));
  stats = computed(() => this.issued.stats(this.id));
  successRate = computed(() => { const s = this.stats(); return s.total ? Math.round((s.sent / s.total) * 100) : 0; });
  issuesUsed = computed(() => this.issued.stats().total);
  quotaPct = computed(() => { const lim = this.plan.issueLimit(); return !isFinite(lim) || lim <= 0 ? 0 : Math.min(100, Math.round((this.issuesUsed() / lim) * 100)); });
  quotaLabel(): string { const lim = this.plan.issueLimit(); return isFinite(lim) ? lim.toLocaleString() : '∞'; }
  emailOk = computed(() => EMAIL_RE.test(this.email().trim()));
  oneValid = computed(() => this.emailOk() && this.vars().every((v) => (this.form()[v] || '').trim().length > 0));
  totalFields = computed(() => 1 + this.vars().length);
  filledFields = computed(() => (this.emailOk() ? 1 : 0) + this.vars().filter((v) => (this.form()[v] || '').trim().length > 0).length);
  validRows = computed(() => this.rows().filter((r) => this.rowOk(r)));
  bulkErrors = computed(() => this.rows().filter((r) => !this.rowOk(r)));
  bulkPct = computed(() => this.bulkTotal() ? Math.round((this.bulkProgress() / this.bulkTotal()) * 100) : 0);
  filteredHistory = computed(() => {
    const q = this.historyQuery().trim().toLowerCase();
    const st = this.historyStatus();
    return this.history().filter((r) => {
      if (st !== 'all' && r.status !== st) return false;
      if (q && !((r.recipientEmail || '').toLowerCase().includes(q) || this.fieldsText(r).toLowerCase().includes(q))) return false;
      return true;
    });
  });

  histPage = signal(1);
  histSize = signal(10);
  histSafe = computed(() => { const mp = Math.max(1, Math.ceil(this.filteredHistory().length / this.histSize())); return Math.min(this.histPage(), mp); });
  pagedHistory = computed(() => { const f = this.filteredHistory(); const ps = this.histSize(); const start = (this.histSafe() - 1) * ps; return f.slice(start, start + ps); });

  constructor() { this.load(); this.issued.syncFromApi(this.id); }

  private load(): void {
    if (!this.id) { this.loading.set(false); this.error.set('No template selected.'); return; }
    this.templates.get(this.id).subscribe({
      next: (t) => { this.template.set(t); this.loading.set(false); },
      error: () => {
        try {
          const cache = JSON.parse(localStorage.getItem('cf-tpl-cache') || '[]');
          const hit = Array.isArray(cache) ? cache.find((x: any) => x.id === this.id) : null;
          if (hit) { this.template.set({ ...hit, canvasJson: '' } as TemplateDetail); this.offline.set(true); this.loading.set(false); return; }
        } catch { /* ignore */ }
        this.loading.set(false);
        this.error.set('The template API is unavailable and it is not cached locally.');
      },
    });
  }

  pretty(key: string): string { return key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }
  setField(k: string, v: string): void { this.form.update((f) => ({ ...f, [k]: v })); }
  fieldFilled(v: string): boolean { return (this.form()[v] || '').trim().length > 0; }
  longField(v: string): boolean { return /address|description|message|note|reason|achievement|details|paragraph|body/i.test(v); }
  emailValid(e: string): boolean { return EMAIL_RE.test((e || '').trim()); }

  private recipientName(data: Record<string, string>, email: string): string {
    const key = this.vars().find((k) => /name|recipient|fullname|holder/i.test(k));
    return (key && data[key]) || data[this.vars()[0]] || email;
  }
  private mergedJson(data: Record<string, string>): string | null {
    const t = this.template();
    if (!t || !t.canvasJson) return null;
    return mergeDataIntoJson(t.canvasJson, data);
  }
  /** Render a credential — signature shows as a Pending Approval stamp until approved, then the signer's signature. */
  private renderCert(json: string, w: number, h: number, signed: boolean): Promise<string> {
    return renderJsonToPng(json, w, h, 2, signed ? this.sig() : null, this.hasSignature() && !signed);
  }

  async updatePreview(): Promise<void> {
    const t = this.template();
    const json = this.mergedJson(this.form());
    if (!t || !json) { this.alerts.info('Live preview needs the full design (API offline) — showing the saved thumbnail.'); return; }
    this.showPreview.set(true);
    this.previewing.set(true);
    try { this.previewUrl.set(await this.renderCert(json, t.width, t.height, false)); }
    catch { this.alerts.error('Could not render the preview.'); }
    finally { this.previewing.set(false); }
  }
  downloadPreview(): void {
    if (!this.previewUrl()) return;
    const a = document.createElement('a'); a.href = this.previewUrl(); a.download = `${(this.template()?.name || 'preview').replace(/[^a-z0-9]+/gi, '-')}.png`; a.click();
  }

  async issueOne(): Promise<void> {
    if (!this.oneValid()) { this.alerts.warning('Add a valid recipient email and fill every field.'); return; }
    this.issuing.set(true);
    const t = this.template()!;
    const data = { ...this.form() };
    const email = this.email().trim();
    const needsApproval = this.hasSignature();
    let file: string | null = null;
    const json = this.mergedJson(data);
    if (json) { try { file = await this.renderCert(json, t.width, t.height, false); } catch { /* ignore */ } }
    const id = this.issued.newId();
    const rec: IssuedRecord = {
      id, templateId: this.id, templateName: t.name || '',
      recipientName: this.recipientName(data, email), recipientEmail: email, data,
      status: needsApproval ? 'Pending' : 'Sending', format: 'png', fileDataUrl: file, batchId: null, createdAt: new Date().toISOString(),
    };
    if (needsApproval) {
      this.issued.addPending([rec]);
      this.approvals.add({ recipient: rec.recipientName, email, item: t.name || 'Certificate', type: 'Credential', requestedBy: 'You', requestedAt: new Date().toISOString(), credentialId: id });
    } else {
      this.issued.add([rec]);
    }
    this.issuing.set(false);
    this.lastIssued.set(rec);
    this.alerts.success(needsApproval ? `Submitted for approval — ${email} receives it once approved.` : `Sending certificate to ${email}…`, { title: needsApproval ? 'Pending approval ⏳' : 'Issued 🎉' });
  }
  issueAnother(): void { this.lastIssued.set(null); this.form.set({}); this.email.set(''); this.previewUrl.set(''); }

  private norm(s: string): string { return (s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  downloadCsvTemplate(): void {
    const headers = ['Recipient Email', ...this.vars().map((v) => this.pretty(v))];
    const example = ['recipient@email.com', ...this.vars().map((v) => 'Sample ' + this.pretty(v))];
    const csv = [headers, example].map((r) => r.map((c) => /[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(this.template()?.name || 'certificate').replace(/[^a-z0-9]+/gi, '-')}-template.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  }
  onDragOver(e: DragEvent): void { e.preventDefault(); this.dragOver.set(true); }
  onDragLeave(e: DragEvent): void { e.preventDefault(); this.dragOver.set(false); }
  onDrop(e: DragEvent): void { e.preventDefault(); this.dragOver.set(false); const f = e.dataTransfer?.files?.[0]; if (f) this.parse(f); }
  onFile(e: Event): void { const f = (e.target as HTMLInputElement).files?.[0]; if (f) this.parse(f); (e.target as HTMLInputElement).value = ''; }

  private async parse(file: File): Promise<void> {
    this.parsing.set(true); this.fileName.set(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '', raw: false });
      const cols = json.length ? Object.keys(json[0]) : [];
      const emailCol = cols.find((c) => ['recipientemail', 'email', 'mail'].includes(this.norm(c)));
      const varCol: Record<string, string> = {};
      for (const v of this.vars()) { const hit = cols.find((c) => this.norm(c) === this.norm(v) || this.norm(c) === this.norm(this.pretty(v))); if (hit) varCol[v] = hit; }
      const rows: BulkRow[] = [];
      for (const r of json) {
        const data: Record<string, string> = {};
        for (const v of this.vars()) data[v] = String(r[varCol[v]] ?? '').trim();
        const email = String((emailCol ? r[emailCol] : '') ?? '').trim();
        if (!email && this.vars().every((v) => !data[v])) continue;
        rows.push({ email, data });
      }
      this.rows.set(rows);
      if (!rows.length) this.alerts.warning('No data rows found in that file.');
      else if (!emailCol) this.alerts.warning('No "Recipient Email" column found — download the template CSV for the exact headers.');
    } catch { this.alerts.error('Could not read that spreadsheet.'); this.rows.set([]); }
    finally { this.parsing.set(false); }
  }

  rowOk(r: BulkRow): boolean { return this.emailValid(r.email) && this.vars().every((v) => (r.data[v] || '').trim().length > 0); }
  rowProblem(r: BulkRow): string {
    if (!r.email) return 'Email missing';
    if (!this.emailValid(r.email)) return 'Bad email';
    const missing = this.vars().filter((v) => !(r.data[v] || '').trim());
    return missing.length ? `Empty: ${missing.map((m) => this.pretty(m)).join(', ')}` : 'Invalid';
  }
  removeRow(i: number): void { this.rows.update((l) => l.filter((_, k) => k !== i)); }
  clearRows(): void { this.rows.set([]); this.fileName.set(''); }

  async issueBulk(): Promise<void> {
    const valid = this.validRows();
    if (!valid.length) { this.alerts.warning('No valid rows to issue. Every row needs a valid Recipient Email and all fields filled.'); return; }
    this.bulkTotal.set(valid.length); this.bulkProgress.set(0);
    this.issuingBulk.set(true);
    const t = this.template()!;
    const needsApproval = this.hasSignature();
    const batchId = 'batch_' + Date.now().toString(36);
    const records: IssuedRecord[] = [];
    for (const r of valid) {
      let file: string | null = null;
      const json = this.mergedJson(r.data);
      if (json) { try { file = await this.renderCert(json, t.width, t.height, false); } catch { /* ignore */ } }
      else { await new Promise((res) => setTimeout(res, 16)); }
      records.push({
        id: this.issued.newId(), templateId: this.id, templateName: t.name || '',
        recipientName: this.recipientName(r.data, r.email), recipientEmail: r.email, data: r.data,
        status: needsApproval ? 'Pending' : 'Sending', format: 'png', fileDataUrl: file, batchId, createdAt: new Date().toISOString(),
      });
      this.bulkProgress.update((n) => n + 1);
    }
    if (needsApproval) {
      this.issued.addPending(records);
      this.approvals.add({ recipient: `${t.name || 'Certificate'} — ${records.length} recipients`, email: '', item: t.name || 'Certificate', type: 'Batch', requestedBy: 'You', requestedAt: new Date().toISOString(), count: records.length, batchId });
    } else {
      this.issued.add(records);
    }
    this.issuingBulk.set(false);
    this.clearRows();
    this.bulkResult.set({ count: records.length });
    this.alerts.success(needsApproval ? `${records.length} certificate${records.length === 1 ? '' : 's'} submitted for approval.` : `Sending ${records.length} certificate${records.length === 1 ? '' : 's'}…`, { title: needsApproval ? 'Pending approval ⏳' : 'Bulk issue started 🎉' });
  }

  // ---- edit variables popup ----
  openEdit(r: IssuedRecord): void { this.editRec.set(r); this.editForm.set({ ...r.data }); this.editEmail.set(r.recipientEmail); }
  closeEdit(): void { this.editRec.set(null); }
  setEditField(k: string, v: string): void { this.editForm.update((f) => ({ ...f, [k]: v })); }
  async saveEdit(): Promise<void> {
    const r = this.editRec();
    if (!r || !this.editValid()) return;
    this.savingEdit.set(true);
    const data = { ...this.editForm() };
    const email = this.editEmail().trim();
    let file = r.fileDataUrl ?? null;
    const t = this.template();
    const json = this.mergedJson(data);
    if (json && t) { try { file = await this.renderCert(json, t.width, t.height, !!r.signedBy); } catch { /* ignore */ } }
    this.issued.update(r.id, { data, recipientEmail: email, recipientName: this.recipientName(data, email), fileDataUrl: file });
    this.issued.resend(r.id);
    this.savingEdit.set(false);
    this.closeEdit();
    this.alerts.success(`Updated — re-sending to ${email}…`, { title: 'Credential updated' });
  }

  fieldsText(r: IssuedRecord): string { return Object.entries(r.data).map(([k, v]) => `${this.pretty(k)}: ${v}`).join(' · '); }
  initials(r: IssuedRecord): string {
    const base = (r.recipientName || r.recipientEmail || '?').trim();
    const parts = base.split(/[\s@._-]+/).filter(Boolean);
    return (((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()) || base.charAt(0).toUpperCase();
  }
  relativeTime(iso: string): string {
    const d = +new Date(iso); if (!d) return '';
    const s = Math.floor((Date.now() - d) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
    const dd = Math.floor(h / 24); if (dd < 30) return `${dd}d ago`;
    return new Date(iso).toLocaleDateString();
  }
  statusLabel(s: DeliveryStatus): string { return s === 'Sending' ? 'Sending…' : s; }
  badgeClass(s: DeliveryStatus): string {
    return s === 'Sent' ? 'cf-badge-success' : s === 'Sending' ? 'st-sending' : s === 'Pending' ? 'cf-badge-warning' : s === 'Revoked' ? 'st-revoked' : 'cf-badge-danger';
  }
  download(r: IssuedRecord): void {
    if (!r.fileDataUrl) { this.alerts.info('The image for this credential is not stored locally (re-issue to regenerate).'); return; }
    const a = document.createElement('a'); a.href = r.fileDataUrl; a.download = `${(r.recipientName || 'certificate').replace(/[^a-z0-9]+/gi, '-')}.png`; a.click();
  }
  resendRow(r: IssuedRecord): void { this.issued.resend(r.id); this.alerts.info(r.status === 'Failed' ? `Retrying delivery to ${r.recipientEmail}…` : `Re-sending to ${r.recipientEmail}…`); }
  async revoke(r: IssuedRecord): Promise<void> {
    const ok = await this.alerts.confirm({ title: 'Revoke credential', message: `Revoke the certificate issued to ${r.recipientEmail || 'this recipient'}?`, danger: true, confirmText: 'Revoke' });
    if (ok) { this.issued.setStatus(r.id, 'Revoked'); this.alerts.info('Credential revoked.'); }
  }
}
