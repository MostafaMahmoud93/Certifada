import { Injectable, computed, signal } from '@angular/core';

/**
 * Interactive Application Tour engine.
 *
 * Modular & page-agnostic: a page builds an array of {@link TourStep}s (real CSS
 * selectors + optional `before` hooks to open panels / scroll) and calls
 * {@link start}. The overlay component (app-tour-overlay) renders the spotlight,
 * coach-mark, controls and progress purely from this service's signals — so any
 * screen can define its own tour with almost no extra code.
 *
 * Persistence: each tour id remembers whether the user completed / skipped /
 * was-offered it (localStorage key `cf-tour-<id>`), so first-time auto-offers
 * fire once and never nag.
 */
export type TourPlacement = 'auto' | 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface TourStep {
  /** CSS selector of the element to spotlight. Omit for a centered card (intro / finale). */
  target?: string;
  title: string;
  body: string;
  /** Material icon name shown in the coach-mark chip. */
  icon?: string;
  placement?: TourPlacement;
  /** Runs before the step is shown — open a panel, scroll a list, etc. May be async. */
  before?: () => void | Promise<void>;
  /** Marks the closing celebration step so the overlay can show the reward. */
  finale?: boolean;
}

export interface TourOffer {
  title: string;
  body: string;
  yes: string;
  no: string;
  icon?: string;
}

type TourState = 'completed' | 'skipped' | 'offered';

@Injectable({ providedIn: 'root' })
export class TourService {
  private readonly _steps = signal<TourStep[]>([]);
  readonly index = signal(0);
  readonly active = signal(false);

  /** Bumps every time the visible step changes so the overlay re-measures the target. */
  readonly tick = signal(0);

  /** First-run invitation card, shown when not yet seen. */
  readonly offering = signal<TourOffer | null>(null);

  /** Page-registered launcher so a shared (header) button can start the current page's tour. */
  readonly launcher = signal<(() => void) | null>(null);
  register(fn: () => void): void { this.launcher.set(fn); }
  unregister(): void { this.launcher.set(null); }
  launch(): void { const f = this.launcher(); if (f) { f(); } }

  private id = '';
  private offerId = '';
  private accept?: () => void;
  private onClose?: () => void;

  readonly steps = this._steps.asReadonly();
  readonly current = computed<TourStep | null>(() => this._steps()[this.index()] ?? null);
  readonly total = computed(() => this._steps().length);
  readonly atFirst = computed(() => this.index() === 0);
  readonly atLast = computed(() => this.total() > 0 && this.index() === this.total() - 1);
  readonly progress = computed(() => (this.total() ? (this.index() + 1) / this.total() : 0));

  // ---- persistence -------------------------------------------------------
  /** Has the user already completed, skipped or been offered this tour? */
  seen(id: string): boolean {
    try { return !!localStorage.getItem('cf-tour-' + id); } catch { return false; }
  }
  status(id: string): TourState | null {
    try { return (localStorage.getItem('cf-tour-' + id) as TourState) || null; } catch { return null; }
  }
  private persist(state: TourState): void {
    if (!this.id) return;
    try { localStorage.setItem('cf-tour-' + this.id, state); } catch { /* ignore */ }
  }

  // ---- lifecycle ---------------------------------------------------------
  /** Launch a tour. `onClose` always runs when it ends (finish / skip), e.g. to restore UI state. */
  async start(id: string, steps: TourStep[], onClose?: () => void): Promise<void> {
    if (!steps.length) return;
    this.offering.set(null);
    this.id = id;
    this.onClose = onClose;
    this._steps.set(steps);
    this.index.set(0);
    this.active.set(true);
    await this.enter();
  }

  async goTo(i: number): Promise<void> {
    if (!this.active() || i === this.index()) return;
    this.index.set(Math.max(0, Math.min(this.total() - 1, i)));
    await this.enter();
  }
  async next(): Promise<void> {
    if (!this.active()) return;
    if (this.atLast()) { this.finish(); return; }
    this.index.update((i) => i + 1);
    await this.enter();
  }
  async prev(): Promise<void> {
    if (!this.active() || this.atFirst()) return;
    this.index.update((i) => i - 1);
    await this.enter();
  }

  skip(): void { this.persist('skipped'); this.end(); }
  finish(): void { this.persist('completed'); this.end(); }

  private end(): void {
    this.active.set(false);
    this._steps.set([]);
    this.index.set(0);
    const cb = this.onClose;
    this.onClose = undefined;
    try { cb?.(); } catch { /* ignore */ }
  }

  private async enter(): Promise<void> {
    const step = this.current();
    if (step?.before) { try { await step.before(); } catch { /* ignore */ } }
    this.tick.update((t) => t + 1);
  }

  // ---- first-run offer ---------------------------------------------------
  /** Show the invite card (only if not seen). Accepting calls `onAccept`; declining marks it offered. */
  maybeOffer(id: string, offer: TourOffer, onAccept: () => void): void {
    if (this.seen(id) || this.active()) return;
    this.offerId = id;
    this.accept = onAccept;
    this.offering.set(offer);
  }
  acceptOffer(): void {
    const a = this.accept;
    this.offering.set(null);
    this.accept = undefined;
    try { a?.(); } catch { /* ignore */ }
  }
  declineOffer(): void {
    this.offering.set(null);
    this.accept = undefined;
    if (this.offerId) { try { localStorage.setItem('cf-tour-' + this.offerId, 'offered'); } catch { /* ignore */ } }
  }
}
