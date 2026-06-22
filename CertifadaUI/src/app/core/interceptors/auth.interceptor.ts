import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthUtils } from './AuthUtils';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const _authService = inject(AuthService);
  const _router = inject(Router);
  let lang = localStorage.getItem('lang');
  if (!lang) {
    lang = 'ar';
    localStorage.setItem('lang', lang);
  }
  const langHeader = lang === 'ar' ? 'ar-AE' : 'en-US';

  let newReq = req.clone({
    withCredentials: true,
    headers: req.headers.set('Accept-Language', langHeader)
  });

  if (_authService.accessToken?.token && !AuthUtils.isTokenExpired(_authService.accessToken.token)) {
    newReq = newReq.clone({
      headers: newReq.headers.set('Authorization', `Bearer ${_authService.accessToken.token}`)
    });
  }

  return next(newReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        if (error.error?.data === 403) {
          _router.navigateByUrl('/401-un-auth');
        } else {
          _authService.signOut();
          _router.navigateByUrl('/auth/login');
        }
      }
      return throwError(() => error);
    })
  );
};
