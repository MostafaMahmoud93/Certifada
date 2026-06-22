import { Component, inject } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
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
  // Arabic-capable Google fonts
  'Cairo',
  'Tajawal',
  'Almarai',
  'Amiri',
  'Noto Kufi Arabic',
  'Noto Naskh Arabic',
  // Custom uploaded fonts (self-hosted, mostly Arabic display/calligraphy)
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

@Component({
  selector: 'app-properties-panel',
  standalone: true,
  imports: [TitleCasePipe],
  templateUrl: './properties-panel.component.html',
  styleUrl: './properties-panel.component.scss',
})
export class PropertiesPanelComponent {
  svc = inject(FabricCanvasService);
  fonts = FONTS;

  // Preset value lists for the ribbon dropdowns (sliders become selects up top).
  readonly opacityOpts = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
  readonly rotOpts = [0, 15, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 270, 300, 315, 330, 360];
  readonly spacingOpts = [-100, -50, 0, 25, 50, 75, 100, 150, 200, 300, 400, 600, 800];
  readonly signedOpts = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1];
  readonly blurOpts = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1];
  readonly pixOpts = [0, 2, 4, 6, 8, 10, 12, 16, 20];
  readonly sizeOpts = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 54, 60, 72, 96, 120];
  readonly lineOpts = [0.8, 0.9, 1, 1.1, 1.16, 1.25, 1.4, 1.5, 1.75, 2, 2.5, 3];

  get obj(): any {
    // Read revision so the panel refreshes after every property change.
    this.svc.revision();
    return this.svc.selected();
  }

  is(type: string): boolean {
    return this.obj?.type === type;
  }

  isTextLike(): boolean {
    const t = this.obj?.type;
    return t === 'textbox' || t === 'i-text' || t === 'text';
  }

  /** Read a property off the active object. */
  val(prop: string): any {
    return this.obj?.[prop];
  }

  num(prop: string, fallback = 0): number {
    const v = this.obj?.[prop];
    return typeof v === 'number' ? Math.round(v * 100) / 100 : fallback;
  }

  /** Live update (while dragging a slider) without pushing an undo step. */
  set(prop: string, value: unknown): void {
    this.svc.setProp({ [prop]: value });
  }

  /** Commit the change to the undo history (on change-end). */
  commit(): void {
    this.svc.commit();
  }

  setAndCommit(prop: string, value: unknown): void {
    this.svc.setProp({ [prop]: value });
    this.svc.commit();
  }

  /** Apply a font, then ensure the (web)font is loaded and re-render so custom fonts paint. */
  setFont(family: string): void {
    this.svc.setProp({ fontFamily: family });
    this.svc.commit();
    const fonts: any = (document as any).fonts;
    if (fonts?.load) {
      fonts.load(`24px "${family}"`).then(() => this.svc.touch()).catch(() => { /* ignore */ });
    }
  }

  toggle(prop: string): void {
    this.setAndCommit(prop, !this.obj?.[prop]);
  }

  toggleFontWeight(): void {
    this.setAndCommit('fontWeight', this.obj?.fontWeight === 'bold' || this.obj?.fontWeight === '700' ? 'normal' : 'bold');
  }

  toggleFontStyle(): void {
    this.setAndCommit('fontStyle', this.obj?.fontStyle === 'italic' ? 'normal' : 'italic');
  }

  // --- Canvas / background ---
  onBgImage(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.svc.setBackgroundImage(reader.result as string);
    reader.readAsDataURL(file);
    (event.target as HTMLInputElement).value = '';
  }

  // --- Image filters ---
  fx(prop: string): any {
    this.svc.revision();
    return (this.svc.getImageFx() as any)?.[prop];
  }
  setFx(prop: string, value: unknown): void {
    this.svc.setImageFx({ [prop]: value } as any);
  }
  toggleFx(prop: string): void {
    const cur = (this.svc.getImageFx() as any)?.[prop];
    this.svc.setImageFx({ [prop]: !cur } as any);
    this.svc.commit();
  }
  resetFx(): void { this.svc.resetImageFx(); }
  flip(axis: 'x' | 'y'): void { this.svc.flipActive(axis); }
}
