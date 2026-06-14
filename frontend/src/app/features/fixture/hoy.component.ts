// hoy.component.ts — Partidos del Día
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PartidoService } from '../../core/services/partido.service';
import { ResultadoService } from '../../core/services/resultado.service';
import { Partido } from '../../shared/models/partido.model';
import { ShortCountryPipe } from '../../shared/pipes/short-country.pipe';

@Component({
  selector: 'app-hoy',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, ShortCountryPipe],
  template: `
    <main class="main">
      <h2><i class="fas fa-calendar-days"></i> Fixture de la Copa del Mundo 2026</h2>

      <!-- Toggle de vistas -->
      <div class="vista-toggle">
        <span class="pill-btn pill-btn--activo">
          <i class="fas fa-bolt"></i> Partidos de hoy
        </span>
        <a routerLink="/fixture/completo" class="pill-btn">
          <i class="fas fa-list"></i> Fixture completo
        </a>
      </div>

      @if (cargando()) {
        <div class="spinner-container"><div class="spinner"></div></div>
      }

      @if (!cargando()) {
        <div class="hoy-header">
          <i class="fas fa-calendar-check" style="color:var(--clr-primary)"></i>
          <span>{{ fechaHoy() }}</span>
          <span class="badge-count">{{ partidosHoy().length }} partido{{ partidosHoy().length !== 1 ? 's' : '' }}</span>
        </div>

        @if (partidosHoy().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">🏟️</div>
            <h3>Sin partidos hoy</h3>
            <p>No hay partidos programados para el día de hoy.</p>
            <a routerLink="/fixture" class="btn-volver">
              <i class="fas fa-list"></i> Ver fixture completo
            </a>
          </div>
        }

        @if (partidosHoy().length > 0) {
          <div class="hoy-grid">
            @for (partido of partidosHoy(); track partido.id) {
              <div class="hoy-card" [class.jugado]="esJugado(partido)" [class.jugando]="esJugando(partido)">

                <!-- Número y fase -->
                <div class="card-top">
                  <span class="card-num">#{{ partido.numero }}</span>
                  <span class="card-fase">{{ partido.fase === 'GRUPOS' ? 'Grupo ' + partido.grupo : faseLabel(partido.fase) }}</span>
                  @if (partido.multiplicador > 1) {
                    <span class="multi-badge" title="Partido vale doble puntaje">
                      <i class="fas fa-bolt" style="font-size:0.5rem"></i>x2
                    </span>
                  }
                </div>

                <!-- Equipos -->
                <div class="card-match">
                  <!-- Local -->
                  <div class="card-equipo card-equipo--local">
                    <img [src]="partido.equipoLocalBandera" [alt]="partido.equipoLocalShow" class="flag-hoy" width="40" height="27" />
                    <span class="equipo-nombre">{{ partido.equipoLocalShow | shortCountry }}</span>
                  </div>

                  <!-- Separador central -->
                  <div class="card-center">
                    @if (esJugado(partido)) {
                      <div style="display:flex; flex-direction:column; align-items:center; gap:3px">
                        <span class="badge-final">Final</span>
                        @if (getGolesLocal(partido.id) !== null) {
                          <span style="font-size:1.1rem; font-weight:800; color:var(--wc-neutral-dark); font-family:var(--font-display)">
                            {{ getGolesLocal(partido.id) }} - {{ getGolesVisitante(partido.id) }}
                          </span>
                        }
                      </div>
                    } @else if (esJugando(partido)) {
                      <span class="badge-jugando">En vivo</span>
                    } @else {
                      <span class="card-hora">{{ partido.fechaHora | date:'HH:mm' }}</span>
                      <span class="card-hs">hs</span>
                    }
                  </div>

                  <!-- Visitante -->
                  <div class="card-equipo card-equipo--visit">
                    <img [src]="partido.equipoVisitanteBandera" [alt]="partido.equipoVisitanteShow" class="flag-hoy" width="40" height="27" />
                    <span class="equipo-nombre">{{ partido.equipoVisitanteShow | shortCountry }}</span>
                  </div>
                </div>

                <!-- Sede -->
                <div class="card-sede">
                  <i class="fas fa-location-dot" style="font-size:0.65rem; opacity:0.6"></i>
                  {{ formatEstadio(partido.sede) }}
                </div>

              </div>
            }
          </div>
        }
      }
    </main>
  `,
  styles: [`
    /* ── Toggle de vistas ────────────────────────────────────────────────── */
    .vista-toggle {
      display: flex;
      gap: 0.5em;
      margin-bottom: 1.5em;
    }

    .pill-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4em;
      padding: 0.45em 1.1em;
      border: 1px solid var(--clr-border-strong);
      border-radius: 20px;
      background: var(--clr-surface);
      color: var(--clr-text-muted);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: var(--transition);
      font-family: var(--font-body);
    }

    .pill-btn:hover {
      border-color: var(--wc-mexico);
      color: var(--wc-mexico);
      background: rgba(60,172,59,0.05);
    }

    .pill-btn--activo {
      border-color: var(--wc-usa);
      background: linear-gradient(135deg, var(--wc-usa), #3a4bb0);
      color: white;
      box-shadow: 0 4px 12px rgba(42,57,141,0.3);
      cursor: default;
    }

    .pill-btn--activo:hover {
      border-color: var(--wc-usa);
      color: white;
      background: linear-gradient(135deg, var(--wc-usa), #3a4bb0);
    }

    /* ── Header del día ──────────────────────────────────────────────────── */
    .hoy-header {
      display: flex;
      align-items: center;
      gap: 0.6em;
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--clr-text-muted);
      margin-bottom: 1.25em;
      text-transform: capitalize;
    }

    .badge-count {
      background: var(--clr-primary);
      color: white;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2em 0.65em;
      border-radius: 12px;
    }

    /* ── Grid de tarjetas ────────────────────────────────────────────────── */
    .hoy-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1em;
      padding-right: 0.5em;
    }

    /* ── Tarjeta de partido ──────────────────────────────────────────────── */
    .hoy-card {
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-lg);
      padding: 1em 1.25em 0.85em;
      box-shadow: var(--shadow-sm);
      transition: var(--transition);
      display: flex;
      flex-direction: column;
      gap: 0.75em;
    }

    .hoy-card:hover {
      border-color: var(--wc-usa);
      box-shadow: 0 8px 24px rgba(0,0,0,0.09);
      transform: translateY(-2px);
    }

    .hoy-card.jugado {
      opacity: 0.65;
    }

    .hoy-card.jugando {
      border-color: #1976d2;
      box-shadow: 0 0 0 2px rgba(25,118,210,0.18), 0 8px 24px rgba(25,118,210,0.08);
    }

    /* Top bar */
    .card-top {
      display: flex;
      align-items: center;
      gap: 0.5em;
    }

    .card-num {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--clr-text-muted);
    }

    .card-fase {
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: var(--clr-text-muted);
      background: var(--clr-surface-alt);
      border-radius: 6px;
      padding: 0.15em 0.5em;
    }

    .multi-badge {
      display: inline-flex;
      align-items: center;
      gap: 1px;
      background: #ffc107;
      color: #856404;
      font-size: 0.55rem;
      font-weight: 800;
      padding: 1px 4px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    /* Match row */
    .card-match {
      display: grid;
      grid-template-columns: 1fr 64px 1fr;
      align-items: center;
      gap: 0.5em;
    }

    .card-equipo {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35em;
    }

    .card-equipo--local  { align-items: flex-end; }
    .card-equipo--visit  { align-items: flex-start; }

    .flag-hoy {
      border-radius: 4px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      border: 1px solid rgba(0,0,0,0.06);
    }

    .equipo-nombre {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      color: var(--wc-neutral-dark);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 90px;
      text-align: center;
    }

    /* Centro */
    .card-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .card-hora {
      font-family: var(--font-display);
      font-size: 1.3rem;
      font-weight: 800;
      color: var(--wc-neutral-dark);
      line-height: 1;
    }

    .card-hs {
      font-size: 0.6rem;
      color: var(--clr-text-muted);
      font-weight: 600;
    }

    .badge-final {
      display: inline-block;
      background: #e8f5e9;
      color: var(--wc-mexico);
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      padding: 0.25em 0.6em;
      border-radius: 8px;
    }

    .badge-jugando {
      display: inline-block;
      background: #e3f2fd;
      color: #1565c0;
      font-size: 0.6rem;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      padding: 0.25em 0.55em;
      border-radius: 8px;
      animation: pulse-live 1.5s ease-in-out infinite;
    }

    @keyframes pulse-live {
      0%   { box-shadow: 0 0 0 0 rgba(25,118,210,0.45); }
      70%  { box-shadow: 0 0 0 5px rgba(25,118,210,0); }
      100% { box-shadow: 0 0 0 0 rgba(25,118,210,0); }
    }

    /* Sede */
    .card-sede {
      font-size: 0.7rem;
      color: var(--clr-text-muted);
      display: flex;
      align-items: center;
      gap: 0.35em;
      border-top: 1px solid var(--clr-border);
      padding-top: 0.6em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ── Estado vacío ────────────────────────────────────────────────────── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75em;
      padding: 3.5em 2em;
      text-align: center;
      background: var(--clr-surface);
      border: 1px dashed var(--clr-border-strong);
      border-radius: var(--radius-lg);
    }

    .empty-icon { font-size: 2.5rem; }

    .empty-state h3 {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--wc-neutral-dark);
      margin: 0;
    }

    .empty-state p {
      font-size: 0.85rem;
      color: var(--clr-text-muted);
      margin: 0;
    }

    .btn-volver {
      display: inline-flex;
      align-items: center;
      gap: 0.4em;
      padding: 0.55em 1.2em;
      border: 1px solid var(--clr-border-strong);
      border-radius: 20px;
      background: var(--clr-surface);
      color: var(--clr-text-muted);
      font-size: 0.8rem;
      font-weight: 600;
      text-decoration: none;
      margin-top: 0.5em;
      transition: var(--transition);
    }

    .btn-volver:hover {
      border-color: var(--wc-mexico);
      color: var(--wc-mexico);
    }

    /* ── Responsive ──────────────────────────────────────────────────────── */
    @media (max-width: 640px) {
      .hoy-grid { grid-template-columns: 1fr; }
      .card-hora { font-size: 1.1rem; }
    }
  `]
})
export class HoyComponent implements OnInit {

