// src/app/core/services/planilla.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PlanillaRequest, PlanillaResponse } from '../../shared/models/planilla.model';

@Injectable({ providedIn: 'root' })
export class PlanillaService {

  private apiUrl = `${environment.apiUrl}/planillas`;
  private adminUrl = `${environment.apiUrl}/admin/planillas`;

  constructor(private http: HttpClient) {}

  // POST /api/planillas → guarda una nueva planilla (público)
  guardar(planilla: PlanillaRequest): Observable<PlanillaResponse> {
    return this.http.post<PlanillaResponse>(this.apiUrl, planilla);
  }

  // GET /api/planillas → lista planillas confirmadas (público)
  listar(): Observable<PlanillaResponse[]> {
    return this.http.get<PlanillaResponse[]>(this.apiUrl);
  }

  // GET /api/planillas/:codigo → obtiene una planilla por código (público)
  obtener(codigo: number): Observable<PlanillaResponse> {
    return this.http.get<PlanillaResponse>(`${this.apiUrl}/${codigo}`);
  }

  // GET /api/admin/planillas → lista TODAS (confirmadas y no confirmadas) — solo admin
  listarTodas(): Observable<PlanillaResponse[]> {
    return this.http.get<PlanillaResponse[]>(this.adminUrl);
  }

  // PUT /api/planillas/:id/confirmar → confirma una planilla (solo admin)
  confirmar(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/confirmar`, {});
  }
}
