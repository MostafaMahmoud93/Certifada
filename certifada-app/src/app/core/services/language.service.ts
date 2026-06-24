import { inject, Injectable, signal } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';

export type Lang = 'en' | 'ar';

/**
 * UI language + direction. Sets dir/lang on <html> (the layout uses logical
 * CSS, so RTL flips automatically) and persists the choice. String translation
 * can be layered on later with Transloco using the same `lang` signal.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private transloco = inject(TranslocoService);
  readonly lang = signal<Lang>(this.read());

  constructor() {
    this.apply(this.lang());
  }

  toggle(ev?: MouseEvent): void {
    const next: Lang = this.lang() === 'en' ? 'ar' : 'en';
    this.lang.set(next);
    localStorage.setItem('lang', next);
    const doc = document as any;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof doc.startViewTransition !== 'function') { this.apply(next); return; }
    const root = document.documentElement;
    const x = ev?.clientX ?? window.innerWidth - 80;
    const y = ev?.clientY ?? 28;
    const end = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    root.classList.add('vt-reveal');
    const t = doc.startViewTransition(() => this.apply(next));
    t.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        { duration: 500, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' },
      );
    }).catch(() => { /* ignore */ });
    t.finished.finally(() => root.classList.remove('vt-reveal'));
  }

  private apply(lang: Lang): void {
    this.transloco.setActiveLang(lang);
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
    document.body?.classList.toggle('font-arabic', lang === 'ar');
  }

  private read(): Lang {
    return (localStorage.getItem('lang') as Lang) || 'en';
  }
}
