// resultados.component.ts — VERSIÓN MEJORADA
// Muestra los resultados como tarjetas de partido estilo marcador
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
      <h2><i class="fas fa-futbol"></i> Resultados</h2>

      <div class="meta-bar">
        <span class="meta-fecha">
          <i class="fas fa-clock" style="font-size:0.75rem;color:var(--clr-primary-light)"></i>
          Actualizado al {{ hoy | date:'dd/MM/yyyy HH:mm' }}
        </span>
        <a routerLink="/posiciones" class="link-pos">
          Ver tabla de posiciones <i class="fas fa-arrow-right" style="font-size:0.7rem"></i>
        </a>
      </div>

      @if (cargando()) {
        <div class="spinner-container"><div class="spinner"></div></div>
      }

      @if (!cargando()) {
        <!-- Filtro de grupo -->
        <div class="filtro-grupos">
          <button
            class="btn-grupo"
            [class.activo]="grupoActivo() === null"
            (click)="grupoActivo.set(null)"
          >Todos</button>
          @for (g of grupos; track g) {
            <button
              class="btn-grupo"
              [class.activo]="grupoActivo() === g"
              (click)="grupoActivo.set(g)"
            >{{ g }}</button>
          }
        </div>

        <div class="resultado-resumen">
          <span class="chip chip-total">
            <i class="fas fa-hashtag" style="font-size:0.7rem"></i>
            {{ cantidadConResultado() }} resultado{{ cantidadConResultado() !== 1 ? 's' : '' }} cargado{{ cantidadConResultado() !== 1 ? 's' : '' }}
          </span>
          @if (cantidadConResultado() === 0) {
            <span class="chip chip-warn">Aún no hay resultados</span>
          }
        </div>

        <!-- Grupos con resultados -->
        @for (grupo of gruposMostrados(); track grupo) {
          <div class="grupo-bloque">
            <div class="grupo-header">
              <span class="grupo-tag">GRUPO {{ grupo }}</span>
              <span class="grupo-partidos">{{ getPartidosPorGrupo(grupo).length }} partidos</span>
            </div>

            <div class="partidos-lista">
              @for (partido of getPartidosPorGrupo(grupo); track partido.id) {
                <div class="partido-card" [class.con-resultado]="tieneResultado(partido.id)">

                  <!-- Número -->
                  <span class="partido-n">#{{ partido.numero }}</span>

                  <!-- Equipo local -->
                  <div class="equipo-bloque" [class.ganador]="getResultado(partido.id) === 'LOCAL'">
                    <img [src]="partido.equipoLocalBandera" [alt]="partido.equipoLocalShow" class="flag flag-lg" width="36" height="24" />
                    <span class="equipo-nomb">{{ partido.equipoLocalShow }}</span>
                    @if (getResultado(partido.id) === 'LOCAL') {
                      <span class="badge-win">Ganó</span>
                    }
                  </div>

                  <!-- Resultado central -->
                  <div class="resultado-centro">
                    @if (tieneResultado(partido.id)) {
                      <div class="resultado-display">
                        @if (getResultado(partido.id) === 'LOCAL') {
                          <span class="resultado-texto resultado-local">L</span>
                        } @else if (getResultado(partido.id) === 'EMPATE') {
                          <span class="resultado-texto resultado-empate">E</span>
                        } @else {
                          <span class="resultado-texto resultado-visitante">V</span>
                        }
                      </div>
                    } @else {
                      <div class="resultado-pendiente">
                        <span class="vs-text">VS</span>
                      </div>
                    }
                  </div>

                  <!-- Equipo visitante -->
                  <div class="equipo-bloque equipo-bloque--right" [class.ganador]="getResultado(partido.id) === 'VISITANTE'">
                    @if (getResultado(partido.id) === 'VISITANTE') {
                      <span class="badge-win">Ganó</span>
                    }
                    <span class="equipo-nomb">{{ partido.equipoVisitanteShow }}</span>
                    <img [src]="partido.equipoVisitanteBandera" [alt]="partido.equipoVisitanteShow" class="flag flag-lg" width="36" height="24" />
                  </div>

                </div>
              }
            </div>
          </div>
        }
      }
    </main>
  `,
  styles: [`
    /* ── Meta bar ────────────────────────────────────────────────────────── */
    .meta-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25em;
      padding-bottom: 0.75em;
      border-bottom: 1px solid var(--clr-border);
    }

    .meta-fecha { font-size: 0.8rem; color: var(--clr-text-muted); display: flex; align-items: center; gap: 0.4em; }
    .link-pos { font-size: 0.8rem; font-weight: 600; color: var(--clr-primary); }
    .link-pos:hover { color: var(--clr-primary-dark); }

    /* ── Filtro grupos ───────────────────────────────────────────────────── */
    .filtro-grupos {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35em;
      margin-bottom: 1.25em;
    }

    .btn-grupo {
      padding: 0.3em 0.75em;
      border: 1.5px solid var(--clr-border-strong);
      border-radius: 20px;
      background: var(--clr-surface);
      color: var(--clr-text-muted);
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      font-family: var(--font-body);
    }

    .btn-grupo:hover { border-color: var(--clr-primary); color: var(--clr-primary); }
    .btn-grupo.activo { border-color: var(--clr-primary); background: var(--clr-primary); color: white; }

    /* ── Chips resumen ───────────────────────────────────────────────────── */
    .resultado-resumen { display: flex; gap: 0.5em; margin-bottom: 1.5em; }

    .chip { display: inline-flex; align-items: center; gap: 0.35em; font-size: 0.75rem; font-weight: 600; padding: 0.3em 0.75em; border-radius: 20px; }
    .chip-total { background: var(--clr-success-bg); color: var(--clr-success-text); }
    .chip-warn  { background: var(--clr-warning-bg);  color: var(--clr-warning-text); }

    /* ── Grupo bloque ────────────────────────────────────────────────────── */
    .grupo-bloque { margin-bottom: 2em; }

    .grupo-header {
      display: flex;
      align-items: center;
      gap: 0.75em;
      margin-bottom: 0.6em;
    }

    .grupo-tag {
      font-family: var(--font-display);
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 2px;
      color: var(--clr-primary-dark);
      background: var(--clr-surface-alt);
      padding: 0.2em 0.8em;
      border-radius: 20px;
      border: 1.5px solid var(--clr-border-strong);
    }

    .grupo-partidos { font-size: 0.75rem; color: var(--clr-text-muted); }

    /* ── Lista de partidos ───────────────────────────────────────────────── */
    .partidos-lista { display: flex; flex-direction: column; gap: 0.5em; }

    /* ── Card de partido ─────────────────────────────────────────────────── */
    .partido-card {
      display: grid;
      grid-template-columns: 28px 1fr 72px 1fr;
      align-items: center;
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-md);
      padding: 0.65em 0.75em;
      gap: 0.5em;
      transition: var(--transition);
    }

    .partido-card:hover { box-shadow: var(--shadow-sm); border-color: var(--clr-border-strong); }
    .partido-card.con-resultado { border-left: 4px solid var(--wc-mexico); }

    /* Número */
    .partido-n { font-size: 0.7rem; font-weight: 700; color: var(--clr-text-muted); text-align: center; }

    /* Bloque de equipo */
    .equipo-bloque {
      display: flex;
      align-items: center;
      gap: 0.6em;
    }

    .equipo-bloque--right { justify-content: flex-end; flex-direction: row-reverse; }

    .equipo-bloque.ganador .equipo-nomb { font-weight: 800; color: var(--wc-neutral-dark); }

    .equipo-nomb {
      font-size: 0.78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      color: var(--clr-text);
    }

    .flag-lg {
      border-radius: 3px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
      flex-shrink: 0;
      border: 1px solid rgba(0,0,0,0.05);
    }

    /* Badge ganador */
    .badge-win {
      font-size: 0.6rem;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      background: #e8f5e9;
      color: var(--wc-mexico);
      padding: 0.2em 0.6em;
      border-radius: 10px;
    }

    /* Resultado central */
    .resultado-centro { display: flex; align-items: center; justify-content: center; }

    .resultado-display {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .resultado-texto {
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: 700;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    .resultado-local     { background: var(--wc-mexico); color: white; }
    .resultado-empate    { background: var(--wc-usa); color: white; }
    .resultado-visitante { background: var(--wc-canada); color: white; }

    .resultado-pendiente {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 2px dashed var(--clr-border-strong);
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fafafa;
    }

    .vs-text { font-size: 0.65rem; font-weight: 800; color: var(--clr-text-muted); letter-spacing: 1px; }


    /* ── Responsive ──────────────────────────────────────────────────────── */
    @media (max-width: 576px) {
      .partido-card { grid-template-columns: 24px 1fr 56px 1fr; gap: 0.35em; padding: 0.5em; }
      .equipo-nomb { display: none; }
      .resultado-texto { font-size: 0.9rem; width: 28px; height: 28px; }
      .resultado-pendiente { width: 28px; height: 28px; }
      .flag-lg { width: 28px !important; height: 19px !important; }
      .meta-bar { flex-direction: column; align-items: flex-start; gap: 0.35em; }
    }
  `]
})
export class ResultadosComponent implements OnInit {

  cargando    = signal(true);
  hoy         = new Date();
  grupoActivo = signal<string | null>(null);

  grupos = ['A','B','C','D','E','F','G','H','I','J','K','L'];

  private partidos: Partido[] = [];
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

  gruposMostrados(): string[] {
    const activo = this.grupoActivo();
    if (activo) return [activo];
    return this.grupos;
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

  cantidadConResultado(): number {
    return this.resultadosMap.size;
  }
}
