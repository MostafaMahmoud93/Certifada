import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { runInInjectionContext } from '@angular/core';
import 'zone.js';
import './app/quill.config'; // this registers mention module
import 'ag-grid-enterprise';
import { LanguageChangeService } from './app/shared/LanguageChange.Service';
import { appConfig } from './app/app.config';

// bootstrapApplication(App, appConfig)
//   .catch((err) => console.error(err));
bootstrapApplication(App, appConfig)
  .then(appRef => {
    runInInjectionContext(appRef.injector, () => {
      appRef.injector.get(LanguageChangeService);
    });
  })
  .catch(err => console.error(err));
