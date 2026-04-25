// src/app/core/services/posicion.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Posicion } from '../../shared/models/posicion.model';

@Injectable({ providedIn: 'root' })
export class PosicionService {

  private apiUrl = `${environment.apiUrl}/posiciones`;

  constructor(private http: HttpClient) {}

  // GET /api/posiciones → tabla de posiciones calculada por el backend
  getPosiciones(): Observable<Posicion[]> {
    return this.http.get<Posicion[]>(this.apiUrl);
  }
}
