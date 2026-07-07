import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ServiceResponse } from '../models/models';

export interface PlanLimits { templates: number; issues: number; }

/** Shape returned by GET api/Plan/GetPricingPlans. */
interface ApiPlanFeature { key: string; label: string; value?: string | null; included: boolean; times?: number | null; sortOrder: number; }
interface ApiPlan {
  id: string; code: string; name: string; blurb: string;
  popular: boolean; trial: boolean; sortOrder: number;
  monthly: number; yearly: number; currency: string;
  features: ApiPlanFeature[];
}
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

export type FeatureKey =
  | 'branding' | 'qr' | 'table' | 'ai' | 'drawing' | 'imageStudio' | 'bgStudio'
  | 'bulk' | 'analytics' | 'multiPage' | 'apiAccess' | 'whiteLabel' | 'sso';

/** Plan rank order, lowest to highest. */
export const PLAN_ORDER = ['Free', 'Basic', 'Professional', 'Enterprise'];

/**
 * The single source of truth mapping every gated feature to the minimum plan that
 * unlocks it. This is the map to mirror on the backend (return the unlocked feature
 * set / plan in the token or plan payload, then the UI gates against it).
 */
export const PLAN_FEATURES: Record<FeatureKey, string> = {
  branding: 'Basic',
  qr: 'Professional', table: 'Professional', ai: 'Professional', drawing: 'Professional',
  imageStudio: 'Professional', bgStudio: 'Professional', bulk: 'Professional',
  analytics: 'Professional', multiPage: 'Professional',
  apiAccess: 'Enterprise', whiteLabel: 'Enterprise', sso: 'Enterprise',
};

/** Human-readable labels for the upgrade dialog / tooltips. */
export const FEATURE_LABELS: Record<FeatureKey, string> = {
  branding: 'Custom branding', qr: 'QR code studio', table: 'Table tool', ai: 'AI design assistant',
  drawing: 'Drawing studio', imageStudio: 'Image studio', bgStudio: 'Background studio',
  bulk: 'Bulk issuing', analytics: 'Advanced analytics', multiPage: 'Multi-page designs',
  apiAccess: 'API access', whiteLabel: 'White-label', sso: 'SSO / SAML',
};

/**
 * Current subscription plan + limits. Backs the Templates usage meter, the Issue
 * flow quota, the dashboard Plan Quotas & Storage card and the Pricing page.
 */
@Injectable({ providedIn: 'root' })
export class PlanService {
  private http = inject(HttpClient);
  readonly plan = signal<string>(this.read());
  readonly billing = signal<'monthly' | 'yearly'>('monthly');
  /**
   * Plan catalogue — starts with the built-in defaults so the page renders
   * instantly, then is replaced by the database catalogue (Plans / PlanPrices /
   * PlanFeatures via api/Plan/GetPricingPlans) as soon as it loads.
   */
  readonly catalog = signal<PlanTier[]>(PLAN_CATALOG);
  /** True once the DB catalogue has loaded. */
  readonly catalogFromDb = signal(false);

  constructor() {
    this.loadCatalog();
    this.syncPlanFromServer();
  }

  /**
   * The DATABASE subscription (TenantPlan via api/Billing/subscription) is the
   * source of truth for the current plan. localStorage is only a cache —
   * without this sync every visitor defaulted to a demo value.
   */
  /** Real trial end (from the server); null until synced. */
  readonly trialEndsAt = signal<Date | null>(null);
  /** True once the 14-day Free Trial has run out (no paid subscription). */
  readonly trialExpired = signal(false);

  private syncPlanFromServer(): void {
    try { if (!localStorage.getItem('access_token')) return; } catch { return; }
    this.http.get<ServiceResponse<{ planCode: string; status: string; currentPeriodEnd?: string | null } | null>>(`${environment.apiURL}/api/Billing/subscription`).subscribe({
      next: (res) => {
        if (!res?.success) return;
        const sub = res.data;
        const st = (sub?.status || '').toLowerCase();
        if (st === 'trialing' || st === 'trial_expired') {
          this.trialEndsAt.set(sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null);
          this.trialExpired.set(st === 'trial_expired');
        } else {
          this.trialExpired.set(false);
        }
        const live = !!sub && ['active', 'trialing', 'canceling', 'past_due'].includes(st);
        const code = live ? sub!.planCode : 'Free';
        this.plan.set(code);
        try { localStorage.setItem('cf-plan', code); } catch { /* ignore */ }
      },
      error: () => { /* offline → keep the cached value */ },
    });
  }

