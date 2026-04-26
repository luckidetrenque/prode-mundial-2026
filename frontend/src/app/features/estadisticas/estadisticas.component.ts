// estadisticas.component.ts — VERSIÓN MEJORADA
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstadisticaService } from '../../core/services/estadistica.service';
import { EstadisticaPartido } from '../../shared/models/estadistica.model';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="main">
      <h2><i class="fas fa-chart-simple"></i> Estadísticas de Apuestas</h2>

      @if (cargando()) {
        <div class="spinner-container"><div class="spinner"></div></div>
      }

      @if (!cargando() && estadisticas().length === 0) {
        <p class="msg-warning">
          <i class="fas fa-circle-info"></i>
          No hay planillas confirmadas aún. Las estadísticas aparecerán aquí cuando haya participantes.
        </p>
      }

      @if (!cargando() && estadisticas().length > 0) {

        <!-- Resumen general -->
        <div class="resumen-strip">
          <div class="resumen-item">
            <span class="resumen-num">{{ estadisticas()[0].totalVotos }}</span>
            <span class="resumen-label">Planillas</span>
          </div>
          <div class="resumen-sep"></div>
          <div class="resumen-item">
            <span class="resumen-num">{{ estadisticas().length }}</span>
            <span class="resumen-label">Partidos</span>
          </div>
          <div class="resumen-sep"></div>
          <div class="resumen-item">
            <span class="resumen-num">{{ totalPrediccionesLocal() }}</span>
            <span class="resumen-label">Votes Local</span>
          </div>
          <div class="resumen-sep"></div>
          <div class="resumen-item">
            <span class="resumen-num">{{ totalPrediccionesEmpate() }}</span>
            <span class="resumen-label">Votes Empate</span>
          </div>
        </div>

        <!-- Filtro de grupo -->
        <div class="filtro-grupos">
          <button class="btn-grupo" [class.activo]="grupoActivo() === null" (click)="grupoActivo.set(null)">
            Todos
          </button>
          @for (g of grupos; track g) {
            <button class="btn-grupo" [class.activo]="grupoActivo() === g" (click)="grupoActivo.set(g)">
              {{ g }}
            </button>
          }
        </div>

        <!-- Grid de cards -->
        <div class="stats-grid">
          @for (stat of estadisticasFiltradas(); track stat.numeroPartido) {
            <div class="stat-card">

              <!-- Header de la card -->
              <div class="stat-card-header">
                <span class="stat-num">#{{ stat.numeroPartido }}</span>
                <div class="stat-equipos">
                  <span class="stat-local">{{ stat.equipoLocal }}</span>
                  <span class="stat-vs">vs</span>
                  <span class="stat-visitante">{{ stat.equipoVisitante }}</span>
                </div>
              </div>

              <!-- Barras -->
              <div class="stat-barras">

                <!-- Local -->
                <div class="barra-row">
                  <span class="barra-label">{{ stat.equipoLocal }}</span>
                  <div class="barra-track">
                    <div
                      class="barra-fill barra-local"
                      [style.width.%]="getPct(stat.votosLocal, stat.totalVotos)"
                    ></div>
                  </div>
                  <span class="barra-pct">{{ getPct(stat.votosLocal, stat.totalVotos) | number:'1.0-0' }}%</span>
                  <span class="barra-votos">({{ stat.votosLocal }})</span>
                </div>

                <!-- Empate -->
                <div class="barra-row">
                  <span class="barra-label">Empate</span>
                  <div class="barra-track">
                    <div
                      class="barra-fill barra-empate"
                      [style.width.%]="getPct(stat.votosEmpate, stat.totalVotos)"
                    ></div>
                  </div>
                  <span class="barra-pct">{{ getPct(stat.votosEmpate, stat.totalVotos) | number:'1.0-0' }}%</span>
                  <span class="barra-votos">({{ stat.votosEmpate }})</span>
                </div>

                <!-- Visitante -->
                <div class="barra-row">
                  <span class="barra-label">{{ stat.equipoVisitante }}</span>
                  <div class="barra-track">
                    <div
                      class="barra-fill barra-visitante"
                      [style.width.%]="getPct(stat.votosVisitante, stat.totalVotos)"
                    ></div>
                  </div>
                  <span class="barra-pct">{{ getPct(stat.votosVisitante, stat.totalVotos) | number:'1.0-0' }}%</span>
                  <span class="barra-votos">({{ stat.votosVisitante }})</span>
                </div>

              </div>

              <!-- Favorito -->
              <div class="stat-card-footer">
                <span class="favorito-label">Favorito:</span>
                <span class="favorito-valor">{{ getFavorito(stat) }}</span>
              </div>

            </div>
          }
        </div>

      }
    </main>
  `,
  styles: [`
    /* ── Resumen strip ───────────────────────────────────────────────────── */
    .resumen-strip {
      display: flex;
      align-items: center;
      gap: 0;
      background: var(--clr-primary-dark);
      border-radius: var(--radius-lg);
      padding: 1em 1.5em;
      margin-bottom: 1.5em;
      overflow: hidden;
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
      color: rgba(255,255,255,0.6);
    }

    .resumen-sep {
      width: 1px;
      height: 40px;
      background: rgba(255,255,255,0.15);
      flex-shrink: 0;
    }

    /* ── Filtro grupos ───────────────────────────────────────────────────── */
    .filtro-grupos {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35em;
      margin-bottom: 1.25em;
    }

    .btn-grupo {
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

    /* ── Grid de cards ───────────────────────────────────────────────────── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1em;
    }

    /* ── Card individual ─────────────────────────────────────────────────── */
    .stat-card {
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-md);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      transition: var(--transition);
    }

    .stat-card:hover { box-shadow: var(--shadow-md); border-color: var(--clr-border-strong); }

    /* Header de la card */
    .stat-card-header {
      display: flex;
      align-items: center;
      gap: 0.75em;
      padding: 0.65em 0.9em;
      background: var(--clr-surface-alt);
      border-bottom: 1px solid var(--clr-border);
    }

    .stat-num {
      font-family: var(--font-display);
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--clr-primary);
      flex-shrink: 0;
    }

    .stat-equipos {
      display: flex;
      align-items: center;
      gap: 0.3em;
      font-size: 0.72rem;
      overflow: hidden;
    }

    .stat-local, .stat-visitante {
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      color: var(--clr-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 90px;
    }

    .stat-vs {
      font-size: 0.65rem;
      color: var(--clr-text-muted);
      font-weight: 500;
      flex-shrink: 0;
    }

    /* Barras */
    .stat-barras {
      display: flex;
      flex-direction: column;
      gap: 0.55em;
      padding: 0.85em 0.9em;
    }

    .barra-row {
      display: grid;
      grid-template-columns: 75px 1fr 34px 32px;
      align-items: center;
      gap: 0.5em;
    }

    .barra-label {
      font-size: 0.7rem;
      font-weight: 500;
      color: var(--clr-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .barra-track {
      height: 6px;
      background: var(--clr-surface-alt);
      border-radius: 3px;
      overflow: hidden;
      border: 1px solid var(--clr-border);
    }

    .barra-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.5s ease;
    }

    .barra-local     { background: var(--clr-primary); }
    .barra-empate    { background: var(--clr-primary-dark); }
    .barra-visitante { background: var(--clr-maroon); }

    .barra-pct {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--clr-text);
      text-align: right;
    }

    .barra-votos {
      font-size: 0.65rem;
      color: var(--clr-text-muted);
      text-align: right;
    }

    /* Footer con favorito */
    .stat-card-footer {
      display: flex;
      align-items: center;
      gap: 0.4em;
      padding: 0.5em 0.9em;
      border-top: 1px solid var(--clr-border);
      background: var(--clr-surface-alt);
    }

    .favorito-label {
      font-size: 0.68rem;
      color: var(--clr-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 500;
    }

    .favorito-valor {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--clr-primary-dark);
      text-transform: uppercase;
    }

    /* ── Responsive ──────────────────────────────────────────────────────── */
    @media (max-width: 700px) {
      .stats-grid { grid-template-columns: 1fr; }
      .resumen-strip { padding: 0.85em 1em; }
      .resumen-num { font-size: 1.3rem; }
      .barra-row { grid-template-columns: 60px 1fr 30px 28px; }
    }

    @media (max-width: 400px) {
      .barra-votos { display: none; }
    }
  `]
})
export class EstadisticasComponent implements OnInit {

  cargando     = signal(true);
  estadisticas = signal<EstadisticaPartido[]>([]);
  grupoActivo  = signal<string | null>(null);

  grupos = ['A','B','C','D','E','F','G','H','I','J','K','L'];

  // Mapa de partido → grupo (se construye cuando llegan los datos)
  // Como EstadisticaPartido no tiene grupo, lo derivamos del número de partido:
  // partidos 1–48 son grupos (4 por grupo, 12 grupos)
  private getGrupoDeNumero(num: number): string {
    const idx = Math.floor((num - 1) / 4);
    return this.grupos[idx] ?? '?';
  }

  constructor(private estadisticaService: EstadisticaService) {}

  ngOnInit(): void {
    this.estadisticaService.getEstadisticas().subscribe({
      next: data => { this.estadisticas.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false)
    });
  }

  estadisticasFiltradas(): EstadisticaPartido[] {
    const activo = this.grupoActivo();
    if (!activo) return this.estadisticas();
    return this.estadisticas().filter(
      s => this.getGrupoDeNumero(s.numeroPartido) === activo
    );
  }

  getPct(votos: number, total: number): number {
    return total === 0 ? 0 : Math.round((votos / total) * 100);
  }

  getFavorito(stat: EstadisticaPartido): string {
    const max = Math.max(stat.votosLocal, stat.votosEmpate, stat.votosVisitante);
    if (max === stat.votosLocal)     return stat.equipoLocal;
    if (max === stat.votosEmpate)    return 'Empate';
    return stat.equipoVisitante;
  }

  totalPrediccionesLocal(): number {
    return this.estadisticas().reduce((acc, s) => acc + s.votosLocal, 0);
  }

  totalPrediccionesEmpate(): number {
    return this.estadisticas().reduce((acc, s) => acc + s.votosEmpate, 0);
  }
}
