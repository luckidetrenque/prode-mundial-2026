// src/app/features/admin/cargar-resultados/cargar-resultados.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PartidoService } from '../../../core/services/partido.service';
import { ResultadoService } from '../../../core/services/resultado.service';
import { Partido } from '../../../shared/models/partido.model';
import { ResultadoPrediccion } from '../../../shared/models/planilla.model';

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
        <p class="msg-success">✅ {{ mensajeExito() }}</p>
      }

      @if (mensajeError()) {
        <p class="msg-error">❌ {{ mensajeError() }}</p>
      }

      @if (!cargando() && partidos().length > 0) {
        <p class="subtitulo">
          Seleccioná el resultado para cada partido jugado y hacé clic en <strong>Guardar</strong>.
        </p>

        @for (grupo of grupos; track grupo) {
          @if (getPartidosPorGrupo(grupo).length > 0) {
            <div class="grupo-bloque">
              <h3 class="grupo-titulo">Grupo {{ grupo }}</h3>
              <table class="tabla-resultados">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Local</th>
                    <th>Visitante</th>
                    <th>Resultado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  @for (partido of getPartidosPorGrupo(grupo); track partido.id) {
                    <tr [class.guardado]="resultadosGuardados().has(partido.id)">
                      <td class="num">{{ partido.numero }}</td>
                      <td>
                        <img [src]="partido.equipoLocalBandera" class="flag" width="22" />
                        {{ partido.equipoLocalShow }}
                      </td>
                      <td>
                        <img [src]="partido.equipoVisitanteBandera" class="flag" width="22" />
                        {{ partido.equipoVisitanteShow }}
                      </td>
                      <td class="select-td">
                        <select
                          class="resultado-select"
                          [value]="getResultadoSeleccionado(partido.id)"
                          (change)="seleccionarResultado(partido.id, $event)"
                        >
                          <option value="">-- Elegir --</option>
                          <option value="LOCAL">Local gana</option>
                          <option value="EMPATE">Empate</option>
                          <option value="VISITANTE">Visitante gana</option>
                        </select>
                      </td>
                      <td>
                        <button
                          class="btn btn-primary btn-sm"
                          [disabled]="!getResultadoSeleccionado(partido.id) || guardando() === partido.id"
                          (click)="guardar(partido.id)"
                        >
                          @if (guardando() === partido.id) {
                            <i class="fas fa-spinner fa-spin"></i>
                          } @else if (resultadosGuardados().has(partido.id)) {
                            <i class="fas fa-check"></i>
                          } @else {
                            Guardar
                          }
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      }
    </main>
  `,
  styles: [`
    .subtitulo { font-size: 0.9rem; color: #555; margin-bottom: 1.5em; }

    .grupo-bloque { margin-bottom: 2em; }

    .grupo-titulo {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--clr-primary);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 0.5em;
      border-bottom: 2px solid var(--clr-primary-light);
      padding-bottom: 0.25em;
    }

    .tabla-resultados { font-size: 0.85rem; }
    .tabla-resultados td, .tabla-resultados th { vertical-align: middle; }

    .num { color: var(--clr-primary); font-weight: bold; width: 30px; }

    .select-td { width: 160px; }

    .resultado-select {
      width: 100%;
      padding: 0.35em 0.5em;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-size: 0.82rem;
      cursor: pointer;
    }

    .btn-sm { padding: 0.3em 0.75em; font-size: 0.82rem; min-width: 70px; }

    tr.guardado { background-color: #e8f8f0 !important; }
  `]
})
export class CargarResultadosComponent implements OnInit {

  cargando   = signal(true);
  guardando  = signal<number | null>(null);
  mensajeExito = signal<string | null>(null);
  mensajeError = signal<string | null>(null);

  partidos = signal<Partido[]>([]);

  // Map<partidoId, resultado seleccionado>
  private selecciones = new Map<number, string>();
  resultadosGuardados = signal<Set<number>>(new Set());

  grupos = GRUPOS;

  constructor(
    private partidoService: PartidoService,
    private resultadoService: ResultadoService
  ) {}

  ngOnInit(): void {
    this.partidoService.getPartidos().subscribe({
      next: data => {
        this.partidos.set(data.filter(p => p.fase === 'GRUPOS'));
        this.cargando.set(false);
      },
      error: () => {
        this.mensajeError.set('No se pudieron cargar los partidos.');
        this.cargando.set(false);
      }
    });
  }

  getPartidosPorGrupo(grupo: string): Partido[] {
    return this.partidos().filter(p => p.grupo === grupo);
  }

  seleccionarResultado(partidoId: number, evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value;
    this.selecciones.set(partidoId, valor);
  }

  getResultadoSeleccionado(partidoId: number): string {
    return this.selecciones.get(partidoId) ?? '';
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
