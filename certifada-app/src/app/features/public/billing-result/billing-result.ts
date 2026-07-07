import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { BillingService } from '../../../core/services/billing.service';
import { PlanService } from '../../../core/services/plan.service';

/** Stripe Checkout return pages: /billing/success and /billing/cancelled. */
@Component({
  selector: 'app-billing-result',
  standalone: true,
  imports: [RouterLink, TranslocoModule],
  template: `
  <div class="br-page">
    <div class="card">
      @if (ok) {
        <div class="orb"><span class="material-icons">celebration</span><i class="sp s1">✦</i><i class="sp s2">✦</i><i class="sp s3">✦</i></div>
        <h1>{{ 'billing.successTitle' | transloco }}</h1>
        <p>{{ 'billing.successSub' | transloco: { plan: planCode() } }}</p>
        <a class="primary" routerLink="/app/dashboard"><span class="material-icons">rocket_launch</span>{{ 'billing.goDashboard' | transloco }}</a>
      } @else {
        <div class="orb err"><span class="material-icons">remove_shopping_cart</span></div>
        <h1>{{ 'billing.cancelTitle' | transloco }}</h1>
        <p>{{ 'billing.cancelSub' | transloco }}</p>
        <a class="primary" routerLink="/pricing">{{ 'billing.backToPricing' | transloco }}</a>
        <a class="ghost" routerLink="/app/dashboard">{{ 'billing.continueFree' | transloco }}</a>
      }
    </div>
  </div>
  `,
  styles: [`
    :host{display:block}
    .br-page{min-height:100vh;display:grid;place-items:center;background:
      radial-gradient(600px 400px at 20% 10%,color-mix(in srgb,#10B981 12%,transparent),transparent 70%),
      radial-gradient(600px 400px at 85% 90%,color-mix(in srgb,#6366F1 12%,transparent),transparent 70%),var(--cf-bg);
      font-family:var(--cf-font);padding:24px}
    .card{width:100%;max-width:420px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:20px;
      box-shadow:0 30px 70px -30px rgba(15,23,42,.4);padding:40px 34px;text-align:center;
      display:flex;flex-direction:column;align-items:center;animation:in .25s cubic-bezier(.2,.8,.3,1)}
    @keyframes in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
    .orb{position:relative;width:80px;height:80px;display:grid;place-items:center;border-radius:50%;margin-bottom:18px;
      background:linear-gradient(135deg,#10B981,#0EA5E9);color:#fff;box-shadow:0 18px 40px -14px rgba(16,185,129,.7);
      animation:pop .5s cubic-bezier(.2,1.6,.4,1) both}
    .orb .material-icons{font-size:34px}
    @keyframes pop{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}
    .orb.err{background:linear-gradient(135deg,#f59e0b,#ea580c);box-shadow:0 18px 40px -14px rgba(245,158,11,.6);animation:none}
    .sp{position:absolute;font-style:normal;color:#F1D48A;animation:spark 1.6s ease-in-out infinite}
    .s1{top:-8px;inset-inline-end:-4px;font-size:15px}.s2{bottom:-4px;inset-inline-start:-10px;font-size:11px;animation-delay:.4s}.s3{top:8px;inset-inline-start:-16px;font-size:9px;animation-delay:.9s}
    @keyframes spark{0%,100%{opacity:0;transform:scale(.6)}50%{opacity:1;transform:scale(1.15)}}
    h1{font-size:22px;color:var(--cf-ink-900);letter-spacing:-.02em;font-weight:700}
    p{color:var(--cf-ink-500);font-size:13.5px;line-height:1.6;margin:8px 0 0;max-width:36ch}
    .primary{display:inline-flex;align-items:center;gap:8px;margin-top:24px;padding:12px 26px;border-radius:12px;font-size:13.5px;font-weight:700;color:#fff;text-decoration:none;
      background:linear-gradient(135deg,#6366F1,#4338CA);box-shadow:0 12px 26px -12px rgba(79,70,229,.7)}
    .primary .material-icons{font-size:17px}
    .ghost{margin-top:12px;font-size:12.5px;font-weight:600;color:var(--cf-ink-500);text-decoration:none}
    .ghost:hover{color:var(--cf-brand-600)}
    @media(prefers-reduced-motion:reduce){*{animation-duration:.01ms !important}}
  `],
})
export class BillingResultPage implements OnInit {
  /** true on /billing/success, false on /billing/cancelled (route data). */
  ok = true;
  planCode = signal('');
  private route = inject(ActivatedRoute);
  private billing = inject(BillingService);
  private plans = inject(PlanService);

  ngOnInit(): void {
    this.ok = this.route.snapshot.data['ok'] !== false;
    const plan = this.route.snapshot.queryParamMap.get('plan') || this.billing.pendingPlan()?.code || '';
    this.planCode.set(plan);
    if (!this.ok) return;

    // Confirm the session server-side — this is what actually PERSISTS the
    // subscription (TenantPlan + Subscription + BillingHistory). On localhost
    // Stripe's webhook can't reach the API, so this is the primary path;
    // in production the webhook does the same thing idempotently.
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (sessionId) {
      this.billing.confirmCheckout(sessionId).subscribe({
        next: (res) => {
          const code = res?.data?.planCode || plan;
          if (res?.success && code) { this.planCode.set(code); this.plans.setPlan(code); }
          else if (plan) this.plans.setPlan(plan);
          this.billing.clearPendingPlan();
        },
        error: () => { if (plan) this.plans.setPlan(plan); this.billing.clearPendingPlan(); },
      });
    } else {
      if (plan) this.plans.setPlan(plan);
      this.billing.clearPendingPlan();
    }
  }
}
