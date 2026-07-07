import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { LanguageService } from '../../core/services/language.service';
import { AlertService } from '../../core/services/alert.service';
import { LayoutService } from '../../core/services/layout.service';
import { BrandService } from '../../core/services/brand.service';
import { PlanService } from '../../core/services/plan.service';
import { AuthService } from '../../core/services/auth.service';
import { BillingService, SubscriptionView, BillingHistoryItem } from '../../core/services/billing.service';
import { IssuedService } from '../../core/services/issued.service';
import { ProfileService } from '../../core/services/profile.service';
import { SignaturePadComponent } from '../../shared/components/signature/signature-pad';

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
  imports: [FormsModule, RouterLink, SignaturePadComponent],
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
        <!-- ═══ Your profile — real account data, brand-themed cover ═══ -->
        <div class="card sect pcard">
          <div class="pcover"><span class="pc-orb o1"></span><span class="pc-orb o2"></span></div>
          <div class="pmain">
            <label class="pavatar" title="Change photo">
              <input type="file" accept="image/*" hidden (change)="onAvatarUpload($event)" />
              @if (prof.avatarUrl(); as av) { <img [src]="av" alt="" /> }
              @else if (profile.avatar) { <img [src]="profile.avatar" alt="" /> }
              @else { <span class="pav-init">{{ prof.initials() }}</span> }
              <span class="pav-ov"><span class="material-icons">photo_camera</span></span>
              @if (avatarBusy()) { <span class="pav-busy"></span> }
            </label>
            <div class="pid">
              <div class="pname-row">
                <strong class="pname">{{ prof.displayName() }}</strong>
                @if (prof.emailVerified()) { <span class="pverf"><span class="material-icons">verified</span> Verified</span> }
                @else { <span class="pverf warn"><span class="material-icons">mark_email_unread</span> Unverified</span> }
              </div>
              <small class="pemail cf-muted">{{ prof.email() }}</small>
              <div class="pchips">
                @if (prof.role()) { <span class="pchip"><span class="material-icons">shield_person</span>{{ prof.role() }}</span> }
                <span class="pchip"><span class="material-icons">workspace_premium</span>{{ plan.current().name }} plan</span>
                @if (prof.tenantName()) { <span class="pchip"><span class="material-icons">apartment</span>{{ prof.tenantName() }}</span> }
                @if (memberSince()) { <span class="pchip"><span class="material-icons">cake</span>Member since {{ memberSince() }}</span> }
              </div>
            </div>
          </div>
          <div class="two pform">
            <label class="fld">Full name<input [ngModel]="nameDraft()" (ngModelChange)="nameDraft.set($event)" placeholder="Your display name" /></label>
            <label class="fld">Email<input [value]="prof.email()" disabled type="email" title="Your sign-in email can't be changed here" /></label>
          </div>
          <div class="pacts">
            <button class="cf-btn cf-btn-primary sm" [disabled]="nameBusy() || !nameDraft().trim() || nameDraft().trim() === prof.displayName()" (click)="saveName()">
              <span class="material-icons">save</span> {{ nameBusy() ? 'Saving…' : 'Save name' }}</button>
            <button class="cf-btn cf-btn-secondary sm" (click)="flash('Password reset link sent to your email.')"><span class="material-icons">lock_reset</span> Change password</button>
          </div>
        </div>

        <div class="card sect">
          <h3><span class="material-icons">draw</span> Your signature</h3>
          <p class="sect-hint">Applied automatically when you sign approvals and issue signed certificates.</p>
          <div class="sig-block">
            <div class="sig-preview" [class.empty]="!sigSrc()">
              @if (sigSrc(); as sg) { <img [src]="sg" alt="Your signature" /> }
              @else { <span class="sig-ph"><span class="material-icons">gesture</span> No signature yet</span> }
            </div>
            <div class="sig-info">
              <strong>{{ sigSrc() ? 'Signature on file' : 'No signature saved' }}</strong>
              <small class="cf-muted">Draw or type your signature — it is used across approvals and signed certificates.</small>
              <div class="sig-acts">
                <button class="cf-btn cf-btn-primary sm" (click)="sigOpen.set(true)"><span class="material-icons">{{ mySig() ? 'edit' : 'draw' }}</span> {{ mySig() ? 'Change signature' : 'Add signature' }}</button>
                @if (mySig()) { <button class="cf-btn cf-btn-secondary sm" (click)="removeSig()"><span class="material-icons">delete</span> Remove</button> }
              </div>
            </div>
          </div>
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
        <!-- ═══ Subscription hero ═══ -->
        <div [class]="'card sect subhero tier-' + plan.plan()">
          <div class="sh-glow g1"></div><div class="sh-glow g2"></div>
          <span class="sh-medal material-icons">workspace_premium</span>
          <div class="sh-top">
            <div class="sh-id">
              <span class="sh-chip"><span class="material-icons">workspace_premium</span> Current plan</span>
              <span class="sh-name">{{ plan.current().name }}
                @if (sub(); as s) { <i [class]="'sh-status ' + statusClass(s.status)">{{ statusLabel(s.status) }}</i> }
              </span>
              <span class="sh-price">@if (plan.current().monthly > 0) { <b>\${{ sub()?.amount || plan.current().monthly }}</b><small>/{{ cycleLabel() === 'Yearly' ? 'year' : 'month' }}</small> } @else { <b>Free</b> }</span>
            </div>
            <div class="sh-act">
              <a class="cf-btn cf-btn-primary" routerLink="/pricing"><span class="material-icons">upgrade</span> Change plan</a>
              <button class="cf-btn sh-portal" (click)="openPortal()"><span class="material-icons">credit_card</span> Manage in Stripe</button>
            </div>
          </div>
          @if (periodPct() !== null) {
            <div class="sh-period">
              <div class="sh-period-main">
                <div class="sh-period-head">
                  <span><span class="material-icons">autorenew</span> Billing period · {{ cycleLabel() }}</span>
                  <b>Renews {{ renewalDate() }}</b>
                </div>
                <div class="sh-bar"><span [style.width.%]="periodPct()"></span></div>
                <small class="sh-hint">Your next charge happens automatically — manage the card in Stripe any time.</small>
              </div>
              <div class="sh-ring" title="Days left in this billing period">
                <svg viewBox="0 0 64 64">
                  <circle class="rg-bg" cx="32" cy="32" r="26"/>
                  <circle class="rg-fg" cx="32" cy="32" r="26" [attr.stroke-dashoffset]="ringOffset()"/>
                </svg>
                <div class="rg-txt"><b>{{ daysLeft() }}</b><small>days left</small></div>
              </div>
            </div>
          }
          <div class="sh-feats">
            @for (f of topFeats(); track f) { <span class="sh-feat"><span class="material-icons">check</span>{{ f }}</span> }
          </div>
        </div>

        @if (sub()?.pendingPlanCode; as pending) {
          <div class="sched-note"><span class="material-icons">schedule</span>
            Your plan changes to <b>{{ pending }}</b> on <b>{{ fmtDate(sub()!.scheduledChangeOn) }}</b> — until then you keep everything in {{ plan.current().name }}.
            <a routerLink="/pricing">Manage</a></div>
        }
        @if (sub()?.status === 'canceling') {
          <div class="sched-note warn"><span class="material-icons">event_busy</span>
            Your subscription ends on <b>{{ fmtDate(sub()!.cancelAt || sub()!.currentPeriodEnd) }}</b>, then you move to the Free plan.
            <a routerLink="/pricing">Keep my plan</a></div>
        }
        @if (sub()?.status === 'trialing' || sub()?.status === 'trial_expired') {
          <div class="sched-note" [class.warn]="sub()?.status === 'trial_expired'"><span class="material-icons">hourglass_bottom</span>
            @if (sub()?.status === 'trialing') { Free trial — ends on <b>{{ fmtDate(sub()!.currentPeriodEnd) }}</b>. }
            @else { Your free trial has ended — pick a plan to keep creating. }
            <a routerLink="/pricing">See plans</a></div>
        }

        <!-- ═══ Usage & quotas ═══ -->
        <div class="card sect">
          <h3><span class="material-icons">data_usage</span> Usage &amp; quotas</h3>
          <div class="meters">
            <div class="meter">
              <div class="m-head"><span class="m-ic cred"><span class="material-icons">workspace_premium</span></span><span class="m-name">Credentials this month</span><b>{{ credentialsUsed().toLocaleString() }} <small>/ {{ limLabel(plan.current().limits.issues) }}</small></b></div>
              <div class="m-bar"><span class="cred" [style.width.%]="credPct()" [class.hot]="credPct() > 85"></span></div>
            </div>
            <div class="meter">
              <div class="m-head"><span class="m-ic sto"><span class="material-icons">cloud</span></span><span class="m-name">Storage</span><b>{{ storageUsedMB() }} MB <small>/ {{ storageLabel() }}</small></b></div>
              <div class="m-bar"><span class="sto" [style.width.%]="storagePct()" [class.hot]="storagePct() > 85"></span></div>
            </div>
          </div>
          <div class="plan-limits">
            <div class="pl-item"><span class="material-icons">dashboard_customize</span><div><b>{{ limLabel(plan.current().limits.templates) }}</b><small>Templates</small></div></div>
            <div class="pl-item"><span class="material-icons">group</span><div><b>{{ limLabel(plan.current().limits.team) }}</b><small>Team seats</small></div></div>
            <div class="pl-item"><span class="material-icons">payments</span><div><b>{{ cycleLabel() }}</b><small>Billing cycle</small></div></div>
            <div class="pl-item"><span class="material-icons">event</span><div><b>{{ renewalDate() }}</b><small>Next renewal</small></div></div>
          </div>
        </div>

        <!-- ═══ Payment history ═══ -->
        <div class="card sect">
          <div class="ph-head">
            <h3><span class="material-icons">receipt_long</span> Payment history</h3>
            @if (history().length) {
              <button class="cf-btn ph-export" (click)="exportHistory()"><span class="material-icons">download</span> CSV</button>
            }
          </div>

          @if (history().length) {
            <div class="ph-stats">
              <div class="ps"><span class="ps-ic total"><span class="material-icons">account_balance_wallet</span></span><div><b>\${{ totalSpent() }}</b><small>Total spent</small></div></div>
              <div class="ps"><span class="ps-ic count"><span class="material-icons">receipt</span></span><div><b>{{ paymentsCount() }}</b><small>Payments</small></div></div>
              <div class="ps"><span class="ps-ic last"><span class="material-icons">history</span></span><div><b>{{ lastPaymentDate() }}</b><small>Last payment</small></div></div>
              <div class="ps"><span class="ps-ic next"><span class="material-icons">event</span></span><div><b>{{ nextCharge() }}</b><small>Next charge</small></div></div>
            </div>
            <div class="ph-filters">
              <button [class.on]="histFilter() === 'all'" (click)="histFilter.set('all')">All</button>
              <button [class.on]="histFilter() === 'pay'" (click)="histFilter.set('pay')">Payments</button>
              <button [class.on]="histFilter() === 'plan'" (click)="histFilter.set('plan')">Plan changes</button>
            </div>
          }

          @if (histLoading()) {
            <div class="tl">
              @for (i of [1, 2, 3]; track i) {
                <div class="tl-item skel">
                  <span class="tl-dot sk"></span>
                  <div class="tl-body"><span class="sk-line w40"></span><span class="sk-line w70"></span></div>
                </div>
              }
            </div>
          } @else if (filteredHistory().length === 0) {
            <div class="ph-empty"><span class="material-icons">receipt_long</span>
              <b>No billing activity yet</b>
              <p>Payments, plan changes and renewals will appear here as a timeline.</p></div>
          } @else {
            <div class="tl">
              @if (nextCharge() !== '—' && histFilter() !== 'plan') {
                <!-- The future, previewed: the next automatic charge as a ghost entry. -->
                <div class="tl-item ghost">
                  <span class="tl-dot ghostdot"><span class="material-icons">update</span></span>
                  <div class="tl-body">
                    <div class="tl-row">
                      <b class="tl-title">Upcoming renewal</b>
                      <span class="tl-sp"></span>
                      <span class="tl-amt up">{{ nextCharge() }}</span>
                    </div>
                    <p class="tl-desc">Charged automatically to your card on file — no action needed.</p>
                  </div>
                </div>
              }
              @for (g of groupedHistory(); track g.label) {
                <div class="tl-month">{{ g.label }}</div>
                @for (h of g.items; track h.id) {
                  <div class="tl-item">
                    <span [class]="'tl-dot ' + statusClass(h.status)"><span class="material-icons">{{ eventIcon(h.status) }}</span></span>
                    <div class="tl-body">
                      <div class="tl-row">
                        <b class="tl-title">{{ statusLabel(h.status) }}</b>
                        @if (h.planCode) { <span class="tl-plan">{{ h.planCode }}</span> }
                        <span class="tl-sp"></span>
                        @if (h.amount > 0) { <span [class]="h.status === 'payment_failed' ? 'tl-amt bad' : 'tl-amt'">\${{ h.amount }} <small>{{ h.currency }}</small></span> }
                        <span class="tl-date" [title]="fmtDate(h.createdOn)">{{ relTime(h.createdOn) }}</span>
                      </div>
                      @if (h.description) { <p class="tl-desc">{{ h.description }}</p> }
                    </div>
                  </div>
                }
              }
            </div>
          }
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

  <app-signature-pad [open]="sigOpen()" (closed)="onSigClosed()" />
  @if (msg()) { <div class="toast">{{ msg() }}</div> }
  `,
  styles: [`
    :host{display:block}
    .sect-hint{font-size:12.5px;color:var(--cf-ink-500);margin:-4px 0 14px}
    .sig-block{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
    .sig-preview{width:240px;height:100px;border:1px solid var(--cf-line);border-radius:12px;background:var(--cf-surface-2);display:grid;place-items:center;overflow:hidden;flex:none}
    .sig-preview.empty{border-style:dashed}
    .sig-preview img{max-width:88%;max-height:80%;object-fit:contain}
    .sig-ph{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:var(--cf-ink-400)}.sig-ph .material-icons{font-size:18px}
    .sig-info{display:flex;flex-direction:column;gap:3px;min-width:200px}
    .sig-info strong{font-size:13.5px;color:var(--cf-ink-900)}
    .sig-info small{font-size:12px;max-width:340px}
    .sig-acts{display:flex;gap:9px;flex-wrap:wrap;margin-top:8px}
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
    /* ═══ Your profile — light brand-tinted cover, name on white ═══ */
    .pcard{position:relative;overflow:hidden;padding-top:0}
    .pcover{position:relative;height:82px;margin:0 -22px 0;overflow:hidden;
      background:linear-gradient(120deg,var(--cf-brand-50,#EEF2FF),color-mix(in srgb,var(--cf-brand-500,#6366F1) 20%,#fff) 55%,color-mix(in srgb,var(--cf-brand-500,#6366F1) 10%,#fff));
      border-bottom:1px solid color-mix(in srgb,var(--cf-brand-500,#6366F1) 14%,var(--cf-line))}
    .pc-orb{position:absolute;border-radius:50%;background:color-mix(in srgb,var(--cf-brand-500,#6366F1) 14%,transparent);filter:blur(2px)}
    .pc-orb.o1{width:150px;height:150px;top:-70px;inset-inline-end:8%}
    .pc-orb.o2{width:90px;height:90px;bottom:-46px;inset-inline-start:16%;background:color-mix(in srgb,var(--cf-brand-500,#6366F1) 8%,transparent)}
    .pmain{position:relative;display:flex;align-items:flex-start;gap:16px;margin-top:-40px;padding:0 4px;flex-wrap:wrap}
    /* the identity text starts BELOW the cover — always readable on white */
    .pid{padding-top:48px}
    .pavatar{position:relative;width:88px;height:88px;flex:none;border-radius:50%;cursor:pointer;overflow:hidden;
      background:var(--cf-brand-50);display:grid;place-items:center;
      border:4px solid var(--cf-surface);box-shadow:0 10px 24px -10px rgba(15,23,42,.35)}
    .pavatar img{width:100%;height:100%;object-fit:cover}
    .pav-init{font-size:28px;font-weight:800;color:var(--cf-brand-600)}
    .pav-ov{position:absolute;inset:0;display:grid;place-items:center;color:#fff;background:rgba(15,23,42,.45);opacity:0;transition:opacity .15s}
    .pavatar:hover .pav-ov{opacity:1}
    .pav-ov .material-icons{font-size:22px}
    .pav-busy{position:absolute;inset:0;border-radius:50%;border:3px solid transparent;border-top-color:var(--cf-brand-500);animation:spin 1s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .pid{flex:1;min-width:220px}
    .pname-row{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
    .pname{font-size:19px;font-weight:800;color:var(--cf-ink-900);letter-spacing:-.01em}
    .pverf{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:800;color:#15803d;background:#dcfce7;padding:3px 10px;border-radius:999px}
    .pverf .material-icons{font-size:13px}
    .pverf.warn{color:#92400e;background:#fef3c7}
    .pemail{display:block;font-size:12.5px;margin-top:2px}
    .pchips{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}
    .pchip{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:var(--cf-ink-600);background:var(--cf-surface-2,#f1f5f9);border:1px solid var(--cf-line);padding:4px 11px;border-radius:999px}
    .pchip .material-icons{font-size:13px;color:var(--cf-brand-600)}
    .pform{margin-top:18px}
    .pacts{display:flex;gap:9px;flex-wrap:wrap;margin-top:4px}

    /* ═══ Subscription hero — LIGHT, professional, driven by the tenant's BRAND colors ═══ */
    .subhero{position:relative;overflow:hidden;
      --acc:var(--cf-brand-600,#4F46E5);
      --accSoft:var(--cf-brand-50,#EEF2FF);
      background:linear-gradient(165deg,color-mix(in srgb,var(--acc) 6%,var(--cf-surface)),var(--cf-surface) 52%);
      border:1px solid color-mix(in srgb,var(--acc) 20%,var(--cf-line))}
    .sh-glow{position:absolute;border-radius:50%;filter:blur(70px);pointer-events:none;opacity:.5}
    .g1{width:340px;height:340px;top:-190px;inset-inline-end:-90px;background:radial-gradient(circle,color-mix(in srgb,var(--acc) 16%,transparent),transparent 65%)}
    .g2{display:none}
    .sh-medal{position:absolute;bottom:-34px;inset-inline-end:-18px;font-size:170px;color:color-mix(in srgb,var(--acc) 6%,transparent);pointer-events:none;transform:rotate(-14deg)}
    .sh-top{position:relative;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px}
    .sh-id{display:flex;flex-direction:column;gap:8px}
    .sh-chip{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--acc);background:var(--accSoft);border:1px solid color-mix(in srgb,var(--acc) 25%,transparent);padding:5px 12px;border-radius:999px}
    .sh-chip .material-icons{font-size:13px}
    .sh-name{font-size:25px;font-weight:800;color:var(--cf-ink-900);letter-spacing:-.02em}
    .sh-status{font-style:normal;font-size:10.5px;font-weight:800;padding:3px 10px;border-radius:999px;margin-inline-start:10px;vertical-align:middle}
    .sh-price{display:flex;align-items:baseline;gap:3px}
    .sh-price b{font-size:31px;font-weight:800;letter-spacing:-.03em;color:var(--acc)}
    .sh-price small{font-size:13px;color:var(--cf-ink-400);font-weight:600}
    .sh-act{display:flex;gap:9px;flex-wrap:wrap}
    .sh-portal{background:var(--cf-surface);border:1px solid var(--cf-line);color:var(--cf-ink-700)}
    .sh-portal:hover{border-color:color-mix(in srgb,var(--acc) 45%,var(--cf-line));color:var(--acc)}
    /* period panel: bar + countdown ring */
    .sh-period{position:relative;display:flex;align-items:center;gap:22px;padding:15px 17px;border-radius:15px;background:color-mix(in srgb,var(--acc) 4%,var(--cf-surface));border:1px solid color-mix(in srgb,var(--acc) 14%,var(--cf-line))}
    .sh-period-main{flex:1;min-width:0}
    .sh-period-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:12px;color:var(--cf-ink-500);margin-bottom:10px}
    .sh-period-head span{display:inline-flex;align-items:center;gap:6px;font-weight:600}
    .sh-period-head .material-icons{font-size:15px;color:var(--acc)}
    .sh-period-head b{color:var(--cf-ink-900);font-size:12.5px}
    .sh-bar{height:9px;border-radius:99px;background:color-mix(in srgb,var(--cf-ink-400) 14%,var(--cf-surface));overflow:hidden}
    .sh-bar span{position:relative;display:block;height:100%;min-width:16px;border-radius:99px;overflow:hidden;
      background:linear-gradient(90deg,color-mix(in srgb,var(--acc) 75%,#fff),var(--acc));
      transition:width .7s cubic-bezier(.2,.8,.3,1)}
    .sh-bar span::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);transform:translateX(-100%);animation:sweep 2.8s ease-in-out infinite}
    @keyframes sweep{55%,100%{transform:translateX(100%)}}
    .sh-hint{display:block;margin-top:9px;font-size:10.5px;color:var(--cf-ink-400)}
    .sh-ring{position:relative;width:84px;height:84px;flex:none}
    .sh-ring svg{width:84px;height:84px;transform:rotate(-90deg)}
    .rg-bg{fill:none;stroke:color-mix(in srgb,var(--cf-ink-400) 16%,transparent);stroke-width:5}
    .rg-fg{fill:none;stroke:var(--acc);stroke-width:5;stroke-linecap:round;stroke-dasharray:163.4;transition:stroke-dashoffset .9s cubic-bezier(.2,.8,.3,1)}
    .rg-txt{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.05}
    .rg-txt b{font-size:21px;font-weight:800;color:var(--cf-ink-900)}
    .rg-txt small{font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--cf-ink-400)}
    /* feature chips pick up the accent */
    .sh-feats{position:relative;display:flex;gap:7px;flex-wrap:wrap;margin-top:15px}
    .sh-feat{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:var(--cf-ink-600);background:var(--accSoft);border:1px solid color-mix(in srgb,var(--acc) 18%,transparent);padding:5px 11px;border-radius:999px}
    .sh-feat .material-icons{font-size:12px;color:var(--acc)}
    /* status chips + notices */
    .st-ok{background:#dcfce7;color:#15803d}.st-warn{background:#fef3c7;color:#92400e}.st-bad{background:#fee2e2;color:#b91c1c}.st-mut{background:var(--cf-surface-2,#f1f5f9);color:var(--cf-ink-500)}
    .sched-note{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:0 0 16px;padding:12px 15px;border-radius:13px;font-size:12.5px;color:#3730a3;background:#eef2ff;border:1px solid #c7d2fe}
    .sched-note.warn{color:#92400e;background:#fef3c7;border-color:#fde68a}
    .sched-note .material-icons{font-size:16px}
    .sched-note a{font-weight:800;color:inherit}
    /* usage meters */
    .meters{display:grid;gap:14px;margin-bottom:16px}
    .meter{padding:13px 15px;border:1px solid var(--cf-line);border-radius:13px}
    .m-head{display:flex;align-items:center;gap:10px;margin-bottom:10px;font-size:12.5px}
    .m-ic{width:30px;height:30px;flex:none;display:grid;place-items:center;border-radius:9px;color:#fff}
    .m-ic .material-icons{font-size:16px}
    .m-ic.cred{background:linear-gradient(135deg,var(--cf-brand-500,#6366F1),var(--cf-brand-700,#4338CA))}
    .m-ic.sto{background:linear-gradient(135deg,color-mix(in srgb,var(--cf-brand-500,#6366F1) 55%,#0EA5E9),var(--cf-brand-600,#4F46E5))}
    .m-name{flex:1;font-weight:600;color:var(--cf-ink-700)}
    .m-head b{color:var(--cf-ink-900);font-size:13px}.m-head small{color:var(--cf-ink-400);font-weight:600}
    .m-bar{height:8px;border-radius:99px;background:var(--cf-surface-2,#f1f5f9);overflow:hidden}
    .m-bar span{display:block;height:100%;border-radius:99px;transition:width .6s cubic-bezier(.2,.8,.3,1)}
    .m-bar span.cred{background:linear-gradient(90deg,var(--cf-brand-500,#6366F1),var(--cf-brand-700,#4338CA))}
    .m-bar span.sto{background:linear-gradient(90deg,color-mix(in srgb,var(--cf-brand-500,#6366F1) 55%,#0EA5E9),var(--cf-brand-600,#4F46E5))}
    .m-bar span.hot{background:linear-gradient(90deg,#f59e0b,#dc2626)}
    /* payment history */
    .ph-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
    .ph-head h3{margin-bottom:0}
    .ph-export{display:inline-flex;align-items:center;gap:6px;font-size:12px;padding:7px 13px}
    .ph-export .material-icons{font-size:15px}
    .ph-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin:16px 0}
    .ps{display:flex;align-items:center;gap:10px;padding:12px 13px;border:1px solid var(--cf-line);border-radius:13px}
    .ps-ic{width:34px;height:34px;flex:none;display:grid;place-items:center;border-radius:10px;color:#fff}
    .ps-ic .material-icons{font-size:17px}
    .ps-ic.total{background:linear-gradient(135deg,#10B981,#059669)}
    .ps-ic.count{background:linear-gradient(135deg,var(--cf-brand-500,#6366F1),var(--cf-brand-700,#4338CA))}
    .ps-ic.last{background:linear-gradient(135deg,color-mix(in srgb,var(--cf-brand-500,#6366F1) 70%,#8B5CF6),var(--cf-brand-700,#6D28D9))}
    .ps-ic.next{background:linear-gradient(135deg,#F59E0B,#D97706)}
    .ps b{display:block;font-size:14.5px;font-weight:800;color:var(--cf-ink-900);line-height:1.15}
    .ps small{font-size:11px;color:var(--cf-ink-500)}
    .ph-filters{display:inline-flex;gap:4px;margin-bottom:14px;padding:4px;background:var(--cf-surface-2,#f1f5f9);border-radius:11px}
    .ph-filters button{border:0;background:none;font:inherit;font-size:12px;font-weight:700;color:var(--cf-ink-500);padding:7px 15px;border-radius:8px;cursor:pointer;transition:.15s}
    .ph-filters button.on{background:var(--cf-surface);color:var(--cf-brand-700);box-shadow:0 1px 4px rgba(15,23,42,.12)}
    .ph-empty{display:flex;flex-direction:column;align-items:center;gap:6px;padding:30px 16px;text-align:center;color:var(--cf-ink-500)}
    .ph-empty .material-icons{font-size:34px;opacity:.5}
    .ph-empty b{color:var(--cf-ink-700)}
    .ph-empty p{font-size:12.5px;margin:0}
    /* timeline — spine aligned to dot centres, tidy columns */
    .tl{position:relative;display:flex;flex-direction:column;gap:2px}
    .tl::before{content:"";position:absolute;top:20px;bottom:20px;inset-inline-start:26px;width:2px;border-radius:2px;background:var(--cf-line)}
    .tl-item{position:relative;display:flex;align-items:flex-start;gap:13px;padding:10px 8px;border-radius:12px;transition:background .14s}
    .tl-item:hover{background:var(--cf-surface-2,#f8fafc)}
    .tl-dot{position:relative;z-index:1;width:36px;height:36px;flex:none;display:grid;place-items:center;border-radius:50%;box-shadow:0 0 0 4px var(--cf-surface)}
    .tl-dot .material-icons{font-size:16px;line-height:1}
    .tl-body{flex:1;min-width:0;padding-top:1px}
    .tl-row{display:flex;align-items:center;gap:9px;flex-wrap:wrap;min-height:20px}
    .tl-title{font-size:13px;font-weight:700;color:var(--cf-ink-900)}
    .tl-plan{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--cf-brand-700);background:var(--cf-brand-50);padding:2px 9px;border-radius:999px}
    .tl-sp{flex:1}
    .tl-amt{font-size:13px;font-weight:800;color:#15803d;white-space:nowrap;min-width:74px;text-align:end}
    .tl-amt small{font-size:10px;color:var(--cf-ink-400);font-weight:700}
    .tl-amt.bad{color:#b91c1c}
    .tl-date{font-size:11.5px;color:var(--cf-ink-400);white-space:nowrap;min-width:86px;text-align:end}
    .tl-desc{font-size:12px;color:var(--cf-ink-500);margin:3px 0 0;line-height:1.5;max-width:62ch}
    /* month group headers — text starts exactly where item text starts */
    .tl-month{position:relative;z-index:1;display:flex;align-items:center;gap:10px;font-size:10.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--cf-ink-400);margin:14px 0 4px;padding-inline-start:57px}
    .tl-month::before{content:"";position:absolute;inset-inline-start:20px;top:50%;width:13px;height:13px;transform:translateY(-50%);border-radius:50%;background:var(--cf-surface);border:3px solid var(--cf-line)}
    .tl-month::after{content:"";flex:1;height:1px;background:var(--cf-line)}
    /* upcoming-renewal ghost entry */
    .tl-item.ghost{border:1.5px dashed color-mix(in srgb,var(--cf-brand-500) 40%,var(--cf-line));background:color-mix(in srgb,var(--cf-brand-500) 5%,transparent);margin-bottom:6px}
    .tl-dot.ghostdot{background:var(--cf-surface);border:1.5px dashed var(--cf-brand-300,#a5b4fc);color:var(--cf-brand-600)}
    .tl-amt.up{color:var(--cf-brand-700)}
    /* skeleton loading */
    .tl-item.skel{pointer-events:none}
    .tl-dot.sk{background:var(--cf-surface-2,#f1f5f9)}
    .sk-line{display:block;height:10px;border-radius:6px;margin:6px 0;background:linear-gradient(90deg,var(--cf-surface-2,#f1f5f9) 25%,color-mix(in srgb,var(--cf-ink-400) 12%,var(--cf-surface-2)) 50%,var(--cf-surface-2,#f1f5f9) 75%);background-size:200% 100%;animation:skel 1.2s ease-in-out infinite}
    .sk-line.w40{width:40%}.sk-line.w70{width:70%}
    @keyframes skel{0%{background-position:200% 0}100%{background-position:-200% 0}}
    @media(max-width:720px){.ph-stats{grid-template-columns:1fr 1fr}.sh-period{flex-direction:column;align-items:stretch}.sh-ring{align-self:center}}

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
  private billing = inject(BillingService);
  private issuedSvc = inject(IssuedService);
  readonly prof = inject(ProfileService);

  // ---- real profile editing (API-backed) ----
  /** Signal (not a plain field) — the app is zoneless, so the input must react when the profile loads. */
  nameDraft = signal('');
  nameBusy = signal(false);
  avatarBusy = signal(false);
  /** Fill the name field once the profile arrives (until the user types their own value). */
  private _syncName = effect(() => {
    const n = this.prof.profile()?.fullName;
    if (n && !this.nameDraft()) this.nameDraft.set(n);
  });
  memberSince(): string {
    const j = this.prof.joinedOn();
    return j ? j.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '';
  }
  saveName(): void {
    const name = this.nameDraft().trim();
    if (!name || this.nameBusy()) return;
    this.nameBusy.set(true);
    this.prof.updateName(name).subscribe({
      next: (res) => {
        this.nameBusy.set(false);
        if (res?.success) this.alerts.success('Your name was updated everywhere.', { title: 'Profile saved' });
        else this.alerts.error(res?.message || 'Could not save your name.');
      },
      error: () => { this.nameBusy.set(false); this.alerts.error('Could not save your name.'); },
    });
  }
  onAvatarUpload(e: Event): void {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    input.value = '';
    if (!f || !/^image\//.test(f.type)) return;
    if (f.size > 2 * 1024 * 1024) { this.alerts.warning('Please choose an image under 2 MB.'); return; }
    this.avatarBusy.set(true);
    this.prof.uploadAvatar(f).subscribe({
      next: (res) => {
        this.avatarBusy.set(false);
        if (res?.success) this.alerts.success('Looking good! Your photo was updated.', { title: 'Photo saved' });
        else this.alerts.error(res?.message || 'Could not upload the photo.');
      },
      error: () => { this.avatarBusy.set(false); this.alerts.error('Could not upload the photo.'); },
    });
  }

  /** Live subscription + payment history for the Billing section. */
  sub = signal<SubscriptionView | null>(null);
  history = signal<BillingHistoryItem[]>([]);
  histLoading = signal(true);
  histFilter = signal<'all' | 'pay' | 'plan'>('all');

  // ---- usage meters ----
  credentialsUsed = computed(() => {
    const n = new Date();
    return this.issuedSvc.records().filter((r) => { const d = new Date(r.createdAt); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length;
  });
  credPct(): number { const l = this.plan.issueLimit(); return !isFinite(l) || l <= 0 ? 0 : Math.min(100, Math.round((this.credentialsUsed() / l) * 100)); }
  storageUsedMB(): number { let b = 0; try { Object.keys(localStorage).forEach((k) => { b += (localStorage.getItem(k) || '').length + k.length; }); } catch { /* ignore */ } return Math.max(0.1, Math.round((b / 1048576) * 10) / 10); }
  storagePct(): number { const l = this.plan.storageLimitMB(); return !isFinite(l) || l <= 0 ? 0 : Math.min(100, Math.round((this.storageUsedMB() / l) * 100)); }

  // ---- billing period progress ----
  /** % of the current billing period elapsed (null when unknown / Free). */
  periodPct(): number | null {
    const end = this.sub()?.currentPeriodEnd;
    if (!end) return null;
    const endMs = +new Date(end);
    const days = this.sub()?.interval === 'yearly' ? 365 : 30;
    const startMs = endMs - days * 86400000;
    const pct = Math.round(((Date.now() - startMs) / (endMs - startMs)) * 100);
    return Math.min(100, Math.max(2, pct));
  }
  daysLeft(): number {
    const end = this.sub()?.currentPeriodEnd;
    return end ? Math.max(0, Math.ceil((+new Date(end) - Date.now()) / 86400000)) : 0;
  }
  /** Top included features of the current plan (hero chips). */
  topFeats(): string[] {
    return this.plan.current().features.filter((f) => f.included).slice(0, 6)
      .map((f) => f.value ? `${f.label} (${f.value})` : f.label);
  }

  // ---- payment history: stats + filter + export ----
  filteredHistory = computed<BillingHistoryItem[]>(() => {
    const f = this.histFilter(); const all = this.history();
    if (f === 'pay') return all.filter((h) => ['paid', 'payment_failed', 'refunded'].includes(h.status));
    if (f === 'plan') return all.filter((h) => !['paid', 'payment_failed', 'refunded'].includes(h.status));
    return all;
  });
  /** History grouped by month for the timeline headers. */
  groupedHistory = computed<{ label: string; items: BillingHistoryItem[] }[]>(() => {
    const out: { label: string; items: BillingHistoryItem[] }[] = [];
    for (const h of this.filteredHistory()) {
      const label = new Date(h.createdOn).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      const g = out[out.length - 1];
      if (g && g.label === label) g.items.push(h); else out.push({ label, items: [h] });
    }
    return out;
  });
  /** "Today" / "Yesterday" / "5 days ago" / date — humans think in relative time. */
  relTime(v: string): string {
    const days = Math.floor((Date.now() - +new Date(v)) / 86400000);
    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    return this.fmtDate(v);
  }
  /** Countdown ring: dash offset for the fraction of the billing period remaining (r=26 → C≈163.4). */
  private readonly RING_C = 2 * Math.PI * 26;
  ringOffset(): number {
    const days = this.sub()?.interval === 'yearly' ? 365 : 30;
    const frac = Math.min(1, Math.max(0, this.daysLeft() / days));
    return Math.round(this.RING_C * (1 - frac) * 100) / 100;
  }

  totalSpent(): number { return this.history().filter((h) => h.status === 'paid').reduce((n, h) => n + h.amount, 0); }
  paymentsCount(): number { return this.history().filter((h) => h.status === 'paid').length; }
  lastPaymentDate(): string { const p = this.history().find((h) => h.status === 'paid'); return p ? this.fmtDate(p.createdOn) : '—'; }
  nextCharge(): string {
    const s = this.sub();
    if (!s || s.amount <= 0 || ['canceling', 'canceled', 'trial_expired'].includes(s.status)) return '—';
    return `$${s.amount} · ${this.fmtDate(s.currentPeriodEnd)}`;
  }
  eventIcon(s: string): string {
    const map: Record<string, string> = {
      paid: 'payments', plan_changed: 'swap_vert', downgrade_scheduled: 'schedule',
      downgrade_canceled: 'undo', cancel_scheduled: 'event_busy', cancel_undone: 'restart_alt',
      canceled: 'do_not_disturb_on', ended: 'flag', payment_failed: 'error', refunded: 'swap_horiz',
    };
    return map[s] || 'receipt_long';
  }
  /** Download the full history as CSV. */
  exportHistory(): void {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['Date', 'Event', 'Plan', 'Amount', 'Currency', 'Interval', 'Description'].join(','),
      ...this.history().map((h) => [
        new Date(h.createdOn).toISOString(), this.statusLabel(h.status), h.planCode,
        h.amount, h.currency, h.interval || '', h.description || '',
      ].map(esc).join(',')),
    ].join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + rows], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'certifada-billing-history.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  constructor() {
    this.billing.subscription().subscribe({
      next: (res) => { if (res?.success) this.sub.set(res.data ?? null); },
      error: () => { /* offline */ },
    });
    this.billing.history().subscribe({
      next: (res) => { this.histLoading.set(false); if (res?.success) this.history.set(res.data ?? []); },
      error: () => this.histLoading.set(false),
    });
  }

  msg = signal('');
  dirty = signal(false);
  sigOpen = signal(false);
  mySig = signal<string | null>(this.readSig());
  private readSig(): string | null { try { return localStorage.getItem('cf-signature'); } catch { return null; } }
  onSigClosed(): void {
    this.sigOpen.set(false);
    this.mySig.set(this.readSig());
    // Persist the signature to the users table (Users.Signature_URL) too.
    const sig = this.mySig();
    if (sig && sig.startsWith('data:image')) {
      this.prof.uploadSignature(sig).subscribe({
        next: (res) => { if (res?.success) this.alerts.success('Signature saved to your account.', { title: 'Signature saved' }); },
        error: () => this.alerts.warning('Signature kept on this device, but saving to your account failed.'),
      });
    }
  }
  /** Signature to display: this device's copy, else the one saved on the account. */
  sigSrc(): string | null { return this.mySig() || this.prof.signatureUrl(); }
  removeSig(): void { try { localStorage.removeItem('cf-signature'); } catch { /* ignore */ } this.mySig.set(null); this.flash('Signature removed.'); }
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
  /** Real renewal / trial-end date from the subscription (fallback: +1 month for display). */
  renewalDate(): string {
    const end = this.sub()?.currentPeriodEnd;
    if (end) return this.fmtDate(end);
    const d = new Date(); d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  cycleLabel(): string {
    const i = this.sub()?.interval;
    return i === 'yearly' ? 'Yearly' : i === 'monthly' ? 'Monthly' : '—';
  }
  fmtDate(v?: string | null): string {
    if (!v) return '—';
    try { return new Date(v).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return '—'; }
  }
  statusLabel(s: string): string {
    const map: Record<string, string> = {
      active: 'Active', trialing: 'Trial', trial_expired: 'Trial ended', canceling: 'Ends soon',
      canceled: 'Canceled', ended: 'Ended', past_due: 'Payment due', scheduled: 'Scheduled',
      paid: 'Paid', plan_changed: 'Plan changed', downgrade_scheduled: 'Downgrade scheduled',
      downgrade_canceled: 'Downgrade canceled', cancel_scheduled: 'Cancellation scheduled',
      cancel_undone: 'Cancellation undone', payment_failed: 'Payment failed', refunded: 'Refunded',
    };
    return map[s] || s;
  }
  statusClass(s: string): string {
    if (['active', 'paid', 'trialing', 'cancel_undone', 'downgrade_canceled'].includes(s)) return 'st-ok';
    if (['canceling', 'downgrade_scheduled', 'cancel_scheduled', 'scheduled', 'trial_expired'].includes(s)) return 'st-warn';
    if (['payment_failed', 'past_due'].includes(s)) return 'st-bad';
    return 'st-mut';
  }
  /** Stripe billing portal — cards, invoices (PDF), cancellation. */
  openPortal(): void {
    this.billing.portal(window.location.href).subscribe({
      next: (res) => {
        if (res?.data?.url) window.location.href = res.data.url;
        else this.alerts.info('The Stripe portal is available once you have a paid subscription.');
      },
      error: () => this.alerts.error('Could not open the billing portal.'),
    });
  }

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
