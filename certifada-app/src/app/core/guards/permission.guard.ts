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

  // Enforcement is driven by the RBAC layer (PermissionService.has) which is
  // preview-aware and defaults the signed-in owner to full access, so there is
  // no lock-out risk. `auth` is kept for future token-based checks.
  void auth;
  if (perm.has(action)) return true;

  // Authenticated but the role lacks this action -> dedicated Access Restricted page
  // (/app/forbidden is NOT gated, so there is no redirect loop).
  router.navigateByUrl('/app/forbidden');
  return false;
};
