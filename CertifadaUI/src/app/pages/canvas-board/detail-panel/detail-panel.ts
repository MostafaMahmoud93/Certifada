import { Component, EventEmitter, HostListener, Input, OnInit, Output ,ViewChild} from '@angular/core';
import { Selection } from '../../../shared/selection';
import { CanvasService } from '../../../shared/canvas-service';
import * as fabric from 'fabric';
import type { Canvas as FabricCanvas } from 'fabric';
import { Subscription } from 'rxjs';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent, DialogData, DialogType } from '../../../shared/dialog/dialog';
import { ChangeDetectorRef } from '@angular/core';
import QRCode from 'qrcode';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { TableConfigComponent } from '../table-config/table-config.component';
import { TableModel } from '../table-config/table.model';
import { CellEditorComponent } from '../table-config/cell-editor.component';

interface VariableEntry {
  id: string;
  text: string;
  status: 'use' | 'in use';
  fabricObj: fabric.IText;
}

interface FVariableEntry {
  id: string;
  text: string;
  status: 'use' | 'in use';
  fabricObj: fabric.IText;
}

interface Signatures {
  id: string;
  text: string;
  status: 'use' | 'in use';
  fabricObj: fabric.Group;
}

interface ColorStop {
  color: string;
  offset: number; // between 0 and 1
}

interface BrandSection {
  name: string;
  fonts: { name: string; fontUrl: string }[];
  logoPreview: string | null;
  colorPalette: string[];
  isFontUploading: boolean;
  isLogoUploading: boolean;
  isDraggingFont: boolean;
  isDraggingLogo: boolean;
  expanded : boolean
}

@Component({
  selector: 'app-detail-panel',
  standalone : false,
  templateUrl: './detail-panel.html',
  styleUrl: './detail-panel.css',

})

export class DetailPanel implements OnInit {
  
  selectedTab: 'shapes' | 'fonts' | 'images' = 'shapes';
  private sub!: Subscription;
  selectedItem: string | null = null;
  activeTab: 'shapes' | 'icons' | 'badges' = 'shapes';
  activeTab2: 'images' | 'backgrounds' = 'images';
  activeTab3: 'image' | 'colors' | 'gradient' = 'image';
  private canvas!: FabricCanvas;
  landscapeSize = { width: 792, height: 612 };
  portraitSize = { width: 612, height: 792 };
  toPortrait = false;
  Variables: VariableEntry[] = [];
  branches: BrandSection[] = [];
  templates: any[] = [];

  @Output() loadTemplate = new EventEmitter<any>();

  FVariableEntry: FVariableEntry[] = [
    { id: '1', text: 'Name', status: 'use', fabricObj: new fabric.IText('{{Fix.Name}}', { left: 20, top: 20, fontSize: 16, editable: false, IsVariable: true}) },
    { id: '2', text: 'Email', status: 'use', fabricObj: new fabric.IText('{{Fix.Email}}', { left: 20, top: 40, fontSize: 16, editable: false, IsVariable: true }) },
    { id: '3', text: 'Phone', status: 'use', fabricObj: new fabric.IText('{{Fix.Phone}}', { left: 20, top: 60, fontSize: 16, editable: false, IsVariable: true }) },
    { id: '4', text: 'Address', status: 'use', fabricObj: new fabric.IText('{{Fix.Address}}', { left: 20, top: 80, fontSize: 16, editable: false, IsVariable: true }) },
    { id: '5', text: 'City', status: 'use', fabricObj: new fabric.IText('{{Fix.City}}', { left: 20, top: 100, fontSize: 16, editable: false, IsVariable: true }) },
    { id: '6', text: 'Sex', status: 'use', fabricObj: new fabric.IText('{{Fix.Sex}}', { left: 20, top: 120, fontSize: 16, editable: false, IsVariable: true }) },
    { id: '7', text: 'Country', status: 'use', fabricObj: new fabric.IText('{{Fix.Country}}', { left: 20, top: 140, fontSize: 16, editable: false, IsVariable: true }) },
  ];

   signatures: Signatures[] = [
     {
    id: '1',
    text: '1st Signature',
    status: 'use',
    fabricObj: new fabric.Group([
      new fabric.IText('{{Fix.First_Signature_Name}}', { left: 0, top: 0, fontSize: 16, editable: false, IsVariable: true }),
      new fabric.IText('{{@Fix.First_Signature_Sign}}', { left: 0, top: 20, fontSize: 16, editable: false, IsVariable: true }),
      new fabric.IText('{{Fix.First_Signature_Designation}}', { left: 0, top: 40, fontSize: 16, editable: false, IsVariable: true })
    ], { left: 20, top: 20 })
  },
  {
    id: '2',
    text: '2nd Signature',
    status: 'use',
    fabricObj: new fabric.Group([
      new fabric.IText('{{Fix.First_Signature_Name}}', { left: 0, top: 0, fontSize: 16, editable: false, IsVariable: true }),
      new fabric.IText('{{@Fix.First_Signature_Sign}}', { left: 0, top: 20, fontSize: 16, editable: false, IsVariable: true }),
      new fabric.IText('{{Fix.First_Signature_Designation}}', { left: 0, top: 40, fontSize: 16, editable: false, IsVariable: true })
    ], { left: 20, top: 80 })
  },
  ];

