import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface ArticuloReglamento {
  numero: number;
  titulo: string;
  icono: string;
  contenido: string;
  destacado?: string;
}

@Component({
  selector: 'app-reglamento',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="main reglamento-main">

      <!-- Hero del reglamento -->
      <div class="reglamento-hero">
        <div class="hero-badge">
          <i class="fas fa-circle-info" aria-hidden="true"></i>
          Guía de Participación
        </div>
        <h2 class="hero-titulo">
          <i class="fas fa-clipboard-list" aria-hidden="true"></i>
          ¿Cómo Participar?
        </h2>
        <p class="hero-subtitulo">
          Seguí estos pasos para sumarte al Prode Mundial 2026<br>
          <strong>Canadá · Estados Unidos · México</strong>
        </p>
        <div class="hero-fechas">
          <div class="fecha-item">
            <i class="fas fa-calendar-plus" aria-hidden="true"></i>
            <div>
              <span class="fecha-label">Inicio del torneo</span>
              <span class="fecha-valor">11 de junio de 2026</span>
            </div>
          </div>
          <div class="fecha-sep" aria-hidden="true"></div>
          <div class="fecha-item">
            <i class="fas fa-calendar-check" aria-hidden="true"></i>
            <div>
              <span class="fecha-label">Fin de grupos</span>
              <span class="fecha-valor">2 de julio de 2026</span>
            </div>
          </div>
          <div class="fecha-sep" aria-hidden="true"></div>
          <div class="fecha-item">
            <i class="fas fa-futbol" aria-hidden="true"></i>
            <div>
              <span class="fecha-label">Final del mundial</span>
              <span class="fecha-valor">19 de julio de 2026</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Índice rápido -->
      <nav class="indice-rapido" aria-label="Índice de la guía">
        <p class="indice-titulo"><i class="fas fa-shoe-prints" aria-hidden="true"></i> Pasos a seguir</p>
        <div class="indice-links">
          @for (art of articulos; track art.numero) {
            <button type="button" (click)="scrollTo('art-' + art.numero)" class="indice-link" [attr.aria-label]="'Ir al paso ' + art.numero">
              <span class="indice-num">{{ art.numero }}</span>
              <span class="indice-text">{{ art.titulo }}</span>
            </button>
          }
        </div>
      </nav>

      <!-- Artículos -->
      <div class="articulos-lista" role="main">
        @for (art of articulos; track art.numero) {
          <article
            class="articulo-card"
            [id]="'art-' + art.numero"
            [attr.aria-labelledby]="'titulo-art-' + art.numero"
          >
            <div class="articulo-header">
              <div class="articulo-icono" aria-hidden="true">
                <i [class]="'fas ' + art.icono"></i>
              </div>
              <div class="articulo-meta">
                <span class="articulo-num">Paso {{ art.numero }}</span>
                <h3 class="articulo-titulo" [id]="'titulo-art-' + art.numero">{{ art.titulo }}</h3>
              </div>
            </div>

            <div class="articulo-body">
              <div [innerHTML]="art.contenido"></div>
              @if (art.destacado) {
                <div class="articulo-destacado" role="note">
                  <i class="fas fa-circle-info" aria-hidden="true"></i>
                  <span [innerHTML]="art.destacado"></span>
                </div>
              }
            </div>
          </article>
        }
      </div>

      <!-- Footer CTA -->
      <div class="reglamento-cta">
        <div class="cta-inner">
          <i class="fas fa-list-check cta-icono" aria-hidden="true"></i>
          <div class="cta-texto">
            <strong>¿Listo para participar?</strong>
            <span>Cargá tu planilla antes del cierre de inscripciones.</span>
          </div>
          <a routerLink="/planilla" class="btn btn-primary cta-btn">
            <i class="fas fa-pencil" aria-hidden="true"></i>
            Cargar mi planilla
          </a>
        </div>
      </div>

    </main>
  `,
  styles: [`
    /* ── Reset específico del main ───────────────────────────────────────── */
    .reglamento-main {
      padding-top: 0;
    }

    /* ── Hero ────────────────────────────────────────────────────────────── */
    .reglamento-hero {
      background: linear-gradient(135deg, var(--clr-primary-dark) 0%, #1a237e 60%, #0d1440 100%);
      color: white;
      padding: 3em 2em 2.5em;
      margin: 0 -2em 2.5em;
      position: relative;
      overflow: hidden;
      text-align: center;
    }

    .reglamento-hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse at 20% 50%, rgba(60,172,59,0.15) 0%, transparent 60%),
        radial-gradient(ellipse at 80% 50%, rgba(230,29,37,0.12) 0%, transparent 60%);
      pointer-events: none;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5em;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 20px;
      padding: 0.4em 1.2em;
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 1.25em;
      backdrop-filter: blur(8px);
    }

    .hero-titulo {
      font-family: var(--font-display);
      font-size: clamp(1.8rem, 4vw, 2.8rem);
      font-weight: 700;
      letter-spacing: 0.5px;
      color: white;
      margin-bottom: 0.4em;
      /* override del h2 global */
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5em;
    }

    .hero-titulo i { color: rgba(255,255,255,0.6); font-size: 1.3rem; }

    .hero-subtitulo {
      font-size: 1rem;
      color: rgba(255,255,255,0.8);
      line-height: 1.6;
      margin-bottom: 2em;
    }

    .hero-subtitulo strong { color: white; }

    /* Fechas clave */
    .hero-fechas {
      display: inline-flex;
      align-items: center;
      gap: 0;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: var(--radius-lg);
      padding: 0.85em 1.5em;
      backdrop-filter: blur(8px);
    }

    .fecha-item {
      display: flex;
      align-items: center;
      gap: 0.75em;
      padding: 0 1.25em;
    }

    .fecha-item i {
      font-size: 1.2rem;
      color: var(--clr-accent);
      flex-shrink: 0;
    }

    .fecha-item div {
      display: flex;
      flex-direction: column;
      text-align: left;
    }

    .fecha-label {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: rgba(255,255,255,0.55);
      font-weight: 600;
    }

    .fecha-valor {
      font-size: 0.82rem;
      font-weight: 700;
      color: white;
      white-space: nowrap;
    }

    .fecha-sep {
      width: 1px;
      height: 36px;
      background: rgba(255,255,255,0.15);
      flex-shrink: 0;
    }

    /* ── Índice rápido ───────────────────────────────────────────────────── */
    .indice-rapido {
      background: var(--clr-surface-alt);
      border: 1px solid var(--clr-border-strong);
      border-radius: var(--radius-lg);
      padding: 1.25em 1.5em;
      margin-bottom: 2em;
    }

    .indice-titulo {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--clr-text-muted);
      margin-bottom: 0.85em;
      display: flex;
      align-items: center;
      gap: 0.4em;
    }

    .indice-links {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4em;
    }

    .indice-link {
      display: inline-flex;
      align-items: center;
      gap: 0.4em;
      padding: 0.3em 0.75em;
      border: 1.5px solid var(--clr-border-strong);
      border-radius: 20px;
      background: var(--clr-surface);
      color: var(--clr-text);
      font-size: 0.78rem;
      font-weight: 500;
      text-decoration: none;
      transition: var(--transition);
    }

    .indice-link:hover,
    .indice-link:focus-visible {
      border-color: var(--clr-primary);
      color: var(--clr-primary);
      background: rgba(46,158,45,0.05);
      outline: none;
    }

    .indice-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      background: var(--clr-primary-dark);
      color: white;
      border-radius: 50%;
      font-size: 0.65rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .indice-text {
      max-width: 120px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ── Lista de artículos ──────────────────────────────────────────────── */
    .articulos-lista {
      display: flex;
      flex-direction: column;
      gap: 1em;
      margin-bottom: 3em;
    }

    /* ── Card de artículo ────────────────────────────────────────────────── */
    .articulo-card {
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      transition: var(--transition);
      scroll-margin-top: calc(var(--navbar-height, 60px) + 1.5em);
    }

    .articulo-card:hover {
      border-color: var(--clr-border-strong);
      box-shadow: var(--shadow-md);
    }

    /* Header del artículo */
    .articulo-header {
      display: flex;
      align-items: center;
      gap: 1em;
      padding: 1em 1.25em;
      background: var(--clr-surface-alt);
      border-bottom: 1px solid var(--clr-border);
    }

    .articulo-icono {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border-radius: var(--radius-md);
      background: var(--clr-primary-dark);
      color: white;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .articulo-meta {
      display: flex;
      flex-direction: column;
      gap: 0.1em;
    }

    .articulo-num {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: var(--clr-text-muted);
    }

    .articulo-titulo {
      font-family: var(--font-display);
      font-size: 1.05rem;
      font-weight: 700;
      letter-spacing: 0.3px;
      color: var(--clr-primary-dark);
      margin: 0;
    }

    /* Cuerpo del artículo */
    .articulo-body {
      padding: 1.25em 1.5em;
    }

    .articulo-body ::ng-deep p {
      font-size: 0.9rem;
      line-height: 1.75;
      color: var(--clr-text);
      margin-bottom: 0.5em;
    }

    .articulo-body ::ng-deep strong {
      color: var(--clr-primary-dark);
      font-weight: 700;
    }

    .articulo-body ::ng-deep a {
      color: var(--clr-primary);
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    /* Bloque destacado */
    .articulo-destacado {
      display: flex;
      align-items: flex-start;
      gap: 0.75em;
      margin-top: 1em;
      padding: 0.85em 1em;
      background: #e8f0fd;
      border-left: 3px solid var(--clr-primary-dark);
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      font-size: 0.85rem;
      color: var(--clr-primary-dark);
      line-height: 1.6;
    }

    .articulo-destacado i {
      color: var(--clr-primary-dark);
      font-size: 0.9rem;
      flex-shrink: 0;
      margin-top: 0.1em;
    }

    .articulo-destacado ::ng-deep strong {
      font-weight: 700;
    }

    /* ── CTA final ───────────────────────────────────────────────────────── */
    .reglamento-cta {
      background: linear-gradient(135deg, var(--clr-primary-dark) 0%, #1a237e 100%);
      border-radius: var(--radius-lg);
      padding: 1.5em 2em;
      margin-top: 1em;
    }

    .cta-inner {
      display: flex;
      align-items: center;
      gap: 1.25em;
    }

    .cta-icono {
      font-size: 2rem;
      color: var(--clr-accent);
      flex-shrink: 0;
    }

    .cta-texto {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.15em;
    }

    .cta-texto strong {
      font-size: 1rem;
      color: white;
      font-family: var(--font-display);
      letter-spacing: 0.3px;
    }

    .cta-texto span {
      font-size: 0.82rem;
      color: rgba(255,255,255,0.7);
    }

    .cta-btn {
      flex-shrink: 0;
      padding: 0.7em 1.5em;
      border-radius: 20px;
    }

.btn-auto {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  padding: 0.2em 0.6em;
  border: 1.5px solid var(--clr-border-strong);
  border-radius: 20px;
  background: var(--clr-surface);
  color: var(--clr-text);
  font-size: 0.72rem;
  font-weight: 500;
  text-decoration: none;
  transition: var(--transition);
  cursor: default;
  user-select: none;
}

.btn-auto i {
  font-size: 0.8rem;
  color: var(--clr-primary);
  flex-shrink: 0;
}

.btn-auto span {
  font-family: var(--font-display);
  letter-spacing: 0.3px;
  font-weight: 600;
}


    /* ── Responsive ──────────────────────────────────────────────────────── */
    @media (max-width: 768px) {
      .reglamento-hero {
        margin: 0 -1em 2em;
        padding: 2em 1em 2em;
      }

      .hero-fechas {
        flex-direction: column;
        gap: 0.75em;
        padding: 1em;
        text-align: left;
        width: 100%;
      }

      .fecha-sep { width: 100%; height: 1px; }
      .fecha-item { padding: 0; }

      .indice-links { gap: 0.3em; }
      .indice-text { max-width: 90px; }

      .articulo-body { padding: 1em; }

      .cta-inner { flex-direction: column; text-align: center; gap: 1em; }
      .cta-btn { width: 100%; justify-content: center; }
    }

    @media (max-width: 480px) {
      .hero-titulo { font-size: 1.5rem; }
      .indice-text { display: none; }
      .indice-link { padding: 0.3em 0.5em; }
    }
  `],
})
export class ReglamentoComponent {

  scrollTo(id: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  readonly articulos: ArticuloReglamento[] = [
    {
      numero: 1,
      titulo: 'Completar Pronósticos',
      icono: 'fa-pencil',
      contenido: `
        <p>Ingresá a la sección <a href="/planilla">Planilla</a> para comenzar. Deberás cargar tus predicciones para los <strong>72 partidos</strong> de la fase de grupos del Mundial 2026.</p>
        <p>Por cada partido, podés elegir entre tres opciones:</p>
        <ul>
          <li><strong>Local (L)</strong>: Gana el primer equipo.</li>
          <li><strong>Empate (E)</strong>: El partido termina igualado.</li>
          <li><strong>Visitante (V)</strong>: Gana el segundo equipo.</li>
        </ul>
        <p>Si no te decidís, podés usar el botón <strong>"Me la juego"</strong> para completar resultados de forma aleatoria.</p>
      `
    },
    {
      numero: 2,
      titulo: 'Guardar y Obtener Código',
      icono: 'fa-floppy-disk',
      contenido: `
        <p>Una vez completados todos los campos y tus datos personales (Nombre, Apellido y Email), hacé clic en <strong>Guardar Planilla</strong>.</p>
        <p>El sistema generará automáticamente un <strong>código único de identificación</strong> (ej: #80358702). Guárdate este número, ya que es el comprobante indispensable para tu participación.</p>
        <p>Si necesitás corregir alguna predicción antes de la confirmación, podés usar el botón <strong>"Editar mi planilla"</strong> e ingresar tu código más el email registrado. Las ediciones solo están disponibles mientras la planilla no esté confirmada.</p>
      `,
      destacado: `Guardá bien tu código. Si perdés el número, <strong>no podrás recuperarlo</strong>. También lo recibirás por email cuando el administrador confirme tu planilla.`
    },
    {
      numero: 3,
      titulo: 'Confirmación',
      icono: 'fa-circle-check',
      contenido: `
        <p>Para que tu planilla entra oficialmente en juego y empieces a sumar puntos, debe ser <strong>confirmada por el administrador</strong>.</p>
        <p>Deberás presentar tu número único de identificación al administrador para finalizar el proceso de confirmación.</p>
      `,
      destacado: `El plazo máximo para confirmar planillas es el <strong>10/06/2026 a las 14:00 hs</strong>. Pasado ese horario, no se admitirán nuevas confirmaciones.`
    },
    {
      numero: 4,
      titulo: 'Sistema de Puntos',
      icono: 'fa-chart-line',
      contenido: `
        <p>A medida que se jueguen los partidos, sumarás puntos de la siguiente manera:</p>
        <ul>
          <li><strong>1 Punto</strong>: Por cada resultado acertado (Local, Empate o Visitante).</li>
          <li><strong>2 Puntos</strong>: En partidos especiales marcados con el multiplicador <strong>X2</strong>.</li>
        </ul>
      `,
      destacado: `No es necesario acertar el marcador exacto (goles), solo quién gana o si empatan.`
    },
    {
      numero: 5,
      titulo: 'Resultados y Ranking',
      icono: 'fa-ranking-star',
      contenido: `
        <p>Los resultados se actualizan automáticamente al finalizar cada encuentro según la información oficial de la FIFA.</p>
        <p>Podrás seguir tu posición en el ranking general en tiempo real desde la sección <a href="/posiciones">Posiciones</a>.</p>
      `
    },
    {
      numero: 6,
      titulo: 'Transparencia',
      icono: 'fa-eye',
      contenido: `
        <p>Para garantizar la transparencia del juego, una vez que inicie el torneo y se cierre la inscripción, todas las planillas confirmadas serán publicadas en este sitio, siendo <strong>públicas</strong>.</p>
        <p>En la sección <a href="/participantes">Participantes</a>, todos podrán ver y auditar los pronósticos de los demás jugadores.</p>
      `
    }
  ];
}