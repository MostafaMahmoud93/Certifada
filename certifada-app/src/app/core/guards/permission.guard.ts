import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';

/** Route-level plan gate. Use with route data: { action: Actions.X }. */
export const permissionGuard: CanActivateFn = (route) => {
  const perm = inject(PermissionService);
  const auth = inject(AuthService);
  const router = inject(Router);

  const action = route.data?.['action'] as string | undefined;
  if (!action) return true;

  // TEMP — until the backend provisions permission codes in the JWT, a user
  // with no action codes shouldn't be locked out of the whole app. Remove this
  // line once the API returns real codes so gating is actually enforced.
  if (!auth.userActions.length) return true;

  if (perm.has(action)) return true;

  // Authenticated but the role lacks this action -> dedicated Access Restricted page
  // (/app/forbidden is NOT gated, so there is no redirect loop).
  router.navigateByUrl('/app/forbidden');
  return false;
};
