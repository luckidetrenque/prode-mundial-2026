// FIX #16: ResultadoPrediccion es un tipo genérico usado por planilla Y resultado.
// No debe vivir en planilla.model.ts. Se extrae a common.model.ts.
export type ResultadoPrediccion = 'LOCAL' | 'EMPATE' | 'VISITANTE';