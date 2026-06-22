import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
   const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.accessToken;
  if (token && new Date(token.expiration) > new Date()) {
    return true;
  } else {
    authService.accessToken = null;
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url },
    });
    return false;
  }
};
