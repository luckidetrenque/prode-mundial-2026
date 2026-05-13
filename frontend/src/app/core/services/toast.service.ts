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

  private showToast(message: string, type: Toast['type'], duration?: number): void {
    // Si no se especifica duración, usamos 6000ms para touch y 4000ms para desktop (error/warning usan sus propios defaults)
    const defaultDuration = ('ontouchstart' in window) ? 6000 : 4000;
    const finalDuration = duration ?? defaultDuration;

    const id = ++this.toastIdCounter;
    const toast: Toast = { id, message, type, duration: finalDuration };
    
    this.toasts.update(current => [...current, toast]);

    if (finalDuration > 0) {
      setTimeout(() => this.remove(id), finalDuration);
    }
  }

  success(message: string, duration?: number): void {
    this.showToast(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    this.showToast(message, 'error', duration ?? 5000);
  }

  warning(message: string, duration?: number): void {
    this.showToast(message, 'warning', duration ?? 5000);
  }

  info(message: string, duration?: number): void {
    this.showToast(message, 'info', duration);
  }

  remove(id: number): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
