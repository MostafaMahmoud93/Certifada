import { Component, computed, ElementRef, EventEmitter, Input, Output, ViewChild, signal } from '@angular/core';

interface SigFont { name: string; }
type BrushStyle = 'pen' | 'marker' | 'brush' | 'fountain';

/**
 * Signature capture. Two modes:
 *  - Draw: free-hand on a canvas with selectable ink color + pen size, or upload an image.
 *  - Type: type a name and pick a script font + color; rendered to a PNG on save.
 * Result is a PNG data URL saved to localStorage ('cf-signature') for now; later
 * this moves to the user's profile via the API.
 * Usage: <app-signature-pad [open]="show()" (closed)="show.set(false)" />
 */
@Component({
  selector: 'app-signature-pad',
  standalone: true,
  template: `
  @if (open) {
    <div class="ov" (click)="close()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="m-head">
          <div>
            <h3>Your signature</h3>
            <p class="hint">Draw or type your signature — it'll be available when designing certificates.</p>
          </div>
          <button class="x" (click)="close()" aria-label="Close"><span class="material-icons">close</span></button>
        </div>

        <div class="seg">
          <button [class.on]="mode()==='draw'" (click)="setMode('draw')"><span class="material-icons">draw</span> Draw</button>
          <button [class.on]="mode()==='type'" (click)="setMode('type')"><span class="material-icons">keyboard</span> Type</button>
        </div>

        <div class="pad-wrap">
          <canvas #pad class="pad" [class.hide]="mode()==='type'" [style.cursor]="padCursor()"
            (pointerdown)="start($event)" (pointermove)="move($event)"
            (pointerup)="end()" (pointerleave)="end()"></canvas>

          @if (mode()==='type') {
            <div class="preview" [style.fontFamily]="fam(typedFont())" [style.color]="inkColor()"
                 [class.ph]="!typedText().trim()">{{ typedText().trim() || 'Your name' }}</div>
          }
          @if (mode()==='draw') { <span class="baseline"></span> }
        </div>

        @if (mode()==='type') {
          <input class="name-in" type="text" [value]="typedText()" maxlength="40"
                 (input)="typedText.set($any($event.target).value)" placeholder="Type your full name" />
          <div class="fonts">
            @for (f of fonts; track f.name) {
              <button class="font" [class.on]="typedFont()===f.name" [style.fontFamily]="fam(f.name)"
                      [style.color]="inkColor()" (click)="typedFont.set(f.name)">{{ typedText().trim() || 'Signature' }}</button>
            }
          </div>
        }

        <div class="tools">
          <div class="grp">
            <span class="lbl">Color</span>
            <div class="swatches">
              @for (c of inkColors; track c) {
                <button class="sw" [class.on]="inkColor()===c" [style.background]="c" (click)="setColor(c)" [attr.aria-label]="c"></button>
              }
              <label class="sw custom" [style.background]="inkColor()" title="Custom color">
                <span class="material-icons">colorize</span>
                <input type="color" [value]="inkColor()" (input)="setColor($any($event.target).value)" hidden />
              </label>
            </div>
          </div>
          @if (mode()==='draw') {
            <div class="grp">
              <span class="lbl">Brush</span>
              <div class="brushes">
                @for (b of brushes; track b.id) {
                  <button class="brush" [class.on]="brush()===b.id" (click)="brush.set(b.id)" [title]="b.label"><span class="material-icons">{{ b.icon }}</span></button>
                }
              </div>
            </div>
            <div class="grp">
              <span class="lbl">Size</span>
              <div class="sizes">
                @for (s of penSizes; track s) {
                  <button class="size" [class.on]="penSize()===s" (click)="penSize.set(s)">
                    <span class="dot" [style.width.px]="s*2+3" [style.height.px]="s*2+3" [style.background]="inkColor()"></span>
                  </button>
                }
              </div>
            </div>
          }
        </div>

        <div class="m-actions">
          @if (mode()==='draw') {
            <label class="tool-btn sm"><span class="material-icons">upload</span> Upload
              <input type="file" accept="image/*" hidden (change)="upload($event)" /></label>
          }
          <button class="tool-btn sm danger" (click)="clear()" title="Clear"><span class="material-icons">delete</span> Clear</button>
          <span class="grow"></span>
          <button class="cf-btn cf-btn-primary sm" (click)="save()"
                  [disabled]="mode()==='type' && !typedText().trim()"><span class="material-icons">check</span> Save</button>
        </div>

        @if (savedMsg()) { <div class="ok"><span class="material-icons">check_circle</span> {{ savedMsg() }}</div> }
      </div>
    </div>
  }
  `,
  styles: [`
    .ov{position:fixed;inset:0;background:rgba(2,6,23,.5);display:grid;place-items:center;z-index:80;padding:20px}
    .modal{width:100%;max-width:396px;max-height:92vh;overflow:auto;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:var(--cf-radius-lg);box-shadow:var(--cf-shadow-lg);padding:15px 17px}
    .m-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
    .m-head h3{font-size:17px;color:var(--cf-ink-900)}
    .hint{font-size:12px;color:var(--cf-ink-500);margin-top:3px;max-width:42ch}
    .x{border:0;background:none;color:var(--cf-ink-400);cursor:pointer;line-height:0;padding:2px;border-radius:8px}
    .x:hover{background:var(--cf-surface-2);color:var(--cf-ink-700)}

    .seg{display:inline-flex;background:var(--cf-surface-2);border:1px solid var(--cf-line);border-radius:999px;padding:3px;gap:2px;margin:12px 0 10px}
    .seg button{display:inline-flex;align-items:center;gap:6px;border:0;background:none;color:var(--cf-ink-600);font:inherit;font-size:12.5px;font-weight:500;padding:6px 14px;border-radius:999px;cursor:pointer}
    .seg button .material-icons{font-size:17px}
    .seg button.on{background:var(--cf-surface);color:var(--cf-brand-600);box-shadow:var(--cf-shadow-sm)}

    .pad-wrap{position:relative;border:1px dashed var(--cf-line);border-radius:var(--cf-radius-md);background:#fff;overflow:hidden}
    .pad{display:block;width:100%;height:134px;touch-action:none;cursor:crosshair}
    .pad.hide{display:none}
    .preview{display:flex;align-items:center;justify-content:center;height:134px;font-size:42px;line-height:1;padding:0 18px;text-align:center;overflow:hidden;white-space:nowrap}
    .preview.ph{opacity:.32}
    .baseline{position:absolute;left:22px;right:22px;bottom:30px;border-bottom:1.5px solid #cbd5e1}

    .name-in{width:100%;height:38px;margin-top:10px;border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-900);border-radius:var(--cf-radius-sm);padding:0 12px;font:inherit;font-size:13.5px;outline:none}
    .name-in:focus{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .fonts{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:8px}
    .font{height:42px;border:1px solid var(--cf-line);background:var(--cf-surface);border-radius:var(--cf-radius-sm);font-size:21px;line-height:1;cursor:pointer;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;padding:0 6px;transition:border-color .12s,background .12s}
    .font:hover{background:var(--cf-surface-2)}
    .font.on{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring);background:var(--cf-brand-50)}

    .tools{display:flex;flex-wrap:wrap;align-items:center;gap:14px;margin-top:12px;padding-top:12px;border-top:1px solid var(--cf-line)}
    .grp{display:flex;align-items:center;gap:10px}
    .lbl{font-size:12px;font-weight:600;color:var(--cf-ink-500);text-transform:uppercase;letter-spacing:.04em}
    .swatches{display:flex;align-items:center;gap:7px}
    .sw{width:22px;height:22px;border-radius:999px;border:2px solid var(--cf-surface);box-shadow:0 0 0 1px var(--cf-line);cursor:pointer;padding:0;display:grid;place-items:center}
    .sw.on{box-shadow:0 0 0 2px var(--cf-brand-500)}
    .sw.custom{color:#fff}
    .sw.custom .material-icons{font-size:14px;mix-blend-mode:difference}
    .sizes{display:flex;align-items:center;gap:6px}
    .size{width:32px;height:28px;border:1px solid var(--cf-line);background:var(--cf-surface);border-radius:var(--cf-radius-sm);cursor:pointer;display:grid;place-items:center}
    .size.on{border-color:var(--cf-brand-500);background:var(--cf-brand-50)}
    .brushes{display:flex;align-items:center;gap:6px}
    .brush{width:32px;height:28px;border:1px solid var(--cf-line);background:var(--cf-surface);border-radius:var(--cf-radius-sm);cursor:pointer;display:grid;place-items:center;color:var(--cf-ink-500)}
    .brush.on{border-color:var(--cf-brand-500);background:var(--cf-brand-50);color:var(--cf-brand-600)}
    .brush .material-icons{font-size:17px}
    .dot{border-radius:999px;display:block}

    .m-actions{display:flex;align-items:center;gap:8px;margin-top:14px}
    .m-actions .left{display:contents}
    .m-actions button,.m-actions label{flex:0 0 auto;width:auto;white-space:nowrap}
    .m-actions .sp,.m-actions .grow{display:none}
    .m-actions .cf-btn-primary{margin-inline-start:auto}
    .m-actions .material-icons{font-size:16px}
    .cf-btn.sm{padding:8px 13px;font-size:12.5px}
    .tool-btn{display:inline-flex;align-items:center;gap:6px;border:0;background:var(--cf-surface-2);color:var(--cf-ink-700);font:inherit;font-size:12.5px;font-weight:500;padding:8px 12px;border-radius:var(--cf-radius-sm);cursor:pointer;transition:.12s}
    .tool-btn:hover{background:var(--cf-line);color:var(--cf-ink-900)}
    .tool-btn .material-icons{color:var(--cf-ink-500)}
    .tool-btn:hover .material-icons{color:var(--cf-ink-700)}
    .tool-btn.danger:hover{background:var(--cf-danger-soft);color:var(--cf-danger)}
    .tool-btn.danger:hover .material-icons{color:var(--cf-danger)}
    .tool-btn.sm{padding:6px 11px;font-size:11.5px}
    .tool-btn.sm .material-icons{font-size:15px}
    .tool-btn input[type="file"]{display:none}
    .ok{display:flex;align-items:center;gap:6px;margin-top:12px;color:var(--cf-success);font-size:13px;font-weight:500}
    .ok .material-icons{font-size:17px}
    @media(max-width:520px){.tools{gap:12px}.preview,.font{font-size:22px}.preview{font-size:42px}}
  `],
})
export class SignaturePadComponent {
  @Output() closed = new EventEmitter<void>();
  @ViewChild('pad') padRef?: ElementRef<HTMLCanvasElement>;

