// src/app/core/services/partido.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Partido } from '../../shared/models/partido.model';

@Injectable({ providedIn: 'root' })
export class PartidoService {

  private apiUrl = `${environment.apiUrl}/partidos`;

  constructor(private http: HttpClient) {}

  // GET /api/partidos → devuelve todos los partidos (104 en la fase completa)
  getPartidos(): Observable<Partido[]> {
    return this.http.get<Partido[]>(this.apiUrl);
  }

  // GET /api/partidos/:id
  getPartidoPorId(id: number): Observable<Partido> {
    return this.http.get<Partido>(`${this.apiUrl}/${id}`);
  }
}
