// FIX #3: El backend devuelve ResultadoDTO que NO incluye el campo id.
// Se elimina para evitar confusión y accesos erróneos a un campo undefined.
import { ResultadoPrediccion } from './common.model';

export interface Resultado {
  partido: {
    id: number;
    numero: number;
  };
  resultado: ResultadoPrediccion;
  golesLocal?: number;
  golesVisitante?: number;
}