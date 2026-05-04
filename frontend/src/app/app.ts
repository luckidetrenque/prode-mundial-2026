// src/app/app.ts — MEJORADO CON TOAST CONTAINER
import { Component, signal, HostListener, inject } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { PlanillaService } from './core/services/planilla.service';
import { AuthService } from './core/services/auth.service';
import { switchMap, of, catchError, timer } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

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
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  /** Inyectamos servicios */
  private authService = inject(AuthService);
  private planillaService = inject(PlanillaService);
  private router = inject(Router);

  /** Signal para el admin actual */
  admin = this.authService.adminActual;

  /** Signal para la cantidad de planillas pendientes */
  pendientesCount = signal(0);

  /** Breadcrumb signals */
  breadcrumbRootLabel = signal<string | null>(null);
  breadcrumbRootLink  = signal<string | null>(null);
  breadcrumbPageLabel = signal<string | null>(null);

  constructor() {
    /** Lógica de Breadcrumb */
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(() => {
      const url = this.router.url.split('?')[0]; // Ignorar query params
      
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
        
        // Manejo especial para rutas dinámicas como /planillas/CODIGO
        if (url.startsWith('/planillas/')) {
          this.breadcrumbPageLabel.set('Planilla Detalle');
        } else {
          this.breadcrumbPageLabel.set(ROUTE_LABELS[url] || 'Página');
        }
      }
    });

    /** 
     * Reaccionamos al cambio de admin (login/logout).
    /** 
     * Reaccionamos al cambio de admin (login/logout).
     * Si hay un admin, iniciamos un timer que consulta cada 30 segundos.
     */
    toObservable(this.admin).pipe(
      switchMap(adminUser => {
        if (adminUser) {
          // timer(0, 30000) -> ejecuta inmediatamente y luego cada 30s
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

  /** Controla si el menú mobile está abierto */
  menuAbierto = signal(false);

  toggleMenu(): void {
    this.menuAbierto.update(v => !v);
  }

  /** Cierra el menú al hacer click en cualquier enlace */
  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  /** Cierra el menú si se hace click fuera del navbar */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const navbar = document.querySelector('.navbar');
    if (navbar && !navbar.contains(event.target as Node)) {
      this.menuAbierto.set(false);
    }
  }

  /** Cierra el menú con Escape */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuAbierto.set(false);
  }
}
