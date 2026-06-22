import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HasActionDirective } from '../../shared/directives/has-action.directive';
import { SignaturePadComponent } from '../../shared/components/signature/signature-pad';
import { TranslocoModule } from '@ngneat/transloco';
import { Actions } from '../../core/constants/actions';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { LanguageService } from '../../core/services/language.service';

interface NavItem { label: string; icon: string; link: string; action: string; }

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, HasActionDirective, SignaturePadComponent, TranslocoModule],
  template: `
  <div class="shell" [class.collapsed]="collapsed()">
    <aside class="side">
      <a class="brand" routerLink="/app/dashboard">
        <span class="mark"><span class="material-icons">workspace_premium</span></span>
        <span class="name">Certi<b>fada</b></span>
      </a>

      <button class="new" routerLink="/canvas" [title]="'nav.newTemplate' | transloco"
              [appHasAction]="A.Template_Edit" [tooltipMessage]="'🔒 Upgrade your plan to create templates.'">
        <span class="material-icons">add</span> <span class="lbl">{{ 'nav.newTemplate' | transloco }}</span>
      </button>

      <nav class="nav">
        <a *ngFor="let item of nav" class="navitem" [routerLink]="item.link" routerLinkActive="active" [title]="item.label | transloco"
           [appHasAction]="item.action" [tooltipMessage]="'🔒 ' + (item.label | transloco) + ' ' + ('shell.locked' | transloco)">
          <span class="material-icons">{{ item.icon }}</span><span class="lbl">{{ item.label | transloco }}</span>
        </a>
        <a class="navitem" routerLink="/app/support" routerLinkActive="active" title="Support">
          <span class="material-icons">support_agent</span><span class="lbl">Support</span>
        </a>
      </nav>

      <button class="logout" (click)="logout()" [title]="'common.signOut' | transloco"><span class="material-icons">logout</span> <span class="lbl">{{ 'common.signOut' | transloco }}</span></button>
    </aside>

    <div class="main">
      <header class="top">
        <button class="ico menu-toggle" (click)="toggleSidebar()" aria-label="Toggle menu"><span class="material-icons">menu</span></button>
        <div class="hello">
          <span class="hi">{{ 'shell.hello' | transloco }}, {{ name() }} 👋</span>
          <span class="sub cf-muted">{{ 'shell.welcome' | transloco }}</span>
        </div>

        <span class="spacer"></span>

        <button class="lang" (click)="lang.toggle()" [attr.aria-label]="'Switch language'">
          {{ lang.lang() === 'en' ? 'ع' : 'EN' }}<span class="material-icons">language</span>
        </button>

        <button class="ico" (click)="theme.toggle()" aria-label="Toggle theme">
          <span class="material-icons">{{ theme.isDark() ? 'light_mode' : 'dark_mode' }}</span>
        </button>

        <button class="ico" aria-label="Notifications">
          <span class="material-icons">notifications</span><span class="pip"></span>
        </button>

        <div class="profile">
          <button class="avatar" (click)="toggleProfile($event)" aria-label="Account">{{ auth.initials }}</button>
          @if (profileOpen()) {
            <div class="menu" (click)="$event.stopPropagation()">
              <div class="m-user">
                <span class="avatar lg">{{ auth.initials }}</span>
                <div class="m-id"><div class="m-name">{{ name() }}</div><div class="m-email cf-muted">{{ auth.email || 'Signed in' }}</div></div>
              </div>
              <button class="m-item" (click)="openSignature()"><span class="material-icons">draw</span> {{ 'shell.addSignature' | transloco }}</button>
              <a class="m-item" routerLink="/app/settings" (click)="profileOpen.set(false)"><span class="material-icons">person</span> {{ 'shell.profile' | transloco }}</a>
              <div class="m-div"></div>
              <button class="m-item danger" (click)="logout()"><span class="material-icons">logout</span> {{ 'common.signOut' | transloco }}</button>
            </div>
          }
        </div>
      </header>

      <div class="content"><router-outlet></router-outlet></div>
    </div>
  </div>

  <app-signature-pad [open]="signatureOpen()" (closed)="signatureOpen.set(false)"></app-signature-pad>
  `,
  styles: [`
    :host{display:block;height:100vh}
    .shell{display:grid;grid-template-columns:248px 1fr;height:100vh;background:var(--cf-bg);color:var(--cf-ink-700);transition:grid-template-columns .2s ease}
    .shell.collapsed{grid-template-columns:72px 1fr}
    .shell.collapsed .name,
    .shell.collapsed .navitem .lbl,
    .shell.collapsed .new .lbl,
    .shell.collapsed .logout .lbl{display:none}
    .shell.collapsed .brand,
    .shell.collapsed .new,
    .shell.collapsed .logout{justify-content:center}
    .shell.collapsed .navitem{justify-content:center;gap:0;padding:9px 0}
    .menu-toggle{margin-inline-end:2px}
    .side{display:flex;flex-direction:column;gap:6px;padding:14px 12px;background:var(--cf-surface);border-inline-end:1px solid var(--cf-line);overflow-y:auto}
    .brand{display:flex;align-items:center;gap:10px;padding:6px 8px 10px;text-decoration:none;color:var(--cf-ink-900);font-weight:700;font-size:16px}
    .mark{width:32px;height:32px;border-radius:9px;background:var(--cf-brand-600);color:#fff;display:grid;place-items:center}
    .mark .material-icons{font-size:20px}
    .name b{color:var(--cf-brand-600)}
    .new{display:flex;align-items:center;justify-content:center;gap:8px;height:40px;border:0;border-radius:var(--cf-radius-sm);background:var(--cf-brand-600);color:#fff;font:inherit;font-weight:500;font-size:13.5px;cursor:pointer;margin-bottom:8px}
    .new:hover{background:var(--cf-brand-700)}
    .new .material-icons{font-size:19px}
    .nav{display:flex;flex-direction:column;gap:2px}
    .navitem{display:flex;align-items:center;gap:11px;padding:9px 11px;border-radius:var(--cf-radius-sm);color:var(--cf-ink-600);text-decoration:none;font-size:13.5px;font-weight:500}
    .navitem .material-icons{font-size:20px;color:var(--cf-ink-400)}
    .navitem:hover{background:var(--cf-surface-2);color:var(--cf-ink-900)}
    .navitem.active{background:var(--cf-brand-50);color:var(--cf-brand-700)}
    .navitem.active .material-icons{color:var(--cf-brand-600)}
    .logout{margin-top:auto;display:flex;align-items:center;gap:10px;padding:10px 11px;border:0;background:none;color:var(--cf-danger);font:inherit;font-weight:500;font-size:13.5px;cursor:pointer;border-radius:var(--cf-radius-sm)}
    .logout:hover{background:var(--cf-danger-soft)}
    .logout .material-icons{font-size:20px}
    .main{display:flex;flex-direction:column;min-width:0;overflow:hidden}
    .top{display:flex;align-items:center;gap:8px;height:64px;padding:0 20px;background:var(--cf-surface);border-bottom:1px solid var(--cf-line)}
    .hello{display:flex;flex-direction:column;line-height:1.2}
    .hello .hi{font-weight:600;color:var(--cf-ink-900);font-size:15px}
    .hello .sub{font-size:12.5px}
    .spacer{flex:1}
    .lang{display:flex;align-items:center;gap:6px;height:38px;padding:0 12px;border-radius:999px;border:1px solid var(--cf-line);background:var(--cf-surface-2);color:var(--cf-ink-700);font:inherit;font-weight:600;font-size:13px;cursor:pointer}
    .lang:hover{border-color:var(--cf-brand-500);color:var(--cf-brand-600)}
    .lang .material-icons{font-size:18px}
    .ico{position:relative;width:38px;height:38px;border-radius:10px;border:0;background:none;color:var(--cf-ink-500);display:grid;place-items:center;cursor:pointer}
    .ico:hover{background:var(--cf-surface-2);color:var(--cf-ink-900)}
    .ico .pip{position:absolute;top:8px;inset-inline-end:9px;width:8px;height:8px;border-radius:50%;background:var(--cf-danger);border:2px solid var(--cf-surface)}
    .profile{position:relative}
    .avatar{width:38px;height:38px;border-radius:50%;background:var(--cf-brand-50);color:var(--cf-brand-600);border:1px solid var(--cf-brand-100);display:grid;place-items:center;cursor:pointer;font-weight:600;font-size:13px}
    .avatar.lg{width:42px;height:42px;font-size:15px}
    .menu{position:absolute;inset-inline-end:0;top:46px;width:248px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:var(--cf-radius-md);box-shadow:var(--cf-shadow-lg);padding:8px;z-index:70}
    .m-user{display:flex;align-items:center;gap:10px;padding:8px 8px 12px}
    .m-id{min-width:0}
    .m-name{font-weight:600;color:var(--cf-ink-900);font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .m-email{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .m-item{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border:0;background:none;color:var(--cf-ink-700);font:inherit;font-size:13.5px;text-align:start;text-decoration:none;border-radius:var(--cf-radius-sm);cursor:pointer}
    .m-item:hover{background:var(--cf-surface-2);color:var(--cf-ink-900)}
    .m-item .material-icons{font-size:19px;color:var(--cf-ink-400)}
    .m-item.danger{color:var(--cf-danger)} .m-item.danger:hover{background:var(--cf-danger-soft)}
    .m-item.danger .material-icons{color:var(--cf-danger)}
    .m-div{height:1px;background:var(--cf-line);margin:6px 4px}
    .content{flex:1;min-height:0;overflow:auto;padding:20px 22px}
    @media(max-width:880px){.shell{grid-template-columns:1fr}.side{display:none}.hello .sub{display:none}}
  `],
})
export class AppLayout {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  lang = inject(LanguageService);
  private router = inject(Router);
  readonly A = Actions;

