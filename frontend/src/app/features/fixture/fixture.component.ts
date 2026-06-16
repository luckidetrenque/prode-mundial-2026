// fixture.component.ts — VERSIÓN MEJORADA
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PartidoService } from '../../core/services/partido.service';
import { ResultadoService } from '../../core/services/resultado.service';
import { Partido } from '../../shared/models/partido.model';
import { ShortCountryPipe } from '../../shared/pipes/short-country.pipe';

export interface EquipoPosicion {
  nombre: string;
  bandera: string;
  grupo: string;
  puntos: number;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dif: number;
}
type VistaFiltro = 'GRUPOS' | 'DIECISEISAVOS' | 'OCTAVOS' | 'CUARTOS' | 'SEMIFINAL' | 'FINAL';

@Component({
  selector: 'app-fixture',
  standalone: true,
  imports: [CommonModule, DatePipe, ShortCountryPipe, RouterLink],
  templateUrl: './fixture.component.html',
  styleUrls: ['./fixture.component.css']
})
export class FixtureComponent implements OnInit {

  cargando = signal(true);
  tabActual = signal<'PARTIDOS' | 'POSICIONES'>('PARTIDOS');
  filtroActual = signal<VistaFiltro>('GRUPOS');
  grupoActivo = signal<string | null>(null);

  private todosLosPartidos: Partido[] = [];
  private resultadosSignal = signal<any[]>([]);
  private golesSignal = signal<Record<number, { local: number | null, visitante: number | null }>>({});

  grupos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  fases = [
    { valor: 'GRUPOS' as VistaFiltro, label: 'Grupos', icono: 'fas fa-layer-group' },
    { valor: 'DIECISEISAVOS' as VistaFiltro, label: '16avos', icono: 'fas fa-futbol' },
    { valor: 'OCTAVOS' as VistaFiltro, label: 'Octavos', icono: 'fas fa-futbol' },
    { valor: 'CUARTOS' as VistaFiltro, label: 'Cuartos', icono: 'fas fa-futbol' },
    { valor: 'SEMIFINAL' as VistaFiltro, label: 'Semis', icono: 'fas fa-futbol' },
    { valor: 'FINAL' as VistaFiltro, label: 'Final', icono: 'fas fa-star' },
  ];

  partidosFiltrados = computed(() =>
    this.todosLosPartidos.filter(p => p.fase === this.filtroActual())
  );

  cantidadFiltrada = computed(() => this.partidosFiltrados().length);

  constructor(private partidoService: PartidoService, private resultadoService: ResultadoService) { }

  gruposStandings = computed(() => {
    const partidos = this.todosLosPartidos;
    const resultados = this.resultadosSignal();

    const standMap = new Map<string, EquipoPosicion>();

    // Inicializar
    partidos.forEach(p => {
      if (p.equipoLocalShow && !standMap.has(p.equipoLocalShow)) {
        standMap.set(p.equipoLocalShow, {
          nombre: p.equipoLocalShow as string, bandera: p.equipoLocalBandera || '', grupo: p.grupo || '',
          puntos: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0
        });
      }
      if (p.equipoVisitanteShow && !standMap.has(p.equipoVisitanteShow)) {
        standMap.set(p.equipoVisitanteShow, {
          nombre: p.equipoVisitanteShow as string, bandera: p.equipoVisitanteBandera || '', grupo: p.grupo || '',
          puntos: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0
        });
      }
    });

    // Procesar
    resultados.forEach(r => {
      const p = partidos.find(x => x.id === r.partido.id);
      if (!p || !p.equipoLocalShow || !p.equipoVisitanteShow) return;

      const local = standMap.get(p.equipoLocalShow)!;
      const visit = standMap.get(p.equipoVisitanteShow)!;

      local.pj++; visit.pj++;
      const gl = r.golesLocal ?? 0;
      const gv = r.golesVisitante ?? 0;
      local.gf += gl; local.gc += gv;
      visit.gf += gv; visit.gc += gl;

      if (r.resultado === 'LOCAL') {
        local.puntos += 3; local.pg++; visit.pp++;
      } else if (r.resultado === 'EMPATE') {
        local.puntos += 1; local.pe++;
        visit.puntos += 1; visit.pe++;
      } else if (r.resultado === 'VISITANTE') {
        visit.puntos += 3; visit.pg++; local.pp++;
      }
    });

    Array.from(standMap.values()).forEach(t => t.dif = t.gf - t.gc);

    const byGroup: Record<string, EquipoPosicion[]> = {};
    Array.from(standMap.values()).forEach(t => {
      if (!byGroup[t.grupo]) byGroup[t.grupo] = [];
      byGroup[t.grupo].push(t);
    });

    // Ordenar (Pts > Dif > GF > H2H)
    Object.keys(byGroup).forEach(grupo => {
      byGroup[grupo].sort((a, b) => {
        if (a.puntos !== b.puntos) return b.puntos - a.puntos;
        if (a.dif !== b.dif) return b.dif - a.dif;
        if (a.gf !== b.gf) return b.gf - a.gf;

        // H2H
        const tiedMatches = resultados.filter(r => {
          const p = partidos.find(x => x.id === r.partido.id);
          return p && ((p.equipoLocalShow === a.nombre && p.equipoVisitanteShow === b.nombre) ||
            (p.equipoLocalShow === b.nombre && p.equipoVisitanteShow === a.nombre));
        });

        if (tiedMatches.length > 0) {
          const tm = tiedMatches[0];
          const matchP = partidos.find(x => x.id === tm.partido.id)!;
          if (tm.resultado === 'LOCAL') return matchP.equipoLocalShow === a.nombre ? -1 : 1;
          if (tm.resultado === 'VISITANTE') return matchP.equipoVisitanteShow === a.nombre ? -1 : 1;
        }
        return 0;
      });
    });

    return byGroup;
  });

