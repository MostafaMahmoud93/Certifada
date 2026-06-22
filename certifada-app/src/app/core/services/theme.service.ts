import { Injectable, signal } from '@angular/core';

/** Light/dark theme. Toggles `.dark` on <html>; the --cf tokens do the rest. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(this.read());

  constructor() {
    this.apply(this.isDark());
  }

  toggle(): void {
    const next = !this.isDark();
    this.isDark.set(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    this.apply(next);
  }

  private apply(dark: boolean): void {
    document.documentElement.classList.toggle('dark', dark);
  }

  private read(): boolean {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }
}
