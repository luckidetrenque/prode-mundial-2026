// src/app/features/home/home.component.ts
//
// CAMBIOS vs versión anterior:
//   - Inyecta TorneoService para leer tiempoExpirado()
//   - Antes del cierre: muestra CTA "Cargar mi planilla" + cards de navegación
//     estándar (igual que antes, incluyendo la card accentuada de Planilla)
//   - Después del cierre: reemplaza el CTA por un bloque de "Torneo en curso"
//     y sustituye las cards de Planilla/Reglamento por Resultados y Posiciones,
//     destacando las secciones relevantes del torneo activo.

import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TorneoService } from '../../core/services/torneo.service';
import { SplashBienvenidaComponent } from '../../shared/components/splash-bienvenida/splash-bienvenida.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, SplashBienvenidaComponent],
  template: `
    <main class="main home">

      <!-- Splash post-cierre: se muestra una sola vez por dispositivo (localStorage) -->
      @if (torneoService.tiempoExpirado()) {
        <app-splash-bienvenida />
      }

      <!-- ══ HERO ══════════════════════════════════════════════════════════ -->
      <section class="hero">
        <div class="hero-badge">
          <span>⚽</span> Copa del Mundo
        </div>
        <h1 class="hero-title">Prode <span class="highlight">Mundial 2026</span></h1>
        <p class="hero-subtitle">
          Canadá · Estados Unidos · México<br>
          <strong>11 de junio – 19 de julio de 2026</strong>
        </p>

        <!-- CTA: antes del cierre -->
        @if (!torneoService.tiempoExpirado()) {
          <a routerLink="/planilla" class="btn btn-primary hero-cta">
            <i class="fas fa-pencil"></i> Cargar mi planilla
          </a>
          <p class="hero-cta-sub">
            <i class="fas fa-clock"></i>
            Inscripciones abiertas · Cierre el 10/06 a las 14:00 hs
          </p>
        }

        <!-- CTA: después del cierre -->
        @if (torneoService.tiempoExpirado()) {
          <div class="hero-torneo-activo">
            <div class="torneo-activo-badge">
              <span class="torneo-activo-dot"></span>
              Torneo en curso
            </div>
            <p class="torneo-activo-desc">
              Las inscripciones cerraron. Seguí el torneo en vivo.
            </p>
            <div class="hero-ctas-post">
              <a routerLink="/posiciones" class="btn btn-primary hero-cta">
                <i class="fas fa-trophy"></i> Ver posiciones
              </a>
              <a routerLink="/resultados" class="btn btn-hero-secondary">
                <i class="fas fa-futbol"></i> Resultados
              </a>
            </div>
          </div>
        }
      </section>

      <!-- ══ CARDS PRE-CIERRE ═══════════════════════════════════════════════ -->
      @if (!torneoService.tiempoExpirado()) {
        <section class="nav-cards">

          <a routerLink="/fixture" class="nav-card">
            <i class="fas fa-calendar-days nav-card__icon"></i>
            <h3>Fixture</h3>
            <p>Todos los partidos del torneo con fechas y sedes</p>
          </a>

          <a routerLink="/planilla" class="nav-card nav-card--accent">
            <i class="fas fa-list-check nav-card__icon"></i>
            <h3>Cargar Planilla</h3>
            <p>Ingresá tus predicciones para la fase de grupos</p>
          </a>

          <a routerLink="/participantes" class="nav-card">
            <i class="fas fa-user-group nav-card__icon"></i>
            <h3>Participantes</h3>
            <p>Listado de todos los participantes confirmados</p>
          </a>

          <a routerLink="/resultados" class="nav-card">
            <i class="fas fa-futbol nav-card__icon"></i>
            <h3>Resultados</h3>
            <p>Resultados oficiales de los partidos jugados</p>
          </a>

          <a routerLink="/posiciones" class="nav-card">
            <i class="fas fa-trophy nav-card__icon"></i>
            <h3>Posiciones</h3>
            <p>Tabla de posiciones de los participantes</p>
          </a>

          <a routerLink="/estadisticas" class="nav-card">
            <i class="fas fa-chart-simple nav-card__icon"></i>
            <h3>Estadísticas</h3>
            <p>Distribución de votos por partido</p>
          </a>

        </section>
      }

      <!-- ══ CARDS POST-CIERRE ══════════════════════════════════════════════ -->
      @if (torneoService.tiempoExpirado()) {
        <section class="nav-cards nav-cards--post">

          <a routerLink="/fixture" class="nav-card">
            <i class="fas fa-calendar-days nav-card__icon"></i>
            <h3>Fixture</h3>
            <p>Calendario completo de partidos con fechas y sedes</p>
          </a>

          <a routerLink="/participantes" class="nav-card">
            <i class="fas fa-user-group nav-card__icon"></i>
            <h3>Participantes</h3>
            <p>Todos los participantes con sus planillas publicadas</p>
          </a>

          <a routerLink="/resultados" class="nav-card nav-card--accent">
            <i class="fas fa-futbol nav-card__icon"></i>
            <h3>Resultados</h3>
            <p>Resultados oficiales de los partidos jugados</p>
          </a>

          <a routerLink="/posiciones" class="nav-card nav-card--gold">
            <i class="fas fa-trophy nav-card__icon"></i>
            <h3>Posiciones</h3>
            <p>Tabla de posiciones actualizada en tiempo real</p>
          </a>

          <a routerLink="/estadisticas" class="nav-card">
            <i class="fas fa-chart-simple nav-card__icon"></i>
            <h3>Estadísticas</h3>
            <p>Análisis de predicciones y pronósticos</p>
          </a>

        </section>
      }

    </main>
  `,
  styles: [`
    .home {
      display: block;
      padding: 0;
    }

    /* ── Hero ──────────────────────────────────────────────────────────── */
    .hero {
      text-align: center;
      padding: 4em 1em 4.5em;
      background: linear-gradient(270deg, var(--wc-usa), #1a237e, #0e5630, #b0151a);
      background-size: 800% 800%;
      animation: gradientBg 20s ease infinite;
      color: white;
      position: relative;
      overflow: hidden;
    }

    @keyframes gradientBg {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .hero::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: url('https://www.transparenttextures.com/patterns/cubes.png');
      opacity: 0.1;
      pointer-events: none;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4em;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 20px;
      padding: 0.4em 1.2em;
      font-size: 0.85rem;
      margin-bottom: 1.5em;
      backdrop-filter: blur(8px);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }

    .hero-title {
      font-family: var(--font-display);
      font-size: clamp(2.5rem, 6vw, 4.5rem);
      font-weight: 800;
      margin: 0.2em 0 0.4em;
      letter-spacing: -1px;
      line-height: 1.1;
    }

    .highlight {
      color: #ffffff;
      text-shadow:
        0 0 15px rgba(255,255,255,0.6),
        0 0 30px rgba(60,172,59,0.8);
    }

    .hero-subtitle {
      font-size: 1.1rem;
      opacity: 0.9;
      margin-bottom: 2.5em;
      line-height: 1.6;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    /* CTA principal (pre-cierre) */
    .hero-cta {
      font-size: 1.1rem;
      padding: 0.9em 2.5em;
      border-radius: 40px;
      background: var(--wc-mexico);
      color: white;
      font-weight: 700;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.6em;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      box-shadow: 0 6px 20px rgba(60,172,59,0.4);
      border: none;
    }

    .hero-cta:hover {
      transform: translateY(-4px) scale(1.05);
      box-shadow: 0 12px 30px rgba(60,172,59,0.5);
      background: #44c043;
    }

    .hero-cta-sub {
      margin-top: 1em;
      font-size: 0.78rem;
      opacity: 0.65;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4em;
    }

    /* ── Bloque "Torneo en curso" (post-cierre) ──────────────────────── */
    .hero-torneo-activo {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75em;
      animation: fadeInUp 0.6s ease both;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .torneo-activo-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5em;
      background: rgba(60,172,59,0.2);
      border: 1.5px solid rgba(60,172,59,0.5);
      border-radius: 20px;
      padding: 0.4em 1.1em;
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #a8ffab;
    }

    .torneo-activo-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4cff50;
      box-shadow: 0 0 0 0 rgba(76,255,80,0.6);
      animation: livePulse 1.5s infinite;
      flex-shrink: 0;
    }

    @keyframes livePulse {
      0%  { box-shadow: 0 0 0 0 rgba(76,255,80,0.6); }
      70% { box-shadow: 0 0 0 8px rgba(76,255,80,0); }
      100%{ box-shadow: 0 0 0 0 rgba(76,255,80,0); }
    }

    .torneo-activo-desc {
      font-size: 0.95rem;
      opacity: 0.8;
      margin: 0;
    }

    .hero-ctas-post {
      display: flex;
      align-items: center;
      gap: 0.75em;
      flex-wrap: wrap;
      justify-content: center;
      margin-top: 0.5em;
    }

    /* Botón secundario del hero (post-cierre) */
    .btn-hero-secondary {
      font-size: 1.1rem;
      padding: 0.9em 2.5em;
      border-radius: 40px;
      background: rgba(255,255,255,0.12);
      color: white;
      font-weight: 700;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.6em;
      border: 2px solid rgba(255,255,255,0.35);
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      backdrop-filter: blur(8px);
    }

    .btn-hero-secondary:hover {
      background: rgba(255,255,255,0.2);
      border-color: rgba(255,255,255,0.6);
      transform: translateY(-4px) scale(1.03);
      color: white;
    }

    /* ── Nav Cards ─────────────────────────────────────────────────────── */
    .nav-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5em;
      padding: 3em 2em;
      max-width: 1100px;
      margin: 0 auto;
    }

    /* Post-cierre: 5 cards → 3+2 centrado */
    .nav-cards--post {
      grid-template-columns: repeat(3, 1fr);
    }

    /* Últimas dos cards de la grilla post se centran */
    .nav-cards--post .nav-card:nth-child(4),
    .nav-cards--post .nav-card:nth-child(5) {
      grid-column: auto;
    }

    /* Centra la última fila incompleta (2 cards en fila de 3) */
    .nav-cards--post::after {
      content: '';
      display: block;
    }

    .nav-card {
      background: white;
      border: 1px solid #e8e8e8;
      border-radius: 14px;
      padding: 1.75em 1.5em;
      text-decoration: none;
      color: inherit;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.5em;
      transition: all 0.25s;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }

    .nav-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.1);
      border-color: var(--clr-primary-light);
    }

    /* Verde (planilla en pre-cierre / resultados en post-cierre) */
    .nav-card--accent {
      background: linear-gradient(135deg, var(--clr-primary) 0%, var(--clr-primary-dark) 100%);
      color: white;
      border-color: transparent;
    }

    .nav-card--accent:hover {
      border-color: transparent;
      transform: translateY(-5px);
      box-shadow: 0 12px 30px rgba(46,158,45,0.3);
    }

    /* Dorado (posiciones en post-cierre) */
    .nav-card--gold {
      background: linear-gradient(135deg, #e6a800 0%, #c47f00 100%);
      color: white;
      border-color: transparent;
    }

    .nav-card--gold:hover {
      border-color: transparent;
      transform: translateY(-5px);
      box-shadow: 0 12px 30px rgba(230,168,0,0.35);
    }

    .nav-card__icon {
      font-size: 2rem;
      color: var(--clr-primary);
      margin-bottom: 0.25em;
    }

    .nav-card--accent .nav-card__icon,
    .nav-card--gold   .nav-card__icon { color: white; }

    .nav-card h3 {
      font-size: 1rem;
      font-weight: 700;
      margin: 0;
    }

    .nav-card p {
      font-size: 0.8rem;
      opacity: 0.7;
      margin: 0;
      line-height: 1.4;
    }

    .nav-card--accent p,
    .nav-card--gold   p { opacity: 0.85; }

    /* ── Responsive ────────────────────────────────────────────────────── */
    @media (max-width: 700px) {
      .nav-cards,
      .nav-cards--post {
        grid-template-columns: repeat(2, 1fr);
        padding: 1.5em 1em;
      }
      .hero { padding: 2em 1em 2.5em; }
      .hero-ctas-post { gap: 0.5em; }
      .hero-cta,
      .btn-hero-secondary { font-size: 0.95rem; padding: 0.75em 1.75em; }
    }

    @media (max-width: 450px) {
      .nav-cards,
      .nav-cards--post { grid-template-columns: 1fr; }
    }
  `]
})
export class HomeComponent {
  protected readonly torneoService = inject(TorneoService);
}
