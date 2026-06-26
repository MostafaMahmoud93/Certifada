import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HasActionDirective } from '../../shared/directives/has-action.directive';
import { Actions } from '../../core/constants/actions';
import { AlertService } from '../../core/services/alert.service';

interface Brand {
  org: string;
  logo: string;
  primary: string;
  colors: string[];
  fontHeading: string;
  fontBody: string;
  footer: string;
  signer: string;
}

const KEY = 'cf-brand';
const DEFAULT: Brand = {
  org: 'Your Organization',
  logo: '',
  primary: '#4f46e5',
  colors: ['#4f46e5', '#0f172a', '#b08d2e', '#10b981'],
  fontHeading: 'Playfair Display',
  fontBody: 'Inter',
  footer: 'This certificate is issued by Your Organization.',
  signer: 'Authorized Signature',
};

@Component({
  selector: 'app-branding',
  standalone: true,
  imports: [FormsModule, HasActionDirective],
  template: `
  <div class="head">
    <div>
      <h1>Branding</h1>
      <p class="cf-muted">Your logo, colors and fonts — applied across certificates and exports.</p>
    </div>
    <button class="cf-btn cf-btn-primary" (click)="save()"
            [appHasAction]="A.Branding_Manage" [tooltipMessage]="'🔒 Branding isn\\'t in your plan.'">
      <span class="material-icons">save</span> Save brand kit
    </button>
  </div>

  <div class="cols">
    <div class="left">
      <div class="card sect">
        <h3>Identity</h3>
        <label class="fld">Organization name<input [(ngModel)]="b.org" placeholder="Your Organization" /></label>
        <span class="fld lbl">Logo</span>
        <div class="logo-row">
          <div class="logo-box">
            @if (b.logo) { <img [src]="b.logo" alt="logo" /> } @else { <span class="material-icons">image</span> }
          </div>
          <div class="logo-acts">
            <label class="cf-btn cf-btn-secondary sm">Upload<input type="file" accept="image/*" hidden (change)="onLogo($event)" /></label>
            @if (b.logo) { <button class="cf-btn cf-btn-secondary sm" (click)="b.logo=''">Remove</button> }
            <small class="cf-muted">PNG or SVG, transparent background works best.</small>
          </div>
        </div>
      </div>

      <div class="card sect">
        <h3>Brand colors</h3>
        <p class="hint">The <b>first</b> color leads your whole theme. The <b>2nd</b> &amp; <b>3rd</b> become accents used in charts, traffic-origin bars and gradients across the app.</p>
        <div class="roles">
          @for (c of b.colors; track $index) {
            <div class="role" [class.lead]="$index === 0">
              <label class="rsw" [style.background]="c">
                @if ($index === 0) { <span class="material-icons crown">star</span> }
                <input type="color" [value]="c" (input)="setColor($index, $any($event.target).value)" />
              </label>
              <div class="rmeta">
                <span class="rname">{{ roleName($index) }}</span>
                <input class="rhex" [ngModel]="c" (ngModelChange)="setColor($index, $event)" maxlength="7" />
              </div>
              <div class="racts">
                @if ($index !== 0) { <button class="ra" (click)="makePrimary($index)" title="Make primary"><span class="material-icons">star_border</span></button> }
                <button class="ra del" (click)="removeColor($index)" title="Remove" [disabled]="b.colors.length <= 1"><span class="material-icons">close</span></button>
              </div>
            </div>
          }
          <label class="role add">
            <span class="rsw addsw"><span class="material-icons">add</span><input type="color" [(ngModel)]="newColor" (change)="addColor()" /></span>
            <span class="addtx">Add another color</span>
          </label>
        </div>

        <div class="bsys" [style.--p]="b.colors[0]" [style.--s]="sec()" [style.--t]="ter()">
          <div class="bsys-grad"><span class="bsys-tag">your brand gradient</span></div>
          <div class="bsys-row">
            <button type="button" class="bsys-btn">Primary action</button>
            <span class="bsys-chip">Accent</span>
            <span class="bsys-bars" title="how analytics bars will look"><i class="b1"></i><i class="b2"></i><i class="b3"></i></span>
          </div>
        </div>
      </div>

      <div class="card sect">
        <h3>Typography</h3>
        <label class="fld">Heading font
          <select [(ngModel)]="b.fontHeading">@for (f of fonts; track f) { <option [value]="f">{{ f }}</option> }</select>
        </label>
        <label class="fld">Body font
          <select [(ngModel)]="b.fontBody">@for (f of fonts; track f) { <option [value]="f">{{ f }}</option> }</select>
        </label>
      </div>

      <div class="card sect">
        <h3>Defaults</h3>
        <label class="fld">Footer text<input [(ngModel)]="b.footer" /></label>
        <label class="fld">Default signer<input [(ngModel)]="b.signer" /></label>
      </div>
    </div>

    <div class="right">
      <div class="card preview">
        <span class="plabel cf-muted">Live preview</span>
        <div class="cert" [style.borderColor]="b.primary">
          <div class="cert-top">
            @if (b.logo) { <img class="cl" [src]="b.logo" alt="" /> }
            <span class="org" [style.fontFamily]="b.fontHeading" [style.color]="b.primary">{{ b.org }}</span>
          </div>
          <div class="cert-title" [style.fontFamily]="b.fontHeading">Certificate of Achievement</div>
          <div class="cert-body" [style.fontFamily]="b.fontBody">This is proudly presented to</div>
          <div class="cert-name" [style.fontFamily]="b.fontHeading" [style.color]="b.primary">Recipient Name</div>
          <div class="cert-pal">@for (c of b.colors; track $index) { <i [style.background]="c"></i> }</div>
          <div class="cert-foot cf-muted" [style.fontFamily]="b.fontBody">{{ b.footer }}</div>
        </div>
      </div>
    </div>
  </div>

  @if (saved()) { <div class="toast">Brand kit saved.</div> }
  `,
  styles: [`
    :host{display:block}
    .head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:18px}
    .head h1{font-size:22px}
    .cf-btn .material-icons{font-size:18px}
    .cols{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start}
    .left{display:flex;flex-direction:column;gap:16px}
    .sect{padding:18px}
    .sect h3{font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--cf-ink-400);margin-bottom:14px}
    .fld{display:flex;flex-direction:column;gap:5px;font-size:12.5px;font-weight:500;color:var(--cf-ink-600);margin-bottom:12px}
    .fld.lbl{margin-bottom:6px}
    .fld:last-child{margin-bottom:0}
    input,select{height:38px;border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);padding:0 10px;font:inherit;font-size:13.5px;background:var(--cf-surface);color:var(--cf-ink-900);outline:none}
    input:focus,select:focus{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .cf-btn.sm{padding:7px 11px;font-size:12.5px}
    .logo-row{display:flex;gap:14px;align-items:center}
    .logo-box{width:96px;height:96px;border:1px dashed var(--cf-line);border-radius:var(--cf-radius-md);display:grid;place-items:center;background:var(--cf-surface-2);overflow:hidden;flex:none}
    .logo-box img{max-width:100%;max-height:100%;object-fit:contain}
    .logo-box .material-icons{font-size:30px;color:var(--cf-ink-400)}
    .logo-acts{display:flex;flex-direction:column;gap:8px;align-items:flex-start}
    .color-pick{display:flex;gap:8px;align-items:center}
    .color-pick input[type=color]{width:42px;height:38px;padding:3px;cursor:pointer}
    .hex{width:120px;text-transform:uppercase}
    .swatches{display:flex;flex-wrap:wrap;gap:8px}
    .sw{position:relative;width:42px;height:42px;border-radius:10px;border:1px solid var(--cf-line)}
    .sw button{position:absolute;top:-6px;inset-inline-end:-6px;width:18px;height:18px;border-radius:50%;border:0;background:var(--cf-ink-900);color:#fff;display:none;place-items:center;cursor:pointer}
    .sw button .material-icons{font-size:12px}
    .sw:hover button{display:grid}
    .sw.add{display:grid;place-items:center;border-style:dashed;background:var(--cf-surface-2);overflow:hidden}
    .sw.add input[type=color]{position:absolute;inset:0;opacity:0;cursor:pointer}
    .sw.add .addbtn{position:static;display:grid;background:none;color:var(--cf-ink-500)}
    .sw.add .addbtn .material-icons{font-size:18px}
    .preview{padding:18px;position:sticky;top:0}
    .plabel{font-size:11.5px;text-transform:uppercase;letter-spacing:.04em}
    .cert{margin-top:12px;border:3px solid var(--cf-brand-600);border-radius:8px;padding:26px 22px;text-align:center;background:var(--cf-surface)}
    .cert-top{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:14px}
    .cl{height:34px;object-fit:contain}
    .org{font-size:18px;font-weight:700}
    .cert-title{font-size:24px;font-weight:700;color:var(--cf-ink-900)}
    .cert-body{font-size:13px;color:var(--cf-ink-500);margin-top:10px}
    .cert-name{font-size:28px;font-weight:700;margin-top:6px}
    .cert-pal{display:flex;justify-content:center;gap:6px;margin:18px 0}
    .cert-pal i{width:26px;height:8px;border-radius:999px}
    .cert-foot{font-size:11px;margin-top:6px}
    .toast{position:fixed;bottom:22px;inset-inline-end:22px;background:var(--cf-ink-900);color:#fff;padding:11px 16px;border-radius:var(--cf-radius-md);box-shadow:var(--cf-shadow-lg);font-size:13.5px;z-index:80}
    .hint{font-size:12px;color:var(--cf-ink-500);margin:-6px 0 13px;line-height:1.55}
    .roles{display:flex;flex-direction:column;gap:8px}
    .role{display:flex;align-items:center;gap:11px;padding:7px;border:1px solid var(--cf-line);border-radius:11px;background:var(--cf-surface);transition:border-color .14s,box-shadow .14s}
    .role.lead{border-color:color-mix(in srgb,var(--cf-brand-500) 42%,var(--cf-line));box-shadow:0 6px 16px -12px color-mix(in srgb,var(--cf-brand-600) 55%,transparent)}
    .role:hover{border-color:color-mix(in srgb,var(--cf-brand-500) 30%,var(--cf-line))}
    .rsw{position:relative;width:42px;height:42px;border-radius:10px;flex:none;border:1px solid rgba(0,0,0,.1);display:grid;place-items:center;cursor:pointer;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(255,255,255,.15)}
    .rsw .crown{font-size:17px;color:#fff;filter:drop-shadow(0 1px 2px rgba(0,0,0,.45))}
    .rsw input[type=color]{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;border:0;padding:0}
    .rmeta{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
    .rname{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--cf-ink-500)}
    .rhex{height:28px!important;border:1px solid var(--cf-line);border-radius:7px;padding:0 8px!important;font-size:12.5px;text-transform:uppercase;width:108px;max-width:120px}
    .racts{display:flex;gap:2px;margin-inline-start:auto}
    .ra{width:28px;height:28px;display:grid;place-items:center;border:0;background:none;border-radius:7px;color:var(--cf-ink-400);cursor:pointer;transition:background .14s,color .14s}
    .ra:hover{background:var(--cf-surface-2);color:var(--cf-brand-600)}
    .ra.del:hover{color:var(--cf-danger)}
    .ra:disabled{opacity:.3;cursor:not-allowed}
    .ra .material-icons{font-size:16px}
    .role.add{cursor:pointer;border-style:dashed}
    .rsw.addsw{position:relative;background:var(--cf-surface-2);color:var(--cf-ink-500);border-style:dashed}
    .rsw.addsw .material-icons{font-size:19px}
    .rsw.addsw input[type=color]{position:absolute;inset:0;opacity:0;cursor:pointer}
    .role.add .addtx{font-size:13px;font-weight:600;color:var(--cf-ink-600)}
    .bsys{margin-top:15px;border:1px solid var(--cf-line);border-radius:13px;overflow:hidden;background:var(--cf-surface)}
    .bsys-grad{position:relative;height:52px;background:linear-gradient(135deg,var(--p),var(--s) 64%,var(--t))}
    .bsys-grad::after{content:'';position:absolute;inset:0;background:radial-gradient(420px 120px at 100% -20%,rgba(255,255,255,.35),transparent 70%)}
    .bsys-tag{position:absolute;bottom:7px;inset-inline-start:12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:rgba(255,255,255,.92);text-shadow:0 1px 4px rgba(0,0,0,.35);z-index:1}
    .bsys-row{display:flex;align-items:center;gap:10px;padding:13px 13px;flex-wrap:wrap}
    .bsys-btn{border:0;border-radius:9px;padding:9px 15px;font:inherit;font-size:12.5px;font-weight:700;color:#fff;background:linear-gradient(135deg,var(--p),var(--s));cursor:default;box-shadow:0 8px 18px -10px var(--p)}
    .bsys-chip{font-size:12px;font-weight:700;padding:6px 12px;border-radius:999px;color:var(--s);background:color-mix(in srgb,var(--s) 15%,transparent);border:1px solid color-mix(in srgb,var(--s) 32%,transparent)}
    .bsys-bars{display:inline-flex;align-items:flex-end;gap:5px;height:28px;margin-inline-start:auto}
    .bsys-bars i{width:10px;border-radius:3px 3px 0 0;display:block}
    .bsys-bars .b1{height:100%;background:var(--p)}.bsys-bars .b2{height:68%;background:var(--s)}.bsys-bars .b3{height:44%;background:var(--t)}
    @media(max-width:880px){.cols{grid-template-columns:1fr}}
  `],
})
export class BrandingPage {
  readonly A = Actions;
  private alerts = inject(AlertService);
  fonts =['Inter', 'Playfair Display', 'Roboto', 'Montserrat', 'Lora', 'Poppins'];
  newColor = '#6366f1';
  saved = signal(false);
  b: Brand = this.load();

