import { Injectable, signal } from '@angular/core';
import {
  Canvas,
  Circle,
  FabricImage,
  FabricObject,
  Line,
  Rect,
  Textbox,
  Triangle,
} from 'fabric';

/** Extra (non-standard) properties we persist on objects. */
const CUSTOM_PROPS = ['objType', 'fieldKey', 'tableId'] as const;

export interface CanvasObjectInfo {
  type: string;
  objType?: string;
  fieldKey?: string;
}

/**
 * Thin wrapper around a Fabric.js v6 canvas with all certificate-editing
 * operations. Provided at the component level so each designer gets its own
 * isolated instance.
 */
@Injectable()
export class FabricCanvasService {
  private canvas!: Canvas;

  // Undo / redo history (JSON snapshots).
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private isRestoring = false;

  /** The currently selected object, exposed to the properties panel. */
  readonly selected = signal<FabricObject | null>(null);
  /** Bumped on every meaningful change so the UI can re-read properties. */
  readonly revision = signal(0);
  readonly canUndo = signal(false);
  readonly canRedo = signal(false);
  readonly zoom = signal(1);

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------
  init(el: HTMLCanvasElement, width: number, height: number): void {
    this.canvas = new Canvas(el, {
      width,
      height,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: true,
    });

    FabricObject.prototype.transparentCorners = false;
    FabricObject.prototype.cornerColor = '#4f46e5';
    FabricObject.prototype.cornerStyle = 'circle';
    FabricObject.prototype.borderColor = '#4f46e5';
    FabricObject.prototype.cornerSize = 9;

    this.canvas.on('selection:created', () => this.syncSelection());
    this.canvas.on('selection:updated', () => this.syncSelection());
    this.canvas.on('selection:cleared', () => this.syncSelection());
    this.canvas.on('object:modified', () => this.snapshot());

    this.snapshot();
  }

  dispose(): void {
    this.canvas?.dispose();
    this.undoStack = [];
    this.redoStack = [];
  }

  getCanvas(): Canvas {
    return this.canvas;
  }

  private syncSelection(): void {
    this.selected.set(this.canvas.getActiveObject() ?? null);
    this.revision.update((v) => v + 1);
  }

  /** Re-read the currently selected object's properties into the UI. */
  touch(): void {
    this.canvas.requestRenderAll();
    this.revision.update((v) => v + 1);
  }

  // -------------------------------------------------------------------------
  // Adding objects
  // -------------------------------------------------------------------------
  private place(obj: FabricObject): void {
    const c = this.canvas;
    obj.set({ left: c.getWidth() / 2, top: c.getHeight() / 2, originX: 'center', originY: 'center' });
    c.add(obj);
    c.setActiveObject(obj);
    c.requestRenderAll();
    this.syncSelection();
    this.snapshot();
  }

  addHeading(): void {
    this.addText('Certificate of Achievement', { fontSize: 48, fontFamily: 'Playfair Display', fontWeight: '700' });
  }

  addText(text = 'Double-click to edit', extra: Record<string, unknown> = {}): void {
    const options: any = {
      fontSize: 24,
      fill: '#0f172a',
      fontFamily: 'Inter',
      textAlign: 'center',
      width: 360,
      ...extra,
    };
    const tb = new Textbox(text, options);
    (tb as any).objType = 'text';
    this.place(tb);
  }

