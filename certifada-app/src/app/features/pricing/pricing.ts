import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { PlanService, PlanTier, PlanFeature } from '../../core/services/plan.service';
import { AlertService } from '../../core/services/alert.service';
import { LanguageService } from '../../core/services/language.service';
import { AuthService } from '../../core/services/auth.service';
import { BillingService, SubscriptionView } from '../../core/services/billing.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoModule],
  template: `
  <div class="wrap">
    <header class="ph">
      <a class="brand" routerLink="/app/dashboard"><span class="bk"><span class="material-icons">arrow_back</span></span> <span class="logo"><span class="mark"><span class="material-icons">workspace_premium</span></span> Certifada</span></a>
      <button class="lang" (click)="lang.toggle($event)" aria-label="Switch language">
        {{ lang.lang() === 'en' ? 'العربية' : 'English' }}<span class="material-icons">language</span>
      </button>
    </header>

    <div class="hero">
      <span class="eyebrow"><span class="material-icons">auto_awesome</span> {{ 'pricingPage.eyebrow' | transloco }}</span>
      <h1>{{ 'pricingPage.title' | transloco }} <em>{{ 'pricingPage.titleEm' | transloco }}</em></h1>
      <p>{{ 'pricingPage.sub' | transloco }}</p>
      <div class="toggle">
        <button [class.on]="billing() === 'monthly'" (click)="plan.setBilling('monthly')">{{ 'pricingPage.monthly' | transloco }}</button>
        <button [class.on]="billing() === 'yearly'" (click)="plan.setBilling('yearly')">{{ 'pricingPage.yearly' | transloco }} <span class="save">{{ 'pricingPage.save17' | transloco }}</span></button>
      </div>
    </div>

    <div class="grid">
      @for (t of plan.catalog(); track t.id) {
        <div class="plan" [class.popular]="t.popular" [class.current]="isCurrent(t) || isPicked(t)">
          @if (t.popular) { <span class="pop">{{ 'landing.planPopular' | transloco }}</span> }
          <h3>{{ planName(t) }}</h3>
          <div class="price">
            @if (t.monthly === 0) {
              <span class="amt">{{ 'pricingPage.free' | transloco }}</span><span class="per">{{ 'pricingPage.freeDays' | transloco }}</span>
            } @else {
              <span class="amt">\${{ billing() === 'yearly' ? t.yearly : t.monthly }}</span><span class="per">{{ (billing() === 'yearly' ? 'pricingPage.perYear' : 'pricingPage.perMonth') | transloco }}</span>
            }
          </div>
          @if (billing() === 'yearly' && t.monthly > 0) { <span class="saveline">{{ 'pricingPage.saveWord' | transloco }} \${{ plan.yearlySave(t) }}</span> }
          <p class="blurb">{{ blurb(t) }}</p>

          @if (scheduledFor(t); as when) {
            <span class="sched"><span class="material-icons">schedule</span>{{ 'pricingPage.startsOn' | transloco: { date: when } }}</span>
          }
          @if (isCurrent(t)) {
            @if (canKeep()) {
              <button class="cta keep" (click)="keep(t)"><span class="material-icons">undo</span> {{ 'pricingPage.keepPlan' | transloco }}</button>
            } @else {
              <button class="cta cur" disabled><span class="material-icons">check_circle</span> {{ 'pricingPage.current' | transloco }}</button>
            }
          } @else if (isPicked(t)) {
            <button class="cta" (click)="choose(t)"><span class="material-icons">check</span> {{ 'pricingPage.continueSignup' | transloco }}</button>
          } @else if (t.trial) {
            <button class="cta ghost" (click)="choose(t)">{{ actionKind(t) === 'downgrade' ? ('pricingPage.downgrade' | transloco) : ('pricingPage.startTrial' | transloco) }}</button>
          } @else if (actionKind(t) === 'upgrade') {
            <button class="cta" (click)="choose(t)"><span class="material-icons">arrow_upward</span> {{ 'pricingPage.upgrade' | transloco }}</button>
          } @else if (actionKind(t) === 'downgrade') {
            <button class="cta ghost" (click)="choose(t)"><span class="material-icons">arrow_downward</span> {{ 'pricingPage.downgrade' | transloco }}</button>
          } @else {
            <button class="cta" (click)="choose(t)">{{ 'pricingPage.subscribe' | transloco }}</button>
          }

          <div class="incl">{{ 'pricingPage.included' | transloco }}</div>
          <ul class="feats">
            @for (f of t.features; track f.label) {
              <li [class.off]="!f.included">
                <span class="fi"><span class="material-icons">{{ f.included ? 'check' : 'remove' }}</span></span>
                <span class="fl">{{ featLabel(f) }}@if (f.value) { <b>({{ featVal(f.value) }})</b> }</span>
              </li>
            }
          </ul>
        </div>
      }
    </div>
  </div>
  `,
  styles: [`
    :host{display:block;min-height:100vh;background:
      radial-gradient(900px 480px at 12% -8%, color-mix(in srgb,var(--cf-brand-500) 14%,transparent), transparent 60%),
      radial-gradient(820px 420px at 100% 0%, color-mix(in srgb,var(--cf-accent2-500) 10%,transparent), transparent 55%),
      var(--cf-bg, #f6f7fb)}
    .wrap{max-width:1180px;margin:0 auto;padding:20px 22px 72px}
    .ph{display:flex;align-items:center;justify-content:space-between;padding:6px 0 8px}
    .brand{display:inline-flex;align-items:center;gap:12px;text-decoration:none}
    .bk{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-600);transition:border-color .18s,color .18s}
    .brand:hover .bk{border-color:var(--cf-brand-500);color:var(--cf-brand-600)}
    .bk .material-icons{font-size:18px}
    :host-context([dir=rtl]) .bk .material-icons{transform:scaleX(-1)}
    .ph .lang{display:inline-flex;align-items:center;gap:6px;height:38px;padding:0 14px;border-radius:999px;border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-700);font:inherit;font-weight:600;font-size:13px;cursor:pointer;transition:.18s}
    .ph .lang:hover{border-color:var(--cf-brand-500);color:var(--cf-brand-600)}
    .ph .lang .material-icons{font-size:16px}
    .logo{display:inline-flex;align-items:center;gap:9px;font-size:17px;font-weight:800;color:var(--cf-ink-900);letter-spacing:-.01em}
    .mark{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#6366F1,#7C3AED);color:#fff;display:grid;place-items:center;box-shadow:0 6px 14px -6px rgba(99,102,241,.7)}
    .mark .material-icons{font-size:17px}

    .hero{text-align:center;padding:34px 0 36px}
    .eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--cf-brand-700);background:var(--cf-brand-50);border:1px solid var(--cf-brand-100);padding:7px 15px;border-radius:999px}
    .eyebrow .material-icons{font-size:15px}
    .hero h1{font-size:clamp(30px,4.6vw,46px);font-weight:700;letter-spacing:-.03em;color:var(--cf-ink-900);margin:16px 0 10px;line-height:1.1}
    .hero h1 em{font-family:"Playfair Display",Georgia,serif;font-style:italic;color:var(--cf-brand-600)}
    .hero p{font-size:15px;color:var(--cf-ink-500);max-width:620px;margin:0 auto;line-height:1.65}
    .toggle{display:inline-flex;gap:4px;margin-top:26px;padding:5px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:14px;box-shadow:var(--cf-shadow-sm)}
    .toggle button{display:inline-flex;align-items:center;gap:7px;border:0;background:none;font:inherit;font-size:13.5px;font-weight:700;color:var(--cf-ink-500);padding:10px 22px;border-radius:10px;cursor:pointer;transition:.18s}
    .toggle button.on{background:linear-gradient(135deg,#6366F1,#4338CA);color:#fff;box-shadow:0 10px 22px -10px rgba(79,70,229,.8)}
    .save{font-size:10.5px;font-weight:800;background:#16a34a;color:#fff;padding:2px 7px;border-radius:999px}
    .toggle button.on .save{background:rgba(255,255,255,.25)}

    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;align-items:start}
    @media(max-width:1080px){.grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:620px){.grid{grid-template-columns:1fr}}
    .plan{position:relative;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:22px;padding:26px 22px;box-shadow:0 1px 2px rgba(15,23,42,.05);transition:transform .2s,box-shadow .24s,border-color .2s;display:flex;flex-direction:column}
    .plan:hover{transform:translateY(-4px);box-shadow:0 28px 56px -28px rgba(2,6,23,.4)}
    .plan.popular{background:linear-gradient(180deg,#0B1020,#101A36);border-color:rgba(129,140,248,.45);box-shadow:0 34px 68px -30px rgba(31,41,110,.75)}
    .plan.popular h3,.plan.popular .amt{color:#fff}
    .plan.popular .per{color:#8A97B8}
    .plan.popular .blurb{color:#A9B4D6}
    .plan.popular .incl{color:#7683A8}
    .plan.popular .feats li{color:#C9D2EC}
    .plan.popular .feats li .fi{background:rgba(129,140,248,.18);color:#A5B4FC}
    .plan.popular .feats li.off{color:#5B688C}
    .plan.popular .feats li.off .fi{background:rgba(255,255,255,.05);color:#5B688C}
    .plan.popular .fl b{color:#fff}
    .plan.current{border-color:color-mix(in srgb,#16a34a 50%,var(--cf-line))}
    .pop{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#E2B45A,#C98F2B);color:#241A05;font-size:11px;font-weight:800;letter-spacing:.05em;padding:5px 15px;border-radius:999px;white-space:nowrap;box-shadow:0 10px 22px -8px rgba(201,143,43,.7)}
    .plan h3{font-size:16.5px;font-weight:800;color:var(--cf-ink-900);margin-bottom:10px}
    .price{display:flex;align-items:baseline;gap:5px}
    .amt{font-size:36px;font-weight:800;letter-spacing:-.03em;color:var(--cf-ink-900)}
    .per{font-size:13px;font-weight:600;color:var(--cf-ink-400)}
    .saveline{font-size:11.5px;font-weight:800;color:#15803d;background:#dcfce7;padding:3px 10px;border-radius:999px;align-self:flex-start;margin-top:8px}
    .blurb{font-size:12.5px;color:var(--cf-ink-500);margin:12px 0 16px;line-height:1.55;min-height:34px}
    .cta{display:inline-flex;align-items:center;justify-content:center;gap:7px;width:100%;padding:12px 14px;border-radius:13px;border:1px solid transparent;font:inherit;font-size:13.5px;font-weight:700;cursor:pointer;transition:transform .14s,box-shadow .18s,filter .18s;background:linear-gradient(135deg,#6366F1,#4338CA);color:#fff;box-shadow:0 12px 24px -12px rgba(79,70,229,.8),inset 0 1px 0 rgba(255,255,255,.16)}
    .cta:hover{transform:translateY(-1px);filter:brightness(1.05)}
    .cta.ghost{background:var(--cf-surface);color:var(--cf-brand-700);border-color:var(--cf-brand-200);box-shadow:none}
    .cta.ghost:hover{background:var(--cf-brand-50)}
    .cta.cur{background:#dcfce7;color:#15803d;box-shadow:none;cursor:default}.cta.cur .material-icons{font-size:17px}
    .cta.keep{background:#fef3c7;color:#92400e;box-shadow:none}.cta.keep:hover{filter:brightness(.98)}
    .sched{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;margin-bottom:8px;padding:4px 11px;border-radius:999px;font-size:11.5px;font-weight:700;color:#92400e;background:#fef3c7}
    .sched .material-icons{font-size:14px}
    .cta .material-icons{font-size:17px}
    .incl{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--cf-ink-400);margin:20px 0 12px}
    .feats{list-style:none;display:flex;flex-direction:column;gap:10px;padding:0;margin:0}
    .feats li{display:flex;align-items:flex-start;gap:9px;font-size:12.5px;color:var(--cf-ink-700)}
    .feats li.off{color:var(--cf-ink-400);opacity:.7}
    .fi{width:19px;height:19px;border-radius:7px;display:grid;place-items:center;flex:none;background:var(--cf-brand-50);color:var(--cf-brand-600);margin-top:1px}
    .feats li.off .fi{background:var(--cf-surface-2);color:var(--cf-ink-400)}
    .fi .material-icons{font-size:13px}
    .fl b{font-weight:700;color:var(--cf-ink-900)}
    .feats li.off .fl b{color:var(--cf-ink-400)}
  `],
})
export class PricingPage implements OnInit {
  plan = inject(PlanService);
  lang = inject(LanguageService);
  private router = inject(Router);
  private alerts = inject(AlertService);
  private t = inject(TranslocoService);
  private auth = inject(AuthService);
  private billingSvc = inject(BillingService);
  billing = computed(() => this.plan.billing());
  busy = signal(false);
  /** The live subscription (scheduled changes, cancel dates) for smart labels/badges. */
  sub = signal<SubscriptionView | null>(null);

