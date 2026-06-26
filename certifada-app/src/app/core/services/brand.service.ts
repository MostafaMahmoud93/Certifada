import { Injectable, signal } from '@angular/core';

export interface BrandKit {
  domain: string;
  org: string;
  logo: string;
  primary: string;
  colors: string[];
  fontHeading: string;
  fontBody: string;
  /** True only when a domain is claimed AND we're on that brand's subdomain. */
  has: boolean;
}

/**
 * The organization's brand kit (logo, colors, fonts) + reserved domain.
 * Backed by the same localStorage keys onboarding and Settings write
 * (`cf-brand`, `cf-onboarding`).
 *
 * The brand only goes "live" (has=true) when the current host is the brand's
 * own subdomain — e.g. binghatti.localhost or binghatti.certifada.com. On a
 * plain host (localhost, certifada.com, www.…) the app stays default Certifada.
 *
 * Co-branding (never full white-label): when active it re-themes the app
 * (--cf-brand-* ramp) and the browser-tab TITLE becomes "Org · Certifada".
 * The Certifada favicon and the Certifada mark/name are always kept — the
 * customer's logo + org name live in the sidebar co-brand block.
 */
@Injectable({ providedIn: 'root' })
export class BrandService {
  readonly kit = signal<BrandKit>(this.read());

  // captured once, so the Certifada tab identity is always restorable
  private idCaptured = false;
  private defaultTitle = 'Certifada';
  private defaultIcon = 'favicon.ico';

  constructor() { this.applyTheme(); this.applyIdentity(); }

  reload(): void {
    this.kit.set(this.read());
    this.applyTheme();
    this.applyIdentity();
  }

  /** Re-skin the app from the brand colour (or revert to the default theme). */
  applyTheme(): void {
    const root = document.documentElement;
    const vars = ['--cf-brand-50', '--cf-brand-100', '--cf-brand-200', '--cf-brand-500', '--cf-brand-600', '--cf-brand-700', '--cf-ring',
      '--cf-accent-50', '--cf-accent-100', '--cf-accent-200', '--cf-accent-500', '--cf-accent-600', '--cf-accent-700',
      '--cf-accent2-50', '--cf-accent2-100', '--cf-accent2-200', '--cf-accent2-500', '--cf-accent2-600', '--cf-accent2-700',
      '--cf-brand-grad', '--cf-brand-grad-soft'];
    const k = this.kit();
    if (!k.has || !this.isHex(k.primary)) { vars.forEach((v) => root.style.removeProperty(v)); return; }
    this.setRamp(k.primary, k.colors);
  }

  /** Apply a specific brand colour ramp to the document (used by the public verify portal,
   *  which is always branded to the issuer regardless of host gating). */
  themeFrom(primary: string, palette?: string[]): void { if (this.isHex(primary)) this.setRamp(primary, palette); }
  private setRamp(p: string, palette?: string[]): void {
    const root = document.documentElement;
    const core = this.usableBrand(p); // clamp white / very-light brand colours so white text stays legible
    this.ramp(root, '--cf-brand', core);
    root.style.setProperty('--cf-ring', `0 0 0 4px ${this.rgba(core, 0.2)}`);

    // secondary + tertiary accents — taken from the brand palette, or harmoniously derived from the primary
    const list = (palette || []).filter((c) => this.isHex(c));
    const sec = this.usableBrand(this.pickAccent(list, p, 1));
    const ter = this.usableBrand(this.pickAccent(list, p, 2));
    this.ramp(root, '--cf-accent', sec);
    this.ramp(root, '--cf-accent2', ter);

    // ready-made brand gradients (primary -> secondary)
    root.style.setProperty('--cf-brand-grad', `linear-gradient(135deg, ${core}, ${sec})`);
    root.style.setProperty('--cf-brand-grad-soft', `linear-gradient(135deg, ${this.shade(core, 0.86)}, ${this.shade(sec, 0.86)})`);
  }
  /** Write a 6-stop tonal ramp (50/100/200/500/600/700) under a CSS-var prefix. */
  private ramp(root: HTMLElement, prefix: string, core: string): void {
    root.style.setProperty(`${prefix}-700`, this.shade(core, -0.16));
    root.style.setProperty(`${prefix}-600`, core);
    root.style.setProperty(`${prefix}-500`, this.shade(core, 0.10));
    root.style.setProperty(`${prefix}-200`, this.shade(core, 0.70));
    root.style.setProperty(`${prefix}-100`, this.shade(core, 0.84));
    root.style.setProperty(`${prefix}-50`, this.shade(core, 0.92));
  }
  /** The n-th palette colour distinct from the primary, else a harmonious hue-shifted fallback. */
  private pickAccent(list: string[], primary: string, n: number): string {
    const distinct = list.filter((c) => c.toLowerCase() !== primary.toLowerCase());
    if (distinct[n - 1]) return distinct[n - 1];
    return this.hueShift(primary, n === 1 ? 150 : 280);
  }
  /** WCAG relative luminance (0 black … 1 white). */
  private luminance(hex: string): number {
    const { r, g, b } = this.toRgb(hex);
    const f = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }
  /** Contrast ratio of white text on the given background colour. */
  private whiteContrast(hex: string): number { return 1.05 / (this.luminance(hex) + 0.05); }
  /** Darken a too-light brand colour (keeping its hue) until white text on it is legible. */
  private usableBrand(hex: string): string {
    if (!this.isHex(hex)) return hex;
    let c = hex; let i = 0;
    while (this.whiteContrast(c) < 3.2 && i++ < 30) c = this.shade(c, -0.08);
    return c;
  }

