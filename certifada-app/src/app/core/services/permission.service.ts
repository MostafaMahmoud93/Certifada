import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { RbacService } from './rbac.service';

/**
 * Single source of truth for "is this action allowed for the current user".
 * The backend returns the allowed action codes in the token (AuthService.userActions),
 * derived from the user's role. UI gating (appHasAction / *appCanAction / permissionGuard)
 * compares against that list.
 *
 * Fail-open: when no action list is present (e.g. local/dev token, or the backend
 * has not populated actions yet) the UI is NOT gated — the backend still enforces
 * real authorization on every request. As soon as a non-empty list arrives, gating
 * becomes strict.
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private auth = inject(AuthService);
  private rbac = inject(RbacService);

  /**
   * The action codes the UI is gated against right now. Source of truth is the
   * RBAC layer: the signed-in user's effective role permissions, or the previewed
   * role when "preview as role" is active. Falls back to the backend token list
   * for environments where RBAC has not been provisioned.
   */
  private allowed(): string[] {
    const rbac = this.rbac.gateCodes();
    const src = rbac.length ? rbac : (this.auth.userActions ?? []);
    return src.map((a) => (a || '').toLowerCase());
  }

  /** True when the user may perform `action`. */
  has(action: string | null | undefined): boolean {
    if (!action) return true;
    const list = this.allowed();
    // When previewing a role we enforce strictly (even an empty set = no access).
    // Otherwise an empty set means RBAC/token is not provisioned -> do not gate.
    if (list.length === 0) return this.rbac.isPreviewing() ? false : true;
    return list.includes(action.toLowerCase());
  }

  /** True when the user may perform ANY of the actions (used for "hide unless allowed"). */
  hasAny(actionsList: (string | null | undefined)[]): boolean {
    const real = actionsList.filter((a): a is string => !!a);
    if (real.length === 0) return true;
    const list = this.allowed();
    if (list.length === 0) return true;
    return real.some((a) => list.includes(a.toLowerCase()));
  }

  /** True when the user may perform ALL of the actions. */
  hasAll(actionsList: (string | null | undefined)[]): boolean {
    const real = actionsList.filter((a): a is string => !!a);
    if (real.length === 0) return true;
    const list = this.allowed();
    if (list.length === 0) return true;
    return real.every((a) => list.includes(a.toLowerCase()));
  }
}