  ngOnInit(): void { this.refreshSub(); }
  private refreshSub(): void {
    if (!this.auth.isAuthenticated()) return;
    this.billingSvc.subscription().subscribe({
      next: (res) => { if (res?.success) this.sub.set(res.data ?? null); },
      error: () => { /* ignore */ },
    });
  }

  /** upgrade | downgrade | new — relative to the signed-in user's current plan. */
  actionKind(t: PlanTier): 'upgrade' | 'downgrade' | 'new' {
    if (!this.auth.isAuthenticated()) return 'new';
    const cur = this.plan.rank(this.plan.plan());
    const target = this.plan.rank(t.id);
    if (target > cur) return 'upgrade';
    if (target < cur) return 'downgrade';
    return 'new';
  }

  /** Date a scheduled change lands on this card (downgrade target or Free after cancel). */
  scheduledFor(t: PlanTier): string | null {
    const s = this.sub();
    if (!s || !this.auth.isAuthenticated()) return null;
    if (s.pendingPlanCode === t.id && s.scheduledChangeOn) return new Date(s.scheduledChangeOn).toLocaleDateString();
    if (t.id === 'Free' && s.status === 'canceling') {
      const when = s.cancelAt || s.currentPeriodEnd;
      return when ? new Date(when).toLocaleDateString() : null;
    }
    return null;
  }

