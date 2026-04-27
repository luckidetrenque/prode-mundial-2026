// cargar-resultados.component.ts — VERSIÓN MEJORADA
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { PartidoService } from '../../../core/services/partido.service';
import { ResultadoService } from '../../../core/services/resultado.service';
import { Partido } from '../../../shared/models/partido.model';

const GRUPOS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

@Component({
  selector: 'app-cargar-resultados',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="main">
      <h2><i class="fas fa-database"></i> Cargar Resultados</h2>

      @if (cargando()) {
        <div class="spinner-container"><div class="spinner"></div></div>
      }

      @if (mensajeExito()) {
        <p class="msg-success">
          <i class="fas fa-circle-check"></i> {{ mensajeExito() }}
        </p>
      }

      @if (mensajeError()) {
        <p class="msg-error">
          <i class="fas fa-triangle-exclamation"></i> {{ mensajeError() }}
        </p>
      }

      @if (!cargando() && partidos().length > 0) {

        <!-- Resumen de progreso -->
        <div class="resumen-strip">
          <div class="resumen-item">
            <span class="resumen-num">{{ partidos().length }}</span>
            <span class="resumen-label">Partidos</span>
          </div>
          <div class="resumen-sep"></div>
          <div class="resumen-item">
            <span class="resumen-num">{{ resultadosGuardados().size }}</span>
            <span class="resumen-label">Cargados</span>
          </div>
          <div class="resumen-sep"></div>
          <div class="resumen-item">
            <span class="resumen-num">{{ partidos().length - resultadosGuardados().size }}</span>
            <span class="resumen-label">Pendientes</span>
          </div>
          <div class="resumen-sep"></div>
          <div class="resumen-item resumen-barra-wrap">
            <div class="mini-barra-track">
              <div
                class="mini-barra-fill"
                [style.width.%]="partidos().length ? (resultadosGuardados().size / partidos().length) * 100 : 0"
              ></div>
            </div>
            <span class="resumen-label">Progreso</span>
          </div>
        </div>

        <!-- Filtro de grupo -->
        <div class="filtro-grupos">
          <button class="btn-grupo" [class.activo]="grupoActivo() === null" (click)="grupoActivo.set(null)">
            Todos
          </button>
          @for (g of grupos; track g) {
            <button
              class="btn-grupo"
              [class.activo]="grupoActivo() === g"
              [class.completo]="grupoCompleto(g)"
              (click)="grupoActivo.set(g)"
            >
              {{ g }}
              @if (grupoCompleto(g)) {
                <i class="fas fa-check" style="font-size:0.6rem"></i>
              }
            </button>
          }
        </div>

        <!-- Partidos por grupo -->
        @for (grupo of gruposMostrados(); track grupo) {
          @if (getPartidosPorGrupo(grupo).length > 0) {
            <div class="grupo-bloque">

              <!-- Header del grupo -->
              <div class="grupo-header">
                <span class="grupo-tag">GRUPO {{ grupo }}</span>
                <span class="grupo-estado">
                  {{ contarGuardadosEnGrupo(grupo) }}/{{ getPartidosPorGrupo(grupo).length }} cargados
                </span>
              </div>

              <!-- Lista de partidos -->
              <div class="partidos-lista">
                @for (partido of getPartidosPorGrupo(grupo); track partido.id) {
                  <div class="partido-row" [class.guardado]="resultadosGuardados().has(partido.id)">

                    <!-- Número -->
                    <span class="partido-n">#{{ partido.numero }}</span>

                    <!-- Equipo local -->
                    <div class="partido-equipo partido-equipo--local">
                      <span class="equipo-txt">{{ partido.equipoLocalShow }}</span>
                      <img [src]="partido.equipoLocalBandera" [alt]="partido.equipoLocalShow" class="flag" width="26" height="17" />
                    </div>

                    <!-- Selector de resultado -->
                    <div class="opciones-resultado">
                      <button
                        class="opcion-btn"
                        [class.activa-local]="getSeleccion(partido.id) === 'LOCAL'"
                        [class.guardada]="resultadosGuardados().has(partido.id) && getSeleccion(partido.id) === 'LOCAL'"
                        (click)="seleccionarResultado(partido.id, 'LOCAL')"
                        title="Local gana"
                      >L</button>
                      <button
                        class="opcion-btn"
                        [class.activa-empate]="getSeleccion(partido.id) === 'EMPATE'"
                        [class.guardada]="resultadosGuardados().has(partido.id) && getSeleccion(partido.id) === 'EMPATE'"
                        (click)="seleccionarResultado(partido.id, 'EMPATE')"
                        title="Empate"
                      >E</button>
                      <button
                        class="opcion-btn"
                        [class.activa-visitante]="getSeleccion(partido.id) === 'VISITANTE'"
                        [class.guardada]="resultadosGuardados().has(partido.id) && getSeleccion(partido.id) === 'VISITANTE'"
                        (click)="seleccionarResultado(partido.id, 'VISITANTE')"
                        title="Visitante gana"
                      >V</button>
                    </div>

                    <!-- Equipo visitante -->
                    <div class="partido-equipo partido-equipo--visit">
                      <img [src]="partido.equipoVisitanteBandera" [alt]="partido.equipoVisitanteShow" class="flag" width="26" height="17" />
                      <span class="equipo-txt">{{ partido.equipoVisitanteShow }}</span>
                    </div>

                    <!-- Botón guardar -->
                    <div class="partido-accion">
                      @if (resultadosGuardados().has(partido.id)) {
                        <span class="badge-guardado">
                          <i class="fas fa-check"></i> Guardado
                        </span>
                      } @else {
                        <button
                          class="btn btn-guardar"
                          [disabled]="!getSeleccion(partido.id) || guardando() === partido.id"
                          (click)="guardar(partido.id)"
                        >
                          @if (guardando() === partido.id) {
                            <i class="fas fa-spinner fa-spin"></i>
                          } @else {
                            <i class="fas fa-floppy-disk"></i> Guardar
                          }
                        </button>
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
    /* ── Resumen strip ───────────────────────────────────────────────────── */
    .resumen-strip {
      display: flex;
      align-items: center;
      background: var(--clr-primary-dark);
      border-radius: var(--radius-lg);
      padding: 1em 1.5em;
      margin-bottom: 1.5em;
      gap: 0;
    }

    .resumen-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      gap: 0.15em;
    }

    .resumen-num {
      font-family: var(--font-display);
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--clr-accent);
      line-height: 1;
    }

    .resumen-label {
      font-size: 0.7rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: rgba(255,255,255,0.55);
    }

    .resumen-sep {
      width: 1px;
      height: 40px;
      background: rgba(255,255,255,0.12);
      flex-shrink: 0;
    }

    .resumen-barra-wrap { gap: 0.4em; }

    .mini-barra-track {
      width: 100%;
      max-width: 80px;
      height: 6px;
      background: rgba(255,255,255,0.15);
      border-radius: 3px;
      overflow: hidden;
    }

    .mini-barra-fill {
      height: 100%;
      border-radius: 3px;
      background: var(--clr-accent);
      transition: width 0.4s ease;
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

    .partido-row:hover { border-color: var(--clr-border-strong); }

    .partido-row.guardado {
      border-left: 3px solid var(--clr-success-text);
      background: var(--clr-success-bg);
    }

    /* Número */
    .partido-n {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--clr-text-muted);
      text-align: center;
    }

    /* Equipos */
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

    /* Opciones L/E/V */
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
      cursor: pointer;
      transition: all 0.14s;
      font-family: var(--font-body);
    }

    .opcion-btn:hover:not(:disabled) {
      border-color: var(--clr-primary);
      color: var(--clr-primary);
      background: rgba(56,120,135,0.07);
    }

    .opcion-btn.activa-local {
      border-color: var(--clr-primary);
      background: var(--clr-primary);
      color: white;
      box-shadow: 0 2px 6px rgba(56,120,135,0.35);
    }

    .opcion-btn.activa-empate {
      border-color: var(--clr-primary-dark);
      background: var(--clr-primary-dark);
      color: white;
      box-shadow: 0 2px 6px rgba(18,51,59,0.3);
    }

    .opcion-btn.activa-visitante {
      border-color: var(--clr-maroon);
      background: var(--clr-maroon);
      color: white;
      box-shadow: 0 2px 6px rgba(86,4,44,0.35);
    }

    /* Cuando ya está guardado, hacemos los botones más opacos */
    .partido-row.guardado .opcion-btn:not(.activa-local):not(.activa-empate):not(.activa-visitante) {
      opacity: 0.4;
    }

    /* Botón guardar */
    .partido-accion { min-width: 100px; display: flex; justify-content: flex-end; }

    .btn-guardar {
      display: inline-flex;
      align-items: center;
      gap: 0.35em;
      padding: 0.4em 0.85em;
      border: none;
      border-radius: var(--radius-sm);
      background: var(--clr-maroon);
      color: white;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      font-family: var(--font-body);
      white-space: nowrap;
    }

    .btn-guardar:hover:not(:disabled) {
      background: var(--clr-maroon-light);
      transform: translateY(-1px);
    }

    .btn-guardar:disabled {
      background: var(--clr-border-strong);
      color: var(--clr-text-muted);
      cursor: not-allowed;
      transform: none;
    }

    /* Badge guardado */
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

    /* ── Responsive ──────────────────────────────────────────────────────── */
    @media (max-width: 700px) {
      .partido-row {
        grid-template-columns: 24px 1fr 80px 1fr auto;
        padding: 0.5em 0.6em;
        gap: 0.4em;
      }

      .equipo-txt { font-size: 0.7rem; }
      .resumen-strip { padding: 0.85em 1em; }
      .resumen-num { font-size: 1.3rem; }
    }

    @media (max-width: 500px) {
      .equipo-txt { display: none; }
      .partido-row { grid-template-columns: 20px auto 80px auto auto; }
      .partido-accion { min-width: 70px; }
    }
  `]
})
export class CargarResultadosComponent implements OnInit {

  cargando     = signal(true);
  guardando    = signal<number | null>(null);
  mensajeExito = signal<string | null>(null);
  mensajeError = signal<string | null>(null);
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
    // Cargamos tanto los partidos como los resultados ya existentes
    forkJoin({
      partidos: this.partidoService.getPartidos(),
      resultados: this.resultadoService.getResultados()
    }).subscribe({
      next: ({ partidos, resultados }) => {
        // 1. Filtrar solo fase de grupos
        const filtrados = partidos.filter(p => p.fase === 'GRUPOS');
        this.partidos.set(filtrados);

        // 2. Pre-cargar los resultados que ya están en la DB
        const guardados = new Set<number>();
        resultados.forEach(r => {
          const partidoId = r.partido.id;
          this.selecciones.set(partidoId, r.resultado);
          guardados.add(partidoId);
        });

        this.resultadosGuardados.set(guardados);
        this._selVersion.update(v => v + 1); // Notificar cambios en el Map
        this.cargando.set(false);
      },
      error: () => {
        this.mensajeError.set('No se pudieron cargar los datos del servidor.');
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

  seleccionarResultado(partidoId: number, valor: string): void {
    this.selecciones.set(partidoId, valor);
    // Forzar re-render del signal
    this._selVersion.update(v => v + 1);
  }

  private _selVersion = signal(0);

  getSeleccion(partidoId: number): string {
    void this._selVersion();
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

  guardar(partidoId: number): void {
    const resultado = this.selecciones.get(partidoId);
    if (!resultado) return;

    this.guardando.set(partidoId);
    this.mensajeExito.set(null);
    this.mensajeError.set(null);

    this.resultadoService.guardar(partidoId, resultado).subscribe({
      next: () => {
        this.guardando.set(null);
        const guardados = new Set(this.resultadosGuardados());
        guardados.add(partidoId);
        this.resultadosGuardados.set(guardados);
        this.mensajeExito.set('Resultado guardado exitosamente.');
        setTimeout(() => this.mensajeExito.set(null), 3000);
      },
      error: () => {
        this.guardando.set(null);
        this.mensajeError.set('Error al guardar el resultado. Intentá de nuevo.');
        setTimeout(() => this.mensajeError.set(null), 4000);
      }
    });
  }
}
