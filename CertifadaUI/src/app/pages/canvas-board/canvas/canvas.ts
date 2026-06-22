import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  HostListener,
  Renderer2,
} from '@angular/core';
import { Selection } from '../../../shared/selection';
import * as fabric from 'fabric';
import { CanvasService } from '../../../shared/canvas-service';
import type {
  Canvas as FabricCanvas,
  Object as FabricObject,
  Group as FabricGroup,
  Line as FabricLine,
  ActiveSelection,
} from 'fabric';
import { ChangeDetectorRef } from '@angular/core';
import { CanvasHistoryService } from '../../../shared/canvas-history-service';
import { TableConfigComponent } from '../table-config/table-config.component';
import { TableCell, TableModel, TableRow } from '../table-config/table.model';
import { CellEditorComponent } from '../table-config/cell-editor.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-canvas',
  standalone: false,
  templateUrl: './canvas.html',
  styleUrls: ['./canvas.css'],
})
export class Canvas implements AfterViewInit {
  private canvas!: fabric.Canvas;
  private gridSize = 1;
  private gridSizeR = 10;
  private canvasWidth!: number;
  private canvasHeight!: number;
  private readonly SNAP_TOLERANCE = 5;
  private clipboard: FabricObject | null = null;
  private gridLines: fabric.Line[] = [];

  showRulers = true;
  showGridLines = false;
  showGuideLines = false;
  showDistanceIndicators = true;
  selectedObject: fabric.Object | null = null;
  toolbarStyle: { [key: string]: string } = {};
  toolbarVisible = false;
  menuVisible = false;
  menuLeft = 0;
  menuTop = 0;
  contextTarget: fabric.Object | null = null;
  toolbarsubMenuVisible = false;
  editingMode = false;
  openSubMenu: string | null = null;
  dragging = false;
  dragStartX = 0;
  dragStartY = 0;
  toolbarPosX = 0;
  toolbarPosY = 0;
  tooltip = {
    visible: false,
    x: 0,
    y: 0,
    text: '',
  };

  cropRect?: fabric.Rect;
  isCropping: boolean = false;

  @ViewChild('fabricCanvas', { static: true })
  canvasEl!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer', { static: true })
  containerEl!: ElementRef<HTMLDivElement>;
  @ViewChild('guidesOverlay', { static: true })
  guidesOverlay!: ElementRef<SVGElement>;

  size: any = { width: 792, height: 612 };

  selectedTableModel: TableModel | null = null;
  selectedCell: TableCell | null = null;
  selectedGroup: fabric.Group | null = null;
  selectedCellRowIndex: number | null = null;
  selectedCellColIndex: number | null = null;

