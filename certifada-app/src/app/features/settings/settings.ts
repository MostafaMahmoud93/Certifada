import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../core/services/theme.service';
import { LanguageService } from '../../core/services/language.service';
import { AlertService } from '../../core/services/alert.service';

interface Settings {
  org: string;
  website: string;
  supportEmail: string;
  timezone: string;
  dateFormat: string;
  notifyBatch: boolean;
  notifyWeekly: boolean;
  notifyApprovals: boolean;
  sessionTimeout: string;
  twoFA: boolean;
}

const KEY = 'cf-settings';
const DEFAULT: Settings = {
  org: 'Your Organization',
  website: '',
  supportEmail: '',
  timezone: 'Asia/Dubai',
  dateFormat: 'MMM d, y',
  notifyBatch: true,
  notifyWeekly: false,
  notifyApprovals: true,
  sessionTimeout: '8 hours',
  twoFA: false,
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
  <div class="head">
    <div>
      <h1>Settings</h1>
      <p class="cf-muted">Manage your workspace, preferences and security.</p>
    </div>
    <button class="cf-btn cf-btn-primary" (click)="save()"><span class="material-icons">save</span> Save changes</button>
  </div>

  <div class="grid">
    <div class="card sect">
      <h3>Organization</h3>
      <label class="fld">Name<input [(ngModel)]="s.org" /></label>
      <div class="two">
        <label class="fld">Website<input [(ngModel)]="s.website" placeholder="https://" /></label>
        <label class="fld">Support email<input [(ngModel)]="s.supportEmail" type="email" placeholder="support@company.com" /></label>
      </div>
      <label class="fld">Timezone
        <select [(ngModel)]="s.timezone">@for (t of timezones; track t) { <option [value]="t">{{ t }}</option> }</select>
      </label>
    </div>

    <div class="card sect">
      <h3>Appearance</h3>
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
      <label class="fld">Date format
        <select [(ngModel)]="s.dateFormat">
          <option value="MMM d, y">Jun 14, 2026</option>
          <option value="d MMM y">14 Jun 2026</option>
          <option value="dd/MM/yyyy">14/06/2026</option>
          <option value="MM/dd/yyyy">06/14/2026</option>
        </select>
      </label>
    </div>

    <div class="card sect">
      <h3>Notifications</h3>
      <label class="toggle"><span><strong>Batch completed</strong><small class="cf-muted">Email me when a bulk batch finishes.</small></span>
        <span class="switch"><input type="checkbox" [(ngModel)]="s.notifyBatch" /><span class="track"></span></span></label>
      <label class="toggle"><span><strong>Approvals</strong><small class="cf-muted">Notify me about credentials awaiting approval.</small></span>
        <span class="switch"><input type="checkbox" [(ngModel)]="s.notifyApprovals" /><span class="track"></span></span></label>
      <label class="toggle"><span><strong>Weekly summary</strong><small class="cf-muted">A digest of activity every Monday.</small></span>
        <span class="switch"><input type="checkbox" [(ngModel)]="s.notifyWeekly" /><span class="track"></span></span></label>
    </div>

    <div class="card sect">
      <h3>Security</h3>
      <label class="fld">Session timeout
        <select [(ngModel)]="s.sessionTimeout">
          <option>1 hour</option><option>8 hours</option><option>24 hours</option><option>30 days</option>
        </select>
      </label>
      <label class="toggle"><span><strong>Two-factor authentication</strong><small class="cf-muted">Require a second step at sign-in.</small></span>
        <span class="switch"><input type="checkbox" [(ngModel)]="s.twoFA" /><span class="track"></span></span></label>
      <button class="cf-btn cf-btn-secondary sm" (click)="flash('API key management is coming soon.')"><span class="material-icons">vpn_key</span> Manage API keys</button>
    </div>

    <div class="card sect danger">
      <h3>Danger zone</h3>
      <div class="dz">
        <div><strong>Delete workspace</strong><p class="cf-muted">Permanently remove this workspace and all its data. This cannot be undone.</p></div>
        <button class="cf-btn dz-btn" (click)="deleteWorkspace()">Delete</button>
      </div>
    </div>
  </div>

  @if (msg()) { <div class="toast">{{ msg() }}</div> }
  `,
  styles: [`
    :host{display:block}
    .head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:18px}
    .head h1{font-size:22px}
    .cf-btn .material-icons{font-size:18px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start}
    .sect{padding:18px}
    .sect h3{font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--cf-ink-400);margin-bottom:14px}
    .two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .fld{display:flex;flex-direction:column;gap:5px;font-size:12.5px;font-weight:500;color:var(--cf-ink-600);margin-bottom:14px}
    .fld:last-child{margin-bottom:0}
    .lbl{display:block;font-size:12.5px;font-weight:500;color:var(--cf-ink-600);margin-bottom:7px}
    input,select{height:38px;border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);padding:0 10px;font:inherit;font-size:13.5px;background:var(--cf-surface);color:var(--cf-ink-900);outline:none;width:100%}
    input:focus,select:focus{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .seg{display:flex;gap:6px;margin-bottom:16px}
    .seg button{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;height:38px;border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);background:var(--cf-surface);color:var(--cf-ink-600);font:inherit;font-size:13px;cursor:pointer}
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
    @media(max-width:880px){.grid{grid-template-columns:1fr}.two{grid-template-columns:1fr}}
  `],
})
export class SettingsPage {
  theme = inject(ThemeService);
  lang = inject(LanguageService);
  private alerts = inject(AlertService);
  msg = signal('');
  s: Settings = this.load();

  private load(): Settings {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return { ...DEFAULT };
  }

  timezones = ['Asia/Dubai', 'Asia/Riyadh', 'Africa/Cairo', 'Europe/London', 'America/New_York', 'UTC'];

  setTheme(dark: boolean): void { if (this.theme.isDark() !== dark) this.theme.toggle(); }
  setLang(l: 'en' | 'ar'): void { if (this.lang.lang() !== l) this.lang.toggle(); }

  save(): void {
    localStorage.setItem(KEY, JSON.stringify(this.s));
    this.alerts.success('Settings saved.');
  }
  async deleteWorkspace(): Promise<void> {
    const ok = await this.alerts.confirm({ title: 'Delete workspace', message: 'Delete this workspace and ALL its data? This cannot be undone.', danger: true, confirmText: 'Delete workspace' });
    if (!ok) return;
    this.alerts.error('Workspace deletion requested (demo).');
  }
  flash(text: string): void { this.alerts.info(text); }
}
