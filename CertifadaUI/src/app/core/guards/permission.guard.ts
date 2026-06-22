import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const userActions = authService.userActions || [];
  const featureId = route.data?.['featureId']?.toString() || '';

  if (!userActions.length) {
    // No actions available → force logout
    authService.accessToken = null;
    router.navigate(['/auth/login']);
    return false;
  }

  // Case-insensitive check
  const hasPermission = userActions.some(
    (a) => a.toLowerCase() === featureId.toLowerCase()
  );

  if (hasPermission) {
    return true;
  } else {
    // Redirect unauthorized users
    router.navigate(['/401-un-auth']);
    return false;
  }
};
