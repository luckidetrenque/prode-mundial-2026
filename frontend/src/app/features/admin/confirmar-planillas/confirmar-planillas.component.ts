// confirmar-planillas.component.ts — VERSIÓN MEJORADA
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanillaService } from '../../../core/services/planilla.service';
import { PlanillaResponse } from '../../../shared/models/planilla.model';

interface PlanillaConCheck extends PlanillaResponse {
  seleccionada: boolean;
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
          <p class="desc-vacio">No hay planillas pendientes de confirmación en este momento.</p>
        </div>
      }

      @if (!cargando() && planillas().length > 0) {

        <!-- Barra de control -->
        <div class="controles-bar">
          <div class="controles-izq">
            <label class="check-all-wrap">
              <input
                type="checkbox"
                class="check-input"
                [checked]="todasSeleccionadas()"
                (change)="toggleTodas($event)"
              />
              <span class="check-label-txt">Seleccionar todas</span>
            </label>
            <span class="contador-chip" [class.activo]="cantidadSeleccionadas() > 0">
              {{ cantidadSeleccionadas() }} seleccionada{{ cantidadSeleccionadas() !== 1 ? 's' : '' }}
            </span>
          </div>

          <div class="controles-der">
            <span class="total-pendientes">
              <i class="fas fa-hourglass-half" style="font-size:0.75rem;color:var(--clr-primary-light)"></i>
              {{ planillas().length }} pendiente{{ planillas().length !== 1 ? 's' : '' }}
            </span>
            <button
              class="btn btn-primary"
              [disabled]="cantidadSeleccionadas() === 0 || confirmando()"
              (click)="confirmar()"
            >
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
            <div
              class="planilla-card"
              [class.seleccionada]="p.seleccionada"
              (click)="toggleSeleccion(p)"
            >
              <!-- Checkbox -->
              <div class="card-check-wrap" (click)="$event.stopPropagation()">
                <input
                  type="checkbox"
                  class="check-input"
                  [(ngModel)]="p.seleccionada"
                  (ngModelChange)="actualizarContador()"
                />
              </div>

              <!-- Ícono de estado -->
              <div class="card-icono">
                <i class="fas fa-file-lines"></i>
              </div>

              <!-- Info -->
              <div class="card-info">
                <span class="card-nombre">{{ p.nombre }} {{ p.apellido }}</span>
                <span class="card-afiliado">Afiliado N° {{ p.afiliado }}</span>
              </div>

              <!-- Código -->
              <div class="card-codigo">
                <span class="codigo-label">Planilla</span>
                <span class="codigo-num">{{ p.codigo }}</span>
              </div>
            </div>
          }
        </div>

        <!-- Acción flotante si hay seleccionadas -->
        @if (cantidadSeleccionadas() > 0) {
          <div class="acciones-footer">
            <span class="footer-info">
              <i class="fas fa-circle-check" style="color:var(--clr-primary-light)"></i>
              {{ cantidadSeleccionadas() }} planilla{{ cantidadSeleccionadas() !== 1 ? 's' : '' }} lista{{ cantidadSeleccionadas() !== 1 ? 's' : '' }} para confirmar
            </span>
            <button
              class="btn btn-primary"
              [disabled]="confirmando()"
              (click)="confirmar()"
            >
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
    /* ── Estado vacío ────────────────────────────────────────────────────── */
    .estado-vacio {
      text-align: center;
      padding: 4em 2em;
    }

    .icono-vacio {
      font-size: 3rem;
      color: var(--clr-border-strong);
      margin-bottom: 0.5em;
      display: block;
    }

    .titulo-vacio {
      font-family: var(--font-display);
      font-size: 1.3rem;
      color: var(--clr-text-muted);
      margin-bottom: 0.4em;
    }

    .desc-vacio {
      font-size: 0.875rem;
      color: var(--clr-text-muted);
      max-width: 340px;
      margin: 0 auto;
      line-height: 1.6;
    }

    /* ── Barra de control ────────────────────────────────────────────────── */
    .controles-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1em;
      padding: 0.85em 1.1em;
      background: var(--clr-surface-alt);
      border: 1px solid var(--clr-border-strong);
      border-radius: var(--radius-md);
      margin-bottom: 1.25em;
    }

    .controles-izq {
      display: flex;
      align-items: center;
      gap: 0.85em;
    }

    .controles-der {
      display: flex;
      align-items: center;
      gap: 1em;
    }

    .check-all-wrap {
      display: flex;
      align-items: center;
      gap: 0.5em;
      cursor: pointer;
    }

    .check-input {
      width: 16px;
      height: 16px;
      cursor: pointer;
      accent-color: var(--clr-primary);
    }

    .check-label-txt {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--clr-text);
    }

    .contador-chip {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25em 0.7em;
      border-radius: 20px;
      background: var(--clr-border);
      color: var(--clr-text-muted);
      transition: var(--transition);
    }

    .contador-chip.activo {
      background: var(--clr-primary);
      color: white;
    }

    .total-pendientes {
      font-size: 0.82rem;
      color: var(--clr-text-muted);
      display: flex;
      align-items: center;
      gap: 0.4em;
      white-space: nowrap;
    }

    /* ── Grid de planillas ───────────────────────────────────────────────── */
    .planillas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 0.75em;
      margin-bottom: 1.5em;
    }

    /* ── Card de planilla ────────────────────────────────────────────────── */
    .planilla-card {
      display: grid;
      grid-template-columns: 20px 36px 1fr auto;
      align-items: center;
      gap: 0.6em;
      background: var(--clr-surface);
      border: 1.5px solid var(--clr-border);
      border-radius: var(--radius-md);
      padding: 0.85em 0.9em;
      cursor: pointer;
      transition: var(--transition);
      box-shadow: var(--shadow-sm);
    }

    .planilla-card:hover {
      border-color: var(--clr-primary-light);
      box-shadow: var(--shadow-md);
    }

    .planilla-card.seleccionada {
      border-color: var(--clr-primary);
      background: #edf8fb;
      box-shadow: 0 0 0 2px rgba(56,120,135,0.18), var(--shadow-sm);
    }

    /* Ícono de documento */
    .card-icono {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      background: var(--clr-surface-alt);
      border: 1px solid var(--clr-border);
      color: var(--clr-primary-light);
      font-size: 1rem;
      flex-shrink: 0;
      transition: var(--transition);
    }

    .planilla-card.seleccionada .card-icono {
      background: var(--clr-primary);
      border-color: var(--clr-primary);
      color: white;
    }

    /* Info del participante */
    .card-info {
      display: flex;
      flex-direction: column;
      gap: 0.1em;
      overflow: hidden;
    }

    .card-nombre {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--clr-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-afiliado {
      font-size: 0.7rem;
      color: var(--clr-text-muted);
    }

    /* Código de planilla */
    .card-codigo {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.05em;
      flex-shrink: 0;
    }

    .codigo-label {
      font-size: 0.6rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--clr-text-muted);
      font-weight: 500;
    }

    .codigo-num {
      font-family: var(--font-display);
      font-size: 1rem;
      font-weight: 700;
      color: var(--clr-primary);
    }

    .planilla-card.seleccionada .codigo-num {
      color: var(--clr-primary-dark);
    }

    /* ── Footer con acción ───────────────────────────────────────────────── */
    .acciones-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1em;
      padding: 1em 1.25em;
      background: var(--clr-primary-dark);
      border-radius: var(--radius-md);
      position: sticky;
      bottom: 1.5em;
      box-shadow: var(--shadow-lg);
    }

    .footer-info {
      font-size: 0.875rem;
      font-weight: 500;
      color: rgba(255,255,255,0.85);
      display: flex;
      align-items: center;
      gap: 0.5em;
    }

    /* ── Responsive ──────────────────────────────────────────────────────── */
    @media (max-width: 640px) {
      .planillas-grid { grid-template-columns: 1fr; }
      .controles-bar { flex-direction: column; align-items: flex-start; gap: 0.75em; }
      .controles-der { width: 100%; justify-content: space-between; }
      .acciones-footer { flex-direction: column; gap: 0.75em; bottom: 0.75em; }
      .acciones-footer .btn { width: 100%; }
    }
  `]
})
export class ConfirmarPlanillasComponent implements OnInit {

  cargando     = signal(true);
  confirmando  = signal(false);
  mensajeExito = signal<string | null>(null);
  planillas    = signal<PlanillaConCheck[]>([]);

  private _cantidadSeleccionadas = signal(0);
  cantidadSeleccionadas = this._cantidadSeleccionadas.asReadonly();

  constructor(private planillaService: PlanillaService) {}

  ngOnInit(): void {
    this.cargarPendientes();
  }

  cargarPendientes(): void {
    this.planillaService.listarTodas().subscribe({
      next: data => {
        this.planillas.set(
          data
            .filter(p => !p.confirmada)
            .map(p => ({ ...p, seleccionada: false }))
        );
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  toggleSeleccion(p: PlanillaConCheck): void {
    p.seleccionada = !p.seleccionada;
    this.actualizarContador();
  }

  actualizarContador(): void {
    this._cantidadSeleccionadas.set(
      this.planillas().filter(p => p.seleccionada).length
    );
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
        this.cargarPendientes();
        setTimeout(() => this.mensajeExito.set(null), 5000);
        return;
      }
      this.planillaService.confirmar(seleccionadas[index].codigo).subscribe({
        next: () => confirmarSiguiente(index + 1),
        error: () => confirmarSiguiente(index + 1)
      });
    };

    confirmarSiguiente(0);
  }
}