  constructor(
    private selectionService: Selection,
    private canvasService: CanvasService,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private canvasHistoryService: CanvasHistoryService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.canvas = new fabric.Canvas(this.canvasEl.nativeElement, {
      selection: true,
      subTargetCheck: true,
      // fireRightClick: true,
      // stopContextMenu: true,
      // perPixelTargetFind: true, // important for better sub-object detection
      // targetFindTolerance: 5
    });
    this.canvas.setWidth(this.size.width);
    this.canvas.setHeight(this.size.height);
    this.canvasService.setCanvasInstance(this.canvas);
    this.canvas.preserveObjectStacking = true;
    // this.canvas.skipTargetFind = false;
    // this.canvas.selection = false;
    this.canvasHistoryService.init(this.canvas);
  }
  ngAfterViewInit(): void {
    this.canvas.on('selection:created', (e: any) => {
      const obj = e.selected?.[0] || null;
      this.selectionService.setSelectedObject(obj);
      this.contextTarget = obj;
      this.showtoolbar();
    });

    this.canvas.on('selection:updated', (e: any) => {
      const obj = e.selected?.[0] ?? null;
      this.selectionService.setSelectedObject(obj);
      this.contextTarget = obj;
      this.showtoolbar();
    });

    this.canvas.on('selection:cleared', () => {
      this.selectionService.setSelectedObject(null);
      this.toolbarVisible = false;
      this.toolbarsubMenuVisible = false;
      this.tooltip.visible = false;
    });

    this.canvas.upperCanvasEl.addEventListener('contextmenu', (e: MouseEvent) =>
      e.preventDefault()
    );

    this.canvas.on('object:moving', (e) => {
      this.onObjectMoving(e.target as FabricObject);
    });

    this.canvas.on('object:modified', () => {
      this.clearAlignmentGuides();
      this.clearDistanceIndicators(this.canvas);

     
    });

    this.canvas.on('mouse:down', () => this.clearAlignmentGuides());

    this.canvas.on('mouse:down', (e) => {
      const evt = e.e as MouseEvent;
      if (evt.button !== 2 && this.menuVisible) {
        this.hideContextMenu();
      }

      if (evt.button === 0) {
        // Left click
        const pointer = this.canvas.getPointer(evt);
        const target = this.canvas.findTarget(evt);

        if (!target) {
          return;
        }
        if (target.get('IsTable')) {
          const group = target as fabric.Group;
          const model = target.get('tableModel');

          this.selectedGroup = group as fabric.Group;
          this.selectedTableModel = model;
          this.selectedCell = null;

          let clickedCell: fabric.Object | null = null;
          for (let i = group._objects.length - 1; i >= 0; i--) {
            const cell = group._objects[i] as fabric.Object;
            if (cell.containsPoint(pointer) && cell.get('IsTableCell')) {
              clickedCell = cell;
              break;
            }
          }

          if (clickedCell) {
            const cellData = clickedCell.get('cellData');
            if (cellData && model) {
              this.selectedCell =
                model.rows[cellData.rowIndex].cells[cellData.colIndex];
            }
          }
        }
      }
    });

    this.canvasService.shape$.subscribe((type) => {
      this.insertShape(type);
    });
    this.canvasService.text$.subscribe((text) => this.insertText(text));
    this.canvasService.image$.subscribe((dataUrl) => this.insertImage(dataUrl));

    this.canvasWidth = this.canvas.getWidth();
    this.canvasHeight = this.canvas.getHeight();

    // edit tet bo in HTML textarea
    this.canvas.on('mouse:dblclick', (opt) => {
      const target = opt.target;
      if (target?.get('IsVariable')) return;
      if (target && (target.type === 'textbox' || target.type === 'i-text')) {
        const textbox = target as fabric.Textbox;
        const canvasPosition = this.canvas.getElement().getBoundingClientRect();

        const input = document.createElement('textarea');
        input.value = textbox.text || '';
        input.style.position = 'absolute';
        input.style.left = canvasPosition.left + textbox.left! + 'px';
        input.style.top = canvasPosition.top + textbox.top! + 'px';
        input.style.width = textbox.width + 'px';
        input.style.height = 'auto';
        input.style.fontSize = textbox.fontSize + 'px';
        input.style.direction = 'rtl';
        input.style.textAlign = 'right';
        input.style.lineHeight = '1.2';
        input.style.fontFamily = 'Arial';
        input.style.zIndex = '1000';

        document.body.appendChild(input);
        input.focus();

        input.onblur = () => {
          textbox.set('text', input.value);
          this.canvas.requestRenderAll();
          this.cdr.detectChanges();
          document.body.removeChild(input);
        };
      }
    });

    this.canvas.on('object:moving', (e) => {
      const obj = e.target;
      if (!obj) return;

      const zoom = this.canvas.getZoom();
      const vpt = this.canvas.viewportTransform;

      // Clear top context (used for overlays like bounding boxes)
      this.canvas.clearContext(this.canvas.contextTop);

      // 1. Calculate object's center in canvas coordinates
      const centerX = obj.left! + obj.getScaledWidth()! / 2;
      const centerY = obj.top! + obj.getScaledHeight()! / 2;

      // 2. Snap to grid (canvas space)
      const snappedCenterX =
        Math.round(centerX / this.gridSize) * this.gridSize;
      const snappedCenterY =
        Math.round(centerY / this.gridSize) * this.gridSize;
      const snappedX = snappedCenterX - obj.getScaledWidth()! / 2;
      const snappedY = snappedCenterY - obj.getScaledHeight()! / 2;

      // 3. Update object position
      obj.set({ left: snappedX, top: snappedY });

      // 4. Get object's top-center position in screen (DOM) space
      const bounds = obj.getBoundingRect();
      const objectCenterX = bounds.left + bounds.width / 2;
      const objectTopY = bounds.top;

      const screenX = objectCenterX * vpt[0] + vpt[4];
      const screenY = objectTopY * vpt[3] + vpt[5];

      const padding = 40; // Space between object and toolbar

      // 5. Update DOM toolbar position using screen coordinates
      this.toolbarStyle = {
        left: `${screenX - padding * 2}px`,
        top: `${screenY - padding}px`,
      };

      this.toolbarVisible = true;
    });

    this.canvas.on('object:scaling', (e) => {
      const obj = e.target;
      if (!obj) return;

      this.canvas.clearContext(this.canvas.contextTop);

      if (obj.type === 'i-text') {
        const text = obj as fabric.IText;

        // Apply scale to font size
        const newFontSize = (text.fontSize ?? 40) * text.scaleY;

        // Optional: Snap font size to grid
        const snappedFontSize =
          Math.round(newFontSize / this.gridSize) * this.gridSize;

        text.set({
          fontSize: snappedFontSize,
          scaleX: 1,
          scaleY: 1,
          width: undefined, // Reset width so it recalculates
          height: undefined,
        });
        return;
      }

      const scaledWidth = obj.width! * obj.scaleX!;
      const scaledHeight = obj.height! * obj.scaleY!;
      const centerX = obj.left! + scaledWidth / 2;
      const centerY = obj.top! + scaledHeight / 2;
      const snappedCenterX =
        Math.round(centerX / this.gridSize) * this.gridSize;
      const snappedCenterY =
        Math.round(centerY / this.gridSize) * this.gridSize;
      const snappedX = snappedCenterX - scaledWidth / 2;
      const snappedY = snappedCenterY - scaledHeight / 2;

      obj.set({ left: snappedX, top: snappedY });
      // this.updateGuides(snappedCenterX, snappedCenterY);
    });

    this.canvas.on('mouse:over', (e) => {
      const obj = e.target;
      if (!obj || this.editingMode) return;

   const zoom = this.canvas.getZoom();
const vpt = this.canvas.viewportTransform; // [scaleX, skewX, skewY, scaleY, translateX, translateY]
const bounds = obj.getBoundingRect(); // untransformed
const ctx = this.canvas.contextTop;

this.canvas.clearContext(ctx);
ctx.save();

// Apply viewport transform to match canvas view (including zoom/pan)
ctx.setTransform(vpt[0], vpt[1], vpt[2], vpt[3], vpt[4], vpt[5]);

// Draw outline
ctx.setLineDash([4, 2]);
ctx.strokeStyle = '#1E90FF';
ctx.lineWidth = 2 / zoom; // Normalize line width
ctx.strokeRect(bounds.left, bounds.top, bounds.width, bounds.height);

ctx.restore();

      if (obj.get('IsVariable')) {
        if (obj.get('Tooltip')) {
          this.tooltip.visible = true;
          this.tooltip.text = obj.get('Tooltip');
          this.tooltip.x = bounds.left;
          this.tooltip.y = bounds.top - 10;
          this.cdr.detectChanges(); // force UI refresh
        }
      }
    });

    this.canvas.on('mouse:out', (e) => {
      this.canvas.clearContext(this.canvas.contextTop);
      this.tooltip.visible = false;
      this.cdr.detectChanges(); // force UI refresh
    });

    this.canvas.on('mouse:wheel', (opt: fabric.TEvent<WheelEvent>) => {
      const e = opt.e;
      if (!e.ctrlKey) return;

      const delta = opt.e.deltaY;
      let zoom = this.canvas.getZoom();
      zoom *= 0.999 ** delta;

      zoom = Math.max(0.5, Math.min(3, zoom));
      const point = new fabric.Point(opt.e.offsetX, opt.e.offsetY);
      this.canvas.zoomToPoint(point, zoom);

      if (delta > 0) {
        this.canvas.setCursor('zoom-out');
      } else {
        this.canvas.setCursor('zoom-in');
      }

      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;

    this.canvas.on('mouse:down', (opt: fabric.TEvent) => {
      const e = opt.e;

      if ('clientX' in e && e.altKey) {
        isDragging = true;
        lastPosX = e.clientX;
        lastPosY = e.clientY;
        this.canvas.setCursor('grab');
        this.canvas.selection = false;
      }
    });

    this.canvas.on('mouse:move', (opt: fabric.TEvent) => {
      if (isDragging) {
        const e = opt.e;

        if ('clientX' in e && 'clientY' in e) {
          const vpt = this.canvas.viewportTransform!;
          vpt[4] += e.clientX - lastPosX;
          vpt[5] += e.clientY - lastPosY;
          this.canvas.requestRenderAll();

          lastPosX = e.clientX;
          lastPosY = e.clientY;
        }
      }
      this.tooltip.visible = false;
    });

    this.canvas.on('mouse:up', () => {
      isDragging = false;
      this.canvas.setCursor('default');
      this.canvas.selection = true;
    });

    this.canvas.on('object:moving', (e) => {
      if (!this.showDistanceIndicators) return;
      const movingObject = e.target;
      const otherObjects = this.canvas
        .getObjects()
        .filter(
          (obj) =>
            obj !== movingObject &&
            obj.type !== 'line' &&
            (obj as any).name !== 'distance-indicator'
        );

      this.clearDistanceIndicators(this.canvas);

      for (const target of otherObjects) {
        const result = this.getSingleAlignmentDistance(movingObject, target);
        if (result) {
          this.drawDistanceIndicator(this.canvas, result);
        }
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up canvas event listeners and history to prevent memory leaks
    if (this.canvas) {
      this.canvas.dispose();
    }
  }

  private onObjectMoving(movingObj: FabricObject) {
    this.clearAlignmentGuides();

    const objects = this.canvas
      .getObjects()
      .filter((obj) => !obj.get('guide') && obj !== movingObj);
    const mvLeft = movingObj.left!;
    const mvTop = movingObj.top!;
    const mvRight = mvLeft + movingObj.width! * movingObj.scaleX!;
    const mvBottom = mvTop + movingObj.height! * movingObj.scaleY!;
    const mvHCenter = mvLeft + (movingObj.width! * movingObj.scaleX!) / 2;
    const mvVCenter = mvTop + (movingObj.height! * movingObj.scaleY!) / 2;

    objects.forEach((obj) => {
      const oLeft = obj.left!;
      const oTop = obj.top!;
      const oRight = oLeft + obj.width! * obj.scaleX!;
      const oBottom = oTop + obj.height! * obj.scaleY!;
      const oHCenter = oLeft + (obj.width! * obj.scaleX!) / 2;
      const oVCenter = oTop + (obj.height! * obj.scaleY!) / 2;

      // Vertical snaps
      if (Math.abs(mvLeft - oLeft) < this.SNAP_TOLERANCE) {
        this.drawVerticalGuide(oLeft);
        movingObj.set({ left: oLeft });
      } else if (Math.abs(mvRight - oRight) < this.SNAP_TOLERANCE) {
        this.drawVerticalGuide(oRight);
        movingObj.set({ left: oRight - movingObj.width! * movingObj.scaleX! });
      } else if (Math.abs(mvHCenter - oHCenter) < this.SNAP_TOLERANCE) {
        this.drawVerticalGuide(oHCenter);
        movingObj.set({
          left: oHCenter - (movingObj.width! * movingObj.scaleX!) / 2,
        });
      }

      // Horizontal snaps
      if (Math.abs(mvTop - oTop) < this.SNAP_TOLERANCE) {
        this.drawHorizontalGuide(oTop);
        movingObj.set({ top: oTop });
      } else if (Math.abs(mvBottom - oBottom) < this.SNAP_TOLERANCE) {
        this.drawHorizontalGuide(oBottom);
        movingObj.set({ top: oBottom - movingObj.height! * movingObj.scaleY! });
      } else if (Math.abs(mvVCenter - oVCenter) < this.SNAP_TOLERANCE) {
        this.drawHorizontalGuide(oVCenter);
        movingObj.set({
          top: oVCenter - (movingObj.height! * movingObj.scaleY!) / 2,
        });
      }
    });

    this.canvas.requestRenderAll();
  }

  private drawVerticalGuide(x: number) {
    if (!this.showGuideLines) {
      return;
    }
    const line = new fabric.Line([x, 0, x, this.canvas.getHeight()], {
      stroke: 'red',
      strokeWidth: 1,
      selectable: false,
      evented: false,
    }) as FabricLine;
    line.set('guide', true);
    this.canvas.add(line);
  }

  private drawHorizontalGuide(y: number) {
    if (!this.showGuideLines) {
      return;
    }
    const line = new fabric.Line([0, y, this.canvas.getWidth(), y], {
      stroke: 'red',
      strokeWidth: 1,
      selectable: false,
      evented: false,
    }) as FabricLine;
    line.set('guide', true);
    this.canvas.add(line);
  }

  private clearAlignmentGuides() {
    this.canvas
      .getObjects()
      .filter((obj) => obj.get('guide'))
      .forEach((obj) => this.canvas.remove(obj));
  }

  onCanvasContextMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const pointer = this.canvas.getPointer(event);
    let target: fabric.Object | null = null;
    const allObjects = this.canvas.getObjects();
    for (let i = allObjects.length - 1; i >= 0; i--) {
      if ((allObjects[i] as any).containsPoint(pointer)) {
        target = allObjects[i] as fabric.Object;
        break;
      }
    }

    this.contextTarget = target;
    this.menuLeft = event.clientX;
    this.menuTop = event.clientY;

    if (this.contextTarget && this.contextTarget.get('IsVariable')) {
      this.menuVisible = false;
      return;
    }

    this.menuVisible = true;

    if (event.button === 2) {
      // Right click
      const pointer = this.canvas.getPointer(event);
      const target = this.canvas.findTarget(event);

      if (!target) {
        return;
      }
      if (target.get('IsTable')) {
        const group = target as fabric.Group;
        const model = target.get('tableModel');

        this.selectedGroup = group as fabric.Group;
        this.selectedTableModel = model;
        this.selectedCell = null;

        let clickedCell: fabric.Object | null = null;

        for (let i = group._objects.length - 1; i >= 0; i--) {
          const cell = group._objects[i] as fabric.Object;
          if (cell.containsPoint(pointer) && cell.get('IsTableCell')) {
            clickedCell = cell;
            break;
          }
        }

        if (clickedCell) {
          const cellData = clickedCell.get('cellData');
          if (cellData && model) {
            const realCell =
              model.rows[cellData.rowIndex].cells[cellData.colIndex];
            this.selectedCell = realCell;
            this.selectedCellRowIndex = cellData.rowIndex;
            this.selectedCellColIndex = cellData.colIndex;
          }
        }
      }
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlKey = isMac ? event.metaKey : event.ctrlKey;

    // Ctrl + A → Select all
    if (ctrlKey && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      const allObjects = this.canvas
        .getObjects()
        .filter((obj) => !(obj as any).isGridLine);

      if (allObjects.length === 0) return;

      const sel = new fabric.ActiveSelection(allObjects.concat(), {
        canvas: this.canvas,
      });
      this.canvas.setActiveObject(sel);
      this.canvas.requestRenderAll();
      this.selectionService.setSelectedObject(sel);
    }
    // Ctrl + C → Copy
    if (ctrlKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();

      const active = this.canvas.getActiveObject();
      if (!active) return;
      if (active.get('IsVariable')) return;

      this.canvas
        .getActiveObject()
        ?.clone()
        .then((cloned) => {
          this.clipboard = cloned;
        });
    }
    // Ctrl + V → Paste
    if (ctrlKey && event.key.toLowerCase() === 'v') {
      event.preventDefault();
      if (!this.clipboard) return;

      this.clipboard.clone().then((cloned: fabric.Object) => {
        // Offset position slightly
        cloned.set({
          left: (cloned.left ?? 0) + 10,
          top: (cloned.top ?? 0) + 10,
          evented: true,
        });

        // Add to canvas
        this.canvas.add(cloned);
        this.canvas.setActiveObject(cloned);
        this.canvas.renderAll();

        // Update clipboard to the newly pasted object (for further Ctrl+V)
        this.clipboard = cloned;
      });
    }
    // Delete or Backspace → Remove selected
    if (event.key === 'Delete') {
      event.preventDefault();
      const active = this.canvas.getActiveObject();
      if (!active) return;
      if (active.get('IsVariable')) return;

      if (active.type === 'activeSelection') {
        const sel = active as ActiveSelection;
        sel.getObjects().forEach((obj) => this.canvas.remove(obj));
        this.canvas.discardActiveObject();
      } else {
        this.canvas.remove(active);
      }
      this.canvas.requestRenderAll();
      this.selectionService.setSelectedObject(null);
      this.canvas.clearContext(this.canvas.contextTop);
    }
  }

  deleteSelected() {
    if (this.contextTarget) {
      if (this.contextTarget.get('IsVariable')) return;
      this.canvas.remove(this.contextTarget);
      this.canvas.requestRenderAll();
    }
    this.hideContextMenu();
  }

  duplicateSelected() {
    if (this.contextTarget) {
      this.contextTarget
        .clone()
        .then((cloned: FabricObject) => {
          if (cloned && this.contextTarget) {
            cloned.set({
              left: (this.contextTarget.left ?? 0) + 20,
              top: (this.contextTarget.top ?? 0) + 20,
              evented: true,
              selectable: true,
            });
            this.canvas.add(cloned);
            this.canvas.setActiveObject(cloned);
            this.canvas.requestRenderAll();
            this.selectionService.setSelectedObject(cloned);
          }
        })
        .catch((error) => {
          console.error('Error cloning object:', error);
        });
    }
    this.hideContextMenu();
  }

  groupSelected(): void {
    if (!this.canvas.getActiveObject()) {
      return;
    }
    if (
      this.canvas.getActiveObject()?.type !== 'activeSelection' &&
      this.canvas.getActiveObject()?.type !== 'activeselection'
    ) {
      return;
    }

    const activeObject = this.canvas.getActiveObject();
    if (activeObject && activeObject instanceof fabric.Group) {
      const group = new fabric.Group(activeObject.removeAll());
      this.canvas.add(group);
      this.canvas.setActiveObject(group);
      this.canvas.requestRenderAll();
    }
    this.hideContextMenu();
  }

  ungroupSelected() {
    const group = this.canvas.getActiveObject();
    if (!group || !(group instanceof fabric.Group)) {
      return;
    }
    this.canvas.remove(group);
    const objects = group.removeAll();
    objects.forEach((obj) => {});
    const selection = new fabric.ActiveSelection(objects, {
      canvas: this.canvas,
    });
    this.canvas.setActiveObject(selection);
    this.canvas.requestRenderAll();
    this.hideContextMenu();
  }

  toggleGridLines() {
    this.showGridLines = !this.showGridLines;
    if (this.showGridLines) {
      this.drawGridLines();
    } else {
      this.removeGridLines();
    }
    this.hideContextMenu();
  }

  toggleGuideLines() {
    this.showGuideLines = !this.showGuideLines;
    this.hideContextMenu();
  }

  toggleDistanceIndicators() {
    this.showDistanceIndicators = !this.showDistanceIndicators;
    this.hideContextMenu();
  }

  private hideContextMenu() {
    this.menuVisible = false;
    this.openSubMenu = null;
    //this.contextTarget = null;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(evt: MouseEvent) {
    if (this.menuVisible) {
      this.hideContextMenu();
    }
  }

  private insertShape(type: string) {
    let obj: fabric.Object;
    switch (type) {
      case 'rect':
        obj = new fabric.Rect({
          width: 100,
          height: 60,
          fill: 'blue',
          left: 50,
          top: 50,
        });
        break;
      case 'circle':
        obj = new fabric.Circle({ radius: 30, fill: 'red', left: 50, top: 50 });
        break;
      case 'triangle':
        obj = new fabric.Triangle({
          width: 80,
          height: 80,
          fill: 'yellow',
          left: 50,
          top: 50,
        });
        break;
      case 'ellipse':
        obj = new fabric.Ellipse({
          rx: 40,
          ry: 20,
          fill: 'green',
          left: 50,
          top: 50,
        });
        break;
      case 'diagonal':
        obj = new fabric.Line([50, 50, 200, 200], {
          left: 100,
          top: 100,
          stroke: 'red',
          strokeWidth: 5,
        });
        break;
      case 'vertical':
        obj = new fabric.Line([0, 0, 0, 400], {
          left: 300,
          top: 100,
          stroke: 'green',
          strokeWidth: 5,
        });
        break;
      case 'horizontal':
        obj = new fabric.Line([0, 0, 400, 0], {
          left: 100,
          top: 200,
          stroke: 'blue',
          strokeWidth: 5,
        });
        break;
      case 'pentagon':
        obj = new fabric.Polygon(
          [
            { x: 50, y: 10 },
            { x: 90, y: 40 },
            { x: 75, y: 85 },
            { x: 25, y: 85 },
            { x: 10, y: 40 },
          ],
          { fill: 'pink', left: 50, top: 50, scaleX: 0.5, scaleY: 0.5 }
        );
        break;
      case 'hexagon':
        obj = new fabric.Polygon(
          [
            { x: 50, y: 5 },
            { x: 90, y: 30 },
            { x: 90, y: 70 },
            { x: 50, y: 95 },
            { x: 10, y: 70 },
            { x: 10, y: 30 },
          ],
          {
            fill: 'purple',
            left: 50,
            top: 50,
            scaleX: 0.5,
            scaleY: 0.5,
          }
        );
        break;
      case 'star':
        obj = new fabric.Polygon(
          [
            { x: 50, y: 5 },
            { x: 61, y: 35 },
            { x: 95, y: 35 },
            { x: 68, y: 57 },
            { x: 79, y: 91 },
            { x: 50, y: 70 },
            { x: 21, y: 91 },
            { x: 32, y: 57 },
            { x: 5, y: 35 },
            { x: 39, y: 35 },
          ],
          { fill: 'orange', left: 50, top: 50, scaleX: 0.5, scaleY: 0.5 }
        );
        break;
      case 'roundedRect':
        obj = new fabric.Rect({
          width: 100,
          height: 60,
          rx: 10,
          ry: 10,
          fill: 'lightblue',
          left: 50,
          top: 50,
        });
        break;
      case 'arrow':
        obj = new fabric.Polygon(
          [
            { x: 4, y: 16 },
            { x: 22, y: 16 },
            { x: 22, y: 10 },
            { x: 30, y: 18 },
            { x: 22, y: 26 },
            { x: 22, y: 20 },
            { x: 4, y: 20 },
          ],
          { fill: 'blue', left: 50, top: 50 }
        );
        break;
      case 'cross':
        obj = new fabric.Path(
          'M12 4 H20 V12 H28 V20 H20 V28 H12 V20 H4 V12 H12 Z',
          { fill: 'blue', left: 50, top: 50 }
        );
        break;
      case 'heart':
        obj = new fabric.Path(
          'M16 29 C4 20, 4 8, 16 12 C28 8, 28 20, 16 29 Z',
          {
            fill: 'red',
            left: 50,
            top: 50,
            scaleX: 1.5,
            scaleY: 1.5,
          }
        );
        break;
      case 'parallelogram':
        obj = new fabric.Polygon(
          [
            { x: 8, y: 4 },
            { x: 28, y: 4 },
            { x: 24, y: 28 },
            { x: 4, y: 28 },
          ],
          { fill: 'green', left: 50, top: 50 }
        );
        break;
      case 'trapezoid':
        obj = new fabric.Polygon(
          [
            { x: 10, y: 4 },
            { x: 22, y: 4 },
            { x: 28, y: 28 },
            { x: 4, y: 28 },
          ],
          { fill: 'purple', left: 50, top: 50 }
        );
        break;
      case 'moon':
        obj = new fabric.Path('M20 16a12 12 0 1 1-8-11.31A9 9 0 1 0 20 16z', {
          fill: 'orange',
          left: 50,
          top: 50,
        });
        break;
      case 'diamond':
        obj = new fabric.Polygon(
          [
            { x: 16, y: 2 },
            { x: 30, y: 16 },
            { x: 16, y: 30 },
            { x: 2, y: 16 },
          ],
          { fill: 'cyan', left: 50, top: 50 }
        );
        break;
      case 'cloud':
        obj = new fabric.Path(
          'M10 24h13a6 6 0 0 0 1-11.9 8 8 0 0 0-15-1.1A5 5 0 0 0 10 24z',
          { fill: 'lightblue', left: 50, top: 50 }
        );
        break;
      case 'capsule':
        obj = new fabric.Rect({
          width: 100,
          height: 30,
          rx: 15,
          ry: 15,
          fill: 'gray',
          left: 50,
          top: 50,
        });
        break;
      case 'ring':
        obj = new fabric.Group(
          [
            new fabric.Circle({
              radius: 30,
              fill: 'lightgrey',
              originX: 'center',
              originY: 'center',
            }),
            new fabric.Circle({
              radius: 15,
              fill: 'white',
              originX: 'center',
              originY: 'center',
            }),
          ],
          {
            left: 50,
            top: 50,
          }
        );
        break;
      case 'chevron':
        obj = new fabric.Polygon(
          [
            { x: 10, y: 4 },
            { x: 22, y: 16 },
            { x: 10, y: 28 },
          ],
          { fill: 'brown', left: 50, top: 50 }
        );
        break;
      case 'arrowDown':
        obj = new fabric.Polygon(
          [
            { x: 4, y: 12 },
            { x: 16, y: 24 },
            { x: 28, y: 12 },
          ],
          { fill: 'black', left: 50, top: 50 }
        );
        break;
      case 'arrowUp':
        obj = new fabric.Polygon(
          [
            { x: 4, y: 20 },
            { x: 16, y: 8 },
            { x: 28, y: 20 },
          ],
          { fill: 'black', left: 50, top: 50 }
        );
        break;
      case 'rightTriangle':
        obj = new fabric.Polygon(
          [
            { x: 4, y: 4 },
            { x: 28, y: 4 },
            { x: 4, y: 28 },
          ],
          { fill: 'green', left: 50, top: 50 }
        );
        break;
      case 'frame':
        obj = new fabric.Group(
          [
            new fabric.Rect({
              left: 0,
              top: 0,
              width: 28,
              height: 28,
              fill: 'blue',
            }),
            new fabric.Rect({
              left: 4,
              top: 4,
              width: 20,
              height: 20,
              fill: 'white',
            }),
          ],
          { left: 50, top: 50 }
        );
        break;
      case 'paths':
        const path1 = new fabric.Path('M 10 10 L 50 50 L 10 50 Z', {
          fill: 'red',
          stroke: 'black',
          strokeWidth: 2,
        });
        const path2 = new fabric.Path('M 60 60 L 100 100 L 60 100 Z', {
          fill: 'blue',
          stroke: 'black',
          strokeWidth: 2,
        });
        const path3 = new fabric.Path('M 120 120 L 160 160 L 120 160 Z', {
          fill: 'green',
          stroke: 'black',
          strokeWidth: 2,
        });

        obj = new fabric.Group([path1, path2, path3], {
          left: 100,
          top: 50,
        });

        break;

      default:
        return;
    }

    this.canvas.add(obj);

    obj.on('mousedblclick', () => {
      this.editingMode = !this.editingMode;
      if (this.editingMode) {
        obj.cornerStyle = 'circle';
        obj.cornerColor = 'rgba(0,0,255,0.5)';
        obj.hasBorders = false;
        obj.controls = fabric.controlsUtils.createPolyControls(
          obj as fabric.Polygon
        );
      } else {
        obj.cornerColor = 'blue';
        obj.cornerStyle = 'rect';
        obj.hasBorders = true;
        obj.controls = fabric.controlsUtils.createObjectDefaultControls();
      }
      obj.setCoords();
      this.canvas.requestRenderAll();
    });

    this.canvas.setActiveObject(obj);
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private insertText(text: string) {
    // Create a new Fabric.Text object:
    const txtObj = new fabric.Text(text, {
      left: 50,
      top: 50,
      fill: 'black',
      fontFamily: 'Helvetica',
      fontSize: 24,
      selectable: true,
    });

    this.canvas.add(txtObj);
    this.canvas.setActiveObject(txtObj);
  }

  private insertImage(dataUrl: string) {
    fabric.util
      .loadImage(dataUrl)
      .then((img: HTMLImageElement) => {
        // If you need crossOrigin, set it here before wrapping:
        img.crossOrigin = 'anonymous';

        const imgObj = new fabric.Image(img, {
          left: 50,
          top: 50,
          selectable: true,
          scaleX: 1,
          scaleY: 1,
        });

        const maxWidth = 300;
        const maxHeight = 300;
        const scaleX = maxWidth / imgObj.width!;
        const scaleY = maxHeight / imgObj.height!;
        const scale = Math.min(1, Math.min(scaleX, scaleY));
        imgObj.scaleX = scale;
        imgObj.scaleY = scale;

        this.canvas.add(imgObj);
        this.canvas.setActiveObject(imgObj);
        this.canvas.requestRenderAll();
      })
      .catch((err) => {
        console.error('[DEBUG] insertImage(): loadImage failed:', err);
      });
  }

  startDrag(event: MouseEvent) {
    this.dragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    // Save initial position
    this.toolbarPosX = parseInt(this.toolbarStyle['left'] as string, 10);
    this.toolbarPosY = parseInt(this.toolbarStyle['top'] as string, 10);
  }

  onDrag(event: MouseEvent) {
    if (!this.dragging) return;

    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;

    this.toolbarStyle = {
      ...this.toolbarStyle,
      left: `${this.toolbarPosX + deltaX}px`,
      top: `${this.toolbarPosY + deltaY}px`,
    };
  }

  endDrag() {
    this.dragging = false;
  }

  closeToolbar() {
    this.toolbarVisible = false;
    this.toolbarsubMenuVisible = false;
    this.tooltip.visible = false;
  }

  // showtoolbar(){
  //   if (!this.contextTarget) return;

  //     const centerX = this.contextTarget.left! + this.contextTarget.getScaledWidth()! / 2;
  //     const centerY = this.contextTarget.top! + this.contextTarget.getScaledHeight()! / 2;
  //     const snappedCenterX = Math.round(centerX / this.gridSize) * this.gridSize;
  //     const snappedCenterY = Math.round(centerY / this.gridSize) * this.gridSize;
  //     const snappedX =  snappedCenterX - this.contextTarget.getScaledWidth()! / 2;
  //     const snappedY =  snappedCenterY - this.contextTarget.getScaledHeight()! / 2;

  //     if (this.contextTarget.get('IsVariable')) {
  //        if (this.contextTarget.get('Tooltip')){
  //           this.tooltip.visible = true;
  //           this.tooltip.text = this.contextTarget.get('Tooltip');
  //           this.tooltip.x = snappedX;
  //           this.tooltip.y = snappedY-10;
  //           this.toolbarVisible = false;
  //           this.toolbarsubMenuVisible = false;
  //           return;
  //       }
  //       this.toolbarVisible = false;
  //       this.toolbarsubMenuVisible = false;
  //       return;
  //     }

  //     this.toolbarStyle = { top: `${snappedY-20}px`,  left: `${snappedX}px`, };
  //     this.toolbarVisible = true;
  // }

  showtoolbar() {
    if (!this.contextTarget) return;

    const zoom = this.canvas.getZoom();
    const vpt = this.canvas.viewportTransform;
    const bounds = this.contextTarget.getBoundingRect();

    const objectCenterX = bounds.left + bounds.width / 2;
    const objectTopY = bounds.top;
    const screenX = objectCenterX * vpt[0] + vpt[4];
    const screenY = objectTopY * vpt[3] + vpt[5];

    const padding = 40;

    this.toolbarStyle = {
      left: `${screenX - padding * 2}px`,
      top: `${screenY - padding}px`,
    };

    this.toolbarVisible = true;
    this.tooltip.visible = false;
    this.toolbarsubMenuVisible = false;
  }

  handleKeyDown(event: KeyboardEvent): void {
    const activeObject = this.canvas.getActiveObject();
    if (!activeObject) return;

    const step = event.shiftKey ? 10 : 1;
    const canvasWidth = this.canvas.getWidth();
    const canvasHeight = this.canvas.getHeight();

    let left = activeObject.left ?? 0;
    let top = activeObject.top ?? 0;

    switch (event.key) {
      case 'ArrowLeft':
        left = Math.max(0, left - step);
        break;
      case 'ArrowRight':
        left = Math.min(
          canvasWidth - activeObject.getScaledWidth(),
          left + step
        );
        break;
      case 'ArrowUp':
        top = Math.max(0, top - step);
        break;
      case 'ArrowDown':
        top = Math.min(
          canvasHeight - activeObject.getScaledHeight(),
          top + step
        );
        break;

      default:
        return;
    }

    activeObject.set({
      left,
      top,
    });

    activeObject.setCoords();
    this.canvas.renderAll();
    event.preventDefault();
  }

  drawGridLines(): void {
    const width = this.canvas.getWidth();
    const height = this.canvas.getHeight();

    for (let i = 0; i < width; i += this.gridSizeR) {
      const vLine = new fabric.Line([i, 0, i, height], {
        stroke: '#ccc',
        strokeWidth: 0.4,
        selectable: false,
        evented: false,
      });
      (vLine as any).isGridLine = true;
      this.canvas.sendObjectToBack(vLine);
      // this.canvas.add(vLine);
      this.gridLines.push(vLine);
    }

    for (let j = 0; j < height; j += this.gridSizeR) {
      const hLine = new fabric.Line([0, j, width, j], {
        stroke: '#ccc',
        strokeWidth: 0.4,
        selectable: false,
        evented: false,
      });
      (hLine as any).isGridLine = true;
      this.canvas.sendObjectToBack(hLine);
      // this.canvas.add(hLine);
      this.gridLines.push(hLine);
    }
  }

  removeGridLines(): void {
    this.gridLines.forEach((line) => this.canvas.remove(line));
    this.gridLines = [];
    this.canvas.requestRenderAll;
  }

  toggleMenu() {
    this.toolbarsubMenuVisible = !this.toolbarsubMenuVisible;
  }

  changeTextOrigin(origin: 'left' | 'center' | 'right') {
    this.toolbarVisible = false;
    this.toolbarsubMenuVisible = false;

    if (this.contextTarget && this.contextTarget.type === 'i-text') {
      const object = this.contextTarget;
      const oldOriginX = object.originX;
      const oldOriginY = object.originY;
      const center = object.getPointByOrigin(
        oldOriginX || 'left',
        oldOriginY || 'top'
      );

      object.set({ originX: origin, originY: 'top' });
      const newPos = object.translateToOriginPoint(center, origin, 'top');
      object.set({
        left: newPos.x,
        top: newPos.y,
      });

      object.setCoords();
      this.canvas.requestRenderAll();
    }
  }

  getSingleAlignmentDistance(obj1: fabric.Object, obj2: fabric.Object) {
    const ALIGN_THRESHOLD = 5;
    const o1 = obj1.getBoundingRect();
    const o2 = obj2.getBoundingRect();

    const alignments = [
      // Horizontal alignments (vertical distance line)
      {
        type: 'vertical',
        from: 'left-left',
        p1: o1.left,
        p2: o2.left,
        x: o1.left,
      },
      {
        type: 'vertical',
        from: 'left-right',
        p1: o1.left,
        p2: o2.left + o2.width,
        x: o1.left,
      },
      {
        type: 'vertical',
        from: 'center-center',
        p1: o1.left + o1.width / 2,
        p2: o2.left + o2.width / 2,
        x: o1.left + o1.width / 2,
      },
      {
        type: 'vertical',
        from: 'right-left',
        p1: o1.left + o1.width,
        p2: o2.left,
        x: o1.left + o1.width,
      },
      {
        type: 'vertical',
        from: 'right-right',
        p1: o1.left + o1.width,
        p2: o2.left + o2.width,
        x: o1.left + o1.width,
      },

      // Vertical alignments (horizontal distance line)
      {
        type: 'horizontal',
        from: 'top-top',
        p1: o1.top,
        p2: o2.top,
        y: o1.top,
      },
      {
        type: 'horizontal',
        from: 'top-bottom',
        p1: o1.top,
        p2: o2.top + o2.height,
        y: o1.top,
      },
      {
        type: 'horizontal',
        from: 'middle-middle',
        p1: o1.top + o1.height / 2,
        p2: o2.top + o2.height / 2,
        y: o1.top + o1.height / 2,
      },
      {
        type: 'horizontal',
        from: 'bottom-top',
        p1: o1.top + o1.height,
        p2: o2.top,
        y: o1.top + o1.height,
      },
      {
        type: 'horizontal',
        from: 'bottom-bottom',
        p1: o1.top + o1.height,
        p2: o2.top + o2.height,
        y: o1.top + o1.height,
      },
    ];

    for (const align of alignments) {
      if (Math.abs(align.p1 - align.p2) <= ALIGN_THRESHOLD) {
        const distance =
          align.type === 'vertical'
            ? Math.abs(o1.top - o2.top)
            : Math.abs(o1.left - o2.left);

        if (distance > 0) {
          if (align.type === 'vertical') {
            const y1 = Math.min(o1.top + o1.height, o2.top + o2.height);
            const y2 = Math.max(o1.top, o2.top);

            return {
              type: 'vertical',
              alignType: align.from,
              x: align.x,
              y1,
              y2,
              distance,
            };
          } else {
            const x1 = Math.min(o1.left + o1.width, o2.left + o2.width);
            const x2 = Math.max(o1.left, o2.left);

            return {
              type: 'horizontal',
              alignType: align.from,
              y: align.y,
              x1,
              x2,
              distance,
            };
          }
        }
      }
    }

    return null;
  }

  drawDistanceIndicator(canvas: fabric.Canvas, info: any) {
    const color = 'blue';
    let line: fabric.Line;
    let text: fabric.Text;

    if (info.type === 'vertical') {
      line = new fabric.Line([info.x, info.y1, info.x, info.y2], {
        stroke: color,
        strokeDashArray: [4, 4],
        selectable: false,
        evented: false,
      });
      line.set('name', 'distance-indicator');

      text = new fabric.IText(
        this.roundTextIfNumber(info.distance.toString()),
        {
          left: info.x + 5,
          top: (info.y1 + info.y2) / 2 - 10,
          fontSize: 14,
          fill: color,
          selectable: false,
          evented: false,
        }
      );
      text.set('name', 'distance-indicator');
    } else {
      line = new fabric.Line([info.x1, info.y, info.x2, info.y], {
        stroke: color,
        strokeDashArray: [4, 4],
        selectable: false,
        evented: false,
      });
      line.set('name', 'distance-indicator');

      text = new fabric.IText(
        this.roundTextIfNumber(info.distance.toString()),
        {
          left: (info.x1 + info.x2) / 2,
          top: info.y - 15,
          fontSize: 14,
          fill: color,
          selectable: false,
          evented: false,
        }
      );
      text.set('name', 'distance-indicator');
    }

    canvas.add(line);
    canvas.add(text);
  }

  roundTextIfNumber(num1: string): string {
    const num = parseFloat(num1 || '');
    return Math.round(num).toString();
  }

  clearDistanceIndicators(canvas: fabric.Canvas) {
    const indicators = canvas
      .getObjects()
      .filter((obj) => (obj as any).name === 'distance-indicator');
    indicators.forEach((obj) => canvas.remove(obj));
  }

  temp_contetxtTarget: FabricObject | null = null;
  startCrop() {
    if (!this.contextTarget) return;
    this.temp_contetxtTarget = this.contextTarget;
    this.isCropping = true;
    this.cropRect = new fabric.Rect({
      left: this.contextTarget.left,
      top: this.contextTarget.top,
      width: this.contextTarget.getScaledWidth()!,
      height: this.contextTarget.getScaledHeight()!,
      fill: 'rgba(0,0,0,0.3)',
      stroke: 'red',
      strokeWidth: 1,
      hasBorders: true,
      hasControls: true,
      selectable: true,
    });

    this.canvas.add(this.cropRect);
    this.canvas.setActiveObject(this.cropRect);
  }

  applyCrop() {
    if (!this.cropRect) return;
    const activeImage = this.temp_contetxtTarget as fabric.Image;
    if (!activeImage) return;

    const cropBox = this.cropRect.getBoundingRect();

    const left = cropBox.left! - activeImage.left!;
    const top = cropBox.top! - activeImage.top!;

    const cropped = new fabric.Image(activeImage.getElement(), {
      left: cropBox.left,
      top: cropBox.top,
      scaleX: 1,
      scaleY: 1,
      cropX: left / activeImage.scaleX!,
      cropY: top / activeImage.scaleY!,
      width: cropBox.width / activeImage.scaleX!,
      height: cropBox.height / activeImage.scaleY!,
    });

    this.canvas.remove(activeImage);
    this.canvas.remove(this.cropRect);

    this.canvas.add(cropped);
    this.canvas.renderAll();

    this.cropRect = undefined;
    this.isCropping = false;
  }

  public undo(): void {
    this.canvasHistoryService.undo();
  }

  public redo(): void {
    this.canvasHistoryService.redo();
  }

  public canUndo(): boolean {
    return this.canvasHistoryService.canUndo();
  }

  public canRedo(): boolean {
    return this.canvasHistoryService.canRedo();
  }

  toggleSubMenu(name: string): void {
    this.openSubMenu = this.openSubMenu === name ? null : name;
  }

  openTableDialog(): void {
    const dialogRef = this.dialog.open(TableConfigComponent, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe((tableData) => {
      if (tableData) {
        const model: TableModel = this.generateTableModel(
          tableData.rows,
          tableData.columns
        );
        this.insertTableToCanvas(model);
      }
    });
  }

  // TODO - if is re-generating: the table should preserve the position and all current styles, data ..etc
  generateTableModel(rows: number, cols: number): TableModel {
    const rowHeight = 40;
    const colWidth = 100;
    const table: TableModel = {
      id: 'tbl_' + Date.now(),
      position: { x: 100, y: 100 },
      dimensions: { rowHeight },
      columnWidths: Array(cols).fill(colWidth),
      rows: [],
    };

    for (let r = 0; r < rows; r++) {
      const cells = [];
      for (let c = 0; c < cols; c++) {
        cells.push({
          text: `{{cell_${r}_${c}}}`,
          alignment: 'center' as 'left' | 'center' | 'right',
          fontSize: 14,
          bold: false,
          backgroundColor: '#ffffff',
          textColor: '#000000',
          IsTableCell: true,
          rowIndex: r,
          colIndex: c,
          top: table.position.y + r * rowHeight,
          width: colWidth,
          height: rowHeight,
          left: table.position.x + c * colWidth,
        });
      }
      table.rows.push({ cells });
    }

    return table;
  }

  openEditTableDialog(model: TableModel) {
    const dialogRef = this.dialog.open(TableConfigComponent, {
      width: '500px',
      data: { model },
    });
    dialogRef.afterClosed().subscribe((updated) => {
      if (updated) {
        const newModel = this.generateTableModel(updated.rows, updated.columns);
        const group = this.findTableGroupById(model.id);
        if (group) {
          this.canvas.remove(group);
          this.insertTableToCanvas(newModel);
        }
      }
    });
  }

  openEditCellDialog(cell: TableCell, model: TableModel) {
    const group = this.findTableGroupById(model.id) as fabric.Group;
    const dialogRef = this.dialog.open(CellEditorComponent, {
      width: '400px',
      data: { cell: { ...cell } },
    });
    dialogRef.afterClosed().subscribe((updatedCell) => {
      if (updatedCell) {
        // cell.text = updatedCell.content;
        // cell.fontSize = updatedCell.fontSize;
        // cell.textColor = updatedCell.textColor;
        // cell.backgroundColor = updatedCell.backgroundColor;
        // cell.alignment = updatedCell.alignment;
        // cell.bold = updatedCell.bold;

        Object.assign(cell, updatedCell);

        const textbox = group.item(1) as fabric.Textbox;
        const rect = group.item(0) as fabric.Rect;

        textbox.set({
          text: updatedCell.text,
          fill: updatedCell.textColor,
          fontSize: updatedCell.fontSize,
          fontWeight: updatedCell.bold ? 'bold' : 'normal',
          textAlign: updatedCell.alignment,
        });

        rect.set('fill', updatedCell.backgroundColor);

        this.canvas.requestRenderAll();

        if (group) {
          this.canvas.remove(group);
          this.insertTableToCanvas(model);
        }
        this.canvas.requestRenderAll();
      }
    });
  }

  // TODO - Re-inserting the table should preserve the position and all current styles, data ..etc
  insertTableToCanvas(model: TableModel) {
    const fabricObjects = [];
    let yOffset = model.position.y;
    for (let r = 0; r < model.rows.length; r++) {
      const row = model.rows[r];
      let xOffset = model.position.x;
      for (let c = 0; c < row.cells.length; c++) {
        const cell = row.cells[c];

        const rect = new fabric.Rect({
          left: xOffset,
          top: yOffset,
          width: model.columnWidths[c],
          height: model.dimensions.rowHeight,
          fill: cell.backgroundColor || '#fff',
          stroke: '#ccc',
          strokeWidth: 1,
          hasControls: true,
          lockScalingY: true,
          lockMovementX: true,
          lockMovementY: true,
          selectable: true,
        });

        const text = new fabric.Textbox(cell.text || '', {
          width: model.columnWidths[c] - 10,
          fontSize: cell.fontSize || 14,
          fontWeight: cell.bold ? 'bold' : 'normal',
          fill: cell.textColor || '#000',
          textAlign: cell.alignment,
          IsTableCell: true,
          selectable: false,
          backgroundColor: cell.backgroundColor,
          evented: true,
          originX: 'center',
          originY: 'center',
          left: rect.left! + rect.width! / 2,
          top: rect.top! + rect.height! / 2,
        });
        text.set('cellData', {
          rowIndex: r,
          colIndex: c,
          text: cell.text,
          alignment: cell.alignment,
          fontSize: cell.fontSize,
          bold: cell.bold,
          backgroundColor: cell.backgroundColor,
          textColor: cell.textColor,
        });

        text.on('mousedown', () => {
          this.handleCellEdit(cell, text, r, c);
        });

        text.set('cellData', cell);
        rect.set('cellData', cell);

        let currentTop = model.position.y;
        model.rows.forEach((row, rowIndex) => {
          let currentLeft = model.position.x;

          row.cells.forEach((cell, colIndex) => {
            const cellWidth = model.columnWidths[colIndex];
            const cellHeight = model.dimensions.rowHeight;

            cell.left = currentLeft;
            cell.top = currentTop;
            cell.width = cellWidth;
            cell.height = cellHeight;

            currentLeft += cellWidth;
          });

          currentTop += model.dimensions.rowHeight;
        });

        fabricObjects.push(rect, text);
        xOffset += model.columnWidths[c];
      }
      yOffset += model.dimensions.rowHeight;
    }

    const group = new fabric.Group(fabricObjects, {
      left: model.position.x,
      top: model.position.y,
      subTargetCheck: true,
    });

    group.set('tableModel', model);
    group.set('IsTable', true);
    group.set('id', model.id);

    this.canvas.add(group);
    this.canvas.requestRenderAll();
  }

  onEditCell() {
    if (this.selectedCell && this.selectedTableModel) {
      this.openEditCellDialog(this.selectedCell, this.selectedTableModel);
    }
    this.hideContextMenu();
  }

  findTableGroupById(id: string) {
    return this.canvas
      .getObjects()
      .find((obj: any) => obj?.tableModel?.id === id);
  }

  onEditTable() {
    if (this.selectedTableModel) {
      this.openEditTableDialog(this.selectedTableModel);
    }
    this.hideContextMenu();
  }

  // TODO - ask if Row should be on Top or Bottom

  addRow(IsHeader: boolean): void {
    if (!this.selectedTableModel) {
      return;
    }
    const tableModel = this.selectedTableModel;
    const newRowIndex = tableModel.rows.length;
    const columnCount = tableModel.columnWidths.length;
    const newRow: TableRow = { cells: [] };
    if (!IsHeader) {
      for (let col = 0; col < columnCount; col++) {
        newRow.cells.push({
          text: '',
          alignment: 'left',
          fontSize: 14,
          bold: false,
          backgroundColor: '#ffffff',
          textColor: '#000000',
          colIndex: col,
          rowIndex: newRowIndex,
          top: tableModel.position.y,
          width: tableModel.columnWidths[col],
          height: tableModel.dimensions.rowHeight,
          left: tableModel.position.x,
        });
      }
      tableModel.rows.push(newRow);
    } else {
      for (let col = 0; col < columnCount; col++) {
        newRow.cells.push({
          text: 'Header',
          alignment: 'center',
          fontSize: 14,
          bold: true,
          backgroundColor: 'lightgray',
          textColor: '#000000',
          colIndex: col,
          rowIndex: newRowIndex,
          top: tableModel.position.y,
          width: tableModel.columnWidths[col],
          height: tableModel.dimensions.rowHeight,
          left: tableModel.position.x,
        });
      }
      tableModel.rows.unshift(newRow);
    }
    const group = this.findTableGroupById(this.selectedTableModel.id);
    if (group) {
      this.canvas.remove(group);
      this.insertTableToCanvas(this.selectedTableModel);
    }
    this.hideContextMenu();
  }

  // TODO - ask if column should be on left or right
  // FIXME - update the header if existed after adding new column
  addColumn(): void {
    if (!this.selectedTableModel) {
      return;
    }
    const tableModel = this.selectedTableModel;

    tableModel.rows.forEach((row) => {
      row.cells.push({
        text: '',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        fontSize: 14,
        bold: false,
        alignment: 'center',
        rowIndex: row.cells.length,
        colIndex: tableModel.columnWidths.length,
        top: tableModel.position.y,
        width: tableModel.columnWidths[tableModel.columnWidths.length - 1],
        height: tableModel.dimensions.rowHeight,
        left: tableModel.position.x,
      });
    });

    tableModel.columnWidths.push(100);
    const group = this.findTableGroupById(this.selectedTableModel.id);
    if (group) {
      this.canvas.remove(group);
      this.insertTableToCanvas(this.selectedTableModel);
    }
    this.hideContextMenu();
  }

  handleCellEdit(
    cell: TableCell,
    textObject: fabric.Textbox,
    rowIndex: number,
    colIndex: number
  ) {
    const boundingRect = textObject.getBoundingRect();
    const canvasRect = (
      this.canvas.getElement() as HTMLCanvasElement
    ).getBoundingClientRect();

    const input = document.createElement('input');
    input.type = 'text';
    input.value = cell.text;
    input.style.position = 'absolute';
    input.style.left = `${canvasRect.left + boundingRect.left}px`;
    input.style.top = `${canvasRect.top + boundingRect.top}px`;
    input.style.width = `${boundingRect.width}px`;
    input.style.height = `${boundingRect.height + 5}px`;
    input.style.fontSize = `${cell.fontSize || 14}px`;
    input.style.padding = '4px';
    input.style.zIndex = '1000';
    input.style.background = 'white';
    input.style.border = '1px solid #ccc';

    setTimeout(() => {
      document.body.appendChild(input);
      input.focus();
    }, 10); // delay to make sure DOM is ready

    input.onblur = () => {
      const newText = input.value;
      cell.text = newText;

      if (!this.selectedTableModel) {
        return;
      }
      this.selectedTableModel.rows[rowIndex].cells[colIndex].text = newText;

      textObject.text = newText;

      this.canvas.requestRenderAll();

      document.body.removeChild(input);

      const group = this.findTableGroupById(this.selectedTableModel.id);
      if (group) {
        this.canvas.remove(group);
        this.insertTableToCanvas(this.selectedTableModel);
      }
    };
  }
}
