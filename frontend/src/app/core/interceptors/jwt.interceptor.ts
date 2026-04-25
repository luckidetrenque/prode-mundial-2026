// src/app/core/interceptors/jwt.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

// Un interceptor funcional (sin clase) intercepta TODOS los requests HTTP
// y puede modificarlos antes de enviarlos al backend
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Si hay token, lo agregamos al header Authorization
  if (token) {
    // req.clone() crea una copia del request con el header agregado
    // No podemos modificar el request original (es inmutable)
    const reqConToken = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(reqConToken);
  }

  // Si no hay token, enviamos el request sin modificar
  return next(req);
};
