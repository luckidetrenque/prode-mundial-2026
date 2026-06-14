// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [

  // Redirige la raíz a /home
  { path: '', redirectTo: 'fixture', pathMatch: 'full' },

  // ── Rutas públicas ──────────────────────────────────────────────────────
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'fixture',
    loadComponent: () =>
      import('./features/fixture/hoy.component').then(m => m.HoyComponent)
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

  {
    path: 'fixture/completo',
    loadComponent: () =>
      import('./features/fixture/fixture.component').then(m => m.FixtureComponent)
  },

  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },

  // Ruta de error 404
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