  private load(): Brand {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return { ...DEFAULT, colors: [...DEFAULT.colors] };
  }

  onLogo(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => (this.b.logo = String(r.result));
    r.readAsDataURL(file);
  }

  addColor(): void {
    if (this.newColor && !this.b.colors.includes(this.newColor)) { this.b.colors = [...this.b.colors, this.newColor]; if (!this.b.primary) this.b.primary = this.b.colors[0]; }
  }
  removeColor(i: number): void { this.b.colors = this.b.colors.filter((_, k) => k !== i); this.b.primary = this.b.colors[0] || '#4f46e5'; }
  setColor(i: number, val: string): void { const c = [...this.b.colors]; c[i] = val; this.b.colors = c; if (i === 0) this.b.primary = val; }
  makePrimary(i: number): void { const c = [...this.b.colors]; const [m] = c.splice(i, 1); c.unshift(m); this.b.colors = c; this.b.primary = m; }
  roleName(i: number): string { return i === 0 ? 'Primary' : i === 1 ? 'Secondary' : i === 2 ? 'Accent' : 'Extra ' + (i - 2); }
  sec(): string { return this.b.colors[1] || this.b.colors[0] || '#4f46e5'; }
  ter(): string { return this.b.colors[2] || this.sec(); }

  save(): void {
    localStorage.setItem(KEY, JSON.stringify(this.b));
    this.alerts.success('Brand kit saved.', { title: 'Branding' });
  }
}