  mode = signal<'draw' | 'type'>('draw');

  readonly inkColors = ['#0f172a', '#1e3a8a', '#4F46E5', '#0369a1', '#b91c1c', '#047857'];
  inkColor = signal('#0f172a');

  readonly penSizes = [2, 3, 4.5];
  penSize = signal(3);

  readonly brushes: { id: BrushStyle; label: string; icon: string }[] = [
    { id: 'pen', label: 'Pen', icon: 'edit' },
    { id: 'marker', label: 'Marker', icon: 'border_color' },
    { id: 'brush', label: 'Brush', icon: 'brush' },
    { id: 'fountain', label: 'Fountain', icon: 'gesture' },
  ];
  brush = signal<BrushStyle>('pen');
  private last = { x: 0, y: 0 };

  readonly fonts: SigFont[] = [
    { name: 'Dancing Script' }, { name: 'Great Vibes' }, { name: 'Pacifico' },
    { name: 'Satisfy' }, { name: 'Sacramento' }, { name: 'Allura' },
  ];
  typedFont = signal('Dancing Script');
  typedText = signal('');

  private _open = false;
  @Input() set open(v: boolean) {
    this._open = v;
    if (v) { this.mode.set('draw'); setTimeout(() => this.initCanvas(), 0); }
  }
  get open(): boolean { return this._open; }

