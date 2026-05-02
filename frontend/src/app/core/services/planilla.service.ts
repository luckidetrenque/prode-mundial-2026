// FIX #4: El parámetro de confirmar() se llamaba "id" pero semánticamente es
// el "código" visible de la planilla (lo que el backend espera en la URL).
// Se renombra para evitar confusión futura si se agrega un endpoint por ID real.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PlanillaRequest, PlanillaResponse } from '../../shared/models/planilla.model';

@Injectable({ providedIn: 'root' })
export class PlanillaService {

  private apiUrl   = `${environment.apiUrl}/planillas`;
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

  // GET /api/admin/planillas → lista TODAS — solo admin
  listarTodas(): Observable<PlanillaResponse[]> {
    return this.http.get<PlanillaResponse[]>(this.adminUrl);
  }

  // PUT /api/planillas/:codigo/confirmar → confirma una planilla (solo admin)
  // FIX #4: parámetro renombrado de "id" a "codigo" para reflejar la semántica real.
  // El backend busca por código (findByCodigo), no por ID interno de la tabla.
  confirmar(codigo: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${codigo}/confirmar`, {});
  }

  // GET /api/admin/planillas/pendientes/count
  getPendientesCount(): Observable<number> {
    return this.http.get<number>(`${this.adminUrl}/pendientes/count`);
  }
}