import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { trigger, transition, style, animate } from '@angular/animations';
import { saveAs } from 'file-saver';
import * as QRCode from 'qrcode';
import { FabricCanvasService, BrushType, TemplateItem, patternTileSvg, frameSvg, FRAME_KINDS, TableCellHit, TableSpec, expandDynamicTablesInJson } from './fabric-canvas.service';
import { PropertiesPanelComponent } from './properties-panel.component';
import { AiService, DesignSpec } from './ai.service';
import { TemplateService } from '../../core/services/template.service';
import { CertificateService } from '../../core/services/certificate.service';
import { AssetService, UserAsset, AssetEntry } from '../../core/services/asset.service';
import { BrandService } from '../../core/services/brand.service';
import { PlanService, FeatureKey } from '../../core/services/plan.service';
import { UpgradeService } from '../../core/services/upgrade.service';
import { SaveTemplateRequest } from '../../core/models/models';
import { exportPdf, exportPng, exportSvg, renderJsonToPng, mergeDataIntoJson } from '../../core/utils/render.util';

interface SizePreset { label: string; w: number; h: number; }
interface RailItem { id: PanelId; label: string; icon: string; }
type PanelId = 'design' | 'templates' | 'ai' | 'text' | 'elements' | 'images' | 'backgrounds' | 'variables' | 'qr' | 'drawing' | 'addons' | 'assets' | 'table' | 'layers';
interface CanvasVersion { id: number; name: string; at: number; json: string; thumb: string; meta: string; }
interface SizePresetItem { label: string; w: number; h: number; }
interface SizeGroup { label: string; items: SizePresetItem[]; }
interface DesignTemplate { id: string; name: string; cat: string; tags: string; w: number; h: number; bg?: string; accent: string; items: TemplateItem[]; }
interface TplCategory { id: string; label: string; }
interface TextStyleOpts { fontFamily?: string; fontSize?: number; fontWeight?: string; fill?: string; fontStyle?: string; underline?: boolean; textAlign?: string; charSpacing?: number; lineHeight?: number; shadow?: boolean; outline?: boolean; outlineColor?: string; }
type SelKind = 'none' | 'text' | 'image' | 'shape' | 'group' | 'table';
type CtxAction =
  | 'cut' | 'copy' | 'paste' | 'duplicate'
  | 'front' | 'forward' | 'backward' | 'back'
  | 'lock' | 'centerH' | 'centerV' | 'selectAll' | 'delete'
  | 'alignLeft' | 'alignRight' | 'alignTop' | 'alignBottom'
  | 'distH' | 'distV' | 'group' | 'ungroup' | 'copyStyle' | 'pasteStyle';