  shapes = [
    { type: 'rect', label: 'Rectangle' },
    { type: 'circle', label: 'Circle' },
    { type: 'triangle', label: 'Triangle' },
    { type: 'ellipse', label: 'ellipse' },
    { type: 'diagonal' , label: 'Diagonal Line'},
    { type: 'horizontal' , label: 'Horizontal Line'},
    { type: 'vertical' , label: 'Vertical Line'},
    { type: 'pentagon' , label: 'pentagon'},
    { type: 'hexagon' , label: 'hexagon'},
    { type: 'star', label: 'star' },
    { type: 'roundedRect' , label: 'roundedRect'},
    { type: 'arrow', label: 'arrow' },
    { type: 'cross', label: 'cross' },
    { type: 'heart', label: 'heart' },
    { type: 'parallelogram', label: 'parallelogram' },
    { type: 'trapezoid', label: 'trapezoid' },
    { type: 'moon', label: 'moon' },
    { type: 'diamond', label: 'diamond' },
    { type: 'cloud', label: 'cloud' },
    { type: 'capsule', label: 'capsule' },
    { type: 'ring', label: 'ring' },
    { type: 'chevron', label: 'chevron' },
    { type: 'arrowDown', label: 'arrowDown' },
    { type: 'arrowUp', label: 'arrowUp' },
    { type: 'rightTriangle', label: 'rightTriangle' },
    { type: 'frame', label: 'frame' },
    { type: 'paths', label: 'Paths' }
  ];

   fonts = [
    { family: 'jf flat', text: 'الشهادات' },
    { family: 'Aldhabi', text: 'الشهادات' },
    { family: 'arial', text: 'الشهادات' },
    { family: 'jf flat', text: 'الشهادات' },
    { family: 'Aldhabi', text: 'الشهادات' },
    { family: 'tahoma', text: 'الشهادات' },
    { family: 'dubai', text: 'الشهادات' }
  ];

  icons: { name: string, src: string }[] = [];
  badges: { name: string, src: string }[] = [];
  Images: { name: string, src: string }[] = [];
  Backgrounds: { name: string, src: string }[] = [];
  
  brushColor: string = '#000000';
  brushWidth: number = 5;
  brushType: string = 'PencilBrush';
  isDrawingMode: boolean = false;

  URLOption: string = 'auth';
  qrText: string = 'https://certifada.com';
  qrForeground: string = '#000000';
  qrBackground: string = '#ffffff';
  qrMargin: number = 4;
  qrSize: number = 100;
  customText: string = 'Certifada App';  // Default text
  radius: number = 120;  // Default radius

  baseImageUrl = 'images/filter.jpg'; // Replace with your image
  filters: { name: string; instance: any }[] = [];
  previewImages: { name: string; src: string }[] = [];

  showFilterPanel = false;

  @ViewChild('ImagesTAB') ImagesTAB!: MatTabGroup;
  @ViewChild('fontsTAB') fontsTAB!: MatTabGroup;

  gradientType: 'linear' | 'radial' = 'linear';
  angle: number = 0;
  colorStops: ColorStop[] = [
    { color: '#4f46e5', offset: 0 },
    { color: '#9333ea', offset: 1 }
  ];
  cssGradient = '';

