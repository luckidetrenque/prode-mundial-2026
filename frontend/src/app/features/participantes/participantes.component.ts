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

      @if (cargando()) {
        <div class="spinner-container"><div class="spinner"></div></div>
      }

      @if (!cargando() && planillas().length === 0) {
        <p class="msg-warning">No hay planillas confirmadas todavía.</p>
      }

      @if (!cargando() && planillas().length > 0) {
        <div class="buscador-wrap">
          <input
            type="text"
            class="buscador"
            placeholder="Buscar por nombre, apellido o afiliado..."
            (input)="filtrar($event)"
          />
          <span class="total-badge">{{ planillasFiltradas().length }} participantes</span>
        </div>

        <table class="tabla-participantes">
          <caption>
            Total confirmados al {{ hoy | date:'dd/MM/yyyy' }}: {{ planillas().length }}
          </caption>
          <thead>
            <tr>
              <th>Nombre y Apellido</th>
              <th>Afiliado N°</th>
              <th>Planilla N°</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (p of planillasFiltradas(); track p.codigo) {
              <tr>
                <td>{{ p.nombre }} {{ p.apellido }}</td>
                <td>{{ p.afiliado }}</td>
                <td>{{ p.codigo }}</td>
                <td class="acciones-td">
                  <a [routerLink]="['/planillas', p.codigo]" title="Ver planilla" class="btn-accion">
                    <i class="fas fa-magnifying-glass"></i>
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
    .buscador-wrap { display: flex; align-items: center; gap: 1em; margin-bottom: 1em; }
    .buscador { flex: 1; padding: 0.5em 0.75em; border: 1px solid #ccc; border-radius: 20px; font-size: 0.9rem; }
    .buscador:focus { outline: none; border-color: var(--clr-primary-light); }
    .total-badge { background: var(--clr-primary-light); color: white; padding: 0.3em 0.75em; border-radius: 12px; font-size: 0.8rem; font-weight: bold; white-space: nowrap; }
    .tabla-participantes td:first-child { text-align: left; }
    .acciones-td { text-align: center; }
    .btn-accion { color: var(--clr-primary); font-size: 1rem; margin: 0 0.2em; }
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
        p.apellido.toLowerCase().includes(termino) ||
        p.afiliado.toString().includes(termino)
      )
    );
  }
}
