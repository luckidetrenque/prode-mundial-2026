// src/app/features/resultados/resultados.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PartidoService } from '../../core/services/partido.service';
import { ResultadoService } from '../../core/services/resultado.service';
import { Partido } from '../../shared/models/partido.model';
import { ResultadoPrediccion } from '../../shared/models/planilla.model';

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  template: `
    <main class="main">
      <h2><i class="fas fa-futbol"></i> Resultados de la Fase de Grupos</h2>
      <p class="subtitulo">
        Resultados computados al <strong>{{ hoy | date:'dd/MM/yyyy HH:mm' }}</strong>.
        <a routerLink="/posiciones">Ver posiciones →</a>
      </p>
      <p class="nota">Los partidos ya jugados aparecen resaltados con el resultado seleccionado.</p>

      @if (cargando()) {
        <div class="spinner-container"><div class="spinner"></div></div>
      }

      @if (!cargando()) {
        <div class="groups-grid">
          @for (grupo of grupos; track grupo) {
            <table class="group-table results">
              <caption>GRUPO {{ grupo }}</caption>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Local (L)</th>
                  <th>Empate (E)</th>
                  <th>Visitante (V)</th>
                </tr>
              </thead>
              <tbody>
                @for (partido of getPartidosPorGrupo(grupo); track partido.id) {
                  <tr [class.con-resultado]="tieneResultado(partido.id)">
                    <td class="num-td">{{ partido.numero }}</td>
                    <td class="opcion-td">
                      <label class="opcion-label" [class.ganadora]="getResultado(partido.id) === 'LOCAL'">
                        <input type="radio" [name]="'p' + partido.id" value="LOCAL" [checked]="getResultado(partido.id) === 'LOCAL'" disabled />
                        <img [src]="partido.equipoLocalBandera" [alt]="partido.equipoLocalShow" class="flag" width="28" />
                        <span class="nombre-equipo">{{ partido.equipoLocalShow }}</span>
                      </label>
                    </td>
                    <td class="opcion-td empate-td">
                      <label class="opcion-label" [class.ganadora]="getResultado(partido.id) === 'EMPATE'">
                        <input type="radio" [name]="'p' + partido.id" value="EMPATE" [checked]="getResultado(partido.id) === 'EMPATE'" disabled />
                        <img src="assets/images/empate.png" alt="Empate" class="flag img-draw" width="28" />
                      </label>
                    </td>
                    <td class="opcion-td">
                      <label class="opcion-label" [class.ganadora]="getResultado(partido.id) === 'VISITANTE'">
                        <input type="radio" [name]="'p' + partido.id" value="VISITANTE" [checked]="getResultado(partido.id) === 'VISITANTE'" disabled />
                        <img [src]="partido.equipoVisitanteBandera" [alt]="partido.equipoVisitanteShow" class="flag" width="28" />
                        <span class="nombre-equipo">{{ partido.equipoVisitanteShow }}</span>
                      </label>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }
    </main>
  `,
  styles: [`
    .subtitulo { font-size: 0.85rem; color: #555; margin-bottom: 0.5em; }
    .nota { font-size: 0.8rem; color: #888; font-style: italic; margin-bottom: 1.5em; }
    .group-table.results th, .group-table.results td { text-align: center; }
    .num-td { width: 30px; font-weight: bold; color: var(--clr-primary); }
    .opcion-td { padding: 0.4em; }
    .opcion-label { display: flex; flex-direction: column; align-items: center; gap: 0.2em; padding: 0.3em; border-radius: 6px; cursor: default; transition: background 0.2s; }
    .opcion-label.ganadora { background-color: var(--clr-primary-light); color: white; transform: scale(1.08); box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
    .opcion-label input[type="radio"] { display: none; }
    .nombre-equipo { font-size: 0.65rem; text-transform: uppercase; max-width: 60px; text-align: center; line-height: 1.1; }
    .con-resultado { background-color: #fafffe !important; }
    .img-draw { border-radius: 50%; background: #eee; }
    .empate-td { opacity: 0.85; }
    @media (max-width: 576px) { .nombre-equipo { display: none; } .groups-grid { grid-template-columns: 1fr; } }
  `]
})
export class ResultadosComponent implements OnInit {

  cargando = signal(true);
  hoy      = new Date();
  grupos   = ['A','B','C','D','E','F','G','H','I','J','K','L'];

  private partidos: Partido[]                           = [];
  private resultadosMap = new Map<number, ResultadoPrediccion>();

  constructor(
    private partidoService: PartidoService,
    private resultadoService: ResultadoService
  ) {}

  ngOnInit(): void {
    this.partidoService.getPartidos().subscribe(partidos => {
      this.partidos = partidos.filter(p => p.fase === 'GRUPOS');
      this.resultadoService.getResultados().subscribe(resultados => {
        resultados.forEach(r => this.resultadosMap.set(r.partido.id, r.resultado));
        this.cargando.set(false);
      });
    });
  }

  getPartidosPorGrupo(grupo: string): Partido[] {
    return this.partidos.filter(p => p.grupo === grupo);
  }

  getResultado(partidoId: number): ResultadoPrediccion | null {
    return this.resultadosMap.get(partidoId) ?? null;
  }

  tieneResultado(partidoId: number): boolean {
    return this.resultadosMap.has(partidoId);
  }
}
