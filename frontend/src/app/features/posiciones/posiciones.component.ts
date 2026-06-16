// frontend/src/app/features/posiciones/posiciones.component.ts
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PosicionService } from '../../core/services/posicion.service';
import { MencionService } from '../../core/services/mencion.service';
import { Posicion } from '../../shared/models/posicion.model';
import { Mencion, MencionesResponse } from '../../shared/models/menciones.model';
import { TorneoService } from '../../core/services/torneo.service';
import { SplashBienvenidaComponent } from '../../shared/components/splash-bienvenida/splash-bienvenida.component';

type TabActiva = 'posiciones' | 'menciones';

@Component({
  selector: 'app-posiciones',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, SplashBienvenidaComponent],
  template: `
    <main class="main">
      @if (torneoService.tiempoExpirado()) {
        <app-splash-bienvenida />
      }
      <h2><i class="fas fa-trophy"></i> Posiciones</h2>
      <p class="subtitulo">
        <i class="fas fa-circle-info" style="color:var(--clr-primary-light);font-size:0.8rem"></i>
        Clasificación general y menciones especiales del torneo.
      </p>

      <!-- Tabs -->
      <div class="tabs-wrap">
        <button class="tab-btn" [class.activo]="tabActiva() === 'posiciones'"
          (click)="tabActiva.set('posiciones')" type="button">
          <i class="fas fa-trophy"></i> Tabla
        </button>
        <button class="tab-btn" [class.activo]="tabActiva() === 'menciones'"
          (click)="setTabMenciones()" type="button">
          <i class="fas fa-medal"></i> Menciones
          @if (mencionesData()?.menciones?.length) {
            <span class="tab-badge">{{ mencionesData()!.menciones.length }}</span>
          }
        </button>
      </div>

      <!-- ══ TAB: POSICIONES ══ -->
      @if (tabActiva() === 'posiciones') {

        @if (cargando()) {
          <div class="spinner-container"><div class="spinner"></div></div>
        }

        @if (!cargando() && posiciones().length === 0) {
          <div class="estado-vacio">
            <i class="fas fa-hourglass-half icono-vacio"></i>
            <p class="titulo-vacio">Aún no hay resultados</p>
            <p class="desc-vacio">Las posiciones se actualizarán a medida que se carguen los resultados.</p>
          </div>
        }

        @if (!cargando() && posiciones().length > 0) {

          @if (podio().length > 0) {
            <div class="podio">
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

          <div class="acciones-tabla mobile-only">
            <div class="buscador-inline">
              <i class="fas fa-magnifying-glass"></i>
              <input type="text" name="buscarPosicionMobile" class="buscador-input"
                placeholder="Buscar participante..." (input)="filtrar($event)" />
            </div>
          </div>

          <div class="table-container">
            <div class="table-wrap">
              <table class="tabla-pos">
                <thead>
                  <tr>
                    <th class="col-pos">#</th>
                    <th class="col-nombre">
                      <div class="header-nombre-content">
                        <span class="header-label">Participante</span>
                        <div class="buscador-inline desktop-only">
                          <i class="fas fa-magnifying-glass"></i>
                          <input type="text" name="buscarPosicion" class="buscador-input"
                            placeholder="Buscar..." (input)="filtrar($event)" />
                        </div>
                      </div>
                    </th>
                    <th class="col-planilla">Planilla</th>
                    <th class="col-pts">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  @for (pos of posicionesPaginadas(); track pos.codigoPlanilla; let i = $index) {
                    <tr [class]="getClaseRow(pos.posicion)" [style.animation-delay.ms]="i * 50">
                      <td class="col-pos">
                        @switch (pos.posicion) {
                          @case (1) { <i class="fas fa-trophy first-place"></i> }
                          @case (2) { <i class="fas fa-medal second-place"></i> }
                          @case (3) { <i class="fas fa-medal third-place"></i> }
                          @default  { <span class="pos-num">{{ pos.posicion }}</span> }
                        }
                      </td>
                      <td class="col-nombre">
                        <span class="nombre-participante">{{ pos.nombre }} {{ pos.apellido }}</span>
                      </td>
                      <td class="col-planilla">
                        <a [routerLink]="['/planillas', pos.codigoPlanilla]" class="link-planilla">
                          {{ pos.codigoPlanilla }}
                          <i class="fas fa-arrow-up-right-from-square" style="font-size:0.6rem;opacity:0.6"></i>
                        </a>
                      </td>
                      <td class="col-pts">
                        <span class="pts-badge" [class.pts-top]="pos.posicion <= 3 && pos.puntos > 0">
                          {{ pos.puntos }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          @if (totalPaginas() > 1) {
            <div class="paginacion">
              <button class="btn-pag" (click)="paginaAnterior()" [disabled]="paginaActual() === 1">
                <i class="fas fa-chevron-left"></i>
              </button>
              <div class="pag-numeros">
                @for (p of paginas(); track p) {
                  <button class="btn-num" [class.activo]="p === paginaActual()" (click)="irAPagina(p)">
                    {{ p }}
                  </button>
                }
              </div>
              <button class="btn-pag" (click)="paginaSiguiente()" [disabled]="paginaActual() === totalPaginas()">
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          }
        }
      }

      <!-- ══ TAB: MENCIONES ══ -->
      @if (tabActiva() === 'menciones') {

        @if (cargandoMenciones()) {
          <div class="spinner-container"><div class="spinner"></div></div>
        }

        @if (!cargandoMenciones() && mencionesData() && !mencionesData()!.hayDatos) {
          <div class="estado-vacio">
            <i class="fas fa-medal icono-vacio"></i>
            <p class="titulo-vacio">Aún no hay menciones</p>
            <p class="desc-vacio">Las menciones aparecerán cuando haya resultados cargados.</p>
          </div>
        }

        @if (!cargandoMenciones() && mencionesData()?.hayDatos) {
          <div class="menciones-header">
            <p class="menciones-intro">
              <i class="fas fa-circle-info"></i>
              Reconocimientos especiales basados en el rendimiento durante el torneo.
              Se actualizan automáticamente cada 30 minutos.
            </p>
            @if (mencionesData()?.ultimaActualizacion) {
              <span class="menciones-timestamp">
                <i class="fas fa-clock"></i>
                Última actualización: {{ mencionesData()!.ultimaActualizacion | date:'dd/MM HH:mm' }}
              </span>
            }
          </div>

          <div class="menciones-grid">
            @for (m of mencionesData()!.menciones; track m.tipo + m.descripcion) {
              <div class="mencion-card" [class]="'mencion-' + m.tipo.toLowerCase()">
                <div class="mencion-emoji">{{ m.emoji }}</div>
                <div class="mencion-body">
                  <span class="mencion-titulo">{{ m.titulo }}</span>
                  <span class="mencion-desc">{{ m.descripcion }}</span>
                  <div class="mencion-participantes">
                    @for (p of m.participantes; track p.codigoPlanilla) {
                      <a [routerLink]="['/planillas', p.codigoPlanilla]" class="mencion-chip">
                        {{ p.nombre }} {{ p.apellido }}
                        <i class="fas fa-arrow-up-right-from-square" style="font-size:0.55rem;opacity:0.6"></i>
                      </a>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }
      }

    </main>
  `,
  styles: [`
    /* ── Tabs ─────────────────────────────────────────────────────────── */
    .tabs-wrap {
      display: flex;
      gap: 0;
      margin-bottom: 1.75em;
      border-bottom: 2px solid var(--clr-border-strong);
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5em;
      padding: 0.65em 1.5em;
      background: transparent;
      border: none;
      border-bottom: 3px solid transparent;
      margin-bottom: -2px;
      font-family: var(--font-body);
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--clr-text-muted);
      cursor: pointer;
      transition: var(--transition);
    }

    .tab-btn:hover { color: var(--clr-primary-dark); }

    .tab-btn.activo {
      color: var(--clr-primary-dark);
      border-bottom-color: var(--clr-primary-dark);
    }

    .tab-badge {
      background: var(--clr-primary);
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.15em 0.5em;
      border-radius: 10px;
      min-width: 18px;
      text-align: center;
    }

    /* ── Menciones header ──────────────────────────────────────────────── */
    .menciones-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75em;
      margin-bottom: 1.5em;
    }

    .menciones-intro {
      display: flex;
      align-items: flex-start;
      gap: 0.5em;
      font-size: 0.82rem;
      color: var(--clr-text-muted);
      background: var(--clr-surface-alt);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-md);
      padding: 0.75em 1em;
      flex: 1;
      line-height: 1.5;
    }

    .menciones-intro i { color: var(--clr-primary-light); flex-shrink: 0; margin-top: 1px; }

    .menciones-timestamp {
      font-size: 0.75rem;
      color: var(--clr-text-muted);
      display: flex;
      align-items: center;
      gap: 0.35em;
      white-space: nowrap;
      padding: 0.5em 0;
    }

    /* ── Grid de menciones ─────────────────────────────────────────────── */
    .menciones-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
      gap: 1em;
    }

    /* ── Card de mención ───────────────────────────────────────────────── */
    .mencion-card {
      display: flex;
      align-items: flex-start;
      gap: 1em;
      padding: 1.1em 1.25em;
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      transition: var(--transition);
      border-left: 4px solid var(--clr-border-strong);
    }

    .mencion-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    /* Colores por tipo */
    .mencion-card.mencion-el_adivino   { border-left-color: #2A398D; }
    .mencion-card.mencion-diamante     { border-left-color: #00bcd4; }
    .mencion-card.mencion-jornada_perfecta { border-left-color: #E61D25; }
    .mencion-card.mencion-puntero      { border-left-color: #FFD700; }
    .mencion-card.mencion-mas_x2       { border-left-color: #ff9800; }
    .mencion-card.mencion-empatador    { border-left-color: #3CAC3B; }
    .mencion-card.mencion-consenso     { border-left-color: #9c27b0; }
    .mencion-card.mencion-resistente   { border-left-color: #78909c; }
    .mencion-card.mencion-remontada    { border-left-color: #3CAC3B; }
    .mencion-card.mencion-bajon        { border-left-color: #E61D25; }

    .mencion-emoji {
      font-size: 2rem;
      line-height: 1;
      flex-shrink: 0;
      margin-top: 0.1em;
    }

    .mencion-body {
      display: flex;
      flex-direction: column;
      gap: 0.3em;
      min-width: 0;
    }

    .mencion-titulo {
      font-family: var(--font-display);
      font-size: 1rem;
      font-weight: 700;
      color: var(--clr-primary-dark);
      letter-spacing: 0.3px;
    }

    .mencion-desc {
      font-size: 0.8rem;
      color: var(--clr-text-muted);
      line-height: 1.4;
    }

    .mencion-participantes {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4em;
      margin-top: 0.4em;
    }

    .mencion-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.3em;
      background: var(--clr-surface-alt);
      border: 1px solid var(--clr-border-strong);
      border-radius: 20px;
      padding: 0.2em 0.7em;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--clr-primary-dark);
      text-decoration: none;
      transition: var(--transition);
    }

    .mencion-chip:hover {
      background: var(--clr-primary-dark);
      color: white;
      border-color: var(--clr-primary-dark);
    }

    /* ── Posiciones (mismo estilo que antes) ───────────────────────────── */
    .podio { display: flex; align-items: flex-end; justify-content: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-xl); padding: var(--spacing-lg) var(--spacing-md) 0; }
    .podio-item { display: flex; flex-direction: column; align-items: center; gap: var(--spacing-xs); flex: 1; max-width: 180px; transition: transform 0.3s ease; cursor: default; }
    .podio-item:hover { transform: translateY(-5px); }
    .podio-medal { font-size: 1.6rem; }
    .podio-info  { text-align: center; width: 100%; }
    .podio-nombres-scroll { display: flex; flex-direction: column; gap: 2px; max-height: 52px; overflow-y: auto; margin-bottom: var(--spacing-xs); scrollbar-width: none; }
    .podio-nombres-scroll::-webkit-scrollbar { display: none; }
    .podio-nombre { display: block; font-size: 0.72rem; font-weight: 600; color: var(--clr-text); line-height: 1.2; }
    .podio-puntos { display: block; font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--clr-primary); }
    .podio-base { width: 100%; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; color: white; border-radius: var(--radius-sm) var(--radius-sm) 0 0; animation: growUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) backwards; }
    .podio-base-1 { height: 72px; background: linear-gradient(180deg, #e6b800 0%, #ffd700 100%); animation-delay: 0.4s; }
    .podio-base-2 { height: 52px; background: linear-gradient(180deg, #9a9a9a 0%, #c0c0c0 100%); animation-delay: 0.2s; }
    .podio-base-3 { height: 38px; background: linear-gradient(180deg, #a0622a 0%, #cd7f32 100%); }
    .header-nombre-content { display: flex; align-items: center; gap: var(--spacing-md); }
    .header-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; flex-shrink: 0; }
    .buscador-inline { display: flex; align-items: center; background: var(--clr-surface); border: 1px solid var(--clr-border-strong); border-radius: var(--radius-md); padding: 0.4rem 0.8rem; gap: 0.5rem; width: 100%; max-width: 300px; }
    .buscador-inline i { font-size: 0.85rem; color: var(--clr-text-muted); }
    .buscador-input { background: transparent; border: none; width: 100%; font-family: var(--font-body); font-size: 0.85rem; color: var(--clr-text); padding: 0; outline: none; }
    .acciones-tabla { display: flex; justify-content: flex-end; margin-bottom: 1rem; }
    .mobile-only { display: none !important; }
    .desktop-only { display: flex; }
    .tabla-pos { margin: 0; width: 100%; }
    .tabla-pos thead th { background: var(--clr-surface-alt); font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--clr-text-muted); padding: 0.75rem 1rem; border-bottom: 1.5px solid var(--clr-border-strong); vertical-align: middle; white-space: nowrap; }
    .tabla-pos tbody td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--clr-border); font-size: 0.875rem; vertical-align: middle; }
    .tabla-pos tbody tr { opacity: 0; transform: translateY(10px); animation: slideUpFade 0.4s ease forwards; }
    .tabla-pos tbody tr:last-child td { border-bottom: none; }
    .tabla-pos tbody tr:hover td { background: var(--clr-surface-alt); }
    .row-gold   td { background: #fffde7; }
    .row-silver td { background: #fafafa; }
    .row-bronze td { background: #fff8f2; }
    .col-pos { width: 50px; text-align: center; }
    .col-nombre { text-align: left; }
    .col-planilla { width: 110px; text-align: center; }
    .col-pts { width: 80px; text-align: center; }
    .nombre-participante { font-weight: 500; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
    .pos-num { font-size: 0.8rem; font-weight: 600; color: var(--clr-text-muted); }
    .link-planilla { display: inline-flex; align-items: center; gap: 0.25em; font-size: 0.82rem; color: var(--clr-primary); font-weight: 500; }
    .pts-badge { display: inline-flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--clr-text); min-width: 36px; }
    .pts-badge.pts-top { background: var(--clr-primary); color: white; border-radius: 20px; padding: 0.1em 0.6em; }
    .paginacion { display: flex; align-items: center; justify-content: center; gap: 1em; margin-top: 1.25em; }
    .btn-pag { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border: 1.5px solid var(--clr-border-strong); border-radius: 50%; background: var(--clr-surface); color: var(--clr-text); font-size: 0.8rem; cursor: pointer; transition: var(--transition); font-family: var(--font-body); }
    .btn-pag:hover:not(:disabled) { border-color: var(--clr-primary); color: var(--clr-primary); }
    .btn-pag:disabled { opacity: 0.35; cursor: not-allowed; }
    .pag-numeros { display: flex; gap: var(--spacing-xs); }
    .btn-num { width: 34px; height: 34px; border: 1.5px solid var(--clr-border-strong); border-radius: 8px; background: var(--clr-surface); color: var(--clr-text-muted); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; font-family: var(--font-body); }
    .btn-num:hover:not(.activo) { border-color: var(--clr-primary); color: var(--clr-primary); }
    .btn-num.activo { background: var(--clr-primary); border-color: var(--clr-primary); color: white; }

    @keyframes growUp { 0% { transform: scaleY(0); opacity: 0; } 100% { transform: scaleY(1); opacity: 1; } }
    @keyframes slideUpFade { 0% { opacity: 0; transform: translateY(15px); } 100% { opacity: 1; transform: translateY(0); } }

    @media (max-width: 600px) {
      .podio { gap: 0.35em; }
      .col-planilla { display: none; }
      .mobile-only { display: flex !important; }
      .desktop-only { display: none !important; }
      .buscador-inline { max-width: 100%; width: 100%; }
      .menciones-grid { grid-template-columns: 1fr; }
      .tab-btn { padding: 0.55em 1em; font-size: 0.82rem; }
      .menciones-header { flex-direction: column; }
    }
  `]
})
export class PosicionesComponent implements OnInit {

