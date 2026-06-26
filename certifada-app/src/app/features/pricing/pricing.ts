import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PlanService, PlanTier } from '../../core/services/plan.service';
import { AlertService } from '../../core/services/alert.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <div class="wrap">
    <header class="ph">
      <a class="brand" routerLink="/app/dashboard"><span class="bk"><span class="material-icons">arrow_back</span></span> <span class="logo"><span class="material-icons">verified</span> Certifada</span></a>
    </header>

    <div class="hero">
      <span class="eyebrow"><span class="material-icons">auto_awesome</span> Choose Your Plan</span>
      <h1>Build &amp; Deliver Certificates</h1>
      <p>Design stunning certificates, automate delivery, and manage your credentials platform — all in one place.</p>
      <div class="toggle">
        <button [class.on]="billing() === 'monthly'" (click)="plan.setBilling('monthly')">Monthly</button>
        <button [class.on]="billing() === 'yearly'" (click)="plan.setBilling('yearly')">Yearly <span class="save">-17%</span></button>
      </div>
    </div>

    <div class="grid">
      @for (t of plan.catalog; track t.id) {
        <div class="plan" [class.popular]="t.popular" [class.current]="isCurrent(t)">
          @if (t.popular) { <span class="pop">Most Popular</span> }
          <h3>{{ t.name }}</h3>
          <div class="price">
            @if (t.monthly === 0) {
              <span class="amt">Free</span><span class="per">14 days</span>
            } @else {
              <span class="amt">\${{ billing() === 'yearly' ? t.yearly : t.monthly }}</span><span class="per">/{{ billing() === 'yearly' ? 'year' : 'month' }}</span>
            }
          </div>
          @if (billing() === 'yearly' && t.monthly > 0) { <span class="saveline">Save \${{ plan.yearlySave(t) }}</span> }
          <p class="blurb">{{ t.blurb }}</p>

          @if (isCurrent(t)) {
            <button class="cta cur" disabled><span class="material-icons">check_circle</span> Current Plan</button>
          } @else if (t.trial) {
            <button class="cta ghost" (click)="choose(t)">Start Free Trial</button>
          } @else {
            <button class="cta" (click)="choose(t)">Subscribe Now</button>
          }

          <div class="incl">What's included</div>
          <ul class="feats">
            @for (f of t.features; track f.label) {
              <li [class.off]="!f.included">
                <span class="fi"><span class="material-icons">{{ f.included ? 'check' : 'remove' }}</span></span>
                <span class="fl">{{ f.label }}@if (f.value) { <b>({{ f.value }})</b> }</span>
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
      radial-gradient(900px 480px at 12% -8%, color-mix(in srgb,var(--cf-brand-500) 12%,transparent), transparent 60%),
      radial-gradient(820px 420px at 100% 0%, color-mix(in srgb,var(--cf-accent-500) 10%,transparent), transparent 55%),
      var(--cf-bg, #f6f7fb)}
    .wrap{max-width:1180px;margin:0 auto;padding:20px 22px 64px}
    .ph{display:flex;align-items:center;justify-content:space-between;padding:6px 0 8px}
    .brand{display:inline-flex;align-items:center;gap:10px;text-decoration:none}
    .bk{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-600)}
    .bk .material-icons{font-size:18px}
    .logo{display:inline-flex;align-items:center;gap:7px;font-size:17px;font-weight:800;color:var(--cf-ink-900)}.logo .material-icons{color:var(--cf-brand-600)}
    .hero{text-align:center;padding:26px 0 30px}
    .eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--cf-brand-700);background:var(--cf-brand-50);border:1px solid var(--cf-brand-100);padding:6px 13px;border-radius:999px}
    .eyebrow .material-icons{font-size:15px}
    .hero h1{font-size:clamp(28px,4.4vw,42px);font-weight:800;letter-spacing:-.03em;color:var(--cf-ink-900);margin:14px 0 8px}
    .hero p{font-size:14.5px;color:var(--cf-ink-500);max-width:620px;margin:0 auto;line-height:1.6}
    .toggle{display:inline-flex;gap:4px;margin-top:22px;padding:5px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:12px;box-shadow:var(--cf-shadow-sm)}
    .toggle button{display:inline-flex;align-items:center;gap:7px;border:0;background:none;font:inherit;font-size:13.5px;font-weight:700;color:var(--cf-ink-500);padding:9px 20px;border-radius:9px;cursor:pointer;transition:.15s}
    .toggle button.on{background:linear-gradient(135deg,var(--cf-brand-500),var(--cf-brand-700));color:#fff;box-shadow:0 8px 18px -10px color-mix(in srgb,var(--cf-brand-600) 80%,transparent)}
    .save{font-size:10.5px;font-weight:800;background:#16a34a;color:#fff;padding:2px 7px;border-radius:999px}
    .toggle button.on .save{background:rgba(255,255,255,.25)}

    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;align-items:start}
    @media(max-width:1080px){.grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:620px){.grid{grid-template-columns:1fr}}
    .plan{position:relative;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:18px;padding:24px 20px;box-shadow:0 1px 2px rgba(15,23,42,.05);transition:transform .16s,box-shadow .16s,border-color .16s;display:flex;flex-direction:column}
    .plan:hover{transform:translateY(-3px);box-shadow:0 24px 48px -26px rgba(2,6,23,.4)}
    .plan.popular{border-color:transparent;box-shadow:0 0 0 2px var(--cf-brand-500),0 26px 52px -24px color-mix(in srgb,var(--cf-brand-600) 70%,transparent)}
    .plan.current{border-color:color-mix(in srgb,#16a34a 50%,var(--cf-line))}
    .pop{position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,var(--cf-brand-500),var(--cf-brand-700));color:#fff;font-size:11px;font-weight:800;padding:4px 14px;border-radius:999px;white-space:nowrap;box-shadow:0 8px 18px -8px color-mix(in srgb,var(--cf-brand-600) 80%,transparent)}
    .plan h3{font-size:17px;font-weight:800;color:var(--cf-ink-900);margin-bottom:10px}
    .price{display:flex;align-items:baseline;gap:5px}
    .amt{font-size:34px;font-weight:800;letter-spacing:-.03em;color:var(--cf-ink-900)}
    .per{font-size:13px;font-weight:600;color:var(--cf-ink-400)}
    .saveline{font-size:11.5px;font-weight:800;color:#15803d;background:#dcfce7;padding:2px 9px;border-radius:999px;align-self:flex-start;margin-top:8px}
    .blurb{font-size:12.5px;color:var(--cf-ink-500);margin:12px 0 16px;line-height:1.5;min-height:34px}
    .cta{display:inline-flex;align-items:center;justify-content:center;gap:7px;width:100%;padding:11px 14px;border-radius:11px;border:1px solid transparent;font:inherit;font-size:13.5px;font-weight:700;cursor:pointer;transition:transform .12s,box-shadow .16s,filter .16s;background:linear-gradient(135deg,var(--cf-brand-500),var(--cf-brand-700));color:#fff;box-shadow:0 10px 22px -12px color-mix(in srgb,var(--cf-brand-600) 85%,transparent)}
    .cta:hover{transform:translateY(-1px);filter:brightness(1.04)}
    .cta.ghost{background:var(--cf-surface);color:var(--cf-brand-700);border-color:var(--cf-brand-200);box-shadow:none}
    .cta.ghost:hover{background:var(--cf-brand-50)}
    .cta.cur{background:#dcfce7;color:#15803d;box-shadow:none;cursor:default}.cta.cur .material-icons{font-size:17px}
    .cta .material-icons{font-size:17px}
    .incl{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--cf-ink-400);margin:18px 0 11px}
    .feats{list-style:none;display:flex;flex-direction:column;gap:9px}
    .feats li{display:flex;align-items:flex-start;gap:9px;font-size:12.5px;color:var(--cf-ink-700)}
    .feats li.off{color:var(--cf-ink-300)}
    .fi{width:18px;height:18px;border-radius:6px;display:grid;place-items:center;flex:none;background:var(--cf-brand-50);color:var(--cf-brand-600);margin-top:1px}
    .feats li.off .fi{background:var(--cf-surface-2);color:var(--cf-ink-300)}
    .fi .material-icons{font-size:13px}
    .fl b{font-weight:700;color:var(--cf-ink-900)}
    .feats li.off .fl b{color:var(--cf-ink-400)}
  `],
})
export class PricingPage {
  plan = inject(PlanService);
  private router = inject(Router);
  private alerts = inject(AlertService);
  billing = computed(() => this.plan.billing());

  isCurrent(t: PlanTier): boolean { return this.plan.plan() === t.id; }
  choose(t: PlanTier): void {
    this.plan.setPlan(t.id);
    this.alerts.success(t.trial ? 'Free trial started — welcome aboard!' : `You're now on the ${t.name} plan.`, { title: 'Subscription updated' });
    this.router.navigate(['/app/dashboard']);
  }
}
