import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

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

  /** The current user's allowed action codes (lower-cased). */
  private allowed(): string[] {
    return (this.auth.userActions ?? []).map((a) => (a || '').toLowerCase());
  }

  /** True when the user may perform `action`. Empty/era unknown lists are allowed. */
  has(action: string | null | undefined): boolean {
    if (!action) return true;
    const list = this.allowed();
    if (list.length === 0) return true;            // no list from backend -> do not gate the UI
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