  mejoresTerceros = computed(() => {
    const stands = this.gruposStandings();
    const terceros: EquipoPosicion[] = [];
    Object.keys(stands).forEach(grupo => {
      if (stands[grupo].length >= 3) terceros.push(stands[grupo][2]);
    });
    return terceros.sort((a, b) => {
      if (a.puntos !== b.puntos) return b.puntos - a.puntos;
      if (a.dif !== b.dif) return b.dif - a.dif;
      return b.gf - a.gf;
    });
  });

  ngOnInit(): void {
    forkJoin({
      partidos: this.partidoService.getPartidos(),
      resultados: this.resultadoService.getResultados()
    }).subscribe({
      next: ({ partidos, resultados }) => {
        this.todosLosPartidos = partidos;

        const goles: Record<number, { local: number | null, visitante: number | null }> = {};
        resultados.forEach(r => {
          goles[r.partido.id] = { local: r.golesLocal ?? null, visitante: r.golesVisitante ?? null };
        });
        this.golesSignal.set(goles);
        this.resultadosSignal.set(resultados);

        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  getGolesLocal(partidoId: number): number | null {
    return this.golesSignal()[partidoId]?.local ?? null;
  }

  getGolesVisitante(partidoId: number): number | null {
    return this.golesSignal()[partidoId]?.visitante ?? null;
  }

  gruposMostrados(): string[] {
    const activo = this.grupoActivo();
    if (activo) return [activo];
    return this.grupos;
  }

  getPartidosPorGrupo(grupo: string): Partido[] {
    return this.todosLosPartidos.filter(p => p.grupo === grupo);
  }

  getEquiposDelGrupo(grupo: string): { nombre: string, bandera: string }[] {
    const partidos = this.getPartidosPorGrupo(grupo);
    const equipos = new Map<string, string>();
    partidos.forEach(p => {
      if (p.equipoLocalShow) equipos.set(p.equipoLocalShow, p.equipoLocalBandera);
      if (p.equipoVisitanteShow) equipos.set(p.equipoVisitanteShow, p.equipoVisitanteBandera);
    });
    return Array.from(equipos.entries()).map(([nombre, bandera]) => ({ nombre, bandera }));
  }

  esJugado(partido: Partido): boolean {
    const fechaHora = new Date(partido.fechaHora);
    const horaFinal = new Date(fechaHora.getTime() + 2 * 60 * 60 * 1000);
    return new Date() >= horaFinal;
  }

  esJugando(partido: Partido): boolean {
    const fechaHora = new Date(partido.fechaHora);
    const horaFinal = new Date(fechaHora.getTime() + 2 * 60 * 60 * 1000);
    const ahora = new Date();
    return ahora >= fechaHora && ahora < horaFinal;
  }

  esHoy(partido: Partido): boolean {
    const fechaPartido = new Date(partido.fechaHora);
    const hoy = new Date();
    return (
      fechaPartido.getFullYear() === hoy.getFullYear() &&
      fechaPartido.getMonth() === hoy.getMonth() &&
      fechaPartido.getDate() === hoy.getDate()
    );
  }

  formatEstadio(sede: string): string {
    if (!sede) return '';
    return sede.replace(/ Stadium/gi, '').trim();
  }
}
