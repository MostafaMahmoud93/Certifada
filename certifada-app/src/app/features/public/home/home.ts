import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, TranslocoModule],
  template: `
  <!-- hero -->
  <section class="hero">
    <div class="hero-in">
      <span class="kicker">{{ 'home.kicker' | transloco }}</span>
      <h1>{{ 'home.heroTitle' | transloco }}</h1>
      <p>{{ 'home.heroSub' | transloco }}</p>
      <div class="cta">
        <a class="btn primary" routerLink="/auth/login">{{ 'home.getStarted' | transloco }}</a>
        <a class="btn ghost" routerLink="/" fragment="pricing">{{ 'home.seePricing' | transloco }}</a>
      </div>
    </div>
  </section>

  <!-- features -->
  <section id="features" class="sec">
    <h2>{{ 'home.featuresTitle' | transloco }}</h2>
    <div class="grid">
      <div class="card"><span class="material-icons">design_services</span><h3>{{ 'home.f1Title' | transloco }}</h3><p>{{ 'home.f1Body' | transloco }}</p></div>
      <div class="card"><span class="material-icons">data_object</span><h3>{{ 'home.f2Title' | transloco }}</h3><p>{{ 'home.f2Pre' | transloco }} <code>{{ '{{' }}field{{ '}}' }}</code> {{ 'home.f2Post' | transloco }}</p></div>
      <div class="card"><span class="material-icons">bolt</span><h3>{{ 'home.f3Title' | transloco }}</h3><p>{{ 'home.f3Body' | transloco }}</p></div>
      <div class="card"><span class="material-icons">verified</span><h3>{{ 'home.f4Title' | transloco }}</h3><p>{{ 'home.f4Body' | transloco }}</p></div>
    </div>
  </section>

  <!-- pricing -->
  <section id="pricing" class="sec alt">
    <h2>{{ 'home.pricingTitle' | transloco }}</h2>
    <p class="lead">{{ 'home.pricingLead' | transloco }}</p>
    <div class="grid plans">
      <div class="plan"><h3>{{ 'home.starter' | transloco }}</h3><div class="price">{{ 'home.free' | transloco }}</div><ul><li>{{ 'home.starterF1' | transloco }}</li><li>{{ 'home.starterF2' | transloco }}</li><li>{{ 'home.starterF3' | transloco }}</li></ul><a class="btn ghost" routerLink="/auth/login">{{ 'home.startFree' | transloco }}</a></div>
      <div class="plan feat"><span class="badge">{{ 'home.mostPopular' | transloco }}</span><h3>{{ 'home.pro' | transloco }}</h3><div class="price">$29<small>{{ 'home.perMo' | transloco }}</small></div><ul><li>{{ 'home.proF1' | transloco }}</li><li>{{ 'home.proF2' | transloco }}</li><li>{{ 'home.proF3' | transloco }}</li></ul><a class="btn primary" routerLink="/auth/login">{{ 'home.choosePro' | transloco }}</a></div>
      <div class="plan"><h3>{{ 'home.enterprise' | transloco }}</h3><div class="price">{{ 'home.custom' | transloco }}</div><ul><li>{{ 'home.entF1' | transloco }}</li><li>{{ 'home.entF2' | transloco }}</li><li>{{ 'home.entF3' | transloco }}</li></ul><a class="btn ghost" routerLink="/" fragment="contact">{{ 'home.contactUs' | transloco }}</a></div>
    </div>
  </section>

  <!-- about -->
  <section id="about" class="sec">
    <h2>{{ 'home.aboutTitle' | transloco }}</h2>
    <p class="lead">{{ 'home.aboutLead' | transloco }}</p>
  </section>

  <!-- contact -->
  <section id="contact" class="sec alt">
    <h2>{{ 'home.contactTitle' | transloco }}</h2>
    <p class="lead">{{ 'home.contactLead' | transloco }}</p>
    <a class="btn primary" href="mailto:hello@certifada.com">hello&#64;certifada.com</a>
  </section>
  `,
  styles: [`
    :host{display:block;color:var(--cf-ink-700)}
    .btn{display:inline-flex;align-items:center;justify-content:center;font-weight:500;font-size:14px;padding:12px 22px;border-radius:var(--cf-radius-sm);text-decoration:none;border:1px solid transparent}
    .btn.primary{background:var(--cf-brand-600);color:#fff} .btn.primary:hover{background:var(--cf-brand-700)}
    .btn.ghost{background:var(--cf-surface);color:var(--cf-ink-900);border-color:var(--cf-line)} .btn.ghost:hover{background:var(--cf-surface-2)}
    .hero{padding:90px 28px;background:var(--cf-brand-700);color:#fff;text-align:center;position:relative;overflow:hidden}
    .hero::before{content:"";position:absolute;inset:0;opacity:.5;background:radial-gradient(600px 300px at 80% 0,rgba(255,255,255,.16),transparent 60%),radial-gradient(500px 400px at 0 100%,rgba(217,164,65,.28),transparent 60%)}
    .hero-in{position:relative;max-width:780px;margin:0 auto}
    .kicker{display:inline-block;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;background:rgba(255,255,255,.14);padding:5px 12px;border-radius:999px}
    .hero h1{color:#fff;font-size:42px;line-height:1.12;margin:18px 0 0;letter-spacing:-.02em}
    .hero p{color:rgba(255,255,255,.85);font-size:18px;margin-top:16px}
    .cta{display:flex;gap:12px;justify-content:center;margin-top:28px;flex-wrap:wrap}
    .sec{max-width:1080px;margin:0 auto;padding:72px 28px;text-align:center}
    .sec.alt{background:var(--cf-surface)}
    .sec h2{font-size:28px;letter-spacing:-.02em}
    .lead{color:var(--cf-ink-500);max-width:60ch;margin:12px auto 0}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;margin-top:34px;text-align:start}
    .card{background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:var(--cf-radius-lg);padding:22px}
    .card .material-icons{font-size:26px;color:var(--cf-brand-600)}
    .card h3{font-size:16px;margin:12px 0 6px}
    .card p{color:var(--cf-ink-500);font-size:13.5px}
    .card code{background:var(--cf-brand-50);color:var(--cf-brand-600);padding:0 4px;border-radius:4px}
    .plans{grid-template-columns:repeat(auto-fit,minmax(240px,1fr));text-align:center}
    .plan{position:relative;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:var(--cf-radius-lg);padding:26px}
    .plan.feat{border:2px solid var(--cf-brand-500)}
    .plan .badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--cf-brand-600);color:#fff;font-size:11px;font-weight:600;padding:4px 12px;border-radius:999px}
    .plan h3{font-size:16px} .plan .price{font-size:32px;font-weight:700;color:var(--cf-ink-900);margin:8px 0}
    .plan .price small{font-size:14px;color:var(--cf-ink-500);font-weight:500}
    .plan ul{list-style:none;padding:0;margin:14px 0 20px;display:grid;gap:8px;color:var(--cf-ink-600);font-size:13.5px}
    @media(max-width:640px){.hero h1{font-size:32px}}
  `],
})
export class HomePage {}