  cargando = signal(true);

  private todosLosPartidos: Partido[] = [];
  private golesSignal = signal<Record<number, { local: number | null, visitante: number | null }>>({});

  partidosHoy = signal<Partido[]>([]);

  fechaHoy = computed(() => {
    const hoy = new Date();
    return hoy.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  constructor(private partidoService: PartidoService, private resultadoService: ResultadoService) {}

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

        const hoy = partidos
          .filter(p => this.esHoy(p))
          .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
        this.partidosHoy.set(hoy);
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

  esHoy(partido: Partido): boolean {
    const fechaPartido = new Date(partido.fechaHora);
    const hoy = new Date();
    return (
      fechaPartido.getFullYear() === hoy.getFullYear() &&
      fechaPartido.getMonth()    === hoy.getMonth()    &&
      fechaPartido.getDate()     === hoy.getDate()
    );
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

  formatEstadio(sede: string): string {
    if (!sede) return '';
    return sede.replace(/ Stadium/gi, '').trim();
  }

  faseLabel(fase: string): string {
    const labels: Record<string, string> = {
      GRUPOS: 'Grupos',
      DIECISEISAVOS: '16avos',
      OCTAVOS: 'Octavos',
      CUARTOS: 'Cuartos',
      SEMIFINAL: 'Semifinal',
      TERCER_PUESTO: 'Tercer Puesto',
      FINAL: 'Final',
    };
    return labels[fase] ?? fase;
  }
}
