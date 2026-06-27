import { Component, computed, inject } from '@angular/core';
import { UpgradeService } from '../../../core/services/upgrade.service';
import { PlanService, PlanTier } from '../../../core/services/plan.service';

@Component({
  selector: 'app-upgrade-dialog',
  standalone: true,
  template: `
  @if (up.pending(); as f) {
    <div class="ug-ov" (click)="up.close()">
      <div class="ug" (click)="$event.stopPropagation()">
        <button class="ug-x" (click)="up.close()" aria-label="Close"><span class="material-icons">close</span></button>
        <div class="ug-crown"><span class="material-icons">workspace_premium</span></div>
        <span class="ug-eyebrow">Premium feature</span>
        <h3>{{ plan.featureLabel(f) }}</h3>
        <p>This is included with <b>{{ req()?.name }}</b>. Upgrade your plan to unlock it and more.</p>
        @if (req(); as r) {
          <div class="ug-plan">
            <div class="ug-ptop"><span class="ug-pname"><span class="material-icons">verified</span> {{ r.name }}</span><span class="ug-price">{{ r.monthly === 0 ? 'Free' : '$' + r.monthly }}<small>{{ r.monthly === 0 ? '' : '/mo' }}</small></span></div>
            <ul>@for (feat of topFeatures(r); track feat) { <li><span class="material-icons">check_circle</span>{{ feat }}</li> }</ul>
          </div>
        }
        <div class="ug-acts">
          <button class="cf-btn cf-btn-secondary" (click)="up.close()">Maybe later</button>
          <button class="cf-btn cf-btn-primary" (click)="up.goPricing()"><span class="material-icons">north_east</span> View plans</button>
        </div>
        <div class="ug-cur">You're currently on <b>{{ plan.current().name }}</b></div>
      </div>
    </div>
  }
  `,
  styles: [`
    .ug-ov{position:fixed;inset:0;z-index:200;background:rgba(15,23,42,.55);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);display:grid;place-items:center;padding:22px;animation:ugf .15s ease}
    @keyframes ugf{from{opacity:0}to{opacity:1}}
    .ug{position:relative;width:100%;max-width:420px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:20px;padding:26px 24px 22px;text-align:center;box-shadow:0 34px 90px -24px rgba(2,6,23,.6);animation:ugp .22s cubic-bezier(.2,1.2,.4,1)}
    @keyframes ugp{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}
    .ug-x{position:absolute;top:14px;right:14px;width:32px;height:32px;border-radius:9px;border:1px solid var(--cf-line);background:var(--cf-surface-2);cursor:pointer;display:grid;place-items:center;color:var(--cf-ink-500)}.ug-x .material-icons{font-size:18px}
    .ug-crown{width:62px;height:62px;border-radius:50%;display:grid;place-items:center;margin:2px auto 14px;color:#fff;background:linear-gradient(135deg,#f0d27a,#bd902a);box-shadow:0 12px 26px -8px rgba(189,144,42,.7)}.ug-crown .material-icons{font-size:32px}
    .ug-eyebrow{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#b45309;margin-bottom:6px}
    .ug h3{font-size:20px;font-weight:800;color:var(--cf-ink-900);letter-spacing:-.02em}
    .ug p{font-size:13.5px;color:var(--cf-ink-500);line-height:1.6;margin:8px auto 16px;max-width:330px}
    .ug-plan{text-align:start;border:1px solid var(--cf-line);border-radius:14px;padding:14px 16px;margin-bottom:18px;background:var(--cf-surface-2)}
    .ug-ptop{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
    .ug-pname{display:inline-flex;align-items:center;gap:7px;font-size:15px;font-weight:800;color:var(--cf-ink-900)}.ug-pname .material-icons{font-size:18px;color:var(--cf-brand-600)}
    .ug-price{font-size:20px;font-weight:800;color:var(--cf-ink-900)}.ug-price small{font-size:12px;font-weight:600;color:var(--cf-ink-400)}
    .ug-plan ul{list-style:none;display:flex;flex-direction:column;gap:7px}
    .ug-plan li{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--cf-ink-700)}.ug-plan li .material-icons{font-size:16px;color:#16a34a}
    .ug-acts{display:flex;gap:10px}.ug-acts .cf-btn{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px}.ug-acts .material-icons{font-size:16px}
    .ug-cur{margin-top:14px;font-size:11.5px;color:var(--cf-ink-400)}
  `],
})
export class UpgradeDialogComponent {
  readonly up = inject(UpgradeService);
  readonly plan = inject(PlanService);
  req = computed<PlanTier | undefined>(() => { const f = this.up.pending(); return f ? this.plan.requiredPlan(f) : undefined; });
  topFeatures(r: PlanTier): string[] { return r.features.filter((x) => x.included).slice(0, 5).map((x) => x.value ? `${x.label} (${x.value})` : x.label); }
}
