import { Component, computed, effect, inject, signal, untracked, WritableSignal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TemplateService } from '../../core/services/template.service';
import { TemplateListItem } from '../../core/models/models';
import { HasActionDirective } from '../../shared/directives/has-action.directive';
import { Actions } from '../../core/constants/actions';
import { TranslocoModule } from '@ngneat/transloco';
import { OnboardingDialogComponent } from './onboarding-dialog';
import { AlertService } from '../../core/services/alert.service';
import { ApprovalService, Approval } from '../../core/services/approval.service';
import { AuthService } from '../../core/services/auth.service';
import { IssuedService, IssuedRecord } from '../../core/services/issued.service';
import { PlanService } from '../../core/services/plan.service';
import { firstValueFrom } from 'rxjs';
import { mergeDataIntoJson, renderJsonToPng } from '../../core/utils/render.util';
import { SignaturePadComponent } from '../../shared/components/signature/signature-pad';
import { TourService, TourStep } from '../../core/services/tour.service';
import { TourOverlayComponent } from '../../shared/components/tour/tour-overlay.component';
import { PermissionService } from '../../core/services/permission.service';
import { LanguageService } from '../../core/services/language.service';
import { DASH_TOUR, DASH_TOUR_UI, DashRole } from './dashboard-tour.data';

