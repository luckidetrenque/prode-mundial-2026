// src/app/core/services/estadistica.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EstadisticaPartido } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class EstadisticaService {

  private apiUrl = `${environment.apiUrl}/estadisticas`;

  constructor(private http: HttpClient) {}

  // GET /api/estadisticas → estadísticas reales calculadas por el backend
  getEstadisticas(): Observable<EstadisticaPartido[]> {
    return this.http.get<EstadisticaPartido[]>(this.apiUrl);
  }
}
