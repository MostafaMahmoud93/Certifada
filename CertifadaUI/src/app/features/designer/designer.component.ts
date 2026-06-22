import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { saveAs } from 'file-saver';
import { FabricCanvasService } from './fabric-canvas.service';
import { PropertiesPanelComponent } from './properties-panel.component';
import { TemplateService } from '../../core/template.service';
import { CertificateService } from '../../core/certificate.service';
import { SaveTemplateRequest } from '../../core/models';
import { exportPdf, exportPng, exportSvg } from '../../core/render.util';

interface SizePreset { label: string; w: number; h: number; }

@Component({
  selector: 'app-designer',
  standalone: true,
  imports: [FormsModule, DecimalPipe, PropertiesPanelComponent],
  providers: [FabricCanvasService],
  templateUrl: './designer.component.html',
  styleUrl: './designer.component.scss',
})
export class DesignerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasEl', { static: true }) canvasEl!: ElementRef<HTMLCanvasElement>;

  svc = inject(FabricCanvasService);
  private templates = inject(TemplateService);
  private certificates = inject(CertificateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  templateId = signal<number | null>(null);
  name = 'Untitled Certificate';
  width = 1123;
  height = 794;
  newFieldKey = '';
  tableRows = 3;
  tableCols = 3;
  saving = signal(false);
  message = signal<{ text: string; ok: boolean } | null>(null);
  showExport = signal(false);

  presets: SizePreset[] = [
    { label: 'A4 Landscape', w: 1123, h: 794 },
    { label: 'A4 Portrait', w: 794, h: 1123 },
    { label: 'US Letter Landscape', w: 1056, h: 816 },
    { label: 'Slide 16:9', w: 1280, h: 720 },
    { label: 'Square', w: 1000, h: 1000 },
  ];

  ngAfterViewInit(): void {
    this.svc.init(this.canvasEl.nativeElement, this.width, this.height);
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.load(+idParam);
    } else {
      this.seedStarter();
    }
  }

  ngOnDestroy(): void {
    this.svc.dispose();
  }

  private seedStarter(): void {
    this.svc.addHeading();
  }

  private load(id: number): void {
    this.templates.get(id).subscribe({
      next: (t) => {
        this.templateId.set(t.id);
        this.name = t.name;
        this.width = t.width;
        this.height = t.height;
        this.svc.resize(t.width, t.height);
        this.svc.loadJSON(t.canvasJson);
      },
      error: () => this.flash('Could not load template.', false),
    });
  }

  // -------------------- toolbar --------------------
  addField(): void {
    if (!this.newFieldKey.trim()) return;
    this.svc.addField(this.newFieldKey);
    this.newFieldKey = '';
  }

  onImageFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.svc.addImageFromFile(file).catch(() => this.flash('Could not load image.', false));
    }
    (event.target as HTMLInputElement).value = '';
  }

  applyPreset(p: SizePreset): void {
    this.width = p.w;
    this.height = p.h;
    this.svc.resize(p.w, p.h);
  }

  zoomIn(): void { this.svc.setZoom(this.svc.zoom() + 0.1); }
  zoomOut(): void { this.svc.setZoom(this.svc.zoom() - 0.1); }
  zoomReset(): void { this.svc.setZoom(1); }

  // -------------------- save / load --------------------
  save(): void {
    this.saving.set(true);
    const body: SaveTemplateRequest = {
      name: this.name?.trim() || 'Untitled Certificate',
      description: null,
      width: this.width,
      height: this.height,
      canvasJson: this.svc.toJSON(),
      placeholdersJson: JSON.stringify(this.svc.getPlaceholders()),
      thumbnailDataUrl: this.svc.getCanvas().toDataURL({ format: 'png', multiplier: 0.25 }),
    };

    const id = this.templateId();
    const req = id ? this.templates.update(id, body) : this.templates.create(body);
    req.subscribe({
      next: (t) => {
        this.templateId.set(t.id);
        this.saving.set(false);
        this.flash('Template saved.', true);
        if (!id) this.router.navigate(['/canvas', t.id], { replaceUrl: true });
      },
      error: () => {
        this.saving.set(false);
        this.flash('Save failed — the templates API may not be available yet.', false);
      },
    });
  }

  // -------------------- history / bulk --------------------
  saveToHistory(): void {
    const id = this.templateId();
    if (!id) { this.flash('Save the template first.', false); return; }
    const png = exportPng(this.svc.getCanvas(), 2);
    this.certificates
      .save({ templateId: id, recipientName: this.safeName(), dataJson: '{}', format: 'png', fileDataUrl: png })
      .subscribe({
        next: () => this.flash('Saved to history.', true),
        error: () => this.flash('Could not save to history.', false),
      });
  }

  goBulk(): void {
    const id = this.templateId();
    if (!id) { this.flash('Save the template first to enable bulk generation.', false); return; }
    this.router.navigate(['/bulk', id]);
  }

  // -------------------- export --------------------
  exportPng(): void {
    const url = exportPng(this.svc.getCanvas(), 2);
    saveAs(url, `${this.safeName()}.png`);
    this.showExport.set(false);
  }

  exportPdf(): void {
    const doc = exportPdf(this.svc.getCanvas(), 2);
    doc.save(`${this.safeName()}.pdf`);
    this.showExport.set(false);
  }

  exportSvg(): void {
    const svg = exportSvg(this.svc.getCanvas());
    saveAs(new Blob([svg], { type: 'image/svg+xml' }), `${this.safeName()}.svg`);
    this.showExport.set(false);
  }

  exportJson(): void {
    const json = this.svc.toJSON();
    saveAs(new Blob([json], { type: 'application/json' }), `${this.safeName()}.json`);
    this.showExport.set(false);
  }

  importJson(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.svc.loadJSON(reader.result as string);
    reader.readAsText(file);
    (event.target as HTMLInputElement).value = '';
  }

  // -------------------- keyboard --------------------
  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    const active = this.svc.getCanvas()?.getActiveObject() as any;
    const editing = active?.isEditing;
    if (editing) return;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      e.shiftKey ? this.svc.redo() : this.svc.undo();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      this.svc.redo();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      this.save();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (active) { e.preventDefault(); this.svc.deleteSelected(); }
    }
  }

  private safeName(): string {
    return (this.name?.trim() || 'certificate').replace(/[^a-z0-9_\- ]/gi, '').replace(/\s+/g, '_');
  }

  private flash(text: string, ok: boolean): void {
    this.message.set({ text, ok });
    setTimeout(() => this.message.set(null), 3000);
  }
}
