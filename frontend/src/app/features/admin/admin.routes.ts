// features/admin/admin.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const ADMIN_ROUTES: Routes = [
    {
        path: '', // Este es el dashboard
        canActivate: [authGuard],
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
    },
    {
        path: 'resultados',
        canActivate: [authGuard],
        loadComponent: () => import('./cargar-resultados/cargar-resultados.component').then(m => m.CargarResultadosComponent)
    },
    {
        path: 'planillas',
        canActivate: [authGuard],
        loadComponent: () => import('./confirmar-planillas/confirmar-planillas.component').then(m => m.ConfirmarPlanillasComponent)
    },
    {
        path: 'consultar-predicciones',
        loadComponent: () => import('./consultar-predicciones/consultar-predicciones.component').then(m => m.ConsultarPrediccionesComponent)
    },
    {
        path: 'podio',
        canActivate: [authGuard],
        loadComponent: () => import('./ver-podio/ver-podio.component').then(m => m.VerPodioComponent)
    },
    {
        path: 'login',
        loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
    }
];