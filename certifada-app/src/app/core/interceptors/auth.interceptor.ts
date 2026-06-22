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

  const token = auth.accessToken?.token;
  if (token) {
    request = request.clone({ headers: request.headers.set('Authorization', `Bearer ${token}`) });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        auth.signOut();
        router.navigateByUrl('/auth/login');
      }
      return throwError(() => error);
    }),
  );
};
