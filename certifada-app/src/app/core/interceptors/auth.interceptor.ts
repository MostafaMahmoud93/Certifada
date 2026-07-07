import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const lang = localStorage.getItem('lang') || 'en';
  let request = req.clone({
    withCredentials: true,
    headers: req.headers.set('Accept-Language', lang === 'ar' ? 'ar-AE' : 'en-US'),
  });

  // Recipient wallet is passwordless and email-owned — never attach the staff token to it,
  // and never bounce a recipient to the org login on 401 (the wallet handles its own auth).
  const isWallet = req.url.includes('/api/Wallet/') || req.url.includes('/api/wallet/');

  const token = auth.accessToken?.token;
  if (token && !isWallet) {
    request = request.clone({ headers: request.headers.set('Authorization', `Bearer ${token}`) });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isWallet) {
        auth.signOut();
        router.navigateByUrl('/auth/login');
      }
      return throwError(() => error);
    }),
  );
};
