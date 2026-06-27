import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HasActionDirective } from '../../shared/directives/has-action.directive';
import { Actions } from '../../core/constants/actions';
import { AlertService } from '../../core/services/alert.service';
import { IssuedService, IssuedRecord, DeliveryStatus } from '../../core/services/issued.service';
import { PlanService } from '../../core/services/plan.service';
import { TemplateService } from '../../core/services/template.service';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { ExportMenuComponent } from '../../shared/components/export-menu/export-menu.component';
import { ExcelExportService, ExcelColumn } from '../../core/services/excel-export.service';

@Component({
  selector: 'app-credentials',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, HasActionDirective, PaginatorComponent, ExportMenuComponent],
  template: `
  <div class="head">
    <div>
      <h1>Credentials</h1>
      <p class="cf-muted">Every certificate you've issued — search, filter, audit, export.</p>
    </div>
    <div class="head-r">
      <app-export-menu [disabled]="!filtered().length" (excel)="exportExcel()" (csv)="exportCsv()"></app-export-menu>
      <a class="cf-btn cf-btn-primary" routerLink="/app/templates" [appHasAction]="A.Credential_Generate" [tooltipMessage]="'🔒 Generating credentials isn\\'t in your plan.'"><span class="material-icons">send</span> Issue credentials</a>
    </div>
  </div>

  <!-- ===================== STAT STRIP ===================== -->
  <div class="stats">
    <div class="stat usage" [class.warn]="usagePct() >= 90">
      <div class="u-top"><span class="material-icons">bolt</span> Monthly usage <b>{{ usedThisPeriod() }} / {{ limitLabel() }}</b></div>
      <div class="u-bar"><span [style.width.%]="usagePct()"></span></div>
      <small class="cf-muted">{{ remaining() }} credentials left this period · {{ plan.plan() }} plan</small>
    </div>
    <div class="stat"><div class="s-ic brand"><span class="material-icons">verified</span></div><div><div class="s-val">{{ stats().total }}</div><div class="s-lbl">Issued</div></div></div>
    <div class="stat"><div class="s-ic ok"><span class="material-icons">mark_email_read</span></div><div><div class="s-val">{{ stats().sent }}</div><div class="s-lbl">Sent</div></div></div>
    <div class="stat"><div class="s-ic views-ic"><span class="material-icons">visibility</span></div><div><div class="s-val">{{ totalViews() }}</div><div class="s-lbl">Total views</div></div></div>
    <div class="stat"><div class="s-ic warn"><span class="material-icons">schedule</span></div><div><div class="s-val">{{ stats().pending }}</div><div class="s-lbl">Pending</div></div></div>
    <div class="stat"><div class="s-ic bad"><span class="material-icons">block</span></div><div><div class="s-val">{{ stats().revoked }}</div><div class="s-lbl">Revoked</div></div></div>
  </div>

  <!-- ===================== TOOLBAR ===================== -->
  <div class="toolbar">
    <div class="search"><span class="material-icons">search</span><input [value]="query()" (input)="query.set($any($event.target).value); page.set(1)" placeholder="Search recipient, email, template or ID…" />@if (query()) { <button class="clr" (click)="query.set('')"><span class="material-icons">close</span></button> }</div>
    <div class="tplsel" [class.open]="tplOpen()">
      <button class="tplsel-btn" (click)="toggleTpl($event)">
        @if (selectedTpl(); as t) {
          <span class="ts-thumb">@if (t.thumb) { <img [src]="t.thumb" alt="" /> } @else { <span class="material-icons">workspace_premium</span> }</span>
          <span class="ts-name">{{ t.name }}</span>
        } @else {
          <span class="ts-thumb all"><span class="material-icons">apps</span></span>
          <span class="ts-name">All templates</span>
        }
        <span class="material-icons ts-chev">expand_more</span>
      </button>
      @if (tplOpen()) {
        <div class="tplmenu" (click)="$event.stopPropagation()">
          <button class="tplopt" [class.on]="templateId() === 'all'" (click)="pickTpl('all')">
            <span class="to-thumb all"><span class="material-icons">apps</span></span>
            <span class="to-tx"><b>All templates</b><small>{{ all().length }} credential{{ all().length === 1 ? '' : 's' }}</small></span>
            @if (templateId() === 'all') { <span class="material-icons to-check">check_circle</span> }
          </button>
          @for (t of templateOptions(); track t.id) {
            <button class="tplopt" [class.on]="templateId() === t.id" (click)="pickTpl(t.id)">
              <span class="to-thumb">@if (t.thumb) { <img [src]="t.thumb" alt="" /> } @else { <span class="material-icons">workspace_premium</span> }</span>
              <span class="to-tx"><b>{{ t.name }}</b><small>{{ t.count }} credential{{ t.count === 1 ? '' : 's' }}</small></span>
              @if (templateId() === t.id) { <span class="material-icons to-check">check_circle</span> }
            </button>
          }
        </div>
      }
    </div>
    <div class="date-filter"><span class="material-icons">calendar_today</span><select [value]="dateRange()" (change)="dateRange.set($any($event.target).value); page.set(1)"><option value="all">All time</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="month">This month</option><option value="year">This year</option></select></div>
    <div class="chips">
      <button [class.on]="status() === 'all'" (click)="status.set('all'); page.set(1)">All</button>
      <button [class.on]="status() === 'Sent'" (click)="status.set('Sent'); page.set(1)">Sent</button>
      <button [class.on]="status() === 'Pending'" (click)="status.set('Pending'); page.set(1)">Pending</button>
      <button [class.on]="status() === 'Revoked'" (click)="status.set('Revoked'); page.set(1)">Revoked</button>
    </div>
  </div>
  <div class="result-line cf-muted">{{ filtered().length }} of {{ all().length }} credential{{ all().length === 1 ? '' : 's' }}@if (templateId() !== 'all') { · {{ activeTplName() }} }</div>

  <!-- ===================== TABLE ===================== -->
  @if (all().length === 0) {
    <div class="state"><div class="st-badge"><span class="material-icons">workspace_premium</span></div><h3>No credentials issued yet</h3><p class="cf-muted">Issue your first certificate from a template — it'll appear here.</p><a class="cf-btn cf-btn-primary" routerLink="/app/templates" style="margin-top:12px"><span class="material-icons">send</span> Go to templates</a></div>
  } @else if (filtered().length === 0) {
    <div class="state"><div class="st-badge muted"><span class="material-icons">search_off</span></div><h3>No matches</h3><p class="cf-muted">Try a different search, template, or status filter.</p></div>
  } @else {
    <div class="tcard">
      <div class="tablewrap">
        <table class="cf-table">
          <thead><tr>
            <th class="sortable" (click)="sortBy('recipient')"><span class="th-in">Recipient <span class="material-icons sc" [class.act]="sortKey()==='recipient'">{{ caretIcon('recipient') }}</span></span></th>
            <th class="sortable" (click)="sortBy('template')"><span class="th-in">Template <span class="material-icons sc" [class.act]="sortKey()==='template'">{{ caretIcon('template') }}</span></span></th>
            @for (v of selectedVars(); track v) { <th class="varcol sortable" (click)="sortBy('var:' + v)"><span class="th-in">{{ pretty(v) }} <span class="material-icons sc" [class.act]="sortKey()==='var:' + v">{{ caretIcon('var:' + v) }}</span></span></th> }
            <th class="sortable" (click)="sortBy('status')"><span class="th-in">Delivery status <span class="material-icons sc" [class.act]="sortKey()==='status'">{{ caretIcon('status') }}</span></span></th>
            <th class="sortable" (click)="sortBy('date')"><span class="th-in">Issued on <span class="material-icons sc" [class.act]="sortKey()==='date'">{{ caretIcon('date') }}</span></span></th>
            <th>Traffic origin</th>
            <th class="ta-c sortable" (click)="sortBy('views')"><span class="th-in">Views <span class="material-icons sc" [class.act]="sortKey()==='views'">{{ caretIcon('views') }}</span></span></th>
            <th class="sortable" (click)="sortBy('lastViewed')"><span class="th-in">Last viewed <span class="material-icons sc" [class.act]="sortKey()==='lastViewed'">{{ caretIcon('lastViewed') }}</span></span></th>
            <th class="ta-end">Actions</th>
          </tr></thead>
          <tbody>
            @for (c of paged(); track c.id) {
              <tr>
                <td><div class="recip"><span class="av">{{ initials(c) }}</span><div class="rc"><strong>{{ c.recipientEmail || c.recipientName }}</strong>@if (c.recipientName && c.recipientName !== c.recipientEmail) { <small class="cf-muted">{{ c.recipientName }}</small> }</div></div></td>
                <td><span class="tpl-chip"><span class="material-icons">workspace_premium</span>{{ tplName(c) }}</span></td>
                @for (v of selectedVars(); track v) { <td class="varcell">{{ c.data[v] || '—' }}</td> }
                <td><span class="cf-badge st" [ngClass]="badgeClass(c.status)">@if (c.status === 'Sending') { <span class="spin-dot"></span> } @else { <span class="dot"></span> }{{ statusLabel(c.status) }}</span>
                  @if (c.signedBy) { <div class="sig signed" [title]="'Signed by ' + c.signedBy + (c.signedAt ? ' · ' + (c.signedAt | date: 'mediumDate') : '')"><span class="material-icons">draw</span><span class="sg-name">{{ c.signedBy }}</span></div> }
                  @else if (c.status === 'Pending') { <div class="sig wait"><span class="material-icons">hourglass_top</span> Awaiting signature</div> }</td>
                <td><div class="when"><span>{{ c.createdAt | date: 'mediumDate' }}</span><small class="cf-muted">{{ relativeTime(c.createdAt) }}</small></div></td>
                <td>
                  @if (an(c).views) {
                    <div class="origin" (mouseenter)="showOriginTip($event, an(c))" (mouseleave)="originTip.set(null)">
                      <div class="obar"><span class="oe" [style.flex]="an(c).email || 0"></span><span class="od" [style.flex]="an(c).direct || 0"></span><span class="oq" [style.flex]="an(c).qr || 0"></span></div>
                      <span class="o-lbl"><span class="material-icons" [attr.data-o]="originOf(an(c))">{{ originIcon(originOf(an(c))) }}</span>{{ originOf(an(c)) }}</span>
                    </div>
                  } @else { <span class="cf-muted">—</span> }
                </td>
                <td class="ta-c"><div class="views"><b>{{ an(c).views }}</b><span class="vbar"><i [style.width.%]="an(c).views ? (an(c).views / maxViews() * 100) : 0"></i></span></div></td>
                <td>@if (an(c).lastViewedIso) { <span class="cf-muted">{{ relativeTime(an(c).lastViewedIso) }}</span> } @else { <span class="cf-muted">Never</span> }</td>
                <td class="ta-end">
                  <div class="actbar">
                    <button class="act view" (click)="verify(c)" title="Open public verification page"><span class="material-icons">open_in_new</span></button>
                    <button class="act dl" (click)="download(c)" title="Download"><span class="material-icons">download</span></button>
                    <button class="act send" (click)="resend(c)" [disabled]="c.status === 'Sending'" title="Resend"><span class="material-icons">forward_to_inbox</span></button>
                    <span class="act-div"></span>
                    <button class="act danger" (click)="revoke(c)" [disabled]="c.status === 'Revoked' || c.status === 'Sending'" title="Revoke"><span class="material-icons">block</span></button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-paginator [total]="filtered().length" [page]="pageSafe()" [pageSize]="pageSize()" (pageChange)="page.set($event)" (pageSizeChange)="pageSize.set($event); page.set(1)" icon="verified" label="credentials"></app-paginator>
    </div>
    @if (originTip(); as tip) {
      <div class="otip" [style.left.px]="tip.x" [style.top.px]="tip.y">
        <div class="otip-head"><span class="material-icons">insights</span> Where views came from</div>
        <p class="otip-sub">{{ tip.a.views }} total view{{ tip.a.views === 1 ? '' : 's' }} of this certificate.</p>
        <div class="otip-row"><span class="oswatch oe"></span><span class="material-icons">mail</span><span class="otip-name">Email</span><b>{{ tip.a.email }}</b><span class="otip-pct">{{ pct(tip.a.email, tip.a.views) }}%</span></div>
        <div class="otip-row"><span class="oswatch od"></span><span class="material-icons">ads_click</span><span class="otip-name">Direct</span><b>{{ tip.a.direct }}</b><span class="otip-pct">{{ pct(tip.a.direct, tip.a.views) }}%</span></div>
        <div class="otip-row"><span class="oswatch oq"></span><span class="material-icons">qr_code_2</span><span class="otip-name">QR scan</span><b>{{ tip.a.qr }}</b><span class="otip-pct">{{ pct(tip.a.qr, tip.a.views) }}%</span></div>
        <div class="otip-foot">Email = opened from the email · Direct = visited the link · QR = scanned a printed certificate.</div>
        <span class="otip-arrow"></span>
      </div>
    }
  }
  `,
  styles: [`
    :host{display:block;width:100%;min-width:0;max-width:100%}
    .head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px}
    .head h1{font-size:23px;font-weight:800;letter-spacing:-.02em;color:var(--cf-ink-900)}
    .head p{font-size:13.5px;margin-top:2px}
    .head-r{display:flex;gap:10px;flex-wrap:wrap}
    .cf-btn{display:inline-flex;align-items:center;gap:7px}.cf-btn .material-icons{font-size:18px}
    .cf-btn:disabled{opacity:.5;cursor:not-allowed}

    .stats{display:grid;grid-template-columns:1.6fr repeat(5,1fr);gap:12px;margin-bottom:16px}
    @media(max-width:1200px){.stats{grid-template-columns:repeat(3,1fr)}}@media(max-width:680px){.stats{grid-template-columns:1fr 1fr}}
    .stat{display:flex;align-items:center;gap:12px;padding:14px 16px;border:1px solid var(--cf-line);border-radius:14px;background:var(--cf-surface);box-shadow:0 1px 2px rgba(15,23,42,.04)}
    .s-ic{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;flex:none}.s-ic .material-icons{font-size:20px}
    .s-ic.brand{background:var(--cf-brand-50);color:var(--cf-brand-600)}
    .s-ic.ok{background:color-mix(in srgb,#16a34a 14%,transparent);color:#16a34a}
    .s-ic.warn{background:color-mix(in srgb,#f59e0b 16%,transparent);color:#d97706}
    .s-ic.bad{background:var(--cf-danger-soft);color:var(--cf-danger)}
    .s-ic.views-ic{background:color-mix(in srgb,#8b5cf6 14%,transparent);color:#7c3aed}
    .s-val{font-size:22px;font-weight:800;letter-spacing:-.02em;color:var(--cf-ink-900);line-height:1}
    .s-lbl{font-size:12px;color:var(--cf-ink-500);margin-top:3px}
    .stat.usage{flex-direction:column;align-items:stretch;justify-content:center;gap:0;background:linear-gradient(135deg,color-mix(in srgb,var(--cf-brand-500) 8%,var(--cf-surface)),var(--cf-surface) 70%)}
    .u-top{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--cf-ink-700)}
    .u-top b{margin-inline-start:auto;color:var(--cf-ink-900);font-variant-numeric:tabular-nums}
    .u-top .material-icons{font-size:17px;color:var(--cf-brand-600)}
    .u-bar{height:8px;border-radius:999px;background:var(--cf-surface-2);border:1px solid var(--cf-line);margin:9px 0 7px;overflow:hidden}
    .u-bar span{display:block;height:100%;background:linear-gradient(90deg,var(--cf-brand-500),var(--cf-brand-600));transition:width .5s}
    .usage.warn .u-bar span{background:linear-gradient(90deg,#f59e0b,var(--cf-danger))}

    .toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px}
    .search{flex:1;min-width:200px;max-width:340px;display:flex;align-items:center;gap:8px;height:38px;padding:0 11px;border:1px solid var(--cf-line);border-radius:10px;background:var(--cf-surface);transition:border-color .14s,box-shadow .14s}
    .search:focus-within{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .search .material-icons{font-size:18px;color:var(--cf-ink-400)}
    .search input{flex:1;border:0;background:none;outline:none;font:inherit;font-size:13px;color:var(--cf-ink-900)}
    .clr{border:0;background:none;color:var(--cf-ink-400);cursor:pointer;display:grid;place-items:center}.clr .material-icons{font-size:17px}
    .tplsel{position:relative}
    .tplsel-btn{display:inline-flex;align-items:center;gap:9px;height:38px;padding:0 10px 0 8px;border:1px solid var(--cf-line);border-radius:10px;background:var(--cf-surface);cursor:pointer;font:inherit;color:var(--cf-ink-800);min-width:188px;transition:border-color .14s,box-shadow .14s}
    .tplsel-btn:hover{border-color:var(--cf-brand-400)}
    .tplsel.open .tplsel-btn{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .ts-thumb{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;overflow:hidden;flex:none;background:var(--cf-surface-2);border:1px solid var(--cf-line)}
    .ts-thumb img{width:100%;height:100%;object-fit:cover}
    .ts-thumb .material-icons{font-size:16px;color:var(--cf-brand-600)}
    .ts-thumb.all{background:var(--cf-brand-50);border-color:var(--cf-brand-100)}
    .ts-name{flex:1;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px;text-align:start}
    .ts-chev{font-size:18px;color:var(--cf-ink-400);transition:transform .2s}
    .tplsel.open .ts-chev{transform:rotate(180deg)}
    .tplmenu{position:absolute;top:calc(100% + 6px);inset-inline-start:0;min-width:288px;max-height:344px;overflow:auto;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:13px;box-shadow:0 22px 48px -16px rgba(2,6,23,.42);padding:6px;z-index:50;animation:tpl-in .15s ease;scrollbar-width:thin}
    @keyframes tpl-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
    .tplopt{display:flex;align-items:center;gap:11px;width:100%;border:0;background:none;padding:8px;border-radius:10px;cursor:pointer;text-align:start;transition:background .13s}
    .tplopt:hover{background:var(--cf-surface-2)}
    .tplopt.on{background:var(--cf-brand-50)}
    .to-thumb{width:46px;height:33px;border-radius:7px;overflow:hidden;flex:none;display:grid;place-items:center;background:var(--cf-surface-2);border:1px solid var(--cf-line);box-shadow:0 1px 3px rgba(15,23,42,.1)}
    .to-thumb img{width:100%;height:100%;object-fit:cover}
    .to-thumb .material-icons{font-size:17px;color:var(--cf-ink-400)}
    .to-thumb.all{background:var(--cf-brand-50);border-color:var(--cf-brand-100)}.to-thumb.all .material-icons{color:var(--cf-brand-600)}
    .to-tx{flex:1;display:flex;flex-direction:column;min-width:0}
    .to-tx b{font-size:13px;font-weight:700;color:var(--cf-ink-900);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .to-tx small{font-size:11.5px;color:var(--cf-ink-500)}
    .to-check{font-size:19px;color:var(--cf-brand-600);flex:none}
    .chips{display:inline-flex;gap:4px;padding:4px;background:var(--cf-surface-2);border:1px solid var(--cf-line);border-radius:11px}
    .chips button{border:0;background:none;color:var(--cf-ink-600);font:inherit;font-size:12.5px;font-weight:600;padding:6px 12px;border-radius:8px;cursor:pointer}
    .chips button.on{background:var(--cf-surface);color:var(--cf-brand-700);box-shadow:var(--cf-shadow-sm)}
    .result-line{font-size:12.5px;margin:2px 0 14px}
    .date-filter{display:flex;align-items:center;gap:7px;height:38px;padding:0 10px 0 12px;border:1px solid var(--cf-line);border-radius:10px;background:var(--cf-surface)}
    .date-filter .material-icons{font-size:17px;color:var(--cf-ink-400)}
    .date-filter select{border:0;background:none;outline:none;font:inherit;font-size:13px;font-weight:600;color:var(--cf-ink-700);cursor:pointer}
    .cf-table th.sortable{cursor:pointer;user-select:none;transition:color .14s}
    .cf-table th .th-in{display:inline-flex;align-items:center;gap:3px;white-space:nowrap;line-height:1}
    .cf-table th.ta-c .th-in{justify-content:center}
    .cf-table th .sc{font-size:15px;color:var(--cf-ink-300);opacity:0;transition:opacity .14s,color .14s}
    .cf-table th.sortable:hover{color:var(--cf-ink-700)}
    .cf-table th.sortable:hover .sc{opacity:.55}
    .cf-table th .sc.act{opacity:1;color:var(--cf-brand-600)}
    .cf-table th.sortable:has(.sc.act){color:var(--cf-brand-700)}
    .cf-table th.varcol{color:var(--cf-brand-600)}
    .varcell{font-size:12.5px;color:var(--cf-ink-700);max-width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

    .tcard{border:1px solid var(--cf-line);border-radius:16px;background:var(--cf-surface);overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,.04);max-width:100%}
    .tablewrap{overflow-x:auto;max-width:100%;scrollbar-width:thin;scrollbar-color:var(--cf-line) transparent}
    .tablewrap::-webkit-scrollbar{height:9px}
    .tablewrap::-webkit-scrollbar-thumb{background:var(--cf-line);border-radius:999px;border:2px solid var(--cf-surface)}
    .tablewrap::-webkit-scrollbar-thumb:hover{background:var(--cf-ink-300)}
    .cf-table{width:100%;border-collapse:collapse;font-size:13.5px}
    .cf-table th{position:sticky;top:0;background:var(--cf-surface-2);font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--cf-ink-500);font-weight:700;text-align:start;padding:11px 13px;border-bottom:1px solid var(--cf-line);white-space:nowrap;z-index:1}
    .cf-table td{padding:10px 13px;border-bottom:1px solid var(--cf-line-soft);vertical-align:middle}
    .cf-table tr:last-child td{border-bottom:0}.cf-table tbody tr:hover{background:var(--cf-surface-2)}
    @keyframes rowInC{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    .cf-table tbody tr{animation:rowInC .3s ease backwards}
    .cf-table tbody tr:nth-child(2){animation-delay:.03s}.cf-table tbody tr:nth-child(3){animation-delay:.06s}.cf-table tbody tr:nth-child(4){animation-delay:.09s}.cf-table tbody tr:nth-child(5){animation-delay:.12s}.cf-table tbody tr:nth-child(n+6){animation-delay:.15s}
    .ta-end{text-align:end}
    .recip{display:flex;align-items:center;gap:10px}
    .av{width:34px;height:34px;border-radius:50%;background:var(--cf-brand-50);color:var(--cf-brand-700);border:1px solid var(--cf-brand-100);display:grid;place-items:center;font-size:11.5px;font-weight:700;flex:none}
    .rc{display:flex;flex-direction:column;min-width:0}.rc strong{font-size:13px;color:var(--cf-ink-900);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:170px}.rc small{font-size:11px}
    .tpl-chip{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:var(--cf-ink-700);background:var(--cf-surface-2);border:1px solid var(--cf-line);border-radius:999px;padding:4px 10px;max-width:140px}
    .tpl-chip .material-icons{font-size:13px;color:var(--cf-brand-600)}
    .tpl-chip{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .when{display:flex;flex-direction:column}.when span{font-size:12.5px;color:var(--cf-ink-700)}.when small{font-size:10.5px}
    .cf-badge.st{display:inline-flex;align-items:center}
    .cf-badge .dot{width:6px;height:6px;border-radius:50%;background:currentColor;display:inline-block;margin-inline-end:5px;vertical-align:middle}
    .spin-dot{width:10px;height:10px;border-radius:50%;border:2px solid currentColor;border-top-color:transparent;display:inline-block;margin-inline-end:6px;vertical-align:middle;animation:spin .7s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .st-sending{background:var(--cf-brand-50);color:var(--cf-brand-700);border:1px solid var(--cf-brand-100)}
    .st-revoked{background:var(--cf-surface-2);color:var(--cf-ink-500);border:1px solid var(--cf-line)}
    .sig{display:inline-flex;align-items:center;gap:4px;font-size:11px;margin-top:5px}
    .sig.signed{color:var(--cf-brand-700)}
    .sig.signed .material-icons{font-size:13px}
    .sig.signed .sg-name{font-family:'Brush Script MT','Segoe Script',cursive;font-size:16px;line-height:1}
    .sig.wait{color:var(--cf-warning);font-weight:600}
    .sig.wait .material-icons{font-size:13px}

    .actbar{display:inline-flex;align-items:center;gap:2px;padding:3px;border:1px solid var(--cf-line);border-radius:10px;background:var(--cf-surface);box-shadow:0 1px 2px rgba(15,23,42,.05);transition:box-shadow .16s,border-color .16s}
    .actbar:hover{box-shadow:0 6px 16px -10px rgba(15,23,42,.3);border-color:color-mix(in srgb,var(--cf-brand-500) 24%,var(--cf-line))}
    .act{width:28px;height:28px;display:grid;place-items:center;border:0;background:none;border-radius:8px;color:var(--cf-ink-400);cursor:pointer;transition:background .15s,color .15s,transform .12s}
    .act .material-icons{font-size:16px;transition:transform .25s cubic-bezier(.2,1.3,.4,1)}
    .act:hover:not(:disabled){background:var(--cf-surface-2)}.act:active:not(:disabled){transform:scale(.88)}.act:disabled{opacity:.4;cursor:not-allowed}
    .act.view:hover:not(:disabled){color:var(--cf-brand-600)}.act.view:hover:not(:disabled) .material-icons{transform:scale(1.12)}
    .act.dl:hover:not(:disabled){color:#16a34a}.act.dl:hover:not(:disabled) .material-icons{transform:translateY(2px)}
    .act.send:hover:not(:disabled){color:#0284c7}.act.send:hover:not(:disabled) .material-icons{transform:translateX(2px) rotate(-8deg)}
    .act.danger:hover:not(:disabled){color:var(--cf-danger)}.act.danger:hover:not(:disabled) .material-icons{transform:rotate(90deg)}
    .act-div{width:1px;height:16px;background:var(--cf-line);margin:0 2px}

    .state{max-width:460px;margin:8vh auto;text-align:center;color:var(--cf-ink-600)}
    .st-badge{width:64px;height:64px;border-radius:18px;display:grid;place-items:center;margin:0 auto 8px;background:linear-gradient(135deg,var(--cf-brand-500),var(--cf-brand-700));color:#fff;box-shadow:0 14px 30px -14px color-mix(in srgb,var(--cf-brand-600) 80%,transparent)}
    .st-badge.muted{background:var(--cf-surface-2);color:var(--cf-ink-400);box-shadow:none}
    .st-badge .material-icons{font-size:30px}
    .state h3{margin:6px 0 4px;color:var(--cf-ink-900);font-size:16px}
    .state .cf-btn{margin-top:0}
    .ta-c{text-align:center}
    .origin{display:flex;flex-direction:column;gap:5px;min-width:116px;cursor:default}
    .obar{display:flex;height:7px;border-radius:999px;overflow:hidden;background:var(--cf-surface-2);border:1px solid var(--cf-line)}
    .obar span{display:block}.obar .oe{background:var(--cf-brand-500)}.obar .od{background:var(--cf-accent-500)}.obar .oq{background:var(--cf-accent2-500)}
    .o-lbl{display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:600;color:var(--cf-ink-600)}
    .o-lbl .material-icons{font-size:14px}
    .o-lbl .material-icons[data-o="Email"]{color:var(--cf-brand-600)}.o-lbl .material-icons[data-o="Direct"]{color:var(--cf-accent-600)}.o-lbl .material-icons[data-o="QR"]{color:var(--cf-accent2-600)}
    .views{display:inline-flex;flex-direction:column;align-items:center;gap:4px;min-width:46px}
    .views b{font-size:14px;font-weight:800;color:var(--cf-ink-900)}
    .vbar{width:44px;height:5px;border-radius:999px;background:var(--cf-surface-2);overflow:hidden;border:1px solid var(--cf-line)}
    .vbar i{display:block;height:100%;background:linear-gradient(90deg,var(--cf-brand-500),var(--cf-brand-600))}
    .otip{position:fixed;z-index:200;transform:translate(-50%,calc(-100% - 12px));width:252px;background:var(--cf-ink-900);color:#fff;border-radius:13px;padding:13px 14px;box-shadow:0 22px 48px -16px rgba(2,6,23,.62);pointer-events:none;animation:otip-in .14s ease}
    @keyframes otip-in{from{opacity:0;transform:translate(-50%,calc(-100% - 4px))}to{opacity:1;transform:translate(-50%,calc(-100% - 12px))}}
    .otip-head{display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:800}.otip-head .material-icons{font-size:15px;color:#c7d2fe}
    .otip-sub{font-size:11px;color:rgba(255,255,255,.62);margin:4px 0 10px}
    .otip-row{display:flex;align-items:center;gap:8px;font-size:12px;padding:3px 0}.otip-row .material-icons{font-size:14px;color:rgba(255,255,255,.7)}
    .otip-row .oswatch{width:9px;height:9px;border-radius:3px;flex:none}.otip-row .otip-name{flex:1;color:rgba(255,255,255,.92)}
    .otip-row b{font-weight:800}.otip-row .otip-pct{width:40px;text-align:end;color:rgba(255,255,255,.6);font-variant-numeric:tabular-nums}
    .oswatch.oe{background:var(--cf-brand-500)}.oswatch.od{background:var(--cf-accent-500)}.oswatch.oq{background:var(--cf-accent2-500)}
    .otip-foot{font-size:10px;line-height:1.55;color:rgba(255,255,255,.55);margin-top:10px;border-top:1px solid rgba(255,255,255,.13);padding-top:8px}
    .otip-arrow{position:absolute;bottom:-6px;left:50%;transform:translateX(-50%) rotate(45deg);width:12px;height:12px;background:var(--cf-ink-900)}
  `],
})
export class CredentialsPage {
  readonly A = Actions;
  private alerts = inject(AlertService);
  readonly issued = inject(IssuedService);
  readonly plan = inject(PlanService);
  private templatesSvc = inject(TemplateService);
  private xlsx = inject(ExcelExportService);

