// confirmar-planillas.component.ts
// FIX #13: Actualizado para consumir la respuesta paginada del AdminController.
// El endpoint ahora devuelve { content, totalElements, totalPages, currentPage, pageSize }
// en lugar de un array plano. Se agrega paginación en la UI para manejar
// grandes volúmenes sin cargar todo en memoria.
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { PlanillaResponse } from '../../../shared/models/planilla.model';
import { PlanillaService } from '../../../core/services/planilla.service';

interface PlanillaConCheck extends PlanillaResponse {
  seleccionada: boolean;
}

interface PaginatedResponse {
  content: PlanillaResponse[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

@Component({
  selector: 'app-confirmar-planillas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="main">
      <h2><i class="fas fa-circle-check"></i> Confirmar Planillas</h2>

      @if (cargando()) {
        <div class="spinner-container"><div class="spinner"></div></div>
      }

      @if (mensajeExito()) {
        <p class="msg-success">
          <i class="fas fa-circle-check"></i> {{ mensajeExito() }}
        </p>
      }

      @if (!cargando() && planillas().length === 0) {
        <div class="estado-vacio">
          <i class="fas fa-inbox icono-vacio"></i>
          <p class="titulo-vacio">Todo al día</p>
          <p class="desc-vacio">No hay planillas pendientes de confirmación.</p>
        </div>
      }

      @if (!cargando() && planillas().length > 0) {

        <!-- Barra de control -->
        <div class="controles-bar">
          <div class="controles-izq">
            <label class="check-all-wrap">
              <input type="checkbox" class="check-input"
                [checked]="todasSeleccionadas()"
                (change)="toggleTodas($event)" />
              <span class="check-label-txt">Seleccionar todas</span>
            </label>
            <span class="contador-chip" [class.activo]="cantidadSeleccionadas() > 0">
              {{ cantidadSeleccionadas() }} seleccionada{{ cantidadSeleccionadas() !== 1 ? 's' : '' }}
            </span>
          </div>
          <div class="controles-der">
            <!-- FIX #13: Mostrar total real (no solo la página actual) -->
            <span class="total-pendientes">
              <i class="fas fa-hourglass-half" style="font-size:0.75rem;color:var(--clr-primary-light)"></i>
              {{ totalPendientes() }} pendiente{{ totalPendientes() !== 1 ? 's' : '' }} en total
            </span>
            <button class="btn btn-primary"
              [disabled]="cantidadSeleccionadas() === 0 || confirmando()"
              (click)="confirmar()">
              @if (confirmando()) {
                <i class="fas fa-spinner fa-spin"></i> Confirmando...
              } @else {
                <i class="fas fa-circle-check"></i> Confirmar seleccionadas
              }
            </button>
          </div>
        </div>

        <!-- Grid de planillas -->
        <div class="planillas-grid">
          @for (p of planillas(); track p.codigo) {
            <div class="planilla-card" [class.seleccionada]="p.seleccionada" (click)="toggleSeleccion(p)">
              <div class="card-check-wrap" (click)="$event.stopPropagation()">
                <input type="checkbox" class="check-input" [(ngModel)]="p.seleccionada" (ngModelChange)="actualizarContador()" />
              </div>
              <div class="card-icono"><i class="fas fa-file-lines"></i></div>
              <div class="card-info">
                <span class="card-nombre">{{ p.nombre }} {{ p.apellido }}</span>
              </div>
              <div class="card-codigo">
                <span class="codigo-label">Planilla</span>
                <span class="codigo-num">{{ p.codigo }}</span>
              </div>
            </div>
          }
        </div>

        <!-- FIX #13: Paginación -->
        @if (totalPaginas() > 1) {
          <div class="paginacion">
            <button class="btn-pag" (click)="irAPagina(paginaActual() - 1)" [disabled]="paginaActual() === 0">
              <i class="fas fa-chevron-left"></i>
            </button>
            <span class="pag-info">
              Pág. {{ paginaActual() + 1 }} de {{ totalPaginas() }}
            </span>
            <button class="btn-pag" (click)="irAPagina(paginaActual() + 1)" [disabled]="paginaActual() >= totalPaginas() - 1">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        }

        @if (cantidadSeleccionadas() > 0) {
          <div class="acciones-footer">
            <span class="footer-info">
              <i class="fas fa-circle-check" style="color:var(--clr-primary-light)"></i>
              {{ cantidadSeleccionadas() }} planilla{{ cantidadSeleccionadas() !== 1 ? 's' : '' }} lista{{ cantidadSeleccionadas() !== 1 ? 's' : '' }} para confirmar
            </span>
            <button class="btn btn-primary" [disabled]="confirmando()" (click)="confirmar()">
              @if (confirmando()) {
                <i class="fas fa-spinner fa-spin"></i> Confirmando...
              } @else {
                <i class="fas fa-circle-check"></i> Confirmar {{ cantidadSeleccionadas() }}
              }
            </button>
          </div>
        }
      }
    </main>
  `,
  styles: [`
    .estado-vacio { text-align: center; padding: 4em 2em; }
    .icono-vacio { font-size: 3rem; color: var(--clr-border-strong); margin-bottom: 0.5em; display: block; }
    .titulo-vacio { font-family: var(--font-display); font-size: 1.3rem; color: var(--clr-text-muted); margin-bottom: 0.4em; }
    .desc-vacio { font-size: 0.875rem; color: var(--clr-text-muted); max-width: 340px; margin: 0 auto; line-height: 1.6; }

    .controles-bar { display: flex; align-items: center; justify-content: space-between; gap: 1em; padding: 0.85em 1.1em; background: var(--clr-surface-alt); border: 1px solid var(--clr-border-strong); border-radius: var(--radius-md); margin-bottom: 1.25em; }
    .controles-izq { display: flex; align-items: center; gap: 0.85em; }
    .controles-der { display: flex; align-items: center; gap: 1em; }
    .check-all-wrap { display: flex; align-items: center; gap: 0.5em; cursor: pointer; }
    .check-input { width: 16px; height: 16px; cursor: pointer; accent-color: var(--clr-primary); }
    .check-label-txt { font-size: 0.85rem; font-weight: 500; color: var(--clr-text); }
    .contador-chip { font-size: 0.75rem; font-weight: 600; padding: 0.25em 0.7em; border-radius: 20px; background: var(--clr-border); color: var(--clr-text-muted); transition: var(--transition); }
    .contador-chip.activo { background: var(--clr-primary); color: white; }
    .total-pendientes { font-size: 0.82rem; color: var(--clr-text-muted); display: flex; align-items: center; gap: 0.4em; white-space: nowrap; }

    .planillas-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75em; margin-bottom: 1.5em; }

    .planilla-card { display: grid; grid-template-columns: 20px 36px 1fr auto; align-items: center; gap: 0.6em; background: var(--clr-surface); border: 1.5px solid var(--clr-border); border-radius: var(--radius-md); padding: 0.85em 0.9em; cursor: pointer; transition: var(--transition); box-shadow: var(--shadow-sm); }
    .planilla-card:hover { border-color: var(--clr-primary-light); box-shadow: var(--shadow-md); }
    .planilla-card.seleccionada { border-color: var(--clr-primary); background: #edf8fb; box-shadow: 0 0 0 2px rgba(56,120,135,0.18), var(--shadow-sm); }

    .card-icono { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: var(--radius-sm); background: var(--clr-surface-alt); border: 1px solid var(--clr-border); color: var(--clr-primary-light); font-size: 1rem; flex-shrink: 0; transition: var(--transition); }
    .planilla-card.seleccionada .card-icono { background: var(--clr-primary); border-color: var(--clr-primary); color: white; }

    .card-info { display: flex; flex-direction: column; gap: 0.1em; overflow: hidden; }
    .card-nombre { font-size: 0.82rem; font-weight: 600; color: var(--clr-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .card-codigo { display: flex; flex-direction: column; align-items: flex-end; gap: 0.05em; flex-shrink: 0; }
    .codigo-label { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--clr-text-muted); font-weight: 500; }
    .codigo-num { font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--clr-primary); }
    .planilla-card.seleccionada .codigo-num { color: var(--clr-primary-dark); }

    /* Paginación */
    .paginacion { display: flex; align-items: center; justify-content: center; gap: 1em; margin: 1em 0 1.5em; }
    .btn-pag { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border: 1.5px solid var(--clr-border-strong); border-radius: 50%; background: var(--clr-surface); color: var(--clr-text); font-size: 0.8rem; cursor: pointer; transition: var(--transition); font-family: var(--font-body); }
    .btn-pag:hover:not(:disabled) { border-color: var(--clr-primary); color: var(--clr-primary); }
    .btn-pag:disabled { opacity: 0.35; cursor: not-allowed; }
    .pag-info { font-size: 0.82rem; color: var(--clr-text-muted); }

    .acciones-footer { display: flex; align-items: center; justify-content: space-between; gap: 1em; padding: 1em 1.25em; background: var(--clr-primary-dark); border-radius: var(--radius-md); position: sticky; bottom: 1.5em; box-shadow: var(--shadow-lg); }
    .footer-info { font-size: 0.875rem; font-weight: 500; color: rgba(255,255,255,0.85); display: flex; align-items: center; gap: 0.5em; }

    @media (max-width: 640px) {
      .controles-bar { flex-direction: column; align-items: flex-start; gap: 0.75em; }
      .controles-der { width: 100%; justify-content: space-between; }
      .acciones-footer { flex-direction: column; gap: 0.75em; bottom: 0.75em; }
      .acciones-footer .btn { width: 100%; }
    }
  `]
})
export class ConfirmarPlanillasComponent implements OnInit {

  cargando      = signal(true);
  confirmando   = signal(false);
  mensajeExito  = signal<string | null>(null);
  planillas     = signal<PlanillaConCheck[]>([]);

  // FIX #13: estado de paginación
  paginaActual  = signal(0);
  totalPaginas  = signal(1);
  totalPendientes = signal(0);

  private _cantidadSeleccionadas = signal(0);
  cantidadSeleccionadas = this._cantidadSeleccionadas.asReadonly();

  private adminUrl = `${environment.apiUrl}/admin/planillas`;

  constructor(
    private http: HttpClient,
    private planillaService: PlanillaService
  ) {}

  ngOnInit(): void {
    this.cargarPendientes(0);
  }

  // FIX #13: carga una página específica del endpoint paginado
  cargarPendientes(page: number): void {
    this.cargando.set(true);
    this.http.get<PaginatedResponse>(`${this.adminUrl}?page=${page}&size=100`)
      .subscribe({
        next: data => {
          const pendientes = data.content
            .filter(p => !p.confirmada)
            .map(p => ({ ...p, seleccionada: false }));

          this.planillas.set(pendientes);
          this.paginaActual.set(data.currentPage);
          this.totalPaginas.set(data.totalPages);
          // Contar solo las pendientes en el total
          this.totalPendientes.set(
            data.content.filter(p => !p.confirmada).length +
            (data.totalPages > 1 ? (data.totalElements - data.content.length) : 0)
          );
          this._cantidadSeleccionadas.set(0);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false)
      });
  }

  irAPagina(page: number): void {
    if (page < 0 || page >= this.totalPaginas()) return;
    this.cargarPendientes(page);
  }

  toggleSeleccion(p: PlanillaConCheck): void {
    p.seleccionada = !p.seleccionada;
    this.actualizarContador();
  }

  actualizarContador(): void {
    this._cantidadSeleccionadas.set(this.planillas().filter(p => p.seleccionada).length);
  }

  todasSeleccionadas(): boolean {
    return this.planillas().length > 0 && this.planillas().every(p => p.seleccionada);
  }

  toggleTodas(evento: Event): void {
    const checked = (evento.target as HTMLInputElement).checked;
    this.planillas.update(list => list.map(p => ({ ...p, seleccionada: checked })));
    this.actualizarContador();
  }

  confirmar(): void {
    const seleccionadas = this.planillas().filter(p => p.seleccionada);
    if (seleccionadas.length === 0) return;

    this.confirmando.set(true);

    const confirmarSiguiente = (index: number) => {
      if (index >= seleccionadas.length) {
        this.mensajeExito.set(`${seleccionadas.length} planilla(s) confirmada(s) exitosamente.`);
        this.confirmando.set(false);
        this.cargarPendientes(this.paginaActual());
        setTimeout(() => this.mensajeExito.set(null), 5000);
        return;
      }
      this.planillaService.confirmar(seleccionadas[index].codigo).subscribe({
        next:  () => confirmarSiguiente(index + 1),
        error: () => confirmarSiguiente(index + 1)
      });
    };

    confirmarSiguiente(0);
  }
}