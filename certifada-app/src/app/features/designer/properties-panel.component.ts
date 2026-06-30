import { Component, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FabricCanvasService } from './fabric-canvas.service';

const FONTS = [
  'Inter',
  'Playfair Display',
  'Montserrat',
  'Merriweather',
  'Roboto',
  'Great Vibes',
  'Arial',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Cairo',
  'Tajawal',
  'Almarai',
  'Amiri',
  'Noto Kufi Arabic',
  'Noto Naskh Arabic',
  'Diwani Simple Outline',
  'XP Ziba',
  'Yassin',
  'Abdo Free',
  'Abdo Salem',
  'AE Electron',
  'Afsaneh',
  'Al Ebdaa',
  'Aldhabi',
  'Al Gemah Assarim',
  'Al Gemah King',
  'Arabswell',
  'Aref Graffiti',
  'Arslan Wessam B',
  'B Titr',
  'Dast Nevis',
  'DecoType Thuluth',
];

/** A curated, well-balanced swatch palette (neutrals + spectrum + rich certificate tones). */
const SWATCHES = [
  '#000000', '#1f2937', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#ffffff',
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e',
  '#0f172a', '#1e3a8a', '#7c2d12', '#854d0e', '#14532d', '#831843', '#4c1d95',
];

type SectionId = 'text' | 'shape' | 'image' | 'transform' | 'appearance' | 'arrange';

@Component({
  selector: 'app-properties-panel',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './properties-panel.component.html',
  styleUrl: './properties-panel.component.scss',
})
export class PropertiesPanelComponent {
  svc = inject(FabricCanvasService);
  fonts = FONTS;
  swatches = SWATCHES;

