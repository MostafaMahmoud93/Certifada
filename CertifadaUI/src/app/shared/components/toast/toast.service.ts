import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type ToastPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'bottom-center'
  | 'center-center'; 

export interface ToastMessage {
  text: string;
  type: 'success' | 'error' | 'info' | 'warning';
  position?: ToastPosition;
  visible: false | true;
  timerId?: any; 
  style: 'fade-zoom' | 'slide-right' | 'slide-down' | 'bounce';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastSubject = new Subject<ToastMessage>();
  toast$ = this.toastSubject.asObservable();

  show(text: string, type: ToastMessage['type'] = 'info', position: ToastPosition = 'top-center') {
    this.toastSubject.next({ text, type, position , visible: true, style: 'bounce' });
  }
  alert(isSuccess : boolean, text: string, position: ToastPosition = 'top-center') {
    this.toastSubject.next({ text, type : (isSuccess?'success': 'error'), position , visible: true, style: 'bounce' });
  }
  success(text: string, position?: ToastPosition) {
    this.show(text, 'success', position);
  }

  error(text: string, position?: ToastPosition) {
    this.show(text, 'error', position);
  }

  info(text: string, position?: ToastPosition) {
    this.show(text, 'info', position);
  }

  warning(text: string, position?: ToastPosition) {
    this.show(text, 'warning', position);
  }
}
