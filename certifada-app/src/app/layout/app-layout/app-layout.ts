import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HasActionDirective } from '../../shared/directives/has-action.directive';
import { TourService } from '../../core/services/tour.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SignaturePadComponent } from '../../shared/components/signature/signature-pad';
import { TranslocoModule } from '@ngneat/transloco';
import { Actions } from '../../core/constants/actions';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { ThemeService } from '../../core/services/theme.service';
import { LanguageService } from '../../core/services/language.service';
import { LayoutService } from '../../core/services/layout.service';
import { BrandService } from '../../core/services/brand.service';
import { ApprovalService } from '../../core/services/approval.service';
import { MessageService } from '../../core/services/message.service';
import { UpgradeDialogComponent } from '../../shared/components/upgrade-dialog/upgrade-dialog';

interface NavItem { label: string; icon: string; link: string; action: string; }
interface NotifItem { id: number; icon: string; tone: 'brand' | 'success' | 'warn' | 'info'; title: string; body: string; time: string; read: boolean; }

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, HasActionDirective, SignaturePadComponent, TranslocoModule, UpgradeDialogComponent],
  template: `
  <div class="shell" [class.collapsed]="collapsed() && !navTop()" [class.postop]="navTop()">

    @if (navTop()) {
      <!-- ===================== TOP-DOCKED NAV (single bar) ===================== -->
      <header class="topbar">
        <ng-container [ngTemplateOutlet]="brandTpl"></ng-container>
        <nav class="nav nav-h"><ng-container [ngTemplateOutlet]="navTpl"></ng-container></nav>
        <button class="new" routerLink="/canvas" [title]="'nav.newTemplate' | transloco"
                [appHasAction]="A.Template_Edit" [tooltipMessage]="'🔒 Upgrade your plan to create templates.'">
          <span class="new-ic" aria-hidden="true">
            <svg class="cert" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect class="c-page" x="4.5" y="3" width="15" height="18" rx="2.4"></rect>
              <line class="c-l1" x1="7.5" y1="8" x2="16.5" y2="8"></line>
              <line class="c-l2" x1="7.5" y1="11" x2="14" y2="11"></line>
              <line class="c-l3" x1="7.5" y1="14" x2="15" y2="14"></line>
              <circle class="c-seal" cx="15.3" cy="16.8" r="3.1"></circle>
              <circle class="c-star" cx="15.3" cy="16.8" r="1.15"></circle>
              <circle class="c-ring" cx="15.3" cy="16.8" r="3.1" fill="none"></circle>
              <path class="c-spark s1" d="M5 1.2 L5.58 2.42 L6.8 3 L5.58 3.58 L5 4.8 L4.42 3.58 L3.2 3 L4.42 2.42 Z"></path>
              <path class="c-spark s2" d="M20.5 2.4 L21.17 3.83 L22.6 4.5 L21.17 5.17 L20.5 6.6 L19.83 5.17 L18.4 4.5 L19.83 3.83 Z"></path>
              <path class="c-spark s3" d="M21 17 L21.48 18.02 L22.5 18.5 L21.48 18.98 L21 20 L20.52 18.98 L19.5 18.5 L20.52 18.02 Z"></path>
            </svg>
          </span>
          <span class="lbl">{{ 'nav.newTemplate' | transloco }}</span>
          <span class="new-tw material-icons" aria-hidden="true">auto_awesome</span>
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
          <span class="new-ic" aria-hidden="true">
            <svg class="cert" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect class="c-page" x="4.5" y="3" width="15" height="18" rx="2.4"></rect>
              <line class="c-l1" x1="7.5" y1="8" x2="16.5" y2="8"></line>
              <line class="c-l2" x1="7.5" y1="11" x2="14" y2="11"></line>
              <line class="c-l3" x1="7.5" y1="14" x2="15" y2="14"></line>
              <circle class="c-seal" cx="15.3" cy="16.8" r="3.1"></circle>
              <circle class="c-star" cx="15.3" cy="16.8" r="1.15"></circle>
              <circle class="c-ring" cx="15.3" cy="16.8" r="3.1" fill="none"></circle>
              <path class="c-spark s1" d="M5 1.2 L5.58 2.42 L6.8 3 L5.58 3.58 L5 4.8 L4.42 3.58 L3.2 3 L4.42 2.42 Z"></path>
              <path class="c-spark s2" d="M20.5 2.4 L21.17 3.83 L22.6 4.5 L21.17 5.17 L20.5 6.6 L19.83 5.17 L18.4 4.5 L19.83 3.83 Z"></path>
              <path class="c-spark s3" d="M21 17 L21.48 18.02 L22.5 18.5 L21.48 18.98 L21 20 L20.52 18.98 L19.5 18.5 L20.52 18.02 Z"></path>
            </svg>
          </span>
          <span class="lbl">{{ 'nav.newTemplate' | transloco }}</span>
          <span class="new-tw material-icons" aria-hidden="true">auto_awesome</span>
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
    <a *ngFor="let item of nav" class="navitem" [routerLink]="item.link" routerLinkActive="active" [attr.data-tour]="'nav-' + navKey(item.link)"
       [attr.title]="navTop() ? null : (item.label | transloco)" [attr.data-tip]="item.label | transloco" [attr.aria-label]="item.label | transloco"
       [appHasAction]="item.action" [tooltipMessage]="'🔒 ' + (item.label | transloco) + ' ' + ('shell.locked' | transloco)">
      <span class="material-icons">{{ item.icon }}</span><span class="lbl">{{ item.label | transloco }}</span>
      @if (badgeFor(item) > 0) { <span class="nav-badge" [attr.data-count]="badgeFor(item)">{{ badgeFor(item) }}</span> }
    </a>
    <a class="navitem" routerLink="/app/support" routerLinkActive="active"
       [attr.title]="navTop() ? null : 'Support'" data-tip="Support" aria-label="Support">
      <span class="material-icons">support_agent</span><span class="lbl">Support</span>
    </a>
  </ng-template>

  <ng-template #controlsTpl>
    @if (tour.launcher()) {
      <button type="button" class="ico tour-ico" (click)="tour.launch()" [attr.aria-label]="tourLabel()"><span class="material-icons">explore</span><span class="tour-tip"><span class="material-icons">auto_awesome</span>{{ tourLabel() }}</span></button>
    }
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
    <a class="ico" routerLink="/app/messages" aria-label="Messages" title="Messages" style="position:relative">
      <span class="material-icons">forum</span>
      @if (msgs.unread()) { <span class="nbadge">{{ msgs.unread() }}</span> }
    </a>
    <div class="profile">
      <button class="avatar" (click)="toggleProfile($event)" aria-label="Account">
        @if (prof.avatarUrl(); as av) { <img class="av-img" [src]="av" alt="" /> } @else { {{ prof.initials() }} }
      </button>
      @if (profileOpen()) {
        <div class="menu" (click)="$event.stopPropagation()">
          <div class="m-user">
            <span class="avatar lg">
              @if (prof.avatarUrl(); as av) { <img class="av-img" [src]="av" alt="" /> } @else { {{ prof.initials() }} }
            </span>
            <div class="m-id">
              <div class="m-name">{{ name() }} @if (prof.role()) { <span class="m-role">{{ prof.role() }}</span> }</div>
              <div class="m-email cf-muted">{{ prof.email() || 'Signed in' }}</div>
            </div>
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
  <app-upgrade-dialog />
  `,
  styles: [`
    :host{display:block;height:100vh}
    .shell{display:grid;grid-template-columns:248px 1fr;height:100vh;background:var(--cf-bg);color:var(--cf-ink-700);transition:grid-template-columns .2s ease}
    .shell.collapsed{grid-template-columns:72px 1fr}
    .shell.collapsed .name,
    .shell.collapsed .navitem .lbl,
    .shell.collapsed .new .lbl,
    .shell.collapsed .new .new-spark,
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
    .new{position:relative;overflow:hidden;display:flex;align-items:center;gap:7px;height:32px;padding:0 10px;border:0;border-radius:9px;background:linear-gradient(120deg,var(--cf-brand-500),var(--cf-brand-700),var(--cf-brand-500));background-size:220% 220%;animation:newgrad 7s ease-in-out infinite;color:#fff;font:inherit;font-weight:700;font-size:12.5px;letter-spacing:-.01em;cursor:pointer;margin-bottom:8px;box-shadow:0 7px 15px -8px color-mix(in srgb,var(--cf-brand-600) 80%,transparent);transition:transform .16s,box-shadow .2s,filter .16s}
    .new:hover{transform:translateY(-2px);filter:brightness(1.04);box-shadow:0 13px 26px -10px color-mix(in srgb,var(--cf-brand-600) 92%,transparent)}
    .new:active{transform:translateY(0)}
    .new::after{content:"";position:absolute;top:0;inset-inline-start:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.5),transparent);transform:skewX(-18deg);transition:inset-inline-start .6s ease;pointer-events:none}
    .new:hover::after{inset-inline-start:130%}
    @keyframes newgrad{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
    .new-tw{position:absolute;top:3px;inset-inline-end:7px;font-size:12px;color:#f7d774;opacity:.85;pointer-events:none;filter:drop-shadow(0 0 4px rgba(247,215,116,.6));animation:newtw 2.8s ease-in-out infinite}
    .new:hover .new-tw{animation-duration:1.1s}
    @keyframes newtw{0%,100%{opacity:.35;transform:scale(.75) rotate(0deg)}50%{opacity:1;transform:scale(1.2) rotate(18deg)}}
    .shell.collapsed .new .new-tw{display:none}
    .new .new-ic{flex:none;width:18px;height:18px;display:grid;place-items:center}
    .new .cert{width:18px;height:18px;overflow:visible}
    .new .c-page{fill:#ffffff;opacity:.96;transform-box:fill-box;transform-origin:center}
    .new:hover .c-page{animation:cpage .5s ease}
    @keyframes cpage{0%{transform:scale(.92) rotate(-3deg)}55%{transform:scale(1.06)}100%{transform:scale(1) rotate(0deg)}}
    .new .c-l1,.new .c-l2,.new .c-l3{stroke:#6f6ae0;stroke-width:1.6;stroke-linecap:round;transform-box:fill-box;transform-origin:left center}
    .new:hover .c-l1{animation:cwrite .36s ease .04s both}
    .new:hover .c-l2{animation:cwrite .36s ease .14s both}
    .new:hover .c-l3{animation:cwrite .36s ease .24s both}
    @keyframes cwrite{from{transform:scaleX(0)}to{transform:scaleX(1)}}
    .new .c-seal{fill:#e6bd49;transform-box:fill-box;transform-origin:center;animation:cglint 3.8s ease-in-out infinite}
    .new .c-star{fill:#ffffff;transform-box:fill-box;transform-origin:center}
    .new:hover .c-seal{animation:cseal .5s cubic-bezier(.2,1.5,.4,1) .32s both}
    .new:hover .c-star{animation:cseal .5s cubic-bezier(.2,1.5,.4,1) .34s both}
    @keyframes cseal{0%{transform:scale(0) rotate(-30deg)}70%{transform:scale(1.25)}100%{transform:scale(1) rotate(0deg)}}
    .new .c-ring{stroke:#e6bd49;stroke-width:1.3;opacity:0;transform-box:fill-box;transform-origin:center}
    .new:hover .c-ring{animation:cring .5s ease-out .5s}
    @keyframes cring{0%{opacity:.85;transform:scale(.55)}100%{opacity:0;transform:scale(2.5)}}
    .new .c-spark{fill:#f7d774;opacity:0;transform-box:fill-box;transform-origin:center;transition:opacity .2s ease}
    .new:hover .c-spark{animation:cspark .6s ease both}
    .new:hover .s1{animation-delay:.48s}
    .new:hover .s2{animation-delay:.6s}
    .new:hover .s3{animation-delay:.72s}
    @keyframes cspark{0%{opacity:0;transform:scale(0) rotate(-40deg)}45%{opacity:1;transform:scale(1.35) rotate(12deg)}100%{opacity:.92;transform:scale(1) rotate(0deg)}}
    @keyframes cglint{0%,90%,100%{filter:none}95%{filter:brightness(1.6)}}
    .new .lbl{flex:1;text-align:start;position:relative}
    .new .lbl::after{content:"";position:absolute;left:0;bottom:-4px;width:100%;height:1.5px;border-radius:2px;background:linear-gradient(90deg,#f3d57c,rgba(255,255,255,.9));transform:scaleX(0);transform-origin:left;transition:transform .45s cubic-bezier(.2,.85,.25,1) .42s;opacity:.95;pointer-events:none}
    .new:hover .lbl::after{transform:scaleX(1)}
    .shell.collapsed .new{padding:0;gap:0}
    @media(prefers-reduced-motion:reduce){.new .c-seal,.new:hover .c-l1,.new:hover .c-l2,.new:hover .c-l3,.new:hover .c-seal,.new:hover .c-star,.new:hover .c-page,.new:hover .c-ring,.new:hover .c-spark{animation:none}.new,.new-tw{animation:none}.new::after{display:none}.new .lbl::after{display:none}}
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
    .avatar{width:38px;height:38px;border-radius:50%;background:var(--cf-brand-50);color:var(--cf-brand-600);border:1px solid var(--cf-brand-100);display:grid;place-items:center;cursor:pointer;font-weight:600;font-size:13px;overflow:hidden}
    .avatar .av-img{width:100%;height:100%;object-fit:cover;border-radius:50%}
    .m-role{display:inline-block;font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--cf-brand-700);background:var(--cf-brand-50);border:1px solid var(--cf-brand-100);padding:1px 8px;border-radius:999px;margin-inline-start:6px;vertical-align:middle}
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
      .shell.postop .topbar .new .lbl,.shell.postop .topbar .new .new-spark{display:none}
      .shell.postop .topbar .new{padding:0 12px}
      .shell.postop .topbar .lang{padding:0 9px}
      /* too tight for labels — go icon-only and surface the name as a tooltip instead */
      .shell.postop .topbar .navitem .lbl{display:none}
      .shell.postop .topbar .navitem::after{content:attr(data-tip);position:absolute;top:calc(100% + 7px);left:50%;transform:translate(-50%,-4px);background:var(--cf-ink-900);color:#fff;font-size:11px;font-weight:600;white-space:nowrap;padding:5px 8px;border-radius:7px;box-shadow:0 10px 24px -8px rgba(2,6,23,.55);opacity:0;pointer-events:none;transition:opacity .14s,transform .14s;z-index:90}
      .shell.postop .topbar .navitem:hover::after{opacity:1;transform:translate(-50%,0)}
    }

    .nav-badge{margin-inline-start:auto;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-size:11px;font-weight:800;line-height:1;display:inline-grid;place-items:center;flex:none;box-shadow:0 3px 9px -2px rgba(220,38,38,.65)}
    .shell.collapsed .side .nav-badge,.shell.postop .nav-badge{position:absolute;top:5px;inset-inline-end:5px;margin:0;min-width:16px;height:16px;padding:0 3px;font-size:9px}
    @media(max-width:880px){.shell:not(.postop){grid-template-columns:1fr}.shell:not(.postop) .side{display:none}.hello .sub{display:none}}

    /* top-docked nav: compact stacked New button (icon over text) */
    .topbar .new{flex-direction:column;gap:1px;height:auto;min-height:0;padding:4px 12px;margin-bottom:0;border-radius:11px}
    .topbar .new .lbl{font-size:9.5px;font-weight:700;line-height:1.05;letter-spacing:.01em}
    .topbar .new .new-ic,.topbar .new .cert{width:20px;height:20px}
    .topbar .new .new-tw{top:1px;inset-inline-end:3px;font-size:10px}
  `],
})
export class AppLayout {
  auth = inject(AuthService);
  prof = inject(ProfileService);
  theme = inject(ThemeService);
  lang = inject(LanguageService);
  layout = inject(LayoutService);
  brand = inject(BrandService);
  approvals = inject(ApprovalService);
  msgs = inject(MessageService);
  private router = inject(Router);
  readonly A = Actions;
  navKey(link: string): string { return link.split('/').pop() || ''; }
  readonly tour = inject(TourService);
  readonly tourLabel = computed(() => (this.lang.lang() === 'ar' ? 'جولة تعريفية' : 'Take a tour'));
  constructor() {
    // A page registers its tour launcher; clear it whenever we navigate so the header button only shows where a tour exists.
    this.router.events.pipe(takeUntilDestroyed()).subscribe((e) => { if (e instanceof NavigationStart) { this.tour.unregister(); } });
  }

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

  /** Real display name — from the profile API, token as instant fallback. */
  name = computed(() => this.capitalize(this.prof.displayName()));

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
  badgeFor(item: NavItem): number { return /approval/i.test(item.link) ? this.approvals.pendingCount() : 0; }

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
