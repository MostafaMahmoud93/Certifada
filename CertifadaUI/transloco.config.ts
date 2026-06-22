import { TranslocoConfig, translocoConfig, TranslocoLoader } from '@ngneat/transloco';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string): Observable<any> {
    return this.http.get(`i18n/${lang}.json`);
  }
}

export const translocoAppConfig: TranslocoConfig = translocoConfig({
  availableLangs: [
    { id: 'en', label: 'English' },
    { id: 'ar', label: 'عربي' }
  ],
  defaultLang: 'ar',
  fallbackLang: 'ar',
  reRenderOnLangChange: true,
  prodMode: true
});