  query = signal('');
  templateId = signal<string>('all');
  status = signal<'all' | DeliveryStatus>('all');
  page = signal(1);
  pageSize = signal(25);
  sortKey = signal<string>('date');
  sortDir = signal<'asc' | 'desc'>('desc');
  dateRange = signal<'all' | '7d' | '30d' | 'month' | 'year'>('all');
  private tmeta = signal<Map<string, { name: string; thumb: string | null }>>(new Map());
  tplOpen = signal(false);

  all = computed(() => [...this.issued.records()].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
  stats = computed(() => { const s = this.issued.stats(); return { total: s.total, sent: s.sent, pending: s.pending + s.sending, revoked: s.revoked, failed: s.failed }; });

  usedThisPeriod = computed(() => { const n = new Date(); return this.all().filter((r) => { const d = new Date(r.createdAt); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length; });
  limitLabel(): string { const l = this.plan.issueLimit(); return isFinite(l) ? l.toLocaleString() : '∞'; }
  usagePct = computed(() => { const l = this.plan.issueLimit(); return !isFinite(l) || l <= 0 ? 0 : Math.min(100, Math.round((this.usedThisPeriod() / l) * 100)); });
  remaining = computed(() => { const l = this.plan.issueLimit(); return isFinite(l) ? Math.max(0, l - this.usedThisPeriod()).toLocaleString() : '∞'; });

  templateOptions = computed(() => {
    const counts = new Map<string, number>();
    for (const r of this.all()) counts.set(r.templateId, (counts.get(r.templateId) || 0) + 1);
    const names = new Map<string, string>();
    for (const r of this.all()) if (!names.has(r.templateId)) names.set(r.templateId, this.tplName(r));
    return [...counts.keys()].map((id) => ({ id, name: names.get(id) || 'Template', thumb: this.tmeta().get(id)?.thumb || null, count: counts.get(id) || 0 })).sort((a, b) => b.count - a.count);
  });
  activeTplName = computed(() => this.templateOptions().find((t) => t.id === this.templateId())?.name || '');
  selectedTpl = computed(() => this.templateOptions().find((t) => t.id === this.templateId()) || null);
  @HostListener('document:click') closeTpl(): void { if (this.tplOpen()) this.tplOpen.set(false); }
  toggleTpl(e: Event): void { e.stopPropagation(); this.tplOpen.update((v) => !v); }
  pickTpl(id: string): void { this.templateId.set(id); this.page.set(1); this.tplOpen.set(false); }

  dateAfter = computed(() => {
    const dr = this.dateRange(); const now = new Date();
    if (dr === '7d') return Date.now() - 7 * 864e5;
    if (dr === '30d') return Date.now() - 30 * 864e5;
    if (dr === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    if (dr === 'year') return new Date(now.getFullYear(), 0, 1).getTime();
    return 0;
  });
  selectedVars = computed(() => {
    const tid = this.templateId();
    if (tid === 'all') return [];
    const set = new Set<string>();
    for (const r of this.all()) if (r.templateId === tid) Object.keys(r.data || {}).forEach((k) => set.add(k));
    return [...set];
  });
  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const tid = this.templateId();
    const st = this.status();
    const after = this.dateAfter();
    let list = this.all().filter((r) => {
      if (tid !== 'all' && r.templateId !== tid) return false;
      if (st !== 'all' && r.status !== st) return false;
      if (after && +new Date(r.createdAt) < after) return false;
      if (q && !((r.recipientEmail || '').toLowerCase().includes(q) || (r.recipientName || '').toLowerCase().includes(q) || this.tplName(r).toLowerCase().includes(q) || r.id.toLowerCase().includes(q))) return false;
      return true;
    });
    const dir = this.sortDir() === 'asc' ? 1 : -1; const k = this.sortKey();
    list = [...list].sort((a, b) => {
      let c = 0;
      if (k.startsWith('var:')) { const vk = k.slice(4); c = String(a.data?.[vk] ?? '').localeCompare(String(b.data?.[vk] ?? ''), undefined, { numeric: true, sensitivity: 'base' }); }
      else if (k === 'recipient') c = (a.recipientEmail || a.recipientName || '').localeCompare(b.recipientEmail || b.recipientName || '');
      else if (k === 'template') c = this.tplName(a).localeCompare(this.tplName(b));
      else if (k === 'status') c = a.status.localeCompare(b.status);
      else if (k === 'views') c = this.an(a).views - this.an(b).views;
      else if (k === 'lastViewed') c = (+new Date(this.an(a).lastViewedIso || 0)) - (+new Date(this.an(b).lastViewedIso || 0));
      else c = +new Date(a.createdAt) - +new Date(b.createdAt);
      return c * dir;
    });
    return list;
  });
  pretty(k: string): string { return k.replace(/[_-]+/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase()); }
  sortBy(k: string): void { if (this.sortKey() === k) this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc')); else { this.sortKey.set(k); this.sortDir.set(k === 'views' || k === 'lastViewed' || k === 'date' ? 'desc' : 'asc'); } this.page.set(1); }
  caretIcon(k: string): string { return this.sortKey() !== k ? 'unfold_more' : (this.sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward'); }
  pageSafe = computed(() => { const mp = Math.max(1, Math.ceil(this.filtered().length / this.pageSize())); return Math.min(this.page(), mp); });
  paged = computed(() => { const f = this.filtered(); const ps = this.pageSize(); const start = (this.pageSafe() - 1) * ps; return f.slice(start, start + ps); });
  aMap = computed(() => { const m = new Map<string, any>(); for (const r of this.all()) m.set(r.id, this.issued.analytics(r)); return m; });
  an(c: IssuedRecord): any { return this.aMap().get(c.id) || { views: 0, email: 0, direct: 0, qr: 0, lastViewedIso: '' }; }
  maxViews = computed(() => Math.max(1, ...[...this.aMap().values()].map((x) => x.views)));
  totalViews = computed(() => [...this.aMap().values()].reduce((s, x) => s + x.views, 0));
  originTip = signal<{ x: number; y: number; a: any } | null>(null);
  showOriginTip(ev: MouseEvent, a: any): void { const r = (ev.currentTarget as HTMLElement).getBoundingClientRect(); this.originTip.set({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top), a }); }
  originOf(a: any): string { if (!a.views) return '—'; if (a.email >= a.direct && a.email >= a.qr) return 'Email'; if (a.direct >= a.qr) return 'Direct'; return 'QR'; }
  originIcon(o: string): string { return o === 'Email' ? 'mail' : o === 'Direct' ? 'ads_click' : o === 'QR' ? 'qr_code_2' : 'remove'; }
  pct(n: number, total: number): number { return total ? Math.round((n / total) * 100) : 0; }

  constructor() {
    this.issued.syncFromApi();
    this.templatesSvc.list().subscribe({
      next: (items) => { const m = new Map<string, { name: string; thumb: string | null }>(); (items ?? []).forEach((t) => m.set(t.id, { name: t.name || 'Untitled', thumb: t.thumbnailDataUrl || null })); this.tmeta.set(m); },
      error: () => { /* offline — use record.templateName */ },
    });
  }

  tplName(r: IssuedRecord): string { return r.templateName || this.tmeta().get(r.templateId)?.name || 'Template'; }
  initials(r: IssuedRecord): string { const b = (r.recipientName || r.recipientEmail || '?').trim(); const p = b.split(/[\s@._-]+/).filter(Boolean); return (((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase()) || b.charAt(0).toUpperCase(); }
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

  verify(c: IssuedRecord): void { window.open(location.origin + '/verify/' + c.id, '_blank'); }
  download(c: IssuedRecord): void {
    if (!c.fileDataUrl) { this.alerts.info('The image for this credential is not stored locally (re-issue to regenerate).'); return; }
    const a = document.createElement('a'); a.href = c.fileDataUrl; a.download = `${(c.recipientName || 'certificate').replace(/[^a-z0-9]+/gi, '-')}.png`; a.click();
  }
  resend(c: IssuedRecord): void { this.issued.resend(c.id); this.alerts.info(c.status === 'Failed' ? `Retrying delivery to ${c.recipientEmail}…` : `Re-sending to ${c.recipientEmail}…`); }
  async revoke(c: IssuedRecord): Promise<void> {
    const ok = await this.alerts.confirm({ title: 'Revoke credential', message: `Revoke the certificate issued to ${c.recipientEmail || 'this recipient'}?`, danger: true, confirmText: 'Revoke' });
    if (ok) { this.issued.setStatus(c.id, 'Revoked'); this.alerts.info('Credential revoked.'); }
  }

  private exportCols(): ExcelColumn[] {
    const vars = this.selectedVars();
    return [
      { key: 'recipient', label: 'Recipient', type: 'email' },
      { key: 'name', label: 'Name' },
      { key: 'template', label: 'Template' },
      ...vars.map((v) => ({ key: 'v_' + v, label: this.pretty(v) }) as ExcelColumn),
      { key: 'status', label: 'Delivery Status', type: 'status' },
      { key: 'issued', label: 'Issued On', type: 'date' },
      { key: 'views', label: 'Views', type: 'number' },
      { key: 'origin', label: 'Traffic Origin' },
      { key: 'last', label: 'Last Viewed', type: 'date' },
      { key: 'id', label: 'Credential ID' },
    ];
  }
  private exportData(): any[] {
    const vars = this.selectedVars();
    return this.filtered().map((r) => {
      const a = this.an(r);
      const o: any = { recipient: r.recipientEmail || '', name: r.recipientName || '', template: this.tplName(r), status: r.status, issued: r.createdAt, views: a.views, origin: this.originOf(a), last: a.lastViewedIso || '', id: r.id };
      vars.forEach((v) => (o['v_' + v] = r.data?.[v] ?? ''));
      return o;
    });
  }
  dateRangeLabel(): string { return ({ all: 'All time', '7d': 'Last 7 days', '30d': 'Last 30 days', month: 'This month', year: 'This year' } as any)[this.dateRange()] || 'All time'; }
  exportExcel(): void {
    const rows = this.exportData(); if (!rows.length) return;
    const tpl = this.templateId() !== 'all' ? this.activeTplName() : 'All templates';
    const st = this.status() !== 'all' ? ' · ' + this.status() : '';
    this.xlsx.export(rows, {
      fileName: `credentials-${new Date().toISOString().slice(0, 10)}`,
      sheetName: 'Credentials',
      title: 'Credentials Report',
      subtitle: `${tpl}${st} · ${this.dateRangeLabel()}`,
      columns: this.exportCols(),
      summary: [
        { label: 'Total', value: rows.length },
        { label: 'Sent', value: this.stats().sent },
        { label: 'Pending', value: this.stats().pending },
        { label: 'Revoked', value: this.stats().revoked },
        { label: 'Total Views', value: this.totalViews() },
      ],
    });
    this.alerts.success(`Exported ${rows.length} credential${rows.length === 1 ? '' : 's'} to Excel.`);
  }
  exportCsv(): void {
    const rows = this.exportData(); if (!rows.length) return;
    this.xlsx.csv(rows, this.exportCols(), `credentials-${new Date().toISOString().slice(0, 10)}`);
    this.alerts.success(`Exported ${rows.length} credential${rows.length === 1 ? '' : 's'} to CSV.`);
  }
}
