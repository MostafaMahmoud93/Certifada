import { Injectable } from '@angular/core';

/**
 * Ruler/guides state holder. The canvas board draws rulers itself; this service
 * exists for dependency injection and shared ruler state/flags.
 */
@Injectable({ providedIn: 'root' })
export class Ruler {
  show = true;
  unit: 'px' | 'cm' | 'in' = 'px';
}
