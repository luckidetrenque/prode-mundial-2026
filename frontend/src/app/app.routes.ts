// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [

  // Redirige la raíz a /home
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // ── Rutas públicas ──────────────────────────────────────────────────────
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'fixture',
    loadComponent: () =>
      import('./features/fixture/fixture.component').then(m => m.FixtureComponent)
  },
  {
    path: 'planilla',
    loadComponent: () =>
      import('./features/planilla/planilla.component').then(m => m.PlanillaComponent)
  },
  {
    path: 'resultados',
    loadComponent: () =>
      import('./features/resultados/resultados.component').then(m => m.ResultadosComponent)
  },
  {
    path: 'posiciones',
    loadComponent: () =>
      import('./features/posiciones/posiciones.component').then(m => m.PosicionesComponent)
  },
  {
    path: 'estadisticas',
    loadComponent: () =>
      import('./features/estadisticas/estadisticas.component').then(m => m.EstadisticasComponent)
  },
  {
    path: 'participantes',
    loadComponent: () =>
      import('./features/participantes/participantes.component').then(m => m.ParticipantesComponent)
  },
  {
    // Ruta para ver una planilla específica (enlazada desde posiciones y participantes)
    path: 'planillas/:codigo',
    loadComponent: () =>
      import('./features/planilla-detalle/planilla-detalle.component')
        .then(m => m.PlanillaDetalleComponent)
  },

  {
    path: 'reglamento',
    loadComponent: () =>
      import('./features/reglamento/reglamento.component')
        .then(m => m.ReglamentoComponent)
  },

  // ── Rutas de admin ──────────────────────────────────────────────────────
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'admin/resultados',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/cargar-resultados/cargar-resultados.component')
        .then(m => m.CargarResultadosComponent)
  },
  {
    path: 'admin/planillas',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/confirmar-planillas/confirmar-planillas.component')
        .then(m => m.ConfirmarPlanillasComponent)
  },

  // Ruta de error 404
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
