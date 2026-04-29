import { Component, signal, HostListener, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { PlanillaService } from './core/services/planilla.service';
import { AuthService } from './core/services/auth.service';
import { switchMap, of, catchError, timer } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  /** Inyectamos servicios */
  private authService = inject(AuthService);
  private planillaService = inject(PlanillaService);

  /** Signal para el admin actual */
  admin = this.authService.adminActual;

  /** Signal para la cantidad de planillas pendientes */
  pendientesCount = signal(0);

  constructor() {
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
      console.log('Planillas pendientes:', count);
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