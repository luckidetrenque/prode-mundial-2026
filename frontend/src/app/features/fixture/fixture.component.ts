// src/app/features/fixture/fixture.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { PartidoService } from '../../core/services/partido.service';
import { Partido } from '../../shared/models/partido.model';

type VistaFiltro = 'GRUPOS' | 'OCTAVOS' | 'CUARTOS' | 'SEMIFINAL' | 'FINAL';

@Component({
  selector: 'app-fixture',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <main class="main">
      <h2><i class="fas fa-calendar-days"></i> Fixture — Copa del Mundo 2026</h2>
      <p class="subtitulo">
        Canadá · Estados Unidos · México | 11 de junio – 19 de julio de 2026
      </p>

      <!-- Filtro por fase -->
      <div class="filtro-fases">
        @for (fase of fases; track fase.valor) {
          <button
            class="btn-fase"
            [class.activo]="filtroActual() === fase.valor"
            (click)="filtroActual.set(fase.valor)"
          >
            {{ fase.label }}
          </button>
        }
      </div>

      <!-- Cargando -->
      @if (cargando()) {
        <div class="spinner-container"><div class="spinner"></div></div>
      }

      <!-- Vista fase de grupos: por grupo -->
      @if (!cargando() && filtroActual() === 'GRUPOS') {
        <div class="groups-grid">
          @for (grupo of grupos; track grupo) {

            <table class="group-table">
              <caption>GRUPO {{ grupo }}</caption>
              <thead>
                <tr>
                  <th>#</th>
                  <th colspan="2">Local</th>
                  <th colspan="2">Visitante</th>
                  <th>Fecha y hora</th>
                  <th>Sede</th>
                </tr>
              </thead>
              <tbody>
                @for (partido of getPartidosPorGrupo(grupo); track partido.id) {
                  <tr [class.partido-jugado]="esJugado(partido)">
                    <td>{{ partido.numero }}</td>
                    <td>
                      <img
                        [src]="partido.equipoLocalBandera"
                        [alt]="partido.equipoLocalShow"
                        class="flag" width="24" height="16"
                      />
                    </td>
                    <td class="equipo-td">{{ partido.equipoLocalShow }}</td>
                    <td>
                      <img
                        [src]="partido.equipoVisitanteBandera"
                        [alt]="partido.equipoVisitanteShow"
                        class="flag" width="24" height="16"
                      />
                    </td>
                    <td class="equipo-td">{{ partido.equipoVisitanteShow }}</td>
                    <td class="fecha-td">
                      @if (esJugado(partido)) {
                        <span class="badge-final">
                          <i class="fas fa-whistle"></i> FINAL
                        </span>
                      } @else {
                        {{ partido.fechaHora | date:'dd/MM HH:mm' }} hs.
                      }
                    </td>
                    <td class="sede-td">{{ partido.sede }}</td>
                  </tr>
                }
              </tbody>
            </table>

          }
        </div>
      }

      <!-- Vista eliminatorias: lista simple -->
      @if (!cargando() && filtroActual() !== 'GRUPOS') {
        <table class="tabla-eliminatorias">
          <thead>
            <tr>
              <th>#</th>
              <th>Local</th>
              <th>Visitante</th>
              <th>Fecha y hora</th>
              <th>Sede</th>
            </tr>
          </thead>
          <tbody>
            @for (partido of partidosFiltrados(); track partido.id) {
              <tr>
                <td>{{ partido.numero }}</td>
                <td>
                  @if (partido.equipoLocalShow) {
                    <img [src]="partido.equipoLocalBandera" class="flag" width="24" height="16" />
                    {{ partido.equipoLocalShow }}
                  } @else {
                    <span class="por-definir">Por definir</span>
                  }
                </td>
                <td>
                  @if (partido.equipoVisitanteShow) {
                    <img [src]="partido.equipoVisitanteBandera" class="flag" width="24" height="16" />
                    {{ partido.equipoVisitanteShow }}
                  } @else {
                    <span class="por-definir">Por definir</span>
                  }
                </td>
                <td>{{ partido.fechaHora | date:'dd/MM/yyyy HH:mm' }} hs.</td>
                <td>{{ partido.sede }}</td>
              </tr>
            }
          </tbody>
        </table>
      }

    </main>
  `,
  styles: [`
    .subtitulo {
      color: #666;
      font-size: 0.85rem;
      margin-bottom: 1.25em;
    }

    .filtro-fases {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5em;
      margin-bottom: 1.5em;
    }

    .btn-fase {
      padding: 0.4em 1em;
      border: 1px solid var(--clr-primary);
      border-radius: 20px;
      background: white;
      color: var(--clr-primary);
      font-weight: bold;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-fase:hover, .btn-fase.activo {
      background: var(--clr-primary);
      color: white;
    }

    .equipo-td { font-size: 0.75rem; text-transform: uppercase; }
    .fecha-td  { font-size: 0.75rem; white-space: nowrap; }
    .sede-td   { font-size: 0.75rem; color: #555; }

    .partido-jugado { background-color: #f0f9f0 !important; }

    .badge-final {
      background: var(--clr-primary-light);
      color: white;
      padding: 0.15em 0.5em;
      border-radius: 10px;
      font-size: 0.7rem;
      font-weight: bold;
    }

    .por-definir {
      color: #aaa;
      font-style: italic;
      font-size: 0.8rem;
    }

    .tabla-eliminatorias { margin-top: 0.5em; }

    @media (max-width: 576px) {
      .sede-td { display: none; }
      .groups-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class FixtureComponent implements OnInit {

  cargando     = signal(true);
  filtroActual = signal<VistaFiltro>('GRUPOS');

  private todosLosPartidos: Partido[] = [];

  grupos = ['A','B','C','D','E','F','G','H','I','J','K','L'];

  fases = [
    { valor: 'GRUPOS'    as VistaFiltro, label: 'Fase de Grupos' },
    { valor: 'OCTAVOS'   as VistaFiltro, label: 'Octavos'        },
    { valor: 'CUARTOS'   as VistaFiltro, label: 'Cuartos'        },
    { valor: 'SEMIFINAL' as VistaFiltro, label: 'Semifinales'    },
    { valor: 'FINAL'     as VistaFiltro, label: 'Final'          },
  ];

  // computed() recalcula automáticamente cuando cambia filtroActual
  partidosFiltrados = computed(() =>
    this.todosLosPartidos.filter(p => p.fase === this.filtroActual())
  );

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

  getPartidosPorGrupo(grupo: string): Partido[] {
    return this.todosLosPartidos.filter(p => p.grupo === grupo);
  }

  esJugado(partido: Partido): boolean {
    return new Date(partido.fechaHora) < new Date();
  }
}
