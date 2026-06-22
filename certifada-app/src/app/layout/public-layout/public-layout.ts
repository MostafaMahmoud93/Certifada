import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
  <header class="pub-top">
    <a class="brand" routerLink="/">
      <span class="mark"><span class="material-icons">workspace_premium</span></span>
      <span>Certifada</span>
    </a>
    <nav class="links">
      <a routerLink="/" fragment="features">Features</a>
      <a routerLink="/" fragment="pricing">Pricing</a>
      <a routerLink="/" fragment="about">Who we are</a>
      <a routerLink="/" fragment="contact">Contact</a>
    </nav>
    <a class="login" routerLink="/auth/login">Log in</a>
  </header>

  <main class="pub-main"><router-outlet></router-outlet></main>

  <footer class="pub-foot">
    <span>© {{ year }} Certifada</span>
    <span class="muted">Design, generate &amp; verify certificates.</span>
  </footer>
  `,
  styles: [`
    :host{display:flex;flex-direction:column;min-height:100vh;background:var(--cf-bg)}
    .pub-top{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:18px;height:64px;padding:0 28px;background:color-mix(in srgb,var(--cf-surface) 88%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--cf-line)}
    .brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--cf-ink-900);font-weight:700;font-size:17px}
    .mark{width:32px;height:32px;border-radius:9px;background:var(--cf-brand-600);color:#fff;display:grid;place-items:center}
    .mark .material-icons{font-size:20px}
    .links{display:flex;gap:20px;margin-inline-start:18px}
    .links a{color:var(--cf-ink-600);text-decoration:none;font-size:14px;font-weight:500}
    .links a:hover{color:var(--cf-brand-600)}
    .login{margin-inline-start:auto;background:var(--cf-brand-600);color:#fff;text-decoration:none;font-weight:500;font-size:14px;padding:10px 18px;border-radius:var(--cf-radius-sm)}
    .login:hover{background:var(--cf-brand-700)}
    .pub-main{flex:1}
    .pub-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px 28px;border-top:1px solid var(--cf-line);color:var(--cf-ink-600);font-size:13px}
    .pub-foot .muted{color:var(--cf-ink-400)}
    @media(max-width:720px){.links{display:none}}
  `],
})
export class PublicLayout {
  year = new Date().getFullYear();
}
