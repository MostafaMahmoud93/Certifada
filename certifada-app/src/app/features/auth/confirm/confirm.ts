import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { AuthService } from '../../../core/services/auth.service';
import { BillingService } from '../../../core/services/billing.service';
import { PlanService } from '../../../core/services/plan.service';

/**
 * Email-verification landing page (/auth/confirm?token=…).
 * Activates the account, signs the user in, then routes smartly:
 *  - paid plan chosen at signup → straight to Stripe Checkout
 *  - free plan / nothing chosen → dashboard
 */
@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [RouterLink, TranslocoModule],
  template: `
  <div class="cf-page">
    <div class="card">
      @switch (state()) {
        @case ('verifying') {
          <div class="orb"><span class="material-icons">mark_email_read</span></div>
          <h1>{{ 'auth.confirmVerifying' | transloco }}</h1>
          <p>{{ 'auth.confirmVerifyingSub' | transloco }}</p>
          <div class="bar"><i></i></div>
        }
        @case ('paying') {
          <div class="orb pay"><span class="material-icons">credit_card</span></div>
          <h1>{{ 'auth.confirmPaying' | transloco: { plan: planName() } }}</h1>
          <p>{{ 'auth.confirmPayingSub' | transloco }}</p>
          <div class="bar"><i></i></div>
        }
        @case ('error') {
          <div class="orb err"><span class="material-icons">link_off</span></div>
          <h1>{{ 'auth.confirmFailedTitle' | transloco }}</h1>
          <p>{{ message() || ('auth.confirmFailed' | transloco) }}</p>
          <a class="primary" routerLink="/auth/register">{{ 'auth.confirmRegisterAgain' | transloco }}</a>
        }
      }
    </div>
  </div>
  `,
  styles: [`
    :host{display:block}
    .cf-page{min-height:100vh;display:grid;place-items:center;background:
      radial-gradient(600px 400px at 20% 10%,color-mix(in srgb,#6366F1 14%,transparent),transparent 70%),
      radial-gradient(600px 400px at 85% 90%,color-mix(in srgb,#10B981 10%,transparent),transparent 70%),var(--cf-bg);
      font-family:var(--cf-font);padding:24px}
    .card{width:100%;max-width:400px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:20px;
      box-shadow:0 30px 70px -30px rgba(15,23,42,.4);padding:38px 32px;text-align:center;
      display:flex;flex-direction:column;align-items:center;animation:in .25s cubic-bezier(.2,.8,.3,1)}
    @keyframes in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
    .orb{width:74px;height:74px;display:grid;place-items:center;border-radius:50%;margin-bottom:18px;
      background:linear-gradient(135deg,#6366F1,#7C3AED);color:#fff;box-shadow:0 18px 40px -14px rgba(99,102,241,.75)}
    .orb .material-icons{font-size:32px}
    .orb.pay{background:linear-gradient(135deg,#10B981,#0EA5E9)}
    .orb.err{background:linear-gradient(135deg,#f43f5e,#dc2626);box-shadow:0 18px 40px -14px rgba(244,63,94,.6)}
    h1{font-size:21px;color:var(--cf-ink-900);letter-spacing:-.02em;font-weight:700}
    p{color:var(--cf-ink-500);font-size:13.5px;line-height:1.6;margin:8px 0 0;max-width:34ch}
    .bar{width:180px;height:5px;border-radius:99px;background:var(--cf-line);overflow:hidden;margin-top:22px}
    .bar i{display:block;height:100%;width:40%;border-radius:99px;background:linear-gradient(90deg,#6366F1,#0EA5E9);animation:slide 1.1s ease-in-out infinite}
    @keyframes slide{0%{transform:translateX(-120%)}100%{transform:translateX(420%)}}
    .primary{display:inline-block;margin-top:22px;padding:12px 26px;border-radius:12px;font-size:13.5px;font-weight:700;color:#fff;text-decoration:none;
      background:linear-gradient(135deg,#6366F1,#4338CA);box-shadow:0 12px 26px -12px rgba(79,70,229,.7)}
    @media(prefers-reduced-motion:reduce){*{animation-duration:.01ms !important}}
  `],
})
export class ConfirmPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private billing = inject(BillingService);
  private plans = inject(PlanService);

  state = signal<'verifying' | 'paying' | 'error'>('verifying');
  message = signal('');
  planName = signal('');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) { this.state.set('error'); return; }
    this.auth.confirmEmail(token).subscribe({
      next: (res) => {
        if (res?.success && res.data && this.auth.isTokenValid(res.data)) {
          this.auth.accessToken = res.data;
          this.afterSignIn();
        } else {
          this.message.set(res?.message || '');
          this.state.set('error');
        }
      },
      error: () => this.state.set('error'),
    });
  }

  /** Verified + signed in — pay first when a paid plan was chosen at signup. */
  private afterSignIn(): void {
    const pending = this.billing.pendingPlan();
    const tier = pending ? this.plans.tier(pending.code) : null;
    if (pending && tier && tier.monthly > 0) {
      this.planName.set(tier.name);
      this.state.set('paying');
      this.billing.checkout(pending.code, pending.interval).subscribe({
        next: (res) => {
          if (res?.success && res.data?.url) {
            window.location.href = res.data.url; // hosted Stripe Checkout
          } else {
            // Payment can be retried from the pricing page — never block entry.
            this.router.navigateByUrl('/app/dashboard');
          }
        },
        error: () => this.router.navigateByUrl('/app/dashboard'),
      });
    } else {
      if (pending) { this.plans.setPlan(pending.code); this.billing.clearPendingPlan(); }
      this.router.navigateByUrl('/app/dashboard');
    }
  }
}
