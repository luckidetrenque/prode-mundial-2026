// src/app/features/admin/confirmar-planillas/confirmar-planillas.component.ts
// CORREGIDO: usa GET /api/admin/planillas para ver TODAS (no solo confirmadas)
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
        <p class="msg-success">✅ {{ mensajeExito() }}</p>
      }

      @if (!cargando() && planillas().length === 0) {
        <p class="msg-warning">No hay planillas pendientes de confirmación.</p>
      }

      @if (!cargando() && planillas().length > 0) {
        <p>Hay <strong>{{ planillas().length }}</strong> planillas sin confirmar.</p>

        <div class="controles">
          <label class="check-all">
            <input
              type="checkbox"
              [checked]="todasSeleccionadas()"
              (change)="toggleTodas($event)"
            />
            Seleccionar todas
          </label>
          <span class="seleccionadas-count">{{ cantidadSeleccionadas() }} seleccionadas</span>
        </div>

        <div class="planillas-grid">
          @for (p of planillas(); track p.codigo) {
            <div
              class="planilla-card"
              [class.seleccionada]="p.seleccionada"
              (click)="toggleSeleccion(p)"
            >
              <label class="check-label" (click)="$event.stopPropagation()">
                <input
                  type="checkbox"
                  [(ngModel)]="p.seleccionada"
                  (ngModelChange)="actualizarContador()"
                />
                Válida
              </label>
              <h3>Afiliado N° {{ p.afiliado }}</h3>
              <p>{{ p.nombre }} {{ p.apellido }}</p>
              <p class="planilla-codigo">Planilla N° {{ p.codigo }}</p>
            </div>
          }
        </div>

        <div class="acciones-confirm">
          <button
            class="btn btn-primary"
            [disabled]="cantidadSeleccionadas() === 0 || confirmando()"
            (click)="confirmar()"
          >
            {{ confirmando() ? 'Confirmando...' : 'Confirmar seleccionadas' }}
          </button>
        </div>
      }
    </main>
  `,
  styles: [`
    .controles { display: flex; align-items: center; gap: 1.5em; margin: 1em 0; }
    .check-all { display: flex; align-items: center; gap: 0.4em; cursor: pointer; }
    .seleccionadas-count { font-size: 0.85rem; color: var(--clr-primary); font-weight: bold; }
    .planillas-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75em; margin: 1em 0; }
    .planilla-card { background: #e8f4fb; border: 1px solid #b7d0ef; border-radius: 6px; padding: 0.75em; cursor: pointer; transition: all 0.15s; }
    .planilla-card:hover { border-color: var(--clr-primary); }
    .planilla-card.seleccionada { background: #c8e6f5; border-color: var(--clr-primary); box-shadow: 0 0 0 2px var(--clr-primary-light); }
    .planilla-card h3 { font-size: 0.85rem; margin-bottom: 0.3em; }
    .planilla-card p  { font-size: 0.75rem; margin: 0.1em 0; }
    .planilla-codigo { color: var(--clr-primary); font-weight: bold !important; }
    .check-label { display: flex; align-items: center; gap: 0.3em; font-size: 0.75rem; margin-bottom: 0.5em; }
    .acciones-confirm { margin-top: 1.5em; }
    @media (max-width: 576px) { .planillas-grid { grid-template-columns: repeat(2, 1fr); } }
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
    // Usa GET /api/admin/planillas (devuelve TODAS — confirmadas y no)
    // y filtra las no confirmadas en el frontend
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
