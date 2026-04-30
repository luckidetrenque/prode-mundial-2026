// src/app/core/services/toast.service.ts
import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  
  private toastIdCounter = 0;
  toasts = signal<Toast[]>([]);

  private showToast(message: string, type: Toast['type'], duration = 4000): void {
    const id = ++this.toastIdCounter;
    const toast: Toast = { id, message, type, duration };
    
    this.toasts.update(current => [...current, toast]);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  success(message: string, duration = 4000): void {
    this.showToast(message, 'success', duration);
  }

  error(message: string, duration = 5000): void {
    this.showToast(message, 'error', duration);
  }

  warning(message: string, duration = 5000): void {
    this.showToast(message, 'warning', duration);
  }

  info(message: string, duration = 4000): void {
    this.showToast(message, 'info', duration);
  }

  remove(id: number): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
