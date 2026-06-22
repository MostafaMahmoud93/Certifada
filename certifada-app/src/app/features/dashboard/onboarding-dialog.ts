import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { AlertService } from '../../core/services/alert.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [FormsModule],
  animations: [
    trigger('pop', [
      transition(':enter', [style({ opacity: 0, transform: 'translateY(12px) scale(.98)' }), animate('220ms cubic-bezier(.16,.84,.44,1)', style({ opacity: 1, transform: 'none' }))]),
    ]),
    trigger('fade', [transition(':enter', [style({ opacity: 0 }), animate('160ms ease-out', style({ opacity: 1 }))])]),
  ],
  template: `
  <div class="ov" [@fade] (click)="skip()">
    <div class="dlg" [@pop] (click)="$event.stopPropagation()">
      <button class="x" (click)="skip()" title="Skip for now"><span class="material-icons">close</span></button>

      <div class="hd">
        <span class="badge"><span class="material-icons">workspace_premium</span></span>
        <h2>Complete your profile to get your own domain!</h2>
        <p class="cf-muted">Set up your brand and claim your address — it's the identity for everything you create.</p>
      </div>

      <div class="steps">
        <span class="st" [class.on]="step() === 1" [class.done]="step() > 1">@if (step() > 1) { <span class="material-icons">check</span> } @else { 1 }</span>
        <span class="line" [class.fill]="step() > 1"></span>
        <span class="st" [class.on]="step() === 2">2</span>
      </div>

      @if (step() === 1) {
        <div class="body">
          <h3>Let's create the best experience for you</h3>

          <label class="q">What will you be using Certifada for?</label>
          <div class="chips">@for (o of usages; track o) { <button type="button" [class.on]="usage === o" (click)="usage = o">{{ o }}</button> }</div>

          <label class="q">What type of organization are you in?</label>
          <div class="chips">@for (o of orgTypes; track o) { <button type="button" [class.on]="orgType === o" (click)="orgType = o">{{ o }}</button> }</div>

          <label class="q">What best describes your role?</label>
          <div class="chips">@for (o of roles; track o) { <button type="button" [class.on]="role === o" (click)="role = o">{{ o }}</button> }</div>
        </div>
        <div class="ft">
          <button class="cf-btn cf-btn-secondary" (click)="skip()">Skip</button>
          <span class="sp"></span>
          <button class="cf-btn cf-btn-primary" (click)="next()">Next <span class="material-icons">arrow_forward</span></button>
        </div>
      } @else {
        <div class="body">
          <h3>Add your brand kit effortlessly</h3>

          <div class="tabs">
            <button type="button" [class.on]="brandMode() === 'manual'" (click)="brandMode.set('manual')">Enter manually</button>
            <button type="button" [class.on]="brandMode() === 'website'" (click)="brandMode.set('website')">Enter website</button>
          </div>

          @if (brandMode() === 'manual') {
            <label class="fld">Company name<input [(ngModel)]="company" placeholder="Your Organization" /></label>
            <label class="fld">Logos (URLs, comma separated)<input [(ngModel)]="logos" placeholder="https://…/logo.png" /></label>
            <label class="fld">Brand colors (hex, comma separated)<input [(ngModel)]="colors" placeholder="#4f46e5, #0f172a, #f59e0b" /></label>
            <label class="fld">Fonts (comma separated)<input [(ngModel)]="fonts" placeholder="Inter, Playfair Display" /></label>
          } @else {
            <label class="fld">Website
              <div class="row"><input [(ngModel)]="website" placeholder="https://yourcompany.com" /><button class="cf-btn cf-btn-secondary nowrap" (click)="extract()">Extract</button></div>
            </label>
            <p class="hint"><span class="material-icons">auto_awesome</span> We'll pull your company name, colors and fonts from your site.</p>
          }

          <label class="q dm">Choose your Certifada domain</label>
          <div class="row dom">
            <div class="dom-in"><input [(ngModel)]="domain" (input)="domainStatus.set('idle')" placeholder="your-brand" /><span class="suf">.certifada.com</span></div>
            <button class="cf-btn cf-btn-secondary nowrap" (click)="checkDomain()">Check</button>
          </div>
          @if (domainStatus() === 'ok') { <p class="dm-ok"><span class="material-icons">check_circle</span> {{ cleanDomain() }}.certifada.com is available!</p> }
          @if (domainStatus() === 'taken') { <p class="dm-no"><span class="material-icons">cancel</span> That one is taken — try another.</p> }
        </div>
        <div class="ft">
          <button class="cf-btn cf-btn-secondary" (click)="back()"><span class="material-icons">arrow_back</span> Back</button>
          <span class="sp"></span>
          <button class="cf-btn cf-btn-primary" (click)="finish()">Finish setup</button>
        </div>
      }
    </div>
  </div>
  `,
  styles: [`
    :host{position:fixed;inset:0;z-index:80}
    .ov{position:absolute;inset:0;background:rgba(2,6,23,.55);display:grid;place-items:center;padding:20px;overflow:auto}
    .dlg{position:relative;width:100%;max-width:580px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:var(--cf-radius-lg);box-shadow:var(--cf-shadow-lg);padding:26px;margin:auto}
    .x{position:absolute;top:14px;inset-inline-end:14px;border:0;background:none;color:var(--cf-ink-400);cursor:pointer}
    .x:hover{color:var(--cf-ink-900)}
    .hd{text-align:center;margin-bottom:18px}
    .badge{width:48px;height:48px;border-radius:14px;background:var(--cf-brand-50);color:var(--cf-brand-600);display:grid;place-items:center;margin:0 auto 12px}
    .badge .material-icons{font-size:26px}
    .hd h2{font-size:20px;color:var(--cf-ink-900);line-height:1.25;max-width:420px;margin:0 auto}
    .hd p{font-size:13px;margin-top:7px;max-width:430px;margin-inline:auto}
    .steps{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:20px}
    .st{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:13px;font-weight:700;background:var(--cf-surface-2);color:var(--cf-ink-500);border:1px solid var(--cf-line)}
    .st.on{background:var(--cf-brand-600);color:#fff;border-color:var(--cf-brand-600)}
    .st.done{background:var(--cf-brand-50);color:var(--cf-brand-600);border-color:var(--cf-brand-200)}
    .st .material-icons{font-size:17px}
    .line{width:60px;height:2px;background:var(--cf-line)}
    .line.fill{background:var(--cf-brand-600)}
    .body{max-height:54vh;overflow:auto;padding-inline:2px}
    .body h3{font-size:15px;color:var(--cf-ink-900);margin-bottom:14px}
    .q{display:block;font-size:13px;font-weight:600;color:var(--cf-ink-700);margin:16px 0 8px}
    .q:first-of-type{margin-top:0}
    .q.dm{margin-top:18px}
    .chips{display:flex;flex-wrap:wrap;gap:8px}
    .chips button{padding:7px 13px;border:1px solid var(--cf-line);border-radius:999px;background:var(--cf-surface);color:var(--cf-ink-700);font:inherit;font-size:13px;cursor:pointer;transition:.12s;text-transform:capitalize}
    .chips button:hover{border-color:var(--cf-brand-400)}
    .chips button.on{background:var(--cf-brand-600);border-color:var(--cf-brand-600);color:#fff}
    .tabs{display:flex;gap:6px;background:var(--cf-surface-2);padding:4px;border-radius:var(--cf-radius-sm);margin-bottom:16px}
    .tabs button{flex:1;height:34px;border:0;border-radius:7px;background:none;color:var(--cf-ink-600);font:inherit;font-size:13px;font-weight:600;cursor:pointer}
    .tabs button.on{background:var(--cf-surface);color:var(--cf-brand-700);box-shadow:var(--cf-shadow-sm)}
    .fld{display:flex;flex-direction:column;gap:5px;font-size:12.5px;font-weight:500;color:var(--cf-ink-600);margin-bottom:12px}
    input{height:40px;border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);padding:0 11px;font:inherit;font-size:14px;background:var(--cf-surface);color:var(--cf-ink-900);outline:none;width:100%}
    input:focus{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .row{display:flex;gap:8px;align-items:center}
    .nowrap{white-space:nowrap;flex:none}
    .hint{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--cf-ink-500);margin:8px 0 0}
    .hint .material-icons{font-size:16px;color:var(--cf-brand-500)}
    .dom{align-items:stretch}
    .dom-in{flex:1;display:flex;align-items:center;border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);background:var(--cf-surface);overflow:hidden}
    .dom-in input{border:0;box-shadow:none;flex:1;text-align:end}
    .dom-in .suf{padding:0 11px;font-size:13.5px;font-weight:600;color:var(--cf-ink-500);background:var(--cf-surface-2);height:40px;display:grid;place-items:center;white-space:nowrap}
    .dm-ok,.dm-no{display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;margin:10px 0 0}
    .dm-ok{color:#16a34a}.dm-no{color:var(--cf-danger)}
    .dm-ok .material-icons,.dm-no .material-icons{font-size:17px}
    .ft{display:flex;align-items:center;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid var(--cf-line)}
    .ft .sp{flex:1}
    .cf-btn .material-icons{font-size:17px}
  `],
})
export class OnboardingDialogComponent {
  @Output() done = new EventEmitter<void>();
  private alerts = inject(AlertService);

