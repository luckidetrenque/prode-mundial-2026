// src/app/app.ts — MIGRADO A TorneoService
//
// CAMBIOS vs versión anterior:
//   - Se elimina el timer inline del countdown (lógica movida a TorneoService)
//   - Se elimina `private deadline`
//   - tiempoExpirado y countdownText ahora son aliases a las signals del servicio
//   - Todo lo demás permanece igual (breadcrumb, pendientesCount, menú mobile)

import { Component, signal, HostListener, inject } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { PlanillaService } from './core/services/planilla.service';
import { AuthService } from './core/services/auth.service';
import { TorneoService } from './core/services/torneo.service';
import { switchMap, of, catchError, timer } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { ScrollToTopComponent } from './shared/components/scroll-to-top/scroll-to-top.component';

const ROUTE_LABELS: Record<string, string> = {
  '/home': 'Inicio',
  '/fixture': 'Fixture',
  '/planilla': 'Cargar Planilla',
  '/resultados': 'Resultados',
  '/posiciones': 'Posiciones',
  '/estadisticas': 'Estadísticas',
  '/participantes': 'Participantes',
  '/reglamento': 'Reglamento',
  '/admin': 'Dashboard',
  '/admin/resultados': 'Cargar Resultados',
  '/admin/planillas': 'Confirmar Planillas',
  '/admin/login': 'Login Admin'
};

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastContainerComponent, ScrollToTopComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private authService    = inject(AuthService);
  private planillaService = inject(PlanillaService);
  private router         = inject(Router);
  private torneoService  = inject(TorneoService);

  admin          = this.authService.adminActual;
  pendientesCount = signal(0);

  // ── Countdown: delegado al servicio ──────────────────────────────────────
  // Los signals son readonly refs al mismo objeto del servicio,
  // por lo que el template sigue usando {{ countdownText() }} y tiempoExpirado()
  // sin ningún cambio en app.html.
  countdownText  = this.torneoService.countdownText;
  tiempoExpirado = this.torneoService.tiempoExpirado;

  // ── Breadcrumb ────────────────────────────────────────────────────────────
  breadcrumbRootLabel = signal<string | null>(null);
  breadcrumbRootLink  = signal<string | null>(null);
  breadcrumbPageLabel = signal<string | null>(null);

  constructor() {
    // Breadcrumb
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(() => {
      const url = this.router.url.split('?')[0];

      if (url === '/home' || url === '/') {
        this.breadcrumbRootLabel.set(null);
        return;
      }

      if (url.startsWith('/admin')) {
        if (url === '/admin') {
          this.breadcrumbRootLabel.set(null);
        } else {
          this.breadcrumbRootLabel.set('Dashboard');
          this.breadcrumbRootLink.set('/admin');
          this.breadcrumbPageLabel.set(ROUTE_LABELS[url] || 'Detalle');
        }
      } else {
        this.breadcrumbRootLabel.set('Inicio');
        this.breadcrumbRootLink.set('/home');
        if (url.startsWith('/planillas/')) {
          this.breadcrumbPageLabel.set('Planilla Detalle');
        } else {
          this.breadcrumbPageLabel.set(ROUTE_LABELS[url] || 'Página');
        }
      }
    });

    // Badge de planillas pendientes (solo cuando hay admin logueado)
    toObservable(this.admin).pipe(
      switchMap(adminUser => {
        if (adminUser) {
          return timer(0, 30000).pipe(
            switchMap(() => this.planillaService.getPendientesCount().pipe(
              catchError(() => of(0))
            ))
          );
        }
        return of(0);
      }),
      takeUntilDestroyed()
    ).subscribe(count => {
      this.pendientesCount.set(count);
    });
  }

  menuAbierto = signal(false);

  toggleMenu(): void {
    this.menuAbierto.update(v => !v);
  }

  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const navbar = document.querySelector('.navbar');
    if (navbar && !navbar.contains(event.target as Node)) {
      this.menuAbierto.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuAbierto.set(false);
  }
}
