import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { AlertService } from '../../core/services/alert.service';
import { BrandService } from '../../core/services/brand.service';

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
          <button class="cf-btn cf-btn-primary" [disabled]="!step1Valid()" (click)="next()">Next <span class="material-icons">arrow_forward</span></button>
        </div>
      } @else {
        <div class="body">
          <h3>Add your brand kit effortlessly</h3>

          <div class="tabs">
            <button type="button" [class.on]="brandMode() === 'manual'" (click)="brandMode.set('manual')">Enter manually</button>
            <button type="button" [class.on]="brandMode() === 'website'" (click)="brandMode.set('website')">Enter website</button>
          </div>

          @if (brandMode() === 'manual') {
            <label class="fld lead">Company name<input [(ngModel)]="company" placeholder="Your Organization" /></label>
            <div class="kit-grid">
            <div class="kit-card">
              <span class="kit-h"><span class="material-icons">image</span> Logo</span>
              <label class="logo-drop" [class.has]="logo" [class.drag]="logoDrag()"
                     (dragover)="onLogoDragOver($event)" (dragleave)="onLogoDragLeave($event)" (drop)="onLogoDrop($event)">
                <input type="file" accept="image/*" hidden (change)="onLogo($event)" />
                @if (logo) {
                  <img [src]="logo" alt="logo" />
                  <span class="logo-ov"><span class="material-icons">photo_camera</span> Change</span>
                } @else {
                  <span class="logo-ph"><span class="material-icons">cloud_upload</span><b>Upload logo</b><em>click or drop · PNG/SVG</em></span>
                }
              </label>
              @if (logo) { <button type="button" class="lk-rm" (click)="logo=''"><span class="material-icons">delete</span> Remove</button> }
            </div>

            <div class="kit-card">
              <span class="kit-h"><span class="material-icons">palette</span> Brand colors</span>
              <div class="swatches">
              @for (c of colors; track $index) {
                <span class="sw" [style.background]="c" [title]="c"><button type="button" (click)="removeColor($index)" aria-label="Remove"><span class="material-icons">close</span></button></span>
              }
              <label class="sw add" title="Pick a custom color"><input type="color" (change)="addColorValue($any($event.target).value)" /><span class="material-icons">add</span></label>
            </div>
            <div class="palette-row">
              @for (pc of presets; track pc) { <button type="button" class="pdot" [class.on]="colors.includes(pc)" [style.background]="pc" (click)="addColorValue(pc)" [title]="pc"></button> }
            </div>
            </div>

            </div>

            <div class="kit-card">
              <span class="kit-h"><span class="material-icons">text_fields</span> Fonts</span>
              <div class="font-split">
            <div class="fs-col">
            <span class="sublbl">Heading</span>
            <div class="font-cards">
              @for (f of fontOptions; track f) {
                <button type="button" class="fcard" [class.on]="fontHeading === f" (click)="fontHeading = f">
                  <span class="fc-spec" [style.fontFamily]="f">Ag</span>
                  <span class="fc-name">{{ f }}</span>
                  @if (fontHeading === f) { <span class="fc-tick material-icons">check_circle</span> }
                </button>
              }
            </div>
            </div>
            <div class="fs-col">
            <span class="sublbl">Body</span>
            <div class="font-cards">
              @for (f of fontOptions; track f) {
                <button type="button" class="fcard sm" [class.on]="fontBody === f" (click)="fontBody = f">
                  <span class="fc-spec" [style.fontFamily]="f">Ag</span>
                  <span class="fc-name">{{ f }}</span>
                  @if (fontBody === f) { <span class="fc-tick material-icons">check_circle</span> }
                </button>
              }
            </div>
            </div>
            </div>
            </div>
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
          <button type="button" class="ft-skip" (click)="skip()">Skip for now</button>
          <button class="cf-btn cf-btn-primary" [disabled]="!finishValid()" (click)="finish()">Finish setup</button>
        </div>
      }
    </div>
  </div>
  `,
  styles: [`
    :host{position:fixed;inset:0;z-index:80}
    .ov{position:absolute;inset:0;background:rgba(2,6,23,.55);display:grid;place-items:center;padding:20px;overflow:auto}
    .dlg{position:relative;width:100%;max-width:540px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:18px;box-shadow:0 26px 60px -24px rgba(2,6,23,.5),0 8px 20px -14px rgba(2,6,23,.28);padding:18px;margin:auto}
    .x{position:absolute;top:14px;inset-inline-end:14px;border:0;background:none;color:var(--cf-ink-400);cursor:pointer}
    .x:hover{color:var(--cf-ink-900)}
    .hd{text-align:center;margin-bottom:10px}
    .badge{width:38px;height:38px;border-radius:11px;background:color-mix(in srgb,var(--cf-brand-500) 14%,transparent);color:var(--cf-brand-600);display:grid;place-items:center;margin:0 auto 12px;box-shadow:0 8px 20px -10px color-mix(in srgb,var(--cf-brand-600) 70%,transparent)}
    .badge .material-icons{font-size:19px}
    .hd h2{font-size:17px;font-weight:800;letter-spacing:-.01em;color:var(--cf-ink-900);line-height:1.25;max-width:430px;margin:0 auto}
    .hd p{font-size:11.5px;margin-top:4px;max-width:430px;margin-inline:auto}
    .steps{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:11px}
    .st{width:23px;height:23px;border-radius:50%;display:grid;place-items:center;font-size:13px;font-weight:700;background:var(--cf-surface-2);color:var(--cf-ink-500);border:1px solid var(--cf-line)}
    .st.on{background:var(--cf-brand-600);color:#fff;border-color:var(--cf-brand-600)}
    .st.done{background:var(--cf-brand-50);color:var(--cf-brand-600);border-color:var(--cf-brand-200)}
    .st .material-icons{font-size:17px}
    .line{width:40px;height:2px;background:var(--cf-line)}
    .line.fill{background:var(--cf-brand-600)}
    .body{max-height:58vh;overflow:auto;padding-inline:2px}
    .body h3{font-size:13.5px;color:var(--cf-ink-900);margin-bottom:9px}
    .q{display:block;font-size:12.5px;font-weight:700;color:var(--cf-ink-800);margin:13px 0 7px}
    .q:first-of-type{margin-top:0}
    .q.dm{margin-top:11px;padding-top:10px;border-top:1px solid var(--cf-line)}
    .chips{display:flex;flex-wrap:wrap;gap:8px}
    .chips button{padding:7px 13px;border:1px solid var(--cf-line);border-radius:999px;background:var(--cf-surface);color:var(--cf-ink-700);font:inherit;font-size:13px;cursor:pointer;transition:.12s;text-transform:capitalize}
    .chips button:hover{border-color:var(--cf-brand-400)}
    .chips button.on{background:var(--cf-brand-600);border-color:var(--cf-brand-600);color:#fff}
    .tabs{display:flex;gap:5px;background:var(--cf-surface-2);padding:5px;border-radius:12px;margin-bottom:11px;border:1px solid var(--cf-line)}
    .tabs button{flex:1;height:31px;border:0;border-radius:9px;background:none;color:var(--cf-ink-600);font:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:background .14s,color .14s,box-shadow .14s}
    .tabs button.on{background:var(--cf-surface);color:var(--cf-brand-700);box-shadow:var(--cf-shadow-sm)}
    .fld{display:flex;flex-direction:column;gap:5px;font-size:12.5px;font-weight:500;color:var(--cf-ink-600);margin-bottom:8px}
    input{height:36px;border:1px solid var(--cf-line);border-radius:10px;padding:0 12px;font:inherit;font-size:14px;background:var(--cf-surface);color:var(--cf-ink-900);outline:none;width:100%;transition:border-color .14s,box-shadow .14s}
    input:focus{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .row{display:flex;gap:8px;align-items:center}
    .nowrap{white-space:nowrap;flex:none}
    .hint{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--cf-ink-500);margin:8px 0 0}
    .hint .material-icons{font-size:16px;color:var(--cf-brand-500)}
    .dom{align-items:stretch}
    .dom-in{flex:1;display:flex;align-items:center;border:1px solid var(--cf-line);border-radius:10px;background:var(--cf-surface);overflow:hidden;transition:border-color .14s,box-shadow .14s}
    .dom-in:focus-within{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .dom-in input{border:0;box-shadow:none;flex:1;text-align:end}
    .dom-in .suf{padding:0 11px;font-size:13.5px;font-weight:600;color:var(--cf-ink-500);background:var(--cf-surface-2);height:40px;display:grid;place-items:center;white-space:nowrap}
    .dm-ok,.dm-no{display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;margin:10px 0 0}
    .dm-ok{color:#16a34a}.dm-no{color:var(--cf-danger)}
    .dm-ok .material-icons,.dm-no .material-icons{font-size:17px}
    .ft{display:flex;align-items:center;gap:10px;margin-top:11px;padding-top:10px;border-top:1px solid var(--cf-line)}
    .ft .sp{flex:1}
    .sublbl{display:block;font-size:10px;font-weight:600;color:var(--cf-ink-400);text-transform:uppercase;letter-spacing:.04em;margin:6px 0 4px}
    .logo-up{display:flex;gap:11px;align-items:center}
    .logo-prev{width:46px;height:46px;border:1px dashed var(--cf-line);border-radius:11px;display:grid;place-items:center;background:var(--cf-surface-2);overflow:hidden;flex:none}
    .logo-prev img{max-width:100%;max-height:100%;object-fit:contain}
    .logo-prev .material-icons{font-size:21px;color:var(--cf-ink-400)}
    .logo-meta{display:flex;flex-direction:column;gap:7px;align-items:flex-start}
    .logo-meta .cf-btn{display:inline-flex;align-items:center;gap:6px}
    .logo-meta small{font-size:11px;color:var(--cf-ink-500)}
    .lk-rm{border:0;background:none;color:var(--cf-danger);font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;padding:0}
    .swatches{display:flex;flex-wrap:wrap;gap:8px}
    .sw{position:relative;width:28px;height:28px;border-radius:8px;border:1px solid rgba(15,23,42,.12)}
    .sw>button{position:absolute;top:-6px;inset-inline-end:-6px;width:18px;height:18px;border-radius:50%;border:0;background:var(--cf-ink-900);color:#fff;display:none;place-items:center;cursor:pointer;padding:0}
    .sw>button .material-icons{font-size:12px}
    .sw:hover>button{display:grid}
    .sw.add{display:grid;place-items:center;border-style:dashed;background:var(--cf-surface-2);color:var(--cf-ink-500);cursor:pointer;overflow:hidden}
    .sw.add input[type=color]{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
    .sw.add .material-icons{font-size:18px;pointer-events:none}
    .palette-row{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}
    .pdot{position:relative;width:16px;height:16px;border-radius:50%;border:1px solid rgba(15,23,42,.12);cursor:pointer;padding:0;transition:transform .1s}
    .pdot:hover{transform:scale(1.18)}
    .pdot.on{box-shadow:0 0 0 2px var(--cf-surface),0 0 0 4px var(--cf-brand-500)}
    .font-chips{display:flex;flex-wrap:wrap;gap:7px}
    .font-chips button{padding:8px 13px;border:1px solid var(--cf-line);border-radius:10px;background:var(--cf-surface);color:var(--cf-ink-800);font-size:14px;cursor:pointer;transition:.12s}
    .font-chips button:hover{border-color:var(--cf-brand-400)}
    .font-chips button.on{border-color:var(--cf-brand-500);background:var(--cf-brand-50);color:var(--cf-brand-700);box-shadow:inset 0 0 0 1px var(--cf-brand-500)}
    .font-cards{display:flex;flex-wrap:wrap;gap:5px}
    .fcard{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;width:50px;padding:6px 3px 4px;border:1px solid var(--cf-line);border-radius:12px;background:var(--cf-surface);cursor:pointer;transition:transform .12s,border-color .12s,background .12s}
    .fcard:hover{border-color:var(--cf-brand-400);transform:translateY(-1px)}
    .fcard.on{border-color:var(--cf-brand-500);background:var(--cf-brand-50)}
    .fc-spec{font-size:16px;line-height:1;color:var(--cf-ink-900)}
    .fcard.on .fc-spec{color:var(--cf-brand-700)}
    .fc-name{font-size:9px;color:var(--cf-ink-500);text-align:center;line-height:1.2;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
    .fc-tick{position:absolute;top:4px;inset-inline-end:4px;font-size:13px;color:var(--cf-brand-600)}
    .fcard.sm{width:50px;padding:6px 3px 4px}
    .fcard.sm .fc-spec{font-size:16px}
    .font-split{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .fs-col .sublbl{margin-top:0}
    .logo-drop{position:relative;display:grid;place-items:center;width:100%;min-height:84px;border:1.5px dashed var(--cf-line);border-radius:12px;cursor:pointer;overflow:hidden;transition:border-color .14s,box-shadow .14s,transform .12s;background:linear-gradient(45deg,#eef1f6 25%,transparent 25%) -5px 0/10px 10px,linear-gradient(-45deg,#eef1f6 25%,transparent 25%) -5px 0/10px 10px,linear-gradient(45deg,transparent 75%,#eef1f6 75%) 0 0/10px 10px,linear-gradient(-45deg,transparent 75%,#eef1f6 75%) 0 0/10px 10px,var(--cf-surface)}
    .logo-drop:hover{border-color:var(--cf-brand-400)}
    .logo-drop.drag{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring);transform:scale(1.01)}
    .logo-drop img{max-width:80%;max-height:60px;object-fit:contain;filter:drop-shadow(0 4px 10px rgba(15,23,42,.18))}
    .logo-ph{display:flex;flex-direction:column;align-items:center;gap:2px;color:var(--cf-ink-500);text-align:center;padding:6px}
    .logo-ph .material-icons{font-size:23px;color:var(--cf-brand-500)}
    .logo-ph b{font-size:12px;color:var(--cf-ink-800)}
    .logo-ph em{font-size:9.5px;font-style:normal;color:var(--cf-ink-400)}
    .logo-ov{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:5px;font-size:12px;font-weight:600;color:#fff;background:rgba(15,23,42,.55);opacity:0;transition:opacity .14s}
    .logo-ov .material-icons{font-size:17px}
    .logo-drop.has:hover .logo-ov{opacity:1}
    .lk-rm{display:inline-flex;align-items:center;gap:4px;border:0;background:none;color:var(--cf-danger);font:inherit;font-size:11.5px;font-weight:600;cursor:pointer;padding:0;margin-top:7px}
    .lk-rm .material-icons{font-size:14px}
    @media(max-width:540px){.font-split{grid-template-columns:1fr}}
    .kit-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;align-items:start}
    .kit-grid .kit-card{margin-top:0;height:100%}
    .body{max-height:none;overflow:visible}
    @media(max-width:540px){.kit-grid{grid-template-columns:1fr}}
    .kit-card{border:1px solid var(--cf-line);border-radius:12px;padding:9px 10px;margin-top:8px;background:color-mix(in srgb,var(--cf-surface-2) 50%,var(--cf-surface))}
    .kit-h{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;color:var(--cf-ink-800);margin-bottom:8px}
    .kit-h .material-icons{font-size:14px;width:21px;height:21px;display:grid;place-items:center;border-radius:8px;background:color-mix(in srgb,var(--cf-brand-500) 12%,transparent);color:var(--cf-brand-600)}
    .kit-card .sublbl:first-of-type{margin-top:0}
    .fld.lead{margin-bottom:2px}
    .cf-btn .material-icons{font-size:17px}
    .cf-btn:disabled{opacity:.5;cursor:not-allowed;box-shadow:none}
    .ft-skip{border:0;background:none;color:var(--cf-ink-500);font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;padding:8px 8px;border-radius:8px}
    .ft-skip:hover{color:var(--cf-ink-900);background:var(--cf-surface-2)}
  `],
})
export class OnboardingDialogComponent {
  @Output() done = new EventEmitter<void>();
  private alerts = inject(AlertService);
  private brandSvc = inject(BrandService);

  step = signal(1);

  usage = '';
  orgType = '';
  role = '';
  usages = ['Work', 'Personal', 'School'];
  orgTypes = ['Small business', 'Medium business', 'Enterprise', 'School / University', 'Government', 'Other'];
  roles = ['Business analyst', 'Consultant', 'Management', 'Finance', 'Admin / Support', 'Operations', 'IT / Engineering', 'Marketer', 'HR', 'PM', 'Learning', 'Sales'];

  brandMode = signal<'manual' | 'website'>('manual');
  company = '';
  logo = '';
  colors: string[] = ['#4f46e5', '#0f172a', '#f59e0b'];
  presets = ['#4f46e5', '#0f172a', '#b08d2e', '#10b981', '#dc2626', '#0ea5e9', '#7c3aed', '#db2777', '#f59e0b', '#0f9d6b'];
  fontOptions = ['Playfair Display', 'Lora', 'Montserrat', 'Poppins', 'Inter', 'Roboto'];
  fontHeading = 'Playfair Display';
  fontBody = 'Inter';
  website = '';
  domain = '';
  domainStatus = signal<'idle' | 'ok' | 'taken'>('idle');
  logoDrag = signal(false);

  next(): void {
    if (!this.step1Valid()) { this.alerts.warning('Please answer all three questions to continue.'); return; }
    this.step.set(2);
  }
  back(): void { this.step.set(1); }

  step1Valid(): boolean { return !!(this.usage && this.orgType && this.role); }
  finishValid(): boolean { return !!(this.company.trim() && this.cleanDomain()); }

  cleanDomain(): string { return this.domain.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''); }

  onLogo(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.readLogo(input.files?.[0]);
    input.value = '';
  }
  private readLogo(file: File | undefined): void {
    if (!file || !/^image\//.test(file.type)) return;
    const r = new FileReader();
    r.onload = () => (this.logo = String(r.result));
    r.readAsDataURL(file);
  }
  onLogoDragOver(e: DragEvent): void { e.preventDefault(); this.logoDrag.set(true); }
  onLogoDragLeave(e: DragEvent): void { e.preventDefault(); this.logoDrag.set(false); }
  onLogoDrop(e: DragEvent): void { e.preventDefault(); this.logoDrag.set(false); this.readLogo(e.dataTransfer?.files?.[0]); }
  addColorValue(c: string): void {
    const v = (c || '').toLowerCase();
    if (v && !this.colors.includes(v)) this.colors = [...this.colors, v];
  }
  removeColor(i: number): void { this.colors = this.colors.filter((_, k) => k !== i); }

  extract(): void {
    const w = this.website.trim();
    if (!w) { this.alerts.warning('Enter your website first.'); return; }
    const host = w.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
    const name = (host.split('.')[0] || 'brand');
    this.company = name.charAt(0).toUpperCase() + name.slice(1);
    this.domain = name.toLowerCase().replace(/[^a-z0-9-]/g, '');
    this.domainStatus.set('idle');
    this.colors = this.defaultPalette();
    this.fetchLogo(host);
    this.brandMode.set('manual');
    this.alerts.info('Pulled brand details from ' + host + '.');
  }

  /** Try the company logo for a domain (Clearbit), falling back to its favicon. */
  private fetchLogo(host: string): void {
    const clearbit = `https://logo.clearbit.com/${host}?size=256`;
    const favicon = `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
    const probe = new Image();
    probe.onload = () => { this.logo = clearbit; this.sampleLogoColors(host); };
    probe.onerror = () => { this.logo = favicon; this.sampleLogoColors(host); };
    probe.src = clearbit;
  }

  private defaultPalette(): string[] {
    return ['#1f2937', '#b08d2e', '#475569', '#e8edf3'];
  }
  /** Pull the brand's real dominant colours from its logo, fetched through a CORS-friendly image proxy. */
  private sampleLogoColors(host: string): void {
    const wsrv = (src: string) => 'https://images.weserv.nl/?url=' + encodeURIComponent(src) + '&w=80&h=80&fit=inside&output=png';
    const sources = [
      wsrv('ssl:logo.clearbit.com/' + host),
      wsrv('ssl:www.google.com/s2/favicons?domain=' + host + '&sz=128'),
    ];
    const tryAt = (idx: number): void => {
      if (idx >= sources.length) return;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const cols = this.extractColors(img);
        if (cols.length) this.colors = cols; else tryAt(idx + 1);
      };
      img.onerror = () => tryAt(idx + 1);
      img.src = sources[idx];
    };
    tryAt(0);
  }
  /** Average the dominant non-neutral colours in an image into a small palette. */
  private extractColors(img: HTMLImageElement): string[] {
    try {
      const n = 64;
      const c = document.createElement('canvas'); c.width = n; c.height = n;
      const ctx = c.getContext('2d'); if (!ctx) return [];
      ctx.drawImage(img, 0, 0, n, n);
      const d = ctx.getImageData(0, 0, n, n).data;
      const map = new Map<string, { n: number; r: number; g: number; b: number }>();
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
        if (a < 180) continue;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        if (mx > 240 && mn > 232) continue;   // near-white
        if (mx < 26) continue;                 // near-black
        if (mx - mn < 18) continue;            // grayscale
        const key = `${r >> 5}|${g >> 5}|${b >> 5}`;
        const e = map.get(key);
        if (e) { e.n++; e.r += r; e.g += g; e.b += b; } else map.set(key, { n: 1, r, g, b });
      }
      const top = [...map.values()].sort((x, y) => y.n - x.n).slice(0, 3)
        .map((e) => `#${[e.r, e.g, e.b].map((v) => Math.round(v / e.n).toString(16).padStart(2, '0')).join('')}`);
      return top.length ? [...new Set([...top, '#0f172a'])].slice(0, 4) : [];
    } catch { return []; }
  }

  checkDomain(): void {
    const d = this.cleanDomain();
    if (!d) { this.domainStatus.set('idle'); return; }
    const taken = ['certifada', 'app', 'admin', 'test', 'demo', 'www', 'mail', 'api'].includes(d);
    this.domainStatus.set(taken ? 'taken' : 'ok');
  }

  finish(): void {
    if (!this.finishValid()) { this.alerts.warning('Add your company name and domain — or skip for now.'); return; }
    const data = {
      usage: this.usage, orgType: this.orgType, role: this.role,
      company: this.company, logo: this.logo, colors: this.colors, fontHeading: this.fontHeading, fontBody: this.fontBody,
      website: this.website, domain: this.cleanDomain(),
    };
    localStorage.setItem('cf-onboarding', JSON.stringify(data));
    localStorage.setItem('cf-onboarding-done', '1');
    this.mergeBrand(data);
    this.brandSvc.reload();
    const dom = data.domain || 'your-brand';
    this.alerts.success(dom + '.certifada.com is reserved for you!', { title: 'Welcome to Certifada 🎉' });
    this.done.emit();
  }

  skip(): void {
    localStorage.setItem('cf-onboarding-done', '1');
    this.alerts.info('No problem — finish your brand setup anytime in Settings → Brand & domain.');
    this.done.emit();
  }

  private mergeBrand(d: { company: string; logo: string; colors: string[]; fontHeading: string; fontBody: string }): void {
    try {
      const raw = localStorage.getItem('cf-brand');
      const brand: any = raw ? JSON.parse(raw) : {};
      if (d.company) brand.org = d.company;
      if (d.colors?.length) { brand.primary = d.colors[0]; brand.colors = d.colors; }
      if (d.fontHeading) brand.fontHeading = d.fontHeading;
      if (d.fontBody) brand.fontBody = d.fontBody;
      if (d.logo) brand.logo = d.logo;
      localStorage.setItem('cf-brand', JSON.stringify(brand));
    } catch {
      /* ignore */
    }
  }
}
