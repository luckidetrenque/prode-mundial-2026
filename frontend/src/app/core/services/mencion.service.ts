// frontend/src/app/core/services/mencion.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MencionesResponse } from '../../shared/models/menciones.model';

@Injectable({ providedIn: 'root' })
export class MencionService {
  private apiUrl = `${environment.apiUrl}/posiciones/menciones`;

  constructor(private http: HttpClient) {}

  getMenciones(): Observable<MencionesResponse> {
    return this.http.get<MencionesResponse>(this.apiUrl);
  }
}