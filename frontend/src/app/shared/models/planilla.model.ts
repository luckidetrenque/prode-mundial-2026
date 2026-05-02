// FIX #16: ResultadoPrediccion movido a common.model.ts
// Se re-exporta acá para no romper imports existentes en el proyecto.
import type { ResultadoPrediccion } from './common.model';
export type { ResultadoPrediccion };

export interface PrediccionItem {
  partidoId: number;
  prediccion: ResultadoPrediccion;
}

// Lo que Angular ENVÍA al backend
export interface PlanillaRequest {
  nombre: string;
  apellido: string;
  email: string;
  predicciones: PrediccionItem[];
}

// Lo que Angular RECIBE del backend
export interface PlanillaResponse {
  codigo: number;
  nombre: string;
  apellido: string;
  email: string;
  confirmada: boolean;
  mensaje: string | null;
  predicciones?: PrediccionItem[];
}