import { Injectable, signal } from '@angular/core';

/** Light/dark theme. Toggles `.dark` on <html>; the --cf tokens do the rest. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(this.read());

  constructor() {
    this.apply(this.isDark());
  }

  toggle(ev?: MouseEvent): void {
    const next = !this.isDark();
    this.isDark.set(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    this.animateApply(next, ev);
  }

  private apply(dark: boolean): void {
    document.documentElement.classList.toggle('dark', dark);
  }

  /** Creative circular reveal from the toggle (View Transitions API), with a graceful fallback. */
  private animateApply(dark: boolean, ev?: MouseEvent): void {
    const root = document.documentElement;
    const doc = document as any;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { this.apply(dark); return; }
    if (typeof doc.startViewTransition !== 'function') {
      root.classList.add('theme-anim');
      this.apply(dark);
      window.setTimeout(() => root.classList.remove('theme-anim'), 480);
      return;
    }
    const x = ev?.clientX ?? window.innerWidth - 44;
    const y = ev?.clientY ?? 28;
    const end = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    root.classList.add('vt-reveal');
    const t = doc.startViewTransition(() => this.apply(dark));
    t.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        { duration: 520, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' },
      );
    }).catch(() => { /* ignore */ });
    t.finished.finally(() => root.classList.remove('vt-reveal'));
  }

  private read(): boolean {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }
}