  /** Pull the plan catalogue from the database (falls back silently to the built-in list). */
  loadCatalog(): void {
    this.http.get<ServiceResponse<ApiPlan[]>>(`${environment.apiURL}/api/Plan/GetPricingPlans`).subscribe({
      next: (res) => {
        if (res?.success && res.data?.length) {
          this.catalog.set(res.data.map((p) => this.toTier(p)));
          this.catalogFromDb.set(true);
        }
      },
      error: () => { /* keep the built-in catalogue */ },
    });
  }

  /** Map an API plan to the UI tier shape (numeric quotas come from FeatureTimes; null = unlimited). */
  private toTier(p: ApiPlan): PlanTier {
    const times = (key: string): number => {
      const f = p.features.find((x) => x.key === key);
      if (!f || !f.included) return 0;
      return f.times == null ? Infinity : f.times;
    };
    return {
      id: p.code,
      name: p.name,
      monthly: p.monthly,
      yearly: p.yearly,
      blurb: p.blurb,
      popular: p.popular || undefined,
      trial: p.trial || undefined,
      limits: {
        templates: times('Certificate_Templates'),
        issues: times('Certificates_Per_Month'),
        team: times('Team_Members'),
        storageMB: times('Storage'),
      },
      features: p.features.map((f) => ({ label: f.label, value: f.value || undefined, included: f.included })),
    };
  }

  private read(): string {
    let v = '';
    try { const s = JSON.parse(localStorage.getItem('cf-settings') || '{}'); if (s && s.plan) v = String(s.plan); } catch { /* ignore */ }
    // New accounts start on Free — the real plan is synced from the server right after.
    v = v || localStorage.getItem('cf-plan') || 'Free';
    return PLAN_CATALOG.some((p) => p.id === v) ? v : 'Free';
  }

  current = computed<PlanTier>(() => this.catalog().find((p) => p.id === this.plan()) || this.catalog()[2] || PLAN_CATALOG[2]);
  tier(id: string): PlanTier | undefined { return this.catalog().find((p) => p.id === id); }

  limits(): PlanLimits { const c = this.current().limits; return { templates: c.templates, issues: c.issues }; }
  templateLimit(): number { return this.current().limits.templates; }
  issueLimit(): number { return this.current().limits.issues; }
  storageLimitMB(): number { return this.current().limits.storageMB; }
  isUnlimited(n: number): boolean { return !isFinite(n); }

  price(tier: PlanTier, billing: 'monthly' | 'yearly' = this.billing()): number { return billing === 'yearly' ? tier.yearly : tier.monthly; }
  yearlySave(tier: PlanTier): number { return Math.max(0, tier.monthly * 12 - tier.yearly); }
  priceLabel(): string { const t = this.current(); return t.monthly === 0 ? 'Free' : `$${t.monthly}/monthly`; }
  /** Real trial end from the server, with a display-only fallback before sync. */
  trialEnds(): Date { const real = this.trialEndsAt(); if (real) return real; const d = new Date(); d.setDate(d.getDate() + 14); return d; }

  setPlan(id: string): void { if (this.catalog().some((p) => p.id === id)) { this.plan.set(id); localStorage.setItem('cf-plan', id); } }
  setBilling(b: 'monthly' | 'yearly'): void { this.billing.set(b); }

  // ---- feature entitlements (plan gating) ----
  rank(id: string): number { const i = PLAN_ORDER.indexOf(id); return i < 0 ? 0 : i; }
  /** Does the current plan unlock this feature? Unknown features are allowed. */
  can(feature: FeatureKey): boolean {
    const req = PLAN_FEATURES[feature];
    return !req || this.rank(this.plan()) >= this.rank(req);
  }
  requiredPlanId(feature: FeatureKey): string { return PLAN_FEATURES[feature] || 'Free'; }
  requiredPlan(feature: FeatureKey): PlanTier | undefined { return this.tier(this.requiredPlanId(feature)); }
  featureLabel(feature: FeatureKey): string { return FEATURE_LABELS[feature] || 'this feature'; }
}
