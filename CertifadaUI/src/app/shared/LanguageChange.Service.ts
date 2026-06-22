import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { Router } from '@angular/router';
import { routes } from '../app.routes';

@Injectable({ providedIn: 'root' })
export class LanguageChangeService {
  private translocoService = inject(TranslocoService);
  private router = inject(Router);

  constructor() {
    this.translocoService.langChanges$.subscribe(() => {
      // this.reloadCurrentComponent();
    });
  }

  private reloadCurrentComponent(): void {
    const currentUrl = this.router.url;
    // Reset routes to force Angular to drop internal route cache
    this.router.resetConfig(routes);

    // Use a dummy component route to fully reload
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigateByUrl(currentUrl);
    });
  }
}
