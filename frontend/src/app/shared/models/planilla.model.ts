export type ResultadoPrediccion = 'LOCAL' | 'EMPATE' | 'VISITANTE';

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