  /** Co-brand the tab title ("Org · Certifada"); the favicon always stays the Certifada icon. */
  applyIdentity(): void {
    if (typeof document === 'undefined') return;
    const link = this.iconLink();
    if (!this.idCaptured) {
      this.defaultTitle = document.title || 'Certifada';
      this.defaultIcon = link.getAttribute('href') || 'favicon.ico';
      this.idCaptured = true;
    }
    const k = this.kit();
    document.title = (k.has && k.org) ? `${k.org} · ${this.defaultTitle}` : this.defaultTitle;
    // keep the Certifada favicon in all cases — the customer logo lives in the sidebar
    link.setAttribute('href', this.defaultIcon);
    link.setAttribute('type', /\.svg($|\?)/i.test(this.defaultIcon) ? 'image/svg+xml' : 'image/x-icon');
  }

  private iconLink(): HTMLLinkElement {
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    return link;
  }

  private read(): BrandKit {
    let b: any = {};
    let domain = '';
    try { b = JSON.parse(localStorage.getItem('cf-brand') || '{}') || {}; } catch { /* ignore */ }
    try { domain = ((JSON.parse(localStorage.getItem('cf-onboarding') || '{}').domain as string) || '').trim(); } catch { /* ignore */ }
    const colors: string[] = Array.isArray(b.colors) && b.colors.length ? b.colors : (b.primary ? [b.primary] : []);
    return {
      domain,
      org: (b.org || '').trim(),
      logo: b.logo || '',
      primary: b.primary || colors[0] || '#4f46e5',
      colors,
      fontHeading: b.fontHeading || 'Playfair Display',
      fontBody: b.fontBody || 'Inter',
      has: !!domain && this.hostMatchesBrand(domain),
    };
  }

  // ---- host gating ----
  /** Leading DNS label of the current host, or '' for bare hosts (localhost, IPs). */
  private hostSubdomain(): string {
    const host = (typeof window !== 'undefined' ? window.location.hostname : '').toLowerCase().replace(/\.$/, '');
    if (!host || host === 'localhost') return '';
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return '';      // bare IP → no subdomain
    const labels = host.split('.');
    if (labels.length < 2) return '';                          // single label (e.g. "myhost") → none
    return labels[0];
  }
  /** Active only on the brand's own subdomain, e.g. binghatti.localhost / binghatti.certifada.com. */
  private hostMatchesBrand(domain: string): boolean {
    const sub = this.hostSubdomain();
    if (!sub || ['www', 'app', 'admin', 'api', 'mail', 'certifada'].includes(sub)) return false;
    return sub === domain.toLowerCase();
  }

  // ---- colour helpers ----
  private isHex(c: string): boolean { return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c || ''); }
  private toRgb(hex: string): { r: number; g: number; b: number } {
    const h = hex.replace('#', '');
    const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const i = parseInt(n, 16);
    return { r: (i >> 16) & 255, g: (i >> 8) & 255, b: i & 255 };
  }
  private hex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }
  /** amt > 0 lightens toward white, amt < 0 darkens toward black. */
  private shade(hex: string, amt: number): string {
    const { r, g, b } = this.toRgb(hex);
    const target = amt < 0 ? 0 : 255;
    const t = Math.abs(amt);
    return this.hex(r + (target - r) * t, g + (target - g) * t, b + (target - b) * t);
  }
  private rgba(hex: string, a: number): string {
    const { r, g, b } = this.toRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  /** Rotate hue by `deg` degrees, keeping a lively accent saturation/lightness. */
  private hueShift(hex: string, deg: number): string {
    const { r, g, b } = this.toRgb(hex);
    const hsl = this.rgbToHsl(r, g, b);
    hsl.h = (hsl.h + deg / 360 + 1) % 1;
    hsl.s = Math.min(0.85, Math.max(0.5, hsl.s));
    hsl.l = Math.min(0.6, Math.max(0.42, hsl.l));
    const c = this.hslToRgb(hsl.h, hsl.s, hsl.l);
    return this.hex(c.r, c.g, c.b);
  }
  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b); const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return { h, s, l };
  }
  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    let r: number, g: number, b: number;
    if (s === 0) { r = g = b = l; }
    else {
      const hue2rgb = (pp: number, qq: number, t: number) => {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1 / 6) return pp + (qq - pp) * 6 * t;
        if (t < 1 / 2) return qq;
        if (t < 2 / 3) return pp + (qq - pp) * (2 / 3 - t) * 6;
        return pp;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s; const pv = 2 * l - q;
      r = hue2rgb(pv, q, h + 1 / 3); g = hue2rgb(pv, q, h); b = hue2rgb(pv, q, h - 1 / 3);
    }
    return { r: r * 255, g: g * 255, b: b * 255 };
  }
}