  colors = [
  {
    name: 'Red',
    shades: ['#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c']
  },
  {
    name: 'Blue',
    shades: ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8']
  },
  {
    name: 'Green',
    shades: ['#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669', '#047857']
  },
  {
    name: 'Yellow',
    shades: ['#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309']
  },
  {
    name: 'Purple',
    shades: ['#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9']
  },
  {
    name: 'Gray',
    shades: ['#f9fafb', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563']
  },
  {
    name: 'Orange',
    shades: ['#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c']
  },
  {
    name: 'Pink',
    shades: ['#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d']
  },
  {
    name: 'violet',
    shades: ['#ccfbf1', '#99f6e4', '#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e']
  },
  {
    name: 'Indigo',
    shades: ['#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#4338ca']
  }
  ];

constructor(private selection: Selection, private canvasService: CanvasService, private http: HttpClient,
            private dialog: MatDialog, private cdr: ChangeDetectorRef,private toast: ToastService
) {}

onTabChange(event: MatTabChangeEvent) {
  const selectedTabLabel = event.tab.textLabel;
  const item = selectedTabLabel === 'shapes' ? 'shapes' : selectedTabLabel === 'icons' ? 'icons' : 'badges';
  this.activeTab = item === 'icons' ? 'icons' : item === 'badges' ? 'badges' : 'shapes';
}

ngOnInit() {
    this.selection.selectedItem$.subscribe(item => {this.selectedItem = item;});
    this.canvasService.canvas$.subscribe(c => {if (c) this.canvas = c;});
    this.selection.selectedItem$.subscribe(item => {this.activeTab = item === 'icons' ? 'icons' : item === 'badges' ? 'badges' : 'shapes';});

    this.sub = this.selection.selectedItem$.subscribe(key => {this.selectedTab = key as any;});

    const storedTemplates = localStorage.getItem('templates');
    if (storedTemplates) {
      this.templates = JSON.parse(storedTemplates);
    }

    this.http.get<string[]>('icons/manifest.json').subscribe(files => {
        this.icons = files.map(filename => ({
        name: filename.replace('.svg', ''),
        src: `icons/${filename}`
      }));
    });

    this.http.get<string[]>('badges/manifest.json').subscribe(files => {
        this.badges = files.map(filename => ({
        name: filename.replace('.svg', ''),
        src: `badges/${filename}`
      }));
    });

    this.http.get<string[]>('images/manifest.json').subscribe(files => {
        this.Images = files.map(filename => ({
        name: filename.replace('.png', ''),
        src: `images/${filename}`
      }));
    });

    this.http.get<string[]>('images/manifest_bg.json').subscribe(files => {
        this.Backgrounds = files.map(filename => ({
        name: filename.replace('.png', ''),
        src: `images/${filename}`
      }));
    });

    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    this.initFilters();

    this.loadBrandingFromLocalStorage();

}

 onTemplateClick(template: any) {

      this.canvas.loadFromJSON(template.json, () => {
        this.canvas.requestRenderAll();
      });  }

ngOnDestroy() {
  this.sub.unsubscribe();
  window.removeEventListener('keydown', this.handleKeyDown.bind(this));
}

onShapeClick(shapeType: string) {
  this.canvasService.addShape(shapeType);

}

onIconClick(iconSrc: string) {
    if (!this.canvas) return;

    fabric.util.loadImage(iconSrc).then((imgEl: HTMLImageElement) => {
      const imgObj = new fabric.Image(imgEl, {
        left: 50,
        top: 50,
        selectable: true,
      });
      imgObj.scaleToWidth(80);

      this.adjustPositionToAvoidOverlap(imgObj);
      this.canvas.add(imgObj);
      this.canvas.setActiveObject(imgObj);
      this.canvas.requestRenderAll();
    //  this.canvasService.updateUndoRedoStack();
    });

    this.showFilterPanel = true;
}

onBadgeClick(badgeSrc: string) {
    if (!this.canvas) return;

    fabric.util.loadImage(badgeSrc).then((imgEl: HTMLImageElement) => {
      const imgObj = new fabric.Image(imgEl, {
        left: 50,
        top: 50,
        selectable: true
      });

      imgObj.scaleToWidth(80);
      
      this.adjustPositionToAvoidOverlap(imgObj);
      this.canvas.add(imgObj);
      this.canvas.setActiveObject(imgObj);
      this.canvas.requestRenderAll();
    //   this.canvasService.updateUndoRedoStack();
    });
          this.showFilterPanel = true;

}

onImageClick(imgSrc: string) {
  if (!this.canvas) return;
  const imgEl = new Image();
  imgEl.src = imgSrc;
  imgEl.onload = () => {
    const imgObj = new fabric.Image(imgEl, { left: 50, top: 50, selectable: true });
    imgObj.scaleToWidth(100);

    this.adjustPositionToAvoidOverlap(imgObj);
    this.canvas.add(imgObj);
    this.canvas.setActiveObject(imgObj);
    this.canvas.requestRenderAll();
  //    this.canvasService.updateUndoRedoStack();
  };
  this.ImagesTAB.selectedIndex = 1;
}

async onBackgroundClick(imgSrc: string) {
  if (!this.canvas) return;

  const img = await fabric.Image.fromURL(imgSrc, { crossOrigin: 'anonymous' });
  const canvasWidth = this.canvas.getWidth();
  const canvasHeight = this.canvas.getHeight();

    const zoom = this.canvas.getZoom();


  const scaleX = canvasWidth / img.width!;
  const scaleY = canvasHeight / img.height!;
  const scale = Math.min(scaleX, scaleY) / zoom; // 🚫 no overflow

  img.set({originX: 'left', originY: 'top', scaleX: scale, scaleY: scale, selectable: false, evented: false});

  if(this.canvas.backgroundColor != ''){
    this.bgConfirm('Do you want to add the image to the current background color?').subscribe(result => {
      if (result === true) {
         this.canvas.backgroundImage = img;
         this.canvas.requestRenderAll();
      } else{
        this.canvas.backgroundColor = '';
        this.canvas.backgroundImage = img;
        this.canvas.requestRenderAll();
      }
     });
  } else{
     this.canvas.backgroundImage = img;
     this.canvas.requestRenderAll();
  }
}

switchOrientation() {
  this.toPortrait = !this.toPortrait;
  const canvas = this.canvas;

  const oldWidth = canvas.getWidth();
  const oldHeight = canvas.getHeight();
  const newWidth = this.toPortrait ? this.portraitSize.width : this.landscapeSize.width;
  const newHeight = this.toPortrait ? this.portraitSize.height : this.landscapeSize.height;
  const scaleX = newWidth / oldWidth;
  const scaleY = newHeight / oldHeight;
  canvas.setWidth(newWidth);
  canvas.setHeight(newHeight);
  canvas.getObjects().forEach(obj => {
    obj.left = obj.left! * scaleX;
    obj.top = obj.top! * scaleY;
    obj.scaleX = (obj.scaleX ?? 1) * scaleX;
    obj.scaleY = (obj.scaleY ?? 1) * scaleY;
    obj.setCoords(); 
  });

  if (canvas.backgroundImage) {
    const bg = canvas.backgroundImage;
    const scaleX = newWidth / bg.width!;
    const scaleY = newHeight / bg.height!;
    const scale = Math.min(scaleX, scaleY); // 🚫 no overflow

  bg.set({
    originX: 'left',
    originY: 'top',
    scaleX: scale,
    scaleY: scale,
    selectable: false,
    evented: false
  });
  
    bg.setCoords();
  }
  canvas.requestRenderAll();
  this.canvasService.setCanvasInstance(this.canvas);
}

currentFont = '';
onAddTextClick(fontFamily: string) {
    const txtObj = new fabric.IText('سيرتيفادا للشهادات', {
      left: 50,
      top: 50,
      fill: 'black',
      fontFamily: fontFamily,
      fontSize: 24,
      selectable: true,
      editable: true,       
      cursorWidth: 2,
      cursorColor: 'black',
      lockUniScaling: true,
      lockScalingX: true,
    });
    txtObj.set('IsVariable', false);

    this.adjustPositionToAvoidOverlap(txtObj);
    this.canvas.add(txtObj);
    this.canvas.setActiveObject(txtObj);
    this.canvas.requestRenderAll();
    this.fontsTAB.selectedIndex = 2;
}

onAddVariable(VarTxt: string) {
    VarTxt = VarTxt.replace(/ /g, '_');
    const txtObj = new fabric.IText('{{Cert.'+VarTxt+'}}', {
      left: 50,
      top: 50,
      fill: 'blue',
      fontFamily: 'arial',
      fontSize: 16,
      selectable: true,
      editable: false,       
      cursorWidth: 2,
      cursorColor: 'black',
      lockUniScaling: true,
      lockScalingX: true
    });

    txtObj.set('Tooltip', ' you can not edit variables, it is read only! but still you can redign it!');
    txtObj.set('IsVariable', true);

    this.adjustPositionToAvoidOverlap(txtObj);
    this.canvas.add(txtObj);
    this.canvas.setActiveObject(txtObj);
    this.canvas.requestRenderAll();

    const id = new Date().getTime().toString(); // Unique ID
    this.Variables.push({
      id,
      text: VarTxt || '',
      status: 'in use',
      fabricObj: txtObj
    });
    this.cdr.detectChanges(); // force UI refresh
}

toggleText(entry: VariableEntry) {
    if (entry.status === 'in use') {
      this.canvas.remove(entry.fabricObj);
      entry.status = 'use';
    } else {
      entry.fabricObj.set('Tooltip', ' you can not edit variables, it is read only! but still you can redign it!');
      entry.fabricObj.set('IsVariable', true);
      entry.fabricObj.lockScalingX = true;
      this.canvas.add(entry.fabricObj);
      this.canvas.requestRenderAll();
      entry.status = 'in use';
    }
}

toggleSignature(entry: Signatures) {
    if (entry.status === 'in use') {
      this.canvas.remove(entry.fabricObj);
      entry.status = 'use';
    } else {
      entry.fabricObj.set('Tooltip', ' you can not edit variables, it is read only! but still you can redign it!');
      entry.fabricObj.set('IsSignature', true);
      entry.fabricObj.lockScalingX = true;
      this.canvas.add(entry.fabricObj);
      this.canvas.requestRenderAll();
      entry.status = 'in use';
    }
}

onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.canvasService.addImage(dataUrl);
    };
    reader.onerror = (err) => {
      console.error('[DEBUG] FileReader error:', err);
    };
    reader.readAsDataURL(file);
    // Clear the input so the same file can be re‐selected if needed
    input.value = '';
}

