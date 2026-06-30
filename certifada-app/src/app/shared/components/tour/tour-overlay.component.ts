import { ChangeDetectionStrategy, Component, ElementRef, HostListener, ViewChild, effect, inject, signal } from '@angular/core';
import { CANVAS_TOUR_UI } from '../../../features/designer/canvas-tour.data';
import { LanguageService } from '../../../core/services/language.service';
import { TourService } from '../../../core/services/tour.service';

interface Rect { x: number; y: number; w: number; h: number; }
interface Pos { top: number; left: number; side: 'top' | 'bottom' | 'left' | 'right' | 'center'; arrow: number; }
interface Confetti { l: number; bg: string; dx: number; rot: number; delay: number; dur: number; sq: boolean; }

/**
 * App-wide Application Tour overlay: a spotlight cut-out over real interface
 * elements, a floating coach-mark that auto-places itself around the target,
 * progress, Back / Next / Skip / Finish controls, keyboard + screen-reader
 * support, smooth scroll-into-view for off-screen targets, a rewarding finale,
 * and a first-run invitation card. Driven entirely by {@link TourService} so any
 * page can reuse it. Mount once near the app/page root: `<app-tour-overlay/>`.
 */
@Component({
  selector: 'app-tour-overlay',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- First-run invitation -->
    @if (tour.offering(); as off) {
      <div class="tov tov-offer" [class.reduce]="reduce" role="dialog" aria-modal="true" aria-labelledby="tov-off-t" aria-describedby="tov-off-b">
        <div class="tov-dim soft" aria-hidden="true"></div>
        <div class="tov-card center tov-invite" #coach tabindex="-1">
          <div class="tov-head">
            <span class="tov-chip big sparkle"><span class="material-icons">{{ off.icon || 'explore' }}</span></span>
          </div>
          <h2 id="tov-off-t" class="tov-title">{{ off.title }}</h2>
          <p id="tov-off-b" class="tov-body">{{ off.body }}</p>
          <div class="tov-foot tov-foot-offer">
            <button type="button" class="tov-btn ghost" (click)="tour.declineOffer()">{{ off.no }}</button>
            <button type="button" class="tov-btn solid" (click)="tour.acceptOffer()">
              <span class="material-icons">auto_awesome</span>{{ off.yes }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Active tour -->
    @if (tour.active() && tour.current(); as step) {
      <div class="tov" [class.reduce]="reduce" role="dialog" aria-modal="true"
           aria-labelledby="tov-title" aria-describedby="tov-body">
        <div class="tov-catch" aria-hidden="true"></div>

        @if (rect(); as r) {
          <div class="tov-hole" aria-hidden="true"
               [style.top.px]="r.y" [style.left.px]="r.x" [style.width.px]="r.w" [style.height.px]="r.h"></div>
        } @else {
          <div class="tov-dim soft" aria-hidden="true"></div>
        }

        <div class="tov-card" #coach tabindex="-1"
             [class.center]="!rect()" [class.finale]="step.finale"
             [attr.data-side]="pos().side"
             [style.top.px]="pos().top" [style.left.px]="pos().left">

          @if (rect()) {
            <span class="tov-arrow" aria-hidden="true" [style.--arrow]="pos().arrow + '%'"></span>
          }

          @if (step.finale) {
            <div class="tov-burst" aria-hidden="true">
              @for (c of confetti; track $index) {
                <span [class.sq]="c.sq"
                      [style.left]="c.l + '%'" [style.background]="c.bg"
                      [style.--dx]="c.dx + 'px'" [style.--rot]="c.rot + 'deg'"
                      [style.animation-delay]="c.delay + 'ms'" [style.animation-duration]="c.dur + 'ms'"></span>
              }
            </div>
          }

          @for (k of [tour.index()]; track k) {
          <div class="tov-reveal">
          <div class="tov-head">
            <span class="tov-chip" [class.party]="step.finale" [class.big]="!rect() || step.finale">
              @if (step.finale) { <i class="tov-ring" aria-hidden="true"></i><i class="tov-ring d" aria-hidden="true"></i> }
              <span class="material-icons">{{ step.icon || 'tips_and_updates' }}</span>
              @if (rect() && !step.finale) { <b class="tov-badge">{{ tour.index() + 1 }}</b> }
            </span>
            <h2 id="tov-title" class="tov-title">{{ step.title }}</h2>
            @if (!step.finale) {
              <button type="button" class="tov-x" (click)="tour.skip()" [attr.aria-label]="ui().skip">
                <span class="material-icons">close</span>
              </button>
            }
          </div>

          <p id="tov-body" class="tov-body" aria-live="polite">{{ step.body }}</p>
          </div>
          }

          <div class="tov-foot">
            <div class="tov-prog">
              <span class="tov-count">{{ ui().step }} <b>{{ tour.index() + 1 }}</b> {{ ui().of }} {{ tour.total() }}</span>
            </div>

            <div class="tov-ctrls">
              @if (!tour.atFirst() && !step.finale) {
                <button type="button" class="tov-btn ghost" (click)="tour.prev()">
                  <span class="material-icons">arrow_back</span>{{ ui().back }}
                </button>
              }
              @if (step.finale) {
                <button type="button" class="tov-btn solid wide" (click)="tour.finish()">
                  <span class="material-icons">check_circle</span>{{ ui().finish }}
                </button>
              } @else {
                <button type="button" class="tov-btn solid" (click)="tour.next()">
                  {{ tour.atLast() ? ui().finish : ui().next }}<span class="material-icons">arrow_forward</span>
                </button>
              }
            </div>
          </div>

          <div class="tov-bar" aria-hidden="true"><i [style.width.%]="tour.progress() * 100"></i></div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { position: fixed; inset: 0; z-index: 4000; pointer-events: none; }
    .tov {
      position: fixed; inset: 0; pointer-events: auto;
      --acc: var(--cf-brand-600, #4f46e5);
      --acc2: var(--cf-brand-500, #6366f1);
      --ink: var(--cf-ink-1, #0f172a);
      --ink2: var(--cf-ink-2, #475569);
      --surf: var(--cf-surface, #fff);
      --line: var(--cf-line, #e2e8f0);
      font-family: inherit;
    }
    .tov-catch { position: absolute; inset: 0; background: transparent; }
    .tov-dim { position: absolute; inset: 0; background: rgba(15, 23, 42, .58); animation: tov-fade .28s ease both; }
    .tov-dim.soft { background: radial-gradient(130% 130% at 50% 42%, rgba(15, 23, 42, .44), rgba(15, 23, 42, .66)); }
    /* First-run invitation: center the card (it does not run through JS positioning). */
    .tov-offer { display: grid; place-items: center; }
    .tov-offer .tov-card { position: relative; top: auto; left: auto; }

    /* Spotlight cut-out: the box-shadow paints the dim everywhere except the hole. */
    .tov-hole {
      position: absolute; border-radius: 14px; pointer-events: none;
      box-shadow: 0 0 0 9999px rgba(15, 23, 42, .6);
      transition: top .44s cubic-bezier(.22,.7,.2,1), left .44s cubic-bezier(.22,.7,.2,1), width .44s cubic-bezier(.22,.7,.2,1), height .44s cubic-bezier(.22,.7,.2,1);
    }
    .tov-hole::before {
      content: ''; position: absolute; inset: 0; border-radius: inherit;
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--acc) 88%, #fff);
    }
    .tov-hole::after {
      content: ''; position: absolute; inset: -5px; border-radius: 18px;
      box-shadow: 0 0 0 1.5px color-mix(in srgb, var(--acc) 50%, transparent), 0 0 26px 5px color-mix(in srgb, var(--acc) 32%, transparent);
      animation: tov-breathe 2.1s ease-in-out infinite;
    }

    .tov-card {
      position: absolute; width: min(362px, calc(100vw - 28px)); isolation: isolate;
      background: linear-gradient(180deg, var(--surf), color-mix(in srgb, var(--acc) 3%, var(--surf)));
      color: var(--ink); border: 1px solid color-mix(in srgb, var(--acc) 13%, var(--line)); border-radius: 20px;
      box-shadow: 0 28px 72px -22px rgba(15, 23, 42, .55), 0 12px 34px -16px color-mix(in srgb, var(--acc) 42%, transparent), inset 0 1px 0 rgba(255, 255, 255, .55);
      padding: 17px 17px 19px; outline: none;
      animation: tov-pop-b .42s cubic-bezier(.16,.84,.44,1) both;
    }
    .tov-card[data-side="top"] { animation-name: tov-pop-t; }
    .tov-card[data-side="left"] { animation-name: tov-pop-l; }
    .tov-card[data-side="right"] { animation-name: tov-pop-r; }
    .tov-card.center { width: min(440px, calc(100vw - 28px)); text-align: center; padding: 24px 24px 18px; animation-name: tov-pop-c; }
    .tov-card.finale { background: linear-gradient(180deg, color-mix(in srgb, #f59e0b 6%, var(--surf)), var(--surf)); }

    .tov-arrow {
      position: absolute; width: 14px; height: 14px;
      background: var(--surf); border: 1px solid color-mix(in srgb, var(--acc) 13%, var(--line)); transform: rotate(45deg);
    }
    .tov-card[data-side="bottom"] .tov-arrow { top: -8px; left: var(--arrow); margin-left: -7px; border-right: 0; border-bottom: 0; }
    .tov-card[data-side="top"] .tov-arrow { bottom: -8px; left: var(--arrow); margin-left: -7px; border-left: 0; border-top: 0; }
    .tov-card[data-side="right"] .tov-arrow { left: -8px; top: var(--arrow); margin-top: -7px; border-top: 0; border-right: 0; }
    .tov-card[data-side="left"] .tov-arrow { right: -8px; top: var(--arrow); margin-top: -7px; border-bottom: 0; border-left: 0; }

    .tov-head { display: flex; align-items: flex-start; gap: 12px; }
    .tov-card.center .tov-head { flex-direction: column; align-items: center; gap: 10px; }

    .tov-chip {
      position: relative; flex: 0 0 auto; width: 42px; height: 42px; border-radius: 13px; display: grid; place-items: center;
      color: #fff; background: linear-gradient(135deg, var(--acc2), var(--acc));
      box-shadow: 0 8px 18px -8px color-mix(in srgb, var(--acc) 72%, transparent), inset 0 1px 0 rgba(255, 255, 255, .35);
    }
    .tov-chip .material-icons { font-size: 23px; }
    .tov-chip.big { width: 58px; height: 58px; border-radius: 17px; }
    .tov-chip.big .material-icons { font-size: 31px; }
    .tov-chip.sparkle { animation: tov-float 3.4s ease-in-out infinite; }
    .tov-chip.party {
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      box-shadow: 0 12px 24px -8px color-mix(in srgb, #f59e0b 70%, transparent), inset 0 1px 0 rgba(255, 255, 255, .42);
      animation: tov-party 1.4s ease-in-out infinite;
    }
    .tov-badge {
      position: absolute; right: -6px; bottom: -6px; min-width: 19px; height: 19px; padding: 0 4px; border-radius: 10px;
      background: var(--surf); color: var(--acc); font-size: 11px; font-weight: 800; line-height: 1; display: grid; place-items: center;
      border: 2px solid color-mix(in srgb, var(--acc) 18%, var(--surf)); box-shadow: 0 2px 6px rgba(15, 23, 42, .2);
    }
    .tov-ring { position: absolute; inset: 0; border-radius: inherit; border: 2px solid color-mix(in srgb, #f59e0b 55%, transparent); animation: tov-ringexp 1.9s ease-out infinite; }
    .tov-ring.d { animation-delay: .95s; }

    .tov-title { margin: 3px 0 0; font-size: 16.5px; font-weight: 800; line-height: 1.25; letter-spacing: -.012em; flex: 1; }
    .tov-card.center .tov-title { font-size: 21px; margin-top: 2px; }
    .tov-x {
      flex: 0 0 auto; width: 28px; height: 28px; border-radius: 8px; border: 0; background: transparent; color: var(--ink2);
      cursor: pointer; display: grid; place-items: center; margin: -3px -3px 0 0; transition: background .15s, color .15s;
    }
    .tov-card.center .tov-x { position: absolute; top: 13px; right: 13px; margin: 0; }
    .tov-x:hover { background: color-mix(in srgb, var(--ink2) 12%, transparent); color: var(--ink); }
    .tov-x .material-icons { font-size: 19px; }

    .tov-body { margin: 10px 0 0; font-size: 13.5px; line-height: 1.58; color: var(--ink2); }
    .tov-card.center .tov-body { font-size: 14.5px; margin-top: 8px; }

    .tov-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px; }
    .tov-card.center .tov-foot, .tov-foot-offer { justify-content: center; }
    .tov-foot-offer { gap: 10px; margin-top: 20px; }

    .tov-prog { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .tov-card.center .tov-prog, .tov-card.finale .tov-prog { display: none; }
    .tov-dots { display: flex; gap: 5px; }
    .tov-dot { width: 7px; height: 7px; border-radius: 50%; border: 0; padding: 0; cursor: pointer; background: var(--line); transition: width .26s cubic-bezier(.22,.7,.2,1), background .26s, transform .2s; }
    .tov-dot.past { background: color-mix(in srgb, var(--acc) 48%, var(--line)); }
    .tov-dot.on { width: 20px; border-radius: 5px; background: linear-gradient(90deg, var(--acc2), var(--acc)); }
    .tov-dot:hover { transform: scale(1.3); }
    .tov-dot.on:hover { transform: none; }
    .tov-count { font-size: 12px; font-weight: 600; color: var(--ink2); letter-spacing: .01em; }
    .tov-count b { color: var(--acc); font-weight: 800; }

    .tov-ctrls { display: flex; align-items: center; gap: 8px; }
    .tov-btn {
      position: relative; overflow: hidden; display: inline-flex; align-items: center; gap: 5px; cursor: pointer;
      font: inherit; font-size: 13px; font-weight: 700; border-radius: 11px; padding: 8px 14px;
      border: 1px solid transparent; transition: transform .14s, box-shadow .2s, background .2s, border-color .2s;
    }
    .tov-btn .material-icons { font-size: 17px; transition: transform .2s; }
    .tov-btn:active { transform: translateY(1px); }
    .tov-btn.ghost { background: transparent; color: var(--ink2); border-color: var(--line); }
    .tov-btn.ghost:hover { background: color-mix(in srgb, var(--ink2) 8%, transparent); color: var(--ink); }
    .tov-btn.ghost:hover .material-icons { transform: translateX(-2px); }
    .tov-btn.solid { color: #fff; background: linear-gradient(135deg, var(--acc2), var(--acc)); box-shadow: 0 8px 18px -8px color-mix(in srgb, var(--acc) 72%, transparent); }
    .tov-btn.solid:hover { box-shadow: 0 12px 26px -8px color-mix(in srgb, var(--acc) 82%, transparent); transform: translateY(-1px); }
    .tov-btn.solid:hover .material-icons { transform: translateX(2px); }
    .tov-btn.solid::after { content: ''; position: absolute; top: 0; left: -130%; width: 55%; height: 100%; background: linear-gradient(100deg, transparent, rgba(255, 255, 255, .45), transparent); transform: skewX(-18deg); }
    .tov-btn.solid:hover::after { animation: tov-sheen .75s ease; }
    .tov-btn.wide { padding: 11px 22px; font-size: 14px; }

    .tov-bar { position: absolute; left: 16px; right: 16px; bottom: 9px; height: 5px; border-radius: 999px; overflow: hidden; background: color-mix(in srgb, var(--ink2) 15%, transparent); }
    .tov-card.center .tov-bar, .tov-card.finale .tov-bar { display: none; }
    .tov-bar i { display: block; height: 100%; min-width: 6px; border-radius: 999px; background: linear-gradient(90deg, var(--acc2), var(--acc)); box-shadow: 0 0 10px color-mix(in srgb, var(--acc) 55%, transparent); transition: width .44s cubic-bezier(.22,.7,.2,1); }

    /* confetti */
    .tov-burst { position: absolute; inset: 0; overflow: visible; pointer-events: none; }
    .tov-burst span { position: absolute; top: -6px; width: 8px; height: 12px; border-radius: 2px; opacity: 0; animation-name: tov-fall; animation-timing-function: cubic-bezier(.3,.6,.5,1); animation-fill-mode: forwards; }
    .tov-burst span.sq { width: 9px; height: 9px; border-radius: 1px; }

    .tov-btn:focus-visible, .tov-dot:focus-visible, .tov-x:focus-visible {
      outline: none; box-shadow: 0 0 0 3px color-mix(in srgb, var(--acc) 35%, transparent);
    }

    @keyframes tov-fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes tov-pop-b { from { opacity: 0; transform: translateY(10px) scale(.97); } to { opacity: 1; transform: none; } }
    @keyframes tov-pop-t { from { opacity: 0; transform: translateY(-10px) scale(.97); } to { opacity: 1; transform: none; } }
    @keyframes tov-pop-l { from { opacity: 0; transform: translateX(-10px) scale(.97); } to { opacity: 1; transform: none; } }
    @keyframes tov-pop-r { from { opacity: 0; transform: translateX(10px) scale(.97); } to { opacity: 1; transform: none; } }
    @keyframes tov-pop-c { from { opacity: 0; transform: translateY(8px) scale(.94); } to { opacity: 1; transform: none; } }
    @keyframes tov-breathe { 0%, 100% { opacity: .85; } 50% { opacity: .3; } }
    @keyframes tov-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
    @keyframes tov-party { 0%, 100% { transform: rotate(-6deg) scale(1); } 50% { transform: rotate(6deg) scale(1.07); } }
    @keyframes tov-ringexp { 0% { opacity: .7; transform: scale(1); } 100% { opacity: 0; transform: scale(1.75); } }
    @keyframes tov-sheen { from { left: -130%; } to { left: 150%; } }
    @keyframes tov-fall { 0% { opacity: 0; transform: translate(0, 0) rotate(0); } 12% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--dx), 240px) rotate(var(--rot)); } }

    @media (prefers-reduced-motion: reduce) {
      .tov-hole, .tov-bar i { transition: none; }
      .tov-card, .tov-dim { animation: none; }
      .tov-hole::after, .tov-chip.party, .tov-chip.sparkle, .tov-burst, .tov-ring { animation: none; }
      .tov-burst, .tov-ring { display: none; }
    }
    .tov.reduce .tov-hole, .tov.reduce .tov-bar i { transition: none; }
    .tov.reduce .tov-card, .tov.reduce .tov-dim { animation: none; }
    .tov.reduce .tov-hole::after, .tov.reduce .tov-chip.party, .tov.reduce .tov-chip.sparkle, .tov.reduce .tov-ring { animation: none; }
    .tov.reduce .tov-burst, .tov.reduce .tov-ring { display: none; }

    @media (max-width: 560px) {
      .tov-card { width: calc(100vw - 20px); }
      .tov-count { display: none; }
    }

    /* — amazement pass: staggered reveal, depth & organization — */
    .tov-reveal { display: contents; }
    .tov-card .tov-head { animation: tovRise .44s cubic-bezier(.22,.9,.3,1) .04s both; }
    .tov-card .tov-body { animation: tovRise .46s cubic-bezier(.22,.9,.3,1) .12s both; }
    @keyframes tovRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .tov-card { box-shadow: 0 30px 78px -24px rgba(15,23,42,.6), 0 14px 36px -16px color-mix(in srgb, var(--acc) 46%, transparent), inset 0 1px 0 rgba(255,255,255,.6); }
    .tov-card.finale { box-shadow: 0 30px 78px -24px rgba(15,23,42,.6), 0 16px 44px -14px color-mix(in srgb, #f59e0b 48%, transparent), inset 0 1px 0 rgba(255,255,255,.6); }
    .tov-title { font-size: 17px; }
    .tov-body { font-size: 13.7px; line-height: 1.62; }
    .tov-chip { box-shadow: 0 9px 20px -8px color-mix(in srgb, var(--acc) 70%, transparent), inset 0 1px 0 rgba(255,255,255,.4), 0 0 0 5px color-mix(in srgb, var(--acc) 8%, transparent); }
    .tov-card:not(.center) .tov-foot { margin-top: 13px; padding-top: 12px; border-top: 1px solid color-mix(in srgb, var(--line) 65%, transparent); }
    .tov-bar i { position: relative; overflow: hidden; }
    .tov-bar i::after { content: ''; position: absolute; inset-inline-end: 0; top: 0; bottom: 0; width: 12px; background: linear-gradient(90deg, transparent, rgba(255,255,255,.6)); }
    @media (prefers-reduced-motion: reduce) { .tov-card .tov-head, .tov-card .tov-body { animation: none; } }
    .tov.reduce .tov-card .tov-head, .tov.reduce .tov-card .tov-body { animation: none; }
  `],
})
export class TourOverlayComponent {
  readonly tour = inject(TourService);
  private readonly langSvc = inject(LanguageService);

  @ViewChild('coach') private coach?: ElementRef<HTMLElement>;

  readonly rect = signal<Rect | null>(null);
  readonly pos = signal<Pos>({ top: 0, left: 0, side: 'center', arrow: 50 });

  readonly reduce = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  readonly confetti: Confetti[] = this.makeConfetti();

  private raf = 0;
  private readonly loop = () => {
    if (!this.tour.active()) { this.raf = 0; return; }
    this.track();
    this.raf = requestAnimationFrame(this.loop);
  };

  ui = () => (this.langSvc.lang() === 'ar' ? CANVAS_TOUR_UI.ar : CANVAS_TOUR_UI.en);

  constructor() {
    // React to step changes: scroll the target into view, keep the spotlight glued, move focus.
    effect(() => {
      this.tour.tick();
      const active = this.tour.active();
      if (!active) { this.rect.set(null); return; }
      setTimeout(() => this.ensureVisible(), 20);
      if (!this.raf) this.raf = requestAnimationFrame(this.loop);
      setTimeout(() => this.coach?.nativeElement?.focus({ preventScroll: true }), 60);
    });
  }

  // ---- target tracking ---------------------------------------------------
  private ensureVisible(): void {
    const step = this.tour.current();
    if (!step?.target) return;
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const off = r.top < 16 || r.bottom > window.innerHeight - 16 || r.left < 8 || r.right > window.innerWidth - 8;
    if (off) el.scrollIntoView({ block: 'center', inline: 'center', behavior: this.reduce ? 'auto' : 'smooth' });
  }

  /** Each frame: re-read the target rect (so the spotlight stays glued through scroll/resize) and reposition. */
  private track(): void {
    const step = this.tour.current();
    if (!step?.target) {
      if (this.rect() !== null) this.rect.set(null);
      this.reposition();
      return;
    }
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (!el) { if (this.rect() !== null) this.rect.set(null); this.reposition(); return; }   // target gone → center the card
    const r = el.getBoundingClientRect();
    const pad = 8;
    const nr: Rect = { x: r.left - pad, y: r.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 };
    const c = this.rect();
    if (!c || Math.abs(c.x - nr.x) > .5 || Math.abs(c.y - nr.y) > .5 || Math.abs(c.w - nr.w) > .5 || Math.abs(c.h - nr.h) > .5) {
      this.rect.set(nr);
    }
    this.reposition();
  }

  // ---- coach-mark placement ---------------------------------------------
  private reposition(): void {
    const el = this.coach?.nativeElement;
    if (!el) return;
    const pw = el.offsetWidth, ph = el.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;
    const m = 16;
    const r = this.rect();
    if (!r) { this.set({ top: (vh - ph) / 2, left: (vw - pw) / 2, side: 'center', arrow: 50 }); return; }

    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const fitsBelow = r.y + r.h + ph + m <= vh;
    const fitsAbove = r.y - ph - m >= 0;
    const fitsRight = r.x + r.w + pw + m <= vw;
    const fitsLeft = r.x - pw - m >= 0;

    let side: Pos['side'] = 'bottom', top = 0, left = 0;
    if (fitsBelow) { side = 'bottom'; top = r.y + r.h + m; left = this.clamp(cx - pw / 2, m, vw - pw - m); }
    else if (fitsAbove) { side = 'top'; top = r.y - ph - m; left = this.clamp(cx - pw / 2, m, vw - pw - m); }
    else if (fitsRight) { side = 'right'; left = r.x + r.w + m; top = this.clamp(cy - ph / 2, m, vh - ph - m); }
    else if (fitsLeft) { side = 'left'; left = r.x - pw - m; top = this.clamp(cy - ph / 2, m, vh - ph - m); }
    else { side = 'bottom'; top = this.clamp(r.y + r.h + m, m, vh - ph - m); left = this.clamp(cx - pw / 2, m, vw - pw - m); }

    let arrow = 50;
    if (side === 'bottom' || side === 'top') arrow = this.clamp(((cx - left) / pw) * 100, 9, 91);
    else arrow = this.clamp(((cy - top) / ph) * 100, 9, 91);
    this.set({ top, left, side, arrow });
  }

  private set(p: Pos): void {
    const c = this.pos();
    if (c.top !== p.top || c.left !== p.left || c.side !== p.side || c.arrow !== p.arrow) this.pos.set(p);
  }
  private clamp(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, hi < lo ? lo : v)); }

  // ---- keyboard ----------------------------------------------------------
  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (this.tour.offering()) {
      if (e.key === 'Escape') { e.preventDefault(); this.tour.declineOffer(); }
      else if (e.key === 'Enter') { e.preventDefault(); this.tour.acceptOffer(); }
      return;
    }
    if (!this.tour.active()) return;
    switch (e.key) {
      case 'Escape': e.preventDefault(); this.tour.skip(); break;
      case 'ArrowRight': case 'PageDown': e.preventDefault(); this.tour.next(); break;
      case 'ArrowLeft': case 'PageUp': e.preventDefault(); this.tour.prev(); break;
      case 'Home': e.preventDefault(); this.tour.goTo(0); break;
      case 'End': e.preventDefault(); this.tour.goTo(this.tour.total() - 1); break;
    }
  }

  @HostListener('window:resize')
  onResize(): void { this.track(); }

  private makeConfetti(): Confetti[] {
    const cols = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#a855f7'];
    const out: Confetti[] = [];
    let seed = 7;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (let i = 0; i < 30; i++) {
      out.push({
        l: Math.round(rnd() * 100),
        bg: cols[i % cols.length],
        dx: Math.round((rnd() - 0.5) * 160),
        rot: Math.round((rnd() - 0.5) * 720),
        delay: Math.round(rnd() * 350),
        dur: 1100 + Math.round(rnd() * 900),
        sq: rnd() > 0.5,
      });
    }
    return out;
  }
}
