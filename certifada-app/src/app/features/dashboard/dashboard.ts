import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TemplateService } from '../../core/services/template.service';
import { TemplateListItem } from '../../core/models/models';
import { HasActionDirective } from '../../shared/directives/has-action.directive';
import { Actions } from '../../core/constants/actions';
import { TranslocoModule } from '@ngneat/transloco';
import { OnboardingDialogComponent } from './onboarding-dialog';

interface MonthVal { label: string; v: number; }
interface StatusSeg { label: string; value: number; color: string; }
interface Activity { icon: string; color: string; text: string; time: string; }
interface CertRow { recipient: string; template: string; status: 'Active' | 'Pending' | 'Expired'; date: string; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, HasActionDirective, TranslocoModule, OnboardingDialogComponent],
  template: `
  @if (showOnboarding()) { <app-onboarding (done)="showOnboarding.set(false)" /> }

  <div class="head">
    <div>
      <h1>{{ 'dash.title' | transloco }}</h1>
      <p class="cf-muted">{{ 'dash.subtitle' | transloco }}</p>
    </div>
    <a class="cf-btn cf-btn-primary" routerLink="/canvas"
       [appHasAction]="A.Template_Edit" [tooltipMessage]="'🔒 Upgrade your plan to create templates.'">
      <span class="material-icons">add</span> {{ 'dash.newCertificate' | transloco }}
    </a>
  </div>

  <!-- metrics -->
  <div class="cf-metrics">
    <div class="cf-metric">
      <div class="ic" style="background:var(--cf-brand-50);color:var(--cf-brand-600)"><span class="material-icons">verified</span></div>
      <div class="cf-metric-lbl">{{ 'dash.issued' | transloco }}</div>
      <div class="cf-metric-val">{{ issued().toLocaleString() }}</div>
      <div class="delta up"><span class="material-icons">trending_up</span>+12.5%</div>
    </div>
    <div class="cf-metric">
      <div class="ic" style="background:var(--cf-gold-soft);color:var(--cf-gold-ink)"><span class="material-icons">dashboard_customize</span></div>
      <div class="cf-metric-lbl">{{ 'dash.templates' | transloco }}</div>
      <div class="cf-metric-val">{{ templateCount() }}</div>
      <div class="delta cf-muted">{{ loading() ? ('common.loading' | transloco) : ('dash.totalDesigns' | transloco) }}</div>
    </div>
    <div class="cf-metric">
      <div class="ic" style="background:var(--cf-warning-soft);color:var(--cf-warning)"><span class="material-icons">hourglass_top</span></div>
      <div class="cf-metric-lbl">{{ 'dash.pending' | transloco }}</div>
      <div class="cf-metric-val">{{ pending() }}</div>
      <div class="delta down"><span class="material-icons">trending_down</span>-4 vs last week</div>
    </div>
    <div class="cf-metric">
      <div class="ic" style="background:var(--cf-info-soft);color:var(--cf-info)"><span class="material-icons">group</span></div>
      <div class="cf-metric-lbl">{{ 'dash.activeUsers' | transloco }}</div>
      <div class="cf-metric-val">{{ activeUsers() }}</div>
      <div class="delta up"><span class="material-icons">trending_up</span>+8.1%</div>
    </div>
  </div>

  <!-- analytics: chart + status donut -->
  <div class="row analytics">
    <div class="cf-card cf-card-pad">
      <div class="card-head">
        <h3>{{ 'dash.issued' | transloco }}</h3>
        <div class="seg">
          <button [class.on]="range()==='6m'" (click)="range.set('6m')">6M</button>
          <button [class.on]="range()==='12m'" (click)="range.set('12m')">12M</button>
        </div>
      </div>
      <div class="bars">
        @for (b of bars(); track b.label) {
          <div class="col" [class.hot]="b.hot">
            <div class="bar" [style.height.%]="b.pct"><span class="val">{{ b.value }}</span></div>
            <span class="cap">{{ b.label }}</span>
          </div>
        }
      </div>
    </div>

    <div class="cf-card cf-card-pad">
      <div class="card-head"><h3>{{ 'dash.statusBreakdown' | transloco }}</h3></div>
      <div class="donut-wrap">
        <div class="donut">
          <svg viewBox="0 0 120 120">
            <circle class="track" cx="60" cy="60" r="52"></circle>
            @for (s of donut(); track s.label) {
              <circle class="seg" cx="60" cy="60" r="52"
                [style.stroke]="s.color" [style.stroke-dasharray]="s.dash" [style.stroke-dashoffset]="s.offset"></circle>
            }
          </svg>
          <div class="donut-center"><span class="dt">{{ statusTotal().toLocaleString() }}</span><span class="cf-muted small">{{ 'dash.total' | transloco }}</span></div>
        </div>
        <div class="legend">
          @for (s of donut(); track s.label) {
            <div class="lg"><span class="dot" [style.background]="s.color"></span><span class="lg-lbl">{{ s.label }}</span><span class="lg-val">{{ s.value.toLocaleString() }} · {{ s.pct }}%</span></div>
          }
        </div>
      </div>
    </div>
  </div>

  <!-- plan & usage -->
  <div class="cf-card plan">
    <div class="plan-left">
      <span class="plan-pill"><span class="material-icons">workspace_premium</span>{{ planType() }} plan</span>
      <h3>{{ 'dash.subscription' | transloco }}</h3>
      <div class="plan-meta">
        <div><span class="pl">{{ 'dash.renewalDate' | transloco }}</span><span class="pv">{{ renewalDate() }}</span></div>
        <div><span class="pl">{{ 'dash.status' | transloco }}</span><span class="pv ok">{{ 'dash.active' | transloco }}</span></div>
        <div><span class="pl">{{ 'dash.planType' | transloco }}</span><span class="pv">{{ planType() }}</span></div>
      </div>
      <a class="cf-btn cf-btn-primary" routerLink="/app/settings"
         [appHasAction]="A.Settings_Manage" [tooltipMessage]="'🔒 Plan changes are managed by an admin.'">
        <span class="material-icons">upgrade</span> {{ 'dash.upgrade' | transloco }}
      </a>
    </div>
    <div class="plan-right">
      <div class="ring">
        <svg viewBox="0 0 120 120">
          <circle class="track" cx="60" cy="60" r="52"></circle>
          <circle class="prog" cx="60" cy="60" r="52" [style.stroke-dasharray]="circ" [style.stroke-dashoffset]="dashOffset()"></circle>
        </svg>
        <div class="ring-center"><span class="pct">{{ usagePct() }}%</span><span class="cf-muted small">{{ 'dash.used' | transloco }}</span></div>
      </div>
      <div class="usage-legend">
        <div class="ul"><span class="dot brand"></span><span><b>{{ created().toLocaleString() }}</b> {{ 'dash.created' | transloco }}</span></div>
        <div class="ul"><span class="dot track2"></span><span><b>{{ remaining().toLocaleString() }}</b> {{ 'dash.remaining' | transloco }}</span></div>
        <div class="cf-muted small">of {{ limit().toLocaleString() }} this period</div>
      </div>
    </div>
  </div>

  <!-- activity + recent templates -->
  <div class="row two">
    <div class="cf-card cf-card-pad">
      <div class="card-head"><h3>{{ 'dash.recentActivity' | transloco }}</h3></div>
      <ul class="feed">
        @for (a of activity; track a.text) {
          <li><span class="fic" [style.background]="a.color + '22'" [style.color]="a.color"><span class="material-icons">{{ a.icon }}</span></span>
            <span class="ftext"><span>{{ a.text }}</span><span class="cf-muted small">{{ a.time }}</span></span></li>
        }
      </ul>
    </div>

    <div class="cf-card cf-card-pad">
      <div class="card-head"><h3>{{ 'dash.recentTemplates' | transloco }}</h3><a class="link" routerLink="/app/templates">{{ 'common.viewAll' | transloco }}</a></div>
      @if (loading()) { <p class="cf-muted small">Loading…</p> }
      @else if (recent().length === 0) {
        <p class="cf-muted small">No templates yet. <a routerLink="/canvas" [appHasAction]="A.Template_Edit">Create one →</a></p>
      } @else {
        @for (t of recent(); track t.id) {
          <a class="rec" [routerLink]="['/canvas', t.id]">
            <span class="mini">@if (t.thumbnailDataUrl) { <img [src]="t.thumbnailDataUrl" alt="" /> } @else { <span class="material-icons">workspace_premium</span> }</span>
            <span class="rec-body"><span class="rec-name">{{ t.name || 'Untitled Certificate' }}</span><span class="cf-muted small">Updated {{ t.updatedAt | date: 'mediumDate' }}</span></span>
          </a>
        }
      }
    </div>
  </div>

  <!-- recent certificates -->
  <div class="cf-card cf-card-pad" style="margin-top:16px">
    <div class="card-head"><h3>{{ 'dash.recentCertificates' | transloco }}</h3><a class="link" routerLink="/app/credentials">{{ 'nav.credentials' | transloco }}</a></div>
    <div style="overflow-x:auto">
      <table class="cf-table">
        <thead><tr><th>{{ 'dash.recipient' | transloco }}</th><th>{{ 'dash.template' | transloco }}</th><th>{{ 'dash.status' | transloco }}</th><th>{{ 'dash.date' | transloco }}</th></tr></thead>
        <tbody>
          @for (c of certs; track c.recipient + c.date) {
            <tr>
              <td style="color:var(--cf-ink-900);font-weight:500">{{ c.recipient }}</td>
              <td>{{ c.template }}</td>
              <td><span class="cf-badge" [ngClass]="badge(c.status)"><span class="cf-dot" *ngIf="c.status==='Active'"></span>{{ c.status }}</span></td>
              <td class="cf-muted">{{ c.date }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  </div>

  <!-- quick actions -->
  <h3 class="qa-title">{{ 'dash.quickActions' | transloco }}</h3>
  <div class="qa">
    <a class="cf-card qa-card" routerLink="/canvas" [appHasAction]="A.Template_Edit" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">add_circle</span><span>{{ 'nav.newTemplate' | transloco }}</span></a>
    <a class="cf-card qa-card" routerLink="/app/templates" [appHasAction]="A.Credential_Generate" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">send</span><span>{{ 'dash.generate' | transloco }}</span></a>
    <a class="cf-card qa-card" routerLink="/app/branding" [appHasAction]="A.Branding_Manage" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">palette</span><span>{{ 'nav.branding' | transloco }}</span></a>
    <a class="cf-card qa-card" routerLink="/app/approvals" [appHasAction]="A.Credential_Approve" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">fact_check</span><span>{{ 'nav.approvals' | transloco }}</span></a>
  </div>
  `,
  styles: [`
    :host{display:block}
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
    @media(max-width:720px){.plan{grid-template-columns:1fr}.plan-right{justify-content:flex-start}}
  `],
})
export class DashboardPage {
  private templates = inject(TemplateService);
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
  pending = signal(18);
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

  badge(s: string): string {
    return s === 'Active' ? 'cf-badge-success' : s === 'Pending' ? 'cf-badge-warning' : 'cf-badge-danger';
  }

  constructor() {
    this.templates.list().subscribe({
      next: (items) => { this.items.set(items ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