AskForVariableName() {
      const dialogRef = this.dialog.open(DialogComponent, {
        width: '400px',
        data: <DialogData>{
          type: 'input',
          title: 'New Variable',
          message: 'Please enter the variabke name:',
          inputPlaceholder: 'variable name...',
          inputValue: ''
        }
      });

      dialogRef.afterClosed().subscribe(input => {
        if (input !== false) {
        this.onAddVariable(input);
        }
      });
}

bgConfirm(Q:string) {
      const dialogRef = this.dialog.open(DialogComponent, {
        width: '400px',
        data: <DialogData>{
          type: 'confirm',
          title: 'Background Change',
          message: Q,
          confirmText:'Yes (Merge)',
          cancelText: 'No (Replace)'
        }
      });
        return dialogRef.afterClosed();
}

Warning(Q:string) {
      const dialogRef = this.dialog.open(DialogComponent, {
        width: '400px',
        data: <DialogData>{
          type: 'warning',
          title: 'No text selected',
          message: Q,
          confirmText:'OK'
        }
      });
        return dialogRef.afterClosed();
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
      left = Math.min(canvasWidth - activeObject.getScaledWidth(), left + step);
      break;
    case 'ArrowUp':
      top = Math.max(0, top - step);
      break;
    case 'ArrowDown':
      top = Math.min(canvasHeight - activeObject.getScaledHeight(), top + step);
      break;
    default:
      return;
  }

  activeObject.set({
    left,
    top
  });

  activeObject.setCoords();
  this.canvas.renderAll();
  event.preventDefault();
}

