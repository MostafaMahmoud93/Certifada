import { Component, inject } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { AlertService, AlertType } from '../../../core/services/alert.service';

@Component({
  selector: 'app-alert-host',
  standalone: true,
  animations: [
    trigger('toast', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(120%)' }),
        animate('260ms cubic-bezier(.21,1.02,.73,1)', style({ opacity: 1, transform: 'none' })),
      ]),
      transition(':leave', [animate('170ms ease-in', style({ opacity: 0, transform: 'translateX(120%)' }))]),
    ]),
    trigger('fade', [
      transition(':enter', [style({ opacity: 0 }), animate('140ms ease-out', style({ opacity: 1 }))]),
      transition(':leave', [animate('120ms ease-in', style({ opacity: 0 }))]),
    ]),
    trigger('pop', [
      transition(':enter', [style({ opacity: 0, transform: 'scale(.94) translateY(6px)' }), animate('170ms cubic-bezier(.21,1.02,.73,1)', style({ opacity: 1, transform: 'none' }))]),
      transition(':leave', [animate('120ms ease-in', style({ opacity: 0, transform: 'scale(.97)' }))]),
    ]),
  ],
  template: `
  <div class="stack">
    @for (a of alerts.alerts(); track a.id) {
      <div class="toast" [@toast]
           [class.success]="a.type==='success'" [class.error]="a.type==='error'"
           [class.info]="a.type==='info'" [class.warning]="a.type==='warning'" role="status">
        <span class="ico"><span class="material-icons">{{ icon(a.type) }}</span></span>
        <div class="body">
          @if (a.title) { <strong class="t">{{ a.title }}</strong> }
          <span class="m">{{ a.message }}</span>
        </div>
        <button class="x" (click)="alerts.dismiss(a.id)" aria-label="Dismiss"><span class="material-icons">close</span></button>
        @if (a.duration > 0) {
          <span class="bar" [style.animationDuration.ms]="a.duration" (animationend)="alerts.dismiss(a.id)"></span>
        }
      </div>
    }
  </div>

  @if (alerts.confirmState(); as c) {
    <div class="ov" [@fade] (click)="alerts.resolveConfirm(false)">
      <div class="dlg" [@pop] (click)="$event.stopPropagation()">
        <div class="dic" [class.danger]="c.danger"><span class="material-icons">{{ c.danger ? 'warning_amber' : 'help_outline' }}</span></div>
        @if (c.title) { <h3>{{ c.title }}</h3> }
        <p>{{ c.message }}</p>
        <div class="acts">
          <button class="b sec" (click)="alerts.resolveConfirm(false)">{{ c.cancelText || 'Cancel' }}</button>
          <button class="b" [class.prim]="!c.danger" [class.dang]="c.danger" (click)="alerts.resolveConfirm(true)">{{ c.confirmText || 'Confirm' }}</button>
        </div>
      </div>
    </div>
  }
  `,
  styles: [`
    :host{position:fixed;inset:0;z-index:95;pointer-events:none}
    .stack{position:absolute;top:16px;inset-inline-end:16px;display:flex;flex-direction:column;gap:10px;width:350px;max-width:calc(100vw - 32px)}
    .toast{--ac:var(--cf-brand-600);position:relative;display:flex;align-items:flex-start;gap:11px;padding:13px 13px 13px 14px;background:var(--cf-surface);border:1px solid var(--cf-line);border-inline-start:3px solid var(--ac);border-radius:var(--cf-radius-md);box-shadow:var(--cf-shadow-lg);overflow:hidden;pointer-events:auto}
    .toast.success{--ac:#16a34a}
    .toast.error{--ac:var(--cf-danger)}
    .toast.info{--ac:var(--cf-brand-600)}
    .toast.warning{--ac:#f59e0b}
    .ico{flex:none;width:24px;height:24px;display:grid;place-items:center;color:var(--ac)}
    .ico .material-icons{font-size:21px}
    .body{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;padding-top:1px}
    .body .t{font-size:13.5px;font-weight:700;color:var(--cf-ink-900)}
    .body .m{font-size:13px;line-height:1.45;color:var(--cf-ink-700);word-break:break-word}
    .x{flex:none;width:24px;height:24px;border:0;background:none;color:var(--cf-ink-400);display:grid;place-items:center;cursor:pointer;border-radius:6px}
    .x:hover{background:var(--cf-surface-2);color:var(--cf-ink-900)}
    .x .material-icons{font-size:16px}
    .bar{position:absolute;bottom:0;inset-inline-start:0;height:3px;width:100%;background:var(--ac);opacity:.5;transform-origin:left;animation:cf-shrink linear forwards}
    .toast:hover .bar{animation-play-state:paused}
    @keyframes cf-shrink{from{transform:scaleX(1)}to{transform:scaleX(0)}}

    .ov{position:absolute;inset:0;background:rgba(2,6,23,.5);display:grid;place-items:center;padding:20px;pointer-events:auto}
    .dlg{width:100%;max-width:400px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:var(--cf-radius-lg);box-shadow:var(--cf-shadow-lg);padding:24px;text-align:center}
    .dic{width:52px;height:52px;border-radius:50%;margin:0 auto 14px;display:grid;place-items:center;background:var(--cf-brand-50);color:var(--cf-brand-600)}
    .dic.danger{background:var(--cf-danger-soft);color:var(--cf-danger)}
    .dic .material-icons{font-size:28px}
    .dlg h3{font-size:17px;color:var(--cf-ink-900);margin-bottom:6px}
    .dlg p{font-size:13.5px;color:var(--cf-ink-600);line-height:1.5}
    .acts{display:flex;gap:10px;margin-top:20px}
    .b{flex:1;height:40px;border-radius:var(--cf-radius-sm);font:inherit;font-size:13.5px;font-weight:500;cursor:pointer;border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-700)}
    .b.sec:hover{background:var(--cf-surface-2)}
    .b.prim{background:var(--cf-brand-600);border-color:var(--cf-brand-600);color:#fff}
    .b.prim:hover{background:var(--cf-brand-700)}
    .b.dang{background:var(--cf-danger);border-color:var(--cf-danger);color:#fff}
    .b.dang:hover{filter:brightness(.94)}
    @media(max-width:520px){.stack{inset-inline:16px;width:auto}}
  `],
})
export class AlertHost {
  alerts = inject(AlertService);
  icon(t: AlertType): string {
    return t === 'success' ? 'check_circle' : t === 'error' ? 'error' : t === 'warning' ? 'warning' : 'info';
  }
}
