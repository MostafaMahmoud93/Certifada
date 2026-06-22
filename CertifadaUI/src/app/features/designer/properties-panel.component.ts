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
}
