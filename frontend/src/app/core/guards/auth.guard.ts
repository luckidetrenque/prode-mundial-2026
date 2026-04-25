// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Guard funcional: devuelve true (puede entrar) o redirige al login
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.estaAutenticado()) {
    return true;  // el usuario tiene token válido, puede entrar
  }

  // Si no está autenticado, redirige al login
  router.navigate(['/admin/login']);
  return false;
};
