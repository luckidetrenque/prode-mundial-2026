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
  const token = authService.getToken();

  // Si hay token, lo agregamos al header Authorization
  const reqConToken = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(reqConToken).pipe(
    catchError((error: HttpErrorResponse) => {
      // ── FIX BUG #2 ─────────────────────────────────────────────────────────
      // Cuando el JWT expiró o es inválido, el backend devuelve 401 o 403.
      // En lugar de fallar silenciosamente (causando el "deslogueo fantasma"),
      // llamamos logout() para limpiar localStorage y redirigir al login.
      //
      // Excluimos el endpoint de login para no hacer logout en credenciales
      // incorrectas (que también devuelven 401 desde AuthService).
      // ───────────────────────────────────────────────────────────────────────
      if (
        (error.status === 401 || error.status === 403) &&
        !req.url.includes('/auth/login')
      ) {
        authService.logout();
      }

      return throwError(() => error);
    })
  );
};
