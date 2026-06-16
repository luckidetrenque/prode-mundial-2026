// frontend/src/app/shared/models/menciones.model.ts
export interface ParticipanteResumen {
  nombre: string;
  apellido: string;
  codigoPlanilla: number;
}

export interface Mencion {
  tipo: string;
  emoji: string;
  titulo: string;
  descripcion: string;
  participantes: ParticipanteResumen[];
}

export interface MencionesResponse {
  menciones: Mencion[];
  ultimaActualizacion: string;
  hayDatos: boolean;
}