// src/app/features/participantes/participantes.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlanillaService } from '../../core/services/planilla.service';
import { PlanillaResponse } from '../../shared/models/planilla.model';

@Component({
  selector: 'app-participantes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="main">
      <h2><i class="fas fa-user-group"></i> Participantes Confirmados</h2>
      <p class="subtitulo">
        <i class="fas fa-circle-info" style="color:var(--clr-primary-light);font-size:0.8rem"></i>
        Listado de todos los participantes que han confirmado su planilla.
      </p>

      @if (cargando()) {
        <div class="spinner-container"><div class="spinner"></div></div>
      }

      @if (!cargando() && planillas().length === 0) {
        <p class="msg-warning">No hay planillas confirmadas todavía.</p>
      }

      @if (!cargando() && planillas().length > 0) {
        <table class="tabla-participantes">
          <caption>
            Total confirmados al {{ hoy | date:'dd/MM/yyyy' }}: {{ planillas().length }}
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
            @for (p of planillasFiltradas(); track p.codigo) {
              <tr>
                <td>{{ p.nombre }} {{ p.apellido }}</td>
                <td>
                  <a [routerLink]="['/planillas', p.codigo]" class="link-planilla" title="Ver planilla">
                    {{ p.codigo }}
                    <i class="fas fa-arrow-up-right-from-square" style="font-size:0.6rem;opacity:0.6"></i>
                  </a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </main>
  `,
  styles: [`
    .tabla-participantes { width: 100%; border-collapse: collapse; margin-top: var(--spacing-sm); }
    .tabla-participantes th { 
      background: var(--clr-surface-alt); 
      color: var(--clr-text-muted); 
      font-size: 0.68rem; 
      text-transform: uppercase; 
      letter-spacing: 0.8px;
      padding: var(--spacing-sm) var(--spacing-md);
      border-bottom: 1.5px solid var(--clr-border-strong);
      text-align: center;
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

    .tabla-participantes td { padding: var(--spacing-md); border-bottom: 1px solid var(--clr-border); font-size: 0.9rem; }
    .tabla-participantes td:first-child { text-align: left; font-weight: 500; }
    .tabla-participantes td:last-child { text-align: center; }

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
  `]
})
export class ParticipantesComponent implements OnInit {

  cargando = signal(true);
  planillas = signal<PlanillaResponse[]>([]);
  planillasFiltradas = signal<PlanillaResponse[]>([]);
  hoy = new Date();

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
  }
}
