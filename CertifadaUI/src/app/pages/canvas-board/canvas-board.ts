import { ChangeDetectorRef, Component, ElementRef, HostListener, Inject, Renderer2, ViewChild ,OnInit} from '@angular/core';
import type { Canvas as FabricCanvas } from 'fabric';
import jsPDF from 'jspdf';
import { CanvasService } from '../../shared/canvas-service';
import { Ruler } from '../../shared/ruler';
import * as fabric from 'fabric';
import introJs from 'intro.js';
import 'intro.js/introjs.css';
import { Selection } from '../../shared/selection';
import { AiHelperService } from '../../shared/ai-helper.service';

import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { CanvasVersionService } from '../../shared/canvas-version.service';

@Component({
  selector: 'app-canvas-board',
  standalone : false,
  templateUrl: './canvas-board.html',
  styleUrl: './canvas-board.css',
}) 

export class CanvasBoard {
  private canvas!: FabricCanvas;
  isExpanded_Properties = false;
  isExpanded_details = true;

  @ViewChild('fileInput') fileInput: any;
  @ViewChild('fabricCanvas', { static: true }) canvasEl!: ElementRef<HTMLCanvasElement>;
  @ViewChild('Minmaxcanvas') responsiveDiv!: ElementRef<HTMLDivElement>;
  @ViewChild('Maincanvas') Maincanvas!: ElementRef<HTMLDivElement>;
  @ViewChild('settingsBtn', { read: ElementRef }) settingsBtn!: ElementRef;
  @ViewChild('hRuler', { static: true }) hRulerEl!: ElementRef<HTMLDivElement>;
  @ViewChild('vRuler', { static: true }) vRulerEl!: ElementRef<HTMLDivElement>;
  @ViewChild('guidesOverlay', { static: true }) guidesOverlay!: ElementRef<SVGSVGElement>;

  settingsMenuVisible = false;
  menuX = 0;
  menuY = 0;
  zoomPercent = 100;
  previewVisible = false;
  versionVisible = false;
  aiVisible = false;
  previewDataUrl = '';
  undoStack: string[] = [];
  redoStack: string[] = [];
  isRestoringHistory = false;
  panel1Open = true;
  panel2Open = true;
  isModalOpen: boolean = false;

  showRulers = true;
  private gridSize = 1;
  private gridSizeR = 10;
  private modInt = 100;
  private canvasWidth!: number;
  private canvasHeight!: number;
  templates: any[] = [];

  awardText: string = '';
  isLoading: boolean = false;
  suggestion : string = '';
  
  private autoSave$ = new Subject<void>();
  isSaving: boolean = false;
  versions: any[] = [];
  currentVersionIndex: number = -1;
  changesByreundo = false; // Flag to prevent multiple saves during undo/redo
  constructor(private canvasService: CanvasService, private RulerService: Ruler, 
    private selection: Selection,private renderer: Renderer2, private cdr: ChangeDetectorRef,
    @Inject('AiHelperService') private aiService: AiHelperService,
    private versionService: CanvasVersionService

  ){}

  ngOnInit() {
     this.canvasService.canvas$.subscribe(c => {
       if (c instanceof fabric.Canvas) {
        setTimeout(() => {
            this.canvas = c;
            this.canvas.on('object:added', () => this.triggerAutoSave());
            this.canvas.on('object:modified', () => this.triggerAutoSave());
            this.canvas.on('object:removed', () => this.triggerAutoSave());

            this.canvasWidth = this.canvas.getWidth();
            this.canvasHeight = this.canvas.getHeight();
            this.canvas.on('object:modified', () => this.clearGuides());
            this.canvas.on('mouse:up', () =>{ this.clearGuides();});
            this.canvas.on('object:moving', (e) => {this.drawGuidelinesIfObjectCentered(e.target);});
            this.drawRulers();
            this.adjustCanvasZoom();
        }, 0);}});

     this.selection.active$.subscribe(value => {this.isExpanded_details = value; });

     const storedTemplates = localStorage.getItem('templates');
     if (storedTemplates) {
       this.templates = JSON.parse(storedTemplates);
     }

    this.setupAutoSave();
    this.loadVersions();
  }


  ngAfterViewInit(): void {
  }