setBackgroundColor(color: string) {
  if (!this.canvas) return;

    if(this.canvas.backgroundImage != undefined){
    this.bgConfirm('Do you want to add the selected color to the current background image?').subscribe(result => {
      if (result === true) {
         this.canvas.backgroundColor = color;
         this.canvas.requestRenderAll();
      } else{
        this.canvas.backgroundColor = color;
        this.canvas.backgroundImage = undefined;
        this.canvas.requestRenderAll();
      }
     });
  } else{
     this.canvas.backgroundColor = color;
     this.canvas.requestRenderAll();
  }
}

addColorStop() {
    this.colorStops.push({ color: '#ffffff', offset: 0.5 });
    this.updateCssPreview();
}

removeColorStop(index: number) {
    this.colorStops.splice(index, 1);
    this.updateCssPreview();
}

updateCssPreview() {
    if (this.gradientType === 'linear') {
      const angle = this.angle % 360;
      const stops = this.colorStops.map(stop => `${stop.color} ${stop.offset * 100}%`).join(', ');
      this.cssGradient = `linear-gradient(${angle}deg, ${stops})`;
    } else {
      const stops = this.colorStops.map(stop => `${stop.color} ${stop.offset * 100}%`).join(', ');
      this.cssGradient = `radial-gradient(circle, ${stops})`;
    }
}

applyGradient() {
    if (!this.canvas) return;

    const width = this.canvas.getWidth();
    const height = this.canvas.getHeight();

    const colorStops = this.colorStops.map(stop => ({
      offset: stop.offset,
      color: stop.color
    }));

    let gradient: fabric.Gradient<'linear'> | fabric.Gradient<'radial'>;

    if (this.gradientType === 'linear') {
      const radians = (this.angle % 360) * Math.PI / 180;
      const x = Math.cos(radians);
      const y = Math.sin(radians);

      gradient = new fabric.Gradient<'linear'>({
        type: 'linear',
        coords: {
          x1: width / 2 - (x * width) / 2,
          y1: height / 2 - (y * height) / 2,
          x2: width / 2 + (x * width) / 2,
          y2: height / 2 + (y * height) / 2,
        },
        colorStops: colorStops
      });
    } else {
      gradient = new fabric.Gradient<'radial'>({
        type: 'radial',
        coords: {
          x1: width / 2,
          y1: height / 2,
          r1: 0,
          x2: width / 2,
          y2: height / 2,
          r2: Math.max(width, height) / 2,
        },
        colorStops: colorStops
      });
    }


     if(this.canvas.backgroundImage != undefined){
        this.bgConfirm('Do you want to add the selected color to the current background image?').subscribe(result => {
          if (result === true) {
            this.canvas.backgroundColor = gradient;
            this.canvas.requestRenderAll();
          } else{
            this.canvas.backgroundColor = gradient;
            this.canvas.backgroundImage = undefined;
            this.canvas.requestRenderAll();
          }
        });
      } else{
        this.canvas.backgroundColor = gradient;
        this.canvas.requestRenderAll();
      }

}

onChange() {
    this.updateCssPreview();
}

async setPatternBackground(imgSrc: string) {
    if (!this.canvas) return;

    const img = await fabric.Image.fromURL(imgSrc, { crossOrigin: 'anonymous' });

    const pattern = new fabric.Pattern({
      source: img.getElement(),
      repeat: 'repeat',
    });

    this.canvas.backgroundColor = pattern;
    this.canvas.requestRenderAll();
}

adjustPositionToAvoidOverlap(newObj: fabric.Object, step = 10): void {
  let hasOverlap: boolean;

  do {
    hasOverlap = false;
    for (const obj of this.canvas.getObjects()) {
      if (obj === newObj) continue; // skip self

      if (this.isOverlapping(newObj, obj)) {
        hasOverlap = true;
        newObj.left! += step;
        newObj.top! += step;
        newObj.setCoords();
        break;
      }
    }
  } while (hasOverlap);
}

isOverlapping(newObj: fabric.Object, existingObj: fabric.Object): boolean {
  const a = newObj.getBoundingRect();
  const b = existingObj.getBoundingRect();

  return !(
    a.left + a.width < b.left ||
    a.left > b.left + b.width ||
    a.top + a.height < b.top ||
    a.top > b.top + b.height
  );
}

toggleDrawingMode(): void {
    this.isDrawingMode = !this.isDrawingMode;
    this.canvas.isDrawingMode = this.isDrawingMode;
    this.setBrush();
}

