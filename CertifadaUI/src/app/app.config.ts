import { ApplicationConfig, DOCUMENT, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { PreloadAllModules, provideRouter, withInMemoryScrolling, withPreloading } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { provideTransloco, TranslocoService } from '@ngneat/transloco';
import { firstValueFrom, combineLatest } from 'rxjs';
import { LanguageChangeService } from './shared/LanguageChange.Service';
import { translocoAppConfig, TranslocoHttpLoader } from '../../transloco.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
        provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTransloco({
      config: translocoAppConfig,
      loader: TranslocoHttpLoader
    }),
    provideAppInitializer(async () => {
      const transloco = inject(TranslocoService);
      const doc = inject(DOCUMENT);

      const saved = localStorage.getItem('lang');
      const lang = (saved === 'ar' || saved === 'en') ? saved : 'ar';
      await firstValueFrom(combineLatest([
        transloco.load('ar'),
        transloco.load('en')
      ]));
      transloco.setActiveLang(lang);
      doc.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
      doc.documentElement.setAttribute('lang', lang);

      await firstValueFrom(transloco.load(lang));
    }),
    {
      provide: provideAppInitializer,
      useValue: () => {
        inject(LanguageChangeService);
      },
      multi: true
    }
  ]
};
