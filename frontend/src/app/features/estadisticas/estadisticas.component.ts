// src/app/features/estadisticas/estadisticas.component.ts
// CORREGIDO: ahora usa GET /api/estadisticas (datos reales del backend)
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstadisticaService } from '../../core/services/estadistica.service';
import { EstadisticaPartido } from '../../shared/models/estadistica.model';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="main">
      <h2><i class="fas fa-chart-simple"></i> Estadísticas de Apuestas</h2>

      @if (cargando()) {
        <div class="spinner-container"><div class="spinner"></div></div>
      }

      @if (!cargando() && estadisticas().length === 0) {
        <p class="msg-warning">No hay planillas confirmadas aún.</p>
      }

      @if (!cargando() && estadisticas().length > 0) {
        <p class="subtitulo">Datos calculados sobre {{ estadisticas()[0].totalVotos }} planillas confirmadas.</p>
        <div class="stats-grid">
          @for (stat of estadisticas(); track stat.numeroPartido) {
            <div class="stat-card">
              <div class="stat-header">
                <span class="stat-num">Partido {{ stat.numeroPartido }}</span>
                <span class="stat-equipos">{{ stat.equipoLocal }} vs. {{ stat.equipoVisitante }}</span>
              </div>
              <div class="stat-barras">
                <!-- Local -->
                <div class="barra-item">
                  <div class="barra-etiqueta">
                    <span>{{ stat.equipoLocal }}</span>
                    <strong>{{ stat.votosLocal }}</strong>
                  </div>
                  <div class="barra-track">
                    <div class="barra-fill barra-local" [style.width.%]="getPorcentaje(stat.votosLocal, stat.totalVotos)"></div>
                  </div>
                  <span class="barra-pct">{{ getPorcentaje(stat.votosLocal, stat.totalVotos) | number:'1.0-0' }}%</span>
                </div>
                <!-- Empate -->
                <div class="barra-item">
                  <div class="barra-etiqueta">
                    <span class="empate-icono">🤝</span>
                    <span>Empate</span>
                    <strong>{{ stat.votosEmpate }}</strong>
                  </div>
                  <div class="barra-track">
                    <div class="barra-fill barra-empate" [style.width.%]="getPorcentaje(stat.votosEmpate, stat.totalVotos)"></div>
                  </div>
                  <span class="barra-pct">{{ getPorcentaje(stat.votosEmpate, stat.totalVotos) | number:'1.0-0' }}%</span>
                </div>
                <!-- Visitante -->
                <div class="barra-item">
                  <div class="barra-etiqueta">
                    <span>{{ stat.equipoVisitante }}</span>
                    <strong>{{ stat.votosVisitante }}</strong>
                  </div>
                  <div class="barra-track">
                    <div class="barra-fill barra-visitante" [style.width.%]="getPorcentaje(stat.votosVisitante, stat.totalVotos)"></div>
                  </div>
                  <span class="barra-pct">{{ getPorcentaje(stat.votosVisitante, stat.totalVotos) | number:'1.0-0' }}%</span>
                </div>
              </div>
              <p class="stat-total">Total de votos: {{ stat.totalVotos }}</p>
            </div>
          }
        </div>
      }
    </main>
  `,
  styles: [`
    .subtitulo { font-size: 0.85rem; color: #666; margin-bottom: 1em; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1em; }
    .stat-card { background: white; border: 1px solid #e0e0e0; border-radius: 10px; padding: 1em; box-shadow: 0 1px 4px rgba(0,0,0,0.07); }
    .stat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75em; }
    .stat-num { font-weight: bold; color: var(--clr-primary); font-size: 0.8rem; }
    .stat-equipos { font-size: 0.75rem; text-transform: uppercase; color: #555; }
    .stat-barras { display: flex; flex-direction: column; gap: 0.5em; }
    .barra-item { display: grid; grid-template-columns: 120px 1fr 36px; align-items: center; gap: 0.4em; }
    .barra-etiqueta { display: flex; align-items: center; gap: 0.3em; font-size: 0.72rem; text-transform: uppercase; overflow: hidden; }
    .barra-etiqueta strong { margin-left: auto; color: var(--clr-primary-dark); }
    .empate-icono { font-size: 1rem; }
    .barra-track { height: 14px; background: #f0f0f0; border-radius: 7px; overflow: hidden; }
    .barra-fill { height: 100%; border-radius: 7px; transition: width 0.6s ease; }
    .barra-local     { background-color: #49bce3; }
    .barra-empate    { background-color: #56042c; }
    .barra-visitante { background-color: #fec310; }
    .barra-pct { font-size: 0.7rem; font-weight: bold; color: #444; text-align: right; }
    .stat-total { font-size: 0.7rem; color: #999; text-align: right; margin-top: 0.5em; }
    @media (max-width: 576px) { .stats-grid { grid-template-columns: 1fr; } .barra-item { grid-template-columns: 90px 1fr 30px; } }
  `]
})
export class EstadisticasComponent implements OnInit {

  cargando     = signal(true);
  estadisticas = signal<EstadisticaPartido[]>([]);

  constructor(private estadisticaService: EstadisticaService) {}

  ngOnInit(): void {
    // Usa el endpoint real GET /api/estadisticas
    this.estadisticaService.getEstadisticas().subscribe({
      next: data => { this.estadisticas.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false)
    });
  }

  getPorcentaje(votos: number, total: number): number {
    return total === 0 ? 0 : Math.round((votos / total) * 100);
  }
}