  saveTemplate() {
      const canvasJSON = this.canvas.toJSON();
      const canvasImage = this.canvas.toDataURL({format: 'png', quality: 1.0,  multiplier: 1});
      const newTemplate = {name: 'Template_101',status:'Draft',json: canvasJSON,image: canvasImage};
      //this.templates =[];
      this.templates.push(newTemplate);
      localStorage.setItem('templates', JSON.stringify(this.templates));
  }

 clearCanvas() {
   this.canvas.clear();
 }

 suggestText() {
        this.isLoading = true;
        const prompt = this.awardText;

        this.aiService.getCertificateTextSuggestion(prompt).subscribe({
          next: (res) => {
            this.suggestion = res?.choices?.[0]?.message?.content;
         //   this.canvas.loadFromJSON(suggestion, () => {this.canvas.requestRenderAll();});
                 this.magicTransitionToNewCanvas(this.suggestion);

            this.awardText='';
           // if (suggestion) this.awardText = suggestion.trim();
            this.isLoading = false;
            this.aiVisible = false;

          },
          error: (err) => {
            console.error('AI error:', err);
            this.isLoading = false;
          }
        });


 }


 private clearGuides() {
    this.guidesOverlay.nativeElement.innerHTML = '';
 }

 toggleRuler() {
    this.showRulers = !this.showRulers;
     if (this.showRulers){
        this.renderer.removeClass(this.hRulerEl.nativeElement, 'invisible');
        this.renderer.removeClass(this.vRulerEl.nativeElement, 'invisible');

        this.drawRulers();
    }else{
        this.renderer.addClass(this.hRulerEl.nativeElement, 'invisible');
        this.renderer.addClass(this.vRulerEl.nativeElement, 'invisible');
    }
 }

 private drawRulers() {
      
      const MaincanvasRect = this.Maincanvas.nativeElement.getBoundingClientRect();


      
      const canvasCenterX = Math.round((MaincanvasRect.width / 2) / 100) * 100;
      const canvasCenterY = Math.round((MaincanvasRect.height / 2) / 100) * 100;

      
      
      this.hRulerEl.nativeElement.innerHTML = '';
      this.vRulerEl.nativeElement.innerHTML = '';

      for (let x = canvasCenterX; x <= MaincanvasRect.width; x += this.gridSizeR) {
        if (x % this.modInt == 0)  {
          const label = document.createElement('span');
          label.className = 'absolute text-xs text-gray-600 dark:text-gray-100';
          label.style.left = `${x}px`;
          label.style.top = '2px';
          label.style.fontSize = '8px';
          label.textContent = `${x - canvasCenterX}`; 
          this.hRulerEl.nativeElement.appendChild(label);
        } else {
          const tick = document.createElement('div');
          tick.className = 'absolute h-1 border-l border-gray-400 dark:border-gray-500';
          tick.style.left = `${x + 6}px`; 
          this.hRulerEl.nativeElement.appendChild(tick);
        }
      }

      for (let x = canvasCenterX; x >= 0; x -= this.gridSizeR) {
        if (x % this.modInt == 0)  {
          const label = document.createElement('span');
          label.className = 'absolute text-xs text-gray-600 dark:text-gray-100';
          label.style.left = `${x}px`;
          label.style.top = '2px';
          label.style.fontSize = '8px';
          label.textContent = `${canvasCenterX - x}`; 
          this.hRulerEl.nativeElement.appendChild(label);
        } else {
          const tick = document.createElement('div');
          tick.className = 'absolute h-1 border-l border-gray-400 dark:border-gray-500';
          tick.style.left = `${x + 6}px`; 
          this.hRulerEl.nativeElement.appendChild(tick);
        }
      }

      for (let y = canvasCenterY; y <= MaincanvasRect.height; y += this.gridSizeR) {
        if (y % this.modInt == 0){
          const label = document.createElement('span');
          label.className = 'absolute text-xs text-gray-600 dark:text-gray-100';
          label.style.left = '2px';
          label.style.top = `${y}px`;
          label.style.fontSize = '8px';
          label.textContent = `${y - canvasCenterY}`; 
          this.vRulerEl.nativeElement.appendChild(label);
        } else {
          const tick = document.createElement('div');
          tick.className = 'absolute w-1 border-t border-gray-400 dark:border-gray-500';
          tick.style.top = `${y + 6}px`; 
          this.vRulerEl.nativeElement.appendChild(tick);
        }
      }

      for (let y = canvasCenterY; y >= 0; y -= this.gridSizeR) {
        if (y % this.modInt == 0) {
          const label = document.createElement('span');
          label.className = 'absolute text-xs text-gray-600 dark:text-gray-100';
          label.style.left = '2px';
          label.style.top = `${y}px`;
          label.style.fontSize = '8px';
          label.textContent = `${canvasCenterY - y}`; 
          this.vRulerEl.nativeElement.appendChild(label);
        } else {
          const tick = document.createElement('div');
          tick.className = 'absolute w-1 border-t border-gray-400 dark:border-gray-500';
          tick.style.top = `${y + 6}px`; 
          this.vRulerEl.nativeElement.appendChild(tick);
        }
      }
 }