  step = signal(1);

  usage = '';
  orgType = '';
  role = '';
  usages = ['Work', 'Personal', 'School'];
  orgTypes = ['Small business', 'Medium business', 'Enterprise', 'School / University', 'Government', 'Other'];
  roles = ['Business analyst', 'Consultant', 'Management', 'Finance', 'Admin / Support', 'Operations', 'IT / Engineering', 'Marketer', 'HR', 'PM', 'Learning', 'Sales'];

  brandMode = signal<'manual' | 'website'>('manual');
  company = '';
  logos = '';
  colors = '';
  fonts = '';
  website = '';
  domain = '';
  domainStatus = signal<'idle' | 'ok' | 'taken'>('idle');

  next(): void { this.step.set(2); }
  back(): void { this.step.set(1); }

  cleanDomain(): string { return this.domain.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''); }

  extract(): void {
    const w = this.website.trim();
    if (!w) { this.alerts.warning('Enter your website first.'); return; }
    const host = w.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
    const name = (host.split('.')[0] || 'brand');
    if (!this.company) this.company = name.charAt(0).toUpperCase() + name.slice(1);
    if (!this.colors) this.colors = '#4f46e5, #0f172a, #f59e0b';
    if (!this.fonts) this.fonts = 'Inter, Playfair Display';
    if (!this.domain) this.domain = name.toLowerCase().replace(/[^a-z0-9-]/g, '');
    this.brandMode.set('manual');
    this.alerts.info('Pulled brand details from ' + host + ' (demo).');
  }

  checkDomain(): void {
    const d = this.cleanDomain();
    if (!d) { this.domainStatus.set('idle'); return; }
    const taken = ['certifada', 'app', 'admin', 'test', 'demo', 'www', 'mail', 'api'].includes(d);
    this.domainStatus.set(taken ? 'taken' : 'ok');
  }

  finish(): void {
    const data = {
      usage: this.usage, orgType: this.orgType, role: this.role,
      company: this.company, logos: this.logos, colors: this.colors, fonts: this.fonts,
      website: this.website, domain: this.cleanDomain(),
    };
    localStorage.setItem('cf-onboarding', JSON.stringify(data));
    localStorage.setItem('cf-onboarding-done', '1');
    this.mergeBrand(data);
    const dom = data.domain || 'your-brand';
    this.alerts.success(dom + '.certifada.com is reserved for you!', { title: 'Welcome to Certifada 🎉' });
    this.done.emit();
  }

  skip(): void {
    localStorage.setItem('cf-onboarding-done', '1');
    this.done.emit();
  }

  private mergeBrand(d: { company: string; logos: string; colors: string; fonts: string }): void {
    try {
      const raw = localStorage.getItem('cf-brand');
      const brand: any = raw ? JSON.parse(raw) : {};
      if (d.company) brand.org = d.company;
      const cols = d.colors.split(',').map((c) => c.trim()).filter(Boolean);
      if (cols.length) { brand.primary = cols[0]; brand.colors = cols; }
      const fs = d.fonts.split(',').map((f) => f.trim()).filter(Boolean);
      if (fs[0]) brand.fontHeading = fs[0];
      if (fs[1]) brand.fontBody = fs[1];
      const logo = d.logos.split(',').map((l) => l.trim()).filter(Boolean)[0];
      if (logo) brand.logo = logo;
      localStorage.setItem('cf-brand', JSON.stringify(brand));
    } catch {
      /* ignore */
    }
  }
}
