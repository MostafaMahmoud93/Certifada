import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TemplateService } from '../../core/services/template.service';
import { TemplateListItem } from '../../core/models/models';
import { IssuedService, IssuedRecord, DeliveryStatus } from '../../core/services/issued.service';
import { AlertService } from '../../core/services/alert.service';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { ExportMenuComponent } from '../../shared/components/export-menu/export-menu.component';
import { ExcelExportService, ExcelColumn } from '../../core/services/excel-export.service';

interface Analytics { views: number; email: number; direct: number; qr: number; lastViewedIso: string; }
type Origin = 'Email' | 'Direct' | 'QR' | '—';

@Component({
  selector: 'app-issued',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, PaginatorComponent, ExportMenuComponent],
  template: `
  <nav class="crumbs"><a routerLink="/app/templates">Templates</a><span class="material-icons">chevron_right</span><span class="cur">Issued &amp; insights</span></nav>

  @if (loading()) {
    <div class="state"><span class="material-icons spin">progress_activity</span><p class="cf-muted">Loading…</p></div>
  } @else {
    <!-- header -->
    <div class="hcard">
      <a class="back" routerLink="/app/templates" title="Back"><span class="material-icons">arrow_back</span></a>
      <span class="h-thumb">@if (template()?.thumbnailDataUrl) { <img [src]="template()!.thumbnailDataUrl" alt="" /> } @else { <span class="material-icons">insights</span> }</span>
      <div class="h-id">
        <h1>Issued &amp; insights</h1>
        <div class="h-sub"><strong>{{ template()?.name || 'Template' }}</strong><span class="dot">·</span><span>engagement analytics</span></div>
      </div>
      <app-export-menu style="margin-inline-start:auto" [disabled]="!history().length" (excel)="exportExcel()" (csv)="exportCsv()"></app-export-menu>
      <a class="cf-btn cf-btn-primary issue-link" [routerLink]="['/app/templates', id, 'issue']"><span class="material-icons">send</span> Issue more</a>
    </div>

    <!-- ===================== STAT CARDS ===================== -->
    <div class="ana-stats">
      <div class="acard c1"><span class="ac-bar"></span><div class="ac-ic"><span class="material-icons">workspace_premium</span></div><div class="ac-v">{{ totalIssued() | number }}</div><div class="ac-l">Total Issued</div><div class="ac-s">certificates generated</div></div>
      <div class="acard c2"><span class="ac-bar"></span><div class="ac-ic"><span class="material-icons">visibility</span></div><div class="ac-v">{{ totalViews() | number }}</div><div class="ac-l">Total Views</div><div class="ac-s">views accumulated</div></div>
      <div class="acard c3"><span class="ac-bar"></span><div class="ac-ic"><span class="material-icons">mark_email_read</span></div><div class="ac-v">{{ emailViews() | number }}</div><div class="ac-l">Opened from Email</div><div class="ac-s"><span class="trend">{{ ctr() }}%</span> click-through rate</div></div>
      <div class="acard c4"><span class="ac-bar"></span><div class="ac-ic"><span class="material-icons">ads_click</span></div><div class="ac-v">{{ directViews() | number }}</div><div class="ac-l">Direct Visits</div><div class="ac-s">opened directly on site</div></div>
      <div class="acard c5"><span class="ac-bar"></span><div class="ac-ic"><span class="material-icons">qr_code_scanner</span></div><div class="ac-v">{{ qrViews() | number }}</div><div class="ac-l">QR Code Scans</div><div class="ac-s">scanned from physical cert</div></div>
    </div>

    <!-- ===================== TABLE ===================== -->
    <div class="tcard">
      <div class="t-head">
        <div class="sec-row"><span class="sec-ic"><span class="material-icons">leaderboard</span></span><h3 class="sec">Issued credentials</h3><span class="count">{{ filtered().length }}</span></div>
        <div class="t-tools">
          <div class="hsearch"><span class="material-icons">search</span><input [value]="query()" (input)="query.set($any($event.target).value); page.set(1)" placeholder="Search recipient…" /></div>
          <div class="chips">
            <button [class.on]="origin() === 'all'" (click)="origin.set('all'); page.set(1)">All</button>
            <button [class.on]="origin() === 'Email'" (click)="origin.set('Email'); page.set(1)">Email</button>
            <button [class.on]="origin() === 'Direct'" (click)="origin.set('Direct'); page.set(1)">Direct</button>
            <button [class.on]="origin() === 'QR'" (click)="origin.set('QR'); page.set(1)">QR</button>
          </div>
          <button class="sortbtn" (click)="toggleSort()" [title]="'Sort: ' + (sort() === 'views' ? 'Most viewed' : 'Most recent')"><span class="material-icons">{{ sort() === 'views' ? 'trending_up' : 'schedule' }}</span></button>
        </div>
      </div>

      <div class="origin-legend"><span class="material-icons">help_outline</span><span class="ol-label">Traffic origin</span><span class="lg"><i class="oe"></i> Email</span><span class="lg"><i class="od"></i> Direct</span><span class="lg"><i class="oq"></i> QR scan</span><span class="ol-hint">hover a row's bar for the exact split</span></div>
      @if (history().length === 0) {
        <div class="empty"><div class="e-badge"><span class="material-icons">insights</span></div><p>No credentials issued yet</p><span class="cf-muted sm">Issue from this template to start collecting engagement insights.</span><a class="cf-btn cf-btn-primary" [routerLink]="['/app/templates', id, 'issue']" style="margin-top:12px"><span class="material-icons">send</span> Issue certificates</a></div>
      } @else if (filtered().length === 0) {
        <div class="empty"><div class="e-badge muted"><span class="material-icons">search_off</span></div><p>No matches</p></div>
      } @else {
        <div class="tablewrap">
          <table class="cf-table">
            <thead><tr><th>Recipient</th><th>Status</th><th>Issued On</th><th>Traffic Origin</th><th class="ta-c">Views</th><th>Last Viewed</th><th class="ta-end">Actions</th></tr></thead>
            <tbody>
              @for (x of paged(); track x.r.id) {
                <tr>
                  <td><div class="recip"><span class="av">{{ initials(x.r) }}</span><div class="rc"><strong>{{ x.r.recipientEmail || '—' }}</strong>@if (x.r.recipientName && x.r.recipientName !== x.r.recipientEmail) { <small class="cf-muted">{{ x.r.recipientName }}</small> }</div></div></td>
                  <td><span class="cf-badge st" [ngClass]="badgeClass(x.r.status)">@if (x.r.status === 'Sending') { <span class="spin-dot"></span> } @else { <span class="dot"></span> }{{ statusLabel(x.r.status) }}</span></td>
                  <td><div class="when"><span>{{ x.r.createdAt | date: 'mediumDate' }}</span><small class="cf-muted">{{ relativeTime(x.r.createdAt) }}</small></div></td>
                  <td>
                    @if (x.a.views) {
                      <div class="origin" (mouseenter)="showOriginTip($event, x.a)" (mouseleave)="originTip.set(null)">
                        <div class="obar">
                          <span class="oe" [style.flex]="x.a.email || 0"></span><span class="od" [style.flex]="x.a.direct || 0"></span><span class="oq" [style.flex]="x.a.qr || 0"></span>
                        </div>
                        <span class="o-lbl"><span class="material-icons" [attr.data-o]="originOf(x.a)">{{ originIcon(originOf(x.a)) }}</span>{{ originOf(x.a) }}</span>
                      </div>
                    } @else { <span class="cf-muted">—</span> }
                  </td>
                  <td class="ta-c">
                    <div class="views"><b>{{ x.a.views }}</b><span class="vbar"><i [style.width.%]="x.a.views ? (x.a.views / maxViews() * 100) : 0"></i></span></div>
                  </td>
                  <td>@if (x.a.lastViewedIso) { <span class="cf-muted">{{ relativeTime(x.a.lastViewedIso) }}</span> } @else { <span class="cf-muted">Never</span> }</td>
                  <td class="ta-end">
                    <div class="actbar">
                      <button class="act view" (click)="view(x.r)" title="Open public verification page"><span class="material-icons">open_in_new</span></button>
                      <button class="act link" (click)="copyLink(x.r)" title="Copy verify link"><span class="material-icons">link</span></button>
                      <button class="act dl" (click)="download(x.r)" title="Download"><span class="material-icons">download</span></button>
                      <span class="act-div"></span>
                      <button class="act danger" (click)="revoke(x.r)" [disabled]="x.r.status === 'Revoked'" title="Revoke"><span class="material-icons">block</span></button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <app-paginator [total]="filtered().length" [page]="pageSafe()" [pageSize]="pageSize()" (pageChange)="page.set($event)" (pageSizeChange)="pageSize.set($event); page.set(1)" icon="insights" label="credentials"></app-paginator>
      }
    </div>

    @if (viewRec(); as vr) {
      <div class="overlay" (click)="viewRec.set(null)">
        <div class="vmodal" (click)="$event.stopPropagation()">
          <button class="close" (click)="viewRec.set(null)"><span class="material-icons">close</span></button>
          <div class="v-img">@if (vr.fileDataUrl || template()?.thumbnailDataUrl) { <img [src]="vr.fileDataUrl || template()!.thumbnailDataUrl" alt="" /> } @else { <div class="v-ph"><span class="material-icons">workspace_premium</span></div> }</div>
          <div class="v-meta"><strong>{{ vr.recipientEmail }}</strong><span class="cf-muted sm">Issued {{ vr.createdAt | date: 'medium' }}</span></div>
          <div class="v-actions"><button class="cf-btn cf-btn-secondary" (click)="copyLink(vr)"><span class="material-icons">link</span> Copy link</button><button class="cf-btn cf-btn-primary" (click)="download(vr)"><span class="material-icons">download</span> Download</button></div>
        </div>
      </div>
    }

    @if (originTip(); as tip) {
      <div class="otip" [style.left.px]="tip.x" [style.top.px]="tip.y">
        <div class="otip-head"><span class="material-icons">insights</span> Where views came from</div>
        <p class="otip-sub">{{ tip.a.views }} total view{{ tip.a.views === 1 ? '' : 's' }} of this certificate.</p>
        <div class="otip-row"><span class="oswatch oe"></span><span class="material-icons">mail</span><span class="otip-name">Email</span><b>{{ tip.a.email }}</b><span class="otip-pct">{{ pct(tip.a.email, tip.a.views) }}%</span></div>
        <div class="otip-row"><span class="oswatch od"></span><span class="material-icons">ads_click</span><span class="otip-name">Direct</span><b>{{ tip.a.direct }}</b><span class="otip-pct">{{ pct(tip.a.direct, tip.a.views) }}%</span></div>
        <div class="otip-row"><span class="oswatch oq"></span><span class="material-icons">qr_code_2</span><span class="otip-name">QR scan</span><b>{{ tip.a.qr }}</b><span class="otip-pct">{{ pct(tip.a.qr, tip.a.views) }}%</span></div>
        <div class="otip-foot">Email = opened from the delivery email · Direct = visited the link directly · QR = scanned a printed certificate.</div>
        <span class="otip-arrow"></span>
      </div>
    }
  }
  `,
  styles: [`
    :host{display:block;width:100%}
    .crumbs{display:flex;align-items:center;gap:4px;font-size:12.5px;margin-bottom:14px;color:var(--cf-ink-400)}
    .crumbs a{color:var(--cf-ink-500);text-decoration:none}.crumbs a:hover{color:var(--cf-brand-600)}
    .crumbs .material-icons{font-size:16px}.crumbs .cur{color:var(--cf-ink-800);font-weight:600}
    .state{max-width:420px;margin:12vh auto;text-align:center;color:var(--cf-ink-600)}.state .material-icons{font-size:42px;color:var(--cf-brand-500)}
    .spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}

    .hcard{display:flex;align-items:center;gap:14px;padding:16px 18px;border:1px solid var(--cf-line);border-radius:16px;background:linear-gradient(120deg,color-mix(in srgb,var(--cf-brand-500) 8%,var(--cf-surface)),var(--cf-surface) 62%);box-shadow:0 1px 2px rgba(15,23,42,.04);margin-bottom:18px}
    .back{width:38px;height:38px;border-radius:10px;border:1px solid var(--cf-line);display:grid;place-items:center;color:var(--cf-ink-600);text-decoration:none;flex:none;background:var(--cf-surface)}
    .back:hover{background:var(--cf-surface-2);color:var(--cf-ink-900)}
    .h-thumb{width:56px;height:42px;border-radius:10px;background:var(--cf-surface-2);border:1px solid var(--cf-line);display:grid;place-items:center;overflow:hidden;flex:none;color:var(--cf-brand-600)}
    .h-thumb img{width:100%;height:100%;object-fit:cover}
    .h-id{flex:1;min-width:0}.h-id h1{font-size:20px;font-weight:800;letter-spacing:-.02em;color:var(--cf-ink-900)}
    .h-sub{display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--cf-ink-500);margin-top:3px}.h-sub strong{color:var(--cf-ink-800)}.h-sub .dot{color:var(--cf-ink-300)}
    .issue-link{flex:none;display:inline-flex;align-items:center;gap:6px}.issue-link .material-icons{font-size:17px}

    /* stat cards */
    .ana-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:13px;margin-bottom:20px}
    @media(max-width:1000px){.ana-stats{grid-template-columns:repeat(3,1fr)}}
    @media(max-width:620px){.ana-stats{grid-template-columns:repeat(2,1fr)}}
    .acard{position:relative;padding:16px 16px 15px;border:1px solid var(--cf-line);border-radius:15px;background:var(--cf-surface);box-shadow:0 1px 2px rgba(15,23,42,.04);overflow:hidden;transition:transform .15s,box-shadow .18s,border-color .18s}
    .acard:hover{transform:translateY(-3px);box-shadow:0 16px 34px -18px rgba(15,23,42,.3)}
    .ac-bar{position:absolute;top:0;inset-inline:0;height:3px}
    .ac-ic{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;margin-bottom:11px}
    .ac-ic .material-icons{font-size:20px}
    .ac-v{font-size:26px;font-weight:800;letter-spacing:-.03em;color:var(--cf-ink-900);line-height:1}
    .ac-l{font-size:13px;font-weight:700;color:var(--cf-ink-800);margin-top:6px}
    .ac-s{font-size:11.5px;color:var(--cf-ink-500);margin-top:2px}
    .ac-s .trend{font-weight:800;color:#16a34a}
    .c1 .ac-bar{background:linear-gradient(90deg,var(--cf-brand-500),var(--cf-brand-700))}.c1 .ac-ic{background:var(--cf-brand-50);color:var(--cf-brand-600)}
    .c2 .ac-bar{background:linear-gradient(90deg,#8b5cf6,#6d28d9)}.c2 .ac-ic{background:color-mix(in srgb,#8b5cf6 14%,transparent);color:#7c3aed}
    .c3 .ac-bar{background:linear-gradient(90deg,#10b981,#059669)}.c3 .ac-ic{background:color-mix(in srgb,#10b981 15%,transparent);color:#059669}
    .c4 .ac-bar{background:linear-gradient(90deg,#0ea5e9,#0284c7)}.c4 .ac-ic{background:color-mix(in srgb,#0ea5e9 14%,transparent);color:#0284c7}
    .c5 .ac-bar{background:linear-gradient(90deg,#f59e0b,#d97706)}.c5 .ac-ic{background:color-mix(in srgb,#f59e0b 16%,transparent);color:#d97706}

    /* table card */
    .tcard{border:1px solid var(--cf-line);border-radius:16px;background:var(--cf-surface);box-shadow:0 1px 2px rgba(15,23,42,.04);overflow:hidden}
    .t-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 17px;flex-wrap:wrap;border-bottom:1px solid var(--cf-line)}
    .sec-row{display:flex;align-items:center;gap:9px}
    .sec-ic{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:color-mix(in srgb,var(--cf-brand-500) 12%,transparent);color:var(--cf-brand-600)}.sec-ic .material-icons{font-size:16px}
    .sec{font-size:14px;font-weight:700;color:var(--cf-ink-900)}
    .count{font-size:11.5px;font-weight:700;color:var(--cf-ink-500);background:var(--cf-surface-2);border:1px solid var(--cf-line);border-radius:999px;padding:2px 9px}
    .t-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .hsearch{display:flex;align-items:center;gap:7px;height:36px;padding:0 11px;border:1px solid var(--cf-line);border-radius:10px;background:var(--cf-surface)}
    .hsearch:focus-within{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .hsearch .material-icons{font-size:17px;color:var(--cf-ink-400)}.hsearch input{border:0;background:none;outline:none;font:inherit;font-size:13px;color:var(--cf-ink-900);width:150px}
    .chips{display:inline-flex;gap:3px;padding:3px;background:var(--cf-surface-2);border:1px solid var(--cf-line);border-radius:9px}
    .chips button{border:0;background:none;color:var(--cf-ink-600);font:inherit;font-size:12px;font-weight:600;padding:6px 10px;border-radius:7px;cursor:pointer}
    .chips button.on{background:var(--cf-surface);color:var(--cf-brand-700);box-shadow:var(--cf-shadow-sm)}
    .sortbtn{width:36px;height:36px;border:1px solid var(--cf-line);border-radius:10px;background:var(--cf-surface);color:var(--cf-ink-500);display:grid;place-items:center;cursor:pointer}
    .sortbtn:hover{background:var(--cf-surface-2);color:var(--cf-brand-700)}.sortbtn .material-icons{font-size:18px}

    .tablewrap{overflow-x:auto}
    .cf-table{width:100%;border-collapse:collapse;font-size:13px}
    .cf-table th{position:sticky;top:0;background:var(--cf-surface-2);font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--cf-ink-500);font-weight:700;text-align:start;padding:11px 14px;border-bottom:1px solid var(--cf-line);white-space:nowrap}
    .cf-table td{padding:11px 14px;border-bottom:1px solid var(--cf-line-soft);vertical-align:middle}
    .cf-table tr:last-child td{border-bottom:0}.cf-table tbody tr:hover{background:var(--cf-surface-2)}
    @keyframes rowInD{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
    .cf-table tbody tr{animation:rowInD .3s ease both}
    .cf-table tbody tr:nth-child(2){animation-delay:.03s}.cf-table tbody tr:nth-child(3){animation-delay:.06s}.cf-table tbody tr:nth-child(4){animation-delay:.09s}.cf-table tbody tr:nth-child(5){animation-delay:.12s}.cf-table tbody tr:nth-child(n+6){animation-delay:.15s}
    .ta-end{text-align:end}.ta-c{text-align:center}
    .recip{display:flex;align-items:center;gap:10px}
    .av{width:34px;height:34px;border-radius:50%;background:var(--cf-brand-50);color:var(--cf-brand-700);border:1px solid var(--cf-brand-100);display:grid;place-items:center;font-size:11.5px;font-weight:700;flex:none}
    .rc{display:flex;flex-direction:column;min-width:0}.rc strong{font-size:13px;color:var(--cf-ink-900);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px}.rc small{font-size:11px}
    .when{display:flex;flex-direction:column}.when span{font-size:12.5px;color:var(--cf-ink-700)}.when small{font-size:10.5px}
    .cf-badge.st{display:inline-flex;align-items:center}
    .cf-badge .dot{width:6px;height:6px;border-radius:50%;background:currentColor;display:inline-block;margin-inline-end:5px;vertical-align:middle}
    .spin-dot{width:10px;height:10px;border-radius:50%;border:2px solid currentColor;border-top-color:transparent;display:inline-block;margin-inline-end:6px;vertical-align:middle;animation:spin .7s linear infinite}
    .st-sending{background:var(--cf-brand-50);color:var(--cf-brand-700);border:1px solid var(--cf-brand-100)}
    .st-revoked{background:var(--cf-surface-2);color:var(--cf-ink-500);border:1px solid var(--cf-line)}

    .origin{display:flex;flex-direction:column;gap:5px;min-width:118px}
    .obar{display:flex;height:7px;border-radius:999px;overflow:hidden;background:var(--cf-surface-2);border:1px solid var(--cf-line)}
    .obar span{display:block}.obar .oe{background:var(--cf-brand-500)}.obar .od{background:var(--cf-accent-500)}.obar .oq{background:var(--cf-accent2-500)}
    .o-lbl{display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:600;color:var(--cf-ink-600)}
    .o-lbl .material-icons{font-size:14px}
    .o-lbl .material-icons[data-o="Email"]{color:var(--cf-brand-600)}.o-lbl .material-icons[data-o="Direct"]{color:var(--cf-accent-600)}.o-lbl .material-icons[data-o="QR"]{color:var(--cf-accent2-600)}
    .views{display:inline-flex;flex-direction:column;align-items:center;gap:4px;min-width:48px}
    .views b{font-size:14px;font-weight:800;color:var(--cf-ink-900)}
    .vbar{width:44px;height:5px;border-radius:999px;background:var(--cf-surface-2);overflow:hidden;border:1px solid var(--cf-line)}
    .vbar i{display:block;height:100%;background:linear-gradient(90deg,var(--cf-brand-500),var(--cf-brand-600))}

    /* creative small action bar */
    .actbar{display:inline-flex;align-items:center;gap:1px;padding:3px;border:1px solid var(--cf-line);border-radius:10px;background:var(--cf-surface);box-shadow:0 1px 2px rgba(15,23,42,.05);transition:box-shadow .16s,border-color .16s}
    .actbar:hover{box-shadow:0 6px 16px -10px rgba(15,23,42,.3);border-color:color-mix(in srgb,var(--cf-brand-500) 24%,var(--cf-line))}
    .act{width:28px;height:28px;display:grid;place-items:center;border:0;background:none;border-radius:8px;color:var(--cf-ink-400);cursor:pointer;transition:background .15s,color .15s,transform .12s}
    .act .material-icons{font-size:16px;transition:transform .25s cubic-bezier(.2,1.3,.4,1)}
    .act:hover:not(:disabled){background:var(--cf-surface-2)}.act:active:not(:disabled){transform:scale(.88)}.act:disabled{opacity:.4;cursor:not-allowed}
    .act.view:hover{color:var(--cf-brand-600)}.act.view:hover .material-icons{transform:scale(1.18)}
    .act.link:hover{color:#0284c7}.act.link:hover .material-icons{transform:rotate(-25deg)}
    .act.dl:hover{color:#16a34a}.act.dl:hover .material-icons{transform:translateY(2px)}
    .act.danger:hover:not(:disabled){color:var(--cf-danger)}.act.danger:hover:not(:disabled) .material-icons{transform:rotate(90deg)}
    .act-div{width:1px;height:16px;background:var(--cf-line);margin:0 2px}

    .empty{display:flex;flex-direction:column;align-items:center;gap:6px;padding:48px 20px;text-align:center}
    .e-badge{width:62px;height:62px;border-radius:18px;display:grid;place-items:center;background:linear-gradient(135deg,var(--cf-brand-500),var(--cf-brand-700));color:#fff;box-shadow:0 14px 30px -14px color-mix(in srgb,var(--cf-brand-600) 80%,transparent);margin-bottom:6px}
    .e-badge.muted{background:var(--cf-surface-2);color:var(--cf-ink-400);box-shadow:none}
    .e-badge .material-icons{font-size:28px}
    .empty p{font-size:14px;font-weight:700;color:var(--cf-ink-800)}.empty .cf-btn{display:inline-flex;align-items:center;gap:6px}.empty .cf-btn .material-icons{font-size:17px}
    .sm{font-size:12.5px}

    .overlay{position:fixed;inset:0;background:rgba(2,6,23,.55);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);display:grid;place-items:center;z-index:60;padding:20px}
    .vmodal{position:relative;width:100%;max-width:520px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:18px;box-shadow:var(--cf-shadow-lg);padding:18px}
    .vmodal .close{position:absolute;top:12px;inset-inline-end:12px;border:0;background:rgba(255,255,255,.8);color:var(--cf-ink-700);cursor:pointer;border-radius:8px;width:30px;height:30px;display:grid;place-items:center;z-index:2}
    .v-img{border:1px solid var(--cf-line);border-radius:12px;overflow:hidden;background:var(--cf-surface-2);min-height:200px;display:grid;place-items:center}
    .v-img img{width:100%;display:block}
    .v-ph{padding:50px;color:var(--cf-ink-300)}.v-ph .material-icons{font-size:44px}
    .v-meta{display:flex;flex-direction:column;margin-top:14px}.v-meta strong{font-size:14px;color:var(--cf-ink-900)}
    .v-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}.v-actions .cf-btn{display:inline-flex;align-items:center;gap:6px}.v-actions .material-icons{font-size:17px}
    .origin{cursor:default}
    .origin-legend{display:flex;align-items:center;gap:11px;flex-wrap:wrap;padding:10px 17px;font-size:11.5px;color:var(--cf-ink-500);border-bottom:1px solid var(--cf-line);background:var(--cf-surface-2)}
    .origin-legend>.material-icons{font-size:15px;color:var(--cf-ink-400)}
    .ol-label{font-weight:700;color:var(--cf-ink-700)}
    .origin-legend .lg{display:inline-flex;align-items:center;gap:5px;font-weight:600;color:var(--cf-ink-600)}
    .origin-legend .lg i{width:9px;height:9px;border-radius:3px;display:inline-block}
    .origin-legend .lg i.oe{background:var(--cf-brand-500)}.origin-legend .lg i.od{background:var(--cf-accent-500)}.origin-legend .lg i.oq{background:var(--cf-accent2-500)}
    .ol-hint{margin-inline-start:auto;color:var(--cf-ink-400);font-style:italic}
    .otip{position:fixed;z-index:200;transform:translate(-50%,calc(-100% - 12px));width:252px;background:var(--cf-ink-900);color:#fff;border-radius:13px;padding:13px 14px;box-shadow:0 22px 48px -16px rgba(2,6,23,.62);pointer-events:none;animation:otip-in .14s ease}
    @keyframes otip-in{from{opacity:0;transform:translate(-50%,calc(-100% - 4px))}to{opacity:1;transform:translate(-50%,calc(-100% - 12px))}}
    .otip-head{display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:800}
    .otip-head .material-icons{font-size:15px;color:#c7d2fe}
    .otip-sub{font-size:11px;color:rgba(255,255,255,.62);margin:4px 0 10px}
    .otip-row{display:flex;align-items:center;gap:8px;font-size:12px;padding:3px 0}
    .otip-row .material-icons{font-size:14px;color:rgba(255,255,255,.7)}
    .otip-row .oswatch{width:9px;height:9px;border-radius:3px;flex:none}
    .otip-row .otip-name{flex:1;color:rgba(255,255,255,.92)}
    .otip-row b{font-weight:800}
    .otip-row .otip-pct{width:40px;text-align:end;color:rgba(255,255,255,.6);font-variant-numeric:tabular-nums}
    .oswatch.oe{background:var(--cf-brand-500)}.oswatch.od{background:var(--cf-accent-500)}.oswatch.oq{background:var(--cf-accent2-500)}
    .otip-foot{font-size:10px;line-height:1.55;color:rgba(255,255,255,.55);margin-top:10px;border-top:1px solid rgba(255,255,255,.13);padding-top:8px}
    .otip-arrow{position:absolute;bottom:-6px;left:50%;transform:translateX(-50%) rotate(45deg);width:12px;height:12px;background:var(--cf-ink-900);border-radius:0 0 3px 0}
  `],
})
export class IssuedComponent {
  private route = inject(ActivatedRoute);
  private templates = inject(TemplateService);
  private alerts = inject(AlertService);
  readonly issued = inject(IssuedService);
  private xlsx = inject(ExcelExportService);

