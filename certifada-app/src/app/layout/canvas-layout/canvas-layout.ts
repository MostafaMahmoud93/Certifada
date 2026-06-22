import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { LanguageService } from '../../core/services/language.service';

/** Full-bleed shell for the designer + bulk pages, with a slim top bar
 *  (brand / back, language toggle, light-dark toggle). */
@Component({
  selector: 'app-canvas-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
  <div class="canvas-shell">
    <header class="cv-top">
      <a class="brand" routerLink="/app/dashboard" title="Back to dashboard">
        <span class="mark"><span class="material-icons">workspace_premium</span></span>
        <span class="bn">Certifada</span>
      </a>
      <a class="back" routerLink="/app/templates"><span class="material-icons">arrow_back</span> Templates</a>
      <span class="sp"></span>
      <button class="ic" (click)="lang.toggle()" [title]="lang.lang() === 'ar' ? 'English' : 'العربية'">
        {{ lang.lang() === 'ar' ? 'EN' : 'ع' }}
      </button>
      <button class="ic" (click)="theme.toggle()" [title]="theme.isDark() ? 'Light mode' : 'Dark mode'">
        <span class="material-icons">{{ theme.isDark() ? 'light_mode' : 'dark_mode' }}</span>
      </button>
    </header>
    <div class="cv-body"><router-outlet></router-outlet></div>
  </div>
  `,
  styles: [`
    :host{display:block;height:100vh;overflow:hidden}
    .canvas-shell{height:100vh;display:flex;flex-direction:column;overflow:hidden;background:var(--cf-bg);font-family:var(--cf-font)}
    .cv-top{flex:0 0 48px;height:48px;display:flex;align-items:center;gap:12px;padding:0 14px;background:var(--cf-surface);border-bottom:1px solid var(--cf-line)}
    .brand{display:flex;align-items:center;gap:8px;text-decoration:none;color:var(--cf-ink-900)}
    .brand .mark{width:28px;height:28px;border-radius:8px;background:var(--cf-brand-600);color:#fff;display:grid;place-items:center}
    .brand .mark .material-icons{font-size:17px}
    .brand .bn{font-weight:700;font-size:15px}
    .back{display:inline-flex;align-items:center;gap:5px;text-decoration:none;color:var(--cf-ink-500);font-size:13px;padding:5px 10px;border-radius:var(--cf-radius-sm)}
    .back .material-icons{font-size:17px}
    .back:hover{background:var(--cf-surface-2);color:var(--cf-ink-900)}
    .sp{flex:1}
    .ic{min-width:34px;height:34px;padding:0 9px;border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-600);border-radius:var(--cf-radius-sm);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font:inherit;font-weight:600;font-size:13px}
    .ic .material-icons{font-size:18px}
    .ic:hover{background:var(--cf-surface-2);color:var(--cf-ink-900)}
    .cv-body{flex:1;min-height:0;overflow:hidden}
  `],
})
export class CanvasLayout {
  theme = inject(ThemeService);
  lang = inject(LanguageService);
}
