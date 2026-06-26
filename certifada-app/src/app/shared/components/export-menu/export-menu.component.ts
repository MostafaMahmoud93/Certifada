import { Component, EventEmitter, HostListener, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Reusable, creative "Export" split button — styled Excel workbook or raw CSV. */
@Component({
  selector: 'app-export-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="exp" [class.open]="open()">
    <button class="trigger" [class.dis]="disabled" [disabled]="disabled" (click)="toggle($event)" title="Export data">
      <span class="t-ic"><span class="material-icons">ios_share</span></span>
      <span class="t-lbl">Export</span>
      <span class="material-icons chev">expand_more</span>
      <span class="sheen"></span>
    </button>
    @if (open()) {
      <div class="menu" (click)="$event.stopPropagation()">
        <div class="m-head"><span class="material-icons">download</span> Download as</div>
        <button class="opt" (click)="pick('excel')" style="--d:.02s">
          <span class="oic xls"><span class="material-icons">grid_on</span></span>
          <span class="ot"><b>Excel workbook</b><small>.xlsx · styled, branded report</small></span>
          <span class="material-icons go">arrow_forward</span>
        </button>
        <button class="opt" (click)="pick('csv')" style="--d:.06s">
          <span class="oic csv"><span class="material-icons">description</span></span>
          <span class="ot"><b>CSV file</b><small>.csv · raw data, any tool</small></span>
          <span class="material-icons go">arrow_forward</span>
        </button>
      </div>
    }
  </div>
  `,
  styles: [`
    .exp{position:relative;display:inline-block}

    /* ---------- trigger ---------- */
    .trigger{
      position:relative;display:inline-flex;align-items:center;gap:8px;
      height:38px;padding:0 13px 0 6px;border-radius:11px;cursor:pointer;
      font:inherit;font-size:13px;font-weight:600;color:var(--cf-ink-700);
      border:1px solid var(--cf-line);
      background:linear-gradient(180deg,var(--cf-surface),var(--cf-surface-2));
      box-shadow:0 1px 2px rgba(15,23,42,.05);
      overflow:hidden;transition:border-color .16s,box-shadow .16s,transform .12s,color .16s}
    .trigger:hover:not(.dis){
      border-color:color-mix(in srgb,var(--cf-brand-500) 42%,var(--cf-line));
      color:var(--cf-brand-700);transform:translateY(-1px);
      box-shadow:0 9px 22px -12px color-mix(in srgb,var(--cf-brand-600) 70%,transparent)}
    .trigger:active:not(.dis){transform:translateY(0) scale(.97)}
    .trigger.dis{opacity:.5;cursor:not-allowed}
    .exp.open .trigger{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring);color:var(--cf-brand-700)}

    .t-ic{width:27px;height:27px;border-radius:8px;display:grid;place-items:center;flex:none;
      background:linear-gradient(135deg,var(--cf-brand-500),var(--cf-brand-700));color:#fff;
      box-shadow:0 4px 9px -4px color-mix(in srgb,var(--cf-brand-600) 85%,transparent)}
    .t-ic .material-icons{font-size:15px;transition:transform .3s cubic-bezier(.2,1.4,.4,1)}
    .trigger:hover:not(.dis) .t-ic .material-icons{transform:translateY(-2px)}
    .t-lbl{letter-spacing:.01em}
    .chev{font-size:18px;color:var(--cf-ink-400);transition:transform .22s,color .16s}
    .exp.open .chev{transform:rotate(180deg);color:var(--cf-brand-600)}

    .sheen{position:absolute;top:0;left:-60%;width:38%;height:100%;pointer-events:none;opacity:0;
      transform:skewX(-18deg);background:linear-gradient(100deg,transparent,rgba(255,255,255,.5),transparent)}
    .trigger:hover:not(.dis) .sheen{animation:sheen .7s ease}
    @keyframes sheen{0%{left:-60%;opacity:0}28%{opacity:1}100%{left:135%;opacity:0}}

    /* ---------- menu ---------- */
    .menu{position:absolute;top:calc(100% + 8px);inset-inline-end:0;min-width:262px;
      background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:14px;
      box-shadow:0 24px 52px -18px rgba(2,6,23,.46);padding:6px;z-index:60;
      animation:exp-in .17s cubic-bezier(.2,1,.3,1)}
    @keyframes exp-in{from{opacity:0;transform:translateY(-8px) scale(.97)}to{opacity:1;transform:none}}
    .m-head{display:flex;align-items:center;gap:5px;font-size:10.5px;font-weight:700;text-transform:uppercase;
      letter-spacing:.06em;color:var(--cf-ink-400);padding:7px 10px 6px}
    .m-head .material-icons{font-size:13px}

    .opt{display:flex;align-items:center;gap:11px;width:100%;border:0;background:none;padding:9px;
      border-radius:11px;cursor:pointer;text-align:start;transition:background .13s;
      animation:opt-in .22s ease backwards;animation-delay:var(--d,0s)}
    @keyframes opt-in{from{opacity:0;transform:translateX(6px)}to{opacity:1;transform:none}}
    .opt:hover{background:var(--cf-surface-2)}
    .oic{width:37px;height:37px;border-radius:10px;display:grid;place-items:center;flex:none;transition:transform .16s}
    .opt:hover .oic{transform:scale(1.07) rotate(-3deg)}
    .oic .material-icons{font-size:19px}
    .oic.xls{background:color-mix(in srgb,#16a34a 16%,transparent);color:#15803d}
    .oic.csv{background:color-mix(in srgb,#0ea5e9 16%,transparent);color:#0284c7}
    .ot{display:flex;flex-direction:column;min-width:0;flex:1}
    .ot b{font-size:13px;font-weight:700;color:var(--cf-ink-900)}
    .ot small{font-size:11px;color:var(--cf-ink-500)}
    .go{font-size:16px;color:var(--cf-ink-300);opacity:0;transform:translateX(-5px);transition:opacity .15s,transform .15s,color .15s}
    .opt:hover .go{opacity:1;transform:none;color:var(--cf-brand-500)}
  `],
})
export class ExportMenuComponent {
  @Input() disabled = false;
  @Output() excel = new EventEmitter<void>();
  @Output() csv = new EventEmitter<void>();
  open = signal(false);

  @HostListener('document:click') close(): void { if (this.open()) this.open.set(false); }
  toggle(e: Event): void { e.stopPropagation(); if (!this.disabled) this.open.update((v) => !v); }
  pick(which: 'excel' | 'csv'): void { this.open.set(false); which === 'excel' ? this.excel.emit() : this.csv.emit(); }
}
