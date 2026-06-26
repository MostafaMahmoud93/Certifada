import { Injectable, signal } from '@angular/core';

export interface PlanLimits { templates: number; issues: number; }

/** Per-tier limits. Infinity = unlimited. */
const PLANS: Record<string, PlanLimits> = {
  Free: { templates: 3, issues: 100 },
  Standard: { templates: 25, issues: 2000 },
  Pro: { templates: 200, issues: 50000 },
  Enterprise: { templates: Infinity, issues: Infinity },
};

/**
 * Current subscription plan + its limits. Used by the Templates page usage meter
 * (templates created vs. allowed) and the Issue flow (issues this period).
 * Plan name is read from settings/onboarding; defaults to Standard.
 */
@Injectable({ providedIn: 'root' })
export class PlanService {
  readonly plan = signal<string>(this.read());

  private read(): string {
    try { const s = JSON.parse(localStorage.getItem('cf-settings') || '{}'); if (s && s.plan) return String(s.plan); } catch { /* ignore */ }
    return localStorage.getItem('cf-plan') || 'Standard';
  }

  limits(): PlanLimits { return PLANS[this.plan()] || PLANS['Standard']; }
  templateLimit(): number { return this.limits().templates; }
  issueLimit(): number { return this.limits().issues; }
  isUnlimited(n: number): boolean { return !isFinite(n); }
  setPlan(p: string): void { this.plan.set(p); localStorage.setItem('cf-plan', p); }
}