  /** The current card offers "Keep this plan" while a change/cancellation is scheduled. */
  canKeep(): boolean {
    const s = this.sub();
    return !!s && (!!s.pendingPlanCode || s.status === 'canceling');
  }

  /** Undo the scheduled downgrade/cancellation — stay on the current plan. */
  async keep(t: PlanTier): Promise<void> {
    const ok = await this.alerts.confirm({
      title: this.t.translate('pricingPage.cfmKeepTitle', { plan: this.planName(t) }),
      message: this.t.translate('pricingPage.cfmKeepMsg', { plan: this.planName(t) }),
      confirmText: this.t.translate('pricingPage.confirmGo'),
      cancelText: this.t.translate('pricingPage.confirmNo'),
      tone: 'success', icon: 'undo',
    });
    if (!ok) return;
    this.applyChange(t, t.id);
  }

  /** Translate catalog strings (kept in English in PlanService) via keyed lookups; fall back to the original. */
  private tr(key: string, fallback: string): string {
    const v = this.t.translate(key);
    return (!v || v === key) ? fallback : v;
  }
  planName(t: PlanTier): string { return this.tr('pricingPage.plan.' + t.name, t.name); }
  blurb(t: PlanTier): string { return this.tr('pricingPage.blurb.' + t.id, t.blurb); }
  featLabel(f: PlanFeature): string { return this.tr('pricingPage.feat.' + f.label, f.label); }
  featVal(v: string): string { return this.tr('pricingPage.val.' + v, v); }

