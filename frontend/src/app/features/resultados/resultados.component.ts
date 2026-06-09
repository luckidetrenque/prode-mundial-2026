// resultados.component.ts
// FIX #1: this.selecciones era un Map<number, string> plano (no reactivo),
// inconsistente con el patrón establecido en cargar-resultados.component.ts
// que usa signal<Record<number, string>> después del FIX #17 original.
//
// En este componente la UI es de solo lectura (no hay edición), por lo que
// el Map funcionaba correctamente — los datos se cargan una sola vez en
// ngOnInit y no cambian. Sin embargo, mantener el patrón consistente con el
// resto de la app facilita el mantenimiento y evita confusión futura sobre
// qué estructura usar en cada componente.
//
// Cambio: Map<number, string> → signal<Record<number, string>>
// getSeleccion() lee del signal en lugar del Map.
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { PartidoService } from '../../core/services/partido.service';
import { ResultadoService } from '../../core/services/resultado.service';
import { Partido } from '../../shared/models/partido.model';
import { TorneoService } from '../../core/services/torneo.service';
import { SplashBienvenidaComponent } from '../../shared/components/splash-bienvenida/splash-bienvenida.component';

const GRUPOS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [CommonModule, SplashBienvenidaComponent],
  template: `
    <main class="main">
      @if (torneoService.tiempoExpirado()) {
        <app-splash-bienvenida />
      }
      <h2><i class="fas fa-futbol" aria-hidden="true"></i> Resultados de los Partidos</h2>
      <p class="subtitulo">
        <i class="fas fa-circle-info" style="color:var(--clr-primary-light);font-size:0.8rem"></i>
        Consultá los resultados oficiales de los partidos de la fase de grupos.
      </p>

      @if (cargando()) {
        <div class="spinner-container" role="status" aria-label="Cargando datos...">
          <div class="spinner"></div>
        </div>
      }

      @if (!cargando() && resultadosGuardados().size === 0) {
        <div class="estado-vacio">
          <i class="fas fa-futbol icono-vacio"></i>
          <p class="titulo-vacio">Aún no hay resultados</p>
          <p class="desc-vacio">Los resultados oficiales de los partidos aparecerán aquí a medida que se jueguen.</p>
        </div>
      }

      @if (!cargando() && partidos().length > 0 && resultadosGuardados().size > 0) {
  
        <!-- Resumen de progreso -->
        <div class="stats-overview">
          <div class="overview-card">
            <i class="fas fa-futbol" aria-hidden="true"></i>
            <div class="overview-data">
              <span class="overview-num">{{ partidos().length }}</span>
              <span class="overview-label">Partidos Totales</span>
            </div>
          </div>
          <div class="overview-card">
            <i class="fas fa-check-double" aria-hidden="true"></i>
            <div class="overview-data">
              <span class="overview-num">{{ resultadosGuardados().size }}</span>
              <span class="overview-label">Jugados</span>
            </div>
          </div>
          <div class="overview-card">
            <i class="fas fa-clock" aria-hidden="true"></i>
            <div class="overview-data">
              <span class="overview-num">{{ partidos().length - resultadosGuardados().size }}</span>
              <span class="overview-label">Por Jugar</span>
            </div>
          </div>
          <div class="overview-card">
            <i class="fas fa-chart-pie" aria-hidden="true"></i>
            <div class="overview-data">
              <span class="overview-num">
                {{ (partidos().length ? (resultadosGuardados().size / partidos().length * 100) : 0) | number:'1.0-0' }}%
              </span>
              <span class="overview-label">Avance</span>
            </div>
          </div>
        </div>

        <!-- Filtro de grupo -->
        <div class="filtro-grupos" role="group" aria-label="Filtrar por grupo">
          <button
            type="button"
            class="btn-grupo"
            [class.activo]="grupoActivo() === null"
            [attr.aria-pressed]="grupoActivo() === null"
            (click)="grupoActivo.set(null)"
          >
            Todos
          </button>
          @for (g of grupos; track g) {
            <button
              type="button"
              class="btn-grupo"
              [class.activo]="grupoActivo() === g"
              [class.completo]="grupoCompleto(g)"
              [attr.aria-pressed]="grupoActivo() === g"
              [attr.aria-label]="'Grupo ' + g + (grupoCompleto(g) ? ' — completo' : '')"
              (click)="grupoActivo.set(g)"
            >
              {{ g }}
              @if (grupoCompleto(g)) {
                <i class="fas fa-check" aria-hidden="true" style="font-size:0.6rem"></i>
              }
            </button>
          }
          <div class="referencia-estados">
            <span class="ref-item"><i class="fas fa-check-circle" style="color:var(--clr-success-text)"></i> Finalizado</span>
            <span class="ref-item"><i class="fas fa-clock" style="color:var(--clr-text-muted)"></i> Pendiente</span>
          </div>
        </div>

        <!-- Partidos por grupo -->
        @for (grupo of gruposMostrados(); track grupo) {
          @if (getPartidosPorGrupo(grupo).length > 0) {
            <div class="grupo-bloque" role="region" [attr.aria-label]="'Grupo ' + grupo">

              <div class="grupo-header">
                <div class="header-main">
                  <span class="grupo-tag">GRUPO {{ grupo }}</span>
                  <span class="grupo-estado">
                    {{ contarGuardadosEnGrupo(grupo) }}/{{ getPartidosPorGrupo(grupo).length }} jugados
                  </span>
                </div>
                <div class="group-teams-mobile">
                  @for (eq of getEquiposDelGrupo(grupo); track eq.nombre) {
                    <div class="mobile-team-item">
                      <img [src]="eq.bandera" [alt]="eq.nombre" class="flag-mini" />
                      <span class="team-name-mini">{{ eq.nombre }}</span>
                    </div>
                  }
                </div>
              </div>

              <div class="partidos-lista">
                @for (partido of getPartidosPorGrupo(grupo); track partido.id) {
                  <div
                    class="partido-row"
                    [class.guardado]="resultadosGuardados().has(partido.id)"
                  >
                    <span class="partido-n" aria-hidden="true">#{{ partido.numero }}</span>

                    <div class="partido-equipo partido-equipo--local">
                      <span class="equipo-txt">{{ partido.equipoLocalShow }}</span>
                      <img
                        [src]="partido.equipoLocalBandera"
                        [alt]="'Bandera de ' + partido.equipoLocalShow"
                        class="flag"
                        width="24"
                        height="16"
                      />
                    </div>

                    <div
                      class="opciones-resultado"
                      role="group"
                      [attr.aria-label]="'Resultado del partido ' + partido.numero"
                    >
                      <button
                        type="button"
                        class="opcion-btn"
                        [class.activa-local]="getSeleccion(partido.id) === 'LOCAL'"
                        [class.opaca]="resultadosGuardados().has(partido.id) && getSeleccion(partido.id) !== 'LOCAL'"
                        disabled
                        aria-hidden="true"
                      >L</button>
                      <button
                        type="button"
                        class="opcion-btn"
                        [class.activa-empate]="getSeleccion(partido.id) === 'EMPATE'"
                        [class.opaca]="resultadosGuardados().has(partido.id) && getSeleccion(partido.id) !== 'EMPATE'"
                        disabled
                        aria-hidden="true"
                      >E</button>
                      <button
                        type="button"
                        class="opcion-btn"
                        [class.activa-visitante]="getSeleccion(partido.id) === 'VISITANTE'"
                        [class.opaca]="resultadosGuardados().has(partido.id) && getSeleccion(partido.id) !== 'VISITANTE'"
                        disabled
                        aria-hidden="true"
                      >V</button>
                    </div>

                    <div class="partido-equipo partido-equipo--visit">
                      <img
                        [src]="partido.equipoVisitanteBandera"
                        [alt]="'Bandera de ' + partido.equipoVisitanteShow"
                        class="flag"
                        width="24"
                        height="16"
                      />
                      <span class="equipo-txt">{{ partido.equipoVisitanteShow }}</span>
                    </div>

                    <div class="partido-accion">
                      @if (resultadosGuardados().has(partido.id)) {
                        <span class="badge-status badge-finalizado" title="Finalizado">
                          <i class="fas fa-check-circle" aria-hidden="true"></i>
                        </span>
                      } @else {
                        <span class="badge-status badge-pendiente" title="Pendiente">
                          <i class="fas fa-clock" aria-hidden="true"></i>
                        </span>
                      }
                    </div>

                  </div>
                }
              </div>

            </div>
          }
        }

      }
    </main>
  `,
  styles: [`
    /* ── Referencia de estados ───────────────────────────────────────────── */
    .referencia-estados {
      display: flex;
      gap: var(--spacing-md);
      padding: var(--spacing-sm) var(--spacing-md);
      background: var(--clr-surface-alt);
      border-radius: var(--radius-md);
      width: fit-content;
    }

    .ref-item {
      display: flex;
      align-items: center;
      gap: 0.5em;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--clr-text-muted);
    }

    /* ── Grupo bloque ────────────────────────────────────────────────────── */
    .grupo-bloque { margin-bottom: 2em; }

    .grupo-header {
      display: flex;
      align-items: center;
      gap: 0.75em;
      margin-bottom: 0.6em;
    }

    .grupo-estado {
      font-size: 0.75rem;
      color: var(--clr-text-muted);
    }

    .group-teams-mobile { display: none; }

    /* ── Lista de partidos ───────────────────────────────────────────────── */
    .partidos-lista {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-sm);
    }

    @media (max-width: 900px) {
      .partidos-lista { grid-template-columns: 1fr; }
    }

    /* ── Fila de partido ─────────────────────────────────────────────────── */
    .partido-row {
      display: grid;
      grid-template-columns: 28px 1fr 90px 1fr 40px;
      align-items: center;
      gap: 0.6em;
      padding: 0.65em 0.85em;
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      transition: var(--transition);
    }

    .partido-row.guardado {
      border-left: 3px solid var(--clr-success-text);
      background: var(--clr-success-bg);
    }

    .partido-n {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--clr-text-muted);
      text-align: center;
    }

    .partido-equipo { display: flex; align-items: center; gap: 0.45em; }
    .partido-equipo--local  { justify-content: flex-end; }
    .partido-equipo--visit  { justify-content: flex-start; }

    .equipo-txt {
      font-size: 0.78rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      color: var(--clr-text);
    }

    /* ── Botones de solo lectura ─────────────────────────────────────────── */
    .opciones-resultado {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    .opcion-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1.5px solid var(--clr-border-strong);
      background: var(--clr-surface);
      color: var(--clr-text-muted);
      font-size: 0.62rem;
      font-weight: 700;
      font-family: var(--font-body);
      padding: 0;
      line-height: 1;
      cursor: default;
    }

    .opcion-btn.activa-local {
      border-color: var(--clr-primary);
      background-color: rgba(46, 158, 45, 0.15);
      color: var(--clr-primary);
      box-shadow: 0 2px 6px rgba(46,158,45,0.2);
    }

    .opcion-btn.activa-empate {
      border-color: var(--clr-primary-dark);
      background-color: rgba(42, 57, 141, 0.12);
      color: var(--clr-primary-dark);
      box-shadow: 0 2px 6px rgba(42,57,141,0.15);
    }

    .opcion-btn.activa-visitante {
      border-color: var(--clr-action);
      background-color: rgba(192, 23, 29, 0.12);
      color: var(--clr-action);
      box-shadow: 0 2px 6px rgba(192,23,29,0.2);
    }

    .opcion-btn.opaca { opacity: 0.3; }

    .partido-accion { display: flex; justify-content: center; }

    .badge-status {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      font-size: 0.75rem;
      border: 1px solid transparent;
      transition: var(--transition);
    }

    .badge-finalizado {
      color: var(--clr-success-text);
      background: var(--clr-success-bg);
      border-color: rgba(26,122,74,0.2);
    }

    .badge-pendiente {
      color: var(--clr-text-muted);
      background: var(--clr-surface-alt);
      border-color: var(--clr-border-strong);
    }

    /* ── Responsive ──────────────────────────────────────────────────────── */
    @media (max-width: 1024px) {
      .stats-overview { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 800px) {
      .partido-row {
        grid-template-columns: 24px 1fr 80px 1fr 34px;
        padding: 0.5em var(--spacing-sm);
        gap: 0.4em;
      }
      .equipo-txt { font-size: 0.72rem; }
      .badge-status { width: 22px; height: 22px; font-size: 0.65rem; }
    }

    @media (max-width: 550px) {
      .grupo-header { flex-direction: column; align-items: flex-start; gap: 0.5em; }
      .group-teams-mobile {
        display: flex;
        flex-wrap: wrap;
        gap: 0.7em;
        width: 100%;
        padding-top: 0.3em;
        border-top: 1px solid var(--clr-border);
      }
      .mobile-team-item { display: flex; align-items: center; gap: 0.3em; }
      .flag-mini { width: 16px; height: 11px; border-radius: 2px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
      .team-name-mini { color: var(--clr-text); font-size: 0.6rem; font-weight: 700; text-transform: uppercase; }
      .stats-overview { grid-template-columns: 1fr; }
      .equipo-txt { display: none; }
      .partido-row { grid-template-columns: 20px auto 80px auto 30px; }
      .badge-status { width: 20px; height: 20px; font-size: 0.6rem; }
      .referencia-estados { width: 100%; justify-content: center; }
    }
  `]
})
export class ResultadosComponent implements OnInit {

