// estadisticas.component.ts — CON TABS: Estadísticas + Pronósticos
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstadisticaService } from '../../core/services/estadistica.service';
import { EstadisticaPartido } from '../../shared/models/estadistica.model';

type TabActivo = 'estadisticas' | 'pronosticos';

interface EquipoPronostico {
  nombre: string;
  pos: number;
  pct: number;
}

interface GrupoPronostico {
  grupo: string;
  nota: string;
  equipos: EquipoPronostico[];
}

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="main">
      <h2><i class="fas fa-chart-simple"></i> Estadísticas y Pronósticos</h2>
      <p class="subtitulo">
        <i class="fas fa-circle-info" style="color:var(--clr-primary-light);font-size:0.8rem"></i>
        Análisis de predicciones y pronósticos de clasificación por grupo.
      </p>

      <!-- ── Tabs ──────────────────────────────────────────────────────── -->
      <div class="tabs-wrap">
        <button
          class="tab-btn"
          [class.activo]="tabActivo() === 'estadisticas'"
          (click)="tabActivo.set('estadisticas')"
          type="button"
        >
          <i class="fas fa-chart-bar"></i>
          Predicciones
        </button>
        <button
          class="tab-btn"
          [class.activo]="tabActivo() === 'pronosticos'"
          (click)="tabActivo.set('pronosticos')"
          type="button"
        >
          <i class="fas fa-trophy"></i>
          Pronósticos
        </button>
      </div>

      <!-- ══════════════════════════════════════════════════════
           TAB: ESTADÍSTICAS DE PREDICCIONES
      ═══════════════════════════════════════════════════════ -->
      @if (tabActivo() === 'estadisticas') {

        @if (cargando()) {
          <div class="spinner-container"><div class="spinner"></div></div>
        }

        @if (!cargando() && (estadisticas().length === 0 || totalPlanillas() === 0)) {
          <div class="estado-vacio">
            <i class="fas fa-chart-simple icono-vacio"></i>
            <p class="titulo-vacio">Sin estadísticas aún</p>
            <p class="desc-vacio">Las estadísticas aparecerán aquí cuando haya participantes confirmados.</p>
          </div>
        }

        @if (!cargando() && estadisticas().length > 0 && totalPlanillas() > 0) {

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

          <div class="filtro-grupos">
            <button type="button" class="btn-grupo" [class.activo]="grupoActivo() === null" (click)="grupoActivo.set(null)">Todos</button>
            @for (g of grupos; track g) {
              <button type="button" class="btn-grupo" [class.activo]="grupoActivo() === g" (click)="grupoActivo.set(g)">{{ g }}</button>
            }
          </div>

          <div class="stats-grid">
            @for (stat of estadisticasFiltradas(); track stat.numeroPartido) {
              <div class="stat-card">
                <div class="stat-card-header">
                  <span class="stat-num">#{{ stat.numeroPartido }}</span>
                  <div class="stat-equipos">
                    <span class="stat-local">{{ stat.equipoLocal }}</span>
                    <span class="stat-vs">vs</span>
                    <span class="stat-visitante">{{ stat.equipoVisitante }}</span>
                  </div>
                </div>
                <div class="stat-barras">
                  <div class="barra-row">
                    <span class="barra-label">({{ stat.votosLocal }}) {{ stat.equipoLocal }}</span>
                    <div class="barra-track">
                      <div class="barra-fill barra-local" [style.width.%]="getPct(stat.votosLocal, stat.totalVotos)"></div>
                    </div>
                    <span class="barra-pct">{{ getPct(stat.votosLocal, stat.totalVotos) | number:'1.0-0' }}%</span>
                  </div>
                  <div class="barra-row">
                    <span class="barra-label">({{ stat.votosEmpate }}) Empate</span>
                    <div class="barra-track">
                      <div class="barra-fill barra-empate" [style.width.%]="getPct(stat.votosEmpate, stat.totalVotos)"></div>
                    </div>
                    <span class="barra-pct">{{ getPct(stat.votosEmpate, stat.totalVotos) | number:'1.0-0' }}%</span>
                  </div>
                  <div class="barra-row">
                    <span class="barra-label">({{ stat.votosVisitante }}) {{ stat.equipoVisitante }}</span>
                    <div class="barra-track">
                      <div class="barra-fill barra-visitante" [style.width.%]="getPct(stat.votosVisitante, stat.totalVotos)"></div>
                    </div>
                    <span class="barra-pct">{{ getPct(stat.votosVisitante, stat.totalVotos) | number:'1.0-0' }}%</span>
                  </div>
                </div>
                @if (getFavorito(stat)) {
                  <div class="stat-card-footer">
                    <span class="favorito-label">Favorito:</span>
                    <span class="favorito-valor">{{ getFavorito(stat) }}</span>
                  </div>
                }
              </div>
            }
          </div>

        }
      }

      <!-- ══════════════════════════════════════════════════════
           TAB: PRONÓSTICOS DE CLASIFICACIÓN
      ═══════════════════════════════════════════════════════ -->
      @if (tabActivo() === 'pronosticos') {

        <div class="pronosticos-intro">
          <i class="fas fa-circle-info"></i>
          Probabilidades estimadas de clasificación por equipo en cada grupo, basadas en el análisis táctico y estadístico del torneo.
          <span class="legend-inline">
            <span class="legend-dot pos-1-dot"></span>1°
            <span class="legend-dot pos-2-dot"></span>2°
            <span class="legend-dot pos-3-dot"></span>Mejor 3°
            <span class="legend-dot pos-4-dot"></span>Eliminado
          </span>
        </div>

        <div class="filtro-grupos">
          <button type="button" class="btn-grupo" [class.activo]="grupoPronostico() === null" (click)="grupoPronostico.set(null)">Todos</button>
          @for (g of grupos; track g) {
            <button type="button" class="btn-grupo" [class.activo]="grupoPronostico() === g" (click)="grupoPronostico.set(g)">{{ g }}</button>
          }
        </div>

        <div class="pronosticos-grid">
          @for (p of pronosticosFiltrados(); track p.grupo) {
            <div class="stat-card pronostico-card">
              <div class="stat-card-header">
                <span class="stat-num">GRUPO {{ p.grupo }}</span>
                <span class="pronostico-nota">{{ p.nota }}</span>
              </div>
              <div class="stat-barras">
                @for (eq of p.equipos; track eq.nombre) {
                  <div class="barra-row">
                    <span class="barra-label">
                      <span class="pos-badge pos-badge-{{ eq.pos }}">{{ eq.pos }}°</span>
                      {{ eq.nombre }}
                    </span>
                    <div class="barra-track">
                      <div
                        class="barra-fill"
                        [class.barra-pos1]="eq.pos === 1"
                        [class.barra-pos2]="eq.pos === 2"
                        [class.barra-pos3]="eq.pos === 3"
                        [class.barra-pos4]="eq.pos === 4"
                        [style.width.%]="getPctRelativo(eq.pct, p.equipos)"
                      ></div>
                    </div>
                    <span class="barra-pct">{{ eq.pct }}%</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>

      }
    </main>
  `,
  styles: [`
    /* ── Tabs ────────────────────────────────────────────────────────────── */
    .tabs-wrap {
      display: flex;
      gap: 0;
      margin-bottom: 1.75em;
      border-bottom: 2px solid var(--clr-border-strong);
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5em;
      padding: 0.65em 1.5em;
      background: transparent;
      border: none;
      border-bottom: 3px solid transparent;
      margin-bottom: -2px;
      font-family: var(--font-body);
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--clr-text-muted);
      cursor: pointer;
      transition: var(--transition);
      letter-spacing: 0.2px;
    }

    .tab-btn i {
      font-size: 0.85rem;
      opacity: 0.7;
    }

    .tab-btn:hover {
      color: var(--clr-primary-dark);
    }

    .tab-btn.activo {
      color: var(--clr-primary-dark);
      border-bottom-color: var(--clr-primary-dark);
    }

    .tab-btn.activo i {
      opacity: 1;
      color: var(--clr-primary-light);
    }

    /* ── Filtro grupos ───────────────────────────────────────────────────── */
    .filtro-grupos {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35em;
      margin-bottom: 1.5em;
    }

    /* ── Stats grid (predicciones) ───────────────────────────────────────── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.25em;
    }

    /* ── Stat card base ──────────────────────────────────────────────────── */
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
      flex-shrink: 0;
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

    .stat-barras {
      padding: 1.25em;
      display: flex;
      flex-direction: column;
      gap: 0.75em;
      flex-grow: 1;
    }

    .barra-row {
      display: grid;
      grid-template-columns: 120px 1fr 40px;
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
      display: flex;
      align-items: center;
      gap: 0.4em;
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

    /* Barras predicciones (colores originales) */
    .barra-local     { background: var(--clr-primary); }
    .barra-empate    { background: var(--clr-primary-dark); }
    .barra-visitante { background: var(--clr-maroon); }

    /* Barras pronósticos (posiciones) */
    .barra-pos1 { background: #E61D25; }
    .barra-pos2 { background: #2A398D; }
    .barra-pos3 { background: #3CAC3B; }
    .barra-pos4 { background: #D1D4D1; }

    .barra-pct {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--clr-text);
      text-align: right;
    }

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

    /* ── Pronósticos específicos ─────────────────────────────────────────── */
    .pronosticos-intro {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5em;
      font-size: 0.82rem;
      color: var(--clr-text-muted);
      background: var(--clr-surface-alt);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-md);
      padding: 0.75em 1em;
      margin-bottom: 1.25em;
    }

    .pronosticos-intro i { color: var(--clr-primary-light); flex-shrink: 0; }

    .legend-inline {
      display: inline-flex;
      align-items: center;
      gap: 0.5em;
      margin-top: 0.2em;
      font-size: 0.78rem;
      flex-wrap: wrap;
      width: 100%; /* Forza a que ocupe el ancho y se alinee a la izquierda */
    }

    .legend-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .pos-1-dot { background: #E61D25; }
    .pos-2-dot { background: #2A398D; }
    .pos-3-dot { background: #3CAC3B; }
    .pos-4-dot { background: #D1D4D1; border: 1px solid #aaa; }

    .pronosticos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 1.25em;
    }

    .pronostico-card .stat-card-header {
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 0.6em;
    }

    .pronostico-nota {
      font-size: 0.75rem;
      color: var(--clr-text-muted);
      font-style: italic;
      line-height: 1.4;
      flex: 1;
      min-width: 0;
    }

    /* Badges de posición */
    .pos-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      font-size: 0.62rem;
      font-weight: 700;
      flex-shrink: 0;
      font-family: var(--font-display);
    }

    .pos-badge-1 { background: #E61D25; color: white; }
    .pos-badge-2 { background: #2A398D; color: white; }
    .pos-badge-3 { background: #3CAC3B; color: white; }
    .pos-badge-4 { background: #D1D4D1; color: #555; }

    /* ── Responsive ──────────────────────────────────────────────────────── */
    @media (max-width: 1024px) {
      .stats-overview { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 700px) {
      .stats-grid, .pronosticos-grid { grid-template-columns: 1fr; }
      .barra-row { grid-template-columns: 100px 1fr 35px; }
      .tab-btn { padding: 0.55em 1em; font-size: 0.82rem; }
      .legend-inline { margin-left: 0; margin-top: 0.25em; }
    }

    @media (max-width: 600px) {
      .stats-overview { grid-template-columns: 1fr; }
    }
  `]
})
export class EstadisticasComponent implements OnInit {

  cargando     = signal(true);
  estadisticas = signal<EstadisticaPartido[]>([]);
  grupoActivo  = signal<string | null>(null);
  tabActivo    = signal<TabActivo>('estadisticas');
  grupoPronostico = signal<string | null>(null);

  readonly grupos = ['A','B','C','D','E','F','G','H','I','J','K','L'];

  // ── Datos de pronósticos ───────────────────────────────────────────────────
  readonly pronosticos: GrupoPronostico[] = [
    {
      grupo: 'A',
      nota: 'México aprovecha su localía histórica y clasifica 1°. República Checa asegura el 2° por su bloque táctico europeo.',
      equipos: [
        { nombre: 'México',         pos: 1, pct: 90 },
        { nombre: 'República Checa',pos: 2, pct: 72 },
        { nombre: 'Corea del Sur',  pos: 3, pct: 38 },
        { nombre: 'Sudáfrica',      pos: 4, pct: 8  },
      ]
    },
    {
      grupo: 'B',
      nota: 'Suiza gana la zona con oficio internacional. Canadá empuja con su localía y asegura el 2° lugar.',
      equipos: [
        { nombre: 'Suiza',                pos: 1, pct: 85 },
        { nombre: 'Canadá',               pos: 2, pct: 78 },
        { nombre: 'Bosnia y Herzegovina', pos: 3, pct: 25 },
        { nombre: 'Catar',                pos: 4, pct: 5  },
      ]
    },
    {
      grupo: 'C',
      nota: 'Brasil avanza 1° con puntaje ideal. Marruecos ratifica su nivel competitivo en el 2° lugar.',
      equipos: [
        { nombre: 'Brasil',    pos: 1, pct: 95 },
        { nombre: 'Marruecos', pos: 2, pct: 80 },
        { nombre: 'Escocia',   pos: 3, pct: 32 },
        { nombre: 'Haití',     pos: 4, pct: 4  },
      ]
    },
    {
      grupo: 'D',
      nota: 'Grupo de pocos goles. Estados Unidos lidera impulsado por sus estadios; Turquía se queda con el 2°.',
      equipos: [
        { nombre: 'Estados Unidos', pos: 1, pct: 82 },
        { nombre: 'Turquía',        pos: 2, pct: 68 },
        { nombre: 'Paraguay',       pos: 3, pct: 35 },
        { nombre: 'Australia',      pos: 4, pct: 18 },
      ]
    },
    {
      grupo: 'E',
      nota: 'Alemania consolida el 1°. Los modelos inclinan la balanza por Ecuador sobre Costa de Marfil para el 2°.',
      equipos: [
        { nombre: 'Alemania',        pos: 1, pct: 92 },
        { nombre: 'Ecuador',         pos: 2, pct: 62 },
        { nombre: 'Costa de Marfil', pos: 3, pct: 40 },
        { nombre: 'Curazao',         pos: 4, pct: 3  },
      ]
    },
    {
      grupo: 'F',
      nota: 'Países Bajos clasifica en la cima. Japón despliega su dinámica habitual para sellar la 2° posición.',
      equipos: [
        { nombre: 'Países Bajos', pos: 1, pct: 88 },
        { nombre: 'Japón',        pos: 2, pct: 74 },
        { nombre: 'Suecia',       pos: 3, pct: 42 },
        { nombre: 'Túnez',        pos: 4, pct: 10 },
      ]
    },
    {
      grupo: 'G',
      nota: 'Bélgica domina de manera invicta. Egipto asegura el 2° si mantiene su solidez defensiva africana.',
      equipos: [
        { nombre: 'Bélgica',        pos: 1, pct: 91 },
        { nombre: 'Egipto',         pos: 2, pct: 70 },
        { nombre: 'Irán',           pos: 3, pct: 22 },
        { nombre: 'Nueva Zelanda',  pos: 4, pct: 6  },
      ]
    },
    {
      grupo: 'H',
      nota: 'España, gran favorita del torneo, pasa como líder. Uruguay clasifica con holgura en el 2° puesto.',
      equipos: [
        { nombre: 'España',        pos: 1, pct: 94 },
        { nombre: 'Uruguay',       pos: 2, pct: 82 },
        { nombre: 'Arabia Saudí',  pos: 3, pct: 15 },
        { nombre: 'Cabo Verde',    pos: 4, pct: 5  },
      ]
    },
    {
      grupo: 'I',
      nota: 'Francia toma el liderazgo sin contratiempos. Noruega favorece levemente sobre Senegal para el 2°.',
      equipos: [
        { nombre: 'Francia',  pos: 1, pct: 93 },
        { nombre: 'Noruega',  pos: 2, pct: 58 },
        { nombre: 'Senegal',  pos: 3, pct: 52 },
        { nombre: 'Irak',     pos: 4, pct: 4  },
      ]
    },
    {
      grupo: 'J',
      nota: 'Argentina clasifica 1° ganando los tres partidos. Austria asegura el 2° por su ritmo europeo.',
      equipos: [
        { nombre: 'Argentina', pos: 1, pct: 96 },
        { nombre: 'Austria',   pos: 2, pct: 65 },
        { nombre: 'Argelia',   pos: 3, pct: 28 },
        { nombre: 'Jordania',  pos: 4, pct: 5  },
      ]
    },
    {
      grupo: 'K',
      nota: 'Portugal lidera con su recambio generacional. Colombia asegura el 2° por su gran momento colectivo.',
      equipos: [
        { nombre: 'Portugal',      pos: 1, pct: 89 },
        { nombre: 'Colombia',      pos: 2, pct: 76 },
        { nombre: 'Uzbekistán',    pos: 3, pct: 20 },
        { nombre: 'RD Congo',      pos: 4, pct: 8  },
      ]
    },
    {
      grupo: 'L',
      nota: 'Inglaterra lidera con comodidad. La experiencia de Croacia en torneos cortos le asegura el 2° puesto.',
      equipos: [
        { nombre: 'Inglaterra', pos: 1, pct: 90 },
        { nombre: 'Croacia',    pos: 2, pct: 75 },
        { nombre: 'Ghana',      pos: 3, pct: 18 },
        { nombre: 'Panamá',     pos: 4, pct: 6  },
      ]
    },
  ];

  constructor(private estadisticaService: EstadisticaService) {}

  ngOnInit(): void {
    this.estadisticaService.getEstadisticas().subscribe({
      next: data => { this.estadisticas.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false)
    });
  }

  // ── Métodos estadísticas ───────────────────────────────────────────────────

  estadisticasFiltradas(): EstadisticaPartido[] {
    const activo = this.grupoActivo();
    if (!activo) return this.estadisticas();
    return this.estadisticas().filter(s => s.grupo === activo);
  }

  getPct(votos: number, total: number): number {
    return total === 0 ? 0 : Math.round((votos / total) * 100);
  }

  getFavorito(stat: EstadisticaPartido): string {
    const { votosLocal, votosEmpate, votosVisitante, totalVotos } = stat;
    if (totalVotos === 0) return '';
    const max = Math.max(votosLocal, votosEmpate, votosVisitante);
    let countMax = 0;
    if (votosLocal     === max) countMax++;
    if (votosEmpate    === max) countMax++;
    if (votosVisitante === max) countMax++;
    if (countMax > 1 || max === 0) return '';
    if (max === votosLocal)     return stat.equipoLocal;
    if (max === votosEmpate)    return 'Empate';
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
    return this.estadisticas().length > 0 ? this.estadisticas()[0].totalVotos : 0;
  }

  // ── Métodos pronósticos ────────────────────────────────────────────────────

  pronosticosFiltrados(): GrupoPronostico[] {
    const g = this.grupoPronostico();
    return g ? this.pronosticos.filter(p => p.grupo === g) : this.pronosticos;
  }

  getPctRelativo(pct: number, equipos: EquipoPronostico[]): number {
    const max = Math.max(...equipos.map(e => e.pct));
    return Math.round((pct / max) * 100);
  }
}