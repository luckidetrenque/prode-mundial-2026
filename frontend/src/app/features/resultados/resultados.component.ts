import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { PartidoService } from '../../core/services/partido.service';
import { ResultadoService } from '../../core/services/resultado.service';
import { Partido } from '../../shared/models/partido.model';

const GRUPOS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="main">
      <h2><i class="fas fa-futbol" aria-hidden="true"></i> Resultados de los Partidos</h2>

      @if (cargando()) {
        <div class="spinner-container" role="status" aria-label="Cargando datos...">
          <div class="spinner"></div>
        </div>
      }

      @if (!cargando() && partidos().length > 0) {

        <!-- Resumen de progreso (Dashboard style) -->
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
        </div>

        <!-- Partidos por grupo -->
        @for (grupo of gruposMostrados(); track grupo) {
          @if (getPartidosPorGrupo(grupo).length > 0) {
            <div class="grupo-bloque" role="region" [attr.aria-label]="'Grupo ' + grupo">

              <div class="grupo-header">
                <span class="grupo-tag">GRUPO {{ grupo }}</span>
                <span class="grupo-estado">
                  {{ contarGuardadosEnGrupo(grupo) }}/{{ getPartidosPorGrupo(grupo).length }} jugados
                </span>
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
                        width="26"
                        height="17"
                      />
                    </div>

                    <!-- Botones de solo lectura -->
                    <div
                      class="opciones-resultado"
                      role="group"
                      [attr.aria-label]="'Resultado del partido ' + partido.numero + ': ' + partido.equipoLocalShow + ' vs ' + partido.equipoVisitanteShow"
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
                        width="26"
                        height="17"
                      />
                      <span class="equipo-txt">{{ partido.equipoVisitanteShow }}</span>
                    </div>

                    <!-- Indicador de estado del partido -->
                    <div class="partido-accion">
                      @if (resultadosGuardados().has(partido.id)) {
                        <span class="badge-guardado" role="status">
                          <i class="fas fa-check" aria-hidden="true"></i> Finalizado
                        </span>
                      } @else {
                        <span class="badge-pendiente" role="status">
                          <i class="fas fa-clock" aria-hidden="true"></i> Pendiente
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
    /* ── Overview Dashboard (Estadisticas style) ─────────────────────────── */
    .stats-overview {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1em;
      margin-bottom: 2em;
    }

    .overview-card {
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-lg);
      padding: 1.25em;
      display: flex;
      align-items: center;
      gap: 1em;
      box-shadow: var(--shadow-sm);
      transition: var(--transition);
    }

    .overview-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
      border-color: var(--clr-primary-light);
    }

    .overview-card i {
      font-size: 1.8rem;
      color: var(--clr-primary);
      background: var(--clr-surface-alt);
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      flex-shrink: 0;
    }

    .overview-data {
      display: flex;
      flex-direction: column;
    }

    .overview-num {
      font-family: var(--font-display);
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--clr-primary-dark);
      line-height: 1.1;
    }

    .overview-label {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--clr-text-muted);
      margin-top: 2px;
    }

    /* ── Filtro grupos ───────────────────────────────────────────────────── */
    .filtro-grupos {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35em;
      margin-bottom: 1.5em;
    }

    .btn-grupo {
      display: inline-flex;
      align-items: center;
      gap: 0.3em;
      padding: 0.3em 0.75em;
      border: 1.5px solid var(--clr-border-strong);
      border-radius: 20px;
      background: var(--clr-surface);
      color: var(--clr-text-muted);
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      font-family: var(--font-body);
    }

    .btn-grupo:hover { border-color: var(--clr-primary); color: var(--clr-primary); }
    .btn-grupo:focus-visible { outline: 2px solid var(--clr-primary); outline-offset: 2px; }
    .btn-grupo.activo { border-color: var(--clr-primary); background: var(--clr-primary); color: white; }
    .btn-grupo.completo { border-color: var(--clr-success-text); color: var(--clr-success-text); background: var(--clr-success-bg); }
    .btn-grupo.completo.activo { background: var(--clr-success-text); color: white; border-color: var(--clr-success-text); }

    /* ── Grupo bloque ────────────────────────────────────────────────────── */
    .grupo-bloque { margin-bottom: 2em; }

    .grupo-header {
      display: flex;
      align-items: center;
      gap: 0.75em;
      margin-bottom: 0.6em;
    }

    .grupo-tag {
      font-family: var(--font-display);
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 2px;
      color: var(--clr-primary-dark);
      background: var(--clr-surface-alt);
      padding: 0.2em 0.8em;
      border-radius: 20px;
      border: 1.5px solid var(--clr-border-strong);
    }

    .grupo-estado {
      font-size: 0.75rem;
      color: var(--clr-text-muted);
    }

    /* ── Lista de partidos ───────────────────────────────────────────────── */
    .partidos-lista {
      display: flex;
      flex-direction: column;
      gap: 0.45em;
    }

    /* ── Fila de partido ─────────────────────────────────────────────────── */
    .partido-row {
      display: grid;
      grid-template-columns: 28px 1fr 90px 1fr auto;
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

    .partido-equipo {
      display: flex;
      align-items: center;
      gap: 0.45em;
    }

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
      letter-spacing: 0.2px;
      font-family: var(--font-body);
      padding: 0;
      line-height: 1;
      cursor: default; /* Solo lectura */
    }

    .opcion-btn.activa-local {
      border-color: var(--clr-primary);
      background: var(--clr-primary);
      color: white;
      box-shadow: 0 2px 6px rgba(46,158,45,0.35);
    }

    .opcion-btn.activa-empate {
      border-color: var(--clr-primary-dark);
      background: var(--clr-primary-dark);
      color: white;
      box-shadow: 0 2px 6px rgba(18,51,59,0.3);
    }

    .opcion-btn.activa-visitante {
      border-color: var(--clr-action);
      background: var(--clr-action);
      color: white;
      box-shadow: 0 2px 6px rgba(192,23,29,0.35);
    }

    .opcion-btn.opaca {
      opacity: 0.3;
    }

    .partido-accion { min-width: 100px; display: flex; justify-content: flex-end; }

    /* Badges de estado */
    .badge-guardado {
      display: inline-flex;
      align-items: center;
      gap: 0.35em;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--clr-success-text);
      background: var(--clr-success-bg);
      padding: 0.35em 0.75em;
      border-radius: var(--radius-sm);
      border: 1px solid rgba(26,122,74,0.2);
    }

    .badge-pendiente {
      display: inline-flex;
      align-items: center;
      gap: 0.35em;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--clr-text-muted);
      background: var(--clr-surface-alt);
      padding: 0.35em 0.75em;
      border-radius: var(--radius-sm);
      border: 1px solid var(--clr-border-strong);
    }

    /* ── Responsive ──────────────────────────────────────────────────────── */
    @media (max-width: 800px) {
      .stats-overview { grid-template-columns: repeat(2, 1fr); }
      .partido-row {
        grid-template-columns: 24px 1fr 80px 1fr auto;
        padding: 0.5em 0.6em;
        gap: 0.4em;
      }

      .equipo-txt { font-size: 0.7rem; }
    }

    @media (max-width: 500px) {
      .stats-overview { grid-template-columns: 1fr; }
      .equipo-txt { display: none; }
      .partido-row { grid-template-columns: 20px auto 80px auto auto; }
      .partido-accion { min-width: 70px; }
    }
  `]
})
export class ResultadosComponent implements OnInit {

  cargando     = signal(true);
  grupoActivo  = signal<string | null>(null);

  partidos = signal<Partido[]>([]);

  private selecciones = new Map<number, string>();
  resultadosGuardados = signal<Set<number>>(new Set());

  grupos = GRUPOS;

  constructor(
    private partidoService: PartidoService,
    private resultadoService: ResultadoService
  ) {}

  ngOnInit(): void {
    forkJoin({
      partidos: this.partidoService.getPartidos(),
      resultados: this.resultadoService.getResultados()
    }).subscribe({
      next: ({ partidos, resultados }) => {
        const filtrados = partidos.filter(p => p.fase === 'GRUPOS');
        this.partidos.set(filtrados);

        const guardados = new Set<number>();
        resultados.forEach(r => {
          const partidoId = r.partido.id;
          this.selecciones.set(partidoId, r.resultado);
          guardados.add(partidoId);
        });

        this.resultadosGuardados.set(guardados);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      }
    });
  }

  gruposMostrados(): string[] {
    const activo = this.grupoActivo();
    if (activo) return [activo];
    return this.grupos;
  }

  getPartidosPorGrupo(grupo: string): Partido[] {
    return this.partidos().filter(p => p.grupo === grupo);
  }

  getSeleccion(partidoId: number): string {
    return this.selecciones.get(partidoId) ?? '';
  }

  contarGuardadosEnGrupo(grupo: string): number {
    return this.getPartidosPorGrupo(grupo)
      .filter(p => this.resultadosGuardados().has(p.id)).length;
  }

  grupoCompleto(grupo: string): boolean {
    const partidos = this.getPartidosPorGrupo(grupo);
    return partidos.length > 0 &&
      partidos.every(p => this.resultadosGuardados().has(p.id));
  }

}