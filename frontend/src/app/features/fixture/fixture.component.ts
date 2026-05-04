// fixture.component.ts — VERSIÓN MEJORADA
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { PartidoService } from '../../core/services/partido.service';
import { Partido } from '../../shared/models/partido.model';
import { ShortCountryPipe } from '../../shared/pipes/short-country.pipe';

type VistaFiltro = 'GRUPOS' | 'DIECISEISAVOS' | 'OCTAVOS' | 'CUARTOS' | 'SEMIFINAL' | 'FINAL';

@Component({
  selector: 'app-fixture',
  standalone: true,
  imports: [CommonModule, DatePipe, ShortCountryPipe],
  template: `
    <main class="main">
      <h2><i class="fas fa-calendar-days"></i> Fixture de la Copa del Mundo 2026</h2>

      <p class="subtitulo">
        <i class="fas fa-circle-info" style="color:var(--clr-primary-light);font-size:0.8rem"></i>
        Calendario completo de los <strong>72 partidos</strong> de la fase de grupos.
      </p>

      <!-- Filtro de fases (Oculto temporalmente)
      <div class="fase-tabs">
        @for (fase of fases; track fase.valor) {
          <button
            class="fase-tab"
            [class.activo]="filtroActual() === fase.valor"
            (click)="filtroActual.set(fase.valor)"
          >
            <i [class]="fase.icono" style="font-size:0.75rem"></i>
            {{ fase.label }}
            @if (filtroActual() === fase.valor && !cargando()) {
              <span class="fase-count">{{ cantidadFiltrada() }}</span>
            }
          </button>
        }
      </div>
      -->

      @if (cargando()) {
        <div class="spinner-container"><div class="spinner"></div></div>
      }

      <!-- Vista grupos -->
      @if (!cargando() && filtroActual() === 'GRUPOS') {

        <!-- Sub-filtro de grupo (Oculto temporalmente)
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
        -->

        <div class="groups-grid">
          @for (grupo of gruposMostrados(); track grupo) {
            <div class="group-table-wrap">
              <div class="group-caption">
                <span class="group-label">GRUPO</span>
                <span class="group-letter">{{ grupo }}</span>
              </div>
              <table class="tabla-grupo">
                <thead>
                  <tr>
                    <th class="th-num">#</th>
                    <th>Local</th>
                    <th class="th-center"></th>
                    <th>Visitante</th>
                    <th class="th-date">Fecha</th>
                    <th class="th-sede">Sede</th>
                  </tr>
                </thead>
                <tbody>
                  @for (partido of getPartidosPorGrupo(grupo); track partido.id) {
                    <tr [class.partido-jugado]="esJugado(partido)">
                      <td class="th-num col-muted">{{ partido.numero }}</td>
                      <td class="td-equipo">
                        <div class="equipo-vertical">
                          <img [src]="partido.equipoLocalBandera" [alt]="partido.equipoLocalShow" class="flag" width="20" height="13" />
                          <span class="equipo-txt">{{ partido.equipoLocalShow | shortCountry }}</span>
                        </div>
                      </td>
                      <td class="th-center">
                        @if (esJugado(partido)) {
                          <span class="badge-final">Final</span>
                        } @else {
                          <span class="badge-vs">VS</span>
                        }
                      </td>
                      <td class="td-equipo">
                        <div class="equipo-vertical">
                          <img [src]="partido.equipoVisitanteBandera" [alt]="partido.equipoVisitanteShow" class="flag" width="20" height="13" />
                          <span class="equipo-txt">{{ partido.equipoVisitanteShow | shortCountry }}</span>
                        </div>
                      </td>
                      <td class="th-date col-muted">
                        <div class="date-vertical">
                          <span>{{ partido.fechaHora | date:'dd/MM' }}</span>
                          <span class="time-txt">{{ partido.fechaHora | date:'HH:mm' }}</span>
                        </div>
                      </td>
                      <td class="th-sede col-muted">{{ formatEstadio(partido.sede) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- Vista eliminatorias -->
      @if (!cargando() && filtroActual() !== 'GRUPOS') {
        <div class="elim-wrap">
          @for (partido of partidosFiltrados(); track partido.id) {
            <div class="elim-card">
              <span class="elim-num">#{{ partido.numero }}</span>

              <div class="elim-equipo elim-equipo--local">
                @if (partido.equipoLocalShow) {
                  <img [src]="partido.equipoLocalBandera" [alt]="partido.equipoLocalShow" class="flag flag-elim" width="32" height="21" />
                  <span class="elim-nomb">{{ partido.equipoLocalShow | shortCountry }}</span>
                } @else {
                  <span class="por-definir">Por definir</span>
                }
              </div>

              <div class="elim-vs">VS</div>

              <div class="elim-equipo elim-equipo--visit">
                @if (partido.equipoVisitanteShow) {
                  <span class="elim-nomb">{{ partido.equipoVisitanteShow | shortCountry }}</span>
                  <img [src]="partido.equipoVisitanteBandera" [alt]="partido.equipoVisitanteShow" class="flag flag-elim" width="32" height="21" />
                } @else {
                  <span class="por-definir">Por definir</span>
                }
              </div>

              <div class="elim-meta">
                <span class="elim-fecha">{{ partido.fechaHora | date:'dd/MM/yyyy' }}</span>
                <span class="elim-hora">{{ partido.fechaHora | date:'HH:mm' }} hs</span>
                <span class="elim-sede">{{ formatEstadio(partido.sede) }}</span>
              </div>
            </div>
          }
        </div>
      }

    </main>
  `,
  styles: [`
    /* ── Subtítulo ───────────────────────────────────────────────────────── */
    .subtitulo {
      font-size: 0.85rem;
      color: var(--clr-text-muted);
      margin-bottom: 1.5em;
      display: flex;
      align-items: center;
      gap: 0.4em;
    }

    /* ── Tabs de fase ────────────────────────────────────────────────────── */
    .fase-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4em;
      margin-bottom: 1.25em;
      padding-bottom: 1em;
      border-bottom: 1px solid var(--clr-border);
    }

    .fase-tab {
      display: inline-flex;
      align-items: center;
      gap: 0.4em;
      padding: 0.5em 1.2em;
      border: 1px solid var(--clr-border-strong);
      border-radius: 20px;
      background: var(--clr-surface);
      color: var(--clr-text-muted);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      font-family: var(--font-body);
    }

    .fase-tab:hover { border-color: var(--wc-mexico); color: var(--wc-mexico); background: rgba(60, 172, 59, 0.05); }
    .fase-tab.activo { 
      border-color: var(--wc-usa); 
      background: linear-gradient(135deg, var(--wc-usa), #3a4bb0); 
      color: white; 
      box-shadow: 0 4px 12px rgba(42, 57, 141, 0.3);
    }

    .fase-count {
      background: rgba(255,255,255,0.2);
      border-radius: 10px;
      padding: 0 6px;
      font-size: 0.7rem;
    }

    .fase-tab:not(.activo) .fase-count {
      background: var(--clr-surface-alt);
      color: var(--clr-text-muted);
    }

    /* ── Sub-filtro grupos ───────────────────────────────────────────────── */
    .filtro-grupos {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3em;
      margin-bottom: 1.25em;
    }

    .btn-grupo {
      padding: 0.3em 0.8em;
      border: 1px solid var(--clr-border-strong);
      border-radius: 20px;
      background: var(--clr-surface);
      color: var(--clr-text-muted);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      font-family: var(--font-body);
    }

    .btn-grupo:hover { border-color: var(--wc-mexico); color: var(--wc-mexico); }
    .btn-grupo.activo { border-color: var(--wc-mexico); background: var(--wc-mexico); color: white; }

    /* ── Groups grid ─────────────────────────────────────────────────────── */
    .groups-grid { gap: 1.25em; }

    .group-table-wrap {
      border: 1px solid var(--clr-border-strong);
      border-radius: var(--radius-md);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      background: var(--clr-surface);
    }

    .group-caption {
      display: flex;
      align-items: center;
      gap: 0.4em;
      padding: 0.6em 1em;
      background: linear-gradient(to right, var(--wc-usa), #3a4bb0);
    }

    .group-letter {
      font-family: var(--font-display);
      font-size: 1.2rem;
      font-weight: 700;
      color: white;
    }

    .group-label {
      font-family: var(--font-display);
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 2px;
      color: rgba(255,255,255,0.7);
    }

    .tabla-grupo { margin: 0; table-layout: fixed; }
    .tabla-grupo thead th { 
      background: #f8fafb; 
      border-bottom: 1px solid var(--clr-border-strong);
      padding: var(--spacing-xs) var(--spacing-sm);
      font-size: 0.65rem;
    }

    .tabla-grupo tbody td {
      padding: var(--spacing-sm);
      font-size: 0.78rem;
    }

    /* Columnas optimizadas */
    .th-num   { width: 22px; text-align: center; }
    .th-center { text-align: center; width: 28px; }
    .th-date  { width: 45px; text-align: center; }
    .th-sede  { width: 85px; line-height: 1.1; white-space: normal !important; }
    .col-muted { color: var(--clr-text-muted); }

    .date-vertical {
      display: flex;
      flex-direction: column;
      align-items: center;
      line-height: 1.1;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .time-txt {
      font-size: 0.65rem;
      font-weight: 400;
      opacity: 0.8;
    }

    .equipo-vertical {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
    }

    .equipo-txt {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1px;
      color: var(--wc-neutral-dark);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 65px;
      line-height: 1;
      margin-top: 2px;
    }

    /* Badges */
    .badge-final {
      display: inline-block;
      background: #e8f5e9;
      color: var(--wc-mexico);
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      padding: 0.2em 0.6em;
      border-radius: 8px;
    }

    .badge-vs {
      display: inline-block;
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--clr-text-muted);
      letter-spacing: 1px;
    }

    .partido-jugado td { opacity: 0.6; }

    /* ── Eliminatorias ───────────────────────────────────────────────────── */
    .elim-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.8em;
    }

    .elim-card {
      display: grid;
      grid-template-columns: 28px 1fr 44px 1fr auto;
      align-items: center;
      gap: 1em;
      padding: 1em 1.25em;
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      transition: var(--transition);
    }

    .elim-card:hover { 
      border-color: var(--wc-usa); 
      box-shadow: 0 8px 24px rgba(0,0,0,0.08); 
      transform: scale(1.01);
    }

    .elim-num { font-size: 0.7rem; font-weight: 700; color: var(--clr-text-muted); text-align: center; }

    .elim-equipo {
      display: flex;
      align-items: center;
      gap: 0.6em;
    }

    .elim-equipo--local  { justify-content: flex-end; }
    .elim-equipo--visit  { justify-content: flex-start; }

    .elim-nomb {
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: var(--wc-neutral-dark);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 140px;
    }

    .flag-elim { 
      border-radius: 4px; 
      box-shadow: 0 2px 5px rgba(0,0,0,0.15); 
      flex-shrink: 0; 
      border: 1px solid rgba(0,0,0,0.05);
    }

    .elim-vs {
      text-align: center;
      font-family: var(--font-display);
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--wc-canada);
      letter-spacing: 1px;
    }

    .elim-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.15em;
    }

    .elim-fecha { font-size: 0.78rem; font-weight: 700; color: var(--wc-neutral-dark); }
    .elim-hora  { font-size: 0.7rem; color: var(--clr-text-muted); font-weight: 500; }
    .elim-sede  { font-size: 0.68rem; color: var(--clr-text-muted); max-width: 120px; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.8; }

    .por-definir { font-size: 0.78rem; color: var(--clr-text-muted); font-style: italic; font-weight: 500; }

    /* ── Responsive ──────────────────────────────────────────────────────── */
    @media (max-width: 640px) {
      .equipo-txt { display: none; }
      .th-sede    { display: none; }
      .elim-card  { grid-template-columns: 24px 1fr 36px 1fr; }
      .elim-meta  { display: none; }
      .elim-nomb  { font-size: 0.75rem; }
      .subtitulo  { font-size: 0.78rem; }
    }

  `]
})
export class FixtureComponent implements OnInit {

