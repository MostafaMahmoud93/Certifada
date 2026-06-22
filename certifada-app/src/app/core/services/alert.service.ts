import { Injectable, signal } from '@angular/core';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

export interface AlertItem {
  id: number;
  type: AlertType;
  title?: string;
  message: string;
  /** Auto-dismiss after this many ms. 0 = sticky (manual close only). */
  duration: number;
}

export interface AlertOptions {
  title?: string;
  duration?: number;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

/**
 * App-wide alerts. Inject anywhere and call:
 *   alerts.success('Saved!')           — toast
 *   alerts.error('Upload failed', { title: 'Oops' })
 *   if (await alerts.confirm({ message: 'Delete this?', danger: true })) { ... }
 * Rendered once by <app-alert-host> mounted at the app root.
 */
@Injectable({ providedIn: 'root' })
export class AlertService {
  private seq = 0;
  readonly alerts = signal<AlertItem[]>([]);
  readonly confirmState = signal<ConfirmState | null>(null);

  show(type: AlertType, message: string, opts: AlertOptions = {}): number {
    const id = ++this.seq;
    const duration = opts.duration ?? (type === 'error' ? 7000 : 4200);
    this.alerts.update((a) => [...a, { id, type, message, title: opts.title, duration }]);
    return id;
  }

  success(message: string, opts?: AlertOptions): number { return this.show('success', message, opts); }
  error(message: string, opts?: AlertOptions): number { return this.show('error', message, opts); }
  info(message: string, opts?: AlertOptions): number { return this.show('info', message, opts); }
  warning(message: string, opts?: AlertOptions): number { return this.show('warning', message, opts); }

  dismiss(id: number): void { this.alerts.update((a) => a.filter((x) => x.id !== id)); }
  clear(): void { this.alerts.set([]); }

  /** Promise-based replacement for window.confirm(). */
  confirm(opts: ConfirmOptions | string): Promise<boolean> {
    const o: ConfirmOptions = typeof opts === 'string' ? { message: opts } : opts;
    return new Promise<boolean>((resolve) => this.confirmState.set({ ...o, resolve }));
  }

  resolveConfirm(ok: boolean): void {
    const s = this.confirmState();
    if (s) {
      this.confirmState.set(null);
      s.resolve(ok);
    }
  }
}
