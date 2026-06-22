import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

/** Single source of truth for "is this action allowed for the current user". */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private auth = inject(AuthService);

  has(action: string | null | undefined): boolean {
    if (!action) return true;
    const allowed = this.auth.userActions.map((a) => a.toLowerCase());
    return allowed.includes(action.toLowerCase());
  }

  hasAny(actionsList: string[]): boolean {
    return actionsList.some((a) => this.has(a));
  }
}
