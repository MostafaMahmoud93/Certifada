import { Injectable, Inject } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';

@Injectable({ providedIn: 'root' })
export class LanguageService {

  constructor(
    private translate: TranslocoService,
  ) {
    const savedLang = localStorage.getItem('lang') || 'en';
    this.translate.setActiveLang(savedLang);
    localStorage.setItem('lang', savedLang);
  } 
}
