// floating-widget.component.ts
import { CommonModule } from '@angular/common';

import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';

@Component({
  selector: 'app-floating-widget',
  templateUrl: './floating-widget.html',
standalone: false,})
export class FloatingWidget implements OnInit, OnDestroy {
  @Input() text: string = '';
  @Input() mediaUrl: string = '';
  @Input() isVideo: boolean = false;

  currentDir: 'ltr' | 'rtl' = 'ltr';
  isVisible: boolean = true;
  parentWidth: number = 300; // fallback default

  private mutationObserver: MutationObserver | undefined;

  constructor(private elRef: ElementRef) {}

  ngOnInit(): void {
    this.updateDir();
    this.updateParentWidth();

    this.mutationObserver = new MutationObserver(() => {
      this.updateDir();
    });

    this.mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir'],
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.updateParentWidth();
  }

  updateDir(): void {
    const dir = localStorage.getItem('app-dir') as 'ltr' | 'rtl';
    this.currentDir = dir === 'rtl' ? 'rtl' : 'ltr';
  }

  updateParentWidth(): void {
    const parent = this.elRef.nativeElement?.parentElement;
    if (parent) {
      this.parentWidth = parent.clientWidth -20 || 300;
    }
  }

  closeWidget(): void {
    this.isVisible = false;
  }

  ngOnDestroy(): void {
    this.mutationObserver?.disconnect();
  }
}
