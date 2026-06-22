import { Component, EventEmitter, Input, Output, Signal, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';

type Interval = 'month' | 'year';
type RegionCode = 'AE' | 'US'; // add more if needed

interface Tier {
  amount: number;          // numeric amount
  currency: string;        // 'AED' | 'USD' | ...
  productId: string; // Stripe product_... (optional)
  priceId: string;         // Stripe price_... (matching interval+region)
}

export interface Plan {
  id: string;
  title: string;
  blurb: string;
  highlight?: boolean;
  badge?: string;
  features: string[];
  tiers: Record<RegionCode, Record<Interval, Tier>>;  // region → interval → tier
}

export interface Region {
  code: RegionCode;
  label: string;
}

@Component({
  selector: 'app-pricing-table',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './pricing-table.component.html',
})
export class PricingTableComponent {
  @Input({ required: true }) plans: Plan[] = [];
  @Input() regions: Region[] = [
    { code: 'AE', label: 'United Arab Emirates (AED)' },
    { code: 'US', label: 'United States (USD)' },
  ];

  @Output() choose = new EventEmitter<{
    planId: string;
    interval: Interval;
    region: RegionCode;
    productId: string;
    priceId: string;
  }>();

  // Defaults (you can set from parent if you want)
  private _interval = signal<Interval>('month');
  private _region = signal<RegionCode>('AE');

  interval = () => this._interval();
  region = () => this._region();

  setInterval(v: Interval) { this._interval.set(v); }
  setRegion(v: RegionCode) { this._region.set(v); }

  // Find the tier for the current region+interval
  tier = (plan: Plan): Tier | null => {
    const reg = this._region();
    const intv = this._interval();
    return plan.tiers?.[reg]?.[intv] ?? null;
  };

  onRegionChange(evt: Event) {
    const code = (evt.target as HTMLSelectElement).value as RegionCode;
    this.setRegion(code);
  }

  // % discount for this plan when on yearly (vs 12 * monthly)
  discount(plan: Plan): number {
    const reg = this._region();
    const monthly = plan.tiers?.[reg]?.['month'];
    const yearly  = plan.tiers?.[reg]?.['year'];
    if (!monthly || !yearly) return 0;
    const full = monthly.amount * 12;
    if (full <= 0) return 0;
    return Math.max(0, Math.round((1 - yearly.amount / full) * 100));
  }

  // best discount across plans (to show on the yearly button)
  bestDiscount: Signal<number> = computed(() => {
    const reg = this._region();
    let best = 0;
    for (const p of this.plans) {
      const m = p.tiers?.[reg]?.month;
      const y = p.tiers?.[reg]?.year;
      if (m && y) {
        const d = Math.max(0, Math.round((1 - y.amount / (m.amount * 12)) * 100));
        best = Math.max(best, d);
      }
    }
    return best;
  });

  selectPlan(plan: Plan) {
    const t = this.tier(plan);
    if (!t) return;
    // No API calls here — just emit the selection so you can wire Checkout later.
    this.choose.emit({
      planId: plan.id,
      interval: this._interval(),
      region: this._region(),
      productId: t.productId,
      priceId: t.priceId,
    });
  }
}
