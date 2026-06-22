import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild, signal } from '@angular/core';

/**
 * Lightweight WYSIWYG editor with an "Insert placeholder" menu.
 * Two-way bind the HTML body and pass the available merge fields:
 *   <app-rich-text [(value)]="body" [placeholders]="['name','email']" />
 */
@Component({
  selector: 'app-rich-text',
  standalone: true,
  template: `
  <div class="rte">
    <div class="bar">
      <button type="button" (mousedown)="$event.preventDefault()" (click)="cmd('bold')" title="Bold"><span class="material-icons">format_bold</span></button>
      <button type="button" (mousedown)="$event.preventDefault()" (click)="cmd('italic')" title="Italic"><span class="material-icons">format_italic</span></button>
      <button type="button" (mousedown)="$event.preventDefault()" (click)="cmd('underline')" title="Underline"><span class="material-icons">format_underlined</span></button>
      <span class="sep"></span>
      <button type="button" (mousedown)="$event.preventDefault()" (click)="cmd('insertUnorderedList')" title="Bulleted list"><span class="material-icons">format_list_bulleted</span></button>
      <button type="button" (mousedown)="$event.preventDefault()" (click)="cmd('insertOrderedList')" title="Numbered list"><span class="material-icons">format_list_numbered</span></button>
      <button type="button" (mousedown)="$event.preventDefault()" (click)="link()" title="Insert link"><span class="material-icons">link</span></button>
      @if (placeholders.length) {
        <span class="sep"></span>
        <div class="phwrap">
          <button type="button" class="phbtn" (mousedown)="$event.preventDefault()" (click)="togglePh($event)" title="Insert placeholder">
            <span class="material-icons">data_object</span> Placeholder <span class="material-icons car">expand_more</span>
          </button>
          @if (phOpen()) {
            <div class="phmenu" (click)="$event.stopPropagation()">
              <div class="phhint">Insert a field that fills per recipient</div>
              @for (p of placeholders; track p) {
                <button type="button" (mousedown)="$event.preventDefault()" (click)="insertPlaceholder(p)">{{ '{{' }}{{ p }}{{ '}}' }}</button>
              }
            </div>
          }
        </div>
      }
      <span class="sep"></span>
      <button type="button" (mousedown)="$event.preventDefault()" (click)="cmd('removeFormat')" title="Clear formatting"><span class="material-icons">format_clear</span></button>
    </div>
    <div #ed class="area" contenteditable="true" [attr.data-ph]="placeholder" (input)="onInput()" (blur)="onInput()"></div>
  </div>
  `,
  styles: [`
    :host{display:block}
    .rte{border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);background:var(--cf-surface);overflow:visible}
    .bar{display:flex;align-items:center;gap:2px;flex-wrap:wrap;padding:6px;border-bottom:1px solid var(--cf-line);background:var(--cf-surface-2);border-radius:var(--cf-radius-sm) var(--cf-radius-sm) 0 0}
    .bar button{display:inline-flex;align-items:center;gap:5px;height:30px;min-width:30px;padding:0 7px;border:0;border-radius:6px;background:none;color:var(--cf-ink-600);cursor:pointer;font:inherit;font-size:12.5px}
    .bar button:hover{background:var(--cf-surface);color:var(--cf-ink-900)}
    .bar .material-icons{font-size:18px}
    .sep{width:1px;height:20px;background:var(--cf-line);margin:0 4px}
    .phwrap{position:relative}
    .phbtn{font-weight:600;color:var(--cf-brand-600)!important}
    .phbtn .car{font-size:16px}
    .phmenu{position:absolute;top:34px;inset-inline-start:0;z-index:20;width:210px;max-height:240px;overflow:auto;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:var(--cf-radius-md);box-shadow:var(--cf-shadow-lg);padding:6px}
    .phhint{font-size:10.5px;color:var(--cf-ink-400);padding:4px 8px 6px}
    .phmenu button{display:block;width:100%;text-align:start;padding:7px 9px;border:0;border-radius:6px;background:none;font:inherit;font-size:12.5px;font-family:'Courier New',monospace;color:var(--cf-brand-700);cursor:pointer}
    .phmenu button:hover{background:var(--cf-brand-50)}
    .area{min-height:140px;max-height:340px;overflow:auto;padding:12px 14px;font:inherit;font-size:13.5px;line-height:1.6;color:var(--cf-ink-900);outline:none}
    .area:empty:before{content:attr(data-ph);color:var(--cf-ink-400)}
    .area a{color:var(--cf-brand-600)}
    .area:focus{box-shadow:inset 0 0 0 2px var(--cf-brand-100)}
  `],
})
export class RichTextEditorComponent implements AfterViewInit {
  @Input() set value(v: string | undefined) {
    const nv = v || '';
    if (nv !== this._v) { this._v = nv; this.render(); }
  }
  get value(): string { return this._v; }
  @Output() valueChange = new EventEmitter<string>();
  @Input() placeholders: string[] = [];
  @Input() placeholder = 'Write your message…';
  @ViewChild('ed') ed!: ElementRef<HTMLDivElement>;

  private _v = '';
  phOpen = signal(false);

  ngAfterViewInit(): void { this.render(); }

  private render(): void {
    const el = this.ed?.nativeElement;
    if (el && el.innerHTML !== this._v) el.innerHTML = this._v;
  }
  private sync(): void {
    this._v = this.ed.nativeElement.innerHTML;
    this.valueChange.emit(this._v);
  }
  onInput(): void { this.sync(); }

  cmd(c: string, val?: string): void {
    this.ed.nativeElement.focus();
    document.execCommand(c, false, val);
    this.sync();
  }
  link(): void {
    const url = prompt('Link URL:');
    if (url) this.cmd('createLink', url);
  }
  togglePh(e: Event): void { e.stopPropagation(); this.phOpen.update((v) => !v); }
  insertPlaceholder(p: string): void {
    this.phOpen.set(false);
    this.ed.nativeElement.focus();
    document.execCommand('insertText', false, '{{' + p + '}}');
    this.sync();
  }

  @HostListener('document:click')
  closeMenu(): void { if (this.phOpen()) this.phOpen.set(false); }
}
