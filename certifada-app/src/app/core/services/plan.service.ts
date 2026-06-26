import { Injectable, computed, signal } from '@angular/core';

export interface PlanLimits { templates: number; issues: number; }
export interface PlanFeature { label: string; value?: string; included: boolean; }
export interface PlanTier {
  id: string;
  name: string;
  monthly: number;          // USD / month (0 = free)
  yearly: number;           // USD / year
  blurb: string;
  popular?: boolean;
  trial?: boolean;
  limits: { templates: number; issues: number; team: number; storageMB: number };
  features: PlanFeature[];
}

/** The public plan catalogue (drives the Pricing page + dashboard quotas). */
export const PLAN_CATALOG: PlanTier[] = [
  {
    id: 'Free', name: 'Free Trial', monthly: 0, yearly: 0, trial: true,
    blurb: 'Try our platform free for 14 days',
    limits: { templates: 3, issues: 50, team: 1, storageMB: 10 },
    features: [
      { label: 'Certificate Templates', value: '3', included: true },
      { label: 'Certificates per Month', value: '50', included: true },
      { label: 'Team Members', value: '1', included: true },
      { label: 'Storage', value: '10 MB', included: true },
      { label: 'Custom Branding', included: false },
      { label: 'API Access', included: false },
      { label: 'Priority Support', included: false },
      { label: 'QR Code Verification', included: false },
    ],
  },
  {
    id: 'Basic', name: 'Basic', monthly: 19, yearly: 190,
    blurb: 'Perfect for small organizations',
    limits: { templates: 10, issues: 500, team: 3, storageMB: 1024 },
    features: [
      { label: 'Certificate Templates', value: '10', included: true },
      { label: 'Certificates per Month', value: '500', included: true },
      { label: 'Team Members', value: '3', included: true },
      { label: 'Storage', value: '1 GB', included: true },
      { label: 'Custom Branding', included: true },
      { label: 'API Access', included: false },
      { label: 'Priority Support', included: false },
      { label: 'QR Code Verification', included: true },
      { label: 'Email Support', included: true },
    ],
  },
  {
    id: 'Professional', name: 'Professional', monthly: 49, yearly: 490, popular: true,
    blurb: 'For growing teams and businesses',
    limits: { templates: 50, issues: 5000, team: 10, storageMB: 10240 },
    features: [
      { label: 'Certificate Templates', value: '50', included: true },
      { label: 'Certificates per Month', value: '5,000', included: true },
      { label: 'Team Members', value: '10', included: true },
      { label: 'Storage', value: '10 GB', included: true },
      { label: 'Custom Branding', included: true },
      { label: 'API Access', included: true },
      { label: 'Priority Support', included: true },
      { label: 'QR Code Verification', included: true },
      { label: 'Bulk Certificate Generation', included: true },
      { label: 'Advanced Analytics', included: true },
    ],
  },
  {
    id: 'Enterprise', name: 'Enterprise', monthly: 99, yearly: 990,
    blurb: 'Unlimited power for large organizations',
    limits: { templates: Infinity, issues: Infinity, team: Infinity, storageMB: Infinity },
    features: [
      { label: 'Certificate Templates', value: 'Unlimited', included: true },
      { label: 'Certificates per Month', value: 'Unlimited', included: true },
      { label: 'Team Members', value: 'Unlimited', included: true },
      { label: 'Storage', value: 'Unlimited', included: true },
      { label: 'Custom Branding', included: true },
      { label: 'API Access', included: true },
      { label: 'Priority Support', value: '24/7', included: true },
      { label: 'QR Code Verification', included: true },
      { label: 'Bulk Certificate Generation', included: true },
      { label: 'Advanced Analytics', included: true },
      { label: 'White-label Solution', included: true },
      { label: 'SSO / SAML', included: true },
      { label: 'Dedicated Account Manager', included: true },
    ],
  },
];

/**
 * Current subscription plan + limits. Backs the Templates usage meter, the Issue
 * flow quota, the dashboard Plan Quotas & Storage card and the Pricing page.
 */
@Injectable({ providedIn: 'root' })
export class PlanService {
  readonly plan = signal<string>(this.read());
  readonly billing = signal<'monthly' | 'yearly'>('monthly');
  readonly catalog = PLAN_CATALOG;

  private read(): string {
    let v = '';
    try { const s = JSON.parse(localStorage.getItem('cf-settings') || '{}'); if (s && s.plan) v = String(s.plan); } catch { /* ignore */ }
    v = v || localStorage.getItem('cf-plan') || 'Professional';
    return PLAN_CATALOG.some((p) => p.id === v) ? v : 'Professional';
  }

  current = computed<PlanTier>(() => PLAN_CATALOG.find((p) => p.id === this.plan()) || PLAN_CATALOG[2]);
  tier(id: string): PlanTier | undefined { return PLAN_CATALOG.find((p) => p.id === id); }

  limits(): PlanLimits { const c = this.current().limits; return { templates: c.templates, issues: c.issues }; }
  templateLimit(): number { return this.current().limits.templates; }
  issueLimit(): number { return this.current().limits.issues; }
  storageLimitMB(): number { return this.current().limits.storageMB; }
  isUnlimited(n: number): boolean { return !isFinite(n); }

  price(tier: PlanTier, billing: 'monthly' | 'yearly' = this.billing()): number { return billing === 'yearly' ? tier.yearly : tier.monthly; }
  yearlySave(tier: PlanTier): number { return Math.max(0, tier.monthly * 12 - tier.yearly); }
  priceLabel(): string { const t = this.current(); return t.monthly === 0 ? 'Free' : `$${t.monthly}/monthly`; }
  /** Trial end = 14 days from now (display only). */
  trialEnds(): Date { const d = new Date(); d.setDate(d.getDate() + 14); return d; }

  setPlan(id: string): void { if (PLAN_CATALOG.some((p) => p.id === id)) { this.plan.set(id); localStorage.setItem('cf-plan', id); } }
  setBilling(b: 'monthly' | 'yearly'): void { this.billing.set(b); }
}
