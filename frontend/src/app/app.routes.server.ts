import { RenderMode, ServerRoute } from '@angular/ssr';

// FIX #5: La ruta /planillas/:codigo tiene parámetro dinámico y no puede
// pre-renderizarse (Prerender) porque Angular SSR no conoce los códigos en build time.
// Las rutas de admin tampoco deben pre-renderizarse (requieren auth con localStorage).
// Se usa Server para rutas dinámicas/protegidas y Prerender para las estáticas.
export const serverRoutes: ServerRoute[] = [
  // Rutas con parámetros dinámicos → renderizado en el servidor por request
  {
    path: 'planillas/:codigo',
    renderMode: RenderMode.Server,
  },
  // Rutas de admin → siempre server-side (dependen de estado de auth)
  {
    path: 'admin',
    renderMode: RenderMode.Server,
  },
  {
    path: 'admin/resultados',
    renderMode: RenderMode.Server,
  },
  {
    path: 'admin/planillas',
    renderMode: RenderMode.Server,
  },
  {
    path: 'admin/login',
    renderMode: RenderMode.Server,
  },
  // Rutas públicas → renderizado en el servidor (evita errores de prerender en build)
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];