  torneoService = inject(TorneoService);

  cargando    = signal(true);
  grupoActivo = signal<string | null>(null);
  partidos    = signal<Partido[]>([]);

  // FIX #1: signal<Record<number, string>> en lugar de Map plano.
  // Patrón consistente con cargar-resultados.component.ts.
  private seleccionesSignal = signal<Record<number, string>>({});
  resultadosGuardados       = signal<Set<number>>(new Set());

  grupos = GRUPOS;

  constructor(
    private partidoService: PartidoService,
    private resultadoService: ResultadoService
  ) {}

  ngOnInit(): void {
    forkJoin({
      partidos:   this.partidoService.getPartidos(),
      resultados: this.resultadoService.getResultados()
    }).subscribe({
      next: ({ partidos, resultados }) => {
        this.partidos.set(partidos.filter(p => p.fase === 'GRUPOS'));

        const guardados: Set<number> = new Set();
        const selecciones: Record<number, string> = {};

        resultados.forEach(r => {
          const id = r.partido.id;
          selecciones[id] = r.resultado;
          guardados.add(id);
        });

        this.seleccionesSignal.set(selecciones);
        this.resultadosGuardados.set(guardados);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  gruposMostrados(): string[] {
    const activo = this.grupoActivo();
    return activo ? [activo] : this.grupos;
  }

  getPartidosPorGrupo(grupo: string): Partido[] {
    return this.partidos().filter(p => p.grupo === grupo);
  }

  getEquiposDelGrupo(grupo: string): { nombre: string; bandera: string }[] {
    const partidos = this.getPartidosPorGrupo(grupo);
    const equipos = new Map<string, string>();
    partidos.forEach(p => {
      if (p.equipoLocalShow)     equipos.set(p.equipoLocalShow,     p.equipoLocalBandera);
      if (p.equipoVisitanteShow) equipos.set(p.equipoVisitanteShow, p.equipoVisitanteBandera);
    });
    return Array.from(equipos.entries()).map(([nombre, bandera]) => ({ nombre, bandera }));
  }

  // FIX #1: lee del signal en lugar del Map
  getSeleccion(partidoId: number): string {
    return this.seleccionesSignal()[partidoId] ?? '';
  }

  contarGuardadosEnGrupo(grupo: string): number {
    return this.getPartidosPorGrupo(grupo)
      .filter(p => this.resultadosGuardados().has(p.id)).length;
  }

  grupoCompleto(grupo: string): boolean {
    const ps = this.getPartidosPorGrupo(grupo);
    return ps.length > 0 && ps.every(p => this.resultadosGuardados().has(p.id));
  }
}