  private ctx: CanvasRenderingContext2D | null = null;
  private drawing = false;
  savedMsg = signal('');

  fam(name: string): string { return "'" + name + "', cursive"; }

  /** Tool-shaped cursor (pen / brush / marker) with the tip at the drawing point — no more "+" crosshair. */
  padCursor = computed(() => {
    const b = this.brush();
    const svg = this.cursorSvg(b, this.inkColor());
    const hot = b === 'brush' ? '5 24' : b === 'marker' ? '7 22' : '6 22';
    return `url("data:image/svg+xml;base64,${btoa(svg)}") ${hot}, crosshair`;
  });
  private cursorSvg(b: BrushStyle, c: string): string {
    const w = '#ffffff';
    if (b === 'marker') {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><path d="M20 3 L25 8 L13 20 L7 22 L9 14 Z" fill="${c}" stroke="${w}" stroke-width="1.4" stroke-linejoin="round"/><path d="M7 22 L9 16 L12 19 Z" fill="${w}"/></svg>`;
    }
    if (b === 'brush') {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><path d="M22 4 L24 6 L15 15 L13 13 Z" fill="${c}" stroke="${w}" stroke-width="1.2" stroke-linejoin="round"/><path d="M13 13 L15 15 L10 21 C8 23 5 24 5 24 C5 24 6 21 8 19 Z" fill="${c}" stroke="${w}" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><path d="M21.5 3.5 a2 2 0 0 1 3 3 L11 20 L6 22 L8 17 Z" fill="${c}" stroke="${w}" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
  }

  setMode(m: 'draw' | 'type'): void {
    this.mode.set(m);
    if (m === 'draw') setTimeout(() => { if (!this.ctx) this.initCanvas(); }, 0);
  }

  setColor(c: string): void {
    this.inkColor.set(c);
    if (this.ctx) this.ctx.strokeStyle = c;
  }

  private initCanvas(): void {
    const c = this.padRef?.nativeElement;
    if (!c) return;
    const w = c.clientWidth || c.parentElement?.clientWidth || 420;
    c.width = w;
    c.height = c.clientHeight || 134;
    this.ctx = c.getContext('2d');
    if (!this.ctx) return;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = this.inkColor();
    this.ctx.clearRect(0, 0, c.width, c.height);
    const saved = localStorage.getItem('cf-signature');
    if (saved) {
      const img = new Image();
      img.onload = () => this.ctx?.drawImage(img, 0, 0, c.width, c.height);
      img.src = saved;
    }
  }

  private pos(e: PointerEvent): { x: number; y: number } {
    const r = this.padRef!.nativeElement.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  start(e: PointerEvent): void {
    if (!this.ctx) return;
    this.drawing = true;
    this.last = this.pos(e);
    // a dot so a tap leaves a mark
    this.ctx.fillStyle = this.inkColor();
    this.ctx.globalAlpha = this.brush() === 'marker' ? 0.4 : 1;
    this.ctx.beginPath();
    this.ctx.arc(this.last.x, this.last.y, this.strokeWidth(0) / 2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }
  move(e: PointerEvent): void {
    if (!this.drawing || !this.ctx) return;
    const p = this.pos(e);
    const dist = Math.hypot(p.x - this.last.x, p.y - this.last.y);
    const ctx = this.ctx;
    ctx.strokeStyle = this.inkColor();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = this.brush() === 'marker' ? 0.4 : 1;
    ctx.lineWidth = this.strokeWidth(dist);
    ctx.beginPath();
    ctx.moveTo(this.last.x, this.last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    this.last = p;
  }
  end(): void { this.drawing = false; }

  /** Stroke width for the current brush, varying with drawing speed for brush/fountain. */
  private strokeWidth(dist: number): number {
    const base = this.penSize();
    switch (this.brush()) {
      case 'marker': return base * 2.6;
      case 'brush': { const slow = 1 - Math.min(dist / 14, 1); return base * (1 + slow * 1.4); }
      case 'fountain': { const slow = 1 - Math.min(dist / 9, 1); return base * 0.7 * (1 + slow * 2.4); }
      default: return base;
    }
  }

  clear(): void {
    if (this.mode() === 'type') { this.typedText.set(''); return; }
    const c = this.padRef?.nativeElement;
    if (c && this.ctx) this.ctx.clearRect(0, 0, c.width, c.height);
  }

  upload(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file || !this.ctx) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = this.padRef!.nativeElement;
        this.ctx!.clearRect(0, 0, c.width, c.height);
        const scale = Math.min(c.width / img.width, c.height / img.height);
        const w = img.width * scale, h = img.height * scale;
        this.ctx!.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    (e.target as HTMLInputElement).value = '';
  }

  async save(): Promise<void> {
    let dataUrl: string | null = null;
    if (this.mode() === 'type') {
      dataUrl = await this.renderTyped();
    } else {
      dataUrl = this.padRef?.nativeElement.toDataURL('image/png') ?? null;
    }
    if (!dataUrl) return;
    localStorage.setItem('cf-signature', dataUrl);
    this.savedMsg.set('Signature saved ✓');
    setTimeout(() => this.savedMsg.set(''), 1600);
  }

  /** Render the typed name with the chosen script font + color to a transparent PNG. */
  private async renderTyped(): Promise<string | null> {
    const text = this.typedText().trim();
    if (!text) return null;
    const name = this.typedFont();
    const W = 680, H = 220, maxW = W - 80;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    if (!ctx) return null;
    let px = 120;
    try { await (document as any).fonts?.load(`${px}px "${name}"`, text); } catch { /* font may be cached */ }
    ctx.fillStyle = this.inkColor();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${px}px "${name}", cursive`;
    while (px > 28 && ctx.measureText(text).width > maxW) {
      px -= 4;
      ctx.font = `${px}px "${name}", cursive`;
    }
    ctx.fillText(text, W / 2, H / 2);
    return cv.toDataURL('image/png');
  }

  close(): void { this.closed.emit(); }
}
