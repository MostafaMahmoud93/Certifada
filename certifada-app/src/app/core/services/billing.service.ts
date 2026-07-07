import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CheckoutResult { url: string; sessionId: string; }
export interface ChangePlanResult { success: boolean; checkoutRequired: boolean; checkoutUrl?: string | null; message: string; }
export interface SubscriptionView {
  planCode: string; planName: string; interval: string; status: string;
  amount: number; currency: string; currentPeriodEnd?: string | null; cancelAt?: string | null;
  /** Scheduled downgrade: plan that takes effect at scheduledChangeOn. */
  pendingPlanCode?: string | null; scheduledChangeOn?: string | null;
}
export interface BillingHistoryItem {
  id: string; planCode: string; status: string; amount: number; currency: string;
  interval?: string | null; description?: string | null; createdOn: string;
}
interface Resp<T> { success: boolean; data?: T; message?: string; }

const PENDING_KEY = 'cf-pending-plan';

/**
 * Stripe billing bridge: checkout redirects, upgrade/downgrade, subscription
 * state and billing history — plus the "pending plan" chosen before signup
 * (kept locally so we can send the user to payment right after email
 * verification).
 */
@Injectable({ providedIn: 'root' })
export class BillingService {
  private http = inject(HttpClient);
  private url = environment.apiURL;

  checkout(planCode: string, interval: 'monthly' | 'yearly'): Observable<Resp<CheckoutResult>> {
    return this.http.post<Resp<CheckoutResult>>(`${this.url}/api/Billing/checkout`, { planCode, interval });
  }
  changePlan(planCode: string, interval: 'monthly' | 'yearly'): Observable<Resp<ChangePlanResult>> {
    return this.http.post<Resp<ChangePlanResult>>(`${this.url}/api/Billing/change-plan`, { planCode, interval });
  }
  /** Confirm a paid Checkout session (success page) — persists the subscription without webhooks. */
  confirmCheckout(sessionId: string): Observable<Resp<{ success: boolean; planCode: string; message: string }>> {
    return this.http.post<Resp<{ success: boolean; planCode: string; message: string }>>(
      `${this.url}/api/Billing/confirm-checkout?sessionId=${encodeURIComponent(sessionId)}`, {});
  }
  subscription(): Observable<Resp<SubscriptionView | null>> {
    return this.http.get<Resp<SubscriptionView | null>>(`${this.url}/api/Billing/subscription`);
  }
  history(): Observable<Resp<BillingHistoryItem[]>> {
    return this.http.get<Resp<BillingHistoryItem[]>>(`${this.url}/api/Billing/history`);
  }
  portal(returnUrl: string): Observable<Resp<{ url: string | null }>> {
    return this.http.post<Resp<{ url: string | null }>>(`${this.url}/api/Billing/portal?returnUrl=${encodeURIComponent(returnUrl)}`, {});
  }

  // ---- plan chosen before the account exists (register → verify → pay) ----
  setPendingPlan(code: string, interval: 'monthly' | 'yearly'): void {
    try { localStorage.setItem(PENDING_KEY, JSON.stringify({ code, interval })); } catch { /* ignore */ }
  }
  pendingPlan(): { code: string; interval: 'monthly' | 'yearly' } | null {
    try { const v = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null'); return v?.code ? v : null; } catch { return null; }
  }
  clearPendingPlan(): void {
    try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
  }
}
