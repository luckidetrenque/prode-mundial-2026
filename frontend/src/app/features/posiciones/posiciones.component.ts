// posiciones.component.ts — VERSIÓN MEJORADA
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PosicionService } from '../../core/services/posicion.service';
import { Posicion } from '../../shared/models/posicion.model';

@Component({
  selector: 'app-posiciones',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="main">
      <h2><i class="fas fa-trophy"></i> Tabla de Posiciones</h2>
      <p class="subtitulo">
        <i class="fas fa-circle-info" style="color:var(--clr-primary-light);font-size:0.8rem"></i>
        Clasificación general de los participantes basada en los aciertos obtenidos.
      </p>

      @if (cargando()) {
        <div class="spinner-container"><div class="spinner"></div></div>
      }

      @if (!cargando() && posiciones().length === 0) {
        <div class="estado-vacio">
          <i class="fas fa-hourglass-half icono-vacio"></i>
          <p class="titulo-vacio">Aún no hay resultados</p>
          <p class="desc-vacio">Las posiciones se actualizarán a medida que se carguen los resultados de los partidos.</p>
        </div>
      }

      @if (!cargando() && posiciones().length > 0) {

        <!-- Podio top 3 agrupado -->
        @if (podio().length > 0) {
          <div class="podio">
            
            <!-- 2° lugar (Plata) -->
            @if (podio()[1]) {
              <div class="podio-item podio-segundo">
                <div class="podio-medal"><i class="fas fa-medal second-place"></i></div>
                <div class="podio-info">
                  <div class="podio-nombres-scroll">
                    @for (p of podio()[1].integrantes; track p.codigoPlanilla) {
                      <span class="podio-nombre">{{ p.nombre }} {{ p.apellido }}</span>
                    }
                  </div>
                  <span class="podio-puntos">{{ podio()[1].puntos }} pts</span>
                </div>
                <div class="podio-base podio-base-2">2°</div>
              </div>
            }

            <!-- 1° lugar (Oro) -->
            @if (podio()[0]) {
              <div class="podio-item podio-primero">
                <div class="podio-medal"><i class="fas fa-trophy first-place"></i></div>
                <div class="podio-info">
                  <div class="podio-nombres-scroll">
                    @for (p of podio()[0].integrantes; track p.codigoPlanilla) {
                      <span class="podio-nombre">{{ p.nombre }} {{ p.apellido }}</span>
                    }
                  </div>
                  <span class="podio-puntos">{{ podio()[0].puntos }} pts</span>
                </div>
                <div class="podio-base podio-base-1">1°</div>
              </div>
            }

            <!-- 3° lugar (Bronce) -->
            @if (podio()[2]) {
              <div class="podio-item podio-tercero">
                <div class="podio-medal"><i class="fas fa-medal third-place"></i></div>
                <div class="podio-info">
                  <div class="podio-nombres-scroll">
                    @for (p of podio()[2].integrantes; track p.codigoPlanilla) {
                      <span class="podio-nombre">{{ p.nombre }} {{ p.apellido }}</span>
                    }
                  </div>
                  <span class="podio-puntos">{{ podio()[2].puntos }} pts</span>
                </div>
                <div class="podio-base podio-base-3">3°</div>
              </div>
            }

          </div>
        }
        
        <!-- Tabla limpia -->
        <div class="table-container">
          <table class="tabla-pos">
            <thead>
              <tr>
                <th class="col-pos">#</th>
                <th class="col-nombre">
                  <div class="header-nombre-content">
                    <span class="header-label">Participante</span>
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
                      ({{ posicionesFiltradasTotal() }} participants · {{ posiciones()[0]?.totalPartidos ?? 0 }} partidos jugados)
                    </span>
                  </div>
                </th>
                <th class="col-planilla">Planilla</th>
                <th class="col-pts">Puntos</th>
              </tr>
            </thead>
            <tbody>
              @for (pos of posicionesPaginadas(); track pos.codigoPlanilla) {
                <tr [class]="getClaseRow(pos.posicion)">
                  <td class="col-pos">
                    @switch (pos.posicion) {
                      @case (1) { <i class="fas fa-trophy first-place" title="1° puesto"></i> }
                      @case (2) { <i class="fas fa-medal second-place" title="2° puesto"></i> }
                      @case (3) { <i class="fas fa-medal third-place" title="3° puesto"></i> }
                      @default  { <span class="pos-num">{{ pos.posicion }}</span> }
                    }
                  </td>
                  <td class="col-nombre">
                    <span class="nombre-participante">{{ pos.nombre }} {{ pos.apellido }}</span>
                  </td>
                  <td class="col-planilla">
                    <a [routerLink]="['/planillas', pos.codigoPlanilla]" class="link-planilla" title="Ver planilla">
                      {{ pos.codigoPlanilla }}
                      <i class="fas fa-arrow-up-right-from-square" style="font-size:0.6rem;opacity:0.6"></i>
                    </a>
                  </td>
                  <td class="col-pts">
                    <span class="pts-badge" [class.pts-top]="pos.posicion <= 3">{{ pos.puntos }}</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        @if (totalPaginas() > 1) {
          <div class="paginacion">
            <button class="btn-pag" (click)="paginaAnterior()" [disabled]="paginaActual() === 1">
              <i class="fas fa-chevron-left"></i>
            </button>
            <span class="pag-info">Pág. {{ paginaActual() }} de {{ totalPaginas() }}</span>
            <button class="btn-pag" (click)="paginaSiguiente()" [disabled]="paginaActual() === totalPaginas()">
              <i class="fas fa-chevron-right"></i>
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

    .icono-vacio { font-size: 3rem; color: var(--clr-border-strong); margin-bottom: 0.5em; display: block; }
    .titulo-vacio { font-family: var(--font-display); font-size: 1.3rem; color: var(--clr-text-muted); margin-bottom: 0.4em; }
    .desc-vacio { font-size: 0.875rem; color: var(--clr-text-muted); max-width: 360px; margin: 0 auto; line-height: 1.6; }

    /* ── Podio ───────────────────────────────────────────────────────────── */
    .podio {
      display: flex;
      align-items: flex-end;
      justify-content: center;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-xl);
      padding: var(--spacing-lg) var(--spacing-md) 0;
    }

    .podio-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-xs);
      flex: 1;
      max-width: 180px;
    }

    .podio-medal { font-size: 1.6rem; }
    .podio-info  { text-align: center; width: 100%; }
    
    .podio-nombres-scroll {
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-height: 52px;
      overflow-y: auto;
      margin-bottom: var(--spacing-xs);
      padding: 0 var(--spacing-xs);
      /* Ocultar scrollbar */
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    
    .podio-nombres-scroll::-webkit-scrollbar { display: none; }

    .podio-nombre { display: block; font-size: 0.72rem; font-weight: 600; color: var(--clr-text); line-height: 1.2; }
    .podio-puntos { display: block; font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--clr-primary); }

    .podio-base {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-display);
      font-size: 1.2rem;
      font-weight: 700;
      color: white;
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    }

    .podio-base-1 { height: 72px; background: linear-gradient(180deg, #e6b800 0%, #ffd700 100%); }
    .podio-base-2 { height: 52px; background: linear-gradient(180deg, #9a9a9a 0%, #c0c0c0 100%); }
    .podio-base-3 { height: 38px; background: linear-gradient(180deg, #a0622a 0%, #cd7f32 100%); }

    /* ── Controles integrados en Header (th Participante) ────────────────── */
    .header-nombre-content {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .header-label { 
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      flex-shrink: 0;
    }

    .buscador-inline {
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid var(--clr-border-strong);
      border-radius: 4px;
      padding: 0 var(--spacing-sm);
      gap: var(--spacing-xs);
      flex: 1;
      max-width: 140px;
      height: 24px;
    }

    .buscador-inline i {
      font-size: 0.65rem;
      color: var(--clr-text-muted);
    }

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

    /* ── Tabla ───────────────────────────────────────────────────────────── */
    .table-container {
      border: 1px solid var(--clr-border-strong);
      border-radius: var(--radius-md);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      margin-top: 0;
    }

    .tabla-pos { margin: 0; width: 100%; }

    .tabla-pos thead th {
      background: var(--clr-surface-alt);
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--clr-text-muted);
      padding: 0.6em 0.85em;
      border-bottom: 1.5px solid var(--clr-border-strong);
      vertical-align: middle;
    }

    .tabla-pos tbody td {
      padding: 0.7em 0.85em;
      border-bottom: 1px solid var(--clr-border);
      font-size: 0.875rem;
    }

    .tabla-pos tbody tr:last-child td { border-bottom: none; }
    .tabla-pos tbody tr:hover td { background: var(--clr-surface-alt); }

    /* Filas especiales */
    .row-gold   td { background: #fffde7; }
    .row-silver td { background: #fafafa; }
    .row-bronze td { background: #fff8f2; }
    .row-gold:hover   td { background: #fff9c4 !important; }
    .row-silver:hover td { background: #f0f0f0 !important; }
    .row-bronze:hover td { background: #fef0e4 !important; }

    /* Columnas */
    .col-pos      { width: 48px; text-align: center; }
    .col-nombre   { text-align: left; }
    .col-afil     { width: 90px; text-align: center; }
    .col-planilla { width: 100px; text-align: center; }
    .col-pts      { width: 80px; text-align: center; }
    .col-muted    { color: var(--clr-text-muted); font-size: 0.82rem; }

    .pos-num { font-size: 0.8rem; font-weight: 600; color: var(--clr-text-muted); }
    .nombre-participante { font-weight: 500; }

    .link-planilla {
      display: inline-flex;
      align-items: center;
      gap: 0.25em;
      font-size: 0.82rem;
      color: var(--clr-primary);
      font-weight: 500;
    }

    .link-planilla:hover { color: var(--clr-primary-dark); }

    .pts-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-display);
      font-size: 1rem;
      font-weight: 700;
      color: var(--clr-text);
      min-width: 36px;
    }

    .pts-badge.pts-top {
      background: var(--clr-primary);
      color: white;
      border-radius: 20px;
      padding: 0.1em 0.6em;
    }

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

    .pag-info { font-size: 0.82rem; color: var(--clr-text-muted); }

    /* ── Responsive ──────────────────────────────────────────────────────── */
    @media (max-width: 600px) {
      .podio { gap: 0.35em; }
      .podio-nombre { font-size: 0.7rem; }
      .tabla-controles { flex-direction: column; align-items: flex-start; gap: 0.5em; }
      .buscador-wrap { max-width: 100%; width: 100%; }
      .col-afil { display: none; }
    }
  `]
})
export class PosicionesComponent implements OnInit {

  cargando      = signal(true);
  posiciones    = signal<Posicion[]>([]);
  paginaActual  = signal(1);
  readonly POR_PAGINA = 20;

  // Podio agrupado por los 3 primeros puestos reales
  podio = computed(() => {
    const all = this.posiciones();
    if (all.length === 0) return [];
    
    // Obtenemos los 3 primeros niveles de puntos únicos
    const puntosUnicos = [...new Set(all.map(p => p.puntos))].sort((a, b) => b - a);
    const top3Puntos = puntosUnicos.slice(0, 3);
    
    return top3Puntos.map((pts, index) => ({
      posicion: index + 1,
      puntos: pts,
      integrantes: all.filter(p => p.puntos === pts)
    }));
  });

  private termino = '';
  private _posicionesOriginales: Posicion[] = []; // Data pura del server
  private _posicionesProcesadas: Posicion[] = []; // Data con ranking recalculado
  _posicionesFiltradas: Posicion[] = []; // Data para la tabla

  constructor(private posicionService: PosicionService) {}

  ngOnInit(): void {
    this.posicionService.getPosiciones().subscribe({
      next: data => {
        this._posicionesOriginales = data;
        this.procesarRanking();
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  private procesarRanking(): void {
    // 1. Ordenar por puntos (desc)
    const sorted = [...this._posicionesOriginales].sort((a, b) => b.puntos - a.puntos);
    
    // 2. Aplicar Dense Ranking (1, 1, 2, 3, 3, 4...)
    let currentRank = 0;
    let lastPoints = -1;
    
    this._posicionesProcesadas = sorted.map(p => {
      if (p.puntos !== lastPoints) {
        currentRank++;
        lastPoints = p.puntos;
      }
      return { ...p, posicion: currentRank };
    });

    this.posiciones.set(this._posicionesProcesadas);
    this.actualizarFiltro();
  }

  filtrar(evento: Event): void {
    this.termino = (evento.target as HTMLInputElement).value.toLowerCase();
    this.actualizarFiltro();
    this.paginaActual.set(1);
  }

  private actualizarFiltro(): void {
    if (!this.termino) {
      this._posicionesFiltradas = this._posicionesProcesadas;
    } else {
      this._posicionesFiltradas = this._posicionesProcesadas.filter(p =>
        p.nombre.toLowerCase().includes(this.termino) ||
        p.apellido.toLowerCase().includes(this.termino)
      );
    }
  }

  posicionesPaginadas(): Posicion[] {
    const inicio = (this.paginaActual() - 1) * this.POR_PAGINA;
    return this._posicionesFiltradas.slice(inicio, inicio + this.POR_PAGINA);
  }

  posicionesFiltradasTotal(): number { return this._posicionesFiltradas.length; }
  totalPaginas(): number { return Math.max(1, Math.ceil(this._posicionesFiltradas.length / this.POR_PAGINA)); }
  paginaAnterior(): void { if (this.paginaActual() > 1) this.paginaActual.update(p => p - 1); }
  paginaSiguiente(): void { if (this.paginaActual() < this.totalPaginas()) this.paginaActual.update(p => p + 1); }

  getClaseRow(posicion: number): string {
    if (posicion === 1) return 'row-gold';
    if (posicion === 2) return 'row-silver';
    if (posicion === 3) return 'row-bronze';
    return '';
  }
}
