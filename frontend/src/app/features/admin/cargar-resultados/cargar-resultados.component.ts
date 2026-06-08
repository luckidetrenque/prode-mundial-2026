// cargar-resultados.component.ts
// FIX #18: Se eliminan los estilos de .toast / .toast-success / .toast-error
// que estaban definidos localmente en el styles[] del componente.
// Son letra muerta: el componente ya usa ToastService (global) correctamente,
// y el ToastContainerComponent renderiza los toasts con sus propios estilos.
// Tener esos estilos duplicados localmente no tenía ningún efecto visible
// porque los toasts no se renderizan dentro del shadow de este componente.

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { PartidoService } from '../../../core/services/partido.service';
import { ResultadoService } from '../../../core/services/resultado.service';
import { ToastService } from '../../../core/services/toast.service';
import { Partido } from '../../../shared/models/partido.model';
import { FormsModule } from '@angular/forms';

const GRUPOS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

@Component({
  selector: 'app-cargar-resultados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  // FIX #18: template sin cambios — toda la lógica de UI es correcta.
  // Solo se elimina el bloque styles[] con los estilos .toast duplicados.
  // El template completo se mantiene igual al original.
  template: `
    <main class="main">
      <h2><i class="fas fa-database"></i> Cargar Resultados</h2>

      @if (cargando()) {
        <div class="spinner-container"><div class="spinner"></div></div>
      }

      @if (!cargando() && partidos().length > 0) {

        <div class="stats-overview">
          <div class="overview-card">
            <i class="fas fa-futbol"></i>
            <div class="overview-data">
              <span class="overview-num">{{ partidos().length }}</span>
              <span class="overview-label">Partidos Totales</span>
            </div>
          </div>
          <div class="overview-card">
            <i class="fas fa-check-double"></i>
            <div class="overview-data">
              <span class="overview-num">{{ resultadosGuardados().size }}</span>
              <span class="overview-label">Resultados Cargados</span>
            </div>
          </div>
          <div class="overview-card">
            <i class="fas fa-hourglass-half"></i>
            <div class="overview-data">
              <span class="overview-num">{{ partidos().length - resultadosGuardados().size }}</span>
              <span class="overview-label">Resultados Pendientes</span>
            </div>
          </div>
          <div class="overview-card">
            <i class="fas fa-chart-pie"></i>
            <div class="overview-data">
              <span class="overview-num">
                {{ (partidos().length ? (resultadosGuardados().size / partidos().length * 100) : 0) | number:'1.0-0' }}%
              </span>
              <span class="overview-label">Progreso General</span>
            </div>
          </div>
        </div>

        <div class="filtro-grupos">
          <div class="filtro-izq">
            <button class="btn-grupo" [class.activo]="grupoActivo() === null" (click)="grupoActivo.set(null)">Todos</button>
            @for (g of grupos; track g) {
              <button class="btn-grupo" [class.activo]="grupoActivo() === g" [class.completo]="grupoCompleto(g)" (click)="grupoActivo.set(g)">
                {{ g }}
                @if (grupoCompleto(g)) { <i class="fas fa-check" style="font-size:0.6rem"></i> }
              </button>
            }
          </div>
          @if (grupoActivo()) {
            <button class="btn btn-reset" (click)="abrirConfirmacionReset(grupoActivo()!)"
              [disabled]="contarGuardadosEnGrupo(grupoActivo()!) === 0 || reseteando()">
              <i class="fas fa-rotate-left"></i> Resetear Grupo {{ grupoActivo() }}
            </button>
          } @else {
            <button class="btn btn-reset-all" (click)="abrirConfirmacionResetAll()"
              [disabled]="resultadosGuardados().size === 0 || reseteando()">
              <i class="fas fa-skull-crossbones"></i> Resetear TODO
            </button>
          }
        </div>

        @if (modalResetAbierto()) {
          <div class="modal-overlay" (click)="cerrarModalReset()">
            <div class="modal-content" (click)="$event.stopPropagation()">
              <div class="modal-header">
                <i class="fas fa-triangle-exclamation modal-icon-warning"></i>
                <h3>Confirmar Reset</h3>
              </div>
              <div class="modal-body">
                <p>¿Estás seguro que querés <strong>borrar todos los resultados</strong> del Grupo {{ grupoParaReset() }}?</p>
                <p class="modal-warning">
                  <i class="fas fa-info-circle"></i>
                  Esta acción eliminará {{ contarGuardadosEnGrupo(grupoParaReset()!) }} resultado(s) y <strong>no se puede deshacer</strong>.
                </p>
              </div>
              <div class="modal-footer">
                <button class="btn btn-secondary" (click)="cerrarModalReset()" [disabled]="reseteando()">Cancelar</button>
                <button class="btn btn-danger" (click)="confirmarReset()" [disabled]="reseteando()">
                  @if (reseteando()) { <i class="fas fa-spinner fa-spin"></i> Reseteando... }
                  @else { <i class="fas fa-trash"></i> Sí, resetear }
                </button>
              </div>
            </div>
          </div>
        }

        @if (modalResetAllAbierto()) {
          <div class="modal-overlay" (click)="cerrarModalResetAll()">
            <div class="modal-content" (click)="$event.stopPropagation()">
              <div class="modal-header">
                <i class="fas fa-skull-crossbones" style="color: #dc3545; font-size: 2rem;"></i>
                <h3 style="color: #dc3545;">¡ADVERTENCIA CRÍTICA!</h3>
              </div>
              <div class="modal-body">
                <p>Estás a punto de <strong>ELIMINAR ABSOLUTAMENTE TODOS LOS RESULTADOS</strong> ({{ resultadosGuardados().size }} resultados).</p>
                <p class="modal-warning" style="background: #f8d7da; border-color: #f5c6cb; color: #721c24;">
                  <i class="fas fa-exclamation-triangle"></i>
                  <strong>ESTA ACCIÓN ES IRREVERSIBLE.</strong>
                </p>
                <div style="margin-top: 1.5em;">
                  <label for="confirmText" style="display: block; margin-bottom: 0.5em; font-size: 0.85rem; font-weight: 600;">
                    Para confirmar, escribí "ELIMINAR TODO":
                  </label>
                  <input type="text" id="confirmText" class="form-control"
                    [ngModel]="resetAllTextoConf()" (ngModelChange)="resetAllTextoConf.set($event)"
                    placeholder="ELIMINAR TODO"
                    style="width: 100%; padding: 0.6em; border: 1px solid var(--clr-border-strong); border-radius: var(--radius-sm);" />
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-secondary" (click)="cerrarModalResetAll()" [disabled]="reseteando()">Cancelar</button>
                <button class="btn btn-danger" (click)="confirmarResetAll()"
                  [disabled]="reseteando() || resetAllTextoConf() !== 'ELIMINAR TODO'">
                  @if (reseteando()) { <i class="fas fa-spinner fa-spin"></i> Reseteando... }
                  @else { <i class="fas fa-bomb"></i> DESTRUIR TODO }
                </button>
              </div>
            </div>
          </div>
        }

        @for (grupo of gruposMostrados(); track grupo) {
          @if (getPartidosPorGrupo(grupo).length > 0) {
            <div class="grupo-bloque">
              <div class="grupo-header">
                <span class="grupo-tag">GRUPO {{ grupo }}</span>
                <span class="grupo-estado">{{ contarGuardadosEnGrupo(grupo) }}/{{ getPartidosPorGrupo(grupo).length }} cargados</span>
              </div>
              <div class="partidos-lista">
                @for (partido of getPartidosPorGrupo(grupo); track partido.id) {
                  <div class="partido-row" [class.guardado]="resultadosGuardados().has(partido.id)">
                    <span class="partido-n">#{{ partido.numero }}</span>
                    <div class="partido-equipo partido-equipo--local">
                      <span class="equipo-txt">{{ partido.equipoLocalShow }}</span>
                      <img [src]="partido.equipoLocalBandera" [alt]="partido.equipoLocalShow" class="flag" width="24" height="16" />
                    </div>
                    <div class="opciones-resultado">
                      <button class="opcion-btn" 
                        [class.activa-local]="getSeleccion(partido.id) === 'LOCAL'" 
                        (click)="seleccionarResultado(partido.id, 'LOCAL')" 
                        [disabled]="(resultadosGuardados().has(partido.id) && editando() !== partido.id) || guardando() === partido.id"
                        title="Local gana">L</button>
                      <button class="opcion-btn" 
                        [class.activa-empate]="getSeleccion(partido.id) === 'EMPATE'" 
                        (click)="seleccionarResultado(partido.id, 'EMPATE')" 
                        [disabled]="(resultadosGuardados().has(partido.id) && editando() !== partido.id) || guardando() === partido.id"
                        title="Empate">E</button>
                      <button class="opcion-btn" 
                        [class.activa-visitante]="getSeleccion(partido.id) === 'VISITANTE'" 
                        (click)="seleccionarResultado(partido.id, 'VISITANTE')" 
                        [disabled]="(resultadosGuardados().has(partido.id) && editando() !== partido.id) || guardando() === partido.id"
                        title="Visitante gana">V</button>
                    </div>
                    <div class="partido-equipo partido-equipo--visit">
                      <img [src]="partido.equipoVisitanteBandera" [alt]="partido.equipoVisitanteShow" class="flag" width="24" height="16" />
                      <span class="equipo-txt">{{ partido.equipoVisitanteShow }}</span>
                    </div>
                    <div class="partido-accion">
                      @if (resultadosGuardados().has(partido.id)) {
                        @if (editando() === partido.id) {
                          <button class="btn-accion-circular btn-guardar-edit" [disabled]="!getSeleccion(partido.id) || guardando() === partido.id" (click)="guardar(partido.id)" title="Confirmar cambios">
                            @if (guardando() === partido.id) { <i class="fas fa-spinner fa-spin"></i> } @else { <i class="fas fa-check"></i> }
                          </button>
                          <button class="btn-accion-circular btn-cancelar-edit" (click)="cancelarEdicion(partido.id)" [disabled]="guardando() === partido.id" title="Cancelar edición"><i class="fas fa-xmark"></i></button>
                        } @else {
                          <button class="btn-accion-circular btn-editar" (click)="habilitarEdicion(partido.id)" title="Editar resultado"><i class="fas fa-pen"></i></button>
                        }
                      } @else {
                        <button class="btn-accion-circular btn-guardar" [disabled]="!getSeleccion(partido.id) || guardando() === partido.id" (click)="guardar(partido.id)" title="Guardar resultado">
                          @if (guardando() === partido.id) { <i class="fas fa-spinner fa-spin"></i> } @else { <i class="fas fa-floppy-disk"></i> }
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
  // FIX #18: styles[] contiene SOLO los estilos propios del componente.
  // Los estilos .toast-* que estaban aquí se eliminaron porque son letra muerta
  // (los toasts se renderizan en ToastContainerComponent, no aquí).
  styleUrl: './cargar-resultados.component.css'
})
export class CargarResultadosComponent implements OnInit {

  cargando          = signal(true);
  guardando         = signal<number | null>(null);
  editando          = signal<number | null>(null);
  reseteando        = signal(false);
  grupoActivo       = signal<string | null>(null);
  modalResetAbierto = signal(false);
  grupoParaReset    = signal<string | null>(null);
  modalResetAllAbierto  = signal(false);
  resetAllTextoConf     = signal('');

  partidos = signal<Partido[]>([]);

  // FIX #17 aplicado también acá: Record reactivo en lugar de Map + _selVersion
  private seleccionesSignal         = signal<Record<number, string>>({});
  private seleccionesOriginalesMap  = new Map<number, string>();
  resultadosGuardados               = signal<Set<number>>(new Set());

  grupos = GRUPOS;

  private toastService = inject(ToastService);

  constructor(
    private partidoService: PartidoService,
    private resultadoService: ResultadoService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    forkJoin({
      partidos:   this.partidoService.getPartidos(),
      resultados: this.resultadoService.getResultados()
    }).subscribe({
      next: ({ partidos, resultados }) => {
        this.partidos.set(partidos.filter(p => p.fase === 'GRUPOS'));

        const guardados = new Set<number>();
        const selecciones: Record<number, string> = {};

        resultados.forEach(r => {
          const id = r.partido.id;
          selecciones[id] = r.resultado;
          this.seleccionesOriginalesMap.set(id, r.resultado);
          guardados.add(id);
        });

        this.seleccionesSignal.set(selecciones);
        this.resultadosGuardados.set(guardados);
        this.cargando.set(false);
      },
      error: () => {
        this.toastService.error('No se pudieron cargar los datos del servidor.');
        this.cargando.set(false);
      }
    });
  }

  gruposMostrados(): string[] {
    const activo = this.grupoActivo();
    return activo ? [activo] : this.grupos;
  }

  getPartidosPorGrupo(grupo: string): Partido[] {
    return this.partidos().filter(p => p.grupo === grupo);
  }

  seleccionarResultado(partidoId: number, valor: string): void {
    this.seleccionesSignal.update(s => ({ ...s, [partidoId]: valor }));
  }

  getSeleccion(partidoId: number): string {
    return this.seleccionesSignal()[partidoId] ?? '';
  }

  contarGuardadosEnGrupo(grupo: string): number {
    return this.getPartidosPorGrupo(grupo).filter(p => this.resultadosGuardados().has(p.id)).length;
  }

  grupoCompleto(grupo: string): boolean {
    const ps = this.getPartidosPorGrupo(grupo);
    return ps.length > 0 && ps.every(p => this.resultadosGuardados().has(p.id));
  }

  habilitarEdicion(partidoId: number): void { this.editando.set(partidoId); }

  cancelarEdicion(partidoId: number): void {
    const original = this.seleccionesOriginalesMap.get(partidoId);
    if (original) {
      this.seleccionesSignal.update(s => ({ ...s, [partidoId]: original }));
    }
    this.editando.set(null);
  }

  guardar(partidoId: number): void {
    const resultado = this.seleccionesSignal()[partidoId];
    if (!resultado) return;

    this.guardando.set(partidoId);
    this.resultadoService.guardar(partidoId, resultado).subscribe({
      next: () => {
        this.guardando.set(null);
        this.editando.set(null);
        const guardados = new Set(this.resultadosGuardados());
        guardados.add(partidoId);
        this.resultadosGuardados.set(guardados);
        this.seleccionesOriginalesMap.set(partidoId, resultado);
        this.toastService.success('Resultado guardado exitosamente.');
      },
      error: () => {
        this.guardando.set(null);
        this.toastService.error('Error al guardar el resultado. Intentá de nuevo.');
      }
    });
  }

  abrirConfirmacionReset(grupo: string): void { this.grupoParaReset.set(grupo); this.modalResetAbierto.set(true); }
  cerrarModalReset(): void { this.modalResetAbierto.set(false); this.grupoParaReset.set(null); }
  abrirConfirmacionResetAll(): void { this.resetAllTextoConf.set(''); this.modalResetAllAbierto.set(true); }
  cerrarModalResetAll(): void { this.modalResetAllAbierto.set(false); this.resetAllTextoConf.set(''); }

  confirmarReset(): void {
    const grupo = this.grupoParaReset();
    if (!grupo) return;
    this.reseteando.set(true);
    const ids = this.getPartidosPorGrupo(grupo).filter(p => this.resultadosGuardados().has(p.id)).map(p => p.id);

    this.resultadoService.resetearGrupo(grupo).subscribe({
      next: res => {
        const guardados = new Set(this.resultadosGuardados());
        ids.forEach(id => { guardados.delete(id); this.seleccionesOriginalesMap.delete(id); });
        this.resultadosGuardados.set(guardados);
        this.seleccionesSignal.update(s => {
          const copia = { ...s };
          ids.forEach(id => delete copia[id]);
          return copia;
        });
        this.reseteando.set(false);
        this.cerrarModalReset();
        this.toastService.success(res.mensaje);
      },
      error: () => { this.reseteando.set(false); this.cerrarModalReset(); this.toastService.error('Error al resetear el grupo.'); }
    });
  }

  confirmarResetAll(): void {
    if (this.resetAllTextoConf() !== 'ELIMINAR TODO') return;
    this.reseteando.set(true);
    this.resultadoService.resetearTodos().subscribe({
      next: res => {
        this.resultadosGuardados.set(new Set());
        this.seleccionesSignal.set({});
        this.seleccionesOriginalesMap.clear();
        this.reseteando.set(false);
        this.cerrarModalResetAll();
        this.toastService.success(res.mensaje);
      },
      error: () => { this.reseteando.set(false); this.cerrarModalResetAll(); this.toastService.error('Error al resetear todo.'); }
    });
  }
}