  readonly opacityOpts = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
  readonly rotOpts = [0, 15, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 270, 300, 315, 330, 360];
  readonly spacingOpts = [-100, -50, 0, 25, 50, 75, 100, 150, 200, 300, 400, 600, 800];
  readonly signedOpts = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1];
  readonly blurOpts = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1];
  readonly pixOpts = [0, 2, 4, 6, 8, 10, 12, 16, 20];
  readonly sizeOpts = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 54, 60, 72, 96, 120];
  readonly lineOpts = [0.8, 0.9, 1, 1.1, 1.16, 1.25, 1.4, 1.5, 1.75, 2, 2.5, 3];
  readonly rotChips = [0, 45, 90, 180, 270];

  private collapsed = signal<Set<SectionId>>(new Set());
  isCollapsed(id: SectionId): boolean { return this.collapsed().has(id); }
  toggleSec(id: SectionId): void {
    const n = new Set(this.collapsed());
    if (n.has(id)) n.delete(id); else n.add(id);
    this.collapsed.set(n);
  }

  aspect = signal(true);
  toggleAspect(): void { this.aspect.update((v) => !v); }

  recent = signal<string[]>(this.loadRecent());
  private loadRecent(): string[] {
    try { const v = JSON.parse(localStorage.getItem('cf-recent-colors') || '[]'); return Array.isArray(v) ? v : []; }
    catch { return []; }
  }
  private pushRecent(hex: string): void {
    if (!hex) return;
    const h = `${hex}`.toLowerCase();
    const next = [h, ...this.recent().filter((c) => c !== h)].slice(0, 12);
    this.recent.set(next);
    try { localStorage.setItem('cf-recent-colors', JSON.stringify(next)); } catch { /* ignore */ }
  }

  get obj(): any {
    this.svc.revision();
    return this.svc.selected();
  }

  is(type: string): boolean { return this.obj?.type === type; }

  isTextLike(): boolean {
    const t = this.obj?.type;
    return t === 'textbox' || t === 'i-text' || t === 'text';
  }

  isMulti(): boolean { return this.obj?.type === 'activeselection'; }
  isEditableText(): boolean { return this.isTextLike() && this.obj?.objType !== 'field'; }
  hasFill(): boolean { return this.is('rect') || this.is('circle') || this.is('triangle'); }
  hasStroke(): boolean { return this.is('rect') || this.is('circle') || this.is('triangle') || this.is('line'); }

  val(prop: string): any { return this.obj?.[prop]; }

  num(prop: string, fallback = 0): number {
    const v = this.obj?.[prop];
    return typeof v === 'number' ? Math.round(v * 100) / 100 : fallback;
  }

  pct(v: number): number { return Math.round((v ?? 0) * 100); }

  set(prop: string, value: unknown): void { this.svc.setProp({ [prop]: value }); }
  commit(): void { this.svc.commit(); }
  setAndCommit(prop: string, value: unknown): void { this.svc.setProp({ [prop]: value }); this.svc.commit(); }

  setFont(family: string): void {
    this.svc.setProp({ fontFamily: family });
    this.svc.commit();
    const fonts: any = (document as any).fonts;
    if (fonts?.load) {
      fonts.load(`24px "${family}"`).then(() => this.svc.touch()).catch(() => { /* ignore */ });
    }
  }

  toggle(prop: string): void { this.setAndCommit(prop, !this.obj?.[prop]); }
  toggleFontWeight(): void { this.setAndCommit('fontWeight', this.obj?.fontWeight === 'bold' || this.obj?.fontWeight === '700' ? 'normal' : 'bold'); }
  toggleFontStyle(): void { this.setAndCommit('fontStyle', this.obj?.fontStyle === 'italic' ? 'normal' : 'italic'); }

  meta(): { icon: string; label: string; sub: string } {
    const o = this.obj;
    if (!o) return { icon: 'crop_free', label: '', sub: '' };
    if (this.isMulti()) {
      const n = (o._objects?.length ?? o.getObjects?.().length ?? 0) as number;
      return { icon: 'select_all', label: 'Multiple', sub: `${n} elements selected` };
    }
    const t = o.type, ot = o.objType;
    let icon = 'crop_free', label = 'Element';
    if (ot === 'field') { icon = 'data_object'; label = 'Variable'; }
    else if (ot === 'cell') { icon = 'data_object'; label = 'Table cell'; }
    else if (ot === 'table') { icon = 'table_chart'; label = 'Table'; }
    else if (ot === 'signature') { icon = 'draw'; label = 'Signature'; }
    else if (ot === 'qr') { icon = 'qr_code_2'; label = 'QR code'; }
    else if (ot === 'icon') { icon = 'emoji_symbols'; label = 'Icon'; }
    else if (t === 'textbox' || t === 'i-text' || t === 'text') { icon = 'title'; label = 'Text'; }
    else if (t === 'image') { icon = 'image'; label = 'Image'; }
    else if (t === 'rect') { icon = 'crop_square'; label = 'Rectangle'; }
    else if (t === 'circle') { icon = 'circle'; label = 'Circle'; }
    else if (t === 'triangle') { icon = 'change_history'; label = 'Triangle'; }
    else if (t === 'line') { icon = 'horizontal_rule'; label = 'Line'; }
    else if (t === 'group') { icon = 'widgets'; label = 'Group'; }
    const layers = this.svc.layerObjects();
    const idx = layers.indexOf(o);
    const sub = idx >= 0 ? `Layer ${layers.length - idx} of ${layers.length}` : '';
    return { icon, label, sub };
  }

  isLocked(): boolean { return this.svc.isLocked(); }
  lock(): void { this.svc.toggleLock(); }
  posLocked(): boolean { return this.obj ? this.svc.isPositionLocked(this.obj) : false; }
  lockPos(): void { this.svc.togglePositionLock(); }
  dupe(): void { void this.svc.cloneSelected(); }
  del(): void { this.svc.deleteSelected(); }
  sup(): void { this.svc.applyScript('super'); }
  sub(): void { this.svc.applyScript('sub'); }

  private thumbCache: { rev: number; obj: any; url: string | null } = { rev: -1, obj: null, url: null };
  thumb(): string | null {
    const o = this.obj;
    const rev = this.svc.revision();
    if (!o || this.isMulti()) return null;
    if (this.thumbCache.rev === rev && this.thumbCache.obj === o) return this.thumbCache.url;
    let url: string | null = null;
    try {
      const w = (o.getScaledWidth?.() || o.width || 1) as number;
      const h = (o.getScaledHeight?.() || o.height || 1) as number;
      const m = Math.min(Math.max(72 / Math.max(w, h), 0.02), 2);
      url = o.toDataURL({ format: 'png', multiplier: m });
    } catch { url = null; }
    this.thumbCache = { rev, obj: o, url };
    return url;
  }

  posX(): number { return Math.round(this.obj?.left ?? 0); }
  posY(): number { return Math.round(this.obj?.top ?? 0); }
  sizeW(): number { return Math.round(this.obj?.getScaledWidth?.() ?? this.obj?.width ?? 0); }
  sizeH(): number { return Math.round(this.obj?.getScaledHeight?.() ?? this.obj?.height ?? 0); }

  setPos(axis: 'left' | 'top', v: number): void {
    if (Number.isNaN(v)) return;
    this.setAndCommit(axis, v);
  }

  setSize(dim: 'w' | 'h', v: number): void {
    const o = this.obj;
    if (!o || !v || v <= 0) return;
    const w0 = (o.getScaledWidth?.() || o.width || 1) as number;
    const h0 = (o.getScaledHeight?.() || o.height || 1) as number;
    const sx = (o.scaleX || 1) as number;
    const sy = (o.scaleY || 1) as number;
    if (dim === 'w') {
      const f = v / w0;
      this.svc.setProp(this.aspect() ? { scaleX: sx * f, scaleY: sy * f } : { scaleX: sx * f });
    } else {
      const f = v / h0;
      this.svc.setProp(this.aspect() ? { scaleX: sx * f, scaleY: sy * f } : { scaleY: sy * f });
    }
    this.svc.commit();
  }

  applyColor(prop: string, hex: string): void {
    this.svc.setProp({ [prop]: hex });
    this.svc.commit();
    this.pushRecent(hex);
  }
  eqColor(a: any, b: string): boolean { return `${a ?? ''}`.toLowerCase() === b.toLowerCase(); }

  applyPreset(p: 'title' | 'subtitle' | 'body' | 'caption'): void {
    const map: Record<string, Record<string, unknown>> = {
      title: { fontSize: 46, fontWeight: 'bold', lineHeight: 1.1, charSpacing: 0 },
      subtitle: { fontSize: 28, fontWeight: '600', lineHeight: 1.15, charSpacing: 20 },
      body: { fontSize: 18, fontWeight: 'normal', lineHeight: 1.4, charSpacing: 0 },
      caption: { fontSize: 13, fontWeight: 'normal', lineHeight: 1.3, charSpacing: 40 },
    };
    this.svc.setProp(map[p]);
    this.svc.commit();
    this.svc.touch();
  }

  setCase(mode: 'upper' | 'lower' | 'title'): void {
    const o = this.obj;
    if (!o || o.objType === 'field') return;
    const txt = `${o.text ?? ''}`;
    let out = txt;
    if (mode === 'upper') out = txt.toUpperCase();
    else if (mode === 'lower') out = txt.toLowerCase();
    else out = txt.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    this.set('text', out);
    this.commit();
  }

  onBgImage(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.svc.setBackgroundImage(reader.result as string);
    reader.readAsDataURL(file);
    (event.target as HTMLInputElement).value = '';
  }

  fx(prop: string): any {
    this.svc.revision();
    return (this.svc.getImageFx() as any)?.[prop];
  }
  setFx(prop: string, value: unknown): void { this.svc.setImageFx({ [prop]: value } as any); }
  toggleFx(prop: string): void {
    const cur = (this.svc.getImageFx() as any)?.[prop];
    this.svc.setImageFx({ [prop]: !cur } as any);
    this.svc.commit();
  }
  resetFx(): void { this.svc.resetImageFx(); }
  flip(axis: 'x' | 'y'): void { this.svc.flipActive(axis); }
}
