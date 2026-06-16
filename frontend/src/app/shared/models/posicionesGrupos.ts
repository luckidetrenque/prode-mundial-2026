// Copia aquí las interfaces que definimos para los equipos
export interface FilaPosicionDTO {
    nombreEquipo: string;
    puntos: number;
    partidosJugados: number;
    partidosGanados: number;
    partidosEmpatados: number;
    partidosPerdidos: number;
    golesFavor: number;
    golesContra: number;
    diferenciaGoles: number;
    banderaUrl: string;
}

export interface GrupoPosicionesDTO {
    nombreGrupo: string;
    equipos: FilaPosicionDTO[];
}