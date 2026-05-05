import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scroll-to-top',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      class="scroll-to-top" 
      [class.visible]="mostrar()"
      (click)="scrollToTop()"
      aria-label="Volver arriba"
      type="button">
      <i class="fas fa-chevron-up" aria-hidden="true"></i>
    </button>
  `,
  styles: [`
    .scroll-to-top {
      position: fixed;
      bottom: 25px;
      right: 25px;
      width: 45px;
      height: 45px;
      border-radius: 50%;
      background: var(--clr-primary-dark);
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.2);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      box-shadow: var(--shadow-lg);
      opacity: 0;
      visibility: hidden;
      transform: translateY(20px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 1000;
    }

    .scroll-to-top.visible {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .scroll-to-top:hover {
      background: var(--clr-primary);
      transform: scale(1.1);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
    }

    .scroll-to-top:active {
      transform: scale(0.95);
    }

    @media (max-width: 768px) {
      .scroll-to-top {
        bottom: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        font-size: 1rem;
      }
    }
  `]
})
export class ScrollToTopComponent {
  mostrar = signal(false);

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.mostrar.set(window.pageYOffset > 300);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