  torneoService       = inject(TorneoService);
  private posicionService = inject(PosicionService);
  private mencionService  = inject(MencionService);

  tabActiva       = signal<TabActiva>('posiciones');
  cargando        = signal(true);
  cargandoMenciones = signal(false);
  posiciones      = signal<Posicion[]>([]);
  mencionesData   = signal<MencionesResponse | null>(null);
  paginaActual    = signal(1);
  readonly POR_PAGINA = 10;

  podio = computed(() => {
    const all = this.posiciones();
    if (all.length === 0) return [];
    const puntosUnicos = [...new Set(all.map(p => p.puntos))]
      .filter(pts => pts > 0).sort((a, b) => b - a);
    return puntosUnicos.slice(0, 3).map((pts, index) => ({
      posicion: index + 1,
      puntos: pts,
      integrantes: all.filter(p => p.puntos === pts)
    }));
  });

  private termino = '';
  private _posicionesOriginales: Posicion[] = [];
  private _posicionesProcesadas: Posicion[] = [];
  private posicionesFiltradas = signal<Posicion[]>([]);

  totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.posicionesFiltradas().length / this.POR_PAGINA)));
  paginas = computed(() =>
    Array.from({ length: this.totalPaginas() }, (_, i) => i + 1));
  posicionesPaginadas = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.POR_PAGINA;
    return this.posicionesFiltradas().slice(inicio, inicio + this.POR_PAGINA);
  });

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

  setTabMenciones(): void {
    this.tabActiva.set('menciones');
    if (!this.mencionesData()) {
      this.cargandoMenciones.set(true);
      this.mencionService.getMenciones().subscribe({
        next: data => { this.mencionesData.set(data); this.cargandoMenciones.set(false); },
        error: () => this.cargandoMenciones.set(false)
      });
    }
  }

  private procesarRanking(): void {
    const sorted = [...this._posicionesOriginales].sort((a, b) => b.puntos - a.puntos);
    let currentRank = 0, lastPoints = -1;
    this._posicionesProcesadas = sorted.map(p => {
      if (p.puntos !== lastPoints) { currentRank++; lastPoints = p.puntos; }
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
    this.posicionesFiltradas.set(!this.termino
      ? this._posicionesProcesadas
      : this._posicionesProcesadas.filter(p =>
          p.nombre.toLowerCase().includes(this.termino) ||
          p.apellido.toLowerCase().includes(this.termino)));
  }

  paginaAnterior(): void { if (this.paginaActual() > 1) this.irAPagina(this.paginaActual() - 1); }
  paginaSiguiente(): void { if (this.paginaActual() < this.totalPaginas()) this.irAPagina(this.paginaActual() + 1); }
  irAPagina(p: number): void { this.paginaActual.set(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  getClaseRow(posicion: number): string {
    if (posicion === 1) return 'row-gold';
    if (posicion === 2) return 'row-silver';
    if (posicion === 3) return 'row-bronze';
    return '';
  }
}