interface MonthVal { label: string; v: number; }
interface StatusSeg { label: string; value: number; color: string; }
interface Activity { icon: string; color: string; text: string; time: string; }
interface CertRow { recipient: string; template: string; status: 'Active' | 'Pending' | 'Expired'; date: string; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, HasActionDirective, TranslocoModule, OnboardingDialogComponent, SignaturePadComponent, TourOverlayComponent],
  template: `
  @if (showOnboarding()) { <app-onboarding (done)="showOnboarding.set(false)" /> }

  <div class="hero">
    <div class="hero-bar">
      <div class="th-l">
        <span class="th-badge"><span class="material-icons">workspace_premium</span></span>
        <div class="th-tx">
          <span class="th-eyebrow">{{ plan.current().name }} workspace · {{ today() }}</span>
          <h1>{{ greeting() }}</h1>
        </div>
      </div>
      <div class="th-r">
        <a class="th-chip" data-tour="dash-issue" routerLink="/app/templates" [appHasAction]="A.Credential_Generate" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">send</span> Issue</a>
        <a class="th-chip" data-tour="dash-branding" routerLink="/app/branding" [appHasAction]="A.Branding_Manage" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">palette</span> Branding</a>
        <a class="th-chip" data-tour="dash-approvals" routerLink="/app/approvals" [appHasAction]="A.Credential_Approve" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">fact_check</span> Approvals</a>
        <a class="cf-btn cf-btn-primary" data-tour="dash-create" routerLink="/canvas" [appHasAction]="A.Template_Edit" [tooltipMessage]="'🔒 Upgrade your plan to create templates.'"><span class="material-icons">add</span> {{ 'dash.newCertificate' | transloco }}</a>
      </div>
    </div>
    <div class="hero-kpis" data-tour="dash-kpis">
      <a class="hkpi" routerLink="/app/credentials">
        <span class="hk-ic brand"><span class="material-icons">verified</span></span>
        <div class="hk-tx"><span class="hk-v">{{ aIssued().toLocaleString() }}</span><span class="hk-l">Certificates issued</span></div>
        <span class="hk-delta up"><span class="material-icons">trending_up</span> 12.5%</span>
      </a>
      <a class="hkpi" routerLink="/app/credentials">
        <span class="hk-ic violet"><span class="material-icons">visibility</span></span>
        <div class="hk-tx"><span class="hk-v">{{ aViews().toLocaleString() }}</span><span class="hk-l">Total views</span></div>
        <span class="hk-delta up"><span class="material-icons">trending_up</span> 9.4%</span>
      </a>
      <div class="hkpi">
        <span class="hk-ic green"><span class="material-icons">mark_email_read</span></span>
        <div class="hk-tx"><span class="hk-v">{{ aDelivery() }}%</span><span class="hk-l">Delivery success</span></div>
        <span class="hk-delta ok"><span class="material-icons">check_circle</span></span>
      </div>
      <a class="hkpi" routerLink="/app/approvals">
        <span class="hk-ic amber"><span class="material-icons">hourglass_top</span></span>
        <div class="hk-tx"><span class="hk-v">{{ aPending() }}</span><span class="hk-l">Pending approvals</span></div>
        <span class="hk-delta go"><span class="material-icons">arrow_forward</span></span>
      </a>
    </div>
  </div>

  <!-- metrics -->
  <div class="cf-metrics">
    <div class="cf-metric">
      <div class="ic" style="background:var(--cf-brand-50);color:var(--cf-brand-600)"><span class="material-icons">verified</span></div>
      <div class="cf-metric-lbl">Certificates issued</div>
      <div class="cf-metric-val">{{ aIssued().toLocaleString() }}</div>
      <div class="delta up"><span class="material-icons">trending_up</span>+12.5%</div>
      <svg class="kpi-spark s1" viewBox="0 0 120 34" preserveAspectRatio="none"><polyline [attr.points]="kpiSpark(0)"></polyline></svg>
    </div>
    <div class="cf-metric">
      <div class="ic" style="background:var(--cf-gold-soft);color:var(--cf-gold-ink)"><span class="material-icons">dashboard_customize</span></div>
      <div class="cf-metric-lbl">Templates</div>
      <div class="cf-metric-val">{{ aTemplates() }}</div>
      <div class="delta cf-muted">{{ loading() ? 'Loading…' : 'Total designs' }}</div>
      <svg class="kpi-spark s2" viewBox="0 0 120 34" preserveAspectRatio="none"><polyline [attr.points]="kpiSpark(1)"></polyline></svg>
    </div>
    <div class="cf-metric">
      <div class="ic" style="background:color-mix(in srgb,#8b5cf6 14%,transparent);color:#7c3aed"><span class="material-icons">visibility</span></div>
      <div class="cf-metric-lbl">Total Views</div>
      <div class="cf-metric-val">{{ aViews().toLocaleString() }}</div>
      <div class="delta up"><span class="material-icons">trending_up</span>+9.4%</div>
      <svg class="kpi-spark s3" viewBox="0 0 120 34" preserveAspectRatio="none"><polyline [attr.points]="kpiSpark(2)"></polyline></svg>
    </div>
    <div class="cf-metric">
      <div class="ic" style="background:#dcfce7;color:#15803d"><span class="material-icons">mark_email_read</span></div>
      <div class="cf-metric-lbl">Delivery Success</div>
      <div class="cf-metric-val">{{ aDelivery() }}%</div>
      <div class="delta up"><span class="material-icons">check_circle</span>Sent successfully</div>
      <svg class="kpi-spark s4" viewBox="0 0 120 34" preserveAspectRatio="none"><polyline [attr.points]="kpiSpark(3)"></polyline></svg>
    </div>
  </div>

  <!-- traffic trend + verification (compact 2-col) -->
  <div class="row analytics" data-tour="dash-analytics">
    <div class="cf-card cf-card-pad chart-card">
      <div class="card-head">
        <h3><span class="material-icons ch-ic">show_chart</span> Traffic &amp; Issuance Trend</h3>
        <div class="seg">
          <button [class.on]="range()==='6m'" (click)="range.set('6m')">6M</button>
          <button [class.on]="range()==='12m'" (click)="range.set('12m')">12M</button>
        </div>
      </div>
      <div class="ch-summary">
        <div class="chs"><span class="chs-dot issued"></span><div class="chs-tx"><span class="chs-v">{{ chart().totalIssued.toLocaleString() }}</span><span class="chs-l">Issued</span></div></div>
        <div class="chs"><span class="chs-dot traffic"></span><div class="chs-tx"><span class="chs-v">{{ chart().totalTraffic.toLocaleString() }}</span><span class="chs-l">Verification traffic</span></div></div>
        <div class="chs"><span class="chs-ic"><span class="material-icons">bolt</span></span><div class="chs-tx"><span class="chs-v">{{ chart().peakLabel }}</span><span class="chs-l">Peak · {{ chart().peakVal.toLocaleString() }}</span></div></div>
      </div>
      <div class="linewrap">
        <svg [attr.viewBox]="'0 0 ' + chart().W + ' ' + chart().H" class="linechart">
          <defs>
            <linearGradient id="gIssued" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--cf-brand-500)" stop-opacity="0.30"/><stop offset="100%" stop-color="var(--cf-brand-500)" stop-opacity="0"/></linearGradient>
            <linearGradient id="gTraffic" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--cf-accent-500)" stop-opacity="0.26"/><stop offset="100%" stop-color="var(--cf-accent-500)" stop-opacity="0"/></linearGradient>
          </defs>
          @for (g of chart().grid; track g.y) {
            <line class="grid" [attr.x1]="chart().padL" [attr.x2]="chart().W - 14" [attr.y1]="g.y" [attr.y2]="g.y"></line>
            <text class="gridv" [attr.x]="chart().padL - 7" [attr.y]="+g.y + 3">{{ g.v }}</text>
          }
          <path class="area" [attr.d]="chart().trafficArea" fill="url(#gTraffic)"></path>
          <path class="area" [attr.d]="chart().issuedArea" fill="url(#gIssued)"></path>
          <polyline class="line traffic" [attr.points]="chart().trafficLine"></polyline>
          <polyline class="line issued" [attr.points]="chart().issuedLine"></polyline>
          <circle class="peak-ring" [attr.cx]="chart().peakX" [attr.cy]="chart().peakY" r="6"></circle>
          <circle class="peak" [attr.cx]="chart().peakX" [attr.cy]="chart().peakY" r="3.5"></circle>
          @for (d of chart().tdots; track $index) { <circle class="cdot traffic" [attr.cx]="d.x" [attr.cy]="d.y" r="2.6"></circle> }
          @for (d of chart().idots; track $index) { <circle class="cdot issued" [attr.cx]="d.x" [attr.cy]="d.y" r="2.6"></circle> }
        </svg>
        <div class="xlabels" [style.padding-inline-start.px]="32">@for (l of chart().labels; track $index) { <span>{{ l }}</span> }</div>
      </div>
    </div>

    <div class="cf-card cf-card-pad verif-card">
      <div class="card-head"><h3><span class="material-icons ch-ic v">qr_code_scanner</span> Verification Traffic</h3><span class="vf-trend"><span class="material-icons">trending_up</span> +14%</span></div>
      <div class="vf-top2"><span class="vf-num">{{ verif().total.toLocaleString() }}</span><span class="vf-lbl">total verifications</span></div>
      <div class="vf-channels">
        @for (sg of verif().segs; track sg.key) {
          <div class="vf-ch" [class]="'s-' + sg.key">
            <span class="vf-ch-ic"><span class="material-icons">{{ sg.icon }}</span></span>
            <div class="vf-ch-tx">
              <span class="vf-ch-top"><span class="vf-ch-name">{{ sg.label }}</span><span class="vf-ch-pct">{{ sg.pct }}%</span></span>
              <span class="vf-ch-bar"><i [style.width.%]="sg.pct"></i></span>
            </div>
            <span class="vf-ch-num">{{ sg.value.toLocaleString() }}</span>
          </div>
        }
      </div>
    </div>
  </div>

  <!-- pending approvals queue -->
  @if (pendingItems().length) {
    <div class="cf-card ap-cta">
      <div class="apq-top">
        <span class="apq-ic"><span class="material-icons">verified_user</span></span>
        <div class="apq-tx">
          <h3>Pending Approvals Queue <span class="apq-count">{{ pending() }} Waiting</span></h3>
          <p>Review and sign certificates that require approver verification before dispatch.</p>
        </div>
        <a class="apq-open" routerLink="/app/approvals">Open Approvals <span class="material-icons">arrow_forward</span></a>
      </div>
      <div class="apq-bar">
        <label class="apq-selall"><input type="checkbox" [checked]="dashAllSel()" (change)="dashToggleAll()" /><span></span> Select all</label>
        <button class="apq-approve" [class.ready]="dashSelCount() > 0" [disabled]="!dashSelCount()" (click)="approveSelectedDash()" [appHasAction]="A.Credential_Approve" [tooltipMessage]="'🔒 Approving is not in your plan.'">
          <span class="material-icons">done_all</span> Approve selected
          @if (dashSelCount() > 0) { <span class="cnt">{{ dashSelCount() }}</span> }
        </button>
      </div>
      <div class="ap-list">
        @for (tg of dashTplGroups(); track tg.name) {
          <div class="ap-tsec">
            <div class="ap-tsec-head">
              <span class="ap-tsec-ava" [style.background]="tplGrad(tg.name)"><span class="material-icons">workspace_premium</span></span>
              <span class="ap-tsec-name">{{ tg.name }}</span>
              <span class="ap-tsec-meta">
                @if (tg.batches.length) { <span><span class="material-icons">groups</span>{{ tg.batches.length }}</span> }
                @if (tg.individ.length) { <span><span class="material-icons">person</span>{{ tg.individ.length }}</span> }
              </span>
              <span class="ap-tsec-cnt">{{ tg.recips }}</span>
            </div>
            @if (tg.batches.length) {
              <div class="ap-subh bulk"><span class="material-icons">groups</span> Bulk batches</div>
              @for (a of tg.batches; track a.id) { <ng-container [ngTemplateOutlet]="apRow" [ngTemplateOutletContext]="{ $implicit: a }"></ng-container> }
            }
            @if (tg.individ.length) {
              <div class="ap-subh indiv"><span class="material-icons">workspace_premium</span> Individual</div>
              @for (a of tg.individ; track a.id) { <ng-container [ngTemplateOutlet]="apRow" [ngTemplateOutletContext]="{ $implicit: a }"></ng-container> }
            }
          </div>
        }
        <ng-template #apRow let-a>
          <div class="ap-item" [class.sel]="dashIsSel(a.id)">
            <label class="cbx"><input type="checkbox" [checked]="dashIsSel(a.id)" (change)="dashToggle(a.id)" /><span></span></label>
            <span class="ap-av" [class]="'t-' + a.type.toLowerCase()"><span class="material-icons">{{ a.type === 'Batch' ? 'groups' : a.type === 'Template' ? 'dashboard_customize' : 'workspace_premium' }}</span></span>
            <div class="ap-info">
              <div class="ap-top"><strong>{{ a.recipient }}</strong>@if (a.count) { <span class="ap-n">{{ a.count }}</span> }<span class="ap-age">{{ apAge(a) }}</span></div>
              <span class="ap-sub cf-muted">{{ a.item }} · by {{ a.requestedBy }}</span>
            </div>
            <div class="ap-rowact">
              <button class="ap-mini view" (click)="openDashView(a)" title="View & sign"><span class="material-icons">visibility</span></button>
              @if (a.type === 'Batch') {
                <button class="ap-approve-row" (click)="openBatch(a)" [appHasAction]="A.Credential_Approve" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">groups</span> Review</button>
              } @else {
                <button class="ap-approve-row" (click)="approveRow(a)" [appHasAction]="A.Credential_Approve" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">check_circle</span> Approve</button>
              }
            </div>
          </div>
        </ng-template>
      </div>
      @if (pendingAll().length > apqPageSize) {
        <div class="apq-pager">
          <span class="apq-info">Showing {{ (apqPage() - 1) * apqPageSize + 1 }}–{{ min(apqPage() * apqPageSize, pendingAll().length) }} of {{ pendingAll().length }}</span>
          <div class="apq-pg-btns">
            <button (click)="apqPrev()" [disabled]="apqPage() === 1" title="Previous"><span class="material-icons">chevron_left</span></button>
            <span class="apq-pg">{{ apqPage() }} / {{ apqPages() }}</span>
            <button (click)="apqNext()" [disabled]="apqPage() >= apqPages()" title="Next"><span class="material-icons">chevron_right</span></button>
          </div>
        </div>
      }
    </div>
  }

  <!-- plan quotas & storage -->
  <div class="cf-card quotas" data-tour="dash-quotas">
    <div class="qz-head">
      <div class="qz-h-tx">
        <span class="qz-badge"><span class="material-icons">workspace_premium</span> {{ plan.current().name }}</span>
        <h3>Plan Quotas &amp; Storage</h3>
        <p class="cf-muted">{{ plan.priceLabel() }} · renews automatically</p>
      </div>
      <button class="cf-btn cf-btn-primary" (click)="subOpen.set(true)"><span class="material-icons">tune</span> Manage Subscription Quotas</button>
    </div>
    <div class="qz-grid">
      <div class="qz t-tpl">
        <div class="qz-row"><span class="qz-ic"><span class="material-icons">dashboard_customize</span></span><span class="qz-name">Templates</span><span class="qz-pct">{{ tplPct() }}%</span></div>
        <div class="qz-num">{{ templateCount() }} <small>/ {{ tplLimitLabel() }}</small></div>
        <div class="qz-bar"><span [style.width.%]="tplPct()"></span></div>
      </div>
      <div class="qz t-cred">
        <div class="qz-row"><span class="qz-ic"><span class="material-icons">workspace_premium</span></span><span class="qz-name">Credentials this month</span><span class="qz-pct">{{ credPct() }}%</span></div>
        <div class="qz-num">{{ credentialsUsed().toLocaleString() }} <small>/ {{ credLimitLabel() }}</small></div>
        <div class="qz-bar"><span [style.width.%]="credPct()"></span></div>
      </div>
      <div class="qz t-sto">
        <div class="qz-row"><span class="qz-ic"><span class="material-icons">cloud</span></span><span class="qz-name">Storage</span><span class="qz-pct">{{ storagePct() }}%</span></div>
        <div class="qz-num">{{ storageUsedMB() }} <small>MB / {{ storageLimitLabel() }} MB</small></div>
        <div class="qz-bar"><span [style.width.%]="storagePct()"></span></div>
      </div>
    </div>
  </div>

  <!-- recent activity + top templates -->
  <div class="row two">
    <div class="cf-card cf-card-pad">
      <div class="card-head"><h3><span class="material-icons sec-ic">history</span> Recent activity</h3></div>
      <ul class="timeline">
        @for (a of activity; track a.text) {
          <li><span class="tl-dot" [style.background]="a.color"><span class="material-icons">{{ a.icon }}</span></span>
            <div class="tl-tx"><span class="tl-main">{{ a.text }}</span><span class="cf-muted small">{{ a.time }}</span></div></li>
        }
      </ul>
    </div>

    <div class="cf-card cf-card-pad">
      <div class="card-head"><h3><span class="material-icons sec-ic">leaderboard</span> Top Templates</h3><a class="link" routerLink="/app/templates">View all</a></div>
      <p class="sec-sub cf-muted">Most issued certificate designs</p>
      <div class="top-list">
        @for (t of topTemplates(); track t.name) {
          <div class="top-row">
            <span class="top-rank" [class.gold]="t.rank === 1">{{ t.rank }}</span>
            <span class="top-thumb">@if (t.thumb) { <img [src]="t.thumb" alt="" /> } @else { <span class="material-icons">workspace_premium</span> }</span>
            <div class="top-body">
              <span class="top-name">{{ t.name }}</span>
              <span class="top-bar"><i [style.width.%]="t.pct"></i></span>
            </div>
            <span class="top-n">{{ t.n.toLocaleString() }}<small>issued</small></span>
          </div>
        }
      </div>
    </div>
  </div>

  <!-- recent certificates -->
  <div class="cf-card cf-card-pad certs-card" data-tour="dash-credentials" style="margin-top:14px">
    <div class="card-head"><h3><span class="material-icons sec-ic">workspace_premium</span> Recent certificates</h3><a class="link" routerLink="/app/credentials">View all <span class="material-icons">arrow_forward</span></a></div>
    <div class="tablewrap">
      <table class="cf-table pro">
        <thead><tr><th>Recipient</th><th>Template</th><th>Status</th><th class="ta-end">Issued on</th></tr></thead>
        <tbody>
          @for (c of certs; track c.recipient + c.date) {
            <tr routerLink="/app/credentials">
              <td><div class="cr-recip"><span class="cr-av">{{ certInitials(c.recipient) }}</span><span class="cr-name">{{ c.recipient }}</span></div></td>
              <td><span class="cr-tpl"><span class="material-icons">workspace_premium</span>{{ c.template }}</span></td>
              <td><span class="cf-badge" [ngClass]="badge(c.status)"><span class="cf-dot" *ngIf="c.status==='Active'"></span>{{ c.status }}</span></td>
              <td class="ta-end cf-muted">{{ c.date }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  </div>


  @if (subOpen()) {
    <div class="overlay" (click)="subOpen.set(false)">
      <div class="submodal" (click)="$event.stopPropagation()">
        <button class="close" (click)="subOpen.set(false)"><span class="material-icons">close</span></button>
        <div class="sm-hero">
          <span class="sm-seal"><span class="material-icons">verified</span></span>
          <h3>Subscription Active</h3>
          <p>Your subscription is active. You have full access to the platform.</p>
        </div>
        <div class="sm-rows">
          <div class="sm-row"><span class="sm-k">Current Status</span><span class="sm-v"><span class="sm-pill ok">Active</span></span></div>
          <div class="sm-row"><span class="sm-k">Plan</span><span class="sm-v">{{ plan.current().name }}</span></div>
          <div class="sm-row"><span class="sm-k">Trial ends</span><span class="sm-v">{{ plan.trialEnds() | date: 'M/d/yyyy' }}</span></div>
          <div class="sm-row"><span class="sm-k">Price</span><span class="sm-v">{{ plan.priceLabel() }}</span></div>
        </div>
        <div class="sm-actions">
          <button class="cf-btn cf-btn-secondary" (click)="subOpen.set(false)">Go to Dashboard</button>
          <button class="cf-btn cf-btn-primary" (click)="goPricing()"><span class="material-icons">workspace_premium</span> Change Plan</button>
        </div>
      </div>
    </div>
  }
  @if (dashView(); as a) {
    <div class="overlay" (click)="closeDashView()">
      <div class="submodal vmodal" (click)="$event.stopPropagation()">
        <button class="close" (click)="closeDashView()"><span class="material-icons">close</span></button>
        <div class="vm-grid">
          <div class="vm-cert">
            @if (dashViewImg()) {
              <img class="vm-real" [src]="dashViewImg()!" alt="credential preview" />
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
            <div class="vm-head"><span class="tchip">{{ a.type }}</span><span class="age"><span class="material-icons">schedule</span>{{ apAge(a) }} waiting</span></div>
            <h3>{{ a.recipient }}</h3>
            <div class="vm-meta">
              @if (a.email) { <div><span class="material-icons">mail</span> {{ a.email }}</div> }
              <div><span class="material-icons">workspace_premium</span> {{ a.item }}</div>
              <div><span class="material-icons">person</span> Requested by {{ a.requestedBy }}</div>
            </div>
            @if (a.note) { <div class="vm-note"><span class="material-icons">sticky_note_2</span> {{ a.note }}</div> }
            <div class="signbox" [class.nosig]="!hasSig()">
              <span class="sb-lbl"><span class="material-icons">draw</span> Sign as approver</span>
              @if (hasSig()) {
                <img class="sb-img" [src]="mySig()!" alt="Your signature" />
                <span class="sb-name cf-muted">{{ approver() }} · {{ today() }}</span>
              } @else {
                <span class="sb-missing">No signature on file. <button class="sb-add" (click)="addSignatureNow()">Add your signature</button> to sign.</span>
              }
            </div>
            <div class="vm-actions">
              <button class="cf-btn cf-btn-secondary" (click)="dashReject(a)"><span class="material-icons">close</span> Reject</button>
              <button class="cf-btn cf-btn-primary" (click)="dashSign(a)"><span class="material-icons">draw</span> Sign &amp; Approve Now</button>
            </div>
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
            <span class="cf-muted">{{ batchRecs().length }} awaiting approval · by {{ a.requestedBy }}</span>
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
                  <span class="bm-ava" [style.background]="avColor(r.recipientEmail || r.recipientName || '?')">{{ certInitials(r.recipientName || '?') }}</span>
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
      <div class="nsmodal" (click)="$event.stopPropagation()">
        <button class="close" (click)="dismissWarn()"><span class="material-icons">close</span></button>
        <div class="ns-ic"><span class="material-icons">draw</span></div>
        <h3>Add your signature to approve</h3>
        <p class="cf-muted">Approving applies your signature to the credential — add one from your profile menu, or add it now.</p>
        <div class="ns-actions">
          <button class="cf-btn cf-btn-secondary" (click)="dismissWarn()">Cancel</button>
          <button class="cf-btn cf-btn-primary" (click)="addSignatureNow()"><span class="material-icons">edit</span> Add signature now</button>
        </div>
      </div>
    </div>
  }
  <app-signature-pad [open]="addSigOpen()" (closed)="onSigClosed()" />

  <app-tour-overlay />
  `,
  styles: [`
    :host{display:block}
    .hero{position:relative;overflow:hidden;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:16px;padding:16px 18px 16px 20px;margin-bottom:14px;box-shadow:0 1px 2px rgba(15,23,42,.04)}
    .hero::before{content:"";position:absolute;inset:0 auto 0 0;width:4px;background:linear-gradient(var(--cf-brand-500),var(--cf-brand-700))}
    .hero-bar{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
    .th-l{display:flex;align-items:center;gap:13px;min-width:0}
    .th-badge{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(135deg,var(--cf-brand-500),var(--cf-brand-700));color:#fff;flex:none;box-shadow:0 7px 16px -7px color-mix(in srgb,var(--cf-brand-600) 75%,transparent)}
    .th-badge .material-icons{font-size:22px}
    .th-tx{display:flex;flex-direction:column;min-width:0}
    .th-eyebrow{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--cf-brand-600)}
    .th-tx h1{font-size:20px;font-weight:800;letter-spacing:-.01em;color:var(--cf-ink-900);line-height:1.15;margin-top:2px}
    .th-r{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .th-chip{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--cf-ink-600);text-decoration:none;border:1px solid var(--cf-line);background:none;padding:8px 12px;border-radius:9px;transition:border-color .14s,color .14s,background .14s}
    .th-chip:hover{border-color:color-mix(in srgb,var(--cf-brand-500) 40%,var(--cf-line));color:var(--cf-brand-700);background:var(--cf-brand-50)}
    .th-chip .material-icons{font-size:16px;color:var(--cf-ink-400)}
    .th-chip:hover .material-icons{color:var(--cf-brand-600)}
    .hero-kpis{display:grid;grid-template-columns:repeat(4,1fr);margin-top:15px;padding-top:15px;border-top:1px solid var(--cf-line-soft)}
    .hkpi{position:relative;display:flex;align-items:center;gap:12px;padding:2px 18px;text-decoration:none;transition:transform .12s}
    .hkpi:first-child{padding-inline-start:0}
    .hkpi + .hkpi::before{content:"";position:absolute;inset-inline-start:0;top:50%;transform:translateY(-50%);height:38px;width:1px;background:var(--cf-line)}
    a.hkpi:hover{transform:translateY(-1px)}
    a.hkpi:hover .hk-v{color:var(--cf-brand-700)}
    .hk-ic{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;flex:none}.hk-ic .material-icons{font-size:20px}
    .hk-ic.brand{background:var(--cf-brand-50);color:var(--cf-brand-600)}
    .hk-ic.violet{background:color-mix(in srgb,#8b5cf6 14%,transparent);color:#7c3aed}
    .hk-ic.green{background:#dcfce7;color:#15803d}
    .hk-ic.amber{background:var(--cf-warning-soft);color:var(--cf-warning)}
    .hk-tx{display:flex;flex-direction:column;min-width:0;flex:1}
    .hk-v{font-size:22px;font-weight:800;letter-spacing:-.02em;color:var(--cf-ink-900);line-height:1;font-variant-numeric:tabular-nums;transition:color .14s}
    .hk-l{font-size:11.5px;color:var(--cf-ink-500);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .hk-delta{display:inline-flex;align-items:center;gap:2px;font-size:11px;font-weight:700;color:#15803d;flex:none}
    .hk-delta .material-icons{font-size:14px}
    .hk-delta.go{color:var(--cf-brand-600)}
    .cf-metrics{display:none}
    @media(max-width:980px){.hero-kpis{grid-template-columns:repeat(2,1fr);gap:16px 0}.hkpi{padding:0 16px}.hkpi::before{display:none}}
    @media(max-width:520px){.hero-kpis{grid-template-columns:1fr;gap:14px}.th-r{justify-content:flex-start}}
    .cf-card-pad{padding:15px 17px}
    .cf-metrics{gap:12px}
    .cf-metric{padding:14px 16px}
    .head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:12px}
    .head h1{font-size:23px}
    .cf-btn .material-icons{font-size:18px}
    .cf-metric .ic{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;margin-bottom:12px}
    .cf-metric .ic .material-icons{font-size:20px}
    .delta{font-size:12px;font-weight:500;margin-top:6px;display:inline-flex;align-items:center;gap:3px}
    .delta .material-icons{font-size:15px}
    .up{color:var(--cf-success)} .down{color:var(--cf-danger)}
    .row{display:grid;gap:14px;margin-top:14px}
    .analytics{grid-template-columns:1.7fr 1fr}
    .two{grid-template-columns:1fr 1fr}
    @media(max-width:900px){.analytics,.two{grid-template-columns:1fr}}
    .card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
    .card-head h3{font-size:15px}
    .link{font-size:13px}
    .small{font-size:12.5px}
    .seg{display:inline-flex;background:var(--cf-surface-2);border:1px solid var(--cf-line);border-radius:999px;padding:2px}
    .seg button{border:0;background:none;color:var(--cf-ink-500);font:inherit;font-size:12px;font-weight:600;padding:5px 12px;border-radius:999px;cursor:pointer}
    .seg button.on{background:var(--cf-surface);color:var(--cf-brand-700);box-shadow:var(--cf-shadow-sm)}
    .bars{display:flex;align-items:flex-end;gap:10px;height:150px;padding-top:14px}
    .bars .col{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:8px;height:100%}
    .bars .bar{position:relative;width:64%;border-radius:7px 7px 0 0;background:var(--cf-brand-200);min-height:4px;transition:height .4s ease}
    .bars .col.hot .bar{background:var(--cf-brand-600)}
    .bars .col:hover .bar{background:var(--cf-brand-600)}
    .bars .val{position:absolute;top:-20px;left:50%;transform:translateX(-50%);font-size:11px;font-weight:600;color:var(--cf-ink-900);opacity:0;transition:.15s;white-space:nowrap}
    .bars .col:hover .val{opacity:1}
    .bars .cap{font-size:11px;color:var(--cf-ink-400)}
    /* donut */
    .donut-wrap{display:flex;align-items:center;gap:20px;flex-wrap:wrap}
    .donut{position:relative;width:140px;height:140px;flex:none}
    .donut svg{width:140px;height:140px;transform:rotate(-90deg)}
    .donut .track{fill:none;stroke:var(--cf-line);stroke-width:14}
    .donut .seg{fill:none;stroke-width:14;stroke-linecap:butt;transition:stroke-dashoffset .5s ease}
    .donut-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
    .donut-center .dt{font-size:22px;font-weight:700;color:var(--cf-ink-900);letter-spacing:-.02em}
    .legend{display:flex;flex-direction:column;gap:9px;flex:1;min-width:140px}
    .legend .lg{display:flex;align-items:center;gap:8px;font-size:13px}
    .legend .dot{width:10px;height:10px;border-radius:3px;flex:none}
    .legend .lg-lbl{color:var(--cf-ink-700)}
    .legend .lg-val{margin-inline-start:auto;color:var(--cf-ink-500);font-size:12px}
    /* feed */
    .feed{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}
    .feed li{display:flex;align-items:center;gap:12px;padding:9px 0;border-top:1px solid var(--cf-line-soft)}
    .feed li:first-child{border-top:0}
    .fic{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;flex:none}
    .fic .material-icons{font-size:18px}
    .ftext{display:flex;flex-direction:column;font-size:13px;color:var(--cf-ink-700)}
    /* recent templates */
    .rec{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--cf-line-soft);text-decoration:none}
    .rec:first-of-type{border-top:0}
    .mini{width:40px;height:30px;border-radius:7px;background:var(--cf-brand-50);color:var(--cf-brand-600);display:grid;place-items:center;overflow:hidden;flex:none}
    .mini img{width:100%;height:100%;object-fit:cover}
    .mini .material-icons{font-size:18px}
    .rec-body{display:flex;flex-direction:column;min-width:0}
    .rec-name{color:var(--cf-ink-900);font-weight:500;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    /* quick actions */
    .qa-title{font-size:15px;margin:16px 0 10px}
    .qa{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}
    .qa-card{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:16px;text-decoration:none;color:var(--cf-ink-700);transition:.15s}
    .qa-card:hover{border-color:var(--cf-brand-500);color:var(--cf-brand-700)}
    .qa-card .material-icons{font-size:26px;color:var(--cf-brand-600)}
    /* plan & usage */
    .plan{display:grid;grid-template-columns:1.2fr 1fr;gap:20px;align-items:center;margin-top:14px;padding:18px 20px;position:relative;overflow:hidden}
    .plan::before{content:"";position:absolute;inset:0;background:radial-gradient(440px 220px at 100% 0,var(--cf-brand-50),transparent 70%);pointer-events:none}
    .plan-left{position:relative}
    .plan-pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--cf-brand-700);background:var(--cf-brand-50);border:1px solid var(--cf-brand-100);border-radius:999px;padding:5px 12px}
    .plan-pill .material-icons{font-size:16px}
    .plan-left h3{font-size:18px;margin:12px 0 16px}
    .plan-meta{display:flex;gap:28px;flex-wrap:wrap;margin-bottom:18px}
    .plan-meta .pl{display:block;font-size:12px;color:var(--cf-ink-500)}
    .plan-meta .pv{display:block;font-size:15px;font-weight:600;color:var(--cf-ink-900);margin-top:3px}
    .plan-meta .pv.ok{color:var(--cf-success)}
    .plan-left .cf-btn .material-icons{font-size:18px}
    .plan-right{display:flex;align-items:center;gap:22px;justify-content:center;position:relative}
    .ring{position:relative;width:128px;height:128px;flex:none}
    .ring svg{width:128px;height:128px;transform:rotate(-90deg)}
    .ring .track{fill:none;stroke:var(--cf-line);stroke-width:12}
    .ring .prog{fill:none;stroke:var(--cf-brand-600);stroke-width:12;stroke-linecap:round;transition:stroke-dashoffset .6s ease}
    .ring-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
    .ring-center .pct{font-size:26px;font-weight:700;color:var(--cf-ink-900);letter-spacing:-.02em}
    .usage-legend{display:flex;flex-direction:column;gap:8px}
    .usage-legend .ul{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--cf-ink-600)}
    .usage-legend b{color:var(--cf-ink-900)}
    .usage-legend .dot{width:10px;height:10px;border-radius:3px;flex:none}
    .usage-legend .dot.brand{background:var(--cf-brand-600)}
    .usage-legend .dot.track2{background:var(--cf-line)}
    .ap-cta{margin-bottom:16px;position:relative;overflow:hidden;padding:0;border-color:color-mix(in srgb,var(--cf-brand-500) 22%,var(--cf-line))}
    .apq-top{display:flex;align-items:flex-start;gap:13px;padding:16px 17px 13px;background:linear-gradient(135deg,color-mix(in srgb,var(--cf-brand-500) 10%,var(--cf-surface)),var(--cf-surface) 70%);border-bottom:1px solid var(--cf-line)}
    .apq-ic{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;flex:none;background:linear-gradient(135deg,var(--cf-brand-500),var(--cf-brand-700));color:#fff;box-shadow:0 8px 18px -8px color-mix(in srgb,var(--cf-brand-600) 80%,transparent)}
    .apq-ic .material-icons{font-size:22px}
    .apq-tx{flex:1;min-width:0}
    .apq-tx h3{font-size:15px;font-weight:800;letter-spacing:-.01em;color:var(--cf-ink-900);display:flex;align-items:center;gap:9px;flex-wrap:wrap}
    .apq-count{font-size:11px;font-weight:800;color:#fff;background:var(--cf-warning);padding:3px 10px;border-radius:999px;box-shadow:0 4px 10px -4px var(--cf-warning)}
    .apq-tx p{font-size:12.5px;color:var(--cf-ink-500);margin-top:3px;line-height:1.5}
    .apq-open{display:inline-flex;align-items:center;gap:4px;font-size:12.5px;font-weight:700;color:var(--cf-brand-700);white-space:nowrap;flex:none}
    .apq-open .material-icons{font-size:15px;transition:transform .15s}
    .apq-open:hover .material-icons{transform:translateX(3px)}
    .apq-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 17px;background:var(--cf-surface-2);border-bottom:1px solid var(--cf-line)}
    .apq-selall{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;color:var(--cf-ink-600);cursor:pointer;position:relative}
    .apq-selall input{position:absolute;opacity:0;width:0;height:0}
    .apq-selall span{width:18px;height:18px;border:1.5px solid var(--cf-line);border-radius:5px;display:inline-grid;place-items:center;transition:.14s}
    .apq-selall input:checked + span{background:var(--cf-brand-600);border-color:var(--cf-brand-600)}
    .apq-selall input:checked + span::after{content:'';width:5px;height:9px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg);margin-top:-2px}
    .apq-approve{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 11px;border-radius:9px;border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-500);font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;transition:background .16s,color .16s,border-color .16s,transform .12s,box-shadow .16s}
    .apq-approve .material-icons{font-size:16px}
    .apq-approve:disabled{opacity:.65;cursor:not-allowed}
    .apq-approve.ready{background:linear-gradient(135deg,var(--cf-brand-500),var(--cf-brand-700));border-color:transparent;color:#fff;box-shadow:0 8px 18px -10px color-mix(in srgb,var(--cf-brand-600) 80%,transparent)}
    .apq-approve.ready:hover{transform:translateY(-1px);filter:brightness(1.03)}
    .apq-approve .cnt{display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:rgba(255,255,255,.26);font-size:11px;font-weight:800;animation:cntpop .2s ease}
    @keyframes cntpop{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}
    .ap-list{display:flex;flex-direction:column;gap:7px;padding:12px 14px 14px}
    .ap-tsec{display:flex;flex-direction:column;gap:6px;padding:8px;border:1px solid var(--cf-line);border-radius:13px;background:var(--cf-surface-2)}
    .ap-tsec+.ap-tsec{margin-top:2px}
    .ap-tsec-head{display:flex;align-items:center;gap:9px;padding:2px 4px 4px}
    .ap-tsec-ava{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;flex:none;box-shadow:0 3px 7px -2px rgba(15,23,42,.4)}
    .ap-tsec-ava .material-icons{font-size:15px;color:#fff}
    .ap-tsec-name{font-size:13px;font-weight:800;color:var(--cf-ink-900);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0}
    .ap-tsec-meta{display:flex;align-items:center;gap:9px;font-size:11.5px;color:var(--cf-ink-500)}
    .ap-tsec-meta>span{display:inline-flex;align-items:center;gap:3px}
    .ap-tsec-meta .material-icons{font-size:13px;color:var(--cf-ink-400)}
    .ap-tsec-cnt{min-width:24px;height:22px;padding:0 8px;border-radius:11px;display:grid;place-items:center;background:var(--cf-brand-50);color:var(--cf-brand-700);font-size:12px;font-weight:800;flex:none}
    .ap-subh{display:flex;align-items:center;gap:6px;font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--cf-ink-400);padding:4px 4px 2px 6px}
    .ap-subh .material-icons{font-size:13px}
    .ap-subh.bulk .material-icons{color:#7c3aed}
    .ap-subh.indiv .material-icons{color:var(--cf-brand-600)}
    .ap-item{display:flex;align-items:center;gap:12px;padding:9px 11px;border:1px solid var(--cf-line);border-radius:11px;background:var(--cf-surface);transition:border-color .14s,box-shadow .14s,background .14s}
    .ap-item:hover{border-color:color-mix(in srgb,var(--cf-brand-500) 26%,var(--cf-line));box-shadow:0 8px 20px -14px rgba(15,23,42,.4)}
    .ap-item.sel{border-color:var(--cf-brand-500);background:color-mix(in srgb,var(--cf-brand-50) 55%,var(--cf-surface))}
    .cbx{position:relative;display:inline-flex;flex:none;cursor:pointer}
    .cbx input{position:absolute;opacity:0;width:0;height:0}
    .cbx span{width:18px;height:18px;border:1.5px solid var(--cf-line);border-radius:5px;display:inline-grid;place-items:center;transition:.14s}
    .cbx input:checked + span{background:var(--cf-brand-600);border-color:var(--cf-brand-600)}
    .cbx input:checked + span::after{content:'';width:5px;height:9px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg);margin-top:-2px}
    .ap-av{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;flex:none}.ap-av .material-icons{font-size:17px}
    .ap-av.t-credential{background:var(--cf-brand-50);color:var(--cf-brand-600)}
    .ap-av.t-batch{background:color-mix(in srgb,#8b5cf6 14%,transparent);color:#7c3aed}
    .ap-av.t-template{background:var(--cf-gold-soft);color:var(--cf-gold-ink)}
    .ap-info{flex:1;min-width:0}
    .ap-top{display:flex;align-items:center;gap:8px}
    .ap-top strong{font-size:13.5px;color:var(--cf-ink-900);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .ap-n{font-size:10.5px;font-weight:700;color:var(--cf-ink-500);background:var(--cf-surface-2);border-radius:999px;padding:1px 7px;flex:none}
    .ap-age{font-size:10.5px;font-weight:700;color:var(--cf-ink-400);margin-inline-start:auto;flex:none}
    .ap-sub{display:block;font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}
    .ap-view{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-400);flex:none;transition:.14s}
    .ap-view .material-icons{font-size:17px}
    .ap-view:hover{color:var(--cf-brand-600);border-color:color-mix(in srgb,var(--cf-brand-500) 35%,var(--cf-line));background:var(--cf-brand-50)}
    /* analytics layout */
    .row.analytics{display:grid;grid-template-columns:1.7fr 1fr;gap:16px;margin-bottom:16px}
    @media(max-width:900px){.row.analytics{grid-template-columns:1fr}}
    .ch-ic{font-size:18px;color:var(--cf-brand-600);vertical-align:middle;margin-inline-end:5px}
    /* line chart */
    .legend2{display:flex;gap:16px;margin-top:2px}
    .lg2{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;color:var(--cf-ink-600)}
    .lg2 i{width:14px;height:3px;border-radius:2px;display:inline-block}
    .lg2 .d-issued{background:var(--cf-brand-600)}.lg2 .d-traffic{background:var(--cf-accent-500)}
    .linewrap{margin-top:8px}
    .linechart{width:100%;height:auto;display:block;overflow:visible}
    .linechart .grid{stroke:var(--cf-line);stroke-width:1;stroke-dasharray:3 4}
    .linechart .line{fill:none;stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round;stroke-dasharray:1700;stroke-dashoffset:1700;animation:cdraw 1.5s cubic-bezier(.4,0,.2,1) forwards}
    .linechart .line.issued{stroke:var(--cf-brand-600)}
    .linechart .line.traffic{stroke:var(--cf-accent-500);animation-delay:.18s}
    @keyframes cdraw{to{stroke-dashoffset:0}}
    .linechart .area{opacity:0;animation:cfade .9s ease .55s forwards}@keyframes cfade{to{opacity:1}}
    .cdot{stroke:var(--cf-surface);stroke-width:2;opacity:0;animation:cfade .4s ease .9s forwards}
    .cdot.issued{fill:var(--cf-brand-600)}.cdot.traffic{fill:var(--cf-accent-500)}
    .xlabels{display:flex;justify-content:space-between;padding:3px 8px 0;font-size:10.5px;color:var(--cf-ink-400)}
    /* verification traffic */
    .vf-total{display:flex;align-items:baseline;gap:8px;margin-top:8px;flex-wrap:wrap}
    .vf-num{font-size:30px;font-weight:800;letter-spacing:-.02em;color:var(--cf-ink-900)}
    .vf-lbl{font-size:12px;color:var(--cf-ink-500)}
    .vf-trend{margin-inline-start:auto;display:inline-flex;align-items:center;gap:3px;font-size:12px;font-weight:700;color:#15803d}.vf-trend .material-icons{font-size:15px}
    .spark{width:100%;height:48px;display:block;margin:10px 0 14px;overflow:visible}
    .spark .line{fill:none;stroke:var(--cf-brand-600);stroke-width:2;stroke-linejoin:round;stroke-dasharray:700;stroke-dashoffset:700;animation:cdraw 1.3s ease .2s forwards}
    .spark .area{opacity:0;animation:cfade .8s ease .5s forwards}
    .vf-breakdown{display:flex;flex-direction:column;gap:11px}
    .vfb-top{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--cf-ink-600)}.vfb-top b{margin-inline-start:auto;color:var(--cf-ink-900)}
    .vfb-dot{width:8px;height:8px;border-radius:50%}.vfb-dot.e{background:var(--cf-brand-500)}.vfb-dot.d{background:var(--cf-accent-500)}.vfb-dot.q{background:var(--cf-accent2-500)}
    .vfb-bar{display:block;height:6px;border-radius:999px;background:var(--cf-surface-2);overflow:hidden;margin-top:6px}
    .vfb-bar i{display:block;height:100%;border-radius:999px;transition:width .6s ease}.vfb-bar i.e{background:var(--cf-brand-500)}.vfb-bar i.d{background:var(--cf-accent-500)}.vfb-bar i.q{background:var(--cf-accent2-500)}
    /* quotas */
    .quotas{padding:18px 18px 20px;margin-bottom:16px}
    .qz-head{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:16px}
    .qz-h-tx h3{display:flex;align-items:center;gap:7px;font-size:15px;font-weight:800;color:var(--cf-ink-900)}.qz-h-tx h3 .material-icons{font-size:18px;color:var(--cf-brand-600)}
    .qz-h-tx p{font-size:12.5px;margin-top:3px}
    .qz-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
    @media(max-width:680px){.qz-grid{grid-template-columns:1fr}}
    .qz-top{display:flex;align-items:center;gap:9px;margin-bottom:9px}
    .qz-ic{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;flex:none}.qz-ic .material-icons{font-size:16px}
    .qz-ic.tpl{background:var(--cf-brand-50);color:var(--cf-brand-600)}
    .qz-ic.sto{background:color-mix(in srgb,var(--cf-accent-500) 14%,transparent);color:var(--cf-accent-600)}
    .qz-name{font-size:13px;font-weight:700;color:var(--cf-ink-800)}
    .qz-val{margin-inline-start:auto;font-size:12.5px;font-weight:700;color:var(--cf-ink-600);font-variant-numeric:tabular-nums}
    .qz-bar{height:9px;border-radius:999px;background:var(--cf-surface-2);border:1px solid var(--cf-line);overflow:hidden}
    .qz-bar span{display:block;height:100%;border-radius:999px;transition:width .6s ease}
    .qz-bar span.tpl{background:linear-gradient(90deg,var(--cf-brand-500),var(--cf-brand-600))}
    .qz-bar span.sto{background:linear-gradient(90deg,var(--cf-accent-500),var(--cf-accent-600))}
    /* subscription modal */
    .overlay{position:fixed;inset:0;background:rgba(2,6,23,.5);display:grid;place-items:center;z-index:80;padding:20px;animation:ovin .15s ease}@keyframes ovin{from{opacity:0}to{opacity:1}}
    .submodal{position:relative;width:100%;max-width:430px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:18px;box-shadow:var(--cf-shadow-lg);overflow:hidden;animation:smin .2s ease}
    @keyframes smin{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
    .submodal .close{position:absolute;top:12px;inset-inline-end:12px;border:0;background:none;color:var(--cf-ink-400);cursor:pointer;z-index:2}
    .sm-hero{text-align:center;padding:26px 22px 18px;background:linear-gradient(135deg,color-mix(in srgb,#16a34a 12%,var(--cf-surface)),var(--cf-surface) 72%);border-bottom:1px solid var(--cf-line)}
    .sm-seal{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;margin:0 auto 10px;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;box-shadow:0 12px 26px -12px #15803d}.sm-seal .material-icons{font-size:28px}
    .sm-hero h3{font-size:18px;font-weight:800;color:var(--cf-ink-900)}
    .sm-hero p{font-size:12.5px;color:var(--cf-ink-500);margin-top:5px;line-height:1.5}
    .sm-rows{padding:14px 20px;display:flex;flex-direction:column}
    .sm-row{display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--cf-line-soft);font-size:13px}
    .sm-row:last-child{border-bottom:0}
    .sm-k{color:var(--cf-ink-500)}.sm-v{font-weight:700;color:var(--cf-ink-900)}
    .sm-pill{font-size:11px;font-weight:800;padding:3px 11px;border-radius:999px}.sm-pill.ok{background:#dcfce7;color:#15803d}
    .sm-actions{display:flex;gap:10px;padding:2px 20px 20px}.sm-actions .cf-btn{flex:1;justify-content:center}
    /* ---- compact charts ---- */
    .chart-card .linechart{max-height:172px}
    .verif-card .vf-num{font-size:26px}
    .verif-card .vf-total{margin-top:4px}
    .spark{height:40px;margin:9px 0 13px}
    .vf-breakdown{gap:10px}
    .card-head h3{display:inline-flex;align-items:center;gap:7px}
    .sec-ic{font-size:17px;color:var(--cf-brand-600)}
    /* ---- approvals row actions ---- */
    .ap-rowact{display:flex;gap:6px;flex:none}
    .ap-mini{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;border:1px solid var(--cf-line);background:var(--cf-surface);cursor:pointer;transition:.14s}
    .ap-mini .material-icons{font-size:17px}
    .ap-mini.view{color:var(--cf-ink-400)}.ap-mini.view:hover{color:var(--cf-brand-600);border-color:color-mix(in srgb,var(--cf-brand-500) 35%,var(--cf-line));background:var(--cf-brand-50)}
    .ap-mini.ok{color:#15803d}.ap-mini.ok:hover{background:#16a34a;border-color:#16a34a;color:#fff;transform:translateY(-1px);box-shadow:0 8px 16px -8px #16a34a}
    /* ---- quotas (creative tiles) ---- */
    .qz-h-tx{display:flex;flex-direction:column;gap:3px}
    .qz-badge{display:inline-flex;align-items:center;gap:5px;align-self:flex-start;font-size:11px;font-weight:800;color:var(--cf-brand-700);background:var(--cf-brand-50);border:1px solid var(--cf-brand-100);padding:3px 10px;border-radius:999px;margin-bottom:3px}
    .qz-badge .material-icons{font-size:14px}
    .qz-h-tx h3{font-size:15px;font-weight:800;color:var(--cf-ink-900)}
    .qz-grid{grid-template-columns:repeat(3,1fr)}
    @media(max-width:820px){.quotas .qz-grid{grid-template-columns:1fr}}
    .qz{border:1px solid var(--cf-line);border-radius:13px;padding:14px;background:var(--cf-surface);transition:border-color .14s,box-shadow .14s}
    .qz:hover{border-color:color-mix(in srgb,var(--cf-brand-500) 24%,var(--cf-line));box-shadow:0 8px 20px -14px rgba(15,23,42,.4)}
    .qz-row{display:flex;align-items:center;gap:9px;margin-bottom:10px}
    .qz-ic{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;flex:none}.qz-ic .material-icons{font-size:17px}
    .qz.t-tpl .qz-ic{background:var(--cf-brand-50);color:var(--cf-brand-600)}
    .qz.t-cred .qz-ic{background:color-mix(in srgb,var(--cf-accent2-500) 15%,transparent);color:var(--cf-accent2-600)}
    .qz.t-sto .qz-ic{background:color-mix(in srgb,var(--cf-accent-500) 15%,transparent);color:var(--cf-accent-600)}
    .qz-name{font-size:12.5px;font-weight:700;color:var(--cf-ink-700)}
    .qz-pct{margin-inline-start:auto;font-size:11.5px;font-weight:800;color:var(--cf-ink-400);font-variant-numeric:tabular-nums}
    .qz-num{font-size:21px;font-weight:800;letter-spacing:-.02em;color:var(--cf-ink-900);margin-bottom:9px}.qz-num small{font-size:12px;font-weight:600;color:var(--cf-ink-400)}
    .qz-bar span{display:block}
    .qz.t-tpl .qz-bar span{background:linear-gradient(90deg,var(--cf-brand-500),var(--cf-brand-600))}
    .qz.t-cred .qz-bar span{background:linear-gradient(90deg,var(--cf-accent2-500),var(--cf-accent2-600))}
    .qz.t-sto .qz-bar span{background:linear-gradient(90deg,var(--cf-accent-500),var(--cf-accent-600))}
    /* ---- timeline activity ---- */
    .timeline{list-style:none;position:relative;padding-inline-start:6px;margin-top:4px}
    .timeline::before{content:'';position:absolute;inset-inline-start:18px;top:8px;bottom:8px;width:2px;background:var(--cf-line)}
    .timeline li{position:relative;display:flex;gap:13px;padding:8px 0}
    .tl-dot{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;flex:none;color:#fff;z-index:1;box-shadow:0 0 0 3px var(--cf-surface)}
    .tl-dot .material-icons{font-size:14px;color:#fff}
    .tl-tx{display:flex;flex-direction:column;min-width:0;padding-top:2px}
    .tl-main{font-size:13px;color:var(--cf-ink-800);line-height:1.4}
    /* ---- top templates ---- */
    .sec-sub{font-size:12px;margin:-4px 0 12px}
    .top-list{display:flex;flex-direction:column;gap:11px}
    .top-row{display:flex;align-items:center;gap:11px}
    .top-rank{width:22px;height:22px;border-radius:7px;display:grid;place-items:center;flex:none;font-size:11.5px;font-weight:800;color:var(--cf-ink-500);background:var(--cf-surface-2);border:1px solid var(--cf-line)}
    .top-rank.gold{background:linear-gradient(135deg,#f6c453,#d9a441);color:#fff;border-color:transparent;box-shadow:0 4px 10px -4px #d9a441}
    .top-thumb{width:38px;height:28px;border-radius:6px;overflow:hidden;flex:none;display:grid;place-items:center;background:var(--cf-surface-2);border:1px solid var(--cf-line)}
    .top-thumb img{width:100%;height:100%;object-fit:cover}.top-thumb .material-icons{font-size:15px;color:var(--cf-brand-500)}
    .top-body{flex:1;min-width:0}
    .top-name{display:block;font-size:12.5px;font-weight:600;color:var(--cf-ink-900);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:5px}
    .top-bar{display:block;height:5px;border-radius:999px;background:var(--cf-surface-2);overflow:hidden}
    .top-bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--cf-brand-500),var(--cf-accent-500))}
    .top-n{flex:none;display:flex;flex-direction:column;align-items:flex-end;font-size:13.5px;font-weight:800;color:var(--cf-ink-900);line-height:1}.top-n small{font-size:9.5px;font-weight:600;color:var(--cf-ink-400);margin-top:2px;text-transform:uppercase;letter-spacing:.03em}
    /* ---- recent templates strip ---- */
    .rt-card{margin-top:16px}
    .rt-strip{display:flex;gap:12px;overflow-x:auto;padding:4px 2px 6px;scrollbar-width:thin}
    .rt-strip::-webkit-scrollbar{height:7px}.rt-strip::-webkit-scrollbar-thumb{background:var(--cf-line);border-radius:999px}
    .rt-tile{flex:none;width:150px;text-decoration:none;display:flex;flex-direction:column;gap:6px;border:1px solid var(--cf-line);border-radius:12px;padding:8px;background:var(--cf-surface);transition:transform .14s,box-shadow .14s,border-color .14s}
    .rt-tile:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--cf-brand-500) 30%,var(--cf-line));box-shadow:0 12px 26px -16px rgba(15,23,42,.45)}
    .rt-thumb{height:84px;border-radius:8px;overflow:hidden;display:grid;place-items:center;background:var(--cf-surface-2);border:1px solid var(--cf-line)}
    .rt-thumb img{width:100%;height:100%;object-fit:cover}.rt-thumb .material-icons{font-size:26px;color:var(--cf-brand-400)}
    .rt-name{font-size:12.5px;font-weight:700;color:var(--cf-ink-900);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    /* ---- certs pro table ---- */
    .certs-card .tablewrap{overflow-x:auto;margin-top:4px}
    .cf-table.pro th{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--cf-ink-500);font-weight:700;text-align:start;padding:10px 12px;border-bottom:1px solid var(--cf-line);background:var(--cf-surface-2)}
    .cf-table.pro td{padding:11px 12px;border-bottom:1px solid var(--cf-line-soft);vertical-align:middle}
    .cf-table.pro tr:last-child td{border-bottom:0}.cf-table.pro tbody tr:hover{background:var(--cf-surface-2)}
    .cf-table.pro .ta-end{text-align:end}
    .cr-recip{display:flex;align-items:center;gap:9px}
    .cr-av{width:30px;height:30px;border-radius:50%;background:var(--cf-brand-50);color:var(--cf-brand-700);border:1px solid var(--cf-brand-100);display:grid;place-items:center;font-size:10.5px;font-weight:800;flex:none}
    .cr-name{font-weight:600;color:var(--cf-ink-900)}
    .cr-tpl{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;color:var(--cf-ink-600)}.cr-tpl .material-icons{font-size:14px;color:var(--cf-brand-500)}
    /* ---- view/sign modal ---- */
    .submodal.vmodal{max-width:720px}
    .vm-grid{display:grid;grid-template-columns:1.05fr 1fr}
    @media(max-width:640px){.vm-grid{grid-template-columns:1fr}}
    .vm-cert{padding:22px;background:radial-gradient(130% 100% at 50% 0%,color-mix(in srgb,var(--cf-brand-500) 15%,var(--cf-surface-2)),color-mix(in srgb,var(--cf-ink-900) 6%,var(--cf-surface-2)));display:grid;place-items:center}
    .cert-mock{width:100%;background:var(--cf-surface);border:1px solid var(--cf-line);border-top:4px solid var(--cf-brand-600);border-radius:12px;padding:24px 20px;text-align:center;box-shadow:0 18px 40px -22px rgba(2,6,23,.5);display:flex;flex-direction:column;align-items:center;gap:4px}
    .cm-seal{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,var(--cf-brand-500),var(--cf-brand-700));color:#fff;margin-bottom:6px;box-shadow:0 8px 18px -8px color-mix(in srgb,var(--cf-brand-600) 80%,transparent)}.cm-seal .material-icons{font-size:23px}
    .cm-eyebrow{font-size:9.5px;font-weight:800;letter-spacing:.22em;color:var(--cf-ink-400)}
    .cm-title{font-size:16px;font-weight:800;color:var(--cf-ink-900)}
    .cm-pres{font-size:11px;color:var(--cf-ink-500);margin-top:5px}
    .cm-name{font-size:20px;font-weight:800;color:var(--cf-brand-700);font-family:'Playfair Display',Georgia,serif}
    .cm-rule{width:74px;height:2px;border-radius:2px;background:linear-gradient(90deg,transparent,var(--cf-brand-500),transparent);margin:6px 0}
    .cm-batch{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:var(--cf-ink-500)}.cm-batch .material-icons{font-size:14px}
    .vm-body{padding:20px 20px 18px;display:flex;flex-direction:column;min-width:0}
    .vm-head{display:flex;align-items:center;gap:8px;margin-bottom:9px}
    .vm-body h3{font-size:17px;font-weight:800;color:var(--cf-ink-900);margin-bottom:11px}
    .tchip{display:inline-flex;align-items:center;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;padding:3px 9px;border-radius:999px;background:var(--cf-brand-50);color:var(--cf-brand-700)}
    .vm-head .age{display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:700;color:var(--cf-warning);background:var(--cf-warning-soft);padding:3px 9px;border-radius:999px}.vm-head .age .material-icons{font-size:12px}
    .vm-meta{display:flex;flex-direction:column;gap:8px;font-size:12.5px;color:var(--cf-ink-700)}
    .vm-meta>div{display:flex;align-items:center;gap:10px;min-width:0;font-size:12.5px}
    .vm-meta .material-icons{font-size:16px;color:var(--cf-brand-600);flex:none;width:28px;height:28px;border-radius:8px;background:var(--cf-brand-50);display:grid;place-items:center}
    .vm-real{transition:transform .3s cubic-bezier(.2,.8,.25,1)}
    .vm-real:hover{transform:scale(1.02)}
    .vm-note{display:flex;align-items:flex-start;gap:7px;margin-top:12px;padding:8px 11px;background:var(--cf-surface-2);border-radius:9px;font-size:12.5px;color:var(--cf-ink-700)}.vm-note .material-icons{font-size:16px;color:var(--cf-ink-400)}
    .signbox{margin-top:14px;border:1px dashed color-mix(in srgb,var(--cf-brand-500) 40%,var(--cf-line));border-radius:12px;padding:11px 14px;background:var(--cf-brand-50);display:flex;flex-direction:column;gap:1px}
    .sb-lbl{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--cf-brand-700)}
    .sb-sign{font-family:'Brush Script MT','Segoe Script',cursive;font-size:28px;line-height:1.2;color:var(--cf-ink-900)}
    .signbox .sb-lbl{display:inline-flex;align-items:center;gap:5px}.signbox .sb-lbl .material-icons{font-size:13px}
    .signbox{position:relative;overflow:hidden;padding:8px 13px 8px 16px;margin-top:12px;gap:0;background:linear-gradient(135deg,var(--cf-brand-50),var(--cf-surface))}
    .signbox:not(.nosig)::before{content:'';position:absolute;inset-inline-start:0;top:0;bottom:0;width:3px;background:linear-gradient(180deg,var(--cf-brand-500),var(--cf-brand-700))}
    .signbox .sb-img{max-height:42px;max-width:160px;margin:2px 0}
    .signbox .sb-sign{font-size:21px}
    .signbox .sb-name{font-size:10.5px}
    .signbox .sb-lbl{font-size:9.5px}
    .sb-img{max-width:220px;max-height:72px;object-fit:contain;align-self:flex-start;margin:3px 0}
    .signbox.nosig{border-color:color-mix(in srgb,#d97706 45%,var(--cf-line));background:color-mix(in srgb,#d97706 8%,transparent)}
    .sb-missing{font-size:12px;color:#b45309;line-height:1.5}
    .sb-add{border:0;background:none;color:var(--cf-brand-600);font:inherit;font-size:12px;font-weight:700;text-decoration:underline;cursor:pointer;padding:0}
    .vm-real{max-width:100%;max-height:300px;width:auto;object-fit:contain;border-radius:9px;box-shadow:0 16px 40px -18px rgba(2,6,23,.5)}
    .vm-batchcap{display:inline-flex;align-items:center;gap:6px;margin-top:10px;font-size:11.5px;font-weight:600;color:var(--cf-ink-500)}.vm-batchcap .material-icons{font-size:14px;color:var(--cf-brand-600)}
    .nsmodal{position:relative;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:16px;padding:24px;max-width:400px;width:92%;text-align:center;box-shadow:0 30px 80px -20px rgba(2,6,23,.55)}
    .nsmodal .close{position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:8px;border:0;background:var(--cf-surface-2);cursor:pointer;display:grid;place-items:center;color:var(--cf-ink-500)}
    .nsmodal .ns-ic{width:56px;height:56px;border-radius:50%;display:grid;place-items:center;margin:4px auto 12px;background:color-mix(in srgb,#d97706 14%,transparent);color:#d97706}.nsmodal .ns-ic .material-icons{font-size:28px}
    .nsmodal h3{margin:0 0 6px;font-size:17px}.nsmodal p{margin:0 0 18px}
    .ns-actions{display:flex;gap:10px;justify-content:center}
    .sb-name{font-size:11px}
    .vm-actions{display:flex;gap:10px;margin-top:auto;padding-top:15px}.vm-actions{justify-content:flex-end;gap:9px}
    .vm-actions .cf-btn{flex:none;height:40px;padding:0 16px;border-radius:11px;font-size:13px;justify-content:center}
    .vm-actions .cf-btn-secondary{color:var(--cf-ink-600)}
    .vm-actions .cf-btn-primary{background:linear-gradient(135deg,#16a34a,#15803d);border:0;color:#fff;font-weight:700;padding:0 18px;box-shadow:0 8px 18px -8px rgba(22,163,74,.65);transition:transform .14s,box-shadow .14s,filter .14s}
    .vm-actions .cf-btn-primary:hover{transform:translateY(-1px);box-shadow:0 12px 22px -8px rgba(22,163,74,.78);filter:brightness(1.04)}
    .vm-actions .cf-btn-primary .material-icons{font-size:17px}
    /* ===== amazing polish ===== */
    @keyframes dUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
    @media (prefers-reduced-motion: no-preference){
      .hero{animation:dUp .55s cubic-bezier(.2,.7,.2,1) both}
      .cf-metric{animation:dUp .5s ease both}
      .cf-metric:nth-child(1){animation-delay:.05s}.cf-metric:nth-child(2){animation-delay:.1s}.cf-metric:nth-child(3){animation-delay:.15s}.cf-metric:nth-child(4){animation-delay:.2s}
      .row.analytics{animation:dUp .55s ease .2s both}
      .ap-cta{animation:dUp .55s ease .24s both}
      .quotas{animation:dUp .55s ease .28s both}
      .row.two{animation:dUp .55s ease .32s both}
      .rt-card{animation:dUp .55s ease .36s both}
      .certs-card{animation:dUp .55s ease .4s both}
    }
    /* KPI metric cards: count-up + sparkline + hover */
    .cf-metric{position:relative;overflow:hidden;transition:transform .18s,box-shadow .18s,border-color .18s}
    .cf-metric:hover{transform:translateY(-3px);box-shadow:0 18px 36px -22px rgba(15,23,42,.55)}
    .cf-metric .ic{transition:transform .2s cubic-bezier(.2,1.3,.4,1)}
    .cf-metric:hover .ic{transform:scale(1.08) rotate(-4deg)}
    .cf-metric-val{font-variant-numeric:tabular-nums}
    .kpi-spark{position:absolute;left:0;right:0;bottom:0;width:100%;height:30px;opacity:.16;pointer-events:none}
    .kpi-spark polyline{fill:none;stroke-width:2.5;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}
    .kpi-spark.s1 polyline{stroke:var(--cf-brand-600)}
    .kpi-spark.s2 polyline{stroke:var(--cf-gold-ink)}
    .kpi-spark.s3 polyline{stroke:#7c3aed}
    .kpi-spark.s4 polyline{stroke:#15803d}
    .cf-metric:hover .kpi-spark{opacity:.32}
    /* living hero */
    .hero-bg::before{content:'';position:absolute;width:360px;height:360px;border-radius:50%;top:-170px;inset-inline-end:-70px;background:radial-gradient(circle,rgba(255,255,255,.20),transparent 70%);animation:heroFloat 10s ease-in-out infinite}
    @keyframes heroFloat{0%,100%{transform:translate(0,0)}50%{transform:translate(-26px,22px)}}
    .hero-cta{transition:transform .14s,box-shadow .16s,filter .16s}
    .hero-cta:hover{transform:translateY(-2px);filter:brightness(1.02)}
    /* gentle card lift for content cards */
    .row.two .cf-card,.rt-card,.certs-card{transition:box-shadow .18s,border-color .18s}
    .row.two .cf-card:hover,.rt-card:hover,.certs-card:hover{box-shadow:0 16px 34px -24px rgba(15,23,42,.5)}
    /* timeline entrance + activity row hover */
    .timeline li{transition:transform .14s}.timeline li:hover{transform:translateX(2px)}
    .top-row{transition:transform .14s}.top-row:hover{transform:translateX(2px)}
    /* iconed section headers */
    .card-head h3 .sec-ic,.card-head h3 .ch-ic{width:26px;height:26px;border-radius:8px;display:inline-grid;place-items:center;background:var(--cf-brand-50);color:var(--cf-brand-600);font-size:15px;margin:0}
    .card-head h3 .ch-ic.v{background:color-mix(in srgb,var(--cf-accent-500) 15%,transparent);color:var(--cf-accent-600)}
    /* KPI hover accent line */
    .cf-metric::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--cf-brand-500),var(--cf-accent-500));transform:scaleX(0);transform-origin:left;transition:transform .3s ease;z-index:2}
    .cf-metric:hover::before{transform:scaleX(1)}
    /* full-width traffic chart */
    .chart-card{animation:dUp .55s ease .2s both}
    .verif-card{animation:dUp .55s ease .26s both}
    .ch-summary{display:flex;gap:22px;flex-wrap:wrap;margin:6px 0 2px;padding-bottom:10px;border-bottom:1px solid var(--cf-line-soft)}
    .chs{display:flex;align-items:center;gap:9px}
    .chs-dot{width:10px;height:10px;border-radius:50%;flex:none}.chs-dot.issued{background:var(--cf-brand-600)}.chs-dot.traffic{background:var(--cf-accent-500)}
    .chs-ic{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:var(--cf-gold-soft);color:var(--cf-gold-ink);flex:none}.chs-ic .material-icons{font-size:15px}
    .chs-tx{display:flex;flex-direction:column;line-height:1.15}
    .chs-v{font-size:15px;font-weight:800;color:var(--cf-ink-900);letter-spacing:-.01em}
    .chs-l{font-size:11px;color:var(--cf-ink-500);margin-top:2px}
    .gridv{font-size:11px;fill:var(--cf-ink-300);text-anchor:end;font-weight:600}
    .peak{fill:var(--cf-accent-500)}
    .peak-ring{fill:none;stroke:var(--cf-accent-500);stroke-width:2;opacity:.45;animation:peakP 2.2s ease-in-out infinite}
    @keyframes peakP{0%,100%{opacity:.5}50%{opacity:.12}}
    .xlabels{padding-top:4px}
    /* verification traffic — ring + channels */
    .verif-card .vf-trend{margin-inline-start:auto}
    .vf-top2{display:flex;align-items:baseline;gap:8px;margin:8px 0 14px;flex-wrap:wrap}
    .vf-top2 .vf-num{font-size:24px;font-weight:800;color:var(--cf-ink-900);letter-spacing:-.02em}
    .vf-top2 .vf-lbl{font-size:12px;color:var(--cf-ink-500)}
    .vf-grid{display:grid;grid-template-columns:auto 1fr;gap:30px;align-items:center;margin-top:10px}
    @media(max-width:620px){.vf-grid{grid-template-columns:1fr;justify-items:center;gap:18px}}
    .vf-ring{position:relative;width:150px;height:150px;flex:none}
    .vf-ring svg{width:150px;height:150px;transform:rotate(-90deg)}
    .vt-track{fill:none;stroke:var(--cf-surface-2);stroke-width:14}
    .vt-seg{fill:none;stroke-width:14;stroke-linecap:butt;transition:stroke-dasharray .7s ease}
    .vt-seg.s-e{stroke:var(--cf-brand-500)}.vt-seg.s-d{stroke:var(--cf-accent-500)}.vt-seg.s-q{stroke:var(--cf-accent2-500)}
    .vf-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
    .vf-center .vf-num{font-size:25px;font-weight:800;color:var(--cf-ink-900);letter-spacing:-.02em}
    .vf-center .vf-lbl{font-size:10px;color:var(--cf-ink-500);text-transform:uppercase;letter-spacing:.05em;margin-top:2px}
    .vf-channels{display:flex;flex-direction:column;gap:13px;width:100%}
    .vf-ch{display:flex;align-items:center;gap:12px}
    .vf-ch-ic{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;flex:none}.vf-ch-ic .material-icons{font-size:17px}
    .vf-ch.s-e .vf-ch-ic{background:var(--cf-brand-50);color:var(--cf-brand-600)}
    .vf-ch.s-d .vf-ch-ic{background:color-mix(in srgb,var(--cf-accent-500) 14%,transparent);color:var(--cf-accent-600)}
    .vf-ch.s-q .vf-ch-ic{background:color-mix(in srgb,var(--cf-accent2-500) 14%,transparent);color:var(--cf-accent2-600)}
    .vf-ch-tx{flex:1;min-width:0}
    .vf-ch-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
    .vf-ch-name{font-size:13px;font-weight:600;color:var(--cf-ink-800)}
    .vf-ch-pct{font-size:12px;font-weight:700;color:var(--cf-ink-500)}
    .vf-ch-bar{display:block;height:7px;border-radius:999px;background:var(--cf-surface-2);overflow:hidden}
    .vf-ch-bar i{display:block;height:100%;border-radius:999px;transition:width .7s ease}
    .vf-ch.s-e .vf-ch-bar i{background:var(--cf-brand-500)}.vf-ch.s-d .vf-ch-bar i{background:var(--cf-accent-500)}.vf-ch.s-q .vf-ch-bar i{background:var(--cf-accent2-500)}
    .vf-ch-num{font-size:16px;font-weight:800;color:var(--cf-ink-900);flex:none;min-width:56px;text-align:end;font-variant-numeric:tabular-nums}
    /* smart hero summary */
    .hero-sum{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13.5px;color:var(--cf-ink-500);max-width:none}
    .hero-sum b{color:var(--cf-ink-900);font-weight:800}
    .hero-sum .sep{color:var(--cf-ink-300)}
    /* ===== compact density pass ===== */
    .cf-card-pad{padding:13px 15px}
    .cf-metrics{gap:11px;margin-bottom:12px}
    .cf-metric{padding:12px 14px}
    .cf-metric .ic{width:33px;height:33px;margin-bottom:8px;border-radius:9px}
    .cf-metric .ic .material-icons{font-size:18px}
    .cf-metric-lbl{font-size:12px}
    .cf-metric-val{font-size:21px}
    .delta{font-size:11.5px}
    .hero{margin-bottom:14px}
    .row.analytics{gap:12px;margin-bottom:12px}
    .row.two{gap:12px;margin-bottom:12px}
    .ap-cta{margin-bottom:12px}
    .quotas{padding:14px 15px;margin-bottom:12px}
    .qz{padding:12px}
    .qz-row{margin-bottom:8px}
    .qz-num{font-size:19px;margin-bottom:7px}
    .rt-card,.certs-card{margin-top:12px}
    .chart-card .linechart{max-height:150px}
    .ch-summary{gap:18px;margin:4px 0 2px;padding-bottom:8px}
    .chs-v{font-size:14px}
    .chs-ic,.chs-dot{transform:scale(.92)}
    .vf-top2{margin:6px 0 11px}
    .vf-top2 .vf-num{font-size:22px}
    .vf-channels{gap:11px}
    .timeline li{padding:6px 0}
    .top-list{gap:9px}
    .rt-thumb{height:74px}
    .rt-tile{width:140px}
    /* labeled approve + queue pager */
    .ap-approve-row{display:inline-flex;align-items:center;gap:5px;height:32px;padding:0 12px;border-radius:9px;border:1px solid color-mix(in srgb,#16a34a 40%,var(--cf-line));background:none;color:#15803d;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;transition:background .14s,color .14s,border-color .14s,transform .12s,box-shadow .16s}
    .ap-approve-row .material-icons{font-size:16px}
    .ap-approve-row:hover{background:#16a34a;border-color:#16a34a;color:#fff;transform:translateY(-1px);box-shadow:0 8px 16px -8px #16a34a}
    .apq-pager{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px 12px;border-top:1px solid var(--cf-line-soft)}
    .apq-info{font-size:12px;color:var(--cf-ink-500)}
    .apq-pg-btns{display:flex;align-items:center;gap:6px}
    .apq-pg-btns button{width:30px;height:30px;border-radius:8px;border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-600);cursor:pointer;display:grid;place-items:center;transition:.14s}
    .apq-pg-btns button:hover:not(:disabled){border-color:color-mix(in srgb,var(--cf-brand-500) 40%,var(--cf-line));color:var(--cf-brand-700);background:var(--cf-brand-50)}
    .apq-pg-btns button:disabled{opacity:.4;cursor:not-allowed}
    .apq-pg-btns .material-icons{font-size:18px}
    .apq-pg{font-size:12px;font-weight:700;color:var(--cf-ink-700);min-width:42px;text-align:center}
    /* recent certificates polish */
    .certs-card .card-head .link{display:inline-flex;align-items:center;gap:3px}
    .certs-card .card-head .link .material-icons{font-size:15px;transition:transform .15s}
    .certs-card .card-head .link:hover .material-icons{transform:translateX(3px)}
    .certs-card .cf-table.pro tbody tr{cursor:pointer;transition:background .12s}
    @media(max-width:720px){.plan{grid-template-columns:1fr}.plan-right{justify-content:flex-start}}
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
export class DashboardPage {
  private templates = inject(TemplateService);
  private alerts = inject(AlertService);
  readonly approvals = inject(ApprovalService);
  private issuedSvc = inject(IssuedService);
  private router = inject(Router);
  readonly plan = inject(PlanService);
  private auth = inject(AuthService);
  private tour = inject(TourService);
  private perm = inject(PermissionService);
  private langSvc = inject(LanguageService);
  readonly tourUi = computed(() => (this.langSvc.lang() === 'ar' ? DASH_TOUR_UI.ar : DASH_TOUR_UI.en));
  readonly A = Actions;

  showOnboarding = signal(localStorage.getItem('cf-onboarding-done') !== '1');
  private items = signal<TemplateListItem[]>([]);
  loading = signal(true);

  templateCount = computed(() => this.items().length);
  recent = computed(() =>
    [...this.items()].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 5),
  );

  // Illustrative until the backend reports real figures.
  issued = signal(2847);
  pending = computed(() => this.approvals.pendingCount());
  apqPage = signal(1);
  apqPageSize = 10;
  pendingAll = computed(() => this.approvals.pending());
  pendingItems = computed(() => { const all = this.pendingAll(); const start = (this.apqPage() - 1) * this.apqPageSize; return all.slice(start, start + this.apqPageSize); });
  apqPages = computed(() => Math.max(1, Math.ceil(this.pendingAll().length / this.apqPageSize)));
  tplGrad(name: string): string {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
    return `linear-gradient(135deg, hsl(${h},68%,54%), hsl(${(h + 28) % 360},70%,44%))`;
  }
  /** Group the current queue page: Template -> { Bulk batches, Individual }. */
  dashTplGroups = computed(() => {
    const map = new Map<string, Approval[]>();
    for (const a of this.pendingItems()) { const k = a.item || 'Untitled'; const arr = map.get(k) ?? map.set(k, []).get(k)!; arr.push(a); }
    return [...map.entries()]
      .map(([name, items]) => ({
        name,
        batches: items.filter((a) => a.type === 'Batch'),
        individ: items.filter((a) => a.type !== 'Batch'),
        recips: items.reduce((n, a) => n + (a.count || 1), 0),
      }))
      .sort((x, y) => y.recips - x.recips || x.name.localeCompare(y.name));
  });
  apqPrev(): void { if (this.apqPage() > 1) this.apqPage.update((p) => p - 1); }
  apqNext(): void { if (this.apqPage() < this.apqPages()) this.apqPage.update((p) => p + 1); }
  min(a: number, b: number): number { return Math.min(a, b); }
  activeUsers = signal(24);

  // Plan & usage
  planType = signal('Standard');
  renewalDate = signal('31 Dec 2025');
  created = signal(1209);
  limit = signal(2000);
  remaining = computed(() => Math.max(0, this.limit() - this.created()));
  usagePct = computed(() => (this.limit() ? Math.round((this.created() / this.limit()) * 100) : 0));
  readonly circ = 2 * Math.PI * 52;
  dashOffset = computed(() => this.circ * (1 - this.usagePct() / 100));

  // Chart
  range = signal<'6m' | '12m'>('6m');
  private data6: MonthVal[] = [
    { label: 'Jan', v: 320 }, { label: 'Feb', v: 440 }, { label: 'Mar', v: 390 },
    { label: 'Apr', v: 560 }, { label: 'May', v: 500 }, { label: 'Jun', v: 690 },
  ];
  private data12: MonthVal[] = [
    { label: 'Jul', v: 210 }, { label: 'Aug', v: 280 }, { label: 'Sep', v: 350 }, { label: 'Oct', v: 300 },
    { label: 'Nov', v: 420 }, { label: 'Dec', v: 480 }, { label: 'Jan', v: 320 }, { label: 'Feb', v: 440 },
    { label: 'Mar', v: 390 }, { label: 'Apr', v: 560 }, { label: 'May', v: 500 }, { label: 'Jun', v: 690 },
  ];
  bars = computed(() => {
    const d = this.range() === '6m' ? this.data6 : this.data12;
    const max = Math.max(...d.map((x) => x.v), 1);
    return d.map((x, i) => ({ label: x.label, value: x.v, pct: Math.round((x.v / max) * 100), hot: i === d.length - 1 }));
  });

  // Status donut
  private statuses: StatusSeg[] = [
    { label: 'Active', value: 1760, color: '#0F9D6B' },
    { label: 'Pending', value: 412, color: '#C77700' },
    { label: 'Expired', value: 255, color: '#DC2626' },
    { label: 'Draft', value: 420, color: '#94A3B8' },
  ];
  private readonly donutCirc = 2 * Math.PI * 52;
  statusTotal = signal(this.statuses.reduce((s, x) => s + x.value, 0));
  donut = computed(() => {
    const total = this.statusTotal() || 1;
    let acc = 0;
    return this.statuses.map((s) => {
      const len = (s.value / total) * this.donutCirc;
      const seg = { ...s, dash: `${len} ${this.donutCirc - len}`, offset: -acc, pct: Math.round((s.value / total) * 100) };
      acc += len;
      return seg;
    });
  });

  // Activity feed
  activity: Activity[] = [
    { icon: 'verified', color: '#0F9D6B', text: '128 certificates issued from “PM Pro”', time: '2 hours ago' },
    { icon: 'fact_check', color: '#4F46E5', text: 'Batch of 40 approved by Sara', time: '5 hours ago' },
    { icon: 'edit', color: '#C77700', text: 'Template “UX Foundations” edited', time: 'Yesterday' },
    { icon: 'group_add', color: '#0284C7', text: 'Omar invited as Editor', time: '2 days ago' },
  ];

  // Recent certificates
  certs: CertRow[] = [
    { recipient: 'Sara Al-Amiri', template: 'PM Pro', status: 'Active', date: 'Jun 13, 2026' },
    { recipient: 'Omar Khalid', template: 'Data Analytics', status: 'Pending', date: 'Jun 13, 2026' },
    { recipient: 'Layla Hassan', template: 'UX Foundations', status: 'Active', date: 'Jun 12, 2026' },
    { recipient: 'Yousef Nabil', template: 'Cloud Practitioner', status: 'Expired', date: 'Jun 10, 2026' },
  ];

  dashSel = signal<Set<number>>(new Set<number>());
  dashSelCount = computed(() => this.dashSel().size);
  dashIsSel(id: number): boolean { return this.dashSel().has(id); }
  dashToggle(id: number): void { const s = new Set(this.dashSel()); s.has(id) ? s.delete(id) : s.add(id); this.dashSel.set(s); }
  dashAllSel = computed(() => { const p = this.pendingItems(); return p.length > 0 && p.every((a) => this.dashSel().has(a.id)); });
  dashToggleAll(): void { const p = this.pendingItems(); const s = new Set(this.dashSel()); const all = p.every((a) => s.has(a.id)); p.forEach((a) => (all ? s.delete(a.id) : s.add(a.id))); this.dashSel.set(s); }
  async approveSelectedDash(): Promise<void> {
    const ids = [...this.dashSel()]; if (!ids.length) return;
    if (!(await this.confirmApprove(ids.length))) return;
    this.guard(() => { const items = this.approvals.pending().filter((a) => ids.includes(a.id)); this.approvals.approveMany(ids, this.approver()); items.forEach((a) => this.resign(a)); this.dashSel.set(new Set<number>()); this.alerts.success(ids.length + ' approved & signed.'); });
  }
  apAge(a: Approval): string { const d = +new Date(a.requestedAt); const n = d ? Math.floor((Date.now() - d) / 86400000) : 0; return n <= 0 ? 'today' : n === 1 ? '1d' : n + 'd'; }

  // ---- live metrics ----
  issuedTotal = computed(() => this.issuedSvc.stats().total || 2847);
  totalViews = computed(() => { let v = 0; for (const r of this.issuedSvc.records()) v += this.issuedSvc.analytics(r).views; return v || 9482; });
  deliverySuccess = computed(() => { const s = this.issuedSvc.stats(); const denom = s.sent + s.failed; return denom ? Math.round((s.sent / denom) * 100) : 100; });

  // ---- quotas & storage ----
  tplLimitLabel(): string { const l = this.plan.templateLimit(); return isFinite(l) ? String(l) : '∞'; }
  tplPct(): number { const l = this.plan.templateLimit(); return !isFinite(l) || l <= 0 ? 0 : Math.min(100, Math.round((this.templateCount() / l) * 100)); }
  storageUsedMB = computed(() => { let b = 0; try { Object.keys(localStorage).forEach((k) => { b += (localStorage.getItem(k) || '').length + k.length; }); } catch { /* ignore */ } return Math.max(0.1, Math.round((b / 1048576) * 10) / 10); });
  storageLimitLabel(): string { const l = this.plan.storageLimitMB(); return isFinite(l) ? l.toLocaleString() : '∞'; }
  storagePct(): number { const l = this.plan.storageLimitMB(); return !isFinite(l) || l <= 0 ? 0 : Math.min(100, Math.round((this.storageUsedMB() / l) * 100)); }

  // ---- subscription modal ----
  subOpen = signal(false);
  goPricing(): void { this.subOpen.set(false); this.router.navigate(['/pricing']); }

  // ---- traffic & issuance trend (line chart) ----
  chart = computed(() => {
    const d = this.range() === '6m' ? this.data6 : this.data12;
    const issued = d.map((x) => x.v);
    const traffic = issued.map((v, i) => Math.round(v * 2.6 + 140 + (i % 3) * 45));
    const labels = d.map((x) => x.label);
    const W = 1000, H = 150, padL = 38, padR = 12, padT = 12, padB = 22;
    const pw = W - padL - padR, ph = H - padT - padB, n = labels.length;
    const max = Math.max(...issued, ...traffic, 1) * 1.16;
    const xs = (i: number) => padL + (n <= 1 ? pw / 2 : (pw * i) / (n - 1));
    const ys = (v: number) => padT + ph * (1 - v / max);
    const line = (a: number[]) => a.map((v, i) => xs(i).toFixed(1) + ',' + ys(v).toFixed(1)).join(' ');
    const area = (a: number[]) => 'M' + padL + ',' + ys(0).toFixed(1) + ' ' + a.map((v, i) => 'L' + xs(i).toFixed(1) + ',' + ys(v).toFixed(1)).join(' ') + ' L' + (padL + pw).toFixed(1) + ',' + ys(0).toFixed(1) + ' Z';
    const grid = [1, 0.75, 0.5, 0.25, 0].map((f) => ({ y: ys(max * f).toFixed(1), v: Math.round((max * f) / 100) * 100 }));
    const dots = (a: number[]) => a.map((v, i) => ({ x: +xs(i).toFixed(1), y: +ys(v).toFixed(1) }));
    const peakIdx = traffic.indexOf(Math.max(...traffic));
    return {
      W, H, padL, labels, grid,
      issuedLine: line(issued), issuedArea: area(issued), trafficLine: line(traffic), trafficArea: area(traffic),
      idots: dots(issued), tdots: dots(traffic),
      totalIssued: issued.reduce((a, b) => a + b, 0), totalTraffic: traffic.reduce((a, b) => a + b, 0),
      peakLabel: labels[peakIdx] || '', peakVal: traffic[peakIdx] || 0, peakX: +xs(peakIdx).toFixed(1), peakY: +ys(traffic[peakIdx]).toFixed(1),
    };
  });

  // ---- verification traffic ----
  verif = computed(() => {
    let e = 0, dr = 0, q = 0;
    for (const r of this.issuedSvc.records()) { const a = this.issuedSvc.analytics(r); e += a.email; dr += a.direct; q += a.qr; }
    if (e + dr + q === 0) { e = 742; dr = 389; q = 153; }
    const total = e + dr + q; const pct = (x: number) => Math.round((x / total) * 100);
    const C = 2 * Math.PI * 42; let acc = 0;
    const mk = (v: number, key: string, label: string, icon: string) => { const len = total ? (v / total) * C : 0; const o = -acc; acc += len; return { key, label, icon, value: v, pct: pct(v), dash: len.toFixed(2) + ' ' + (C - len).toFixed(2), offset: o.toFixed(2) }; };
    const segs = [mk(e, 'e', 'Email', 'mail'), mk(dr, 'd', 'Direct visit', 'ads_click'), mk(q, 'q', 'QR scan', 'qr_code_2')];
    return { total, email: e, direct: dr, qr: q, ePct: pct(e), dPct: pct(dr), qPct: pct(q), segs };
  });

  // ---- animated KPI counters + sparklines ----
  aIssued = signal(0); aTemplates = signal(0); aViews = signal(0); aDelivery = signal(0); aPending = signal(0);
  private sparks = [[6, 9, 7, 12, 10, 15, 13, 19], [7, 6, 9, 8, 12, 10, 14, 17], [5, 8, 7, 11, 9, 14, 12, 18], [9, 11, 10, 13, 14, 15, 17, 19]];
  kpiSpark(i: number): string {
    const a = this.sparks[i] || this.sparks[0]; const max = Math.max(...a, 1); const W = 120, H = 34;
    const xs = (k: number) => (W * k) / (a.length - 1); const ys = (v: number) => H - 3 - (H - 6) * (v / max);
    return a.map((v, k) => xs(k).toFixed(0) + ',' + ys(v).toFixed(1)).join(' ');
  }
  private tween(getTarget: () => number, out: WritableSignal<number>): void {
    effect((onCleanup) => {
      const to = getTarget(); const from = untracked(out); const t0 = performance.now(); const dur = 900; let raf = 0;
      const step = (now: number) => { const p = Math.min(1, (now - t0) / dur); const e = 1 - Math.pow(1 - p, 3); out.set(Math.round(from + (to - from) * e)); if (p < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step); onCleanup(() => cancelAnimationFrame(raf));
    });
  }

  // ---- credentials quota (this month) ----
  credentialsUsed = computed(() => { const n = new Date(); const real = this.issuedSvc.records().filter((r) => { const d = new Date(r.createdAt); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length; return real || 1209; });
  credLimitLabel(): string { const l = this.plan.issueLimit(); return isFinite(l) ? l.toLocaleString() : '∞'; }
  credPct(): number { const l = this.plan.issueLimit(); return !isFinite(l) || l <= 0 ? 0 : Math.min(100, Math.round((this.credentialsUsed() / l) * 100)); }

  // ---- top templates (most issued) ----
  topTemplates = computed(() => {
    const real = this.items().map((t) => ({ name: t.name || 'Untitled', thumb: t.thumbnailDataUrl || null, n: this.issuedSvc.countFor(t.id) })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 5);
    const list = real.length ? real : [
      { name: 'Professional Certificate', thumb: null, n: 1284 },
      { name: 'Workshop Attendance', thumb: null, n: 946 },
      { name: 'Excellence Award', thumb: null, n: 712 },
      { name: 'Completion Diploma', thumb: null, n: 498 },
      { name: 'Webinar Badge', thumb: null, n: 321 },
    ];
    const max = Math.max(...list.map((x) => x.n), 1);
    return list.map((x, i) => ({ ...x, rank: i + 1, pct: Math.round((x.n / max) * 100) }));
  });

  // ---- approvals: row actions + view/sign popup ----
  approver = computed(() => { const raw = (this.auth.userName || '').trim(); const n = raw && raw.toLowerCase() !== 'there' ? raw : ''; return n ? n.charAt(0).toUpperCase() + n.slice(1) : 'You'; });
  today(): string { return new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
  greeting(): string { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }
  mySig = signal<string | null>(this.readSig());
  hasSig = computed(() => !!this.mySig());
  noSigWarn = signal(false);
  addSigOpen = signal(false);
  private pendingApprove: (() => void) | null = null;
  private readSig(): string | null { try { return localStorage.getItem('cf-signature'); } catch { return null; } }
  refreshSig(): void { this.mySig.set(this.readSig()); }
  private guard(run: () => void): void { if (this.hasSig()) { run(); return; } this.pendingApprove = run; this.noSigWarn.set(true); }
  addSignatureNow(): void { this.noSigWarn.set(false); this.addSigOpen.set(true); }
  dismissWarn(): void { this.noSigWarn.set(false); this.pendingApprove = null; }
  onSigClosed(): void { this.addSigOpen.set(false); this.refreshSig(); const run = this.pendingApprove; this.pendingApprove = null; if (this.hasSig() && run) run(); }

  dashView = signal<Approval | null>(null);
  dashViewImg = signal<string | null>(null);
  openDashView(a: Approval): void { if (a.type === 'Batch') { this.openBatch(a); return; } this.dashView.set(a); this.dashViewImg.set(null); this.loadDashViewImg(a); }
  closeDashView(): void { this.dashView.set(null); this.dashViewImg.set(null); }
  private async loadDashViewImg(a: Approval): Promise<void> {
    const rec = this.issuedSvc.records().find((r) =>
      a.credentialId ? r.id === a.credentialId : (a.batchId ? r.batchId === a.batchId : (!!a.email && r.recipientEmail === a.email)));
    if (!rec) return;
    if (rec.fileDataUrl) this.dashViewImg.set(rec.fileDataUrl);
    try {
      const t = await firstValueFrom(this.templates.get(rec.templateId));
      if (!t?.canvasJson || this.dashView()?.id !== a.id) return;
      const data = { ...rec.data };
      for (const k of Object.keys(data)) { if (/signature/i.test(k)) delete data[k]; }
      const json = mergeDataIntoJson(t.canvasJson, data);
      const img = await renderJsonToPng(json, t.width, t.height, 2, this.mySig(), !this.hasSig());
      if (this.dashView()?.id === a.id) this.dashViewImg.set(img);
    } catch { /* keep fallback mock */ }
  }
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
  async approveRow(a: Approval): Promise<void> {
    if (!(await this.confirmApprove(a.count || 1))) return;
    this.guard(() => { this.approvals.approve(a.id, this.approver()); this.resign(a); this.alerts.success('Approved & signed — ' + a.recipient + '.'); });
  }
  dashReject(a: Approval): void { this.approvals.reject(a.id); this.closeDashView(); this.alerts.info('Rejected — ' + a.recipient + '.'); }
  async dashSign(a: Approval): Promise<void> {
    if (!(await this.confirmApprove(a.count || 1))) return;
    this.guard(() => { this.approvals.approve(a.id, this.approver()); this.resign(a); this.closeDashView(); this.alerts.success('Signed & approved — ' + a.recipient + '.'); });
  }

  /** After approval, re-render the credential(s) with the issuer's saved signature and persist the signed image. */
  private async resign(a: Approval): Promise<void> {
    let sig: string | null = null;
    try { sig = localStorage.getItem('cf-signature'); } catch { sig = null; }
    const recs = this.issuedSvc.records().filter((r) =>
      a.batchId ? r.batchId === a.batchId : (a.credentialId ? r.id === a.credentialId : (!!a.email && r.recipientEmail === a.email)));
    for (const r of recs) {
      try {
        const t = await firstValueFrom(this.templates.get(r.templateId));
        if (!t?.canvasJson) continue;
        const data = { ...r.data };
        for (const k of Object.keys(data)) { if (/signature/i.test(k)) delete data[k]; }   // keep {{signatureN}} so the signature image is placed
        const json = mergeDataIntoJson(t.canvasJson, data);
        const file = await renderJsonToPng(json, t.width, t.height, 2, sig);
        this.issuedSvc.update(r.id, { fileDataUrl: file });
      } catch { /* keep existing image */ }
    }
  }

  // ---- Bulk batch review (approve all / some, preview one) ---------------
  batchTarget = signal<Approval | null>(null);
  batchSel = signal<Set<string>>(new Set<string>());
  batchPreview = signal<{ rec: IssuedRecord; img: string | null } | null>(null);
  batchRecs = computed<IssuedRecord[]>(() => {
    const a = this.batchTarget(); if (!a?.batchId) return [];
    return this.issuedSvc.records().filter((r) => r.batchId === a.batchId && r.status === 'Pending' && !r.signedBy);
  });
  batchSelCount = computed(() => this.batchSel().size);
  batchAllSel = computed(() => { const recs = this.batchRecs(); return recs.length > 0 && recs.every((r) => this.batchSel().has(r.id)); });
  batchTotal = computed(() => { const a = this.batchTarget(); if (!a?.batchId) return 0; return this.issuedSvc.records().filter((r) => r.batchId === a.batchId).length; });
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
      const remaining = this.approvals.rejectBatchSubset(a, [rec.id], this.approver());
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
      const remaining = this.approvals.rejectBatchSubset(a, ids, this.approver());
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
      const remaining = this.approvals.approveBatchSubset(a, [rec.id], this.approver());
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
      const remaining = this.approvals.approveBatchSubset(a, ids, this.approver());
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
    this.guard(() => { this.approvals.approve(a.id, this.approver()); this.resign(a); this.closeBatch(); this.alerts.success('Approved & signed all ' + n + ' recipient' + (n === 1 ? '' : 's') + '.'); });
  }
  private async resignRecords(ids: string[]): Promise<void> {
    let sig: string | null = null;
    try { sig = localStorage.getItem('cf-signature'); } catch { sig = null; }
    const recs = this.issuedSvc.records().filter((r) => ids.includes(r.id));
    for (const r of recs) {
      try {
        const t = await firstValueFrom(this.templates.get(r.templateId));
        if (!t?.canvasJson) continue;
        const data = { ...r.data };
        for (const k of Object.keys(data)) { if (/signature/i.test(k)) delete data[k]; }
        const json = mergeDataIntoJson(t.canvasJson, data);
        const file = await renderJsonToPng(json, t.width, t.height, 2, sig);
        this.issuedSvc.update(r.id, { fileDataUrl: file });
      } catch { /* keep existing image */ }
    }
  }

  certInitials(n: string): string { return n.split(/[\s—-]+/).filter(Boolean).map((x) => x[0]).join('').slice(0, 2).toUpperCase(); }

  badge(s: string): string {
    return s === 'Active' ? 'cf-badge-success' : s === 'Pending' ? 'cf-badge-warning' : 'cf-badge-danger';
  }

  constructor() {
    this.tween(() => this.issuedTotal(), this.aIssued);
    this.tween(() => this.templateCount(), this.aTemplates);
    this.tween(() => this.totalViews(), this.aViews);
    this.tween(() => this.deliverySuccess(), this.aDelivery);
    this.tween(() => this.pending(), this.aPending);
    this.templates.list().subscribe({
      next: (items) => { this.items.set(items ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.tour.register(() => this.startDashTour());
    this.maybeOfferTour();
  }

  // ===================== Role-aware Dashboard tour =====================
  private dashRole(): DashRole {
    const p = this.perm;
    const admin = p.hasAny([Actions.User_View, Actions.User_Manage, Actions.Role_Manage, Actions.Role_View, Actions.Settings_Manage]);
    const create = p.hasAny([Actions.Template_Edit, Actions.Template_Create, Actions.Canvas_Save]);
    const issue = p.hasAny([Actions.Credential_Generate, Actions.Credential_Bulk]);
    const approve = p.hasAny([Actions.Credential_Approve, Actions.Approval_View]);
    if (admin) return 'admin';
    if (approve && !create && !issue) return 'approver';
    if (create) return 'creator';
    if (issue) return 'issuer';
    return 'viewer';
  }

  startDashTour(): void {
    const t = this.langSvc.lang() === 'ar' ? DASH_TOUR.ar : DASH_TOUR.en;
    const role = this.dashRole();
    const has = (l: string[]) => this.perm.hasAny(l);
    const cand: { id: string; on: boolean; target: string }[] = [
      { id: 'create', on: has([Actions.Template_Edit, Actions.Template_Create, Actions.Canvas_Save]), target: '[data-tour="dash-create"]' },
      { id: 'issue', on: has([Actions.Credential_Generate, Actions.Credential_Bulk]), target: '[data-tour="dash-issue"]' },
      { id: 'approvals', on: has([Actions.Credential_Approve, Actions.Approval_View]), target: '[data-tour="dash-approvals"]' },
      { id: 'team', on: has([Actions.User_View, Actions.User_Manage]), target: '[data-tour="nav-users"]' },
      { id: 'roles', on: has([Actions.Role_View, Actions.Role_Manage]), target: '[data-tour="nav-roles"]' },
      { id: 'branding', on: has([Actions.Branding_Manage]), target: '[data-tour="dash-branding"]' },
      { id: 'settings', on: has([Actions.Settings_Manage]), target: '[data-tour="nav-settings"]' },
      { id: 'analytics', on: has([Actions.Analytics_View]), target: '[data-tour="dash-analytics"]' },
      { id: 'credentials', on: has([Actions.Credential_View]), target: '[data-tour="dash-credentials"]' },
      { id: 'quotas', on: has([Actions.Billing_View, Actions.Billing_Manage, Actions.Plan_Change, Actions.Settings_Manage]), target: '[data-tour="dash-quotas"]' },
      { id: 'kpis', on: true, target: '[data-tour="dash-kpis"]' },
    ];
    const active = cand.filter((c) => c.on);
    const primary: Record<DashRole, string> = { admin: 'team', approver: 'approvals', creator: 'create', issuer: 'issue', viewer: 'kpis' };
    const pi = active.findIndex((c) => c.id === primary[role]);
    if (pi > 0) { const [pc] = active.splice(pi, 1); active.unshift(pc); }
    const steps: TourStep[] = [{ title: t.welcomeTitle, body: t.welcomeByRole[role], icon: 'explore' }];
    for (const c of active) { const cp = t.steps[c.id]; steps.push({ target: c.target, title: cp.title, body: cp.body, icon: cp.icon }); }
    steps.push({ title: t.finishTitle, body: t.finishByRole[role], icon: 'celebration', finale: true });
    void this.tour.start('dashboard', steps);
  }

  private maybeOfferTour(): void {
    setTimeout(() => {
      const u = this.tourUi();
      this.tour.maybeOffer('dashboard', { title: u.autoTitle, body: u.autoBody, yes: u.autoYes, no: u.autoNo, icon: 'explore' }, () => this.startDashTour());
    }, 1200);
  }
}
