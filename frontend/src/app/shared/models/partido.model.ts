// Espejo del PartidoDTO de Spring Boot
export interface Partido {
  id: number;
  numero: number;
  equipoLocalNombre: string;
  equipoLocalShow: string;
  equipoLocalBandera: string;
  equipoVisitanteNombre: string;
  equipoVisitanteShow: string;
  equipoVisitanteBandera: string;
  fase: 'GRUPOS' | 'OCTAVOS' | 'CUARTOS' | 'SEMIFINAL' | 'TERCER_PUESTO' | 'FINAL';
  grupo: string | null;     // "A".."L" o null en eliminatorias
  jornada: number | null;   // 1, 2 o 3
  fechaHora: string;        // ISO 8601: "2026-06-11T16:00:00"
  sede: string;
}