// src/app/core/guards/auth.guard.ts
// FIX #21: Durante el renderizado SSR (Node.js), localStorage no existe.
// El guard original llamaba authService.estaAutenticado() que a su vez
// accede a adminActual() — inicializado desde localStorage en el constructor.
//
// AuthService ya tiene isPlatformBrowser en cargarUsuarioGuardado(),
// por lo que en SSR adminActual() siempre es null.
// Resultado: todas las rutas admin se redirigen al login durante el prerender,
// generando warnings en el build y posibles redirects incorrectos.
//
// Solución: el guard detecta el contexto de plataforma explícitamente.
// En SSR devuelve false sin redirigir (la navegación no aplica en server).
// En browser mantiene la lógica original.

import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const platformId  = inject(PLATFORM_ID);
  const authService = inject(AuthService);
  const router      = inject(Router);

  // FIX #21: En SSR (Node.js) no hay sesión ni localStorage.
  // Devolvemos false sin redirigir — el redirect causaría un loop
  // o navegación inválida durante el prerender del build.
  if (!isPlatformBrowser(platformId)) {
    return false;
  }

  if (authService.estaAutenticado()) {
    return true;
  }

  router.navigate(['/admin/login']);
  return false;
};