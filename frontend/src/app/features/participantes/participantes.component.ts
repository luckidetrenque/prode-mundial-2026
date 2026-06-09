// src/app/features/participantes/participantes.component.ts
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlanillaService } from '../../core/services/planilla.service';
import { PlanillaResponse } from '../../shared/models/planilla.model';
import { TorneoService } from '../../core/services/torneo.service';
import { SplashBienvenidaComponent } from '../../shared/components/splash-bienvenida/splash-bienvenida.component';

@Component({
  selector: 'app-participantes',
  standalone: true,
  imports: [CommonModule, RouterLink, SplashBienvenidaComponent],
  template: `
    <main class="main">
      @if (torneoService.tiempoExpirado()) {
        <app-splash-bienvenida />
      }
      <h2><i class="fas fa-user-group"></i> Participantes Confirmados</h2>
      <p class="subtitulo">
        <i class="fas fa-circle-info" style="color:var(--clr-primary-light);font-size:0.8rem"></i>
        Listado de todos los participantes que han confirmado su planilla.
      </p>

      @if (cargando()) {
        <div class="spinner-container"><div class="spinner"></div></div>
      }

      @if (!cargando() && planillas().length === 0) {
        <div class="estado-vacio">
          <i class="fas fa-user-group icono-vacio"></i>
          <p class="titulo-vacio">Sin participantes aún</p>
          <p class="desc-vacio">No hay planillas confirmadas todavía.</p>
        </div>
      }

      @if (!cargando() && planillas().length > 0) {
        <div class="table-container">
          <table class="tabla-participantes">
          <caption>
            Total confirmados al {{ fechaCaption() | date:'dd/MM/yyyy' }}: {{ planillas().length }}
          </caption>
          <thead>
            <tr>
              <th class="col-nombre">
                <div class="header-nombre-content">
                  <span class="header-label">Nombre y Apellido</span>
                  <div class="buscador-inline">
                    <i class="fas fa-magnifying-glass"></i>
                    <input
                      type="text"
                      id="buscarParticipante"
                      name="buscarParticipante"
                      class="buscador-input"
                      placeholder="Buscar..."
                      (input)="filtrar($event)"
                    />
                  </div>
                  <span class="total-chip">
                    ({{ planillasFiltradas().length }} participantes)
                  </span>
                </div>
              </th>
              <th style="width: 150px;">Planilla N°</th>
            </tr>
          </thead>
          <tbody>
            @for (p of planillasPaginadas(); track p.codigo) {
              <tr>
                <td data-label="Nombre">{{ p.nombre }} {{ p.apellido }}</td>
                <td data-label="Planilla">
                  <a [routerLink]="['/planillas', p.codigo]" class="link-planilla" title="Ver planilla">
                    {{ p.codigo }}
                    <i class="fas fa-arrow-up-right-from-square" style="font-size:0.6rem;opacity:0.6"></i>
                  </a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

        <!-- Paginación -->
        @if (totalPaginas() > 1) {
          <div class="paginacion">
            <button 
              class="btn-pag" 
              [disabled]="paginaActual() === 1"
              (click)="cambiarPagina(paginaActual() - 1)"
              title="Anterior"
            >
              <i class="fas fa-chevron-left"></i>
            </button>

            <div class="pag-numeros">
              @for (p of paginas(); track p) {
                <button 
                  class="btn-num" 
                  [class.activo]="p === paginaActual()"
                  (click)="cambiarPagina(p)"
                >
                  {{ p }}
                </button>
              }
            </div>

            <button 
              class="btn-pag" 
              [disabled]="paginaActual() === totalPaginas()"
              (click)="cambiarPagina(paginaActual() + 1)"
              title="Siguiente"
            >
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        }
      }
    </main>
  `,
  styles: [`
    .tabla-participantes { width: 100%; border-collapse: collapse; }
    .tabla-participantes th { 
      background: var(--clr-surface-alt); 
      color: var(--clr-text-muted); 
      font-size: 0.68rem; 
      text-transform: uppercase; 
      letter-spacing: 0.8px;
      padding: 0.85rem 1rem;
      border-bottom: 1.5px solid var(--clr-border-strong);
      text-align: left;
    }
    .tabla-participantes th.col-nombre { text-align: left; }
    
    .header-nombre-content {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .header-label { flex-shrink: 0; }

    .buscador-inline {
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid var(--clr-border-strong);
      border-radius: 4px;
      padding: 0 var(--spacing-sm);
      gap: var(--spacing-xs);
      flex: 1;
      max-width: 160px;
      height: 24px;
    }

    .buscador-inline i { font-size: 0.65rem; color: var(--clr-text-muted); }

    .buscador-input {
      background: transparent;
      border: none;
      width: 100%;
      font-family: var(--font-body);
      font-size: 0.75rem;
      color: var(--clr-text);
      padding: 0;
      height: 100%;
      outline: none;
    }

    .total-chip {
      font-size: 0.62rem;
      color: var(--clr-text-muted);
      white-space: nowrap;
      text-transform: none;
      letter-spacing: normal;
      font-weight: 500;
    }

    .tabla-participantes td { padding: 0.85rem 1rem; border-bottom: 1px solid var(--clr-border); font-size: 0.9rem; }
    .tabla-participantes td:first-child { text-align: left; font-weight: 500; }
    .tabla-participantes td:last-child { text-align: right; }

        /* ── Paginación ──────────────────────────────────────────────────────── */
    .paginacion {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1em;
      margin-top: 1.25em;
    }

    .btn-pag {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border: 1.5px solid var(--clr-border-strong);
      border-radius: 50%;
      background: var(--clr-surface);
      color: var(--clr-text);
      font-size: 0.8rem;
      cursor: pointer;
      transition: var(--transition);
      font-family: var(--font-body);
    }

    .btn-pag:hover:not(:disabled) { border-color: var(--clr-primary); color: var(--clr-primary); }
    .btn-pag:disabled { opacity: 0.35; cursor: not-allowed; }

    .pag-numeros {
      display: flex;
      gap: var(--spacing-xs);
    }

    .btn-num {
      width: 34px;
      height: 34px;
      border: 1.5px solid var(--clr-border-strong);
      border-radius: 8px;
      background: var(--clr-surface);
      color: var(--clr-text-muted);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-body);
    }

    .btn-num:hover:not(.activo) {
      border-color: var(--clr-primary);
      color: var(--clr-primary);
      background: rgba(46, 158, 45, 0.05);
    }

    .btn-num.activo {
      background: var(--clr-primary);
      border-color: var(--clr-primary);
      color: white;
      box-shadow: 0 4px 10px rgba(46, 158, 45, 0.2);
    }

    @media (max-width: 600px) {
      .tabla-participantes thead { display: none; }
      .tabla-participantes tr { display: flex; flex-direction: column; padding: 1rem; gap: 0.5rem; border-bottom: 1px solid var(--clr-border); }
      .tabla-participantes td { display: flex; justify-content: space-between; padding: 0; border: none; }
      .tabla-participantes td:last-child { text-align: left; }
      
      /* Labels para modo stack */
      .tabla-participantes td::before {
        content: attr(data-label);
        font-weight: 700;
        color: var(--clr-text-muted);
        font-size: 0.75rem;
        text-transform: uppercase;
      }

      .header-nombre-content {
        flex-direction: column;
        align-items: stretch;
        gap: var(--spacing-sm);
      }

      .buscador-inline {
        max-width: 100%;
        order: 2;
      }

      .total-chip {
        order: 3;
      }
    }

    .link-planilla {
      display: inline-flex;
      align-items: center;
      gap: 0.35em;
      font-size: 0.85rem;
      color: var(--clr-primary);
      font-weight: 600;
      text-decoration: none;
      transition: var(--transition);
    }

    .link-planilla:hover { color: var(--clr-primary-dark); transform: translateX(2px); }

    /* Paginación y otros estilos movidos a global o simplificados */
  `]
})
export class ParticipantesComponent implements OnInit {

