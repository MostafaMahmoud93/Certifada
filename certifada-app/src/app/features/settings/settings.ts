import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { LanguageService } from '../../core/services/language.service';
import { AlertService } from '../../core/services/alert.service';
import { LayoutService } from '../../core/services/layout.service';
import { BrandService } from '../../core/services/brand.service';
import { PlanService } from '../../core/services/plan.service';
import { AuthService } from '../../core/services/auth.service';

interface Settings {
  org: string; website: string; supportEmail: string; timezone: string; dateFormat: string;
  notifyBatch: boolean; notifyWeekly: boolean; notifyApprovals: boolean; sessionTimeout: string; twoFA: boolean;
}
const KEY = 'cf-settings';
const DEFAULT: Settings = {
  org: 'Your Organization', website: '', supportEmail: '', timezone: 'Asia/Dubai', dateFormat: 'MMM d, y',
  notifyBatch: true, notifyWeekly: false, notifyApprovals: true, sessionTimeout: '8 hours', twoFA: false,
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
  <div class="head">
    <div>
      <h1>Settings</h1>
      <p class="cf-muted">Manage your profile, workspace, billing and security.</p>
    </div>
    <button class="cf-btn cf-btn-primary" (click)="save()"><span class="material-icons">save</span> Save changes</button>
  </div>

  <div class="settings-wrap">
    <nav class="snav">
      @for (it of navItems; track it.key) {
        <button [class.on]="section() === it.key" [class.dz]="it.key === 'danger'" (click)="section.set(it.key)">
          <span class="material-icons">{{ it.icon }}</span> {{ it.label }}
        </button>
      }
    </nav>

    <div class="spanel">
      @if (section() === 'profile') {
        <div class="card sect">
          <h3><span class="material-icons">person</span> Your profile</h3>
          <div class="profile-row">
            <label class="avatar-up">
              <input type="file" accept="image/*" hidden (change)="onAvatar($event)" />
              @if (profile.avatar) { <img [src]="profile.avatar" alt="" /> } @else { <span class="av-init">{{ initials(profile.name) }}</span> }
              <span class="av-ov"><span class="material-icons">photo_camera</span></span>
            </label>
            <div class="profile-meta">
              <strong>{{ profile.name || 'You' }}</strong>
              <small class="cf-muted">{{ profile.email || 'Add your email below' }}</small>
              <span class="role-badge"><span class="material-icons">shield_person</span> Admin · {{ plan.current().name }}</span>
            </div>
          </div>
          <div class="two">
            <label class="fld">Full name<input [(ngModel)]="profile.name" (ngModelChange)="dirty.set(true)" /></label>
            <label class="fld">Email<input [(ngModel)]="profile.email" (ngModelChange)="dirty.set(true)" type="email" placeholder="you@company.com" /></label>
          </div>
          <button class="cf-btn cf-btn-secondary sm" (click)="flash('Password reset link sent to your email.')"><span class="material-icons">lock_reset</span> Change password</button>
        </div>
      }

      @if (section() === 'org') {
        <div class="card sect">
          <h3><span class="material-icons">apartment</span> Organization</h3>
          <label class="fld">Name<input [(ngModel)]="s.org" (ngModelChange)="dirty.set(true)" /></label>
          <div class="two">
            <label class="fld">Website<input [(ngModel)]="s.website" (ngModelChange)="dirty.set(true)" placeholder="https://" /></label>
            <label class="fld">Support email<input [(ngModel)]="s.supportEmail" (ngModelChange)="dirty.set(true)" type="email" placeholder="support@company.com" /></label>
          </div>
          <label class="fld">Timezone
            <select [(ngModel)]="s.timezone" (ngModelChange)="dirty.set(true)">@for (t of timezones; track t) { <option [value]="t">{{ t }}</option> }</select>
          </label>
        </div>
      }

      @if (section() === 'appearance') {
        <div class="card sect">
          <h3><span class="material-icons">palette</span> Appearance</h3>
          <span class="lbl">Theme</span>
          <div class="seg">
            <button [class.on]="!theme.isDark()" (click)="setTheme(false)"><span class="material-icons">light_mode</span> Light</button>
            <button [class.on]="theme.isDark()" (click)="setTheme(true)"><span class="material-icons">dark_mode</span> Dark</button>
          </div>
          <span class="lbl">Language</span>
          <div class="seg">
            <button [class.on]="lang.lang() === 'en'" (click)="setLang('en')">English</button>
            <button [class.on]="lang.lang() === 'ar'" (click)="setLang('ar')">العربية</button>
          </div>
          <span class="lbl">Navigation</span>
          <div class="seg">
            <button [class.on]="!layout.navTop()" (click)="layout.setNavTop(false)"><span class="material-icons">view_sidebar</span> Sidebar</button>
            <button [class.on]="layout.navTop()" (click)="layout.setNavTop(true)"><span class="material-icons">view_day</span> Top bar</button>
          </div>
          <label class="fld">Date format
            <select [(ngModel)]="s.dateFormat" (ngModelChange)="dirty.set(true)">
              <option value="MMM d, y">Jun 14, 2026</option>
              <option value="d MMM y">14 Jun 2026</option>
              <option value="dd/MM/yyyy">14/06/2026</option>
              <option value="MM/dd/yyyy">06/14/2026</option>
            </select>
          </label>
        </div>
      }

      @if (section() === 'brand') {
        <div class="card sect brand-card">
          <h3><span class="material-icons">verified</span> Brand &amp; domain</h3>
          <span class="lbl">Your Certifada domain</span>
          @if (domain) {
            <div class="domain-locked">
              <span class="dl-ic"><span class="material-icons">public</span></span>
              <span class="dl-name">{{ domain }}<span class="dl-suf">.certifada.com</span></span>
              <span class="dl-badge"><span class="material-icons">verified</span> Reserved</span>
            </div>
            <p class="hint"><span class="material-icons">lock</span> Your domain is fixed and can’t be changed.</p>
          } @else {
            <div class="claim">
              <div class="claim-lead"><span class="material-icons">public</span><div><strong>Claim your free Certifada address</strong><small class="cf-muted">A branded home for your certificates — pick a name and reserve it.</small></div></div>
              <div class="claim-row" [class.ok]="domainStatus() === 'ok'" [class.no]="domainStatus() === 'taken'">
                <input [(ngModel)]="claimDomain" (input)="domainStatus.set('idle')" (keyup.enter)="checkDomain()" placeholder="your-brand" spellcheck="false" />
                <span class="claim-suf">.certifada.com</span>
                <button type="button" class="claim-check" (click)="checkDomain()">Check</button>
              </div>
              @if (domainStatus() === 'ok') { <p class="claim-msg ok"><span class="material-icons">check_circle</span> {{ cleanClaim() }}.certifada.com is available!</p> }
              @if (domainStatus() === 'taken') { <p class="claim-msg no"><span class="material-icons">cancel</span> That name is taken — try another.</p> }
              <button type="button" class="cf-btn cf-btn-primary claim-go" [disabled]="!cleanClaim() || domainStatus() === 'taken'" (click)="reserveDomain()"><span class="material-icons">verified</span> Reserve domain</button>
            </div>
          }
          <span class="lbl" style="margin-top:16px">Logo</span>
          <div class="logo-up">
            <label class="logo-drop" [class.has]="brand.logo" [class.drag]="logoDrag()"
                   (dragover)="onLogoDragOver($event)" (dragleave)="onLogoDragLeave($event)" (drop)="onLogoDrop($event)">
              <input type="file" accept="image/*" hidden (change)="onBrandLogo($event)" />
              @if (brand.logo) {
                <img [src]="brand.logo" alt="logo" />
                <span class="logo-ov"><span class="material-icons">photo_camera</span> Change</span>
              } @else {
                <span class="logo-ph"><span class="material-icons">cloud_upload</span><b>Upload logo</b><em>click or drop · PNG/SVG</em></span>
              }
            </label>
            @if (brand.logo) { <button type="button" class="lk-rm" (click)="brand.logo=''; dirty.set(true)"><span class="material-icons">delete</span> Remove</button> }
          </div>
          <span class="lbl" style="margin-top:16px">Brand colors</span>
          <div class="swatches">
            @for (c of brand.colors; track $index) {
              <span class="sw" [style.background]="c" [title]="c"><button type="button" (click)="removeColor($index)" aria-label="Remove"><span class="material-icons">close</span></button></span>
            }
            <label class="sw add" title="Pick a custom color"><input type="color" (change)="addColorValue($any($event.target).value)" /><span class="material-icons">add</span></label>
          </div>
          <div class="palette-row">
            @for (pc of palette; track pc) { <button type="button" class="pdot" [class.on]="brand.colors.includes(pc)" [style.background]="pc" (click)="addColorValue(pc)" [title]="pc"></button> }
          </div>
          <span class="lbl" style="margin-top:16px">Fonts</span>
          <div class="font-split">
            <div class="fs-col">
              <span class="sublbl">Heading</span>
              <div class="font-cards">
                @for (f of brandFonts; track f) {
                  <button type="button" class="fcard" [class.on]="brand.fontHeading === f" (click)="brand.fontHeading = f; dirty.set(true)">
                    <span class="fc-spec" [style.fontFamily]="f">Ag</span><span class="fc-name">{{ f }}</span>
                    @if (brand.fontHeading === f) { <span class="fc-tick material-icons">check_circle</span> }
                  </button>
                }
              </div>
            </div>
            <div class="fs-col">
              <span class="sublbl">Body</span>
              <div class="font-cards">
                @for (f of brandFonts; track f) {
                  <button type="button" class="fcard sm" [class.on]="brand.fontBody === f" (click)="brand.fontBody = f; dirty.set(true)">
                    <span class="fc-spec" [style.fontFamily]="f">Ag</span><span class="fc-name">{{ f }}</span>
                    @if (brand.fontBody === f) { <span class="fc-tick material-icons">check_circle</span> }
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      }

      @if (section() === 'billing') {
        <div class="card sect">
          <h3><span class="material-icons">credit_card</span> Billing &amp; plan</h3>
          <div class="plan-banner">
            <div class="pb-l">
              <span class="pb-chip"><span class="material-icons">workspace_premium</span> Current plan</span>
              <span class="pb-name">{{ plan.current().name }}</span>
              <span class="pb-price">{{ plan.priceLabel() }}</span>
            </div>
            <a class="cf-btn cf-btn-primary" routerLink="/pricing"><span class="material-icons">upgrade</span> Change plan</a>
          </div>
          <div class="plan-limits">
            <div class="pl-item"><span class="material-icons">dashboard_customize</span><div><b>{{ limLabel(plan.current().limits.templates) }}</b><small>Templates</small></div></div>
            <div class="pl-item"><span class="material-icons">workspace_premium</span><div><b>{{ limLabel(plan.current().limits.issues) }}</b><small>Credentials / month</small></div></div>
            <div class="pl-item"><span class="material-icons">group</span><div><b>{{ limLabel(plan.current().limits.team) }}</b><small>Team seats</small></div></div>
            <div class="pl-item"><span class="material-icons">cloud</span><div><b>{{ storageLabel() }}</b><small>Storage</small></div></div>
          </div>
          <div class="billrow"><span><span class="material-icons">event</span> Next renewal</span><b>{{ renewalDate() }}</b></div>
          <div class="billrow"><span><span class="material-icons">payments</span> Billing cycle</span><b>Monthly</b></div>
          <div class="billrow"><span><span class="material-icons">receipt_long</span> Invoices</span><button class="linkbtn" (click)="flash('Invoice history is coming soon.')">View history</button></div>
        </div>
      }

      @if (section() === 'notifications') {
        <div class="card sect">
          <h3><span class="material-icons">notifications</span> Notifications</h3>
          <label class="toggle"><span><strong>Batch completed</strong><small class="cf-muted">Email me when a bulk batch finishes.</small></span>
            <span class="switch"><input type="checkbox" [(ngModel)]="s.notifyBatch" (ngModelChange)="dirty.set(true)" /><span class="track"></span></span></label>
          <label class="toggle"><span><strong>Approvals</strong><small class="cf-muted">Notify me about credentials awaiting approval.</small></span>
            <span class="switch"><input type="checkbox" [(ngModel)]="s.notifyApprovals" (ngModelChange)="dirty.set(true)" /><span class="track"></span></span></label>
          <label class="toggle"><span><strong>Weekly summary</strong><small class="cf-muted">A digest of activity every Monday.</small></span>
            <span class="switch"><input type="checkbox" [(ngModel)]="s.notifyWeekly" (ngModelChange)="dirty.set(true)" /><span class="track"></span></span></label>
        </div>
      }

      @if (section() === 'security') {
        <div class="card sect">
          <h3><span class="material-icons">shield</span> Security</h3>
          <label class="fld">Session timeout
            <select [(ngModel)]="s.sessionTimeout" (ngModelChange)="dirty.set(true)">
              <option>1 hour</option><option>8 hours</option><option>24 hours</option><option>30 days</option>
            </select>
          </label>
          <label class="toggle"><span><strong>Two-factor authentication</strong><small class="cf-muted">Require a second step at sign-in.</small></span>
            <span class="switch"><input type="checkbox" [(ngModel)]="s.twoFA" (ngModelChange)="dirty.set(true)" /><span class="track"></span></span></label>
          <button class="cf-btn cf-btn-secondary sm" (click)="flash('API key management is coming soon.')"><span class="material-icons">vpn_key</span> Manage API keys</button>
        </div>
      }

      @if (section() === 'danger') {
        <div class="card sect danger">
          <h3><span class="material-icons">warning</span> Danger zone</h3>
          <div class="dz">
            <div><strong>Delete workspace</strong><p class="cf-muted">Permanently remove this workspace and all its data. This cannot be undone.</p></div>
            <button class="cf-btn dz-btn" (click)="deleteWorkspace()">Delete</button>
          </div>
        </div>
      }

      @if (dirty()) {
        <div class="save-bar">
          <span class="sb-msg"><span class="material-icons">edit_note</span> You have unsaved changes</span>
          <div class="sb-act">
            <button class="cf-btn cf-btn-secondary sm" (click)="discard()">Discard</button>
            <button class="cf-btn cf-btn-primary sm" (click)="save()"><span class="material-icons">save</span> Save changes</button>
          </div>
        </div>
      }
    </div>
  </div>

  @if (msg()) { <div class="toast">{{ msg() }}</div> }
  `,
  styles: [`
    :host{display:block}
    .head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;padding-bottom:18px;border-bottom:1px solid var(--cf-line);margin-bottom:22px}
    .head h1{font-size:25px;font-weight:800;letter-spacing:-.02em;color:var(--cf-ink-900)}
    .head p{font-size:13.5px;margin-top:3px}
    .cf-btn .material-icons{font-size:18px}
    .settings-wrap{display:grid;grid-template-columns:230px 1fr;gap:22px;align-items:start}
    .snav{position:sticky;top:14px;display:flex;flex-direction:column;gap:3px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:14px;padding:8px;box-shadow:0 1px 2px rgba(15,23,42,.04)}
    .snav button{display:flex;align-items:center;gap:11px;width:100%;border:0;background:none;color:var(--cf-ink-600);font:inherit;font-size:13px;font-weight:600;text-align:start;padding:10px 12px;border-radius:10px;cursor:pointer;transition:background .14s,color .14s}
    .snav button .material-icons{font-size:18px;color:var(--cf-ink-400);transition:color .14s}
    .snav button:hover{background:var(--cf-surface-2);color:var(--cf-ink-900)}
    .snav button.on{background:var(--cf-brand-50);color:var(--cf-brand-700)}
    .snav button.on .material-icons{color:var(--cf-brand-600)}
    .snav button.dz.on{background:var(--cf-danger-soft);color:var(--cf-danger)}.snav button.dz.on .material-icons{color:var(--cf-danger)}
    .spanel{display:flex;flex-direction:column;gap:18px;min-width:0;animation:panelIn .22s ease}
    @keyframes panelIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    .sect{padding:22px;border-radius:16px;border:1px solid var(--cf-line);box-shadow:0 1px 2px rgba(15,23,42,.04)}
    .sect h3{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:700;letter-spacing:-.01em;color:var(--cf-ink-900);margin-bottom:18px}
    .sect h3 .material-icons{font-size:18px;width:30px;height:30px;display:grid;place-items:center;border-radius:9px;background:color-mix(in srgb,var(--cf-brand-500) 12%,transparent);color:var(--cf-brand-600)}
    .sect.danger h3{color:var(--cf-danger)}
    .sect.danger h3 .material-icons{background:var(--cf-danger-soft);color:var(--cf-danger)}
    .two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .fld{display:flex;flex-direction:column;gap:5px;font-size:12.5px;font-weight:500;color:var(--cf-ink-600);margin-bottom:14px}
    .fld:last-child{margin-bottom:0}
    .lbl{display:block;font-size:12.5px;font-weight:500;color:var(--cf-ink-600);margin-bottom:7px}
    input,select{height:38px;border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);padding:0 10px;font:inherit;font-size:13.5px;background:var(--cf-surface);color:var(--cf-ink-900);outline:none;width:100%}
    input:focus,select:focus{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .seg{display:flex;gap:6px;margin-bottom:16px}
    .seg button{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;height:40px;border:1px solid var(--cf-line);border-radius:10px;background:var(--cf-surface);color:var(--cf-ink-600);font:inherit;font-size:13px;font-weight:500;cursor:pointer;transition:background .14s,border-color .14s,color .14s}
    .seg button .material-icons{font-size:17px}
    .seg button.on{background:var(--cf-brand-50);border-color:var(--cf-brand-200);color:var(--cf-brand-700);font-weight:600}
    .toggle{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:11px 0;border-bottom:1px solid var(--cf-line)}
    .toggle:last-of-type{border-bottom:0}
    .toggle strong{display:block;font-size:13.5px;color:var(--cf-ink-900)}
    .toggle small{font-size:12px}
    .switch{position:relative;display:inline-block;width:40px;height:22px;flex:none}
    .switch input{position:absolute;opacity:0;width:0;height:0}
    .track{position:absolute;inset:0;border-radius:999px;background:var(--cf-ink-400);transition:.18s;cursor:pointer}
    .track::after{content:'';position:absolute;top:2px;inset-inline-start:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.18s}
    .switch input:checked + .track{background:var(--cf-brand-600)}
    .switch input:checked + .track::after{inset-inline-start:20px}
    .cf-btn.sm{padding:8px 12px;font-size:13px;margin-top:14px}
    .danger{border-color:color-mix(in srgb,var(--cf-danger) 35%,var(--cf-line))}
    .dz{display:flex;align-items:center;justify-content:space-between;gap:16px}
    .dz strong{color:var(--cf-ink-900);font-size:14px}
    .dz p{font-size:12.5px;margin-top:3px;max-width:420px}
    .dz-btn{background:var(--cf-danger);color:#fff;flex:none}
    .dz-btn:hover{filter:brightness(.94)}
    .toast{position:fixed;bottom:22px;inset-inline-end:22px;background:var(--cf-ink-900);color:#fff;padding:11px 16px;border-radius:var(--cf-radius-md);box-shadow:var(--cf-shadow-lg);font-size:13.5px;z-index:80}

    /* profile */
    .profile-row{display:flex;align-items:center;gap:16px;margin-bottom:18px}
    .avatar-up{position:relative;width:72px;height:72px;border-radius:50%;cursor:pointer;overflow:hidden;flex:none;background:linear-gradient(135deg,var(--cf-brand-500),var(--cf-brand-700));display:grid;place-items:center;box-shadow:0 8px 18px -8px color-mix(in srgb,var(--cf-brand-600) 70%,transparent)}
    .avatar-up img{width:100%;height:100%;object-fit:cover}
    .av-init{color:#fff;font-size:24px;font-weight:800}
    .av-ov{position:absolute;inset:0;display:grid;place-items:center;background:rgba(2,6,23,.45);color:#fff;opacity:0;transition:opacity .14s}.av-ov .material-icons{font-size:22px}
    .avatar-up:hover .av-ov{opacity:1}
    .profile-meta{display:flex;flex-direction:column;gap:2px;min-width:0}
    .profile-meta strong{font-size:17px;font-weight:800;color:var(--cf-ink-900)}
    .role-badge{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;color:var(--cf-brand-700);background:var(--cf-brand-50);border:1px solid var(--cf-brand-100);padding:3px 10px;border-radius:999px;margin-top:6px;align-self:flex-start}
    .role-badge .material-icons{font-size:13px}

    /* billing */
    .plan-banner{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;padding:16px 18px;border-radius:14px;background:linear-gradient(135deg,color-mix(in srgb,var(--cf-brand-500) 12%,var(--cf-surface)),var(--cf-surface) 75%);border:1px solid var(--cf-brand-100);margin-bottom:16px}
    .pb-l{display:flex;flex-direction:column;gap:2px;min-width:0}
    .pb-chip{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--cf-brand-700)}.pb-chip .material-icons{font-size:14px}
    .pb-name{font-size:22px;font-weight:800;letter-spacing:-.02em;color:var(--cf-ink-900)}
    .pb-price{font-size:13px;color:var(--cf-ink-500);font-weight:600}
    .plan-limits{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:8px}
    .pl-item{display:flex;align-items:center;gap:11px;padding:11px 13px;border:1px solid var(--cf-line);border-radius:12px}
    .pl-item>.material-icons{font-size:18px;color:var(--cf-brand-600);width:36px;height:36px;display:grid;place-items:center;border-radius:10px;background:var(--cf-brand-50);flex:none}
    .pl-item b{font-size:15px;font-weight:800;color:var(--cf-ink-900);display:block;line-height:1.1}.pl-item small{font-size:11.5px;color:var(--cf-ink-500)}
    .billrow{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-top:1px solid var(--cf-line-soft);font-size:13px;color:var(--cf-ink-700)}
    .billrow span{display:inline-flex;align-items:center;gap:7px}.billrow .material-icons{font-size:16px;color:var(--cf-ink-400)}.billrow b{color:var(--cf-ink-900)}
    .linkbtn{border:0;background:none;color:var(--cf-brand-700);font:inherit;font-size:13px;font-weight:700;cursor:pointer}.linkbtn:hover{text-decoration:underline}

    /* unsaved save bar */
    .save-bar{position:sticky;bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:11px 14px 11px 18px;background:var(--cf-ink-900);color:#fff;border-radius:13px;box-shadow:0 18px 40px -16px rgba(2,6,23,.55);animation:sbIn .2s ease;z-index:30}
    @keyframes sbIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
    .sb-msg{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:600}.sb-msg .material-icons{font-size:18px;color:#fde68a}
    .sb-act{display:flex;gap:8px}
    .save-bar .cf-btn{margin-top:0}
    .save-bar .cf-btn-secondary{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.22);color:#fff}
    .save-bar .cf-btn-secondary:hover{background:rgba(255,255,255,.24)}

    .brand-card .lbl{margin-bottom:7px}
    .domain-locked{display:flex;align-items:center;gap:11px;padding:11px 13px;border-radius:12px;border:1px solid color-mix(in srgb,var(--cf-brand-500) 26%,var(--cf-line));background:linear-gradient(135deg,color-mix(in srgb,var(--cf-brand-500) 12%,var(--cf-surface)),var(--cf-surface))}
    .dl-ic{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;background:var(--cf-brand-600);color:#fff;flex:none}
    .dl-ic .material-icons{font-size:19px}
    .dl-name{font-weight:700;color:var(--cf-ink-900);font-size:14px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .dl-suf{color:var(--cf-ink-500);font-weight:600}
    .dl-badge{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:var(--cf-success);background:var(--cf-success-soft);border-radius:999px;padding:3px 9px;flex:none}
    .dl-badge .material-icons{font-size:14px}
    .hint{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--cf-ink-500);margin-top:8px}
    .hint .material-icons{font-size:15px}
    .logo-up{display:flex;flex-direction:column;align-items:flex-start;gap:8px}
    .logo-drop{position:relative;display:grid;place-items:center;width:100%;min-height:96px;border:1.5px dashed var(--cf-line);border-radius:12px;cursor:pointer;overflow:hidden;transition:border-color .14s,box-shadow .14s,transform .12s;background:linear-gradient(45deg,#eef1f6 25%,transparent 25%) -5px 0/10px 10px,linear-gradient(-45deg,#eef1f6 25%,transparent 25%) -5px 0/10px 10px,linear-gradient(45deg,transparent 75%,#eef1f6 75%) 0 0/10px 10px,linear-gradient(-45deg,transparent 75%,#eef1f6 75%) 0 0/10px 10px,var(--cf-surface)}
    .logo-drop:hover{border-color:var(--cf-brand-400)}
    .logo-drop.drag{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring);transform:scale(1.005)}
    .logo-drop img{max-width:70%;max-height:70px;object-fit:contain;filter:drop-shadow(0 4px 10px rgba(15,23,42,.18))}
    .logo-ph{display:flex;flex-direction:column;align-items:center;gap:3px;color:var(--cf-ink-500);text-align:center}
    .logo-ph .material-icons{font-size:26px;color:var(--cf-brand-500)}
    .logo-ph b{font-size:13px;color:var(--cf-ink-800)}
    .logo-ph em{font-size:11px;font-style:normal;color:var(--cf-ink-400)}
    .logo-ov{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:5px;font-size:12.5px;font-weight:600;color:#fff;background:rgba(15,23,42,.55);opacity:0;transition:opacity .14s}
    .logo-ov .material-icons{font-size:18px}
    .logo-drop.has:hover .logo-ov{opacity:1}
    .lk-rm{display:inline-flex;align-items:center;gap:4px;border:0;background:none;color:var(--cf-danger);font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;padding:0}
    .lk-rm .material-icons{font-size:15px}
    .swatches{display:flex;flex-wrap:wrap;gap:8px}
    .sw{position:relative;width:34px;height:34px;border-radius:9px;border:1px solid rgba(15,23,42,.12)}
    .sw>button{position:absolute;top:-6px;inset-inline-end:-6px;width:18px;height:18px;border-radius:50%;border:0;background:var(--cf-ink-900);color:#fff;display:none;place-items:center;cursor:pointer;padding:0}
    .sw>button .material-icons{font-size:12px}
    .sw:hover>button{display:grid}
    .sw.add{display:grid;place-items:center;border-style:dashed;background:var(--cf-surface-2);color:var(--cf-ink-500);cursor:pointer;overflow:hidden}
    .sw.add input[type=color]{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
    .sw.add .material-icons{font-size:18px;pointer-events:none}
    .palette-row{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}
    .pdot{position:relative;width:20px;height:20px;border-radius:50%;border:1px solid rgba(15,23,42,.12);cursor:pointer;padding:0;transition:transform .1s}
    .pdot:hover{transform:scale(1.16)}
    .pdot.on{box-shadow:0 0 0 2px var(--cf-surface),0 0 0 4px var(--cf-brand-500)}
    .sublbl{display:block;font-size:10px;font-weight:600;color:var(--cf-ink-400);text-transform:uppercase;letter-spacing:.04em;margin:0 0 6px}
    .font-split{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .font-cards{display:flex;flex-wrap:wrap;gap:6px}
    .fcard{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;width:56px;padding:7px 4px 5px;border:1px solid var(--cf-line);border-radius:10px;background:var(--cf-surface);cursor:pointer;transition:transform .12s,border-color .12s,background .12s}
    .fcard:hover{border-color:var(--cf-brand-400)}
    .fcard.on{border-color:var(--cf-brand-500);background:var(--cf-brand-50)}
    .fc-spec{font-size:18px;line-height:1;color:var(--cf-ink-900)}
    .fcard.on .fc-spec{color:var(--cf-brand-700)}
    .fc-name{font-size:9px;color:var(--cf-ink-500);text-align:center;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
    .fc-tick{position:absolute;top:3px;inset-inline-end:3px;font-size:13px;color:var(--cf-brand-600)}
    .fcard.sm{width:52px;padding:6px 4px 5px}
    .fcard.sm .fc-spec{font-size:16px}
    .claim{display:flex;flex-direction:column;gap:11px;padding:14px;border-radius:14px;border:1px dashed color-mix(in srgb,var(--cf-brand-500) 32%,var(--cf-line));background:linear-gradient(135deg,color-mix(in srgb,var(--cf-brand-500) 9%,var(--cf-surface)),var(--cf-surface))}
    .claim-lead{display:flex;align-items:flex-start;gap:11px}
    .claim-lead>.material-icons{font-size:24px;color:var(--cf-brand-600);width:40px;height:40px;display:grid;place-items:center;border-radius:11px;background:color-mix(in srgb,var(--cf-brand-500) 14%,transparent);flex:none}
    .claim-lead strong{display:block;font-size:14px;color:var(--cf-ink-900)}
    .claim-lead small{font-size:12px}
    .claim-row{display:flex;align-items:stretch;border:1px solid var(--cf-line);border-radius:10px;overflow:hidden;background:var(--cf-surface);transition:border-color .14s,box-shadow .14s}
    .claim-row:focus-within{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .claim-row.ok{border-color:#16a34a}
    .claim-row.no{border-color:var(--cf-danger)}
    .claim-row input{flex:1;border:0;height:42px;border-radius:0;text-align:end;font-weight:600}
    .claim-row input:focus{box-shadow:none}
    .claim-suf{display:grid;place-items:center;padding:0 10px;font-size:13px;font-weight:600;color:var(--cf-ink-500);background:var(--cf-surface-2);white-space:nowrap}
    .claim-check{border:0;border-inline-start:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-brand-600);font:inherit;font-size:13px;font-weight:700;padding:0 15px;cursor:pointer;transition:background .14s}
    .claim-check:hover{background:var(--cf-brand-50)}
    .claim-msg{display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;margin:0}
    .claim-msg.ok{color:#16a34a}
    .claim-msg.no{color:var(--cf-danger)}
    .claim-msg .material-icons{font-size:16px}
    .claim-go{align-self:flex-start;display:inline-flex;align-items:center;gap:6px}
    .claim-go .material-icons{font-size:17px}
    .claim-go:disabled{opacity:.5;cursor:not-allowed}
    @media(max-width:880px){.settings-wrap{grid-template-columns:1fr}.snav{position:static;flex-direction:row;flex-wrap:wrap;overflow-x:auto}.snav button{flex:none}.two{grid-template-columns:1fr}.plan-limits{grid-template-columns:1fr}.font-split{grid-template-columns:1fr}}
  `],
})
export class SettingsPage {
  theme = inject(ThemeService);
  lang = inject(LanguageService);
  layout = inject(LayoutService);
  readonly plan = inject(PlanService);
  private auth = inject(AuthService);
  private alerts = inject(AlertService);
  private brandSvc = inject(BrandService);

  msg = signal('');
  dirty = signal(false);
  section = signal<string>('profile');
  navItems = [
    { key: 'profile', label: 'Profile', icon: 'person' },
    { key: 'org', label: 'Organization', icon: 'apartment' },
    { key: 'appearance', label: 'Appearance', icon: 'palette' },
    { key: 'brand', label: 'Brand & domain', icon: 'verified' },
    { key: 'billing', label: 'Billing & plan', icon: 'credit_card' },
    { key: 'notifications', label: 'Notifications', icon: 'notifications' },
    { key: 'security', label: 'Security', icon: 'shield' },
    { key: 'danger', label: 'Danger zone', icon: 'warning' },
  ];

  s: Settings = this.load();
  brandFonts = ['Inter', 'Playfair Display', 'Roboto', 'Montserrat', 'Lora', 'Poppins', 'Cairo', 'Tajawal'];
  palette = ['#4f46e5', '#0f172a', '#b08d2e', '#10b981', '#dc2626', '#0ea5e9', '#7c3aed', '#db2777'];
  brand: { logo: string; primary: string; colors: string[]; fontHeading: string; fontBody: string } = this.loadBrand();
  profile: { name: string; email: string; avatar: string } = this.loadProfile();
  domain = this.loadDomain();
  logoDrag = signal(false);
  timezones = ['Asia/Dubai', 'Asia/Riyadh', 'Africa/Cairo', 'Europe/London', 'America/New_York', 'UTC'];
  claimDomain = '';
  domainStatus = signal<'idle' | 'ok' | 'taken'>('idle');

  private load(): Settings {
    try { const raw = localStorage.getItem(KEY); if (raw) return { ...DEFAULT, ...JSON.parse(raw) }; } catch { /* ignore */ }
    return { ...DEFAULT };
  }
  private loadBrand(): { logo: string; primary: string; colors: string[]; fontHeading: string; fontBody: string } {
    const def = { logo: '', primary: '#4f46e5', colors: ['#4f46e5', '#0f172a', '#b08d2e'], fontHeading: 'Playfair Display', fontBody: 'Inter' };
    try { const r = localStorage.getItem('cf-brand'); if (r) { const o = JSON.parse(r); return { ...def, ...o, colors: Array.isArray(o.colors) && o.colors.length ? o.colors : (o.primary ? [o.primary, '#0f172a'] : def.colors) }; } } catch { /* ignore */ }
    return { ...def, colors: [...def.colors] };
  }
  private loadProfile(): { name: string; email: string; avatar: string } {
    const name = this.auth.userName ? this.cap(this.auth.userName) : 'You';
    try { const r = JSON.parse(localStorage.getItem('cf-profile') || '{}'); return { name: r.name || name, email: r.email || '', avatar: r.avatar || '' }; } catch { return { name, email: '', avatar: '' }; }
  }
  private loadDomain(): string {
    try { const r = localStorage.getItem('cf-onboarding'); if (r) return (((JSON.parse(r) as any).domain as string) || '').trim(); } catch { /* ignore */ }
    return '';
  }
  private cap(s: string): string { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  initials(n: string): string { return (n || 'You').split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase(); }

  // billing helpers
  limLabel(n: number): string { return isFinite(n) ? n.toLocaleString() : 'Unlimited'; }
  storageLabel(): string { const mb = this.plan.storageLimitMB(); return isFinite(mb) ? (mb >= 1024 ? (mb / 1024) + ' GB' : mb + ' MB') : 'Unlimited'; }
  renewalDate(): string { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }

  cleanClaim(): string { return this.claimDomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''); }
  checkDomain(): void {
    const d = this.cleanClaim();
    if (!d) { this.domainStatus.set('idle'); return; }
    const taken = ['certifada', 'app', 'admin', 'test', 'demo', 'www', 'mail', 'api'].includes(d);
    this.domainStatus.set(taken ? 'taken' : 'ok');
  }
  reserveDomain(): void {
    const d = this.cleanClaim();
    if (!d) { this.alerts.warning('Enter a name for your address.'); return; }
    this.checkDomain();
    if (this.domainStatus() === 'taken') { this.alerts.error('That name is taken — try another.'); return; }
    let ob: Record<string, unknown> = {};
    try { ob = JSON.parse(localStorage.getItem('cf-onboarding') || '{}'); } catch { /* ignore */ }
    ob['domain'] = d;
    localStorage.setItem('cf-onboarding', JSON.stringify(ob));
    localStorage.setItem('cf-onboarding-done', '1');
    this.domain = d;
    this.brandSvc.reload();
    this.alerts.success(d + '.certifada.com is reserved for you!', { title: 'Domain reserved 🎉' });
  }
  onBrandLogo(e: Event): void { const input = e.target as HTMLInputElement; this.readBrandLogo(input.files?.[0]); input.value = ''; }
  private readBrandLogo(file: File | undefined): void {
    if (!file || !/^image\//.test(file.type)) return;
    const r = new FileReader(); r.onload = () => { this.brand.logo = String(r.result); this.dirty.set(true); }; r.readAsDataURL(file);
  }
  onLogoDragOver(e: DragEvent): void { e.preventDefault(); this.logoDrag.set(true); }
  onLogoDragLeave(e: DragEvent): void { e.preventDefault(); this.logoDrag.set(false); }
  onLogoDrop(e: DragEvent): void { e.preventDefault(); this.logoDrag.set(false); this.readBrandLogo(e.dataTransfer?.files?.[0]); }
  onAvatar(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f || !/^image\//.test(f.type)) return;
    const r = new FileReader(); r.onload = () => { this.profile.avatar = String(r.result); this.dirty.set(true); }; r.readAsDataURL(f);
  }
  addColorValue(c: string): void {
    const v = (c || '').toLowerCase();
    if (v && !this.brand.colors.includes(v)) { this.brand.colors = [...this.brand.colors, v]; this.brand.primary = this.brand.colors[0]; this.dirty.set(true); }
  }
  removeColor(i: number): void { this.brand.colors = this.brand.colors.filter((_, k) => k !== i); this.brand.primary = this.brand.colors[0] || '#4f46e5'; this.dirty.set(true); }

  setTheme(dark: boolean): void { if (this.theme.isDark() !== dark) this.theme.toggle(); }
  setLang(l: 'en' | 'ar'): void { if (this.lang.lang() !== l) this.lang.toggle(); }

  save(): void {
    localStorage.setItem(KEY, JSON.stringify(this.s));
    localStorage.setItem('cf-profile', JSON.stringify(this.profile));
    let existing: Record<string, unknown> = {};
    try { existing = JSON.parse(localStorage.getItem('cf-brand') || '{}'); } catch { /* ignore */ }
    localStorage.setItem('cf-brand', JSON.stringify({ ...existing, org: this.s.org, logo: this.brand.logo, primary: this.brand.primary, colors: this.brand.colors, fontHeading: this.brand.fontHeading, fontBody: this.brand.fontBody }));
    this.brandSvc.reload();
    this.dirty.set(false);
    this.alerts.success('Settings saved.');
  }
  discard(): void { this.s = this.load(); this.brand = this.loadBrand(); this.profile = this.loadProfile(); this.dirty.set(false); this.alerts.info('Changes discarded.'); }
  async deleteWorkspace(): Promise<void> {
    const ok = await this.alerts.confirm({ title: 'Delete workspace', message: 'Delete this workspace and ALL its data? This cannot be undone.', danger: true, confirmText: 'Delete workspace' });
    if (!ok) return;
    this.alerts.error('Workspace deletion requested (demo).');
  }
  flash(text: string): void { this.alerts.info(text); }
}
