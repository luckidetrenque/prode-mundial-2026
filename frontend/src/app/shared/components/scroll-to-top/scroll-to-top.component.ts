import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// FIX #7: Se eliminaron los estilos inline del decorador @Component.
// El componente tenía estilos definidos en DOS lugares:
//   1. En styles: [`...`] dentro de @Component (bottom: 20px en mobile)
//   2. En scroll-to-top.css (bottom: 80px en mobile, correcto para no
//      quedar tapado por el bottom-nav de 65px de altura)
//
// Los estilos inline tienen la misma especificidad que el .css externo
// pero al competir, generaban confusión y el valor incorrecto podía ganar
// dependiendo del orden de carga. La versión correcta es la del .css externo
// (bottom: 80px en mobile) porque ese valor es el que convive bien con
// .bottom-nav que mide 65px.
//
// Solución: dejar SOLO el archivo .css externo y eliminar el bloque styles:[].

@Component({
  selector: 'app-scroll-to-top',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scroll-to-top.html',
  styleUrl: './scroll-to-top.css'
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