setBrush(): void {
    let brush;
    switch (this.brushType) {
      case 'CircleBrush':
        brush = new fabric.CircleBrush(this.canvas);
        break;
      case 'SprayBrush':
        brush = new fabric.SprayBrush(this.canvas);
        break;
      case 'PatternBrush':
        brush = new fabric.PatternBrush(this.canvas);
        break;
      default:
        brush = new fabric.PencilBrush(this.canvas);
    }

    brush.color = this.brushColor;
    brush.width = this.brushWidth;
    this.canvas.freeDrawingBrush = brush;
}

updateColor(color: string) {
    if (!this.canvas.freeDrawingBrush) return;
    this.brushColor = color;
    this.canvas.freeDrawingBrush.color = color;
}

updateWidth(width: number) {
    if (!this.canvas.freeDrawingBrush) return;
    this.brushWidth = width;
    this.canvas.freeDrawingBrush.width = width;
}

clearCanvas() {
    this.canvas.clear();
}

changeBrush(type: string) {
    this.brushType = type;
    this.setBrush();
}

async addQRCode() {
  if (!this.qrText.trim()) return;
  const options = {
    color: {
      dark: this.qrForeground,
      light: this.qrBackground,
    },
    margin: this.qrMargin,
    width: this.qrSize
  };

  try {
    const dataUrl = await QRCode.toDataURL(this.qrText, options);
    const img = await fabric.Image.fromURL(dataUrl, { crossOrigin: 'anonymous' });
    img.set({
        left: 100,
        top: 100,
        scaleX: 1,
        scaleY: 1,
        selectable: true
      });

      this.canvas.add(img);
      this.canvas.setActiveObject(img);
      this.canvas.renderAll();
    
  } catch (error) {
    console.error('Failed to generate QR:', error);
  }
}

addCurvedText() {
    const radius = this.radius;
    const text = this.customText;
    const angleStep = 2 * Math.PI / text.length;
    
    let xOffset = 100;
    let yOffset = 300;

    const curvedTextGroup = new fabric.Group([], {
      left: xOffset,
      top: yOffset,
    });

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const angle = i * angleStep;

      const charText = new fabric.Text(char, {
        fontSize: 30,
        fill: '#00f',
        originX: 'center',
        originY: 'center',
        left: xOffset + radius * Math.cos(angle),
        top: yOffset + radius * Math.sin(angle),
        angle: angle * (180 / Math.PI),
        selectable: true,
      });

      curvedTextGroup.add(charText);
    }

    this.canvas.add(curvedTextGroup);
    this.canvas.renderAll();
}

addTextEffect(type: string): void {
    const activeObject = this.canvas.getActiveObject();
    if (activeObject) {
        activeObject.set({ shadow: null,fill: null, stroke: null, strokeWidth: null,textDecoration:null,backgroundColor:null });
        switch (type) {
        case 'shadow': activeObject.set({ shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.7)', blur: 10, offsetX: 5, offsetY: 5 })});   break;
        case 'lift':   activeObject.set({ shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.5)', blur: 15, offsetX: 3, offsetY: 3 })});   break;
        case 'hollow': activeObject.set({ fill: 'transparent', stroke: '#000', strokeWidth: 5, });  break;
        case 'splice': activeObject.set({ fill: 'transparent', stroke: '#000', strokeWidth: 10, textDecoration: 'line-through',});        break;
        case 'outline': activeObject.set({stroke: '#000', strokeWidth: 5, }); break;
        case 'echo':   activeObject.set({ shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.3)', blur: 5, offsetX: 5, offsetY: 5 }), fill: '#fff', }); break;
        case 'glitch': activeObject.set({ fill: '#ff00ff', shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.2)', blur: 5, offsetX: 2, offsetY: 2 }),}); break;
        case 'neon':   activeObject.set({ fill: '#0f0', shadow: new fabric.Shadow({ color: 'rgba(0,255,0,0.8)', blur: 20, offsetX: 0, offsetY: 0 }),}); break;
        case 'background': activeObject.set({fill:'#fff',backgroundColor: 'rgba(255, 0, 0, 0.5)', }); break;
        case 'gradient':  activeObject.set({ fontWeight: 'bold', fill: new fabric.Gradient({ type: 'linear', gradientUnits: 'pixels', coords: { x1: 0, y1: 0, x2: 200, y2: 0 },
                          colorStops: [{ offset: 0, color: '#ff0000' },{ offset: 0.5, color: '#ffff00' },{ offset: 1, color: '#00ff00' }]}), selectable: true});  break;
        case 'blur': const shadow = new fabric.Shadow({ color: '#000000', blur: 15, offsetX: 5,offsetY: 5, affectStroke: false, includeDefaultValues: true, nonScaling: false,});
                        activeObject.set({fontSize: 60,fill: '#ffffff',stroke: '#000000',strokeWidth: 1,shadow: shadow,selectable: true});  break;
        default:
        break;
      }
    } else {
        let text = new fabric.IText(this.customText, {
        left: 100,
        top: 100,
        fontSize: 50,
        fill: '#fff',
        fontFamily: 'Arial',
        selectable: true,
        });    

        switch (type) {
      case 'shadow':
        text.set({
          shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.7)', blur: 10, offsetX: 5, offsetY: 5 })
        });
        break;

      case 'lift':
        text.set({
          shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.5)', blur: 15, offsetX: 3, offsetY: 3 })
        });
        break;

      case 'hollow':
        text.set({
          fill: 'transparent',
          stroke: '#000',
          strokeWidth: 5,
        });
        break;

      case 'splice':
        text.set({
          fill: 'transparent',
          stroke: '#000',
          strokeWidth: 10,
          textDecoration: 'line-through',
        });
        break;

      case 'outline':
        text.set({
          stroke: '#000',
          strokeWidth: 5,
        });
        break;

      case 'echo':
        text.set({
          shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.3)', blur: 5, offsetX: 5, offsetY: 5 }),
          fill: '#fff',
        });
        break;

      case 'glitch':
        text.set({
          fill: '#ff00ff',
          shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.2)', blur: 5, offsetX: 2, offsetY: 2 }),
        });
        break;

      case 'neon':
        text.set({
          fill: '#0f0',
          shadow: new fabric.Shadow({ color: 'rgba(0,255,0,0.8)', blur: 20, offsetX: 0, offsetY: 0 }),
        });
        break;

      case 'background':
        text.set({
          backgroundColor: 'rgba(255, 0, 0, 0.5)',
        });
        break;

      case 'gradient':
            text.set({
              left: 100,
              top: 100,
              fontSize: 60,
              fontWeight: 'bold',
              fill: new fabric.Gradient({
                type: 'linear',
                gradientUnits: 'pixels',
                coords: { x1: 0, y1: 0, x2: 200, y2: 0 },
                colorStops: [
                  { offset: 0, color: '#ff0000' },
                  { offset: 0.5, color: '#ffff00' },
                  { offset: 1, color: '#00ff00' }
                ]
              }),
              selectable: true
            });
      break;

    case 'blur':
      const shadow = new fabric.Shadow({
        color: '#000000',           
        blur: 15,                    
        offsetX: 5,                 
        offsetY: 5,                 
        affectStroke: false,         
        includeDefaultValues: true,  
        nonScaling: false             
      });

        text.set({
            left: 100,
            top: 200,
            fontSize: 60,
            fill: '#ffffff',
            stroke: '#000000',
            strokeWidth: 1,
            shadow: shadow,
            selectable: true
          });
      break;
      default:
        break;
    }

        this.canvas.add(text);
    this.canvas.requestRenderAll();
      }
    this.canvas.requestRenderAll();
}

