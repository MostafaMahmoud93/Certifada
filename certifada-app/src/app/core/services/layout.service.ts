import { Injectable, signal } from '@angular/core';

/** App navigation layout: left sidebar vs top bar. Persisted per device. */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  /** true = navigation docked to the top as a single bar; false = left sidebar. */
  readonly navTop = signal(localStorage.getItem('cf-navpos') === 'top');

  setNavTop(top: boolean): void {
    this.navTop.set(top);
    localStorage.setItem('cf-navpos', top ? 'top' : 'side');
  }

  toggleNavTop(): void {
    this.setNavTop(!this.navTop());
  }
}
