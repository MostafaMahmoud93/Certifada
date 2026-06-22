import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ToastService, ToastMessage, ToastPosition } from './toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css'],
  imports: [CommonModule],
})
export class ToastComponent implements OnInit {
  toastMap: Record<ToastPosition, ToastMessage[]> = {
    'top-left': [],
    'top-right': [],
    'bottom-left': [],
    'bottom-right': [],
    'top-center': [],
    'bottom-center': [],
    'center-center': [],
  };

  constructor(private toastService: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.toastService.toast$.subscribe((toast) => {
      const position = toast.position || 'top-right';
      const animatedToast: ToastMessage = { ...toast, visible: false };

      this.toastMap[position].push(animatedToast);
      this.cdr.detectChanges();

      setTimeout(() => {
        animatedToast.visible = true;
        this.cdr.detectChanges();
      }, 50);

      this.setAutoDismiss(animatedToast, position);
    });
  }

  setAutoDismiss(toast: ToastMessage, position: ToastPosition, duration = 3000) {
    toast.timerId = setTimeout(() => {
      this.dismissToast(toast, position);
    }, duration);
  }

  pauseTimer(toast: ToastMessage) {
    if (toast.timerId) {
      clearTimeout(toast.timerId);
      toast.timerId = null;
    }
  }

  resumeTimer(toast: ToastMessage, position: ToastPosition, duration = 3000) {
    if (!toast.timerId) {
      this.setAutoDismiss(toast, position, duration);
    }
  }

  dismissToast(toast: ToastMessage, position: ToastPosition) {
    toast.visible = false;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.removeToast(toast, position);
    }, 300);
  }

  removeToast(toast: ToastMessage, position: ToastPosition) {
    this.toastMap[position] = this.toastMap[position].filter((t) => t !== toast);
    this.cdr.detectChanges();
  }

  getClass(type: ToastMessage['type']) {
    const base = 'text-white px-4 py-2 rounded shadow flex items-center justify-between space-x-2';
    const map = {
      success: 'bg-green-600',
      error: 'bg-red-600',
      info: 'bg-blue-600',
      warning: 'bg-yellow-500 text-black',
    };
    return `${base} ${map[type]}`;
  }

  getContainerClass(position: ToastPosition): string {
    const base = 'fixed z-50 space-y-2';
    const map: Record<ToastPosition, string> = {
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
      'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
      'center-center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
    };
    return `${base} ${map[position]}`;
  }

  getAllPositions(): ToastPosition[] {
    return Object.keys(this.toastMap) as ToastPosition[];
  }


  getAnimationClass(visible: boolean, style: string) {
  switch (style) {
    case 'fade-zoom':
      return visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95';
    case 'slide-right':
      return visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6';
    case 'slide-down':
      return visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4';
    case 'bounce':
       // For bounce: only apply class when visible, else hide (uts already in styles.scss)
       return visible ? 'bounce-in' : 'opacity-0';
    default:
      return '';
  }
}


}
