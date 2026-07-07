import { Component, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, TranslocoModule],
  template: `
  @if (!authRoute()) {
  <header class="top" [class.scrolled]="scrolled()">
    <div class="bar">
      <a class="brand" routerLink="/">
        <span class="mark"><span class="material-icons">workspace_premium</span></span>
        <span class="bn">Certifada</span>
      </a>
      <nav class="links">
        <a routerLink="/" fragment="features">{{ 'landing.navProduct' | transloco }}</a>
        <a routerLink="/" fragment="how">{{ 'landing.navHow' | transloco }}</a>
        <a routerLink="/" fragment="pricing">{{ 'landing.navPricing' | transloco }}</a>
        <a routerLink="/" fragment="faq">{{ 'landing.navFaq' | transloco }}</a>
      </nav>
      <div class="acts">
        <button class="lang" (click)="lang.toggle($event)" [attr.aria-label]="'Switch language'">
          {{ lang.lang() === 'en' ? 'ع' : 'EN' }}<span class="material-icons">language</span>
        </button>
        <a class="signin" routerLink="/auth/login">{{ 'landing.navSignin' | transloco }}</a>
        <a class="start" routerLink="/auth/register">{{ 'landing.navStart' | transloco }}
          <span class="material-icons">arrow_forward</span></a>
      </div>
    </div>
  </header>
  }

  @if (authRoute()) {
    <button class="lang-float" (click)="lang.toggle($event)" [attr.aria-label]="'Switch language'">
      {{ lang.lang() === 'en' ? 'العربية' : 'English' }}<span class="material-icons">language</span>
    </button>
  }

  <main class="main"><router-outlet></router-outlet></main>

  @if (!authRoute()) {
  <footer class="foot">
    <div class="foot-in">
      <div class="f-brand">
        <a class="brand" routerLink="/">
          <span class="mark"><span class="material-icons">workspace_premium</span></span>
          <span class="bn">Certifada</span>
        </a>
        <p>{{ 'landing.footTag' | transloco }}</p>
      </div>
      <div class="f-col">
        <h4>{{ 'landing.footProduct' | transloco }}</h4>
        <a routerLink="/" fragment="features">{{ 'landing.navProduct' | transloco }}</a>
        <a routerLink="/" fragment="how">{{ 'landing.navHow' | transloco }}</a>
        <a routerLink="/pricing">{{ 'landing.navPricing' | transloco }}</a>
      </div>
      <div class="f-col">
        <h4>{{ 'landing.footCompany' | transloco }}</h4>
        <a routerLink="/" fragment="faq">{{ 'landing.navFaq' | transloco }}</a>
        <a href="mailto:hello@certifada.com">{{ 'landing.footContact' | transloco }}</a>
      </div>
      <div class="f-col">
        <h4>{{ 'landing.footGetStarted' | transloco }}</h4>
        <a routerLink="/auth/login">{{ 'landing.navSignin' | transloco }}</a>
        <a routerLink="/auth/register">{{ 'landing.navStart' | transloco }}</a>
      </div>
    </div>
    <div class="foot-base">
      <span>© {{ year }} Certifada — {{ 'landing.footRights' | transloco }}</span>
      <span class="made">{{ 'landing.footMade' | transloco }}</span>
    </div>
  </footer>
  }
  `,
  styles: [`
  :host{display:flex;flex-direction:column;min-height:100vh;background:var(--cf-bg)}

  /* floating glass nav */
  .top{position:fixed;top:0;left:0;right:0;z-index:50;padding:14px 20px;transition:padding .25s}
  .top.scrolled{padding:8px 16px}
  .bar{max-width:1180px;margin:0 auto;display:flex;align-items:center;gap:26px;height:58px;padding:0 12px 0 18px;border-radius:18px;background:rgba(10,15,30,.55);border:1px solid rgba(255,255,255,.1);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:0 12px 40px -16px rgba(0,0,0,.5);transition:background .25s,box-shadow .25s}
  .top.scrolled .bar{background:rgba(10,15,30,.78);box-shadow:0 16px 48px -18px rgba(0,0,0,.65)}
  .brand{display:flex;align-items:center;gap:10px;text-decoration:none}
  .mark{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#6366F1,#7C3AED);color:#fff;display:grid;place-items:center;box-shadow:0 6px 16px -6px rgba(99,102,241,.7)}
  .mark .material-icons{font-size:20px}
  .bn{font-weight:700;font-size:17px;letter-spacing:-.01em;color:#fff}
  .links{display:flex;gap:4px;margin-inline-start:6px}
  .links a{color:#B9C2DD;text-decoration:none;font-size:13.5px;font-weight:500;padding:8px 13px;border-radius:10px;transition:color .18s,background .18s}
  .links a:hover{color:#fff;background:rgba(255,255,255,.08)}
  .acts{margin-inline-start:auto;display:flex;align-items:center;gap:8px}
  .lang{display:inline-flex;align-items:center;gap:5px;height:38px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#D5DBEF;font:inherit;font-weight:700;font-size:13px;cursor:pointer;transition:.18s}
  .lang:hover{background:rgba(255,255,255,.13);color:#fff}
  .lang .material-icons{font-size:16px}
  .lang-float{position:fixed;top:18px;inset-inline-end:18px;z-index:60;display:inline-flex;align-items:center;gap:6px;height:40px;padding:0 15px;border-radius:999px;border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-700);font:inherit;font-weight:600;font-size:13px;cursor:pointer;box-shadow:var(--cf-shadow-sm);transition:.18s}
  .lang-float:hover{border-color:var(--cf-brand-500);color:var(--cf-brand-600)}
  .lang-float .material-icons{font-size:17px}
  .signin{color:#D5DBEF;text-decoration:none;font-size:13.5px;font-weight:600;padding:9px 14px;border-radius:10px;transition:.18s}
  .signin:hover{color:#fff;background:rgba(255,255,255,.08)}
  .start{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#6366F1,#4338CA);color:#fff;text-decoration:none;font-weight:600;font-size:13.5px;padding:10px 18px;border-radius:12px;box-shadow:0 10px 24px -10px rgba(79,70,229,.7),inset 0 1px 0 rgba(255,255,255,.18);transition:transform .18s,box-shadow .22s}
  .start:hover{transform:translateY(-1px);box-shadow:0 16px 32px -12px rgba(79,70,229,.8),inset 0 1px 0 rgba(255,255,255,.22)}
  .start .material-icons{font-size:16px}
  :host-context([dir=rtl]) .start .material-icons{transform:scaleX(-1)}

  .main{flex:1}

  /* footer */
  .foot{background:#070B17;color:#8A97B8;border-top:1px solid rgba(255,255,255,.06)}
  .foot-in{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:36px;padding:60px 28px 44px}
  .f-brand p{font-size:13.5px;line-height:1.7;margin-top:16px;max-width:34ch;color:#7683A8}
  .f-col h4{color:#DDE3FF;font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;margin-bottom:16px}
  .f-col a{display:block;color:#8A97B8;text-decoration:none;font-size:13.5px;padding:5px 0;transition:color .18s}
  .f-col a:hover{color:#fff}
  .foot-base{max-width:1180px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px 28px;border-top:1px solid rgba(255,255,255,.06);font-size:12.5px;color:#5B688C;flex-wrap:wrap}

  @media(max-width:860px){
    .links{display:none}
    .foot-in{grid-template-columns:1fr 1fr;padding:44px 22px 32px}
  }
  @media(max-width:520px){
    .signin{display:none}
    .foot-in{grid-template-columns:1fr}
  }
  `],
})
export class PublicLayout {
  private router = inject(Router);
  lang = inject(LanguageService);
  year = new Date().getFullYear();
  scrolled = signal(false);
  /** Auth pages bring their own full-screen chrome — hide the marketing nav/footer there. */
  authRoute = signal(this.router.url.startsWith('/auth'));

  constructor() {
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) this.authRoute.set(e.urlAfterRedirects.startsWith('/auth'));
    });
  }

  @HostListener('window:scroll')
  onScroll(): void { this.scrolled.set(window.scrollY > 24); }
}