  id = this.route.snapshot.paramMap.get('id') || '';
  template = signal<TemplateListItem | null>(null);
  loading = signal(true);
  query = signal('');
  origin = signal<'all' | Origin>('all');
  sort = signal<'recent' | 'views'>('recent');
  viewRec = signal<IssuedRecord | null>(null);
  originTip = signal<{ x: number; y: number; a: Analytics } | null>(null);

  history = computed(() => this.issued.forTemplate(this.id));
  rowsA = computed(() => this.history().map((r) => ({ r, a: this.analytics(r) })));
  maxViews = computed(() => Math.max(1, ...this.rowsA().map((x) => x.a.views)));
  totalIssued = computed(() => this.history().length);
  totalViews = computed(() => this.rowsA().reduce((s, x) => s + x.a.views, 0));
  emailViews = computed(() => this.rowsA().reduce((s, x) => s + x.a.email, 0));
  directViews = computed(() => this.rowsA().reduce((s, x) => s + x.a.direct, 0));
  qrViews = computed(() => this.rowsA().reduce((s, x) => s + x.a.qr, 0));
  ctr = computed(() => { const opened = this.rowsA().filter((x) => x.a.email > 0).length; return this.totalIssued() ? Math.round((opened / this.totalIssued()) * 100) : 0; });

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const o = this.origin();
    let list = this.rowsA().filter((x) => {
      if (o !== 'all' && this.originOf(x.a) !== o) return false;
      if (q && !((x.r.recipientEmail || '').toLowerCase().includes(q) || (x.r.recipientName || '').toLowerCase().includes(q))) return false;
      return true;
    });
    list = [...list].sort((a, b) => this.sort() === 'views' ? b.a.views - a.a.views : +new Date(b.r.createdAt) - +new Date(a.r.createdAt));
    return list;
  });

  page = signal(1);
  pageSize = signal(10);
  pageSafe = computed(() => { const mp = Math.max(1, Math.ceil(this.filtered().length / this.pageSize())); return Math.min(this.page(), mp); });
  paged = computed(() => { const f = this.filtered(); const ps = this.pageSize(); const start = (this.pageSafe() - 1) * ps; return f.slice(start, start + ps); });

  constructor() {
    this.issued.syncFromApi(this.id);
    if (!this.id) { this.loading.set(false); return; }
    this.templates.get(this.id).subscribe({
      next: (t) => { this.template.set(t); this.loading.set(false); },
      error: () => {
        try { const c = JSON.parse(localStorage.getItem('cf-tpl-cache') || '[]'); const hit = Array.isArray(c) ? c.find((x: any) => x.id === this.id) : null; if (hit) this.template.set(hit); } catch { /* ignore */ }
        this.loading.set(false);
      },
    });
  }

  /** Deterministic demo analytics seeded from the record id (stable across reloads). */
  private analytics(r: IssuedRecord): Analytics {
    if (r.status === 'Sending' || r.status === 'Failed') return { views: 0, email: 0, direct: 0, qr: 0, lastViewedIso: '' };
    const seed = this.hash(r.id);
    const views = (seed % 46) + (r.status === 'Sent' ? 4 : 1);
    const email = Math.round((views * (30 + ((seed >> 5) % 45))) / 100);
    const qr = Math.round(((views - email) * ((seed >> 11) % 35)) / 100);
    const direct = Math.max(0, views - email - qr);
    const issuedAt = +new Date(r.createdAt) || Date.now();
    const span = Math.max(0, Date.now() - issuedAt);
    const lastViewedIso = views > 0 ? new Date(issuedAt + span * ((seed % 92) / 100)).toISOString() : '';
    return { views, email, direct, qr, lastViewedIso };
  }
  private hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  originOf(a: Analytics): Origin {
    if (!a.views) return '—';
    if (a.email >= a.direct && a.email >= a.qr) return 'Email';
    if (a.direct >= a.qr) return 'Direct';
    return 'QR';
  }
  originIcon(o: Origin): string { return o === 'Email' ? 'mail' : o === 'Direct' ? 'ads_click' : o === 'QR' ? 'qr_code_2' : 'remove'; }
  pct(n: number, total: number): number { return total ? Math.round((n / total) * 100) : 0; }
  showOriginTip(ev: MouseEvent, a: Analytics): void { const r = (ev.currentTarget as HTMLElement).getBoundingClientRect(); this.originTip.set({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top), a }); }

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
  badgeClass(s: DeliveryStatus): string { return s === 'Sent' ? 'cf-badge-success' : s === 'Sending' ? 'st-sending' : s === 'Pending' ? 'cf-badge-warning' : s === 'Revoked' ? 'st-revoked' : 'cf-badge-danger'; }
  toggleSort(): void { this.sort.update((s) => (s === 'recent' ? 'views' : 'recent')); this.page.set(1); }

  private exportCols(): ExcelColumn[] {
    return [
      { key: 'recipient', label: 'Recipient', type: 'email' },
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status', type: 'status' },
      { key: 'issued', label: 'Issued On', type: 'date' },
      { key: 'origin', label: 'Traffic Origin' },
      { key: 'views', label: 'Views', type: 'number' },
      { key: 'email', label: 'Email Views', type: 'number' },
      { key: 'direct', label: 'Direct Visits', type: 'number' },
      { key: 'qr', label: 'QR Scans', type: 'number' },
      { key: 'last', label: 'Last Viewed', type: 'date' },
    ];
  }
  private exportData(): any[] {
    return this.filtered().map((x) => ({ recipient: x.r.recipientEmail || '', name: x.r.recipientName || '', status: x.r.status, issued: x.r.createdAt, origin: this.originOf(x.a), views: x.a.views, email: x.a.email, direct: x.a.direct, qr: x.a.qr, last: x.a.lastViewedIso || '' }));
  }
  private fileBase(): string { return `${(this.template()?.name || 'template').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-issued-${new Date().toISOString().slice(0, 10)}`; }
  exportExcel(): void {
    const rows = this.exportData(); if (!rows.length) return;
    const oc = this.origin() !== 'all' ? ` · ${this.origin()} origin` : '';
    this.xlsx.export(rows, {
      fileName: this.fileBase(),
      sheetName: 'Issued',
      title: `Issued & Insights — ${this.template()?.name || 'Template'}`,
      subtitle: `Engagement analytics${oc}`,
      columns: this.exportCols(),
      summary: [
        { label: 'Total Issued', value: this.totalIssued() },
        { label: 'Total Views', value: this.totalViews() },
        { label: 'Email', value: this.emailViews() },
        { label: 'Direct', value: this.directViews() },
        { label: 'QR', value: this.qrViews() },
        { label: 'CTR', value: `${this.ctr()}%` },
      ],
    });
    this.alerts.success(`Exported ${rows.length} record${rows.length === 1 ? '' : 's'} to Excel.`);
  }
  exportCsv(): void {
    const rows = this.exportData(); if (!rows.length) return;
    this.xlsx.csv(rows, this.exportCols(), this.fileBase());
    this.alerts.success(`Exported ${rows.length} record${rows.length === 1 ? '' : 's'} to CSV.`);
  }
  view(r: IssuedRecord): void { window.open(location.origin + '/verify/' + r.id, '_blank'); }
  copyLink(r: IssuedRecord): void {
    const url = `${location.origin}/verify/${r.id}`;
    try { navigator.clipboard?.writeText(url); this.alerts.success('Verification link copied to clipboard.'); }
    catch { this.alerts.info(url); }
  }
  download(r: IssuedRecord): void {
    if (!r.fileDataUrl) { this.alerts.info('The image for this credential is not stored locally (re-issue to regenerate).'); return; }
    const a = document.createElement('a'); a.href = r.fileDataUrl; a.download = `${(r.recipientName || 'certificate').replace(/[^a-z0-9]+/gi, '-')}.png`; a.click();
  }
  async revoke(r: IssuedRecord): Promise<void> {
    const ok = await this.alerts.confirm({ title: 'Revoke credential', message: `Revoke the certificate issued to ${r.recipientEmail || 'this recipient'}?`, danger: true, confirmText: 'Revoke' });
    if (ok) { this.issued.setStatus(r.id, 'Revoked'); this.alerts.info('Credential revoked.'); }
  }
}