  /** A dynamic field rendered as {{key}} and merged with data on export. */
  addField(key: string): void {
    const clean = key.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!clean) return;
    const tb = new Textbox(`{{${clean}}}`, {
      fontSize: 28,
      fill: '#4f46e5',
      fontFamily: 'Inter',
      fontWeight: '600',
      textAlign: 'center',
      width: 360,
    });
    (tb as any).objType = 'field';
    (tb as any).fieldKey = clean;
    this.place(tb);
  }

  addRect(): void {
    this.place(new Rect({ width: 220, height: 130, fill: 'rgba(79,70,229,0.12)', stroke: '#4f46e5', strokeWidth: 2, rx: 8, ry: 8 }));
  }

  addCircle(): void {
    this.place(new Circle({ radius: 70, fill: 'rgba(22,163,74,0.15)', stroke: '#16a34a', strokeWidth: 2 }));
  }

  addTriangle(): void {
    this.place(new Triangle({ width: 140, height: 120, fill: 'rgba(217,119,6,0.18)', stroke: '#d97706', strokeWidth: 2 }));
  }

  addLine(): void {
    const c = this.canvas;
    const y = c.getHeight() / 2;
    const line = new Line([c.getWidth() / 2 - 150, y, c.getWidth() / 2 + 150, y], {
      stroke: '#0f172a',
      strokeWidth: 3,
    });
    c.add(line);
    c.setActiveObject(line);
    c.requestRenderAll();
    this.syncSelection();
    this.snapshot();
  }

  async addImageFromUrl(url: string): Promise<void> {
    const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
    this.scaleToFit(img, 320, 320);
    (img as any).objType = 'image';
    this.place(img);
  }

  addImageFromFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          await this.addImageFromUrl(reader.result as string);
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private scaleToFit(img: FabricImage, maxW: number, maxH: number): void {
    const w = img.width ?? maxW;
    const h = img.height ?? maxH;
    const scale = Math.min(maxW / w, maxH / h, 1);
    img.scale(scale);
  }

  /**
   * Adds a grid table as independent, individually-editable cells plus grid
   * lines. Each piece is tagged with the same tableId.
   */
  addTable(rows = 3, cols = 3, cellW = 150, cellH = 44): void {
    const c = this.canvas;
    const tableId = `t_${Date.now()}`;
    const startX = (c.getWidth() - cols * cellW) / 2;
    const startY = (c.getHeight() - rows * cellH) / 2;
    const tableW = cols * cellW;
    const tableH = rows * cellH;

    const objs: FabricObject[] = [];

    // Cell text
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const cell = new Textbox(r === 0 ? `Header ${col + 1}` : 'Text', {
          left: startX + col * cellW + 8,
          top: startY + r * cellH + cellH / 2 - 9,
          width: cellW - 16,
          fontSize: 14,
          fontFamily: 'Inter',
          fill: '#0f172a',
          fontWeight: r === 0 ? '700' : '400',
          textAlign: 'left',
          editable: true,
        });
        (cell as any).objType = 'cell';
        (cell as any).tableId = tableId;
        objs.push(cell);
      }
    }

    // Grid lines
    const lineOpts = { stroke: '#94a3b8', strokeWidth: 1, selectable: true };
    for (let r = 0; r <= rows; r++) {
      const ln = new Line([startX, startY + r * cellH, startX + tableW, startY + r * cellH], lineOpts);
      (ln as any).tableId = tableId;
      (ln as any).objType = 'tableLine';
      objs.push(ln);
    }
    for (let col = 0; col <= cols; col++) {
      const ln = new Line([startX + col * cellW, startY, startX + col * cellW, startY + tableH], lineOpts);
      (ln as any).tableId = tableId;
      (ln as any).objType = 'tableLine';
      objs.push(ln);
    }

    objs.forEach((o) => c.add(o));
    c.requestRenderAll();
    this.snapshot();
  }

  // -------------------------------------------------------------------------
  // Object operations
  // -------------------------------------------------------------------------
  deleteSelected(): void {
    const objs = this.canvas.getActiveObjects();
    if (!objs.length) return;
    objs.forEach((o) => this.canvas.remove(o));
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
    this.syncSelection();
    this.snapshot();
  }

  async cloneSelected(): Promise<void> {
    const active = this.canvas.getActiveObject();
    if (!active) return;
    const cloned = await active.clone(CUSTOM_PROPS as unknown as string[]);
    cloned.set({ left: (active.left ?? 0) + 20, top: (active.top ?? 0) + 20 });
    this.canvas.add(cloned);
    this.canvas.setActiveObject(cloned);
    this.canvas.requestRenderAll();
    this.syncSelection();
    this.snapshot();
  }

  bringForward(): void {
    const o = this.canvas.getActiveObject();
    if (o) { this.canvas.bringObjectForward(o); this.canvas.requestRenderAll(); this.snapshot(); }
  }
  sendBackwards(): void {
    const o = this.canvas.getActiveObject();
    if (o) { this.canvas.sendObjectBackwards(o); this.canvas.requestRenderAll(); this.snapshot(); }
  }
  bringToFront(): void {
    const o = this.canvas.getActiveObject();
    if (o) { this.canvas.bringObjectToFront(o); this.canvas.requestRenderAll(); this.snapshot(); }
  }
  sendToBack(): void {
    const o = this.canvas.getActiveObject();
    if (o) { this.canvas.sendObjectToBack(o); this.canvas.requestRenderAll(); this.snapshot(); }
  }

  /** Update one or more properties on the active object. */
  setProp(props: Record<string, unknown>): void {
    const o = this.canvas.getActiveObject();
    if (!o) return;
    o.set(props);
    o.setCoords();
    this.canvas.requestRenderAll();
    this.revision.update((v) => v + 1);
  }

  commit(): void {
    this.snapshot();
  }

  align(mode: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom'): void {
    const o = this.canvas.getActiveObject();
    if (!o) return;
    const w = this.canvas.getWidth();
    const h = this.canvas.getHeight();
    const b = o.getBoundingRect();
    switch (mode) {
      case 'left': o.set({ left: (o.left ?? 0) - b.left }); break;
      case 'right': o.set({ left: (o.left ?? 0) + (w - (b.left + b.width)) }); break;
      case 'center-h': o.set({ left: (o.left ?? 0) + (w / 2 - (b.left + b.width / 2)) }); break;
      case 'top': o.set({ top: (o.top ?? 0) - b.top }); break;
      case 'bottom': o.set({ top: (o.top ?? 0) + (h - (b.top + b.height)) }); break;
      case 'center-v': o.set({ top: (o.top ?? 0) + (h / 2 - (b.top + b.height / 2)) }); break;
    }
    o.setCoords();
    this.canvas.requestRenderAll();
    this.snapshot();
  }

  // -------------------------------------------------------------------------
  // Canvas background & size
  // -------------------------------------------------------------------------
  setBackgroundColor(color: string): void {
    this.canvas.backgroundColor = color;
    this.canvas.requestRenderAll();
    this.snapshot();
  }

  async setBackgroundImage(url: string): Promise<void> {
    const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
    img.scaleX = this.canvas.getWidth() / (img.width ?? 1);
    img.scaleY = this.canvas.getHeight() / (img.height ?? 1);
    this.canvas.backgroundImage = img;
    this.canvas.requestRenderAll();
    this.snapshot();
  }

  removeBackgroundImage(): void {
    this.canvas.backgroundImage = undefined;
    this.canvas.requestRenderAll();
    this.snapshot();
  }

  resize(width: number, height: number): void {
    this.canvas.setDimensions({ width, height });
    this.canvas.requestRenderAll();
    this.snapshot();
  }

  // -------------------------------------------------------------------------
  // Zoom (visual only — does not affect export resolution)
  // -------------------------------------------------------------------------
  setZoom(z: number): void {
    const clamped = Math.min(3, Math.max(0.2, z));
    this.canvas.setZoom(clamped);
    this.zoom.set(clamped);
  }

  // -------------------------------------------------------------------------
  // Serialization
  // -------------------------------------------------------------------------
  toJSON(): string {
    // Use toObject (not toJSON) so our custom props are reliably serialized in Fabric v6.
    return JSON.stringify(this.canvas.toObject(CUSTOM_PROPS as unknown as string[]));
  }

  async loadJSON(json: string): Promise<void> {
    if (!json) return;
    this.isRestoring = true;
    await this.canvas.loadFromJSON(json);
    this.canvas.requestRenderAll();
    this.isRestoring = false;
    this.undoStack = [json];
    this.redoStack = [];
    this.updateUndoRedoFlags();
    this.syncSelection();
  }

  clear(): void {
    this.canvas.clear();
    this.canvas.backgroundColor = '#ffffff';
    this.canvas.requestRenderAll();
    this.snapshot();
  }

  /** All distinct {{field}} keys found in the design. */
  getPlaceholders(): string[] {
    const keys = new Set<string>();
    const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
    for (const o of this.canvas.getObjects()) {
      const t = (o as any).text as string | undefined;
      if (typeof t === 'string') {
        let m: RegExpExecArray | null;
        while ((m = re.exec(t)) !== null) keys.add(m[1]);
      }
      const fk = (o as any).fieldKey as string | undefined;
      if (fk) keys.add(fk);
    }
    return [...keys];
  }

  // -------------------------------------------------------------------------
  // Undo / redo
  // -------------------------------------------------------------------------
  private snapshot(): void {
    if (this.isRestoring) return;
    this.undoStack.push(this.toJSON());
    if (this.undoStack.length > 60) this.undoStack.shift();
    this.redoStack = [];
    this.updateUndoRedoFlags();
  }

  async undo(): Promise<void> {
    if (this.undoStack.length < 2) return;
    const current = this.undoStack.pop()!;
    this.redoStack.push(current);
    const prev = this.undoStack[this.undoStack.length - 1];
    await this.restore(prev);
  }

  async redo(): Promise<void> {
    const next = this.redoStack.pop();
    if (!next) return;
    this.undoStack.push(next);
    await this.restore(next);
  }

  private async restore(json: string): Promise<void> {
    this.isRestoring = true;
    await this.canvas.loadFromJSON(json);
    this.canvas.requestRenderAll();
    this.isRestoring = false;
    this.updateUndoRedoFlags();
    this.syncSelection();
  }

  private updateUndoRedoFlags(): void {
    this.canUndo.set(this.undoStack.length > 1);
    this.canRedo.set(this.redoStack.length > 0);
  }
}
