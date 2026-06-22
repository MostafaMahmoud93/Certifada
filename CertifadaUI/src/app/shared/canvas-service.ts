import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import type { Canvas as FabricCanvas, Object as FabricObject } from 'fabric';

/**
 * Shared bus between the canvas editor and its panels.
 *  - canvas$        : the active Fabric canvas instance
 *  - shape$/text$/image$ : add-requests emitted by toolbars/panels, consumed by <app-canvas>
 */
@Injectable({ providedIn: 'root' })
export class CanvasService {
  private readonly _canvas = new BehaviorSubject<FabricCanvas | null>(null);
  readonly canvas$ = this._canvas.asObservable();

  private readonly _shape = new Subject<any>();
  readonly shape$ = this._shape.asObservable();

  private readonly _text = new Subject<any>();
  readonly text$ = this._text.asObservable();

  private readonly _image = new Subject<any>();
  readonly image$ = this._image.asObservable();

  setCanvasInstance(canvas: FabricCanvas): void {
    this._canvas.next(canvas);
  }

  get canvas(): FabricCanvas | null {
    return this._canvas.value;
  }

  addShape(shapeType: any): void {
    this._shape.next(shapeType);
  }

  addText(text: any = ''): void {
    this._text.next(text);
  }

  addImage(dataUrl: any): void {
    this._image.next(dataUrl);
  }

  /** Visual hover highlight from the layers panel (kept lightweight). */
  hoverObject(obj: FabricObject): void {
    const c = this._canvas.value;
    if (!c || !obj) return;
    (obj as any).__prevShadow = (obj as any).shadow ?? null;
    obj.set('shadow' as any, { color: 'rgba(79,70,229,0.9)', blur: 8, offsetX: 0, offsetY: 0 } as any);
    c.requestRenderAll();
  }

  resetHoverObject(obj: FabricObject): void {
    const c = this._canvas.value;
    if (!c || !obj) return;
    obj.set('shadow' as any, (obj as any).__prevShadow ?? null);
    c.requestRenderAll();
  }

  /** Hook for panels to signal that the undo/redo history should update. */
  updateUndoRedoStack(): void {
    const c = this._canvas.value;
    c?.fire('object:modified' as any, {} as any);
  }
}
