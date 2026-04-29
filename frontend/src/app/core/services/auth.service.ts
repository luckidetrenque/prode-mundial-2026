// src/app/core/services/auth.service.ts
import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, AdminUser } from '../../shared/models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly USER_KEY  = 'prode_user';
  private readonly apiUrl    = environment.apiUrl;
  private readonly platformId = inject(PLATFORM_ID);

  // signal() → estado reactivo de Angular 17+
  adminActual = signal<AdminUser | null>(this.cargarUsuarioGuardado());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, credenciales)
      .pipe(
        tap(response => {
          if (isPlatformBrowser(this.platformId)) {
            const admin: AdminUser = {
              email: credenciales.email,
              nombre: response.nombre,
              apellido: response.apellido
            };
            localStorage.setItem(this.USER_KEY, JSON.stringify(admin));
            this.adminActual.set(admin);
          }
        })
      );
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe({
      next: () => this.limpiarEstadoLocal(),
      error: () => this.limpiarEstadoLocal()
    });
  }

  private limpiarEstadoLocal(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.USER_KEY);
    }
    this.adminActual.set(null);
    this.router.navigate(['/admin/login']);
  }

  estaAutenticado(): boolean {
    return this.adminActual() !== null;
  }

  private cargarUsuarioGuardado(): AdminUser | null {
    if (isPlatformBrowser(this.platformId)) {
      const json = localStorage.getItem(this.USER_KEY);
      return json ? JSON.parse(json) : null;
    }
    return null;
  }
}
