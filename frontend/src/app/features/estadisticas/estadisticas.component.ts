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
      <p class="subtitulo">
        <i class="fas fa-circle-info" style="color:var(--clr-primary-light);font-size:0.8rem"></i>
        Análisis detallado de la distribución de votos y tendencias por cada partido.
      </p>

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

        <!-- Resumen general mejorado -->
        <div class="stats-overview">
          <div class="overview-card">
            <i class="fas fa-file-contract"></i>
            <div class="overview-data">
              <span class="overview-num">{{ totalPlanillas() }}</span>
              <span class="overview-label">Planillas Totales</span>
            </div>
          </div>
          
          <div class="overview-card">
            <i class="fas fa-house"></i>
            <div class="overview-data">
              <span class="overview-num">{{ totalPrediccionesLocal() }}</span>
              <span class="overview-label">Votos Local</span>
            </div>
          </div>

          <div class="overview-card">
            <i class="fas fa-equals"></i>
            <div class="overview-data">
              <span class="overview-num">{{ totalPrediccionesEmpate() }}</span>
              <span class="overview-label">Votos Empate</span>
            </div>
          </div>

          <div class="overview-card">
            <i class="fas fa-plane-departure"></i>
            <div class="overview-data">
              <span class="overview-num">{{ totalPrediccionesVisitante() }}</span>
              <span class="overview-label">Votos Visitante</span>
            </div>
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
                  <span class="barra-label">({{ stat.votosLocal }}) {{ stat.equipoLocal }}</span>
                  <div class="barra-track">
                    <div
                      class="barra-fill barra-local"
                      [style.width.%]="getPct(stat.votosLocal, stat.totalVotos)"
                    ></div>
                  </div>
                  <span class="barra-pct">{{ getPct(stat.votosLocal, stat.totalVotos) | number:'1.0-0' }}%</span>
                </div>

                <!-- Empate -->
                <div class="barra-row">
                  <span class="barra-label">({{ stat.votosEmpate }}) Empate</span>
                  <div class="barra-track">
                    <div
                      class="barra-fill barra-empate"
                      [style.width.%]="getPct(stat.votosEmpate, stat.totalVotos)"
                    ></div>
                  </div>
                  <span class="barra-pct">{{ getPct(stat.votosEmpate, stat.totalVotos) | number:'1.0-0' }}%</span>
                </div>

                <!-- Visitante -->
                <div class="barra-row">
                  <span class="barra-label">({{ stat.votosVisitante }}) {{ stat.equipoVisitante }}</span>
                  <div class="barra-track">
                    <div
                      class="barra-fill barra-visitante"
                      [style.width.%]="getPct(stat.votosVisitante, stat.totalVotos)"
                    ></div>
                  </div>
                  <span class="barra-pct">{{ getPct(stat.votosVisitante, stat.totalVotos) | number:'1.0-0' }}%</span>
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
    /* ── Overview Dashboard ──────────────────────────────────────────────── */
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
      gap: 0.4em;
      margin-bottom: 1.5em;
      padding: 0.5em;
      background: var(--clr-surface-alt);
      border-radius: 30px;
    }

    .btn-grupo {
      padding: 0.4em 1em;
      border: 1px solid transparent;
      border-radius: 20px;
      background: transparent;
      color: var(--clr-text-muted);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
    }

    .btn-grupo:hover { color: var(--clr-primary); background: rgba(0,0,0,0.03); }
    .btn-grupo.activo { background: var(--clr-primary); color: white; box-shadow: 0 2px 6px rgba(60,172,59,0.3); }

    /* ── Grid de cards ───────────────────────────────────────────────────── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.25em;
    }

    /* ── Card individual ─────────────────────────────────────────────────── */
    .stat-card {
      background: var(--clr-surface);
      border: 1px solid var(--clr-border-strong);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
    }

    .stat-card-header {
      display: flex;
      align-items: center;
      gap: 1em;
      padding: 0.85em 1.25em;
      background: linear-gradient(to right, #f8f9fa, #ffffff);
      border-bottom: 1px solid var(--clr-border);
    }

    .stat-num {
      background: var(--clr-primary-dark);
      color: white;
      font-family: var(--font-display);
      font-size: 0.85rem;
      padding: 0.2em 0.6em;
      border-radius: 6px;
    }

    .stat-equipos {
      display: flex;
      align-items: center;
      gap: 0.5em;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.8rem;
      letter-spacing: 0.3px;
    }

    .stat-vs { color: var(--clr-text-muted); font-weight: 400; font-size: 0.7rem; }

    /* Barras */
    .stat-barras {
      padding: 1.25em;
      display: flex;
      flex-direction: column;
      gap: 0.75em;
      flex-grow: 1;
    }

    .barra-row {
      display: grid;
      grid-template-columns: 100px 1fr 40px;
      align-items: center;
      gap: 0.75em;
    }

    .barra-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--clr-text);
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .barra-track {
      height: 8px;
      background: #f0f0f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .barra-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .barra-local     { background: var(--clr-primary); }
    .barra-empate    { background: var(--clr-primary-dark); }
    .barra-visitante { background: var(--clr-maroon); }

    .barra-pct {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--clr-text);
      text-align: right;
    }

    /* Footer */
    .stat-card-footer {
      padding: 0.75em 1.25em;
      background: #fafafa;
      border-top: 1px solid var(--clr-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .favorito-label { font-size: 0.7rem; color: var(--clr-text-muted); text-transform: uppercase; font-weight: 600; }
    .favorito-valor { font-size: 0.8rem; font-weight: 700; color: var(--clr-primary-dark); text-transform: uppercase; }

    /* ── Responsive ──────────────────────────────────────────────────────── */
    @media (max-width: 1024px) {
      .stats-overview { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 600px) {
      .stats-overview { grid-template-columns: 1fr; }
      .stats-grid { grid-template-columns: 1fr; }
      .barra-row { grid-template-columns: 80px 1fr 35px; }
    }
  `]
})
export class EstadisticasComponent implements OnInit {

  cargando     = signal(true);
  estadisticas = signal<EstadisticaPartido[]>([]);
  grupoActivo  = signal<string | null>(null);

  grupos = ['A','B','C','D','E','F','G','H','I','J','K','L'];

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
    return this.estadisticas().filter(s => s.grupo === activo);
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

  totalPrediccionesVisitante(): number {
    return this.estadisticas().reduce((acc, s) => acc + s.votosVisitante, 0);
  }

  totalPlanillas(): number {
    // Tomamos el totalVotos de cualquier partido, ya que es igual para todos (nro de planillas confirmadas)
    return this.estadisticas().length > 0 ? this.estadisticas()[0].totalVotos : 0;
  }
}
