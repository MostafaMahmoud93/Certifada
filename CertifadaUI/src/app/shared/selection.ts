import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import type { Object as FabricObject } from 'fabric';

/** Tracks the current selection and which side panels are open. */
@Injectable({ providedIn: 'root' })
export class Selection {
  private readonly _active = new BehaviorSubject<boolean>(false);
  readonly active$ = this._active.asObservable();

  private readonly _selectedObject = new BehaviorSubject<FabricObject | null>(null);
  readonly selectedObject$ = this._selectedObject.asObservable();

  private readonly _selectedItem = new BehaviorSubject<string | null>(null);
  readonly selectedItem$ = this._selectedItem.asObservable();

  openDetailsPanel(open: boolean): void {
    this._active.next(open);
  }

  setSelectedObject(obj: FabricObject | null): void {
    this._selectedObject.next(obj);
  }

  setSelectedItem(item: string | null): void {
    this._selectedItem.next(item);
  }
}
