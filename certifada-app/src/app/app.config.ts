import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideTransloco } from '@ngneat/transloco';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { TranslocoHttpLoader } from './core/i18n/transloco-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    provideTransloco({
      config: {
        availableLangs: ['en', 'ar'],
        defaultLang: localStorage.getItem('lang') || 'en',
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
  ],
};