@Component({
  selector: 'app-designer',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet, DecimalPipe, PropertiesPanelComponent, TranslocoModule],
  providers: [FabricCanvasService],
  animations: [
    trigger('panelToggle', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('180ms cubic-bezier(.16,.84,.44,1)', style({ opacity: 1, transform: 'none' })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' })),
      ]),
    ]),
  ],
  templateUrl: './designer.component.html',
  styleUrl: './designer.component.scss',
})
export class DesignerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasEl', { static: true }) canvasEl!: ElementRef<HTMLCanvasElement>;
  @ViewChild('rulerTop') rulerTop?: ElementRef<HTMLCanvasElement>;
  @ViewChild('rulerLeft') rulerLeft?: ElementRef<HTMLCanvasElement>;
  @ViewChild('replaceInput') replaceInput?: ElementRef<HTMLInputElement>;

  svc = inject(FabricCanvasService);
  assets = inject(AssetService);
  brand = inject(BrandService);
  private plan = inject(PlanService);
  private upgrade = inject(UpgradeService);
  private i18n = inject(TranslocoService);
  private ai = inject(AiService);
  private templates = inject(TemplateService);
  private certificates = inject(CertificateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private host = inject(ElementRef) as ElementRef<HTMLElement>;

  constructor() { this.brand.reload(); }

  templateId = signal<string | null>(null);
  name = 'Untitled Certificate';
  width = 1123;
  height = 794;
  newFieldKey = '';
  tableRows = 3;
  tableCols = 3;
  saving = signal(false);
  message = signal<{ text: string; ok: boolean } | null>(null);
  showExport = signal(false);

  // ---- Canva-style rail + flyout panels ----
  rail: RailItem[] = [
    { id: 'design', label: 'Design', icon: 'aspect_ratio' },
    { id: 'templates', label: 'Templates', icon: 'grid_view' },
    { id: 'ai', label: 'AI', icon: 'auto_awesome' },
    { id: 'text', label: 'Text', icon: 'title' },
    { id: 'elements', label: 'Elements', icon: 'category' },
    { id: 'images', label: 'Images', icon: 'image' },
    { id: 'backgrounds', label: 'Background', icon: 'wallpaper' },
    { id: 'variables', label: 'Variables', icon: 'data_object' },
    { id: 'qr', label: 'QR Code', icon: 'qr_code_2' },
    { id: 'drawing', label: 'Drawing', icon: 'brush' },
    { id: 'addons', label: 'Addons', icon: 'extension' },
    { id: 'assets', label: 'Assets', icon: 'photo_library' },
    { id: 'table', label: 'Table', icon: 'grid_on' },
  ];
  activePanel = signal<PanelId | null>('design');
  search = signal('');
  railPlan: Partial<Record<PanelId, FeatureKey>> = { ai: 'ai', qr: 'qr', drawing: 'drawing', table: 'table' };
  railLocked(id: PanelId): boolean { const f = this.railPlan[id]; return !!f && !this.plan.can(f); }
  selectPanel(id: PanelId): void {
    const f = this.railPlan[id];
    if (f && !this.plan.can(f)) { this.upgrade.open(f); return; }   // plan-locked -> upgrade dialog
    this.activePanel.set(this.activePanel() === id ? null : id);
    this.search.set('');
  }

  /** Tool flyout: pinned = stays open; unpinned = auto-hide, reveal on hover. */
  flyoutPinned = signal(localStorage.getItem('cf-flyout-pin') !== '0');
  toggleFlyoutPin(): void {
    this.flyoutPinned.set(!this.flyoutPinned());
    localStorage.setItem('cf-flyout-pin', this.flyoutPinned() ? '1' : '0');
  }
  /** When unpinned, hovering a rail icon opens that tab. */
  onRailHover(id: PanelId): void { if (this.railLocked(id)) return; if (!this.flyoutPinned()) this.activePanel.set(id); }

  // ---- AI designer (chat → generated template) ----
  aiMsgs = signal<{ role: 'user' | 'assistant' | 'error'; text: string }[]>([]);
  aiInput = '';
  aiBusy = signal(false);
  aiSettings = signal(false);
  aiProvider = this.ai.getConfig().provider;
  aiKey = this.ai.getConfig().apiKey;
  aiModel = this.ai.getConfig().model;
  aiUrl = this.ai.getConfig().url;
  aiSuggestions = [
    'Modern certificate of achievement in navy and gold',
    'Instagram sale post, bold, 50% off',
    'Professional invoice for my company',
    'Elegant wedding invitation, dark with gold',
  ];
  saveAiConfig(): void {
    this.ai.setConfig({ provider: this.aiProvider, apiKey: this.aiKey.trim(), model: this.aiModel.trim(), url: this.aiUrl.trim() });
    this.aiModel = this.ai.getConfig().model;
    this.aiSettings.set(false);
  }
  useAiSuggestion(s: string): void { this.aiInput = s; this.sendAi(); }
  async sendAi(): Promise<void> {
    const prompt = this.aiInput.trim();
    if (!prompt || this.aiBusy()) return;
    const cfg = this.ai.getConfig();
    if (cfg.provider !== 'custom' && !cfg.apiKey) {
      this.aiSettings.set(true);
      this.pushAi('error', 'Add your API key in settings, then try again.');
      return;
    }
    this.pushAi('user', prompt);
    this.aiInput = '';
    this.aiBusy.set(true);
    try {
      const spec = await this.ai.generateTemplate(prompt, this.width, this.height);
      this.applyAiSpec(spec);
      this.pushAi('assistant', `Created “${spec.name}” — ${spec.width}×${spec.height}px, ${spec.items.length} elements. Edit it on the canvas, or ask me to change it.`);
    } catch (e: any) {
      this.pushAi('error', e?.message || 'Something went wrong generating the design.');
    } finally {
      this.aiBusy.set(false);
    }
  }
  private pushAi(role: 'user' | 'assistant' | 'error', text: string): void {
    this.aiMsgs.update((m) => [...m, { role, text }]);
  }
  private applyAiSpec(spec: DesignSpec): void {
    this.width = spec.width; this.height = spec.height; this.customW = spec.width; this.customH = spec.height;
    this.svc.applyTemplate(spec.width, spec.height, spec.items, spec.bg ?? '#ffffff');
    setTimeout(() => { this.drawRulers(); this.zoomToFit(1); }, 0);
  }
  private q(): string { return this.search().trim().toLowerCase(); }

  // ---- Design: canvas size / type presets ----
  customW = this.width;
  customH = this.height;
  designGroups: SizeGroup[] = [
    { label: 'Certificate', items: [
      { label: 'Landscape', w: 1123, h: 794 },
      { label: 'Portrait', w: 794, h: 1123 },
      { label: 'Wide', w: 1280, h: 720 },
    ] },
    { label: 'Document', items: [
      { label: 'A4 Portrait', w: 794, h: 1123 },
      { label: 'A4 Landscape', w: 1123, h: 794 },
      { label: 'A5 Portrait', w: 559, h: 794 },
      { label: 'US Letter', w: 816, h: 1056 },
      { label: 'Legal', w: 816, h: 1344 },
    ] },
    { label: 'Presentation', items: [
      { label: 'Slide 16:9', w: 1280, h: 720 },
      { label: 'Slide 4:3', w: 1024, h: 768 },
    ] },
    { label: 'Social media', items: [
      { label: 'Instagram Post', w: 1080, h: 1080 },
      { label: 'Instagram Story', w: 1080, h: 1920 },
      { label: 'Facebook Post', w: 1200, h: 630 },
      { label: 'X / Twitter', w: 1600, h: 900 },
      { label: 'LinkedIn', w: 1200, h: 627 },
      { label: 'YouTube Thumb', w: 1280, h: 720 },
    ] },
    { label: 'Cards & invites', items: [
      { label: 'Business Card', w: 1050, h: 600 },
      { label: 'Postcard', w: 1500, h: 1050 },
      { label: 'Greeting Card', w: 1500, h: 2100 },
      { label: 'Invitation', w: 1500, h: 2100 },
    ] },
    { label: 'Menus & signage', items: [
      { label: 'Menu A4', w: 794, h: 1123 },
      { label: 'Menu Tabloid', w: 1224, h: 1584 },
      { label: 'Table Tent', w: 1050, h: 1500 },
      { label: 'Poster', w: 1587, h: 2245 },
      { label: 'Flyer A5', w: 559, h: 794 },
    ] },
  ];

  applySize(w: number, h: number): void {
    this.width = w; this.height = h;
    this.customW = w; this.customH = h;
    this.svc.resize(w, h);
    setTimeout(() => { this.drawRulers(); this.zoomToFit(1); }, 0);
  }
  applyCustom(): void {
    const w = Math.min(5000, Math.max(50, Math.round(+this.customW || 0)));
    const h = Math.min(5000, Math.max(50, Math.round(+this.customH || 0)));
    this.applySize(w, h);
  }
  setOrientation(o: 'landscape' | 'portrait'): void {
    const lo = Math.min(this.width, this.height), hi = Math.max(this.width, this.height);
    this.applySize(o === 'landscape' ? hi : lo, o === 'landscape' ? lo : hi);
  }

  // ---- Pages (multi-page document) ----
  addPage(): void { this.svc.addPage(); this.afterPageChange(); }
  duplicatePage(i: number): void { this.svc.duplicatePage(i); this.afterPageChange(); }
  deletePage(i: number): void { this.svc.deletePage(i); this.afterPageChange(); }
  goToPage(i: number): void { this.svc.goToPage(i); this.afterPageChange(); }
  movePage(i: number, dir: -1 | 1): void { this.svc.reorderPages(i, i + dir); }
  renamePage(i: number, ev: Event): void { this.svc.renamePage(i, (ev.target as HTMLInputElement).value); }
  private afterPageChange(): void {
    const c = this.svc.getCanvas();
    this.width = c.getWidth(); this.height = c.getHeight();
    this.customW = this.width; this.customH = this.height;
    setTimeout(() => this.drawRulers(), 0);
  }

  // ---- ready-made templates ----
  designTemplates: DesignTemplate[] = [
    { id: 'gold-participation', name: 'Gold Participation', cat: 'certificate', tags: 'certificate gold participation award seal ornate elegant landscape', w: 1123, h: 794, bg: '#f7f3ea', accent: '#c9a227', items: [
      { kind: 'triangle', x: 1085, y: 28, w: 360, h: 300, fill: '#0f172a', grad: '#3a3a3a', angle: 205, opacity: 0.96 },
      { kind: 'triangle', x: 1108, y: 64, w: 300, h: 235, fill: '#c9a227', grad: '#f4dd92', angle: 205 },
      { kind: 'triangle', x: 38, y: 766, w: 360, h: 300, fill: '#0f172a', grad: '#3a3a3a', angle: 25, opacity: 0.96 },
      { kind: 'triangle', x: 15, y: 730, w: 300, h: 235, fill: '#c9a227', grad: '#f4dd92', angle: 25 },
      { kind: 'rect', x: 561, y: 397, w: 1031, h: 702, stroke: '#c9a227', strokeWidth: 3 },
      { kind: 'rect', x: 561, y: 397, w: 1005, h: 676, stroke: '#dcc375', strokeWidth: 1 },
      { kind: 'seal', x: 185, y: 170, w: 130, fill: '#c9a227', stroke: '#10182b' },
      { kind: 'text', text: 'CERTIFICATE', x: 620, y: 150, w: 800, fontSize: 56, fontFamily: 'Playfair Display', fontWeight: '700', fill: '#1f2937', charSpacing: 160 },
      { kind: 'text', text: 'OF PARTICIPATION', x: 620, y: 206, w: 760, fontSize: 19, fontWeight: '700', fill: '#334155', charSpacing: 320 },
      { kind: 'text', text: 'This certificate is proudly presented to', x: 561, y: 298, w: 820, fontSize: 18, fill: '#6b7280' },
      { kind: 'field', key: 'name', x: 561, y: 368, w: 900, fontSize: 72, fontFamily: 'Segoe Script, Great Vibes, cursive', fill: '#c9a227' },
      { kind: 'line', x: 561, y: 424, w: 560, stroke: '#1f2937', strokeWidth: 1.5 },
      { kind: 'circle', x: 281, y: 424, w: 9, fill: '#1f2937' },
      { kind: 'circle', x: 841, y: 424, w: 9, fill: '#1f2937' },
      { kind: 'text', text: 'For participating in {{course}}\nheld by {{org}} on {{date}}.', x: 561, y: 486, w: 780, fontSize: 17, fill: '#475569', lineHeight: 1.5 },
      { kind: 'field', key: 'signature1', x: 700, y: 632, w: 300, fontSize: 34, fontFamily: 'Segoe Script, cursive', fill: '#1f2937' },
      { kind: 'line', x: 700, y: 672, w: 250, stroke: '#1f2937', strokeWidth: 1.5 },
      { kind: 'field', key: 'signer', x: 700, y: 694, w: 300, fontSize: 15, fontWeight: '700', fill: '#1f2937', charSpacing: 60 },
      { kind: 'text', text: 'Authorized Signature', x: 700, y: 720, w: 300, fontSize: 12, fill: '#94a3b8' },
    ] },
    { id: 'royal-gold', name: 'Royal Gold', cat: 'certificate', tags: 'certificate gold achievement royal seal portrait elegant dark', w: 794, h: 1123, bg: '#0f1a2b', accent: '#d8b24a', items: [
      { kind: 'rect', x: 397, y: 561, w: 726, h: 1055, stroke: '#d8b24a', strokeWidth: 2.5 },
      { kind: 'rect', x: 397, y: 561, w: 700, h: 1029, stroke: '#7a6326', strokeWidth: 1 },
      { kind: 'seal', x: 397, y: 178, w: 140, fill: '#d8b24a', stroke: '#0f1a2b' },
      { kind: 'text', text: 'CERTIFICATE', x: 397, y: 300, w: 660, fontSize: 44, fontFamily: 'Playfair Display', fontWeight: '700', fill: '#f5ecd6', charSpacing: 140 },
      { kind: 'text', text: 'OF ACHIEVEMENT', x: 397, y: 346, w: 620, fontSize: 16, fontWeight: '700', fill: '#d8b24a', charSpacing: 300 },
      { kind: 'text', text: 'Proudly presented to', x: 397, y: 440, w: 600, fontSize: 16, fill: '#aeb7c4' },
      { kind: 'field', key: 'name', x: 397, y: 512, w: 680, fontSize: 58, fontFamily: 'Segoe Script, Great Vibes, cursive', fill: '#d8b24a' },
      { kind: 'line', x: 397, y: 560, w: 380, stroke: '#7a6326', strokeWidth: 1.5 },
      { kind: 'text', text: 'in recognition of {{course}}\ncompleted on {{date}}.', x: 397, y: 640, w: 620, fontSize: 16, fill: '#cfd6df', lineHeight: 1.5 },
      { kind: 'field', key: 'signature1', x: 397, y: 884, w: 320, fontSize: 30, fontFamily: 'Segoe Script, cursive', fill: '#f5ecd6' },
      { kind: 'line', x: 397, y: 920, w: 240, stroke: '#7a6326', strokeWidth: 1.5 },
      { kind: 'field', key: 'signer', x: 397, y: 942, w: 340, fontSize: 14, fontWeight: '700', fill: '#f5ecd6', charSpacing: 60 },
      { kind: 'text', text: 'Authorized Signature', x: 397, y: 966, w: 340, fontSize: 12, fill: '#8c97a6' },
    ] },
    { id: 'wedding-ar', name: 'Wedding Invitation', cat: 'cards', tags: 'wedding invitation arabic floral green elegant rtl دعوة زفاف عقد قران', w: 794, h: 1123, bg: '#f3f6ee', accent: '#7e9168', items: [
      { kind: 'text', text: '🌿🤍🌿', x: 130, y: 110, w: 280, fontSize: 64, angle: -8, opacity: 0.9 },
      { kind: 'text', text: '🌿🤍🌿', x: 668, y: 1012, w: 300, fontSize: 80, angle: 8, opacity: 0.9 },
      { kind: 'text', text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', x: 397, y: 150, w: 640, fontSize: 30, fontFamily: 'Amiri', fontWeight: '700', fill: '#b79a4a', dir: 'rtl' },
      { kind: 'text', text: 'بَارَكَ اللَّهُ لَهُمَا وَجَمَعَ بَيْنَهُمَا فِي خَيْر', x: 397, y: 206, w: 680, fontSize: 19, fontFamily: 'Amiri', fill: '#6f8268', dir: 'rtl' },
      { kind: 'text', text: '&', x: 397, y: 322, w: 300, fontSize: 120, fontFamily: 'Playfair Display', fill: '#9fae8d', opacity: 0.8 },
      { kind: 'field', key: 'groom', x: 540, y: 322, w: 360, fontSize: 56, fontFamily: 'Amiri', fontWeight: '700', fill: '#3c4a36', dir: 'rtl' },
      { kind: 'field', key: 'bride', x: 254, y: 322, w: 360, fontSize: 56, fontFamily: 'Amiri', fontWeight: '700', fill: '#3c4a36', dir: 'rtl' },
      { kind: 'text', text: 'ندعوكم بكل وُدٍّ لحضور حفل عقد قراننا،\nفوجودكم يضفي بهجة وسعادة لا توصف\nعلى هذه المناسبة الخاصة', x: 397, y: 432, w: 600, fontSize: 16, fontFamily: 'Cairo', fill: '#5b6b52', dir: 'rtl', lineHeight: 1.7 },
      { kind: 'rect', x: 488, y: 562, w: 1.5, h: 72, fill: '#c2cbb4' },
      { kind: 'rect', x: 306, y: 562, w: 1.5, h: 72, fill: '#c2cbb4' },
      { kind: 'field', key: 'day', x: 588, y: 562, w: 170, fontSize: 18, fontFamily: 'Cairo', fill: '#3c4a36', dir: 'rtl' },
      { kind: 'field', key: 'year', x: 397, y: 534, w: 130, fontSize: 16, fontFamily: 'Cairo', fill: '#7a8b6e' },
      { kind: 'field', key: 'date', x: 397, y: 564, w: 130, fontSize: 40, fontFamily: 'Cairo', fontWeight: '700', fill: '#3c4a36' },
      { kind: 'field', key: 'month', x: 397, y: 596, w: 130, fontSize: 16, fontFamily: 'Cairo', fill: '#7a8b6e', dir: 'rtl' },
      { kind: 'field', key: 'time', x: 206, y: 562, w: 170, fontSize: 18, fontFamily: 'Cairo', fill: '#3c4a36', dir: 'rtl' },
      { kind: 'text', text: '📍', x: 397, y: 664, w: 80, fontSize: 22 },
      { kind: 'field', key: 'venue', x: 397, y: 696, w: 620, fontSize: 21, fontFamily: 'Cairo', fontWeight: '700', fill: '#3c4a36', dir: 'rtl' },
      { kind: 'field', key: 'venueSub', x: 397, y: 728, w: 620, fontSize: 15, fontFamily: 'Cairo', fill: '#6f7d63', dir: 'rtl' },
    ] },
    { id: 'classic', name: 'Classic Certificate', cat: 'certificate', tags: 'certificate award landscape formal border', w: 1123, h: 794, accent: '#4f46e5', items: [
      { kind: 'rect', x: 561, y: 397, w: 1051, h: 722, stroke: '#4f46e5', strokeWidth: 3 },
      { kind: 'rect', x: 561, y: 397, w: 1007, h: 678, stroke: '#c7d2fe', strokeWidth: 1 },
      { kind: 'text', text: 'CERTIFICATE', x: 561, y: 150, w: 800, fontSize: 30, fontWeight: '700', fill: '#0f172a' },
      { kind: 'text', text: 'OF ACHIEVEMENT', x: 561, y: 198, w: 800, fontSize: 18, fill: '#64748b' },
      { kind: 'text', text: 'This certificate is proudly presented to', x: 561, y: 300, w: 800, fontSize: 17, fill: '#64748b' },
      { kind: 'field', key: 'name', x: 561, y: 372, w: 800, fontSize: 46, fontFamily: 'Playfair Display', fontWeight: '700', fill: '#4f46e5' },
      { kind: 'line', x: 561, y: 418, w: 440, stroke: '#cbd5e1', strokeWidth: 2 },
      { kind: 'text', text: 'in recognition of outstanding performance and dedication.', x: 561, y: 480, w: 820, fontSize: 16, fill: '#475569' },
      { kind: 'field', key: 'date', x: 340, y: 648, w: 280, fontSize: 18 },
      { kind: 'line', x: 340, y: 624, w: 230, stroke: '#cbd5e1' },
      { kind: 'text', text: 'Date', x: 340, y: 676, w: 230, fontSize: 13, fill: '#94a3b8' },
      { kind: 'field', key: 'signature1', x: 782, y: 648, w: 280, fontSize: 18 },
      { kind: 'line', x: 782, y: 624, w: 230, stroke: '#cbd5e1' },
      { kind: 'text', text: 'Signature', x: 782, y: 676, w: 230, fontSize: 13, fill: '#94a3b8' },
    ] },
    { id: 'modern', name: 'Modern Certificate', cat: 'certificate', tags: 'certificate landscape band minimal', w: 1123, h: 794, accent: '#4f46e5', items: [
      { kind: 'rect', x: 140, y: 397, w: 280, h: 794, fill: '#4f46e5' },
      { kind: 'text', text: 'CERTIFICATE\nOF EXCELLENCE', x: 700, y: 175, w: 760, fontSize: 40, fontWeight: '700', fill: '#0f172a', align: 'left' },
      { kind: 'text', text: 'Proudly awarded to', x: 700, y: 305, w: 700, fontSize: 18, fill: '#64748b', align: 'left' },
      { kind: 'field', key: 'name', x: 700, y: 362, w: 760, fontSize: 44, fontFamily: 'Playfair Display', fontWeight: '700', fill: '#4f46e5', align: 'left' },
      { kind: 'line', x: 700, y: 408, w: 420, stroke: '#cbd5e1' },
      { kind: 'field', key: 'course', x: 700, y: 472, w: 760, fontSize: 20, fill: '#475569', align: 'left' },
      { kind: 'field', key: 'date', x: 560, y: 650, w: 240, fontSize: 16, align: 'left' },
      { kind: 'field', key: 'signature1', x: 880, y: 650, w: 240, fontSize: 16, align: 'left' },
    ] },
    { id: 'elegant', name: 'Elegant Portrait', cat: 'certificate', tags: 'certificate portrait gold appreciation elegant', w: 794, h: 1123, accent: '#b08d2e', items: [
      { kind: 'rect', x: 397, y: 561, w: 734, h: 1063, stroke: '#b08d2e', strokeWidth: 3 },
      { kind: 'text', text: '✦', x: 397, y: 165, w: 200, fontSize: 46, fill: '#b08d2e' },
      { kind: 'text', text: 'Certificate of Appreciation', x: 397, y: 255, w: 700, fontSize: 32, fontFamily: 'Playfair Display', fontWeight: '700', fill: '#0f172a' },
      { kind: 'text', text: 'This is presented to', x: 397, y: 345, w: 600, fontSize: 16, fill: '#64748b' },
      { kind: 'field', key: 'name', x: 397, y: 415, w: 700, fontSize: 40, fontFamily: 'Playfair Display', fill: '#b08d2e' },
      { kind: 'line', x: 397, y: 458, w: 360, stroke: '#e2cd9b' },
      { kind: 'text', text: 'for valuable contribution and commitment.', x: 397, y: 540, w: 660, fontSize: 15, fill: '#475569' },
      { kind: 'field', key: 'signature1', x: 397, y: 900, w: 300, fontSize: 18 },
      { kind: 'line', x: 397, y: 876, w: 240, stroke: '#cbd5e1' },
      { kind: 'text', text: 'Authorized Signature', x: 397, y: 928, w: 320, fontSize: 12, fill: '#94a3b8' },
    ] },
    { id: 'award', name: 'Award Square', cat: 'certificate', tags: 'award square trophy social', w: 1000, h: 1000, accent: '#4f46e5', items: [
      { kind: 'rect', x: 500, y: 500, w: 920, h: 920, stroke: '#4f46e5', strokeWidth: 4, rx: 18 },
      { kind: 'text', text: '🏆', x: 500, y: 240, w: 300, fontSize: 92 },
      { kind: 'text', text: 'AWARD', x: 500, y: 365, w: 760, fontSize: 48, fontWeight: '700', fill: '#0f172a' },
      { kind: 'text', text: 'presented to', x: 500, y: 440, w: 600, fontSize: 18, fill: '#64748b' },
      { kind: 'field', key: 'name', x: 500, y: 520, w: 800, fontSize: 46, fontFamily: 'Playfair Display', fontWeight: '700', fill: '#4f46e5' },
      { kind: 'line', x: 500, y: 575, w: 420, stroke: '#cbd5e1' },
      { kind: 'field', key: 'reason', x: 500, y: 650, w: 740, fontSize: 18, fill: '#475569' },
      { kind: 'field', key: 'date', x: 500, y: 820, w: 400, fontSize: 16 },
    ] },
    { id: 'card', name: 'Business Card', cat: 'business', tags: 'card business contact dark', w: 1050, h: 600, accent: '#0f172a', bg: '#0f172a', items: [
      { kind: 'field', key: 'name', x: 340, y: 230, w: 600, fontSize: 46, fontWeight: '700', fill: '#ffffff', align: 'left' },
      { kind: 'field', key: 'title', x: 340, y: 296, w: 600, fontSize: 20, fill: '#94a3b8', align: 'left' },
      { kind: 'line', x: 300, y: 342, w: 300, stroke: '#4f46e5', strokeWidth: 3 },
      { kind: 'field', key: 'phone', x: 340, y: 410, w: 600, fontSize: 18, fill: '#e2e8f0', align: 'left' },
      { kind: 'field', key: 'email', x: 340, y: 450, w: 600, fontSize: 18, fill: '#e2e8f0', align: 'left' },
    ] },
    { id: 'menu', name: 'Restaurant Menu', cat: 'menu', tags: 'menu restaurant food portrait list', w: 794, h: 1123, accent: '#b08d2e', items: [
      { kind: 'text', text: 'MENU', x: 397, y: 120, w: 700, fontSize: 54, fontFamily: 'Playfair Display', fontWeight: '700', fill: '#0f172a' },
      { kind: 'line', x: 397, y: 175, w: 200, stroke: '#b08d2e', strokeWidth: 3 },
      { kind: 'text', text: 'Starters', x: 397, y: 250, w: 700, fontSize: 26, fontWeight: '700', fill: '#b08d2e' },
      { kind: 'field', key: 'item1', x: 397, y: 312, w: 700, fontSize: 18 },
      { kind: 'field', key: 'item2', x: 397, y: 352, w: 700, fontSize: 18 },
      { kind: 'text', text: 'Mains', x: 397, y: 440, w: 700, fontSize: 26, fontWeight: '700', fill: '#b08d2e' },
      { kind: 'field', key: 'item3', x: 397, y: 502, w: 700, fontSize: 18 },
      { kind: 'field', key: 'item4', x: 397, y: 542, w: 700, fontSize: 18 },
      { kind: 'text', text: 'Desserts', x: 397, y: 630, w: 700, fontSize: 26, fontWeight: '700', fill: '#b08d2e' },
      { kind: 'field', key: 'item5', x: 397, y: 692, w: 700, fontSize: 18 },
    ] },

    // ---- Certificates ----
    { id: 'cert-gold', name: 'Royal Gold Certificate', cat: 'certificate', tags: 'certificate gold luxury landscape excellence ornate premium', w: 1123, h: 794, accent: '#b08d2e', items: [
      { kind: 'rect', x: 561, y: 397, w: 1075, h: 746, stroke: '#b08d2e', strokeWidth: 3 },
      { kind: 'rect', x: 561, y: 397, w: 1035, h: 706, stroke: '#d9c489', strokeWidth: 1 },
      { kind: 'text', text: '✦ ✦ ✦', x: 561, y: 110, w: 400, fontSize: 26, fill: '#b08d2e' },
      { kind: 'text', text: 'CERTIFICATE OF EXCELLENCE', x: 561, y: 185, w: 900, fontSize: 38, fontFamily: 'Playfair Display', fontWeight: '700', fill: '#1f2937' },
      { kind: 'line', x: 561, y: 232, w: 280, stroke: '#b08d2e', strokeWidth: 2 },
      { kind: 'text', text: 'This certificate is proudly presented to', x: 561, y: 300, w: 820, fontSize: 16, fill: '#6b7280' },
      { kind: 'field', key: 'name', x: 561, y: 372, w: 860, fontSize: 50, fontFamily: 'Playfair Display', fontWeight: '700', fill: '#b08d2e' },
      { kind: 'line', x: 561, y: 420, w: 500, stroke: '#e2cd9b', strokeWidth: 2 },
      { kind: 'text', text: 'in recognition of exceptional achievement and outstanding dedication.', x: 561, y: 480, w: 860, fontSize: 16, fill: '#475569' },
      { kind: 'field', key: 'date', x: 320, y: 660, w: 280, fontSize: 18 },
      { kind: 'line', x: 320, y: 636, w: 230, stroke: '#cbd5e1' },
      { kind: 'text', text: 'Date', x: 320, y: 688, w: 230, fontSize: 13, fill: '#94a3b8' },
      { kind: 'field', key: 'signature1', x: 802, y: 660, w: 280, fontSize: 18 },
      { kind: 'line', x: 802, y: 636, w: 230, stroke: '#cbd5e1' },
      { kind: 'text', text: 'Signature', x: 802, y: 688, w: 230, fontSize: 13, fill: '#94a3b8' },
    ] },
    { id: 'cert-corp', name: 'Corporate Certificate', cat: 'certificate', tags: 'certificate completion corporate blue training course professional', w: 1123, h: 794, accent: '#2251d3', items: [
      { kind: 'rect', x: 561, y: 70, w: 1123, h: 140, fill: '#2251d3' },
      { kind: 'text', text: 'CERTIFICATE OF COMPLETION', x: 561, y: 70, w: 1000, fontSize: 34, fontWeight: '700', fill: '#ffffff' },
      { kind: 'text', text: 'This is to certify that', x: 561, y: 250, w: 800, fontSize: 17, fill: '#64748b' },
      { kind: 'field', key: 'name', x: 561, y: 322, w: 860, fontSize: 46, fontFamily: 'Playfair Display', fontWeight: '700', fill: '#2251d3' },
      { kind: 'line', x: 561, y: 370, w: 460, stroke: '#cbd5e1' },
      { kind: 'text', text: 'has successfully completed the course', x: 561, y: 430, w: 800, fontSize: 16, fill: '#475569' },
      { kind: 'field', key: 'course', x: 561, y: 488, w: 860, fontSize: 26, fontWeight: '700', fill: '#0f172a' },
      { kind: 'field', key: 'date', x: 340, y: 656, w: 260, fontSize: 18 },
      { kind: 'line', x: 340, y: 632, w: 220, stroke: '#cbd5e1' },
      { kind: 'text', text: 'Date', x: 340, y: 684, w: 220, fontSize: 13, fill: '#94a3b8' },
      { kind: 'field', key: 'signature1', x: 782, y: 656, w: 260, fontSize: 18 },
      { kind: 'line', x: 782, y: 632, w: 220, stroke: '#cbd5e1' },
      { kind: 'text', text: 'Signature', x: 782, y: 684, w: 220, fontSize: 13, fill: '#94a3b8' },
      { kind: 'rect', x: 561, y: 764, w: 1123, h: 60, fill: '#2251d3' },
    ] },

    // ---- Social media ----
    { id: 'ig-quote', name: 'Instagram Quote', cat: 'social', tags: 'instagram post square quote social dark', w: 1080, h: 1080, accent: '#818cf8', bg: '#0f172a', items: [
      { kind: 'text', text: '“', x: 540, y: 250, w: 400, fontSize: 200, fontFamily: 'Playfair Display', fontWeight: '700', fill: '#312e81' },
      { kind: 'field', key: 'quote', x: 540, y: 520, w: 900, fontSize: 52, fontFamily: 'Playfair Display', fontWeight: '700', fill: '#ffffff' },
      { kind: 'line', x: 540, y: 720, w: 120, stroke: '#818cf8', strokeWidth: 3 },
      { kind: 'field', key: 'author', x: 540, y: 800, w: 760, fontSize: 28, fill: '#cbd5e1' },
      { kind: 'field', key: 'handle', x: 540, y: 980, w: 700, fontSize: 22, fill: '#818cf8' },
    ] },
    { id: 'ig-promo', name: 'Instagram Sale', cat: 'social', tags: 'instagram post square sale promo offer discount social', w: 1080, h: 1080, accent: '#fbbf24', bg: '#4f46e5', items: [
      { kind: 'text', text: 'SPECIAL OFFER', x: 540, y: 200, w: 800, fontSize: 34, fontWeight: '700', fill: '#c7d2fe' },
      { kind: 'field', key: 'headline', x: 540, y: 360, w: 940, fontSize: 84, fontWeight: '800', fill: '#ffffff' },
      { kind: 'field', key: 'discount', x: 540, y: 540, w: 940, fontSize: 120, fontWeight: '800', fill: '#fbbf24' },
      { kind: 'field', key: 'detail', x: 540, y: 716, w: 840, fontSize: 28, fill: '#e0e7ff' },
      { kind: 'rect', x: 540, y: 880, w: 380, h: 96, fill: '#fbbf24', rx: 48 },
      { kind: 'text', text: 'SHOP NOW', x: 540, y: 880, w: 360, fontSize: 32, fontWeight: '700', fill: '#1f2937' },
    ] },
    { id: 'ig-story', name: 'Instagram Story', cat: 'social', tags: 'instagram story vertical social announcement', w: 1080, h: 1920, accent: '#f472b6', bg: '#111827', items: [
      { kind: 'text', text: 'NEW POST', x: 540, y: 230, w: 800, fontSize: 30, fontWeight: '700', fill: '#f472b6' },
      { kind: 'field', key: 'title', x: 540, y: 560, w: 920, fontSize: 78, fontWeight: '800', fill: '#ffffff' },
      { kind: 'field', key: 'subtitle', x: 540, y: 800, w: 860, fontSize: 32, fill: '#d1d5db' },
      { kind: 'line', x: 540, y: 940, w: 160, stroke: '#f472b6', strokeWidth: 4 },
      { kind: 'rect', x: 540, y: 1640, w: 520, h: 110, fill: '#f472b6', rx: 55 },
      { kind: 'text', text: 'SWIPE UP', x: 540, y: 1640, w: 480, fontSize: 34, fontWeight: '700', fill: '#111827' },
      { kind: 'field', key: 'handle', x: 540, y: 1820, w: 700, fontSize: 26, fill: '#9ca3af' },
    ] },
    { id: 'li-post', name: 'LinkedIn Post', cat: 'social', tags: 'linkedin post banner professional update social', w: 1200, h: 627, accent: '#0a66c2', items: [
      { kind: 'rect', x: 80, y: 313, w: 160, h: 627, fill: '#0a66c2' },
      { kind: 'text', text: 'in', x: 80, y: 300, w: 140, fontSize: 76, fontWeight: '800', fill: '#ffffff' },
      { kind: 'field', key: 'headline', x: 720, y: 200, w: 860, fontSize: 48, fontWeight: '800', fill: '#0f172a', align: 'left' },
      { kind: 'field', key: 'subtitle', x: 720, y: 320, w: 860, fontSize: 26, fill: '#475569', align: 'left' },
      { kind: 'line', x: 480, y: 400, w: 380, stroke: '#0a66c2', strokeWidth: 3 },
      { kind: 'field', key: 'name', x: 720, y: 470, w: 860, fontSize: 24, fontWeight: '700', fill: '#0a66c2', align: 'left' },
      { kind: 'field', key: 'title', x: 720, y: 512, w: 860, fontSize: 20, fill: '#64748b', align: 'left' },
    ] },
    { id: 'li-hiring', name: 'LinkedIn — We’re Hiring', cat: 'social', tags: 'linkedin hiring job recruitment vacancy social', w: 1200, h: 627, accent: '#fde047', bg: '#0a66c2', items: [
      { kind: 'text', text: 'WE’RE HIRING', x: 600, y: 170, w: 1000, fontSize: 64, fontWeight: '800', fill: '#ffffff' },
      { kind: 'field', key: 'position', x: 600, y: 310, w: 1040, fontSize: 44, fontWeight: '700', fill: '#fde047' },
      { kind: 'field', key: 'location', x: 600, y: 400, w: 940, fontSize: 26, fill: '#dbeafe' },
      { kind: 'rect', x: 600, y: 510, w: 360, h: 84, fill: '#ffffff', rx: 42 },
      { kind: 'text', text: 'APPLY NOW', x: 600, y: 510, w: 340, fontSize: 28, fontWeight: '700', fill: '#0a66c2' },
    ] },

    // ---- Business ----
    { id: 'card-light', name: 'Business Card — Light', cat: 'business', tags: 'business card contact light professional name', w: 1050, h: 600, accent: '#4f46e5', items: [
      { kind: 'rect', x: 525, y: 16, w: 1050, h: 32, fill: '#4f46e5' },
      { kind: 'field', key: 'name', x: 360, y: 220, w: 600, fontSize: 46, fontWeight: '700', fill: '#0f172a', align: 'left' },
      { kind: 'field', key: 'title', x: 360, y: 286, w: 600, fontSize: 20, fill: '#6366f1', align: 'left' },
      { kind: 'line', x: 300, y: 332, w: 300, stroke: '#4f46e5', strokeWidth: 3 },
      { kind: 'field', key: 'phone', x: 360, y: 404, w: 600, fontSize: 18, fill: '#475569', align: 'left' },
      { kind: 'field', key: 'email', x: 360, y: 446, w: 600, fontSize: 18, fill: '#475569', align: 'left' },
      { kind: 'field', key: 'website', x: 360, y: 488, w: 600, fontSize: 18, fill: '#475569', align: 'left' },
    ] },

    // ---- Cards & invites ----
    { id: 'postcard', name: 'Postcard', cat: 'cards', tags: 'postcard travel greetings holiday vacation', w: 1500, h: 1050, accent: '#b45309', bg: '#fef3c7', items: [
      { kind: 'text', text: 'GREETINGS FROM', x: 750, y: 230, w: 1200, fontSize: 40, fontWeight: '700', fill: '#b45309' },
      { kind: 'field', key: 'place', x: 750, y: 420, w: 1300, fontSize: 130, fontFamily: 'Playfair Display', fontWeight: '700', fill: '#92400e' },
      { kind: 'line', x: 750, y: 560, w: 320, stroke: '#b45309', strokeWidth: 3 },
      { kind: 'field', key: 'message', x: 750, y: 740, w: 1120, fontSize: 30, fill: '#78350f' },
    ] },
    { id: 'greeting', name: 'Greeting Card', cat: 'cards', tags: 'greeting card birthday celebration congratulations wishes', w: 1500, h: 2100, accent: '#db2777', bg: '#fdf2f8', items: [
      { kind: 'text', text: '✿', x: 750, y: 360, w: 400, fontSize: 90, fill: '#db2777' },
      { kind: 'field', key: 'greeting', x: 750, y: 640, w: 1320, fontSize: 110, fontFamily: 'Playfair Display', fontWeight: '700', fill: '#be185d' },
      { kind: 'field', key: 'name', x: 750, y: 840, w: 1200, fontSize: 60, fill: '#db2777' },
      { kind: 'line', x: 750, y: 980, w: 360, stroke: '#f9a8d4', strokeWidth: 3 },
      { kind: 'field', key: 'message', x: 750, y: 1240, w: 1200, fontSize: 36, fill: '#831843' },
      { kind: 'text', text: '♥', x: 750, y: 1800, w: 300, fontSize: 60, fill: '#db2777' },
    ] },
    { id: 'invitation', name: 'Event Invitation', cat: 'cards', tags: 'invitation event wedding party celebration rsvp elegant', w: 1500, h: 2100, accent: '#d4af37', bg: '#0f172a', items: [
      { kind: 'rect', x: 750, y: 1050, w: 1400, h: 2000, stroke: '#d4af37', strokeWidth: 2 },
      { kind: 'text', text: 'YOU ARE INVITED', x: 750, y: 360, w: 1200, fontSize: 44, fill: '#d4af37' },
      { kind: 'field', key: 'title', x: 750, y: 620, w: 1300, fontSize: 100, fontFamily: 'Playfair Display', fontWeight: '700', fill: '#ffffff' },
      { kind: 'line', x: 750, y: 770, w: 320, stroke: '#d4af37', strokeWidth: 2 },
      { kind: 'text', text: 'Please join us to celebrate', x: 750, y: 900, w: 1100, fontSize: 32, fill: '#cbd5e1' },
      { kind: 'field', key: 'date', x: 750, y: 1120, w: 1100, fontSize: 52, fontWeight: '600', fill: '#d4af37' },
      { kind: 'field', key: 'time', x: 750, y: 1230, w: 1100, fontSize: 34, fill: '#e2e8f0' },
      { kind: 'field', key: 'venue', x: 750, y: 1500, w: 1100, fontSize: 34, fill: '#e2e8f0' },
      { kind: 'field', key: 'rsvp', x: 750, y: 1820, w: 1000, fontSize: 28, fill: '#94a3b8' },
    ] },

    // ---- Signage ----
    { id: 'table-tent', name: 'Table Tent', cat: 'signage', tags: 'table tent restaurant special promo stand sign', w: 1050, h: 1500, accent: '#16a34a', items: [
      { kind: 'rect', x: 525, y: 130, w: 1050, h: 260, fill: '#16a34a' },
      { kind: 'field', key: 'title', x: 525, y: 130, w: 900, fontSize: 64, fontWeight: '800', fill: '#ffffff' },
      { kind: 'text', text: 'TODAY’S SPECIAL', x: 525, y: 520, w: 900, fontSize: 30, fontWeight: '700', fill: '#16a34a' },
      { kind: 'field', key: 'item', x: 525, y: 660, w: 920, fontSize: 56, fontWeight: '700', fill: '#0f172a' },
      { kind: 'field', key: 'description', x: 525, y: 790, w: 880, fontSize: 26, fill: '#475569' },
      { kind: 'field', key: 'price', x: 525, y: 990, w: 700, fontSize: 90, fontWeight: '800', fill: '#16a34a' },
      { kind: 'line', x: 525, y: 1130, w: 320, stroke: '#bbf7d0', strokeWidth: 3 },
      { kind: 'field', key: 'note', x: 525, y: 1290, w: 900, fontSize: 24, fill: '#64748b' },
    ] },
    { id: 'poster', name: 'Event Poster', cat: 'signage', tags: 'poster event concert show announcement large signage', w: 1587, h: 2245, accent: '#f59e0b', bg: '#111827', items: [
      { kind: 'text', text: 'PRESENTS', x: 793, y: 280, w: 1200, fontSize: 40, fontWeight: '700', fill: '#f59e0b' },
      { kind: 'field', key: 'title', x: 793, y: 640, w: 1460, fontSize: 150, fontFamily: 'Playfair Display', fontWeight: '800', fill: '#ffffff' },
      { kind: 'line', x: 793, y: 860, w: 400, stroke: '#f59e0b', strokeWidth: 4 },
      { kind: 'field', key: 'subtitle', x: 793, y: 1020, w: 1300, fontSize: 50, fill: '#e5e7eb' },
      { kind: 'field', key: 'date', x: 793, y: 1520, w: 1200, fontSize: 70, fontWeight: '700', fill: '#f59e0b' },
      { kind: 'field', key: 'venue', x: 793, y: 1660, w: 1200, fontSize: 40, fill: '#d1d5db' },
      { kind: 'rect', x: 793, y: 1960, w: 560, h: 130, fill: '#f59e0b', rx: 65 },
      { kind: 'text', text: 'GET TICKETS', x: 793, y: 1960, w: 540, fontSize: 44, fontWeight: '700', fill: '#111827' },
    ] },

    // ---- Documents ----
    { id: 'contract', name: 'Service Contract', cat: 'document', tags: 'contract agreement legal document terms parties signature', w: 794, h: 1123, accent: '#0f172a', items: [
      { kind: 'text', text: 'SERVICE AGREEMENT', x: 397, y: 90, w: 700, fontSize: 30, fontWeight: '700', fill: '#0f172a' },
      { kind: 'line', x: 397, y: 130, w: 700, stroke: '#0f172a', strokeWidth: 2 },
      { kind: 'text', text: 'This Agreement is entered into between:', x: 397, y: 200, w: 700, fontSize: 15, fill: '#475569', align: 'left' },
      { kind: 'field', key: 'party1', x: 397, y: 250, w: 700, fontSize: 17, fontWeight: '700', fill: '#0f172a', align: 'left' },
      { kind: 'text', text: 'and', x: 397, y: 292, w: 700, fontSize: 14, fill: '#64748b', align: 'left' },
      { kind: 'field', key: 'party2', x: 397, y: 332, w: 700, fontSize: 17, fontWeight: '700', fill: '#0f172a', align: 'left' },
      { kind: 'text', text: '1. Scope of Work', x: 397, y: 420, w: 700, fontSize: 16, fontWeight: '700', fill: '#0f172a', align: 'left' },
      { kind: 'field', key: 'scope', x: 397, y: 484, w: 700, fontSize: 14, fill: '#475569', align: 'left' },
      { kind: 'text', text: '2. Term & Payment', x: 397, y: 580, w: 700, fontSize: 16, fontWeight: '700', fill: '#0f172a', align: 'left' },
      { kind: 'field', key: 'terms', x: 397, y: 644, w: 700, fontSize: 14, fill: '#475569', align: 'left' },
      { kind: 'line', x: 230, y: 980, w: 280, stroke: '#cbd5e1' },
      { kind: 'text', text: 'Client Signature', x: 230, y: 1004, w: 280, fontSize: 12, fill: '#94a3b8' },
      { kind: 'line', x: 560, y: 980, w: 280, stroke: '#cbd5e1' },
      { kind: 'text', text: 'Provider Signature', x: 560, y: 1004, w: 280, fontSize: 12, fill: '#94a3b8' },
    ] },
    { id: 'invoice', name: 'Invoice / Bill', cat: 'document', tags: 'invoice bill receipt payment statement document accounting', w: 794, h: 1123, accent: '#4f46e5', items: [
      { kind: 'text', text: 'INVOICE', x: 230, y: 90, w: 360, fontSize: 44, fontWeight: '800', fill: '#4f46e5', align: 'left' },
      { kind: 'field', key: 'invoice_no', x: 600, y: 90, w: 320, fontSize: 18, fill: '#64748b', align: 'right' },
      { kind: 'line', x: 397, y: 150, w: 714, stroke: '#e2e8f0', strokeWidth: 2 },
      { kind: 'text', text: 'BILL TO', x: 230, y: 210, w: 300, fontSize: 13, fontWeight: '700', fill: '#94a3b8', align: 'left' },
      { kind: 'field', key: 'client', x: 230, y: 252, w: 360, fontSize: 20, fontWeight: '700', fill: '#0f172a', align: 'left' },
      { kind: 'field', key: 'client_address', x: 230, y: 294, w: 360, fontSize: 15, fill: '#475569', align: 'left' },
      { kind: 'field', key: 'date', x: 600, y: 252, w: 320, fontSize: 16, fill: '#475569', align: 'right' },
      { kind: 'rect', x: 397, y: 420, w: 714, h: 46, fill: '#4f46e5' },
      { kind: 'text', text: 'DESCRIPTION', x: 235, y: 420, w: 300, fontSize: 14, fontWeight: '700', fill: '#ffffff', align: 'left' },
      { kind: 'text', text: 'AMOUNT', x: 600, y: 420, w: 200, fontSize: 14, fontWeight: '700', fill: '#ffffff', align: 'right' },
      { kind: 'field', key: 'item1', x: 235, y: 490, w: 360, fontSize: 15, fill: '#0f172a', align: 'left' },
      { kind: 'field', key: 'amount1', x: 600, y: 490, w: 200, fontSize: 15, fill: '#0f172a', align: 'right' },
      { kind: 'field', key: 'item2', x: 235, y: 540, w: 360, fontSize: 15, fill: '#0f172a', align: 'left' },
      { kind: 'field', key: 'amount2', x: 600, y: 540, w: 200, fontSize: 15, fill: '#0f172a', align: 'right' },
      { kind: 'field', key: 'item3', x: 235, y: 590, w: 360, fontSize: 15, fill: '#0f172a', align: 'left' },
      { kind: 'field', key: 'amount3', x: 600, y: 590, w: 200, fontSize: 15, fill: '#0f172a', align: 'right' },
      { kind: 'line', x: 397, y: 650, w: 714, stroke: '#e2e8f0' },
      { kind: 'text', text: 'TOTAL', x: 500, y: 710, w: 200, fontSize: 18, fontWeight: '700', fill: '#0f172a', align: 'right' },
      { kind: 'field', key: 'total', x: 650, y: 710, w: 180, fontSize: 24, fontWeight: '800', fill: '#4f46e5', align: 'right' },
      { kind: 'text', text: 'Thank you for your business!', x: 397, y: 1000, w: 700, fontSize: 16, fill: '#64748b' },
    ] },
  ];

  tplCat = signal<string>('all');
  tplThumbs = signal<Record<string, string>>({});
  private tplRendered = false;
  private _tplFx = effect(() => { if (this.activePanel() === 'templates') this.ensureTplThumbs(); });
  private async ensureTplThumbs(): Promise<void> {
    if (this.tplRendered) return;
    this.tplRendered = true;
    for (const t of this.designTemplates) {
      try {
        const url = await this.svc.renderTemplatePreview(t.w, t.h, t.items, t.bg ?? '#ffffff');
        this.tplThumbs.update((m) => ({ ...m, [t.id]: url }));
      } catch { /* skip a failed preview */ }
    }
  }
  readonly tplCategories: TplCategory[] = [
    { id: 'all', label: 'All' },
    { id: 'certificate', label: 'Certificates' },
    { id: 'social', label: 'Social Media' },
    { id: 'business', label: 'Business' },
    { id: 'cards', label: 'Cards & Invites' },
    { id: 'signage', label: 'Signage' },
    { id: 'document', label: 'Documents' },
    { id: 'menu', label: 'Menus' },
  ];
  setTplCat(c: string): void { this.tplCat.set(c); }

  applyTemplate(t: DesignTemplate): void {
    this.width = t.w; this.height = t.h; this.customW = t.w; this.customH = t.h;
    this.svc.applyTemplate(t.w, t.h, t.items, t.bg ?? '#ffffff');
    setTimeout(() => {
      this.drawRulers();
      this.zoomToFit(1);
      // Smart: a ready-made layout instantly adopts the user's brand (logo, colors, fonts).
      if (this.brand.kit().has) this.applyBrandKit(true);
    }, 0);
  }

  // Elements
  elementsTab = signal<'shapes' | 'decor' | 'icons' | 'badges'>('shapes');
  shapeFill = '#c7d2fe';
  shapeStroke = '#4f46e5';
  shapeOutline = false;
  shapeStrokeW = 2;
  shapeOpacity = 100;
  shapeSwatches = ['#4f46e5', '#0f172a', '#b08d2e', '#10b981', '#ef4444', '#f59e0b', '#0ea5e9', '#ec4899'];
  shapePresets = [
    { name: 'Soft', fill: '#c7d2fe', stroke: '#4f46e5', outline: false, w: 2, op: 100 },
    { name: 'Solid', fill: '#4f46e5', stroke: '#4f46e5', outline: false, w: 0, op: 100 },
    { name: 'Outline', fill: '#ffffff', stroke: '#4f46e5', outline: true, w: 2, op: 100 },
    { name: 'Gold', fill: '#f4e4bc', stroke: '#b08d2e', outline: false, w: 2, op: 100 },
    { name: 'Ink', fill: '#0f172a', stroke: '#0f172a', outline: false, w: 0, op: 100 },
    { name: 'Glass', fill: '#4f46e5', stroke: '#4f46e5', outline: false, w: 1, op: 20 },
  ];
  icons = [
    { c: '⭐', n: 'star favourite' }, { c: '✔️', n: 'check tick done' }, { c: '❤️', n: 'heart love' }, { c: '★', n: 'star' },
    { c: '✦', n: 'sparkle star' }, { c: '☀️', n: 'sun weather' }, { c: '☁️', n: 'cloud weather' }, { c: '✈️', n: 'plane travel' },
    { c: '📌', n: 'pin location' }, { c: '🔔', n: 'bell notification' }, { c: '💡', n: 'idea bulb light' }, { c: '🎯', n: 'target goal aim' },
    { c: '📈', n: 'chart growth graph' }, { c: '🧩', n: 'puzzle piece' }, { c: '🔑', n: 'key access' }, { c: '🏷️', n: 'tag label price' },
    { c: '✉️', n: 'mail email envelope' }, { c: '📞', n: 'phone call contact' }, { c: '🌐', n: 'globe web world' }, { c: '⏰', n: 'clock time' },
    { c: '📅', n: 'calendar date' }, { c: '🔒', n: 'lock secure private' }, { c: '⚙️', n: 'gear settings cog' }, { c: '➕', n: 'plus add new' },
  ];
  badges = [
    { c: '🏆', n: 'trophy award winner' }, { c: '🥇', n: 'gold medal first place' }, { c: '🎖️', n: 'medal military honour' }, { c: '🏅', n: 'medal sports' },
    { c: '🎗️', n: 'ribbon awareness' }, { c: '👑', n: 'crown king royal' }, { c: '💎', n: 'diamond gem premium' }, { c: '✅', n: 'verified check approved' },
    { c: '🛡️', n: 'shield secure protect' }, { c: '📜', n: 'scroll certificate diploma' }, { c: '🎓', n: 'graduation degree cap' }, { c: '🌟', n: 'star glowing shine' },
    { c: '🏵️', n: 'rosette seal award' }, { c: '💯', n: 'hundred score perfect' }, { c: '🔰', n: 'beginner badge japanese' }, { c: '⚜️', n: 'fleur de lis ornament' },
  ];
  arabicShowcase = [
    { family: 'Diwani Simple Outline', sample: 'شهادة' },
    { family: 'Aref Graffiti', sample: 'تقدير' },
    { family: 'Aldhabi', sample: 'إنجاز' },
    { family: 'DecoType Thuluth', sample: 'بسم الله' },
    { family: 'B Titr', sample: 'عنوان' },
    { family: 'Abdo Salem', sample: 'نص عربي' },
  ];

  // ---- Text styles, phrases & effects ----
  textStyles: { label: string; text: string; opts: TextStyleOpts }[] = [
    { label: 'Display', text: 'Display', opts: { fontSize: 64, fontWeight: '800', fontFamily: 'Playfair Display' } },
    { label: 'Title', text: 'Title', opts: { fontSize: 48, fontWeight: '700', fontFamily: 'Playfair Display' } },
    { label: 'Subtitle', text: 'Subtitle', opts: { fontSize: 24, fill: '#475569' } },
    { label: 'Body', text: 'Body text goes here', opts: { fontSize: 16, fill: '#334155' } },
    { label: 'Quote', text: '“An inspiring quote”', opts: { fontSize: 26, fontStyle: 'italic', fontFamily: 'Playfair Display', fill: '#475569' } },
    { label: 'OVERLINE', text: 'OVERLINE', opts: { fontSize: 13, fontWeight: '700', charSpacing: 300, fill: '#64748b' } },
    { label: 'Badge', text: 'WINNER', opts: { fontSize: 16, fontWeight: '800', charSpacing: 120, fill: '#4f46e5' } },
    { label: 'Outline', text: 'OUTLINE', opts: { fontSize: 44, fontWeight: '800', fill: '#ffffff', outline: true, outlineColor: '#0f172a' } },
    { label: 'Shadow', text: 'Shadow', opts: { fontSize: 44, fontWeight: '700', fontFamily: 'Playfair Display', shadow: true } },
  ];
  certPhrases: { text: string; opts: TextStyleOpts }[] = [
    { text: 'CERTIFICATE OF ACHIEVEMENT', opts: { fontSize: 40, fontWeight: '700', fontFamily: 'Playfair Display', charSpacing: 40 } },
    { text: 'Certificate of Completion', opts: { fontSize: 40, fontWeight: '700', fontFamily: 'Playfair Display' } },
    { text: 'This is proudly presented to', opts: { fontSize: 18, fill: '#64748b' } },
    { text: 'This is to certify that', opts: { fontSize: 18, fill: '#64748b' } },
    { text: 'in recognition of outstanding performance', opts: { fontSize: 16, fill: '#475569' } },
    { text: 'has successfully completed', opts: { fontSize: 16, fill: '#475569' } },
    { text: 'Date', opts: { fontSize: 13, fill: '#94a3b8' } },
    { text: 'Authorized Signature', opts: { fontSize: 13, fill: '#94a3b8' } },
  ];
  highlightSwatches = ['#fde68a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#e9d5ff', ''];
  txtSecOpen = signal<Record<string, boolean>>({ styles: true, phrases: false, fonts: false });
  readonly isTextSelected = computed(() => { this.svc.revision(); return this.svc.hasTextSelected(); });
  readonly textFx = computed(() => { this.svc.revision(); return this.svc.getTextFx(); });
  pairFonts = [
    { label: 'Classic', head: 'Playfair Display', body: 'Inter' },
    { label: 'Modern', head: 'Montserrat', body: 'Inter' },
    { label: 'Editorial', head: 'Lora', body: 'Montserrat' },
    { label: 'Elegant', head: 'Playfair Display', body: 'Lora' },
  ];

  // QR
  qrType: 'url' | 'text' | 'email' | 'phone' | 'sms' | 'wifi' | 'vcard' = 'url';
  qrTypes = [
    { k: 'url', label: 'Link', icon: 'link' },
    { k: 'text', label: 'Text', icon: 'notes' },
    { k: 'email', label: 'Email', icon: 'mail' },
    { k: 'phone', label: 'Phone', icon: 'call' },
    { k: 'sms', label: 'SMS', icon: 'sms' },
    { k: 'wifi', label: 'Wi-Fi', icon: 'wifi' },
    { k: 'vcard', label: 'Contact', icon: 'contact_page' },
  ];
  qrValue = 'https://certifada.app';
  qrEmail = ''; qrEmailSub = ''; qrEmailBody = '';
  qrPhone = '';
  qrSmsNum = ''; qrSmsMsg = '';
  qrWifiSsid = ''; qrWifiPass = ''; qrWifiEnc: 'WPA' | 'WEP' | 'nopass' = 'WPA'; qrWifiHidden = false;
  qrVcName = ''; qrVcOrg = ''; qrVcTitle = ''; qrVcPhone = ''; qrVcEmail = ''; qrVcUrl = '';
  qrSize = 280;
  qrFg = '#0f172a'; qrFg2 = '#4f46e5'; qrBg = '#ffffff';
  qrMargin = 2;
  qrTransparent = false;
  qrGradient = false;
  qrEyeColor = '';
  qrStyle: 'square' | 'rounded' | 'dots' = 'square';
  qrEcc: 'L' | 'M' | 'Q' | 'H' = 'M';
  qrEyeStyle: 'auto' | 'square' | 'rounded' | 'circle' = 'auto';
  qrFrame = false; qrFrameText = 'SCAN ME'; qrFrameColor = '#0f172a';
  qrLogo: string | null = null;
  qrPreview = signal<string>('');
  qrPresets = [
    { label: 'Classic', fg: '#0f172a', bg: '#ffffff', style: 'square', grad: false, eye: '', eyeStyle: 'auto' },
    { label: 'Rounded', fg: '#0f172a', bg: '#ffffff', style: 'rounded', grad: false, eye: '', eyeStyle: 'rounded' },
    { label: 'Dots', fg: '#4f46e5', bg: '#ffffff', style: 'dots', grad: false, eye: '', eyeStyle: 'circle' },
    { label: 'Brand', fg: '#4f46e5', bg: '#ffffff', style: 'rounded', grad: true, eye: '#0f172a', eyeStyle: 'rounded' },
    { label: 'Midnight', fg: '#e2e8f0', bg: '#0f172a', style: 'square', grad: false, eye: '#6366f1', eyeStyle: 'square' },
    { label: 'Framed', fg: '#0f172a', bg: '#ffffff', style: 'rounded', grad: false, eye: '', eyeStyle: 'rounded' },
  ];
  private _qrPreviewFx = effect(() => { if (this.activePanel() === 'qr') this.updateQrPreview(); });

  // Backgrounds
  bgSolids = ['#ffffff', '#f8fafc', '#0f172a', '#1e293b', '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#fef3c7'];
  bgGradients = [
    ['#4f46e5', '#06b6d4'], ['#0f172a', '#334155'], ['#f59e0b', '#ef4444'],
    ['#10b981', '#0ea5e9'], ['#6366f1', '#ec4899'], ['#111827', '#4f46e5'],
    ['#fda4af', '#fb7185'], ['#a78bfa', '#7c3aed'], ['#22d3ee', '#0284c7'],
    ['#fcd34d', '#f97316'], ['#34d399', '#059669'], ['#f0abfc', '#c026d3'],
  ];
  bgGradC1 = '#4f46e5';
  bgGradC2 = '#06b6d4';
  bgGradMid = '#ec4899';
  bgGradUseMid = false;
  bgGradAngle = 135;
  bgGradRadial = false;
  gradDirs = [0, 45, 90, 135, 180, 225, 270, 315];
  bgPatternFg = '#cbd5e1';
  bgPatternBg = '#ffffff';
  bgPatternScale = 40;
  bgPatterns = ['dots', 'grid', 'lines', 'diagonal', 'cross', 'chevron', 'triangles', 'plus', 'confetti', 'waves'];
  bgHasImage = computed<boolean>(() => { this.svc.revision(); return this.svc.hasBackgroundImage(); });
  currentBg = signal<any>(null);
  myBgs = signal<any[]>(this.loadMyBgs());

  // Border frames sub-tab
  bgTab = signal<'bg' | 'frames'>('bg');
  frames = FRAME_KINDS;
  frameColors = ['#b8860b', '#d4af37', '#0f172a', '#4f46e5', '#0ea5e9', '#047857', '#b91c1c', '#9333ea'];
  frameColor = '#b8860b';
  frameWeight = 1;
  frameInset = 0.04;
  frameOpacity = 100;
  frameBehind = false;
  frameCat = signal<'all' | 'lines' | 'corners' | 'decorative'>('all');
  private frameCatMap: Record<string, 'lines' | 'corners' | 'decorative'> = {
    thin: 'lines', double: 'lines', triple: 'lines', rounded: 'lines', roundedDouble: 'lines', dashed: 'lines', dashedDouble: 'lines', dotted: 'lines', rope: 'lines', groove: 'lines', pinstripe: 'lines', inlineDouble: 'lines', mat: 'lines', ribbon: 'lines', bold: 'lines', hairline: 'lines',
    ticks: 'corners', beaded: 'corners', rings: 'corners', brackets: 'corners', bracketsBold: 'corners', studio: 'corners', cornerDots: 'corners', cornerPlus: 'corners', cornerArc: 'corners', diamonds: 'corners', stars: 'corners', fan: 'corners',
    decoBars: 'decorative', deco: 'decorative', scalloped: 'decorative', lace: 'decorative', greek: 'decorative', notched: 'decorative', ornate: 'decorative', ornateDouble: 'decorative', royal: 'decorative',
  };
  readonly framesView = computed(() => { const c = this.frameCat(); return c === 'all' ? this.frames : this.frames.filter((f) => this.frameCatMap[f] === c); });
  hasFrame = computed<boolean>(() => { this.svc.revision(); return this.svc.hasFrame(); });
  private frameOpts() { return { weight: +this.frameWeight, inset: +this.frameInset, opacity: +this.frameOpacity / 100, behind: this.frameBehind }; }
  applyFrame(kind: string): void { this.svc.addBorderFrame(kind, this.frameColor, this.frameOpts()).catch(() => this.flash('Could not add frame.', false)); }
  removeFrame(): void { this.svc.removeFrame(); }
  recolorFrame(): void { const f = this.svc.activeFrameKind?.(); if (f) this.applyFrame(f); }
  framePreview(kind: string): string {
    return `url("data:image/svg+xml,${encodeURIComponent(frameSvg(kind, 132, 96, this.frameColor, +this.frameWeight, +this.frameInset))}") center/90% no-repeat`;
  }

  // Drawing
  brushType = signal<BrushType>('pencil');
  brushColor = '#0f172a';
  brushSize = 6;
  brushOpacity = 100;
  brushSmooth = 4;
  brushGlow = false;
  brushPalette = ['#0f172a', '#ffffff', '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
  brushPresets = [
    { label: 'Pen', icon: 'edit', type: 'pencil' as BrushType, size: 3, op: 100, glow: false, smooth: 5 },
    { label: 'Marker', icon: 'brush', type: 'pencil' as BrushType, size: 14, op: 100, glow: false, smooth: 2 },
    { label: 'Highlighter', icon: 'border_color', type: 'pencil' as BrushType, size: 22, op: 35, glow: false, smooth: 0 },
    { label: 'Spray', icon: 'blur_on', type: 'spray' as BrushType, size: 18, op: 90, glow: false, smooth: 0 },
    { label: 'Crayon', icon: 'gesture', type: 'circle' as BrushType, size: 10, op: 80, glow: false, smooth: 0 },
    { label: 'Neon', icon: 'auto_awesome', type: 'pencil' as BrushType, size: 6, op: 100, glow: true, smooth: 4 },
  ];

  // Variables
  stdVars = ['Name', 'Email', 'Phone', 'Address', 'City', 'Sex', 'Country'];
  varGroups: { label: string; vars: string[] }[] = [
    { label: 'Recipient', vars: ['Name', 'Email', 'Phone', 'JobTitle', 'Address', 'City', 'Country'] },
    { label: 'Certificate', vars: ['CourseName', 'CertificateID', 'Grade', 'Score', 'Credits', 'IssueDate', 'ExpiryDate'] },
    { label: 'Organization', vars: ['OrgName', 'Issuer', 'Department', 'Website'] },
    { label: 'Date & time', vars: ['Date', 'Year', 'Month'] },
  ];
  signatures = signal<{ label: string; key: string; role: string }[]>([
    { label: '1st Signature', key: 'signature1', role: 'Authorized Signature' },
    { label: '2nd Signature', key: 'signature2', role: 'Authorized Signature' },
  ]);
  customVar = '';
  previewOn = signal(false);
  sampleData: Record<string, string> = this.loadSample();
  sampleText = '';
  records = signal<Record<string, string>[]>([]);
  recordIdx = signal(0);

  // Brand
  brandPalette = ['#2251d3', '#10B981', '#F59E0B', '#0f172a', '#ef4444', '#6366f1'];

  // Table
  // ---- Table builder ----
  tableStyleKey = 'striped';
  tHeaderColor = '#4f46e5';
  tHeaderText = '#ffffff';
  tZebra = true;
  tZebraColor = '#eef2ff';
  tBorderColor = '#e2e8f0';
  tBorderWidth = 1;
  tCellText = '#0f172a';
  tFontSize = 14;
  tAlign: 'left' | 'center' | 'right' = 'left';
  tShowHeader = true;
  tHeaderCol = false;
  tHeaders = '';
  tablePaste = '';
  tAdvanced = false;
  gridR = 0;
  gridC = 0;
  readonly tGridRows = [1, 2, 3, 4, 5, 6];
  readonly tGridCols = [1, 2, 3, 4, 5, 6, 7, 8];
  tableStyles = [
    { key: 'striped', label: 'Striped', o: { headerFill: '#4f46e5', headerText: '#ffffff', zebra: true, zebraColor: '#eef2ff', borderColor: '#e2e8f0', borderWidth: 1, cellText: '#0f172a' } },
    { key: 'simple', label: 'Simple', o: { headerFill: '#f1f5f9', headerText: '#0f172a', zebra: false, zebraColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1, cellText: '#0f172a' } },
    { key: 'bordered', label: 'Bordered', o: { headerFill: '#0f172a', headerText: '#ffffff', zebra: false, zebraColor: '#f8fafc', borderColor: '#0f172a', borderWidth: 2, cellText: '#0f172a' } },
    { key: 'modern', label: 'Modern', o: { headerFill: '#4f46e5', headerText: '#ffffff', zebra: true, zebraColor: '#f8fafc', borderColor: '#ffffff', borderWidth: 0, cellText: '#334155' } },
    { key: 'elegant', label: 'Elegant', o: { headerFill: '#b08d2e', headerText: '#ffffff', zebra: true, zebraColor: '#faf6ec', borderColor: '#e2cd9b', borderWidth: 1, cellText: '#3f3a2a' } },
    { key: 'dark', label: 'Dark', o: { headerFill: '#111827', headerText: '#ffffff', zebra: true, zebraColor: '#1f2937', borderColor: '#374151', borderWidth: 1, cellText: '#e5e7eb' } },
    { key: 'mint', label: 'Mint', o: { headerFill: '#10b981', headerText: '#ffffff', zebra: true, zebraColor: '#ecfdf5', borderColor: '#d1fae5', borderWidth: 1, cellText: '#064e3b' } },
  ];
  tableBlueprints = [
    { key: 'pricing', label: 'Pricing', icon: 'sell', rows: 4, cols: 3, headers: ['Plan', 'Features', 'Price'] },
    { key: 'schedule', label: 'Schedule', icon: 'event', rows: 5, cols: 3, headers: ['Time', 'Session', 'Room'] },
    { key: 'roster', label: 'Roster', icon: 'groups', rows: 6, cols: 3, headers: ['Name', 'Role', 'Status'] },
    { key: 'invoice', label: 'Invoice', icon: 'receipt_long', rows: 5, cols: 4, headers: ['Item', 'Qty', 'Price', 'Total'] },
    { key: 'results', label: 'Results', icon: 'leaderboard', rows: 5, cols: 3, headers: ['Rank', 'Name', 'Score'] },
  ];
  readonly isTableSelected = computed(() => { this.svc.revision(); return this.svc.hasActiveTable(); });
  /** Live spec of the selected table (drives the panel grid + dynamic controls). */
  readonly tableView = computed<TableSpec | null>(() => { this.svc.revision(); return this.svc.activeTableSpec(); });
  tableRowsPaste = '';

  // View aids
  readonly RULER = 24;
  gridSize = 20;
  showRuler = signal(true);
  showGrid = signal(true);
  snap = signal(false);
  guidesOn = signal(true);
  viewMenu = signal(false);
  gridDots = signal(false);
  showMargins = signal(false);
  showThirds = signal(false);
  layersDock = signal(localStorage.getItem('cf-layers-dock') === '1');
  toggleLayersDock(): void { const v = !this.layersDock(); this.layersDock.set(v); localStorage.setItem('cf-layers-dock', v ? '1' : '0'); }

  // Smart size dropdown
  sizeMenu = signal(false);
  currentSizeLabel(): string { const p = this.presets.find((x) => x.w === this.width && x.h === this.height); return p ? p.label : 'Custom size'; }
  sizeIcon(p: { w: number; h: number }): string { return p.w === p.h ? 'crop_square' : (p.w > p.h ? 'crop_landscape' : 'crop_portrait'); }

  // History timeline
  historyOpen = signal(false);
  historyTab = signal<'steps' | 'versions'>('steps');
  readonly historyView = computed(() => this.svc.history().map((h, i) => ({ ...h, i })).reverse());
  revertHistory(i: number): void { this.svc.revertTo(i); }

  // Saved canvas versions (manual snapshots, persisted per template)
  versions = signal<CanvasVersion[]>([]);
  private vseq = Date.now();
  /** Canvas revision captured at the last save/revert — drives the "unsaved" indicator. */
  lastSavedRev = signal(-1);
  readonly versionsDirty = computed(() => this.svc.revision() !== this.lastSavedRev());
  /** Pending inline confirmation for a version action. */
  verConfirm = signal<{ id: number; action: 'revert' | 'delete' } | null>(null);
  askVer(id: number, action: 'revert' | 'delete'): void { this.verConfirm.set({ id, action }); }

  private versionsKey(): string { return 'cf-versions:' + (this.route.snapshot.paramMap.get('id') || 'draft'); }
  private loadVersions(): CanvasVersion[] { try { return JSON.parse(localStorage.getItem(this.versionsKey()) || '[]'); } catch { return []; } }
  private persistVersions(): void { try { localStorage.setItem(this.versionsKey(), JSON.stringify(this.versions())); } catch { /* storage full */ } }
  saveVersion(): void {
    const c = this.svc.getCanvas();
    let thumb = '';
    try { thumb = c.toDataURL({ format: 'png', multiplier: 0.16 }); } catch { /* ignore */ }
    const n = c.getObjects().length;
    const v: CanvasVersion = {
      id: ++this.vseq, name: 'Version ' + (this.versions().length + 1), at: Date.now(),
      json: this.svc.toJSON(), thumb, meta: n + (n === 1 ? ' element' : ' elements') + ' · ' + this.width + '×' + this.height,
    };
    this.versions.update((l) => [v, ...l]);
    this.persistVersions();
    this.lastSavedRev.set(this.svc.revision());
    this.flash('Version “' + v.name + '” saved.', true);
  }
  async revertVersion(v: CanvasVersion): Promise<void> {
    this.verConfirm.set(null);
    await this.svc.loadJSON(v.json);
    this.lastSavedRev.set(this.svc.revision());
    this.flash('Reverted to “' + v.name + '”.', true);
  }
  deleteVersion(v: CanvasVersion): void {
    this.verConfirm.set(null);
    this.versions.update((l) => l.filter((x) => x.id !== v.id));
    this.persistVersions();
    this.flash('Version deleted.', true);
  }
  renameVersion(v: CanvasVersion, name: string): void {
    const nm = (name || '').trim(); if (!nm) return;
    this.versions.update((l) => l.map((x) => (x.id === v.id ? { ...x, name: nm } : x)));
    this.persistVersions();
  }
  ago(at: number): string {
    const s = Math.round((Date.now() - at) / 1000);
    if (s < 5) return 'just now';
    if (s < 60) return s + 's ago';
    const m = Math.round(s / 60);
    if (m < 60) return m + 'm ago';
    return Math.round(m / 60) + 'h ago';
  }
  showDist = signal(localStorage.getItem('cf-dist') === '1');
  toggleDist(): void {
    const v = !this.showDist();
    this.showDist.set(v);
    localStorage.setItem('cf-dist', v ? '1' : '0');
    this.svc.setDistanceIndicators(v);
  }
  marginPct = 6;
  snapTol = 6;
  guideAt = 100;
  dragGuide: { axis: 'v' | 'h'; i: number } | null = null;

  // Right-click context menu
  menu = signal<{ x: number; y: number } | null>(null);
  readonly hasSel = computed(() => { this.svc.revision(); return !!this.svc.selected(); });

  /** Selection category powering the smart context menu + properties. */
  readonly selType = computed<SelKind>(() => {
    this.svc.revision();
    const o: any = this.svc.selected();
    if (!o) return 'none';
    if (o.tableId) return 'table';
    const t = o.type;
    if (t === 'textbox' || t === 'i-text' || t === 'text') return 'text';
    if (t === 'image') return 'image';
    if (t === 'activeselection' || t === 'group') return 'group';
    return 'shape';
  });

  // -------------------- smart bottom dock + view toggles --------------------
  showPages = signal(false);
  togglePages(): void { this.showPages.update((v) => !v); }
  dockMenu = signal(false);
  toggleDockMenu(): void { this.dockMenu.update((v) => !v); }
  dockOn = signal(localStorage.getItem('cf-dock') !== '0');
  toggleDock(): void { const v = !this.dockOn(); this.dockOn.set(v); localStorage.setItem('cf-dock', v ? '1' : '0'); }
  layersOn = signal(localStorage.getItem('cf-layers-on') !== '0');
  toggleLayersUI(): void { const v = !this.layersOn(); this.layersOn.set(v); localStorage.setItem('cf-layers-on', v ? '1' : '0'); if (!v) this.layersDock.set(false); }
  readonly multiSelected = computed(() => { this.svc.revision(); return (this.svc.selected() as any)?.type === 'activeselection'; });
  readonly isRealGroup = computed(() => { this.svc.revision(); const o: any = this.svc.selected(); return o?.type === 'group'; });
  zoomPct(): number { return Math.round(this.viewZoom() * 100); }
  quickTable(): void { this.svc.addTable(3, 3, {}); }

  // -------------------- floating mini-toolbar (quick properties) --------------------
  miniBar = signal<{ x: number; y: number; below: boolean } | null>(null);
  /** Whether the floating quick-properties bar appears above a selection (toggle in View options). */
  miniBarOn = signal(localStorage.getItem('cf-minibar') !== '0');
  toggleMiniBar(): void { const v = !this.miniBarOn(); this.miniBarOn.set(v); localStorage.setItem('cf-minibar', v ? '1' : '0'); if (v) this.recomputeMini(); else this.miniBar.set(null); }
  barFonts = ['Inter', 'Playfair Display', 'Montserrat', 'Lora', 'Poppins', 'Roboto', 'Great Vibes', 'Pacifico', 'Amiri', 'Cairo'];

  readonly mFont = computed(() => { this.svc.revision(); const f = (this.svc.selected() as any)?.fontFamily ?? ''; return String(f).split(',')[0].replace(/['"]/g, '').trim(); });
  readonly mFontSize = computed(() => { this.svc.revision(); return Math.round((this.svc.selected() as any)?.fontSize ?? 0); });
  readonly mBold = computed(() => { this.svc.revision(); const w = (this.svc.selected() as any)?.fontWeight; return w === 'bold' || +w >= 600; });
  readonly mItalic = computed(() => { this.svc.revision(); return (this.svc.selected() as any)?.fontStyle === 'italic'; });
  readonly mUnderline = computed(() => { this.svc.revision(); return !!(this.svc.selected() as any)?.underline; });
  readonly mTextColor = computed(() => { this.svc.revision(); const c = (this.svc.selected() as any)?.fill; return typeof c === 'string' ? this.hex(c) : '#1f2937'; });
  readonly mFill = computed(() => { this.svc.revision(); const c = (this.svc.selected() as any)?.fill; return typeof c === 'string' ? this.hex(c) : '#4f46e5'; });
  readonly mStroke = computed(() => { this.svc.revision(); const c = (this.svc.selected() as any)?.stroke; return typeof c === 'string' && c ? this.hex(c) : '#0f172a'; });

  private _miniFx = effect(() => {
    this.svc.revision(); this.svc.selected(); this.viewZoom(); this.menu();
    setTimeout(() => this.recomputeMini(), 0);
  });

  recomputeMini(): void {
    const o: any = this.svc.selected();
    if (!o || !this.miniBarOn() || this.menu() || o.isEditing || this.selType() === 'none') { this.miniBar.set(null); this.opacityOpen.set(false); return; }
    const shadow = this.host.nativeElement.querySelector('.canvas-shadow') as HTMLElement | null;
    if (!shadow || !o.getBoundingRect) { this.miniBar.set(null); return; }
    const r = shadow.getBoundingClientRect();
    const z = this.viewZoom() || 1;
    const bb = o.getBoundingRect();
    const x = r.left + (bb.left + bb.width / 2) * z;
    let y = r.top + bb.top * z - 12;
    let below = false;
    if (y < 92) { y = r.top + (bb.top + bb.height) * z + 12; below = true; }
    this.miniBar.set({ x, y, below });
  }

  @HostListener('window:resize') onWinResize(): void { this.recomputeMini(); }

  mbFont(f: string): void {
    this.svc.quickSet({ fontFamily: f });
    const fonts: any = (document as any).fonts;
    fonts?.load?.(`24px "${f}"`).then(() => this.svc.touch()).catch(() => { /* ignore */ });
  }
  mbSize(v: string | number): void { this.svc.quickSet({ fontSize: Math.max(4, Math.min(400, Math.round(+v) || 0)) }); }
  mbBold(): void { this.svc.quickSet({ fontWeight: this.mBold() ? '400' : '700' }); }
  mbItalic(): void { this.svc.quickSet({ fontStyle: this.mItalic() ? 'normal' : 'italic' }); }
  mbUnderline(): void { this.svc.quickSet({ underline: !this.mUnderline() }); }
  mbTextColor(c: string): void { this.svc.quickSet({ fill: c }); }
  mbFill(c: string): void { this.svc.quickSet({ fill: c }); }
  mbStroke(c: string): void { this.svc.quickSet({ stroke: c, strokeWidth: (this.svc.quickGet('strokeWidth') || 1.5) }); }
  mbDup(): void { this.svc.cloneSelected(); }
  mbDel(): void { this.svc.deleteSelected(); }

  // smart type badge + extra type-aware actions
  readonly selBadge = computed<{ icon: string; label: string }>(() => {
    this.svc.revision();
    const o: any = this.svc.selected();
    if (!o) return { icon: 'crop_free', label: 'Object' };
    if (o.objType === 'field') return { icon: 'data_object', label: 'Variable' };
    if (o.objType === 'signature') return { icon: 'draw', label: 'Signature' };
    if (o.objType === 'icon') return { icon: 'emoji_symbols', label: 'Icon' };
    if (o.objType === 'stamp') return { icon: 'verified', label: 'Stamp' };
    if (o.objType === 'watermark') return { icon: 'branding_watermark', label: 'Watermark' };
    if (o.objType === 'fingerprint') return { icon: 'fingerprint', label: 'Fingerprint' };
    if (o.tableId) return { icon: 'table_chart', label: 'Table' };
    switch (this.selType()) {
      case 'text': return { icon: 'text_fields', label: 'Text' };
      case 'image': return { icon: 'image', label: 'Image' };
      case 'group': return { icon: 'layers', label: 'Group' };
      case 'shape': return { icon: 'category', label: 'Shape' };
      default: return { icon: 'crop_free', label: 'Object' };
    }
  });
  readonly mTextAlign = computed(() => { this.svc.revision(); return (this.svc.selected() as any)?.textAlign ?? 'left'; });
  readonly mStrokeW = computed(() => { this.svc.revision(); return Math.round(((this.svc.selected() as any)?.strokeWidth ?? 0) * 2) / 2; });
  readonly mLocked = computed(() => { this.svc.revision(); return !!(this.svc.selected() as any)?.lockMovementX; });

  mbAlign(): void { const c = this.mTextAlign(); this.svc.quickSet({ textAlign: c === 'left' ? 'center' : c === 'center' ? 'right' : 'left' }); }
  mbReplace(): void { this.replaceInput?.nativeElement.click(); }
  mbFlip(): void { this.svc.flipActive('x'); this.recomputeMini(); }
  mbMask(): void { const o: any = this.svc.selected(); this.svc.setImageMask(o?.clipPath ? 'none' : 'circle'); }
  mbStrokeW(d: number): void { const w = Math.max(0, this.mStrokeW() + d); this.svc.quickSet({ strokeWidth: w, stroke: this.svc.quickGet('stroke') || this.shapeStroke }); }
  mbUngroup(): void { this.svc.ungroupActive(); }
  mbLock(): void { this.svc.toggleLock(); }
  mbMore(ev: MouseEvent): void { this.menu.set({ x: ev.clientX, y: ev.clientY }); }

  // pro readouts + opacity / rotation
  opacityOpen = signal(false);
  readonly mW = computed(() => { this.svc.revision(); const o: any = this.svc.selected(); return o ? Math.round((o.width || 0) * (o.scaleX || 1)) : 0; });
  readonly mH = computed(() => { this.svc.revision(); const o: any = this.svc.selected(); return o ? Math.round((o.height || 0) * (o.scaleY || 1)) : 0; });
  readonly mAngle = computed(() => { this.svc.revision(); return ((Math.round((this.svc.selected() as any)?.angle ?? 0) % 360) + 360) % 360; });
  readonly mOpacity = computed(() => { this.svc.revision(); return Math.round(((this.svc.selected() as any)?.opacity ?? 1) * 100); });
  readonly mVarKey = computed(() => { this.svc.revision(); const o: any = this.svc.selected(); return o?.objType === 'field' ? (o.fieldKey ?? '') : ''; });
  readonly isSig = computed(() => { this.svc.revision(); return (this.svc.selected() as any)?.objType === 'signature'; });
  /** Variables & signatures are bound slots — replace / duplicate / copy / paste are blocked. */
  readonly selProtected = computed(() => { this.svc.revision(); return this.svc.isProtectedActive(); });
  mbOpacity(v: string | number): void { this.svc.quickSet({ opacity: Math.max(0, Math.min(100, +v)) / 100 }); }
  mbResetAngle(): void { this.svc.quickSet({ angle: 0 }); this.recomputeMini(); }

  /** Live, front-to-back list of canvas objects for the Layers panel. */
  readonly layers = computed(() => { this.svc.revision(); return this.svc.layerObjects().slice().reverse(); });

  // ---- search filters (per active panel) ----
  readonly filteredIcons = computed(() => { const q = this.q(); return q ? this.icons.filter((i) => i.n.includes(q)) : this.icons; });
  readonly filteredBadges = computed(() => { const q = this.q(); return q ? this.badges.filter((i) => i.n.includes(q)) : this.badges; });
  readonly filteredVars = computed(() => { const q = this.q(); return q ? this.stdVars.filter((v) => v.toLowerCase().includes(q)) : this.stdVars; });
  readonly filteredGroups = computed(() => {
    const q = this.q();
    if (!q) return this.varGroups;
    return this.varGroups.map((g) => ({ label: g.label, vars: g.vars.filter((v) => v.toLowerCase().includes(q)) })).filter((g) => g.vars.length);
  });
  /** fieldKeys currently placed on the canvas (reactive to canvas changes). */
  readonly usedVars = computed<Set<string>>(() => { this.svc.revision(); return new Set(this.svc.usedFieldKeys()); });
  readonly usedVarList = computed<string[]>(() => { this.svc.revision(); return this.svc.usedFieldKeys(); });
  readonly usedSigs = computed<Set<string>>(() => { this.svc.revision(); return new Set(this.svc.usedSignatureKeys()); });
  previewing = signal<Set<string>>(new Set());
  isPreviewing(key: string): boolean { return this.previewing().has(key); }
  captionVars = ['name', 'title', 'date', 'org'];
  sigVarsOpen = signal<Set<string>>(new Set());
  toggleSigVars(key: string): void { const s = new Set(this.sigVarsOpen()); s.has(key) ? s.delete(key) : s.add(key); this.sigVarsOpen.set(s); }
  sigStatus(key: string): string {
    if (this.isPreviewing(key)) return 'Previewing your signature';
    if (this.usedSigs().has(key)) return 'Placed on canvas';
    return 'Not placed yet';
  }
  insertCaptionVar(i: number, v: string): void {
    this.signatures.update((a) => a.map((s, j) => (j === i ? { ...s, role: `${(s.role || '').trim()} {{${v}}}`.trim() } : s)));
  }
  /** fieldKey of the field object currently selected on the canvas, if any. */
  readonly activeFieldKey = computed<string | null>(() => { this.svc.revision(); const o: any = this.svc.selected(); return o?.objType === 'field' ? (o.fieldKey ?? null) : null; });
  readonly filteredLayers = computed(() => {
    const q = this.q(); const ls = this.layers();
    return q ? ls.filter((o) => this.layerLabel(o).toLowerCase().includes(q)) : ls;
  });
  readonly filteredSizeGroups = computed<SizeGroup[]>(() => {
    const q = this.q();
    if (!q) return this.designGroups;
    return this.designGroups
      .map((g) => ({ label: g.label, items: g.items.filter((s) => s.label.toLowerCase().includes(q) || g.label.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length);
  });
  readonly filteredTemplates = computed(() => {
    const q = this.q(); const cat = this.tplCat();
    return this.designTemplates.filter((t) =>
      (cat === 'all' || t.cat === cat) &&
      (!q || (t.name + ' ' + t.tags).toLowerCase().includes(q)));
  });

  // Properties panel docking + auto-hide + fullscreen
  propPos = signal<'right' | 'left' | 'top' | 'bottom'>((localStorage.getItem('cf-prop-pos') as 'right' | 'left' | 'top' | 'bottom') || 'right');
  propAuto = signal(localStorage.getItem('cf-prop-auto') === '1');
  panelMenu = signal(false);
  fs = signal(false);
  readonly propVisible = computed(() => (this.propAuto() ? this.hasSel() : true));
  /** Auto-hide on: the panel always collapses to a slim handle (reveal on hover), like a tab — even when an object is selected. */
  readonly isPropCollapsed = computed(() => this.propAuto());

  presets: SizePreset[] = [
    { label: 'A4 Landscape', w: 1123, h: 794 },
    { label: 'A4 Portrait', w: 794, h: 1123 },
    { label: 'US Letter Landscape', w: 1056, h: 816 },
    { label: 'Slide 16:9', w: 1280, h: 720 },
    { label: 'Square', w: 1000, h: 1000 },
  ];

  ngAfterViewInit(): void {
    this.svc.init(this.canvasEl.nativeElement, this.width, this.height);
    this.svc.gridSize = this.gridSize;
    this.svc.smartGuides = this.guidesOn();
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.load(idParam);
    } else {
      this.seedStarter();
    }
    setTimeout(() => { this.drawRulers(); this.zoomToFit(1); }, 80);
    this.svc.onInteract(() => this.recomputeMini());
    this.svc.onCellEdit((hit) => this.openCellEditor(hit));
    this.svc.setDistanceIndicators(this.showDist());
    this.versions.set(this.loadVersions());
  }

  // -------------------- inline table-cell editor (double-click on canvas) --------------------
  cellEditor = signal<TableCellHit | null>(null);
  cellEditValue = '';
  private openCellEditor(hit: TableCellHit): void {
    this.menu.set(null);
    this.miniBar.set(null);
    this.cellEditValue = hit.text;
    this.cellEditor.set(hit);
    setTimeout(() => {
      const el = document.querySelector('.cell-edit') as HTMLTextAreaElement | null;
      el?.focus(); el?.select();
    }, 0);
  }
  commitCellEdit(): void {
    const ce = this.cellEditor();
    if (!ce) return;
    this.svc.tableSetCell(ce.r, ce.c, this.cellEditValue);
    this.cellEditor.set(null);
  }
  cancelCellEdit(): void { this.cellEditor.set(null); }
  onCellEditKey(e: KeyboardEvent): void {
    e.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); this.cancelCellEdit(); }
    else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.commitCellEdit(); }
  }

  ngOnDestroy(): void {
    this.svc.dispose();
  }

  private seedStarter(): void {
    this.svc.addHeading();
  }

  private load(id: string): void {
    this.templates.get(id).subscribe({
      next: (t) => {
        this.templateId.set(t.id);
        this.name = t.name;
        this.width = t.width;
        this.height = t.height;
        this.svc.resize(t.width, t.height);
        this.svc.loadJSON(t.canvasJson);
        setTimeout(() => { this.drawRulers(); this.zoomToFit(1); }, 80);
      },
      error: () => this.flash('Could not load template.', false),
    });
  }

  // -------------------- Elements --------------------
  addShape(kind: string): void {
    switch (kind) {
      case 'rect': this.svc.addRect(); break;
      case 'roundRect': this.svc.addRoundRect(); break;
      case 'circle': this.svc.addCircle(); break;
      case 'ellipse': this.svc.addEllipse(); break;
      case 'triangle': this.svc.addTriangle(); break;
      case 'pentagon': this.svc.addPolygon(5); break;
      case 'hexagon': this.svc.addPolygon(6); break;
      case 'star': this.svc.addStar(5); break;
      case 'diamond': this.svc.addDiamond(); break;
      case 'arrow': this.svc.addArrow(); break;
      case 'heart': this.svc.addHeart(); break;
      case 'line': this.svc.addLine(); break;
      case 'octagon': this.svc.addOctagon(); break;
      case 'shield': this.svc.addShield(); break;
      case 'chevron': this.svc.addChevron(); break;
      case 'cross': this.svc.addCross(); break;
      case 'parallelogram': this.svc.addParallelogram(); break;
      case 'bubble': this.svc.addSpeechBubble(); break;
      case 'blob': this.svc.addBlob(); break;
    }
    this.applyNewShapeColor(true);
  }
  addIcon(glyph: string): void { this.svc.addIcon(glyph); }
  addSeal(): void { this.svc.addSeal(); this.applyNewShapeColor(true); }
  addRibbon(): void { this.svc.addRibbon(); this.applyNewShapeColor(true); }
  addFrame(style: 'single' | 'double'): void { this.svc.addFrame(style); this.applyNewShapeColor(false); }
  addDivider(style: 'plain' | 'dashed' | 'ornament'): void { this.svc.addDivider(style); this.applyNewShapeColor(false); }
  private applyNewShapeColor(fillIt: boolean): void {
    this.svc.applyShapeStyle({ fill: this.shapeFill, stroke: this.shapeStroke, fillIt: fillIt && !this.shapeOutline, strokeWidth: +this.shapeStrokeW, opacity: +this.shapeOpacity / 100 });
  }
  recolorSelected(): void {
    this.svc.applyShapeStyle({ fill: this.shapeFill, stroke: this.shapeStroke, fillIt: !this.shapeOutline, strokeWidth: +this.shapeStrokeW, opacity: +this.shapeOpacity / 100 });
  }
  applyShapePreset(p: { fill: string; stroke: string; outline: boolean; w: number; op: number }): void {
    this.shapeFill = p.fill; this.shapeStroke = p.stroke; this.shapeOutline = p.outline; this.shapeStrokeW = p.w; this.shapeOpacity = p.op;
    if (this.svc.selected()) this.recolorSelected();
  }
  /** Add text in a specific (possibly custom) font, loading the webfont first. */
  addFontText(family: string, sample: string, size = 44): void {
    this.svc.addText(sample, { fontFamily: family, fontSize: size });
    const fonts: any = (document as any).fonts;
    if (fonts?.load) fonts.load(`${size}px "${family}"`).then(() => this.svc.touch()).catch(() => { /* ignore */ });
  }
  addStyle(t: { text: string; opts: TextStyleOpts }): void { this.svc.addStyledText(t.text, t.opts); }
  addPhrase(p: { text: string; opts: TextStyleOpts }): void { this.svc.addStyledText(p.text, p.opts); }
  fxShadow(): void { this.svc.toggleTextShadow(); }
  fxOutline(): void { this.svc.toggleTextOutline(); }
  fxGradient(): void { this.svc.setTextGradient(); }
  fxHighlight(c: string): void { this.svc.setTextHighlight(c); }
  fxCase(m: 'upper' | 'lower' | 'title'): void { this.svc.setTextCase(m); }
  setFx(patch: Record<string, any>): void { this.svc.setTextFx(patch); }
  hex(c: string): string {
    if (!c) return '#000000';
    if (c[0] === '#') return c.length === 4 ? '#' + [...c.slice(1)].map((x) => x + x).join('') : c.slice(0, 7);
    const m = c.match(/\d+/g);
    if (!m) return '#000000';
    const to = (n: string) => (+n).toString(16).padStart(2, '0');
    return '#' + to(m[0]) + to(m[1]) + to(m[2]);
  }
  addPair(p: { head: string; body: string }): void {
    this.svc.addStyledText('Heading', { fontFamily: p.head, fontSize: 44, fontWeight: '700' });
    this.svc.addStyledText('Supporting subtitle text', { fontFamily: p.body, fontSize: 18, fill: '#475569' });
  }
  async onFontUpload(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const family = await this.svc.addFontFromFile(file);
      this.flash('Font “' + family + '” added — pick it from the Font dropdown.', true);
    } catch {
      this.flash('Could not load that font file.', false);
    }
  }
  secOpen(k: string): boolean { return !!this.txtSecOpen()[k]; }
  toggleSec(k: string): void { this.txtSecOpen.update((s) => ({ ...s, [k]: !s[k] })); }

  // -------------------- Images --------------------
  myImages = signal<string[]>(this.loadMyImages());
  imgFilters: { name: string; css: string; fx: any }[] = [
    { name: 'Original', css: 'none', fx: {} },
    { name: 'Noir', css: 'grayscale(1) contrast(1.2)', fx: { grayscale: true, sepia: false, invert: false, brightness: 0, contrast: 0.18, saturation: 0, blur: 0, pixelate: 0 } },
    { name: 'Sepia', css: 'sepia(0.85)', fx: { grayscale: false, sepia: true, invert: false, brightness: 0.04, contrast: 0, saturation: 0, blur: 0, pixelate: 0 } },
    { name: 'Vivid', css: 'saturate(1.7) contrast(1.1)', fx: { grayscale: false, sepia: false, invert: false, brightness: 0, contrast: 0.15, saturation: 0.5, blur: 0, pixelate: 0 } },
    { name: 'Faded', css: 'saturate(0.7) brightness(1.1) contrast(0.92)', fx: { grayscale: false, sepia: false, invert: false, brightness: 0.1, contrast: -0.12, saturation: -0.3, blur: 0, pixelate: 0 } },
    { name: 'Bright', css: 'brightness(1.22) saturate(1.1)', fx: { grayscale: false, sepia: false, invert: false, brightness: 0.18, contrast: 0.05, saturation: 0.1, blur: 0, pixelate: 0 } },
    { name: 'Soft', css: 'blur(0.6px) brightness(1.05)', fx: { grayscale: false, sepia: false, invert: false, brightness: 0.05, contrast: 0, saturation: 0, blur: 0.04, pixelate: 0 } },
    { name: 'Invert', css: 'invert(1)', fx: { grayscale: false, sepia: false, invert: true, brightness: 0, contrast: 0, saturation: 0, blur: 0, pixelate: 0 } },
  ];
  imgMasks: { kind: 'none' | 'circle' | 'rounded' | 'hexagon' | 'star' | 'triangle'; label: string; icon: string }[] = [
    { kind: 'none', label: 'No mask', icon: 'crop_square' },
    { kind: 'circle', label: 'Circle', icon: 'circle' },
    { kind: 'rounded', label: 'Rounded', icon: 'rounded_corner' },
    { kind: 'hexagon', label: 'Hexagon', icon: 'hexagon' },
    { kind: 'star', label: 'Star', icon: 'star' },
    { kind: 'triangle', label: 'Triangle', icon: 'change_history' },
  ];
  selectedImage = computed<any>(() => { this.svc.revision(); const o = this.svc.selected() as any; return o && o.type === 'image' ? o : null; });
  imgOpacity = computed<number>(() => { const o = this.selectedImage(); return o ? Math.round((o.opacity ?? 1) * 100) : 100; });
  imgFx = computed<any>(() => { this.svc.revision(); this.svc.selected(); return this.svc.getImageFx(); });
  imgTints = ['', '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#0f172a'];
  imgRatios: { label: string; r: number | null }[] = [
    { label: 'Free', r: null }, { label: '1:1', r: 1 }, { label: '4:3', r: 4 / 3 }, { label: '16:9', r: 16 / 9 }, { label: '3:4', r: 3 / 4 },
  ];

  onImageFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        this.addToLibrary(url);
        this.svc.addImageFromUrl(url).catch(() => this.flash('Could not load image.', false));
      };
      reader.onerror = () => this.flash('Could not load image.', false);
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  addLibraryImage(url: string): void { this.svc.addImageFromUrl(url).catch(() => this.flash('Could not add image.', false)); }
  applyImgFilter(f: { fx: any }): void { if (Object.keys(f.fx).length) this.svc.setImageFx(f.fx); else this.svc.resetImageFx(); }
  maskImage(kind: 'none' | 'circle' | 'rounded' | 'hexagon' | 'star' | 'triangle'): void { this.svc.setImageMask(kind); }
  toggleImageBorder(): void { this.svc.toggleImageBorder(); }
  toggleImageShadow(): void { this.svc.toggleImageShadow(); }
  setImageOpacity(v: string | number): void { this.svc.setImageOpacity(+v); }
  useImageAsBg(): void { this.svc.useActiveImageAsBackground(); }
  pct(x: number | undefined): number { return Math.round((x ?? 0) * 100); }
  adjImg(field: 'brightness' | 'contrast' | 'saturation' | 'blur', v: string | number): void { this.svc.setImageFx({ [field]: +v / 100 } as any); }
  tintImg(c: string): void { this.svc.setImageFx({ tint: c }); }
  cropImg(r: number | null): void { this.svc.cropImageRatio(r); }
  rotateImg(): void { this.svc.rotateImage(); }
  resetImgFx(): void { this.svc.resetImageFx(); }

  private addToLibrary(url: string): void {
    this.myImages.update((list) => [url, ...list.filter((u) => u !== url)].slice(0, 24));
    this.saveMyImages();
  }
  clearMyImages(): void { this.myImages.set([]); this.saveMyImages(); }
  private loadMyImages(): string[] {
    try { return JSON.parse(localStorage.getItem('cf-images') || '[]'); } catch { return []; }
  }
  private saveMyImages(): void {
    try { localStorage.setItem('cf-images', JSON.stringify(this.myImages())); } catch { /* quota: keep in memory */ }
  }

  // -------------------- Variables --------------------
  toggleVar(key: string): void { this.svc.toggleField(key); }
  onSignatureFile(key: string, e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => this.svc.addSignatureImage(key, reader.result as string).catch(() => this.flash('Could not add signature.', false));
      reader.readAsDataURL(file);
    }
    input.value = '';
  }
  addSigPlaceholder(key: string): void { this.svc.addSignaturePlaceholder(key); }
  removeSig(key: string): void {
    this.svc.removeSignature(key);
    this.previewing.update((s) => { const n = new Set(s); n.delete(key); return n; });
  }
  selectSig(key: string): void { this.svc.selectSignature(key); }
  addSignatureSlot(): void {
    const n = this.signatures().length + 1;
    this.signatures.update((a) => [...a, { label: 'Signature ' + n, key: 'signature' + n, role: 'Authorized Signature' }]);
  }
  setSigRole(i: number, role: string): void { this.signatures.update((a) => a.map((s, j) => (j === i ? { ...s, role } : s))); }
  addSigBlock(s: { key: string; role: string }): void { this.svc.addSignatureBlock(s.key, s.role).catch(() => this.flash('Could not add signature.', false)); }
  previewSig(key: string): void {
    if (!this.profileSig() || !this.usedSigs().has(key)) { this.svc.selectSignature(key); return; }
    const set = new Set(this.previewing());
    if (set.has(key)) { set.delete(key); this.svc.clearSignaturePreview(key).catch(() => {}); }
    else { set.add(key); this.svc.fillSignaturePreview(key).catch(() => {}); }
    this.previewing.set(set);
    this.svc.selectSignature(key);
  }
  profileSig(): string | null { try { return localStorage.getItem('cf-signature'); } catch { return null; } }
  useProfileSig(key: string): void {
    const sig = this.profileSig();
    if (sig) this.svc.addSignatureImage(key, sig).catch(() => this.flash('Could not add signature.', false));
    else this.flash('No profile signature yet — add one from the profile menu (Add signature).', false);
  }
  removeVar(key: string): void { this.svc.removeField(key); }
  selectVar(key: string): void { this.svc.selectField(key); }
  isVarUsed(key: string): boolean { return this.usedVars().has(key); }
  addCustomVar(): void {
    const k = this.customVar.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!k) return;
    if (this.isVarUsed(k)) this.svc.selectField(k); else this.svc.addField(k);
    this.customVar = '';
  }
  togglePreview(): void {
    this.previewOn.update((v) => !v);
    if (this.previewOn()) this.svc.setFieldPreview(this.previewMap()); else this.svc.clearFieldPreview();
  }
  onSampleChange(key: string, val: string): void {
    this.sampleData = { ...this.sampleData, [key]: val };
    this.saveSample();
    if (this.previewOn()) this.svc.setFieldPreview(this.previewMap());
  }
  autofillSample(): void {
    const d: Record<string, string> = {
      Name: 'Jordan Lee', Email: 'jordan@acme.com', Phone: '+1 555 0142', JobTitle: 'Product Designer',
      Address: '24 Market St', City: 'Austin', Country: 'USA', Sex: 'Female',
      CourseName: 'Advanced UX Design', CertificateID: 'CF-2026-0148', Grade: 'A', Score: '95%', Credits: '40',
      IssueDate: 'Jun 16, 2026', ExpiryDate: 'Jun 16, 2028',
      OrgName: 'Certifada Academy', Issuer: 'Dr. A. Patel', Department: 'Education', Website: 'certifada.com',
      Date: 'Jun 16, 2026', Year: '2026', Month: 'June', signature1: 'Jordan Lee', signature2: 'A. Patel',
    };
    const next = { ...this.sampleData };
    for (const k of this.usedVarList()) next[k] = next[k] || d[k] || ('Sample ' + k);
    this.sampleData = next;
    this.saveSample();
    if (!this.previewOn()) this.togglePreview(); else this.svc.setFieldPreview(this.previewMap());
  }
  private loadSample(): Record<string, string> { try { return JSON.parse(localStorage.getItem('cf-sample') || '{}'); } catch { return {}; } }
  private saveSample(): void { try { localStorage.setItem('cf-sample', JSON.stringify(this.sampleData)); } catch { /* quota */ } }
  previewMap(): Record<string, string> {
    const rec = this.records()[this.recordIdx()];
    return rec ? { ...this.sampleData, ...rec } : this.sampleData;
  }
  parseSampleCsv(): void {
    const text = this.sampleText.trim();
    const lines = text ? text.split(/\r?\n/).filter((l) => l.trim()) : [];
    if (lines.length < 2) { this.records.set([]); if (this.previewOn()) this.svc.setFieldPreview(this.previewMap()); return; }
    const delim = lines[0].includes('\t') ? '\t' : ',';
    const headers = lines[0].split(delim).map((h) => h.trim().replace(/[^a-zA-Z0-9_]/g, ''));
    const recs: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(delim);
      const r: Record<string, string> = {};
      headers.forEach((h, j) => { if (h) r[h] = (cells[j] ?? '').trim(); });
      recs.push(r);
    }
    this.records.set(recs);
    this.recordIdx.set(0);
    if (recs.length && !this.previewOn()) this.togglePreview();
    else if (this.previewOn()) this.svc.setFieldPreview(this.previewMap());
  }
  stepRecord(d: number): void {
    const n = this.records().length; if (!n) return;
    this.recordIdx.set((this.recordIdx() + d + n) % n);
    if (this.previewOn()) this.svc.setFieldPreview(this.previewMap());
  }
  addColumnsAsVars(): void {
    const rec = this.records()[0]; if (!rec) return;
    for (const k of Object.keys(rec)) if (k && !this.isVarUsed(k)) this.svc.addField(k);
    if (this.previewOn()) this.svc.setFieldPreview(this.previewMap());
  }
  recordCols(): string[] { return Object.keys(this.records()[0] ?? {}); }
  currentRecordVal(c: string): string { return this.records()[this.recordIdx()]?.[c] ?? ''; }
  loadExampleCsv(): void {
    this.sampleText = 'Name,CourseName,IssueDate,Grade\nJordan Lee,Advanced UX Design,Jun 16 2026,A\nMaria Gomez,Data Science 101,Jun 16 2026,A+\nChen Wei,Cloud Architecture,Jun 16 2026,B+';
    this.parseSampleCsv();
  }
  clearDataset(): void {
    this.sampleText = ''; this.records.set([]); this.recordIdx.set(0);
    if (this.previewOn()) this.svc.setFieldPreview(this.previewMap());
  }
  addField(): void {
    if (!this.newFieldKey.trim()) return;
    this.svc.addField(this.newFieldKey);
    this.newFieldKey = '';
  }

  // -------------------- QR Code --------------------
  setQrType(t: any): void { this.qrType = t; this.updateQrPreview(); }
  qrVarChips = ['id', 'name', 'email', 'code', 'verifyUrl'];
  insertQrVar(key = 'id'): void { this.qrValue = (this.qrValue || '') + '{{' + key + '}}'; this.updateQrPreview(); }
  applyQrPreset(p: any): void {
    this.qrFg = p.fg; this.qrBg = p.bg; this.qrStyle = p.style; this.qrGradient = p.grad; this.qrEyeColor = p.eye;
    this.qrEyeStyle = p.eyeStyle || 'auto'; this.qrFrame = p.label === 'Framed'; this.qrTransparent = false;
    this.updateQrPreview();
  }
  async downloadQr(): Promise<void> { const url = await this.renderQr(); if (url) saveAs(url, 'qr-code.png'); }
  onQrLogo(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) { const rd = new FileReader(); rd.onload = () => { this.qrLogo = rd.result as string; this.qrEcc = 'H'; this.updateQrPreview(); }; rd.readAsDataURL(f); }
    (e.target as HTMLInputElement).value = '';
  }
  removeQrLogo(): void { this.qrLogo = null; this.updateQrPreview(); }
  qrContent(): string {
    switch (this.qrType) {
      case 'email': return this.qrEmail ? `mailto:${this.qrEmail}${this.qrEmailSub || this.qrEmailBody ? `?subject=${encodeURIComponent(this.qrEmailSub)}&body=${encodeURIComponent(this.qrEmailBody)}` : ''}` : ' ';
      case 'phone': return this.qrPhone ? `tel:${this.qrPhone}` : ' ';
      case 'sms': return this.qrSmsNum ? `SMSTO:${this.qrSmsNum}:${this.qrSmsMsg}` : ' ';
      case 'wifi': return this.qrWifiSsid ? `WIFI:T:${this.qrWifiEnc};S:${this.qrEsc(this.qrWifiSsid)};P:${this.qrEsc(this.qrWifiPass)};${this.qrWifiHidden ? 'H:true;' : ''};` : ' ';
      case 'vcard': return this.buildVcard();
      default: return (this.qrValue || '').trim() || ' ';
    }
  }
  private qrEsc(s: string): string { return (s || '').replace(/([\\;,:"])/g, '\\$1'); }
  private buildVcard(): string {
    if (!this.qrVcName) return ' ';
    const L = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${this.qrVcName}`];
    if (this.qrVcOrg) L.push(`ORG:${this.qrVcOrg}`);
    if (this.qrVcTitle) L.push(`TITLE:${this.qrVcTitle}`);
    if (this.qrVcPhone) L.push(`TEL:${this.qrVcPhone}`);
    if (this.qrVcEmail) L.push(`EMAIL:${this.qrVcEmail}`);
    if (this.qrVcUrl) L.push(`URL:${this.qrVcUrl}`);
    L.push('END:VCARD');
    return L.join('\n');
  }
  async updateQrPreview(): Promise<void> { try { this.qrPreview.set(await this.renderQr()); } catch { this.qrPreview.set(''); } }
  private rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  private async renderQr(): Promise<string> {
    const qr: any = (QRCode as any).create(this.qrContent(), { errorCorrectionLevel: this.qrEcc });
    const count: number = qr.modules.size;
    const data: any = qr.modules.data;
    const size = this.qrSize, margin = this.qrMargin;
    const total = count + margin * 2, cell = size / total;
    const pad = this.qrFrame ? Math.round(size * 0.07) : 0;
    const labelH = this.qrFrame ? Math.round(size * 0.15) : 0;
    const W = size + pad * 2, H = size + pad * 2 + labelH;
    const ox = pad, oy = pad;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    if (!ctx) return '';
    if (this.qrFrame) { ctx.fillStyle = this.qrFrameColor; this.rr(ctx, 0, 0, W, H, Math.round(size * 0.05)); ctx.fill(); }
    if (this.qrFrame || !this.qrTransparent) {
      ctx.fillStyle = this.qrTransparent ? '#ffffff' : this.qrBg;
      this.rr(ctx, ox, oy, size, size, this.qrFrame ? 10 : 0.001); ctx.fill();
    }
    let fg: string | CanvasGradient = this.qrFg;
    if (this.qrGradient) { const g = ctx.createLinearGradient(ox, oy, ox + size, oy + size); g.addColorStop(0, this.qrFg); g.addColorStop(1, this.qrFg2); fg = g; }
    const eye = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= count - 7) || (r >= count - 7 && c < 7);
    const customEyes = this.qrEyeStyle !== 'auto';
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (!data[r * count + c]) continue;
        if (customEyes && eye(r, c)) continue;
        const x = ox + (c + margin) * cell, y = oy + (r + margin) * cell;
        ctx.fillStyle = this.qrEyeColor && eye(r, c) ? this.qrEyeColor : (fg as any);
        if (this.qrStyle === 'dots') { ctx.beginPath(); ctx.arc(x + cell / 2, y + cell / 2, cell * 0.42, 0, Math.PI * 2); ctx.fill(); }
        else if (this.qrStyle === 'rounded') { this.rr(ctx, x + cell * 0.07, y + cell * 0.07, cell * 0.86, cell * 0.86, cell * 0.34); ctx.fill(); }
        else ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(cell) + 0.5, Math.ceil(cell) + 0.5);
      }
    }
    if (customEyes) {
      const ec = this.qrEyeColor || this.qrFg;
      this.drawQrEye(ctx, 0, 0, cell, margin, ox, oy, ec);
      this.drawQrEye(ctx, 0, count - 7, cell, margin, ox, oy, ec);
      this.drawQrEye(ctx, count - 7, 0, cell, margin, ox, oy, ec);
    }
    if (this.qrFrame) {
      ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.round(labelH * 0.42)}px Inter, Arial, sans-serif`;
      ctx.fillText((this.qrFrameText || 'SCAN ME').slice(0, 24), W / 2, oy + size + labelH / 2);
    }
    if (this.qrLogo) await this.drawQrLogo(ctx, size, ox, oy);
    return cv.toDataURL('image/png');
  }
  private drawQrEye(ctx: CanvasRenderingContext2D, r0: number, c0: number, cell: number, margin: number, ox: number, oy: number, color: string): void {
    const x = ox + (margin + c0) * cell, y = oy + (margin + r0) * cell;
    const shape = (px: number, py: number, sz: number) => {
      if (this.qrEyeStyle === 'circle') { ctx.beginPath(); ctx.arc(px + sz / 2, py + sz / 2, sz / 2, 0, Math.PI * 2); ctx.closePath(); }
      else if (this.qrEyeStyle === 'rounded') { this.rr(ctx, px, py, sz, sz, sz * 0.28); }
      else { ctx.beginPath(); ctx.rect(px, py, sz, sz); }
    };
    ctx.fillStyle = color; shape(x, y, 7 * cell); ctx.fill();
    if (this.qrTransparent && !this.qrFrame) { ctx.save(); ctx.globalCompositeOperation = 'destination-out'; shape(x + cell, y + cell, 5 * cell); ctx.fill(); ctx.restore(); }
    else { ctx.fillStyle = this.qrTransparent ? '#ffffff' : this.qrBg; shape(x + cell, y + cell, 5 * cell); ctx.fill(); }
    ctx.fillStyle = color; shape(x + 2 * cell, y + 2 * cell, 3 * cell); ctx.fill();
  }
  private drawQrLogo(ctx: CanvasRenderingContext2D, size: number, ox = 0, oy = 0): Promise<void> {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => {
        const s = size * 0.24, x = ox + (size - s) / 2, y = oy + (size - s) / 2;
        ctx.fillStyle = this.qrTransparent ? '#ffffff' : this.qrBg;
        this.rr(ctx, x - 6, y - 6, s + 12, s + 12, 10); ctx.fill();
        ctx.save(); this.rr(ctx, x, y, s, s, 8); ctx.clip(); ctx.drawImage(img, x, y, s, s); ctx.restore();
        res();
      };
      img.onerror = () => res();
      img.src = this.qrLogo!;
    });
  }
  async generateQr(): Promise<void> {
    try {
      const url = await this.renderQr();
      if (url) await this.svc.addImageFromUrl(url, 'qr');
    } catch {
      this.flash('Could not generate the QR code.', false);
    }
  }

  // -------------------- Backgrounds --------------------
  setBgColor(c: string): void { this.svc.setBackgroundColor(c); this.currentBg.set({ type: 'solid', color: c }); }
  setBgGradient(g: string[]): void { this.bgGradC1 = g[0]; this.bgGradC2 = g[1]; this.applyBgGradient(); }
  applyBgGradient(): void {
    this.svc.setBgGradientAdvanced(this.bgGradC1, this.bgGradC2, +this.bgGradAngle, this.bgGradRadial, this.bgGradUseMid ? this.bgGradMid : undefined);
    this.currentBg.set({ type: 'gradient', c1: this.bgGradC1, c2: this.bgGradC2, mid: this.bgGradUseMid ? this.bgGradMid : null, angle: +this.bgGradAngle, radial: this.bgGradRadial });
  }
  swapBgColors(): void { const t = this.bgGradC1; this.bgGradC1 = this.bgGradC2; this.bgGradC2 = t; this.applyBgGradient(); }
  setGradAngle(d: number): void { this.bgGradAngle = d; this.applyBgGradient(); }
  shuffleGrad(): void {
    const h = Math.floor(Math.random() * 360);
    const h2 = (h + 40 + Math.floor(Math.random() * 130)) % 360;
    this.bgGradC1 = this.hslHex(h, 78, 60);
    this.bgGradC2 = this.hslHex(h2, 78, 48);
    if (this.bgGradUseMid) this.bgGradMid = this.hslHex(Math.round((h + h2) / 2), 78, 55);
    this.applyBgGradient();
  }
  private hslHex(h: number, s: number, l: number): string {
    l /= 100; const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => { const k = (n + h / 30) % 12; const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); return Math.round(255 * c).toString(16).padStart(2, '0'); };
    return `#${f(0)}${f(8)}${f(4)}`;
  }
  bgGradPreview(): string {
    const stops = this.bgGradUseMid ? `${this.bgGradC1}, ${this.bgGradMid}, ${this.bgGradC2}` : `${this.bgGradC1}, ${this.bgGradC2}`;
    return this.bgGradRadial ? `radial-gradient(circle, ${stops})` : `linear-gradient(${this.bgGradAngle}deg, ${stops})`;
  }
  applyPattern(kind: string): void {
    this.svc.setBackgroundPattern(kind, this.bgPatternFg, this.bgPatternBg, +this.bgPatternScale);
    this.currentBg.set({ type: 'pattern', pattern: kind, fg: this.bgPatternFg, bg: this.bgPatternBg, scale: +this.bgPatternScale });
  }
  reapplyPattern(): void { const b = this.currentBg(); if (b?.type === 'pattern' && b.pattern) this.applyPattern(b.pattern); }
  patternPreview(kind: string): string {
    return `url("data:image/svg+xml,${encodeURIComponent(patternTileSvg(kind, this.bgPatternFg, this.bgPatternBg, +this.bgPatternScale))}")`;
  }
  bgImgFit(mode: 'cover' | 'contain' | 'stretch'): void { this.svc.setBgImageFit(mode); }
  bgImgBlur(v: string | number): void { this.svc.setBgImageBlur(+v); }
  bgImgOpacity(v: string | number): void { this.svc.setBgImageOpacity(+v); }
  saveBg(): void {
    const b = this.currentBg(); if (!b) return;
    const key = JSON.stringify(b);
    this.myBgs.update((list) => [b, ...list.filter((x) => JSON.stringify(x) !== key)].slice(0, 12));
    this.saveMyBgs();
  }
  applyBg(r: any): void {
    if (r.type === 'solid') { this.setBgColor(r.color); }
    else if (r.type === 'gradient') {
      this.bgGradC1 = r.c1; this.bgGradC2 = r.c2; this.bgGradMid = r.mid || this.bgGradMid; this.bgGradUseMid = !!r.mid; this.bgGradAngle = r.angle ?? 135; this.bgGradRadial = !!r.radial; this.applyBgGradient();
    } else if (r.type === 'pattern') {
      this.bgPatternFg = r.fg; this.bgPatternBg = r.bg; this.bgPatternScale = r.scale ?? 40; this.applyPattern(r.pattern);
    }
  }
  deleteBg(r: any): void {
    const key = JSON.stringify(r);
    this.myBgs.update((list) => list.filter((x) => JSON.stringify(x) !== key));
    this.saveMyBgs();
  }
  bgCss(r: any): string {
    if (r.type === 'solid') return r.color;
    if (r.type === 'gradient') { const stops = r.mid ? `${r.c1}, ${r.mid}, ${r.c2}` : `${r.c1}, ${r.c2}`; return r.radial ? `radial-gradient(circle, ${stops})` : `linear-gradient(${r.angle ?? 135}deg, ${stops})`; }
    if (r.type === 'pattern') return `url("data:image/svg+xml,${encodeURIComponent(patternTileSvg(r.pattern, r.fg, r.bg, r.scale ?? 40))}")`;
    return '#ffffff';
  }
  private loadMyBgs(): any[] { try { return JSON.parse(localStorage.getItem('cf-bgs') || '[]'); } catch { return []; } }
  private saveMyBgs(): void { try { localStorage.setItem('cf-bgs', JSON.stringify(this.myBgs())); } catch { /* quota */ } }
  onBgFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.svc.setBackgroundImageFromFile(file).catch(() => this.flash('Could not set background.', false));
    (event.target as HTMLInputElement).value = '';
  }
  removeBg(): void { this.svc.removeBackgroundImage(); }

  // -------------------- Drawing --------------------
  toggleDraw(): void {
    this.svc.setDrawingMode(!this.svc.drawing());
    if (this.svc.drawing()) this.pushBrush();
  }
  pushBrush(): void { this.svc.configureBrush({ type: this.brushType(), color: this.brushColor, width: +this.brushSize, opacity: +this.brushOpacity / 100, glow: this.brushGlow, smoothing: +this.brushSmooth }); }
  setBrushType(t: BrushType): void { this.brushType.set(t); this.pushBrush(); }
  applyBrushPreset(p: any): void {
    this.brushType.set(p.type); this.brushSize = p.size; this.brushOpacity = p.op; this.brushGlow = p.glow; this.brushSmooth = p.smooth;
    if (!this.svc.drawing()) this.svc.setDrawingMode(true);
    this.pushBrush();
  }
  pickBrushColor(c: string): void { this.brushColor = c; this.pushBrush(); }
  undoStroke(): void { this.svc.undo(); }
  clearAll(): void {
    if (confirm('Clear the entire canvas? This removes every element.')) this.svc.clear();
  }

  // -------------------- Addons --------------------
  stampPresets = [
    { text: 'APPROVED', color: '#15803d' },
    { text: 'VERIFIED', color: '#1d4ed8' },
    { text: 'CERTIFIED', color: '#b45309' },
    { text: 'ORIGINAL', color: '#b91c1c' },
    { text: 'CONFIDENTIAL', color: '#7c3aed' },
    { text: 'VOID', color: '#475569' },
  ];
  watermarkText = 'ORIGINAL';
  onStampFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.svc.addImageFromFile(file, 'stamp').catch(() => this.flash('Could not add stamp.', false));
    (event.target as HTMLInputElement).value = '';
  }
  addFingerprint(): void { this.svc.addFingerprint(); }
  addHash(format: 'short' | 'full'): void {
    this.svc.addContentFingerprint(format)
      .then(() => this.flash('Verification fingerprint added.', true))
      .catch(() => this.flash('Could not generate fingerprint.', false));
  }
  addStamp(text: string, color: string): void { this.svc.addRubberStamp(text, color); }
  addSignatureLine(): void { this.svc.addSignatureLine(); }
  addWatermark(): void { this.svc.addWatermark(this.watermarkText || 'ORIGINAL'); }

  // -------------------- Brand --------------------
  applyBrandColor(c: string): void { this.svc.applyColor(c); }
  onLogoFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.svc.addImageFromFile(file, 'logo').catch(() => this.flash('Could not add logo.', false));
    (event.target as HTMLInputElement).value = '';
  }

  // -------------------- Table --------------------
  private tableOpts() {
    return {
      headerFill: this.tHeaderColor, headerText: this.tHeaderText,
      zebra: this.tZebra, zebraColor: this.tZebraColor,
      borderColor: this.tBorderColor, borderWidth: +this.tBorderWidth,
      cellText: this.tCellText, fontSize: +this.tFontSize, align: this.tAlign,
      showHeader: this.tShowHeader, headerCol: this.tHeaderCol,
    };
  }
  applyTableStyle(key: string): void {
    const s = this.tableStyles.find((x) => x.key === key);
    if (!s) return;
    this.tableStyleKey = key;
    const o = s.o;
    this.tHeaderColor = o.headerFill; this.tHeaderText = o.headerText;
    this.tZebra = o.zebra; this.tZebraColor = o.zebraColor;
    this.tBorderColor = o.borderColor; this.tBorderWidth = o.borderWidth; this.tCellText = o.cellText;
  }
  gridHover(r: number, c: number): void { this.gridR = r; this.gridC = c; }
  pickGrid(r: number, c: number): void { this.tableRows = r; this.tableCols = c; this.gridR = 0; this.gridC = 0; this.insertTable(); }
  /** New-table cell content: 'variables' = {{cell}} placeholders for bulk fill, 'empty' = blank cells to type into. */
  tableCellMode: 'variables' | 'empty' = 'variables';
  insertTable(): void {
    const headers = this.tHeaders.split(',').map((h) => h.trim()).filter(Boolean);
    this.svc.addTable(+this.tableRows, +this.tableCols, { ...this.tableOpts(), headers: headers.length ? headers : undefined, emptyCells: this.tableCellMode === 'empty' });
  }
  insertBlueprint(b: { rows: number; cols: number; headers: string[] }): void {
    this.svc.addTable(b.rows, b.cols, { ...this.tableOpts(), headers: b.headers, showHeader: true });
  }
  applyTableStyleToSelection(): void { this.svc.tableApplyStyle(this.tableOpts()); }
  pasteTable(): void {
    if (!this.tablePaste.trim()) return;
    this.svc.addTableFromText(this.tablePaste, this.tableOpts());
    this.tablePaste = '';
  }
  // selected-table cell + dynamic editing (panel grid)
  onGridCell(r: number, c: number, e: Event): void { this.svc.tableSetCell(r, c, (e.target as HTMLInputElement).value); }
  onDynamicToggle(e: Event): void { this.svc.tableSetDynamic((e.target as HTMLInputElement).checked); }
  onColKey(c: number, e: Event): void { this.svc.tableSetColKey(c, (e.target as HTMLInputElement).value); }
  fillRows(): void {
    if (!this.tableRowsPaste.trim()) return;
    this.svc.tableFillRowsFromText(this.tableRowsPaste);
    this.tableRowsPaste = '';
  }

  // -------------------- view aids --------------------
  toggleRuler(): void {
    this.showRuler.set(!this.showRuler());
    setTimeout(() => this.drawRulers(), 0);
  }
  toggleGrid(): void { this.showGrid.set(!this.showGrid()); }
  toggleSnap(): void {
    this.snap.set(!this.snap());
    this.svc.snapToGrid = this.snap();
  }
  toggleGuides(): void {
    this.guidesOn.set(!this.guidesOn());
    this.svc.smartGuides = this.guidesOn();
  }
  setGridSize(v: string | number): void { this.gridSize = +v; this.svc.gridSize = +v; }
  setSnapTol(v: string | number): void { this.snapTol = +v; this.svc.snapTol = +v; }
  addGuideAt(axis: 'v' | 'h'): void {
    const n = Math.max(0, +this.guideAt || 0);
    axis === 'v' ? this.svc.addVGuide(Math.min(this.width, n)) : this.svc.addHGuide(Math.min(this.height, n));
  }
  addCenterGuides(): void { this.svc.addCenterGuides(); }
  addMarginGuides(): void { this.svc.addMarginGuides(this.marginPct / 100); }
  clearGuides(): void { this.svc.clearAllGuides(); }
  removeGuide(axis: 'v' | 'h', i: number): void { axis === 'v' ? this.svc.removeVGuide(i) : this.svc.removeHGuide(i); }
  onGuidePointerDown(axis: 'v' | 'h', i: number, ev: PointerEvent): void {
    ev.preventDefault(); ev.stopPropagation();
    this.dragGuide = { axis, i };
    const shadow = this.host.nativeElement.querySelector('.canvas-shadow') as HTMLElement | null;
    const move = (e: PointerEvent) => {
      if (!shadow) return;
      const r = shadow.getBoundingClientRect();
      const z = this.viewZoom() || 1;
      if (axis === 'v') this.svc.moveVGuide(i, Math.max(0, Math.min(this.width, (e.clientX - r.left) / z)));
      else this.svc.moveHGuide(i, Math.max(0, Math.min(this.height, (e.clientY - r.top) / z)));
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); this.dragGuide = null; };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  // properties dock + fullscreen
  setPropPos(p: 'right' | 'left' | 'top' | 'bottom'): void { this.propPos.set(p); localStorage.setItem('cf-prop-pos', p); }
  togglePropAuto(): void {
    this.propAuto.set(!this.propAuto());
    localStorage.setItem('cf-prop-auto', this.propAuto() ? '1' : '0');
  }
  toggleFullscreen(): void {
    const el = this.host.nativeElement;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  private drawRulers(): void {
    this.drawRuler(this.rulerTop?.nativeElement, 'h', this.width);
    this.drawRuler(this.rulerLeft?.nativeElement, 'v', this.height);
  }

  private drawRuler(cv: HTMLCanvasElement | undefined, dir: 'h' | 'v', len: number): void {
    if (!cv) return;
    const t = this.RULER;
    // Supersample the backing store by device-pixel-ratio × current zoom so the
    // ruler stays crisp when the stage is CSS-zoomed (otherwise it pixelates).
    const dpr = window.devicePixelRatio || 1;
    const z = Math.max(1, this.viewZoom() || 1);
    let f = dpr * z;
    if (len * f > 8192) f = 8192 / len;   // keep within the canvas size limit
    f = Math.max(1, f);
    const wCss = dir === 'h' ? len : t;
    const hCss = dir === 'h' ? t : len;
    cv.style.width = wCss + 'px';
    cv.style.height = hCss + 'px';
    cv.width = Math.round(wCss * f);
    cv.height = Math.round(hCss * f);
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(f, 0, 0, f, 0, 0);   // draw in logical coords; rendered at f× density
    ctx.clearRect(0, 0, wCss, hCss);
    ctx.fillStyle = 'rgba(125,135,156,0.10)';
    ctx.fillRect(0, 0, wCss, hCss);
    ctx.strokeStyle = 'rgba(125,135,156,0.55)';
    ctx.fillStyle = 'rgba(125,135,156,0.95)';
    ctx.font = '9px Inter, system-ui, sans-serif';
    ctx.lineWidth = 1;

    for (let p = 0; p <= len; p += 10) {
      const major = p % 100 === 0;
      const med = p % 50 === 0;
      const tick = major ? 12 : med ? 8 : 5;
      ctx.beginPath();
      if (dir === 'h') { ctx.moveTo(p + 0.5, t); ctx.lineTo(p + 0.5, t - tick); }
      else { ctx.moveTo(t, p + 0.5); ctx.lineTo(t - tick, p + 0.5); }
      ctx.stroke();

      if (major && p > 0) {
        if (dir === 'h') {
          ctx.fillText(String(p), p + 2, 9);
        } else {
          ctx.save();
          ctx.translate(9, p + 2);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText(String(p), 0, 0);
          ctx.restore();
        }
      }
    }
  }

  // -------------------- context menu --------------------
  onCanvasContext(e: MouseEvent): void {
    e.preventDefault();
    this.svc.selectAtPointer(e);
    // open at the cursor, then reposition once measured so the menu never runs off-screen
    this.menu.set({ x: e.clientX, y: e.clientY });
    setTimeout(() => {
      const el = this.host.nativeElement.querySelector('.ctx') as HTMLElement | null;
      if (!el) return;
      const m = 12;
      const w = el.offsetWidth || 220;
      const h = el.offsetHeight || 320;
      const x = Math.max(m, Math.min(e.clientX, window.innerWidth - w - m));
      const y = Math.max(m, Math.min(e.clientY, window.innerHeight - h - m));
      this.menu.set({ x, y });
    });
  }

  mAct(a: CtxAction): void {
    switch (a) {
      case 'cut': this.svc.cut(); break;
      case 'copy': this.svc.copy(); break;
      case 'paste': this.svc.paste(); break;
      case 'duplicate': this.svc.cloneSelected(); break;
      case 'front': this.svc.bringToFront(); break;
      case 'forward': this.svc.bringForward(); break;
      case 'backward': this.svc.sendBackwards(); break;
      case 'back': this.svc.sendToBack(); break;
      case 'lock': this.svc.toggleLock(); break;
      case 'alignLeft': this.svc.alignObjects('left'); break;
      case 'centerH': this.svc.alignObjects('center-h'); break;
      case 'alignRight': this.svc.alignObjects('right'); break;
      case 'alignTop': this.svc.alignObjects('top'); break;
      case 'centerV': this.svc.alignObjects('center-v'); break;
      case 'alignBottom': this.svc.alignObjects('bottom'); break;
      case 'distH': this.svc.distributeObjects('h'); break;
      case 'distV': this.svc.distributeObjects('v'); break;
      case 'group': this.svc.groupActive(); break;
      case 'ungroup': this.svc.ungroupActive(); break;
      case 'copyStyle': this.svc.copyStyle(); break;
      case 'pasteStyle': this.svc.pasteStyle(); break;
      case 'selectAll': this.svc.selectAll(); break;
      case 'delete': this.svc.deleteSelected(); break;
    }
    this.menu.set(null);
  }

  @HostListener('document:click')
  closeMenu(): void { if (this.menu()) this.menu.set(null); if (this.panelMenu()) this.panelMenu.set(false); if (this.viewMenu()) this.viewMenu.set(false); if (this.opacityOpen()) this.opacityOpen.set(false); if (this.historyOpen()) this.historyOpen.set(false); if (this.sizeMenu()) this.sizeMenu.set(false); }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.menu.set(null); this.panelMenu.set(false); this.viewMenu.set(false); this.opacityOpen.set(false); this.historyOpen.set(false); this.sizeMenu.set(false); this.dockMenu.set(false); this.previewOpen.set(false); this.assetFolderOpen.set(false); this.assetConfirm.set(null); }

  @HostListener('document:fullscreenchange')
  onFsChange(): void { this.fs.set(!!document.fullscreenElement); }

  // smart context-menu type actions
  mEditText(): void { this.svc.editText(); this.menu.set(null); }
  mStyle(p: 'fontWeight' | 'fontStyle' | 'underline'): void { this.svc.toggleStyle(p); }
  mFlip(ax: 'x' | 'y'): void { this.svc.flipActive(ax); this.menu.set(null); }
  mSelectTable(): void { const o = this.svc.selected(); if (o) this.svc.selectTable(o); this.menu.set(null); }
  mReplaceImg(): void { this.replaceInput?.nativeElement.click(); this.menu.set(null); }
  onReplaceFile(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.svc.replaceActiveImage(f).catch(() => this.flash('Could not replace image.', false));
    (e.target as HTMLInputElement).value = '';
  }

  // layers helpers
  dragLayer = signal<any>(null);
  dragOverLayer = signal<any>(null);
  expandedLayer = signal<any>(null);
  editingLayer = signal<any>(null);
  editLayerName = '';
  onLayerDragStart(o: any, e: DragEvent): void { this.dragLayer.set(o); if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'; }
  onLayerDragOver(o: any, e: DragEvent): void { e.preventDefault(); this.dragOverLayer.set(o); }
  onLayerDrop(o: any, e: DragEvent): void { e.preventDefault(); const d = this.dragLayer(); if (d && d !== o) this.svc.moveLayerBefore(d, o); this.dragLayer.set(null); this.dragOverLayer.set(null); }
  onLayerDragEnd(): void { this.dragLayer.set(null); this.dragOverLayer.set(null); }
  toggleLayerExpand(o: any): void { this.expandedLayer.set(this.expandedLayer() === o ? null : o); }
  startRename(o: any): void { this.editingLayer.set(o); this.editLayerName = this.layerLabel(o); }
  commitRename(o: any): void { this.svc.renameObj(o, this.editLayerName); this.editingLayer.set(null); }
  setLayerOpacity(o: any, v: string | number): void { this.svc.setObjOpacity(o, +v); }
  layerLabel(o: any): string {
    const ot = o.objType; const t = o.type;
    if (o.layerName) return String(o.layerName).slice(0, 28);
    if (typeof o.text === 'string' && o.text.trim()) return o.text.slice(0, 24);
    if (t === 'image') return ot === 'logo' ? 'Logo' : ot === 'stamp' ? 'Stamp' : ot === 'qr' ? 'QR code' : 'Image';
    if (ot === 'fingerprint') return 'Fingerprint';
    if (ot === 'table') return 'Table';
    if (o.tableId) return 'Table part';
    return ot || t || 'Layer';
  }
  layerIcon(o: any): string {
    const t = o.type;
    if (t === 'textbox' || t === 'i-text' || t === 'text') return 'title';
    if (t === 'image') return 'image';
    if (t === 'line') return 'remove';
    if (o.objType === 'table') return 'grid_on';
    if (t === 'group' || t === 'activeselection') return 'layers';
    return 'category';
  }

  // -------------------- size / zoom --------------------
  applyPreset(p: SizePreset): void {
    this.width = p.w;
    this.height = p.h;
    this.svc.resize(p.w, p.h);
    setTimeout(() => this.drawRulers(), 0);
  }

  // Visual zoom of the whole stage (CSS zoom). Export stays at native resolution.
  viewZoom = signal(1);
  private clampZoom(z: number): number { return Math.min(3, Math.max(0.1, Math.round(z * 100) / 100)); }
  setViewZoom(z: number): void {
    this.viewZoom.set(this.clampZoom(z));
    // refresh Fabric's cached element offset + re-render the rulers crisply at the new zoom
    setTimeout(() => { this.svc.getCanvas()?.calcOffset(); this.drawRulers(); }, 0);
  }
  zoomIn(): void { this.zoomAtCenter(this.viewZoom() + 0.1); }
  zoomOut(): void { this.zoomAtCenter(this.viewZoom() - 0.1); }
  zoomReset(): void { this.zoomAtCenter(1); }

  /** Zoom toward the viewport centre. */
  private zoomAtCenter(z: number): void {
    const scroll = this.host.nativeElement.querySelector('.canvas-scroll') as HTMLElement | null;
    if (!scroll) { this.setViewZoom(z); return; }
    const r = scroll.getBoundingClientRect();
    this.zoomAt(z, r.left + r.width / 2, r.top + r.height / 2);
  }

  /** Smart zoom: scale toward a screen point and re-anchor the scroll so that
   *  point stays put (zoom-to-cursor). */
  private zoomAt(target: number, clientX: number, clientY: number): void {
    const scroll = this.host.nativeElement.querySelector('.canvas-scroll') as HTMLElement | null;
    const stage = scroll?.querySelector('.stage') as HTMLElement | null;
    const z1 = this.clampZoom(target);
    if (!scroll || !stage) { this.setViewZoom(z1); return; }
    const z0 = this.viewZoom() || 1;
    if (z1 === z0) return;
    const rect = scroll.getBoundingClientRect();
    const offX = clientX - rect.left, offY = clientY - rect.top;
    // logical content coord currently under the pointer
    const cx = (scroll.scrollLeft + offX) / z0;
    const cy = (scroll.scrollTop + offY) / z0;
    this.viewZoom.set(z1);
    stage.style.zoom = String(z1);            // apply now so layout resizes synchronously
    scroll.scrollLeft = cx * z1 - offX;       // keep that coord under the pointer
    scroll.scrollTop = cy * z1 - offY;
    this.svc.getCanvas()?.calcOffset();
    this.drawRulers();
  }
  /** Scale the stage so the whole canvas (incl. rulers) fits the visible viewport. */
  zoomToFit(maxZoom = 2): void {
    const scroll = this.host.nativeElement.querySelector('.canvas-scroll') as HTMLElement | null;
    if (!scroll) return;
    // The scroll area has 2rem (~32px) padding each side — account for the full
    // padding (plus a small buffer) so a fitted canvas never overflows into scrollbars.
    const pad = 76;
    const ruler = this.showRuler() ? this.RULER : 0;
    const z = Math.min((scroll.clientWidth - pad) / (this.width + ruler), (scroll.clientHeight - pad) / (this.height + ruler));
    if (z > 0) this.setViewZoom(Math.min(z, maxZoom));
  }
  /** Ctrl/Cmd + mouse wheel zooms the stage toward the cursor. */
  onWheel(e: WheelEvent): void {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    this.zoomAt(this.viewZoom() * (e.deltaY < 0 ? 1.12 : 1 / 1.12), e.clientX, e.clientY);
  }

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

  // -------------------- brand kit (smart apply across templates) --------------------
  /** Refreshed when the editor opens so the toolbar reflects the latest brand. */
  brandInit(): void { this.brand.reload(); }

  /**
   * Smartly apply the saved brand kit to the current design:
   * headings → brand heading font (+ brand colour), body → brand body font,
   * accent shapes recoloured to the brand colour (full-page backgrounds left alone),
   * and the logo dropped in if the design doesn't already have one.
   */
  applyBrandKit(silent = false): void {
    this.brand.reload();
    const k = this.brand.kit();
    if (!k.has) { if (!silent) this.flash('Claim your domain and brand kit in Settings first.', false); return; }
    const c = this.svc.getCanvas();
    const W = c.getWidth(), H = c.getHeight();
    const objs = c.getObjects() as any[];
    const texts = objs.filter((o) => ['textbox', 'i-text', 'text'].includes(o.type) && o.objType !== 'cell');
    const maxFs = texts.reduce((m, o) => Math.max(m, (o.fontSize ?? 0) as number), 0);
    let n = 0;
    for (const o of objs) {
      if (o.objType === 'grid' || o.excludeFromExport) continue;
      const t = o.type;
      if (t === 'textbox' || t === 'i-text' || t === 'text') {
        const role = this.brandTextRole(o, maxFs, H);
        if (role === 'title') o.set({ fontFamily: k.fontHeading, fill: k.primary });
        else if (role === 'name') o.set('fontFamily', k.fontHeading);
        else o.set('fontFamily', k.fontBody);
        n++;
      } else if (t === 'rect' || t === 'circle' || t === 'triangle' || t === 'line') {
        const ow = (o.getScaledWidth?.() ?? o.width ?? 0) as number;
        const oh = (o.getScaledHeight?.() ?? o.height ?? 0) as number;
        const isFilledBackground = ow >= W * 0.92 && oh >= H * 0.92 && !!o.fill && (!o.stroke || !o.strokeWidth);
        if (isFilledBackground) continue;                          // leave full-page background fills
        if (o.stroke && o.stroke !== 'transparent') o.set('stroke', k.primary);  // borders / frames / lines
        else o.set('fill', k.primary);                              // accent shapes
        n++;
      }
    }
    if (k.logo && !objs.some((o) => o.objType === 'logo')) {
      this.svc.addImageFromUrl(k.logo, 'logo').catch(() => { /* ignore */ });
    }
    c.requestRenderAll();
    const fonts: any = (document as any).fonts;
    if (fonts?.load) {
      [k.fontHeading, k.fontBody].forEach((f) => fonts.load(`24px "${f}"`).then(() => this.svc.touch()).catch(() => { /* ignore */ }));
    }
    this.svc.commit();
    if (!silent) this.flash(`Applied your brand kit to ${n} element${n === 1 ? '' : 's'}.`, true);
  }

  /** Infer an element's role in the certificate layout, so brand styling lands sensibly. */
  private brandTextRole(o: any, maxFs: number, H: number): 'title' | 'name' | 'footer' | 'body' {
    const txt = `${o.text ?? ''}`.toLowerCase();
    const key = `${o.fieldKey ?? ''}`.toLowerCase();
    const fs = (o.fontSize ?? 0) as number;
    const top = (o.top ?? 0) as number;
    if (/certificate|diploma|award|completion|achievement|recognition/.test(txt) && fs >= 22) return 'title';
    if (maxFs && fs >= maxFs * 0.92 && fs >= 22) return 'title';
    if (/name|recipient|fullname|holder/.test(key)) return 'name';
    if (top > H * 0.82) return 'footer';
    if (fs >= 20) return 'name';
    return 'body';
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

    const mod = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();

    if (mod && key === 'z') {
      e.preventDefault();
      e.shiftKey ? this.svc.redo() : this.svc.undo();
    } else if (mod && key === 'y') {
      e.preventDefault();
      this.svc.redo();
    } else if (mod && key === 's') {
      e.preventDefault();
      this.save();
    } else if (mod && e.altKey && key === 'c') {
      e.preventDefault();
      this.svc.copyStyle();
    } else if (mod && e.altKey && key === 'v') {
      e.preventDefault();
      this.svc.pasteStyle();
    } else if (mod && key === 'c') {
      this.svc.copy();
    } else if (mod && key === 'x') {
      this.svc.cut();
    } else if (mod && key === 'v') {
      e.preventDefault();
      this.svc.paste();
    } else if (mod && key === 'a') {
      e.preventDefault();
      this.svc.selectAll();
    } else if (mod && key === 'd') {
      e.preventDefault();
      this.svc.cloneSelected();
    } else if (mod && key === 'g') {
      e.preventDefault();
      e.shiftKey ? this.svc.ungroupActive() : this.svc.groupActive();
    } else if (mod && (key === '=' || key === '+')) {
      e.preventDefault();
      this.zoomIn();
    } else if (mod && key === '-') {
      e.preventDefault();
      this.zoomOut();
    } else if (mod && key === '0') {
      e.preventDefault();
      this.zoomReset();
    } else if (mod && key === '9') {
      e.preventDefault();
      this.zoomToFit();
    } else if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      if (active) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = key === 'arrowleft' ? -step : key === 'arrowright' ? step : 0;
        const dy = key === 'arrowup' ? -step : key === 'arrowdown' ? step : 0;
        this.svc.nudgeActive(dx, dy);
      }
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
  // -------------------- preview (watermarked, with fill-variables + dynamic table) --------------------
  previewOpen = signal(false);
  previewStage = signal<'form' | 'image'>('image');
  previewVars = signal<string[]>([]);
  previewValues: Record<string, string> = {};
  previewUrl = signal<string | null>(null);
  previewBusy = signal(false);
  previewSaving = signal(false);
  previewHasSig = signal(false);
  previewSigMine = signal(false);
  previewDyn = signal<{ cols: number; colKeys: string[]; headers: string[] } | null>(null);
  previewRowsText = '';
  readonly pvTiles = Array.from({ length: 60 }, (_, i) => i);

  openPreview(): void {
    const json = this.svc.toJSON();
    const dyn = this.detectDynTable(json);
    this.previewDyn.set(dyn);
    const all = this.svc.getPlaceholders().filter((k) => !/^cell_\d+_\d+$/.test(k));
    const vars = all.filter((k) => !/signature/i.test(k));   // signatures are not typed — they auto-fill from the user's signature
    this.previewVars.set(vars);
    for (const k of vars) if (!(k in this.previewValues)) this.previewValues[k] = '';
    this.previewOpen.set(true);
    this.previewUrl.set(null);
    if (vars.length || dyn) { this.previewStage.set('form'); }
    else { this.previewStage.set('image'); this.runPreview(); }
  }
  private detectDynTable(json: string): { cols: number; colKeys: string[]; headers: string[] } | null {
    try {
      const root = JSON.parse(json);
      const walk = (arr: any[]): any => {
        for (const o of arr ?? []) {
          if (o?.objType === 'table' && o.tableSpec?.dynamic) return o.tableSpec;
          if (Array.isArray(o?.objects)) { const f = walk(o.objects); if (f) return f; }
        }
        return null;
      };
      const spec = walk(root.objects ?? []);
      if (!spec) return null;
      const colKeys: string[] = spec.colKeys ?? [];
      const cols: number = spec.cols ?? colKeys.length;
      const baseHeaders: string[] = (spec.opts?.headers && spec.opts.headers.length) ? spec.opts.headers : colKeys;
      const headers = baseHeaders.slice(0, cols || baseHeaders.length);
      return { cols: cols || headers.length, colKeys, headers };
    } catch { return null; }
  }

  previewFilledCount(): number {
    return this.previewVars().filter((k) => (this.previewValues[k] || '').trim().length > 0).length;
  }

  dynPlaceholder(): string {
    const d = this.previewDyn();
    if (!d) return '';
    const cols = d.headers.length ? d.headers : Array.from({ length: d.cols }, (_, i) => `col ${i + 1}`);
    return [cols.join(', '), cols.map((h) => `${h} 2`).join(', ')].join('\n');
  }

  private parsePreviewRows(): string[][] {
    return this.previewRowsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .map((l) => l.split(',').map((c) => c.trim()));
  }

  editPreviewValues(): void { this.previewStage.set('form'); }

  clearPreviewValues(): void {
    for (const k of Object.keys(this.previewValues)) this.previewValues[k] = '';
    this.previewRowsText = '';
  }

  fillSampleData(): void {
    const samples: Record<string, () => string> = {
      name: () => 'Alex Johnson', fullname: () => 'Alexandra M. Johnson', recipient: () => 'Alex Johnson',
      course: () => 'Advanced Web Development', program: () => 'Professional Certification',
      date: () => new Date().toLocaleDateString(), score: () => '96%', grade: () => 'A+',
      id: () => 'CF-2026-0481', code: () => 'CF-2026-0481', title: () => 'Certificate of Achievement',
      email: () => 'alex@example.com', organization: () => 'Certifada Academy', company: () => 'Certifada Inc.',
      instructor: () => 'Dr. Sarah Lee', hours: () => '40', city: () => 'Dubai', role: () => 'Participant',
    };
    for (const k of this.previewVars()) {
      const low = k.toLowerCase();
      const hit = Object.keys(samples).find((s) => low.includes(s));
      this.previewValues[k] = hit ? samples[hit]() : `Sample ${k}`;
    }
    const d = this.previewDyn();
    if (d && !this.previewRowsText.trim()) {
      const cols = d.headers.length ? d.headers : Array.from({ length: d.cols }, (_, i) => `Col ${i + 1}`);
      this.previewRowsText = [1, 2, 3].map((n) => cols.map((h) => `${h} ${n}`).join(', ')).join('\n');
    }
  }

  private profileSignature(): string | null {
    try { return localStorage.getItem('cf-signature'); } catch { return null; }
  }

  private sampleSignature(): string {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="90" viewBox="0 0 300 90">' +
      '<path d="M12 64 C40 20 56 80 78 46 C92 24 108 70 128 48 C150 24 168 72 196 46 C214 26 236 70 262 40" fill="none" stroke="#1f2937" stroke-width="3.4" stroke-linecap="round"/>' +
      '<path d="M150 72 C190 68 230 68 286 66" fill="none" stroke="#1f2937" stroke-width="1.8" stroke-linecap="round"/></svg>';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  async runPreview(): Promise<void> {
    this.previewStage.set('image');
    this.previewBusy.set(true);
    this.previewUrl.set(null);
    try {
      let json = this.svc.toJSON();
      const dyn = this.previewDyn();
      if (dyn) {
        const rows = this.parsePreviewRows();
        if (rows.length) json = await expandDynamicTablesInJson(json, rows);
      }
      json = mergeDataIntoJson(json, this.previewValues);
      const mine = this.profileSignature();
      const usesSig =
        this.svc.getPlaceholders().some((k) => /^signature\d*$/i.test(k)) ||
        /"objType"\s*:\s*"signature"/.test(json);
      let sig = mine;
      if (!sig && usesSig) sig = this.sampleSignature();
      this.previewHasSig.set(!!sig && usesSig);
      this.previewSigMine.set(!!mine && usesSig);
      this.previewUrl.set(await renderJsonToPng(json, this.width, this.height, 1.6, usesSig ? sig : null));
    } catch {
      this.flash('Could not build preview.', false);
    } finally {
      this.previewBusy.set(false);
    }
  }

  async downloadPreview(): Promise<void> {
    const url = this.previewUrl();
    if (!url) return;
    this.previewSaving.set(true);
    try {
      const baked = await this.paintWatermark(url);
      const blob = await (await fetch(baked)).blob();
      saveAs(blob, `certifada-preview-${Date.now()}.png`);
    } catch {
      this.flash('Could not download preview.', false);
    } finally {
      this.previewSaving.set(false);
    }
  }

  /** Bake a tiled "Preview only" watermark into the PNG so downloads stay marked. */
  private paintWatermark(dataUrl: string): Promise<string> {
    const label = this.i18n.translate('canvas.pv.watermark') || 'Preview only';
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const cv = document.createElement('canvas');
          cv.width = img.naturalWidth || img.width;
          cv.height = img.naturalHeight || img.height;
          const ctx = cv.getContext('2d');
          if (!ctx) { resolve(dataUrl); return; }
          ctx.drawImage(img, 0, 0, cv.width, cv.height);
          const step = Math.max(170, Math.round(cv.width / 6));
          ctx.save();
          ctx.globalAlpha = 0.15;
          ctx.fillStyle = '#0f172a';
          ctx.font = `bold ${Math.round(step / 7)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          let r = 0;
          for (let y = -step; y < cv.height + step; y += step) {
            const offset = r % 2 ? step / 2 : 0; r++;
            for (let x = -step; x < cv.width + step; x += step) {
              ctx.save();
              ctx.translate(x + offset, y);
              ctx.rotate(-Math.PI / 7);
              ctx.fillText(label, 0, 0);
              ctx.restore();
            }
          }
          ctx.restore();
          resolve(cv.toDataURL('image/png'));
        } catch { resolve(dataUrl); }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  closePreview(): void {
    this.previewOpen.set(false);
    this.previewUrl.set(null);
    this.previewBusy.set(false);
    this.previewSaving.set(false);
  }

  // -------------------- assets (persistent IndexedDB image library) --------------------
  assetSearch = signal('');
  assetBusy = signal(false);
  assetDrag = signal(false);
  assetModalDrag = signal(false);
  assetFolderOpen = signal(false);
  assetConfirm = signal<{ kind: 'asset' | 'folder'; name: string; count?: number; id?: string; folder?: string } | null>(null);
  private openFolders = signal<Set<string>>(new Set<string>());

  private filteredAssets(): UserAsset[] {
    const q = this.assetSearch().trim().toLowerCase();
    const all = this.assets.assets();
    if (!q) return all;
    return all.filter((a) => a.name.toLowerCase().includes(q) || (a.folder || '').toLowerCase().includes(q));
  }

  assetGroups = computed(() => {
    this.assets.assets(); this.assetSearch();
    const map = new Map<string, UserAsset[]>();
    for (const a of this.filteredAssets()) {
      if (!a.folder) continue;
      let arr = map.get(a.folder);
      if (!arr) { arr = []; map.set(a.folder, arr); }
      arr.push(a);
    }
    return Array.from(map.entries())
      .map(([name, items]) => ({ name, items }))
      .sort((x, y) => x.name.localeCompare(y.name));
  });

  individualAssets = computed(() => {
    this.assets.assets(); this.assetSearch();
    return this.filteredAssets().filter((a) => !a.folder);
  });

  isFolderOpen(name: string): boolean { return this.openFolders().has(name); }

  toggleFolder(name: string): void {
    const next = new Set(this.openFolders());
    if (next.has(name)) next.delete(name); else next.add(name);
    this.openFolders.set(next);
  }

  openFolderModal(): void { this.assetFolderOpen.set(true); this.assetModalDrag.set(false); }
  closeFolderModal(): void { this.assetFolderOpen.set(false); this.assetModalDrag.set(false); }

  async onAssetFiles(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) await this.ingestAssets(Array.from(input.files).map((file) => ({ file } as AssetEntry)));
    input.value = '';
  }

  async onAssetFolder(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    const entries: AssetEntry[] = files.map((file) => {
      const rel = (file as any).webkitRelativePath as string | undefined;
      const folder = rel && rel.includes('/') ? rel.split('/')[0] : undefined;
      return { file, folder };
    });
    if (entries.length) await this.ingestAssets(entries);
    input.value = '';
    this.closeFolderModal();
  }

  onAssetDragOver(e: DragEvent): void { e.preventDefault(); this.assetDrag.set(true); }
  onAssetDragLeave(e: DragEvent): void { e.preventDefault(); this.assetDrag.set(false); }
  async onAssetDrop(e: DragEvent): Promise<void> {
    e.preventDefault(); this.assetDrag.set(false);
    const entries = await this.entriesFromDrop(e);
    if (entries.length) await this.ingestAssets(entries);
  }

  onModalDragOver(e: DragEvent): void { e.preventDefault(); this.assetModalDrag.set(true); }
  onModalDragLeave(e: DragEvent): void { e.preventDefault(); this.assetModalDrag.set(false); }
  async onModalDrop(e: DragEvent): Promise<void> {
    e.preventDefault(); this.assetModalDrag.set(false);
    const entries = await this.entriesFromDrop(e);
    if (entries.length) { await this.ingestAssets(entries); this.closeFolderModal(); }
  }

  private async entriesFromDrop(e: DragEvent): Promise<AssetEntry[]> {
    const items = e.dataTransfer?.items;
    const out: AssetEntry[] = [];
    if (items && items.length && (items[0] as any).webkitGetAsEntry) {
      const roots: any[] = [];
      for (let i = 0; i < items.length; i++) {
        const en = (items[i] as any).webkitGetAsEntry?.();
        if (en) roots.push(en);
      }
      for (const root of roots) await this.walkEntry(root, undefined, out);
      if (out.length) return out;
    }
    const files = e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : [];
    return files.map((file) => ({ file } as AssetEntry));
  }

  private walkEntry(entry: any, folder: string | undefined, out: AssetEntry[]): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!entry) { resolve(); return; }
      if (entry.isFile) {
        entry.file((file: File) => { out.push({ file, folder }); resolve(); }, () => resolve());
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const all: any[] = [];
        const read = () => reader.readEntries(async (batch: any[]) => {
          if (!batch.length) {
            for (const child of all) await this.walkEntry(child, entry.name, out);
            resolve();
          } else { all.push(...batch); read(); }
        }, () => resolve());
        read();
      } else { resolve(); }
    });
  }

  private async ingestAssets(entries: AssetEntry[]): Promise<void> {
    const imgs = entries.filter((en) => /^image\//.test(en.file.type) || /\.(png|jpe?g|gif|webp|svg)$/i.test(en.file.name));
    if (!imgs.length) { this.flash('No images found to import.', false); return; }
    this.assetBusy.set(true);
    try {
      const res = await this.assets.addEntries(imgs);
      const folders = new Set(imgs.map((en) => en.folder).filter((f): f is string => !!f));
      if (folders.size) {
        const next = new Set(this.openFolders());
        folders.forEach((f) => next.add(f));
        this.openFolders.set(next);
      }
      if (res.added) this.flash(`Added ${res.added} image${res.added > 1 ? 's' : ''} to your library.`, true);
      if (res.tooBig) this.flash(`${res.tooBig} image${res.tooBig > 1 ? 's were' : ' was'} over 500 KB and skipped.`, false);
      else if (!res.added) this.flash(res.errors[0] || 'Nothing was added.', false);
    } catch {
      this.flash('Could not import images.', false);
    } finally {
      this.assetBusy.set(false);
    }
  }

  useAsset(a: UserAsset): void {
    this.svc.addImageFromUrl(a.dataUrl).catch(() => this.flash('Could not add image.', false));
  }

  removeAsset(a: UserAsset, e?: Event): void {
    e?.stopPropagation();
    this.assetConfirm.set({ kind: 'asset', name: a.name, id: a.id });
  }

  removeFolder(name: string, e?: Event): void {
    e?.stopPropagation();
    const count = this.assets.assets().filter((a) => a.folder === name).length;
    this.assetConfirm.set({ kind: 'folder', name, count, folder: name });
  }

  cancelDelete(): void { this.assetConfirm.set(null); }

  async confirmDelete(): Promise<void> {
    const c = this.assetConfirm();
    if (!c) return;
    try {
      if (c.kind === 'folder' && c.folder) await this.assets.removeFolder(c.folder);
      else if (c.id) await this.assets.remove(c.id);
    } catch { /* ignore */ }
    this.assetConfirm.set(null);
  }
}
