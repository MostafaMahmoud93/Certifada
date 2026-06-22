import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

type SessionView = {
  id: string;
  status?: string | null;
  paymentStatus?: string | null;
  customerEmail?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  priceIds?: string[];
};

@Component({
  selector: 'app-billing-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <section class="max-w-2xl mx-auto p-6">
    <h2 class="text-2xl font-bold">🎉 Payment successful!</h2>
    <p class="text-gray-600 mt-2">
      Thanks! Your subscription is active (or will activate at trial end).
    </p>

    <div class="mt-6 rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
      <div class="text-sm text-gray-500">Checkout Session ID</div>
      <div class="font-mono text-sm break-all">{{ sessionId || 'N/A' }}</div>
    </div>

    <!-- Optional details pulled from your API -->
    <div class="mt-6" *ngIf="loading">Loading details…</div>
    <div class="mt-6 text-red-600" *ngIf="error">{{ error }}</div>

    <div class="mt-6 grid gap-4 md:grid-cols-2" *ngIf="details">
      <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
        <div class="text-sm text-gray-500">Status</div>
        <div class="font-medium">{{ details.status ?? '—' }}</div>
      </div>
      <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
        <div class="text-sm text-gray-500">Payment status</div>
        <div class="font-medium">{{ details.paymentStatus ?? '—' }}</div>
      </div>
      <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
        <div class="text-sm text-gray-500">Customer email</div>
        <div class="font-medium">{{ details.customerEmail ?? '—' }}</div>
      </div>
      <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
        <div class="text-sm text-gray-500">Subscription</div>
        <div class="font-mono text-xs break-all">{{ details.subscriptionId ?? '—' }}</div>
      </div>
      <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
        <div class="text-sm text-gray-500">Amount total</div>
        <div class="font-medium">
          {{ details.amountTotal ?? '—' }}
          <span *ngIf="details.currency" class="text-gray-500">{{ details.currency }}</span>
        </div>
      </div>
      <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
        <div class="text-sm text-gray-500">Price IDs</div>
        <div class="font-mono text-xs break-all">
          <ng-container *ngIf="details.priceIds?.length; else noPrices">
            <div *ngFor="let p of details.priceIds">{{ p }}</div>
          </ng-container>
          <ng-template #noPrices>—</ng-template>
        </div>
      </div>
    </div>

    <div class="mt-8 flex gap-3">
      <a routerLink="/" class="px-4 py-2 rounded-xl bg-indigo-600 text-white">Go to dashboard</a>
      <a routerLink="/" class="px-4 py-2 rounded-xl bg-slate-200">Back to pricing</a>
    </div>
  </section>
  `,
})
export class BillingSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);

  sessionId = '';
  loading = false;
  error: string | null = null;
  details: SessionView | null = null;

  async ngOnInit() {
    // 1) “Catch” the session id that Stripe appended to your success URL
    this.sessionId = this.route.snapshot.queryParamMap.get('session_id') ?? '';

    // 2) Optional: fetch the session details from your API to show confirmation
    if (!this.sessionId) return;
    this.loading = true;
    try {
      const resp = await fetch(`/api/billing/session/${encodeURIComponent(this.sessionId)}`);
      if (!resp.ok) throw new Error(await resp.text());
      this.details = await resp.json(); // matches DTO from the API below
    } catch (e: any) {
      this.error = e?.message ?? 'Failed to load session details.';
    } finally {
      this.loading = false;
    }
  }
}