initFilters() {
    this.filters = [
      { name: 'None', instance: null },
      { name: 'Grayscale', instance: new fabric.filters.Grayscale() },
      { name: 'Invert', instance: new fabric.filters.Invert() },
      { name: 'Sepia', instance: new fabric.filters.Sepia() },
      { name: 'Brownie', instance: new fabric.filters.Brownie() },
      { name: 'Vintage', instance: new fabric.filters.Vintage() },
      { name: 'Technicolor', instance: new fabric.filters.Technicolor() },
      { name: 'Kodachrome', instance: new fabric.filters.Kodachrome() },
      { name: 'BlackWhite', instance: new fabric.filters.BlackWhite() },
    ];

    this.generatePreviews();
}

async generatePreviews() {
    for (const filter of this.filters) {
      const img = await this.createFilteredImage(filter.instance);
      this.previewImages.push({ name: filter.name, src: img });
    }
}

async createFilteredImage(filter: any): Promise<string> {
    const imageElement = await this.loadImage(this.baseImageUrl);

    return new Promise((resolve) => {
      const imgObj = new fabric.Image(imageElement, {
        crossOrigin: 'anonymous',
        scaleX: 0.2,
        scaleY: 0.2,
      });

      if (filter) {
        imgObj.filters?.push(filter);
        imgObj.applyFilters();
      }

      // We wait until fabric has time to render filters
      setTimeout(() => {
        const dataUrl = imgObj.toDataURL({
          format: 'png',
          multiplier: 1,

        });
        resolve(dataUrl);
      }, 50); // slight delay ensures image is ready
    });
}

loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = url;
    });
}

getPreviewImageSrc(filterName: string): string | undefined {
  return this.previewImages.find(p => p.name === filterName)?.src;
}

applyFilter(filter: any) {
     const activeObject = this.canvas.getActiveObject();
     if (!activeObject) { 
         this.toast.warning('Please select an image before applying the filter.', 'top-center');
         return;  
    } else if (activeObject.type !== 'image')  {
         this.toast.warning('Filter could not be applied to the selected object.', 'top-center');
         return; 
    }
    const image = activeObject as fabric.Image;
    image.filters = [];
    if (filter) {
      image.filters.push(filter);
    }
    image.applyFilters();
    this.canvas.requestRenderAll();
}

panelPosition = { top: window.innerHeight - 600, left: window.innerWidth - 350 };
panelSize = { width: 200, height: 400 };
isDragging = false;
isResizing = false;
dragOffset = { x: 0, y: 0 };

