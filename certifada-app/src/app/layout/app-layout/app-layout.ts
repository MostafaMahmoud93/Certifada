import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HasActionDirective } from '../../shared/directives/has-action.directive';
import { SignaturePadComponent } from '../../shared/components/signature/signature-pad';
import { TranslocoModule } from '@ngneat/transloco';
import { Actions } from '../../core/constants/actions';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { LanguageService } from '../../core/services/language.service';
import { LayoutService } from '../../core/services/layout.service';
import { BrandService } from '../../core/services/brand.service';

interface NavItem { label: string; icon: string; link: string; action: string; }
interface NotifItem { id: number; icon: string; tone: 'brand' | 'success' | 'warn' | 'info'; title: string; body: string; time: string; read: boolean; }

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, HasActionDirective, SignaturePadComponent, TranslocoModule],
  template: `
  <div class="shell" [class.collapsed]="collapsed() && !navTop()" [class.postop]="navTop()">

    @if (navTop()) {
      <!-- ===================== TOP-DOCKED NAV (single bar) ===================== -->
      <header class="topbar">
        <ng-container [ngTemplateOutlet]="brandTpl"></ng-container>
        <nav class="nav nav-h"><ng-container [ngTemplateOutlet]="navTpl"></ng-container></nav>
        <button class="new" routerLink="/canvas" [title]="'nav.newTemplate' | transloco"
                [appHasAction]="A.Template_Edit" [tooltipMessage]="'🔒 Upgrade your plan to create templates.'">
          <span class="material-icons">add</span> <span class="lbl">{{ 'nav.newTemplate' | transloco }}</span>
        </button>
        <ng-container [ngTemplateOutlet]="controlsTpl"></ng-container>
      </header>
      <div class="content"><router-outlet></router-outlet></div>

    } @else {
      <!-- ===================== LEFT SIDEBAR ===================== -->
      <aside class="side">
        <ng-container [ngTemplateOutlet]="brandTpl"></ng-container>
        <button class="new" routerLink="/canvas" [title]="'nav.newTemplate' | transloco"
                [appHasAction]="A.Template_Edit" [tooltipMessage]="'🔒 Upgrade your plan to create templates.'">
          <span class="material-icons">add</span> <span class="lbl">{{ 'nav.newTemplate' | transloco }}</span>
        </button>
        <nav class="nav"><ng-container [ngTemplateOutlet]="navTpl"></ng-container></nav>
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
          <ng-container [ngTemplateOutlet]="controlsTpl"></ng-container>
        </header>
        <div class="content"><router-outlet></router-outlet></div>
      </div>
    }
  </div>

  <!-- ===================== shared pieces ===================== -->
  <ng-template #brandTpl>
    <a class="brand" routerLink="/app/dashboard" title="Certifada">
      <span class="mark"><span class="material-icons">workspace_premium</span></span>
      <span class="name">Certi<b>fada</b></span>
    </a>
    @if (brand.kit().has) {
      <div class="cobrand" [title]="brand.kit().org || brand.kit().domain">
        <span class="co-logo">
          @if (brand.kit().logo) { <img [src]="brand.kit().logo" alt="" /> }
          @else { <span class="material-icons">apartment</span> }
        </span>
        <span class="co-name">{{ brand.kit().org || brand.kit().domain }}</span>
      </div>
    }
  </ng-template>

  <ng-template #navTpl>
    <a *ngFor="let item of nav" class="navitem" [routerLink]="item.link" routerLinkActive="active"
       [attr.title]="navTop() ? null : (item.label | transloco)" [attr.data-tip]="item.label | transloco" [attr.aria-label]="item.label | transloco"
       [appHasAction]="item.action" [tooltipMessage]="'🔒 ' + (item.label | transloco) + ' ' + ('shell.locked' | transloco)">
      <span class="material-icons">{{ item.icon }}</span><span class="lbl">{{ item.label | transloco }}</span>
    </a>
    <a class="navitem" routerLink="/app/support" routerLinkActive="active"
       [attr.title]="navTop() ? null : 'Support'" data-tip="Support" aria-label="Support">
      <span class="material-icons">support_agent</span><span class="lbl">Support</span>
    </a>
  </ng-template>

  <ng-template #controlsTpl>
    <button class="lang" (click)="lang.toggle($event)" [attr.aria-label]="'Switch language'">
      {{ lang.lang() === 'en' ? 'ع' : 'EN' }}<span class="material-icons">language</span>
    </button>
    <button class="ico" (click)="theme.toggle($event)" aria-label="Toggle theme">
      <span class="material-icons">{{ theme.isDark() ? 'light_mode' : 'dark_mode' }}</span>
    </button>
    <div class="notif">
      <button class="ico" [class.on]="notifOpen()" (click)="toggleNotif($event)" aria-label="Notifications">
        <span class="material-icons">notifications</span>
        @if (unread()) { <span class="nbadge">{{ unread() }}</span> }
      </button>
      @if (notifOpen()) {
        <div class="nmenu" (click)="$event.stopPropagation()">
          <div class="nm-head">
            <span class="nm-title">Notifications @if (unread()) { <span class="nm-count">{{ unread() }}</span> }</span>
            <button class="nm-clear" (click)="markAllRead()" [disabled]="!unread()">Mark all read</button>
          </div>
          <div class="nm-list">
            @for (n of notifs(); track n.id) {
              <button class="nm-item" [class.unread]="!n.read" (click)="markRead(n)">
                <span class="nm-ic" [attr.data-tone]="n.tone"><span class="material-icons">{{ n.icon }}</span></span>
                <span class="nm-text"><b>{{ n.title }}</b><small>{{ n.body }}</small><em>{{ n.time }}</em></span>
                @if (!n.read) { <span class="nm-dot"></span> }
              </button>
            } @empty {
              <div class="nm-empty"><span class="material-icons">notifications_off</span><p>You're all caught up</p></div>
            }
          </div>
          <a class="nm-foot" routerLink="/app/credentials" (click)="notifOpen.set(false)">View all activity</a>
        </div>
      }
    </div>
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
          <button class="m-item" (click)="toggleNavPos(); profileOpen.set(false)"><span class="material-icons">{{ navTop() ? 'view_sidebar' : 'view_agenda' }}</span> {{ navTop() ? 'Navigation: side' : 'Navigation: top' }}</button>
          <div class="m-div"></div>
          <button class="m-item danger" (click)="logout()"><span class="material-icons">logout</span> {{ 'common.signOut' | transloco }}</button>
        </div>
      }
    </div>
  </ng-template>

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
    .mark{width:32px;height:32px;border-radius:9px;background:#4f46e5;color:#fff;display:grid;place-items:center}
    .mark .material-icons{font-size:20px}
    .name b{color:#4f46e5}
    /* co-brand: customer logo + org name shown UNDER the Certifada mark */
    .cobrand{display:flex;align-items:center;gap:9px;margin:0 2px 8px;padding:7px 9px;border-radius:10px;background:var(--cf-surface-2);border:1px solid var(--cf-line)}
    .co-logo{width:26px;height:26px;border-radius:7px;display:grid;place-items:center;background:#fff;border:1px solid var(--cf-line);overflow:hidden;flex:none}
    .co-logo img{width:100%;height:100%;object-fit:contain;padding:2px}
    .co-logo .material-icons{font-size:15px;color:var(--cf-brand-600)}
    .co-name{font-size:12.5px;font-weight:700;color:var(--cf-ink-900);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
    .shell.collapsed .co-name{display:none}
    .shell.collapsed .cobrand{justify-content:center;padding:7px 0;margin-inline:0}
    .topbar .cobrand{margin:0 6px 0 0;padding:5px 11px 5px 6px;border-radius:999px;flex:0 0 auto}
    @media(max-width:880px){.topbar .co-name{display:none}}
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

    /* ---- notifications ---- */
    .notif{position:relative}
    .nbadge{position:absolute;top:4px;inset-inline-end:4px;min-width:16px;height:16px;padding:0 4px;border-radius:999px;background:var(--cf-danger);color:#fff;font-size:10px;font-weight:700;line-height:16px;text-align:center;border:2px solid var(--cf-surface)}
    .ico.on{background:var(--cf-surface-2);color:var(--cf-ink-900)}
    .nmenu{position:absolute;inset-inline-end:0;top:46px;width:330px;max-width:90vw;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:14px;box-shadow:var(--cf-shadow-lg);padding:6px;z-index:70;animation:nm-in .16s ease}
    @keyframes nm-in{from{opacity:0;transform:translateY(-6px) scale(.98)}to{opacity:1;transform:none}}
    .nm-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px 10px}
    .nm-title{font-size:14px;font-weight:700;color:var(--cf-ink-900);display:flex;align-items:center;gap:7px}
    .nm-count{font-size:11px;font-weight:700;color:#fff;background:var(--cf-brand-600);border-radius:999px;padding:1px 7px}
    .nm-clear{border:0;background:none;color:var(--cf-brand-600);font:inherit;font-size:12px;font-weight:600;cursor:pointer;padding:4px 7px;border-radius:7px}
    .nm-clear:hover:not(:disabled){background:var(--cf-brand-50)}
    .nm-clear:disabled{color:var(--cf-ink-400);cursor:default}
    .nm-list{display:flex;flex-direction:column;gap:2px;max-height:360px;overflow-y:auto;scrollbar-width:thin}
    .nm-item{display:flex;align-items:flex-start;gap:11px;width:100%;text-align:start;border:0;background:none;cursor:pointer;padding:10px;border-radius:10px;transition:background .14s}
    .nm-item:hover{background:var(--cf-surface-2)}
    .nm-item.unread{background:color-mix(in srgb,var(--cf-brand-500) 7%,transparent)}
    .nm-item.unread:hover{background:color-mix(in srgb,var(--cf-brand-500) 12%,transparent)}
    .nm-ic{flex:0 0 auto;width:36px;height:36px;border-radius:10px;display:grid;place-items:center}
    .nm-ic .material-icons{font-size:19px}
    .nm-ic[data-tone="brand"]{color:var(--cf-brand-600);background:color-mix(in srgb,var(--cf-brand-500) 14%,transparent)}
    .nm-ic[data-tone="success"]{color:#16a34a;background:color-mix(in srgb,#16a34a 15%,transparent)}
    .nm-ic[data-tone="warn"]{color:#d97706;background:color-mix(in srgb,#d97706 16%,transparent)}
    .nm-ic[data-tone="info"]{color:#0284c7;background:color-mix(in srgb,#0ea5e9 15%,transparent)}
    .nm-text{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
    .nm-text b{font-size:13px;font-weight:600;color:var(--cf-ink-900)}
    .nm-text small{font-size:12px;color:var(--cf-ink-500);line-height:1.4}
    .nm-text em{font-size:11px;font-style:normal;color:var(--cf-ink-400);margin-top:2px}
    .nm-dot{flex:0 0 auto;width:8px;height:8px;border-radius:50%;background:var(--cf-brand-600);margin-top:6px}
    .nm-empty{display:flex;flex-direction:column;align-items:center;gap:6px;padding:26px 16px;color:var(--cf-ink-400)}
    .nm-empty .material-icons{font-size:28px}
    .nm-empty p{font-size:13px;margin:0}
    .nm-foot{display:block;text-align:center;padding:10px;margin-top:4px;border-top:1px solid var(--cf-line);color:var(--cf-brand-600);font-size:12.5px;font-weight:600;text-decoration:none}
    .nm-foot:hover{background:var(--cf-surface-2)}

    /* ===================== TOP-DOCKED NAV (frosted-glass bar) ===================== */
    .shell.postop{display:block;position:relative;height:100vh;overflow:hidden;background:var(--cf-bg)}
    .shell.postop .topbar{
      position:absolute;top:0;inset-inline:0;z-index:50;
      display:flex;align-items:center;gap:10px;height:62px;padding:0 18px;
      background:color-mix(in srgb, var(--cf-surface) 58%, transparent);
      -webkit-backdrop-filter:blur(20px) saturate(1.7);
      backdrop-filter:blur(20px) saturate(1.7);
      border-bottom:1px solid color-mix(in srgb, var(--cf-line) 55%, transparent);
      box-shadow:0 10px 30px -20px rgba(15,23,42,.6);
      animation:tb-in .26s ease both;
    }
    @keyframes tb-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
    .shell.postop .content{height:100%;overflow:auto;padding-top:82px}
    .topbar .brand{padding:0;margin-inline-end:10px;flex:0 0 auto}
    .topbar .brand .mark{box-shadow:0 5px 14px -5px color-mix(in srgb, var(--cf-brand-600) 80%, transparent)}
    .nav-h{display:flex;flex-direction:row;flex-wrap:nowrap;gap:4px;flex:1 1 auto;min-width:0;padding:0 2px;overflow:visible}
    .nav-h::-webkit-scrollbar{height:0}
    .topbar .navitem{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:4px 9px;flex:0 0 auto;border-radius:11px;color:var(--cf-ink-600);transition:background .16s,color .16s,box-shadow .16s}
    .topbar .navitem .material-icons{font-size:20px}
    .topbar .navitem .lbl{display:block;font-size:9.5px;font-weight:600;line-height:1;letter-spacing:.01em;white-space:nowrap}  /* small name under the icon */
    .topbar .navitem:hover{background:color-mix(in srgb, var(--cf-surface) 80%, transparent);color:var(--cf-ink-900)}
    .topbar .navitem.active{background:color-mix(in srgb, var(--cf-brand-500) 18%, transparent);color:var(--cf-brand-700);box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--cf-brand-500) 32%, transparent)}
    .topbar .navitem.active .material-icons{color:var(--cf-brand-600)}
    .topbar .new{height:38px;margin:0;flex:0 0 auto;padding:0 15px;border-radius:999px;box-shadow:0 8px 18px -7px color-mix(in srgb, var(--cf-brand-600) 80%, transparent)}
    .topbar .ico{background:transparent}
    .topbar .ico:hover{background:color-mix(in srgb, var(--cf-surface) 74%, transparent)}
    .topbar .lang{background:color-mix(in srgb, var(--cf-surface-2) 55%, transparent)}
    /* --- top bar responsive: small label under each icon; drop extras as width tightens --- */
    @media(max-width:1080px){
      .shell.postop .topbar{gap:8px;padding:0 12px}
      .shell.postop .topbar .co-name{display:none}
      .shell.postop .topbar .brand .name{display:none}
    }
    @media(max-width:880px){
      .shell.postop .topbar{gap:6px;padding:0 8px}
      .shell.postop .topbar .new .lbl{display:none}
      .shell.postop .topbar .new{padding:0 12px}
      .shell.postop .topbar .lang{padding:0 9px}
      /* too tight for labels — go icon-only and surface the name as a tooltip instead */
      .shell.postop .topbar .navitem .lbl{display:none}
      .shell.postop .topbar .navitem::after{content:attr(data-tip);position:absolute;top:calc(100% + 7px);left:50%;transform:translate(-50%,-4px);background:var(--cf-ink-900);color:#fff;font-size:11px;font-weight:600;white-space:nowrap;padding:5px 8px;border-radius:7px;box-shadow:0 10px 24px -8px rgba(2,6,23,.55);opacity:0;pointer-events:none;transition:opacity .14s,transform .14s;z-index:90}
      .shell.postop .topbar .navitem:hover::after{opacity:1;transform:translate(-50%,0)}
    }

    @media(max-width:880px){.shell:not(.postop){grid-template-columns:1fr}.shell:not(.postop) .side{display:none}.hello .sub{display:none}}
  `],
})
export class AppLayout {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  lang = inject(LanguageService);
  layout = inject(LayoutService);
  brand = inject(BrandService);
  private router = inject(Router);
  readonly A = Actions;