  reloadCanvas(JsonData: string | null) {
    this.settingsMenuVisible = false;
     
    if (JsonData) {
        const MAX_W = 400;
        const MAX_H = 400;
        const cw = this.canvas.getWidth();
        const ch = this.canvas.getHeight();

        const scale = Math.min(MAX_W / cw, MAX_H / ch);
        const canvasData = JSON.parse(JsonData);
        this.canvas.loadFromJSON(canvasData, () => {
        this.canvas.requestRenderAll();
      
      });
    }
  }

  openSettings(event: MouseEvent) {
      event.stopPropagation();
      const rect = (this.settingsBtn.nativeElement as HTMLElement).getBoundingClientRect();
      // Calculate position relative to the parent .canvas container
      // Parent .canvas is positioned relative, so subtract its top/left
      const parentRect = (this.settingsBtn.nativeElement as HTMLElement).closest('.canvas')!.getBoundingClientRect();
      let menuX = rect.left - parentRect.left;
      let menuY = rect.bottom - parentRect.top + 4;
      
      // in arabic direction skip this line
      menuX = parentRect.right - rect.right-100;

      this.menuX = menuX;
      this.menuY = menuY;
      this.settingsMenuVisible = true;
  }

  onSettingOption(option: string) {
    this.settingsMenuVisible = false;

    if (option === '2') {
      this.openWorkflowModal();
    } if (option === '3') {
      this.versionVisible = true;
    }if (option === '4') {
      this.showPreview();
    } if (option === '11') {
      this.fileInput.nativeElement.click();
     }
    else {
      console.log('Selected setting:', option);
    }
  }

  openWorkflowModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

 async onFileSelected(event: any): Promise<void> {
    const file: File = event.target.files[0];
    if (file) {
      try {
        this.reloadCanvas(await this.readFileAsText(file));  
      } catch (error) {
        alert('Failed to read file');
      }
    }
  }

  readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const fileContent = reader.result as string;
        resolve(fileContent);  // Resolve with the file content
      };

      reader.onerror = (error) => {
        reject(error);  // Reject if there's an error reading the file
      };

      reader.readAsText(file);  // Start reading the file as text
    });
  }

  private showPreview() {
      if (!this.canvas) return;

      const gridLines = this.canvas.getObjects().filter(obj => (obj as any).isGridLine);
      gridLines.forEach(line => line.visible = false);
      // Render without grid lines
      this.canvas.requestRenderAll();
      // 1. Get the canvas PNG as a data URL
      const originalDataURL = this.canvas.toDataURL({
        format: 'png',
        quality: 1.0,
        multiplier: 1
      });

      // 2. Create an offscreen HTMLCanvas, draw the snapshot, then overlay “PREVIEW” text
      const img = new Image();
      img.src = originalDataURL;
      img.onload = () => {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = this.canvas.getWidth();
        offCanvas.height = this.canvas.getHeight();
        const ctx = offCanvas.getContext('2d')!;
        // Draw the existing canvas snapshot
        ctx.drawImage(img, 0, 0, offCanvas.width, offCanvas.height);
        // Overlay the watermark in bottom‐right
        ctx.font = '36pt sans-serif';
        ctx.fillStyle = 'rgba(211, 211, 211, 1)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('PREVIEW', offCanvas.width - 10, offCanvas.height - 10);
        // 3. Get the final data URL and show it in the popup
        this.previewDataUrl = offCanvas.toDataURL('image/png');
        this.previewVisible = true;


      };

      gridLines.forEach(line => line.visible = true);
      this.canvas.requestRenderAll();
  }

  closePreview() {
    this.previewVisible = false;
    this.versionVisible = false;
    this.previewDataUrl = '';
  }

  ai() {
    this.aiVisible = !this.aiVisible;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.settingsMenuVisible = false;
    if(this.canvas.getActiveObject()) {
       this.isExpanded_Properties = true;
    }else{
      this.isExpanded_Properties = false;
    }

  }


  adjustCanvasZoom() {
      
      const containerWidth = this.Maincanvas.nativeElement.offsetWidth;
      const containerHeight = this.Maincanvas.nativeElement.offsetHeight;

      const canvasWidth = this.canvas.getWidth();
      const canvasHeight = this.canvas.getHeight();

          const scaleX = (containerWidth-100) / canvasWidth;
          const scaleY = (containerHeight-120) / canvasHeight;

          // Use the smaller of the two scale factors to maintain aspect ratio
          const scaleFactor = Math.min(scaleX, scaleY);
          this.applyZoom(scaleFactor);
        
  }

  zoomIn() { // cap at 300%
    if (!this.canvas) return;
    
    const newZoom = Math.min(this.canvas.getZoom() * 1.1, 3); 
        this.zoomPercent = Math.round(newZoom * 100);

    this.applyZoom(newZoom);
  }

  // OR

  //  zoomIn() { // cap at (based on containre and canvas sizes)
  //     if (!this.canvas) return;
  //     const containerWidth = this.Maincanvas.nativeElement.offsetWidth;
  //     const containerHeight = this.Maincanvas.nativeElement.offsetHeight;

  //     const canvasWidth = this.canvas.getWidth();
  //     const canvasHeight = this.canvas.getHeight();

  //     const maxZoomX = containerWidth / canvasWidth;  
  //     const maxZoomY = containerHeight / canvasHeight; 

  //     const maxZoom = Math.min(maxZoomX, maxZoomY);
  //     const newZoom = Math.min(this.canvas.getZoom() * 1.1, maxZoom);
  //     this.zoomPercent = Math.round(newZoom * 100);

  //     this.applyZoom(newZoom);
  //     }

  zoomOut() {
    if (!this.canvas) return;
    const newZoom = Math.max(this.canvas.getZoom() / 1.1, 0.5); // floor at 50%
        this.zoomPercent = Math.round(newZoom * 100);

    this.applyZoom(newZoom);
  }

  onZoomPercentInput(event: Event) {
    if (!this.canvas) return;

    const inputValue = (event.target as HTMLInputElement).value;
    
    let newZoom = parseInt(inputValue);

    if (isNaN(newZoom)) {
      newZoom = this.zoomPercent;  // Fallback to the current zoom percent if the input is not valid
    }

    // Ensure the zoom percentage stays within the valid range
    if (newZoom < 50) {
      this.zoomPercent = 50;
    } else if (newZoom > 300) {
      this.zoomPercent = 300;
    } else {
      this.zoomPercent = newZoom;
    }


    const zoomFactor = this.zoomPercent / 100;
    
      this.applyZoom(zoomFactor);

  }

  private applyZoom(zoomLevel: number) {
    this.canvas.setZoom(zoomLevel);

    const baseW = 792;
    const baseH = 612;
    this.canvas.setWidth(baseW * zoomLevel);
    this.canvas.setHeight(baseH * zoomLevel);

    const wrapper = document.querySelector('.canvas-it') as HTMLElement;
    if (wrapper) {
      wrapper.style.width  = '${baseW * zoomLevel}px';
      wrapper.style.height = '${baseH * zoomLevel}px';
    }

  
    this.drawRulers();
    this.canvas.requestRenderAll();
    this.zoomPercent = Math.round(zoomLevel * 100);
    
  }

  resetZoom() {
    this.zoomPercent = 100;
    this.applyZoom(1);  // Reset canvas zoom to 1 (100%)
  }

  resetView() {
      if (!this.canvas) return;

      const canvas = this.canvas;
      const currentTransform = canvas.viewportTransform!;
      const targetTransform: fabric.TMat2D = [1, 0, 0, 1, 0, 0] as fabric.TMat2D;

      // Animate each of the 6 matrix values individually
      fabric.util.animate({
        startValue: 0,
        endValue: 1,
        duration: 300, // ms
        easing: fabric.util.ease.easeInOutCubic,
        onChange: (progress) => {
          const interpolated = currentTransform.map((start, i) => {
            const end = targetTransform[i];
            return start + (end - start) * progress;
          });
        canvas.setViewportTransform(interpolated as fabric.TMat2D);
        },
        onComplete: () => {
          canvas.setViewportTransform(targetTransform);
          canvas.requestRenderAll();
        },
      });
}

  exportPNG() {
    if (!this.canvas) return;
    const dataURL = this.canvas.toDataURL({
      format: 'png',
      quality: 1.0,
      multiplier: 1
    });
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'canvas-export.png';
    link.click();
  }

 exportPDF() {
    if (!this.canvas) return;
    const dataURL = this.canvas.toDataURL({ format: 'png', quality: 1.0, multiplier: 1 });
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [this.canvas.getWidth(), this.canvas.getHeight()]
    });
    pdf.addImage(dataURL, 'PNG', 0, 0, this.canvas.getWidth(), this.canvas.getHeight());
    pdf.save('canvas-export.pdf');
  }

  togglePanel(panel: number) {
    if (panel === 1) {
      if (this.panel1Open && this.panel2Open) {
        this.panel2Open = false;
      } else if (this.panel1Open) {
        this.panel2Open = true;
      } else {
        this.panel1Open = true;
        this.panel2Open = false;
      }
    } else if (panel === 2) {
      if (this.panel1Open && this.panel2Open) {
        this.panel1Open = false;
      } else if (this.panel2Open) {
        this.panel1Open = true;
      } else {
        this.panel1Open = false;
        this.panel2Open = true;
      }
    }    
  }

  startIntroJs() {
    this.settingsMenuVisible = false;
    const saved = localStorage.getItem('theme');
    const introStyles = saved === 'dark' ? this.darkThemeStyles() : this.lightThemeStyles();

    introJs().setOptions({
      steps: [
        {
          element: '#canvas', 
          intro: 'This is the canvas! You can zoom in and out by pressing Ctrl + Mouse Wheel.',
          position: 'right',
          highlightClass: 'introjs-highlight'
        },
        {
          element: '#canvas', 
          intro: 'You can also pan by pressing Ctrl + Dragging.',
        },
        {
          element: '#resetZoom',
          intro: 'Use this button to reset the zoom in.',
        },
        {
          element: '#resetView',
          intro: 'Use this button to reset the pan.',
        },
      ],
        showStepNumbers: false,
        ...introStyles // Apply dynamic styles based on the current theme
    }).start();
  }

   darkThemeStyles() {
    return {
      overlayOpacity: 0.8, // Darker overlay opacity
      tooltipClass: 'introjs-tooltip-dark', // Apply custom dark theme class
      highlightClass: 'introjs-highlight-dark', // Dark highlight for selected elements
      arrowColor: 'white', // Change arrow color to white for visibility
      tooltipPosition: 'auto'
    };
  }

  lightThemeStyles() {
    return {
      overlayOpacity: 0.5, // Lighter overlay opacity
      tooltipClass: 'introjs-tooltip-light', // Apply custom light theme class
      highlightClass: 'introjs-highlight-light', // Light highlight for selected elements
      arrowColor: 'black', // Change arrow color to black for visibility
      tooltipPosition: 'auto'
    };
  }

  toggleDetails() {
    this.isExpanded_details = !this.isExpanded_details;
  }

  drawGuidelinesIfObjectCentered(obj: any) {
    if (!this.canvas || !this.guidesOverlay) return;

    const rect = this.guidesOverlay.nativeElement.getBoundingClientRect();
    const ContainerWidth = rect.width;
    const ContainerHeight = rect.height;
    const ContainerCenterX = ContainerWidth/2;
    const ContainerCenterY = ContainerHeight/2;

    const canvasWidth = this.canvas.getWidth();
    const canvasHeight = this.canvas.getHeight();

    const objLeft = obj.left; 
    const objTop = obj.top; 
    const objWidth = obj.width; 
    const objHeight = obj.height;

    const objCenterX = objLeft + objWidth / 2;
    const objCenterY = objTop + objHeight / 2;

    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;

    const isObjectCenteredHorizontally = Math.abs(objCenterX - canvasCenterX) < 5; 
    const isObjectCenteredVertically = Math.abs(objCenterY - canvasCenterY) < 5; 

    if (isObjectCenteredHorizontally || isObjectCenteredVertically) {
      const guidesOverlay = this.guidesOverlay.nativeElement;
      guidesOverlay.innerHTML = ''; 
      this.clearGuides();

      if (isObjectCenteredHorizontally) {
        const verticalLine = document.createElementNS('http://www.w3.org/2000/svg','line');
        verticalLine.setAttribute('x1', `${ContainerCenterX}`);
        verticalLine.setAttribute('y1', '0');
        verticalLine.setAttribute('x2', `${ContainerCenterX}`);
        verticalLine.setAttribute('y2', `${ContainerHeight}`);
        verticalLine.setAttribute('stroke', 'gray');
        verticalLine.setAttribute('stroke-width', '0.5');
        verticalLine.setAttribute('stroke-dasharray', '5,5'); 
        guidesOverlay.appendChild(verticalLine);
      }

      if (isObjectCenteredVertically) {
        const horizontalLine = document.createElementNS('http://www.w3.org/2000/svg','line');
        horizontalLine.setAttribute('x1', '0');
        horizontalLine.setAttribute('y1', `${ContainerCenterY}`);
        horizontalLine.setAttribute('x2', `${ContainerWidth}`);
        horizontalLine.setAttribute('y2', `${ContainerCenterY}`);
        horizontalLine.setAttribute('stroke', 'gray');
        horizontalLine.setAttribute('stroke-width', '0.5');
        horizontalLine.setAttribute('stroke-dasharray', '5,5'); 
        guidesOverlay.appendChild(horizontalLine);
      }
    }else {
      this.clearGuides();
    }
  }

 magicTransitionToNewCanvas(aiJson: any) {
  const canvas = this.canvas;
    const rect = this.guidesOverlay.nativeElement.getBoundingClientRect();

  // 1. Create a flash overlay
  const flash = new fabric.Rect({
    left: 0,
    top: 0,
    width: rect.width,
    height: rect.height,
    fill: '#edf39aff',
    opacity: 0,
    selectable: false,
    evented: false,
    excludeFromExport: true
  });

  canvas.add(flash);
  canvas.bringObjectToFront(flash); // bring flash on top of everything
  canvas.requestRenderAll();

  // 2. Zoom slightly
  const initialZoom = canvas.getZoom();
  const zoomPoint = new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2);
  canvas.zoomToPoint(zoomPoint, initialZoom * 1.05);

  // 3. Animate flash IN (opacity 0 → 1)
  fabric.util.animate({
    startValue: 0,
    endValue: 1,
    duration: 300,
    onChange: (value) => {
      flash.set('opacity', value);
      canvas.requestRenderAll();
    },
    onComplete: () => {
      // 4. Wait then clear & load AI content after animation
      setTimeout(() => {
        // Start loading the new canvas JSON
        canvas.loadFromJSON(aiJson, () => {
          canvas.setZoom(initialZoom);
          canvas.requestRenderAll();

          // 5. Add flash for fade-out effect
          fabric.util.animate({
            startValue: 1,
            endValue: 0,
            duration: 300,
            onChange: (value) => {
              flash.set('opacity', value);
              canvas.requestRenderAll();
            },
            onComplete: () => {
              // Remove flash after fade-out
              canvas.remove(flash);
              canvas.requestRenderAll();
            }
          });
        });
      }, 200);  // Delay for transition before clearing
    }
  });
}












 setupAutoSave() {
    this.autoSave$
      .pipe(debounceTime(2000))
      .subscribe(() => this.saveVersion());
  }

  triggerAutoSave() {
    this.autoSave$.next();
  }

  async saveVersion() {
    if (this.changesByreundo) return; // Prevent multiple saves
    this.isSaving = true;
    this.versions = this.versions.slice(0, this.currentVersionIndex + 1);
    const json = this.canvas.toJSON();
    await this.versionService.saveVersion(json);
    this.currentVersionIndex++;
    this.loadVersions();
    this.isSaving = false;
  }

 async loadVersions() {
  this.versions = await this.versionService.getVersions();
  this.currentVersionIndex = this.versions.length - 1; // set to latest
}

  async restoreVersion(version: any) {
    this.changesByreundo = true; // Set flag to prevent multiple saves
    this.canvas.loadFromJSON(version.json, () => {
      this.canvas.requestRenderAll();
    });
    this.versionVisible = false;
    this.changesByreundo = false;
  }

  async undo() {
    
  if (this.currentVersionIndex > 0) {
    this.currentVersionIndex--;
    await this.restoreVersion(this.versions[this.currentVersionIndex]);
  }
}

async redo() {
  if (this.currentVersionIndex < this.versions.length - 1) {
    this.currentVersionIndex++;
    await this.restoreVersion(this.versions[this.currentVersionIndex]);
  }
}



  async deleteVersion(id: number) {
    await this.versionService.deleteVersion(id);
    this.loadVersions();
  }

}
