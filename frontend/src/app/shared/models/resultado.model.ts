import { ResultadoPrediccion } from './planilla.model';

export interface Resultado {
  id: number;
  partido: {
    id: number;
    numero: number;
  };
  resultado: ResultadoPrediccion;
}