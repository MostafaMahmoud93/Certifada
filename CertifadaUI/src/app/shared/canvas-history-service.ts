import { Injectable } from '@angular/core';
import type { Canvas as FabricCanvas } from 'fabric';

/** JSON-snapshot undo/redo history for a Fabric canvas. */
@Injectable({ providedIn: 'root' })
export class CanvasHistoryService {
  private canvas: FabricCanvas | null = null;
  private stack: string[] = [];
  private index = -1;
  private restoring = false;

  init(canvas: FabricCanvas): void {
    this.canvas = canvas;
    this.stack = [];
    this.index = -1;
    this.snapshot();
    canvas.on('object:added' as any, () => this.snapshot());
    canvas.on('object:modified' as any, () => this.snapshot());
    canvas.on('object:removed' as any, () => this.snapshot());
  }

  private snapshot(): void {
    if (this.restoring || !this.canvas) return;
    this.stack = this.stack.slice(0, this.index + 1);
    this.stack.push(JSON.stringify(this.canvas.toJSON()));
    if (this.stack.length > 80) this.stack.shift();
    this.index = this.stack.length - 1;
  }

  canUndo(): boolean {
    return this.index > 0;
  }

  canRedo(): boolean {
    return this.index < this.stack.length - 1;
  }

  undo(): void {
    if (!this.canUndo()) return;
    this.index--;
    this.restore();
  }

  redo(): void {
    if (!this.canRedo()) return;
    this.index++;
    this.restore();
  }

  private restore(): void {
    if (!this.canvas) return;
    this.restoring = true;
    this.canvas.loadFromJSON(this.stack[this.index]).then(() => {
      this.canvas!.requestRenderAll();
      this.restoring = false;
    });
  }
}