  collapsed = signal(localStorage.getItem('sidebar-collapsed') === '1');
  profileOpen = signal(false);
  signatureOpen = signal(false);

  name = signal(this.capitalize(this.auth.userName));

  nav: NavItem[] = [
    { label: 'nav.dashboard', icon: 'dashboard', link: '/app/dashboard', action: Actions.Dashboard_View },
    { label: 'nav.templates', icon: 'dashboard_customize', link: '/app/templates', action: Actions.Template_View },
    { label: 'nav.credentials', icon: 'workspace_premium', link: '/app/credentials', action: Actions.Credential_View },
    { label: 'nav.approvals', icon: 'fact_check', link: '/app/approvals', action: Actions.Credential_Approve },
    { label: 'nav.branding', icon: 'palette', link: '/app/branding', action: Actions.Branding_Manage },
    { label: 'nav.users', icon: 'group', link: '/app/users', action: Actions.User_View },
    { label: 'nav.roles', icon: 'admin_panel_settings', link: '/app/roles', action: Actions.Role_Manage },
    { label: 'nav.automation', icon: 'bolt', link: '/app/automation', action: Actions.Automation_View },
    { label: 'nav.settings', icon: 'settings', link: '/app/settings', action: Actions.Settings_Manage },
  ];

  toggleProfile(e: Event): void {
    e.stopPropagation();
    this.profileOpen.update((v) => !v);
  }

  toggleSidebar(): void {
    const v = !this.collapsed();
    this.collapsed.set(v);
    localStorage.setItem('sidebar-collapsed', v ? '1' : '0');
  }

  openSignature(): void {
    this.profileOpen.set(false);
    this.signatureOpen.set(true);
  }

  @HostListener('document:click')
  closeMenus(): void {
    if (this.profileOpen()) this.profileOpen.set(false);
  }

  logout(): void {
    this.auth.signOut();
    this.router.navigateByUrl('/auth/login');
  }

  private capitalize(s: string): string {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }
}