startDrag(event: MouseEvent, headerOnly: boolean = false) {
  if (headerOnly && (event.target as HTMLElement).tagName !== 'SPAN') return;

  this.isDragging = true;
  const panel = (event.target as HTMLElement).closest('div') as HTMLElement;
  const panelRect = panel.getBoundingClientRect();
  const panelWidth = panelRect.width;
  const panelHeight = panelRect.height;

  this.dragOffset = {
    x: event.clientX - panelRect.left,
    y: event.clientY - panelRect.top,
  };

  const move = (e: MouseEvent) => {
    if (!this.isDragging) return;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const snapThreshold = 20;

    let left = e.clientX - this.dragOffset.x;
    let top = e.clientY - this.dragOffset.y;

    // Snap to left/right edges
    if (left < snapThreshold) {
      left = 0;
    } else if (screenWidth - (left + panelWidth) < snapThreshold) {
      left = screenWidth - panelWidth;
    }

    // Snap to top/bottom edges
    if (top < snapThreshold) {
      top = 0;
    } else if (screenHeight - (top + panelHeight) < snapThreshold) {
      top = screenHeight - panelHeight;
    }

    this.panelPosition = { left, top };
  };

  const stop = () => {
    this.isDragging = false;
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', stop);
  };

  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', stop);
}

startResize(event: MouseEvent) {
  this.isResizing = true;
  event.preventDefault();

  const startWidth = (event.target as HTMLElement).parentElement?.clientWidth || 300;
  const startHeight = (event.target as HTMLElement).parentElement?.clientHeight || 400;
  const startX = event.clientX;
  const startY = event.clientY;

  const resize = (e: MouseEvent) => {
    const newWidth = startWidth + (e.clientX - startX);
    const newHeight = startHeight + (e.clientY - startY);

    (event.target as HTMLElement).parentElement!.style.width = newWidth + 'px';
    (event.target as HTMLElement).parentElement!.style.height = newHeight + 'px';
  };

  const stopResize = () => {
    this.isResizing = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
  };

  document.addEventListener('mousemove', resize);
  document.addEventListener('mouseup', stopResize);
}

loadBrandingFromLocalStorage() {
  const data = localStorage.getItem('branding-config');
  if (!data) {
    if (this.selectedItem === 'brand'){
        this.toast.info('No branding data found.', 'top-center');
      }
      return;
    }
    
  try {
    const json = JSON.parse(data);
    if (!Array.isArray(json)) throw new Error('Invalid format');
    this.branches = json.map(branch => ({
      ...branch,
      isFontUploading: false,
      isLogoUploading: false,
      expanded : true
    }));
    this.cdr.detectChanges();
  } catch (err) {
    console.error(err);
  }
} 

@HostListener('document:click', ['$event'])
  onDocumentClick(evt: MouseEvent) {
    if (this.canvas.getActiveObject() && this.canvas.getActiveObject() instanceof fabric.Image) {
        this.showFilterPanel = true;
    } else{
        this.showFilterPanel = false;
      }
  this.cdr.detectChanges();
  }

  openTableDialog(): void {
    const dialogRef = this.dialog.open(TableConfigComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe((tableData) => {
      if (tableData) {
        const model: TableModel = this.generateTableModel(tableData.rows, tableData.columns);
        this.insertTableToCanvas(model);
      }
    });
  }

  generateTableModel(rows: number, cols: number): TableModel {
    const rowHeight = 40;
    const colWidth = 100;
    const table: TableModel = {
      id: 'tbl_' + Date.now(),
      position: { x: 100, y: 100 },
      dimensions: { rowHeight },
      columnWidths: Array(cols).fill(colWidth),
      rows: []
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
          rowIndex: r,
          colIndex: c,
          top: table.position.y,
          width: table.columnWidths[c],
          height: table.dimensions.rowHeight,
          left: table.position.x
        });
      }
      
      table.rows.push({ cells });
    }

    return table;
  }

  // TODO - add the mouse event on the textboxes as ddi in the same meethod in canvas


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
          fill: cell.backgroundColor,
          stroke: '#ccc',
          strokeWidth: 1
        });

        const text = new fabric.Textbox(cell.text, {
          left: xOffset + 5,
          top: yOffset + 10,
          width: model.columnWidths[c] - 10,
          fontSize: cell.fontSize,
          fontWeight: cell.bold ? 'bold' : 'normal',
          fill: cell.textColor,
          textAlign: cell.alignment,
          IsTableCell: true,
          selectable: true,
          evented: true
        });

           text.set('cellData', { rowIndex: r, 
                                 colIndex: c, 
                                 text: cell.text, 
                                 alignment: cell.alignment, 
                                 fontSize: cell.fontSize, 
                                 bold: cell.bold, 
                                 backgroundColor: cell.backgroundColor, 
                                 textColor: cell.textColor });

        
          text.set('cellData', cell);
          rect.set('cellData', cell);
          
        fabricObjects.push(rect, text);
        xOffset += model.columnWidths[c];
      }
      yOffset += model.dimensions.rowHeight;
    }

    const group = new fabric.Group(fabricObjects, {
      left: model.position.x,
      top: model.position.y,
      subTargetCheck : true
    });

    group.set('tableModel', model);
    group.set('IsTable', true);
    group.set('id', model.id); // 🆕 easier lookup

    this.canvas.add(group);
    this.canvas.requestRenderAll();
  }


  

}