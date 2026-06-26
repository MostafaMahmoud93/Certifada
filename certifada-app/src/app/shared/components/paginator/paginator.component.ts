import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Reusable, premium table paginator with progress, segmented rows, nav + jump-to-page. */
@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="pgn" tabindex="0" (keydown)="onKey($event)">
    <div class="pg-summary">
      <span class="pg-ic"><span class="material-icons">{{ icon }}</span></span>
      <div class="pg-sumtxt">
        <span class="pg-info">Showing <b>{{ from }}</b>–<b>{{ to }}</b> of <b>{{ total }}</b> {{ label }}</span>
        <span class="pg-track"><i [style.width.%]="fillPct"></i></span>
      </div>
    </div>

    <div class="pg-controls">
      <div class="pg-rows" role="group" aria-label="Rows per page">
        <span class="pg-rows-label">Rows</span>
        @for (s of sizes; track s) { <button type="button" [class.on]="s === pageSize" (click)="setSize(s)">{{ s }}</button> }
      </div>

      <span class="pg-page">Page <b>{{ page }}</b> / {{ pages }}</span>
      <div class="pg-nav">
        <button type="button" class="pg-btn nav" [disabled]="page <= 1" (click)="go(1)" aria-label="First page" title="First"><span class="material-icons">first_page</span></button>
        <button type="button" class="pg-btn nav" [disabled]="page <= 1" (click)="go(page - 1)" aria-label="Previous page" title="Previous"><span class="material-icons">chevron_left</span></button>
        @for (p of list; track $index) {
          @if (p === 'gap') { <span class="pg-gap">…</span> }
          @else { <button type="button" class="pg-btn num" [class.on]="p === page" (click)="go($any(p))">{{ p }}</button> }
        }
        <button type="button" class="pg-btn nav" [disabled]="page >= pages" (click)="go(page + 1)" aria-label="Next page" title="Next"><span class="material-icons">chevron_right</span></button>
        <button type="button" class="pg-btn nav" [disabled]="page >= pages" (click)="go(pages)" aria-label="Last page" title="Last"><span class="material-icons">last_page</span></button>
      </div>

      @if (pages > 7) {
        <div class="pg-jump"><span>Go to</span><input type="number" min="1" [max]="pages" placeholder="#" (keyup.enter)="jump($any($event.target))" /></div>
      }
    </div>
  </div>
  `,
  styles: [`
    :host{display:block}
    .pgn{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:14px 16px;border-top:1px solid var(--cf-line);background:linear-gradient(180deg,transparent,color-mix(in srgb,var(--cf-brand-500) 4%,transparent))}
    .pg-summary{display:flex;align-items:center;gap:11px;min-width:190px}
    .pg-ic{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:var(--cf-brand-50);color:var(--cf-brand-600);flex:none;border:1px solid var(--cf-brand-100)}
    .pg-ic .material-icons{font-size:18px}
    .pg-sumtxt{display:flex;flex-direction:column;gap:6px}
    .pg-info{font-size:12.5px;color:var(--cf-ink-500)}
    .pg-info b{color:var(--cf-ink-800);font-weight:700;font-variant-numeric:tabular-nums}
    .pg-track{display:block;width:150px;max-width:42vw;height:5px;border-radius:999px;background:var(--cf-surface-2);border:1px solid var(--cf-line);overflow:hidden}
    .pg-track i{display:block;height:100%;background:linear-gradient(90deg,var(--cf-brand-500),var(--cf-brand-600));border-radius:999px;transition:width .45s cubic-bezier(.2,.9,.3,1)}
    .pgn:focus-visible{outline:none;box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--cf-brand-500) 40%,transparent);border-radius:12px}
    .pg-page{font-size:12px;font-weight:700;color:var(--cf-ink-500);font-variant-numeric:tabular-nums}.pg-page b{color:var(--cf-ink-900)}
    .pg-controls{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
    .pg-rows{display:inline-flex;align-items:center;gap:2px;padding:3px 3px 3px 9px;background:var(--cf-surface-2);border:1px solid var(--cf-line);border-radius:11px}
    .pg-rows-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--cf-ink-400);margin-inline-end:4px}
    .pg-rows button{min-width:30px;height:28px;padding:0 9px;border:0;background:none;border-radius:8px;font:inherit;font-size:12px;font-weight:700;color:var(--cf-ink-500);cursor:pointer;transition:background .14s,color .14s,box-shadow .14s}
    .pg-rows button:hover:not(.on){color:var(--cf-ink-900)}
    .pg-rows button.on{background:var(--cf-surface);color:var(--cf-brand-700);box-shadow:var(--cf-shadow-sm)}
    .pg-nav{display:inline-flex;align-items:center;gap:5px}
    .pg-btn{min-width:34px;height:34px;padding:0 6px;display:grid;place-items:center;border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-600);font:inherit;font-size:13px;font-weight:700;border-radius:10px;cursor:pointer;font-variant-numeric:tabular-nums;transition:background .14s,color .14s,border-color .14s,transform .12s,box-shadow .18s}
    .pg-btn.nav{border-radius:50%;width:34px;color:var(--cf-ink-500)}
    .pg-btn.nav .material-icons{font-size:19px}
    .pg-btn:hover:not(:disabled):not(.on){background:var(--cf-surface-2);color:var(--cf-ink-900);border-color:var(--cf-ink-400);transform:translateY(-1px)}
    .pg-btn:active:not(:disabled){transform:scale(.9)}
    .pg-btn:disabled{opacity:.36;cursor:not-allowed}
    .pg-btn.num.on{background:linear-gradient(135deg,var(--cf-brand-500),var(--cf-brand-700));color:#fff;border-color:transparent;box-shadow:0 9px 20px -7px color-mix(in srgb,var(--cf-brand-600) 85%,transparent);animation:pg-pop .28s cubic-bezier(.2,1.4,.4,1)}
    @keyframes pg-pop{0%{transform:scale(.66)}55%{transform:scale(1.2)}100%{transform:scale(1)}}
    .pg-gap{min-width:22px;text-align:center;color:var(--cf-ink-400);font-weight:700;letter-spacing:1px}
    .pg-jump{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--cf-ink-400);font-weight:600}
    .pg-jump input{width:54px;height:34px;border:1px solid var(--cf-line);border-radius:10px;background:var(--cf-surface);color:var(--cf-ink-900);font:inherit;font-size:12.5px;font-weight:700;text-align:center;outline:none;-moz-appearance:textfield}
    .pg-jump input::-webkit-outer-spin-button,.pg-jump input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
    .pg-jump input:focus{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    @media(max-width:620px){.pgn{justify-content:center;gap:12px}.pg-track{width:120px}}
  `],
})
export class PaginatorComponent {
  @Input() total = 0;
  @Input() page = 1;
  @Input() pageSize = 10;
  @Input() sizes: number[] = [10, 25, 50, 100];
  @Input() label = 'items';
  @Input() icon = 'view_list';
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get pages(): number { return Math.max(1, Math.ceil(this.total / this.pageSize)); }
  get from(): number { return this.total === 0 ? 0 : (this.page - 1) * this.pageSize + 1; }
  get to(): number { return Math.min(this.total, this.page * this.pageSize); }
  get fillPct(): number { return this.total === 0 ? 0 : Math.round((this.to / this.total) * 100); }

  get list(): (number | 'gap')[] {
    const total = this.pages, cur = this.page;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const out: (number | 'gap')[] = [1];
    const start = Math.max(2, cur - 1), end = Math.min(total - 1, cur + 1);
    if (start > 2) out.push('gap');
    for (let i = start; i <= end; i++) out.push(i);
    if (end < total - 1) out.push('gap');
    out.push(total);
    return out;
  }

  onKey(e: KeyboardEvent): void {
    if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') { this.go(this.page + 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { this.go(this.page - 1); e.preventDefault(); }
    else if (e.key === 'Home') { this.go(1); e.preventDefault(); }
    else if (e.key === 'End') { this.go(this.pages); e.preventDefault(); }
  }
  go(p: number): void { if (p >= 1 && p <= this.pages && p !== this.page) this.pageChange.emit(p); }
  setSize(s: number): void { if (s !== this.pageSize) this.pageSizeChange.emit(s); }
  jump(el: HTMLInputElement): void {
    const n = parseInt(el.value, 10);
    if (!isNaN(n)) this.go(Math.min(Math.max(1, n), this.pages));
    el.value = '';
  }
}
