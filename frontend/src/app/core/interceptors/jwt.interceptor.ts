// jwt.interceptor.ts — CORREGIDO
// Agrega el token JWT a todos los requests Y maneja expiración (Bug #2):
// si el backend responde 401 o 403, llama logout() automáticamente
// para limpiar el estado y redirigir al login.
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  // Ya no agregamos el header Authorization manualmente.
  // El navegador enviará la cookie prode_token automáticamente
  // siempre que la petición sea "withCredentials: true".
  const reqConCredenciales = req.clone({
    withCredentials: true
  });

  return next(reqConCredenciales).pipe(
    catchError((error: HttpErrorResponse) => {
      // ── FIX BUG #2 ─────────────────────────────────────────────────────────
      // Cuando el JWT expiró o es inválido, el backend devuelve 401 o 403.
      // En lugar de fallar silenciosamente (causando el "deslogueo fantasma"),
      // llamamos logout() para limpiar localStorage y redirigir al login.
      //
      // Excluimos el endpoint de login para no hacer logout en credenciales
      // incorrectas (que también devuelven 401 desde AuthService).
      // ───────────────────────────────────────────────────────────────────────
      const isAdminRequest =
        req.url.includes('/admin/') ||
        (req.url.includes('/resultados') && (req.method === 'PUT' || req.method === 'DELETE')) ||
        (req.url.includes('/confirmar') && req.method === 'PUT');

      if (
        (error.status === 401 || (error.status === 403 && isAdminRequest)) &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/logout')
      ) {
        authService.logout();
      }

      return throwError(() => error);
    })
  );
};
