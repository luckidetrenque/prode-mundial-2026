// src/app/features/admin/dashboard/dashboard.component.ts
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="main">
      <h2>
        <i class="fas fa-lock"></i>
        Módulo de Administración
        <span class="admin-name">
          ({{ auth.adminActual()?.nombre }} {{ auth.adminActual()?.apellido }})
        </span>
      </h2>

      <ul class="menu">
        <li class="menu__li">
          <i class="fas fa-3x fa-circle-check"></i>
          <a routerLink="/admin/planillas">Confirmar Planillas</a>
        </li>
        <li class="menu__li">
          <i class="fas fa-3x fa-database"></i>
          <a routerLink="/admin/resultados">Cargar Resultados</a>
        </li>
        <li class="menu__li">
          <i class="fas fa-3x fa-trophy"></i>
          <a routerLink="/admin/consultar-predicciones">Consultar Predicciones</a>
        </li>
        <li class="menu__li">
          <i class="fas fa-3x fa-trophy"></i>
          <a routerLink="/admin/podio">Ver Podio</a>
        </li>
        <li class="menu__li" (click)="auth.logout()" style="cursor:pointer">
          <i class="fas fa-3x fa-right-from-bracket"></i>
          <span>Salir</span>
        </li>
      </ul>
    </main>
  `,
  styles: [`
    .admin-name { font-size: 0.8rem; color: #888; font-weight: normal; }
    .menu { grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    @media (max-width: 768px) {
      .menu { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 480px) {
      .menu { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent {
  auth = inject(AuthService);
}
