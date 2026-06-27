import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PlanService, FeatureKey } from './plan.service';

/** Drives the "Upgrade to unlock" dialog raised when a plan-locked feature is used. */
@Injectable({ providedIn: 'root' })
export class UpgradeService {
  private plan = inject(PlanService);
  private router = inject(Router);
  readonly pending = signal<FeatureKey | null>(null);

  open(feature: FeatureKey): void { this.pending.set(feature); }
  close(): void { this.pending.set(null); }
  goPricing(): void { this.close(); this.router.navigateByUrl('/pricing'); }
}
