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

  toggle(): void {
    const next: Lang = this.lang() === 'en' ? 'ar' : 'en';
    this.lang.set(next);
    localStorage.setItem('lang', next);
    this.apply(next);
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