  /** "Current plan" only makes sense for a signed-in user — visitors have no plan yet. */
  isCurrent(t: PlanTier): boolean { return this.auth.isAuthenticated() && this.plan.plan() === t.id; }
  /** Visitor's pre-signup choice (carried from home/register) — highlighted as selected. */
  isPicked(t: PlanTier): boolean {
    return !this.auth.isAuthenticated() && this.billingSvc.pendingPlan()?.code === t.id;
  }

  /**
   * Smart plan selection:
   *  - visitor → register page carrying the chosen plan
   *  - signed-in + free plan → prorated downgrade via the API
   *  - signed-in + paid plan → prorated up/downgrade, or Stripe Checkout when
   *    there's no live subscription yet
   */
  async choose(t: PlanTier): Promise<void> {
    const interval = this.billing();
    if (!this.auth.isAuthenticated()) {
      this.billingSvc.setPendingPlan(t.id, interval);
      this.router.navigate(['/auth/register'], { queryParams: { plan: t.id, interval } });
      return;
    }
    if (this.busy()) return;

    // Smart confirmation: explain exactly what will happen before acting.
    const kind = this.actionKind(t);
    const price = interval === 'yearly' ? `$${t.yearly}/${this.t.translate('pricingPage.perYear').replace('/', '')}` : `$${t.monthly}/${this.t.translate('pricingPage.perMonth').replace('/', '')}`;
    const periodEnd = this.sub()?.currentPeriodEnd ? new Date(this.sub()!.currentPeriodEnd!).toLocaleDateString() : '';
    const currentName = this.planName(this.plan.current());
    let ok = true;
    if (t.monthly === 0 && kind === 'downgrade') {
      ok = await this.alerts.confirm({
        title: this.t.translate('pricingPage.cfmFreeTitle'),
        message: this.t.translate('pricingPage.cfmFreeMsg', { current: currentName, date: periodEnd }),
        confirmText: this.t.translate('pricingPage.confirmGo'), cancelText: this.t.translate('pricingPage.confirmNo'),
        tone: 'danger', icon: 'arrow_downward',
      });
    } else if (kind === 'downgrade') {
      ok = await this.alerts.confirm({
        title: this.t.translate('pricingPage.cfmDowngradeTitle', { plan: this.planName(t) }),
        message: this.t.translate('pricingPage.cfmDowngradeMsg', { current: currentName, date: periodEnd, plan: this.planName(t), price }),
        confirmText: this.t.translate('pricingPage.confirmGo'), cancelText: this.t.translate('pricingPage.confirmNo'),
        tone: 'brand', icon: 'arrow_downward',
      });
    } else if (kind === 'upgrade' && t.monthly > 0) {
      ok = await this.alerts.confirm({
        title: this.t.translate('pricingPage.cfmUpgradeTitle', { plan: this.planName(t) }),
        message: this.t.translate('pricingPage.cfmUpgradeMsg', { plan: this.planName(t), price }),
        confirmText: this.t.translate('pricingPage.confirmPay'), cancelText: this.t.translate('pricingPage.confirmNo'),
        tone: 'success', icon: 'lock',
      });
    }
    if (!ok) return;
    this.applyChange(t, t.monthly === 0 ? 'Free' : t.id);
  }

  /** Calls the API and routes the result (Stripe redirect / stay / dashboard). */
  private applyChange(t: PlanTier, planCode: string): void {
    const interval = this.billing();
    this.busy.set(true);
    this.billingSvc.changePlan(planCode, interval).subscribe({
      next: (res) => {
        this.busy.set(false);
        if (res?.data?.checkoutRequired && res.data.checkoutUrl) {
          window.location.href = res.data.checkoutUrl; // hosted Stripe Checkout — user pays there
          return;
        }
        if (res?.success) {
          const msg = res.data?.message || res.message || `You're now on the ${t.name} plan.`;
          this.alerts.success(msg, { title: this.t.translate('pricingPage.subUpdated') });
          // No local plan switch here: upgrades adopt on the Stripe success page,
          // downgrades stay on the current plan until period end (server-synced).
          this.refreshSub();
        } else {
          this.alerts.error(res?.message || 'Could not change your plan. Please try again.');
        }
      },
      error: () => {
        this.busy.set(false);
        this.alerts.error('Could not reach billing. Please try again.');
      },
    });
  }
}