  collapsed = signal(localStorage.getItem('sidebar-collapsed') === '1');
  navTop = this.layout.navTop;
  profileOpen = signal(false);
  notifOpen = signal(false);
  notifs = signal<NotifItem[]>([
    { id: 1, icon: 'task_alt', tone: 'success', title: 'Batch completed', body: '120 certificates generated and ready to download.', time: '2m ago', read: false },
    { id: 2, icon: 'fact_check', tone: 'warn', title: 'Approvals waiting', body: '3 credentials are awaiting your review.', time: '1h ago', read: false },
    { id: 3, icon: 'dashboard_customize', tone: 'brand', title: 'Template saved', body: '“Course Completion v2” was saved successfully.', time: '3h ago', read: false },
    { id: 4, icon: 'insights', tone: 'info', title: 'Weekly summary ready', body: 'Your activity digest for last week is available.', time: 'Yesterday', read: true },
  ]);
  unread = computed(() => this.notifs().filter((n) => !n.read).length);
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
    this.notifOpen.set(false);
    this.profileOpen.update((v) => !v);
  }

  toggleNotif(e: Event): void {
    e.stopPropagation();
    this.profileOpen.set(false);
    this.notifOpen.update((v) => !v);
  }

  markAllRead(): void { this.notifs.update((list) => list.map((n) => ({ ...n, read: true }))); }
  markRead(n: NotifItem): void { this.notifs.update((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x))); }

  toggleSidebar(): void {
    const v = !this.collapsed();
    this.collapsed.set(v);
    localStorage.setItem('sidebar-collapsed', v ? '1' : '0');
  }

  toggleNavPos(): void { this.layout.toggleNavTop(); }

  openSignature(): void {
    this.profileOpen.set(false);
    this.signatureOpen.set(true);
  }

  @HostListener('document:click')
  closeMenus(): void {
    if (this.profileOpen()) this.profileOpen.set(false);
    if (this.notifOpen()) this.notifOpen.set(false);
  }

  logout(): void {
    this.auth.signOut();
    this.router.navigateByUrl('/auth/login');
  }

  private capitalize(s: string): string {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }
}
