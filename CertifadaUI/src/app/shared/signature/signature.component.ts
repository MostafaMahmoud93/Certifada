import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, OnInit, AfterViewInit, EventEmitter, Output } from '@angular/core';


@Component({
  selector: 'app-signature-popup',
  imports: [CommonModule],
  templateUrl: './signature.component.html',
  styleUrls: ['./signature.component.css']
})
export class SignaturePopupComponent implements OnInit, AfterViewInit {
  @ViewChild('canvas', { static: false }) canvas!: ElementRef<HTMLCanvasElement>;
private ctx?: CanvasRenderingContext2D;
  private drawing = false;
  @Output() CloseSignPopup = new EventEmitter<void>();

  public penColor: string = 'black';
  public isImageUpload = false;
  public imageUrl: string | null = null;

   hasSavedSignature = false;
  currentMode: 'initial' | 'sign' | 'upload' | 'view' = 'initial';

  ngOnInit() {
    const savedSignature = localStorage.getItem('userSignature');
    if (savedSignature) {
      this.hasSavedSignature = true;
      this.currentMode = 'view';

      if (savedSignature.startsWith('data:image/')) {
        this.imageUrl = savedSignature;
        this.isImageUpload = true;
      }
    }
  }
 ngAfterViewInit() {
    this.tryInitCanvas(); // in case canvas is already in view
  }

  ngAfterViewChecked() {
    this.tryInitCanvas(); // ✅ ensures canvas is initialized if switched to "sign" mode
  }

  tryInitCanvas() {
    if (this.currentMode === 'sign' && this.canvas && !this.ctx) {
      const canvasEl = this.canvas.nativeElement;
      this.ctx = canvasEl.getContext('2d')!;
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.strokeStyle = this.penColor;

      this.addCanvasListeners(canvasEl);

      const savedSignature = localStorage.getItem('userSignature');
      if (savedSignature && !this.isImageUpload) {
        const img = new Image();
        img.onload = () => this.ctx?.drawImage(img, 0, 0);
        img.src = savedSignature;
      }
    }
  }

    addCanvasListeners(canvas: HTMLCanvasElement) {
    canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    canvas.addEventListener('mousemove', this.draw.bind(this));
    canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    canvas.addEventListener('mouseleave', this.stopDrawing.bind(this));
    canvas.addEventListener('touchstart', this.startDrawing.bind(this));
    canvas.addEventListener('touchmove', this.draw.bind(this));
    canvas.addEventListener('touchend', this.stopDrawing.bind(this));
    canvas.addEventListener('touchcancel', this.stopDrawing.bind(this));
  }


   startDrawing(event: MouseEvent | TouchEvent) {
    if (!this.ctx) return;
    this.drawing = true;
    const { x, y } = this.getPos(event);
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  draw(event: MouseEvent | TouchEvent) {
    if (!this.drawing || !this.ctx) return;
    const { x, y } = this.getPos(event);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
  }

  stopDrawing() {
    this.drawing = false;
  }

  getPos(event: MouseEvent | TouchEvent) {
    const canvasEl = this.canvas!.nativeElement;
    const rect = canvasEl.getBoundingClientRect();
    if (event instanceof MouseEvent) {
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    } else {
      const touch = event.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
  }



  changePenColor(color: string) {
    this.penColor = color;
    if (this.ctx) {
      this.ctx.strokeStyle = color;
    }
  }

  clearCanvas() {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    }
    localStorage.removeItem('userSignature');
    this.reset();
  }

  clearImage() {
    this.imageUrl = null;
    localStorage.removeItem('userSignature');
    this.reset();
  }

  saveSignature() {
    let data: string | null = null;
    if (this.isImageUpload && this.imageUrl) {
      data = this.imageUrl;
    } else if (this.canvas) {
      data = this.canvas.nativeElement.toDataURL();
    }
    if (data) {
      localStorage.setItem('userSignature', data);
      this.hasSavedSignature = true;
      this.currentMode = 'view';
    }
  }

   onFileSelected(event: any) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      // Resize and crop logic
      const targetWidth = 400;
      const targetHeight = 240;

      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = targetWidth;
      offscreenCanvas.height = targetHeight;
      const offscreenCtx = offscreenCanvas.getContext('2d')!;

      // Simple centered crop:
      const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      const offsetX = (targetWidth - scaledWidth) / 2;
      const offsetY = (targetHeight - scaledHeight) / 2;

      offscreenCtx.clearRect(0, 0, targetWidth, targetHeight);
      offscreenCtx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

      this.imageUrl = offscreenCanvas.toDataURL(); // save cropped version
    };
    img.src = reader.result as string;
  };

  reader.readAsDataURL(file);
}


   chooseMode(mode: 'sign' | 'upload') {
    this.currentMode = mode;
    this.isImageUpload = mode === 'upload';
    this.ctx = undefined; // force canvas re-init
  }

   reset() {
    this.currentMode = 'initial';
    this.hasSavedSignature = false;
    this.imageUrl = null;
    this.isImageUpload = false;
    this.ctx = undefined;
  }



  
  closePopup() {
   this.currentMode = 'initial';
   this.CloseSignPopup.emit();
}
}