  cargando     = signal(true);
  filtroActual = signal<VistaFiltro>('GRUPOS');
  grupoActivo  = signal<string | null>(null);

  private todosLosPartidos: Partido[] = [];

  grupos = ['A','B','C','D','E','F','G','H','I','J','K','L'];

  fases = [
    { valor: 'GRUPOS'        as VistaFiltro, label: 'Grupos',      icono: 'fas fa-layer-group' },
    { valor: 'DIECISEISAVOS' as VistaFiltro, label: '16avos',      icono: 'fas fa-futbol' },
    { valor: 'OCTAVOS'       as VistaFiltro, label: 'Octavos',     icono: 'fas fa-futbol' },
    { valor: 'CUARTOS'       as VistaFiltro, label: 'Cuartos',     icono: 'fas fa-futbol' },
    { valor: 'SEMIFINAL'     as VistaFiltro, label: 'Semis',       icono: 'fas fa-futbol' },
    { valor: 'FINAL'         as VistaFiltro, label: 'Final',       icono: 'fas fa-star' },
  ];

  partidosFiltrados = computed(() =>
    this.todosLosPartidos.filter(p => p.fase === this.filtroActual())
  );

  cantidadFiltrada = computed(() => this.partidosFiltrados().length);

  constructor(private partidoService: PartidoService) {}

  ngOnInit(): void {
    this.partidoService.getPartidos().subscribe({
      next: partidos => {
        this.todosLosPartidos = partidos;
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  gruposMostrados(): string[] {
    const activo = this.grupoActivo();
    if (activo) return [activo];
    return this.grupos;
  }

  getPartidosPorGrupo(grupo: string): Partido[] {
    return this.todosLosPartidos.filter(p => p.grupo === grupo);
  }

  esJugado(partido: Partido): boolean {
    return new Date(partido.fechaHora) < new Date();
  }

  formatEstadio(sede: string): string {
    if (!sede) return '';
    return sede.replace(/ Stadium/gi, '').trim();
  }
}
