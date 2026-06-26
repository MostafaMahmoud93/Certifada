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
    const vars = ['--cf-brand-50', '--cf-brand-100', '--cf-brand-200', '--cf-brand-500', '--cf-brand-600', '--cf-brand-700', '--cf-ring'];
    const k = this.kit();
    if (!k.has || !this.isHex(k.primary)) { vars.forEach((v) => root.style.removeProperty(v)); return; }
    this.setRamp(k.primary);
  }

  /** Apply a specific brand colour ramp to the document (used by the public verify portal,
   *  which is always branded to the issuer regardless of host gating). */
  themeFrom(primary: string): void { if (this.isHex(primary)) this.setRamp(primary); }
  private setRamp(p: string): void {
    const root = document.documentElement;
    root.style.setProperty('--cf-brand-700', this.shade(p, -0.16));
    root.style.setProperty('--cf-brand-600', p);
    root.style.setProperty('--cf-brand-500', this.shade(p, 0.10));
    root.style.setProperty('--cf-brand-200', this.shade(p, 0.70));
    root.style.setProperty('--cf-brand-100', this.shade(p, 0.84));
    root.style.setProperty('--cf-brand-50', this.shade(p, 0.92));
    root.style.setProperty('--cf-ring', `0 0 0 4px ${this.rgba(p, 0.2)}`);
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
}
