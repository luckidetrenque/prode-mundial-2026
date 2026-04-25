// src/app/core/services/resultado.service.ts
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
  guardar(partidoId: number, resultado: string): Observable<Resultado> {
    return this.http.put<Resultado>(`${this.apiUrl}/${partidoId}`, { resultado });
  }
}
