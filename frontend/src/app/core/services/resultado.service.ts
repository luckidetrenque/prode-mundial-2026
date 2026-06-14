// src/app/core/services/resultado.service.ts — MEJORADO
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Resultado } from '../../shared/models/resultado.model';

@Injectable({ providedIn: 'root' })
export class ResultadoService {

  private apiUrl = `${environment.apiUrl}/resultados`;

  constructor(private http: HttpClient) {}

  // GET /api/resultados → lista resultados cargados (público)
  getResultados(): Observable<Resultado[]> {
    return this.http.get<Resultado[]>(this.apiUrl);
  }

  // PUT /api/resultados/:partidoId → carga o actualiza un resultado (solo admin)
  guardar(partidoId: number, resultado: string, golesLocal?: number | null, golesVisitante?: number | null): Observable<Resultado> {
    const payload: any = { resultado };
    if (golesLocal != null) payload.golesLocal = golesLocal;
    if (golesVisitante != null) payload.golesVisitante = golesVisitante;
    return this.http.put<Resultado>(`${this.apiUrl}/${partidoId}`, payload);
  }

  // DELETE /api/resultados/grupo/:grupo → resetea todos los resultados de un grupo (solo admin)
  resetearGrupo(grupo: string): Observable<{ mensaje: string; eliminados: number }> {
    return this.http.delete<{ mensaje: string; eliminados: number }>(
      `${this.apiUrl}/grupo/${grupo}`
    );
  }

  // DELETE /api/resultados/reset-all → resetea TODOS los resultados (solo admin, con precaución)
  resetearTodos(): Observable<{ mensaje: string; eliminados: number }> {
    return this.http.delete<{ mensaje: string; eliminados: number }>(
      `${this.apiUrl}/reset-all`
    );
  }

  // DELETE /api/resultados/:partidoId → elimina un resultado específico (solo admin)
  eliminar(partidoId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${partidoId}`);
  }
}
