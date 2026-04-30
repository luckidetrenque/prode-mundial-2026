// src/app/shared/components/toast-container/toast-container.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" role="region" aria-label="Notificaciones">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="toast" 
          [class]="'toast-' + toast.type" 
          role="alert" 
          aria-live="polite"
        >
          <i class="fas" [class]="getIcon(toast.type)" aria-hidden="true"></i>
          <span>{{ toast.message }}</span>
          <button 
            class="toast-close" 
            (click)="toastService.remove(toast.id)" 
            aria-label="Cerrar notificación"
            type="button"
          >
            <i class="fas fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: calc(var(--navbar-height, 60px) + 1rem);
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75em;
      max-width: 400px;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 0.75em;
      padding: 1em 1.25em;
      border-radius: var(--radius-lg);
      font-size: 0.9rem;
      font-weight: 500;
      box-shadow: var(--shadow-lg);
      border: 1px solid;
      pointer-events: all;
      animation: slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      min-width: 300px;
    }

    @keyframes slideIn {
      from { 
        transform: translateX(120%);
        opacity: 0;
      }
      to { 
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast i:first-child {
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .toast span {
      flex: 1;
    }

    .toast-close {
      background: transparent;
      border: none;
      color: inherit;
      cursor: pointer;
      font-size: 1rem;
      padding: 0.25em;
      opacity: 0.6;
      transition: opacity 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: auto;
      flex-shrink: 0;
    }

    .toast-close:hover,
    .toast-close:focus-visible {
      opacity: 1;
      outline: none;
    }

    /* Tipos */
    .toast-success {
      background: var(--clr-success-bg);
      color: var(--clr-success-text);
      border-color: rgba(26,122,74,0.4);
    }

    .toast-error {
      background: var(--clr-error-bg);
      color: var(--clr-error-text);
      border-color: rgba(192,57,43,0.4);
    }

    .toast-warning {
      background: var(--clr-warning-bg);
      color: var(--clr-warning-text);
      border-color: rgba(122,88,0,0.4);
    }

    .toast-info {
      background: #e8f4fb;
      color: #0a5a8a;
      border-color: rgba(10,90,138,0.4);
    }

    /* Responsive */
    @media (max-width: 640px) {
      .toast-container {
        top: calc(var(--navbar-height, auto) + 0.5rem);
        right: 0.5rem;
        left: 0.5rem;
        max-width: none;
      }

      .toast {
        min-width: auto;
        font-size: 0.85rem;
      }
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  getIcon(type: string): string {
    switch (type) {
      case 'success': return 'fa-circle-check';
      case 'error': return 'fa-triangle-exclamation';
      case 'warning': return 'fa-circle-exclamation';
      case 'info': return 'fa-circle-info';
      default: return 'fa-circle-info';
    }
  }
}