  torneoService = inject(TorneoService);

  // Fecha de cierre de inscripciones: 10/06/2026 a las 14:00 hora Argentina (UTC-3)
  private readonly FECHA_CIERRE = new Date('2026-06-10T17:00:00Z'); // 14:00 ARG = 17:00 UTC

  cargando = signal(true);
  planillas = signal<PlanillaResponse[]>([]);
  planillasFiltradas = signal<PlanillaResponse[]>([]);

  // Muestra la fecha de cierre si ya pasó el límite, o la fecha de hoy si aún estamos en inscripción
  fechaCaption = computed(() => {
    const ahora = new Date();
    return ahora >= this.FECHA_CIERRE ? this.FECHA_CIERRE : ahora;
  });

  // Paginación
  paginaActual = signal(1);
  itemsPorPagina = 10;

  planillasPaginadas = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.planillasFiltradas().slice(inicio, fin);
  });

  totalPaginas = computed(() => 
    Math.ceil(this.planillasFiltradas().length / this.itemsPorPagina)
  );

  paginas = computed(() => {
    const total = this.totalPaginas();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  constructor(private planillaService: PlanillaService) {}

  ngOnInit(): void {
    this.planillaService.listar().subscribe({
      next: data => {
        this.planillas.set(data);
        this.planillasFiltradas.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  filtrar(evento: Event): void {
    const termino = (evento.target as HTMLInputElement).value.toLowerCase();
    this.planillasFiltradas.set(
      this.planillas().filter(p =>
        p.nombre.toLowerCase().includes(termino)   ||
        p.apellido.toLowerCase().includes(termino)
      )
    );
    this.paginaActual.set(1); // Reset a la primera página al filtrar
  }

  cambiarPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas()) {
      this.paginaActual.set(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
