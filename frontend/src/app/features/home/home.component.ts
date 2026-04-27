// src/app/features/home/home.component.ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="main home">

      <!-- Hero -->
      <section class="hero">
        <div class="hero-badge">
          <span>⚽</span> Copa del Mundo
        </div>
        <h1 class="hero-title">Prode <span class="highlight">Mundial 2026</span></h1>
        <p class="hero-subtitle">
          Canadá · Estados Unidos · México<br>
          <strong>11 de junio – 19 de julio de 2026</strong>
        </p>
        <a routerLink="/planilla" class="btn btn-primary hero-cta">
          <i class="fas fa-pencil"></i> Cargar mi planilla
        </a>
      </section>

      <!-- Cards de navegación -->
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

        <a routerLink="/participantes" class="nav-card">
          <i class="fas fa-user-group nav-card__icon"></i>
          <h3>Participantes</h3>
          <p>Listado de todos los participantes confirmados</p>
        </a>

      </section>

    </main>
  `,
  styles: [`
    .home {
      display: block;
      padding: 0;
    }

    .hero {
      text-align: center;
      padding: 4em 1em 4.5em;
      background: linear-gradient(135deg, var(--wc-usa) 0%, #1a237e 100%);
      color: white;
      position: relative;
      overflow: hidden;
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
      color: var(--wc-mexico);
      text-shadow: 0 0 20px rgba(60, 172, 59, 0.4);
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
      box-shadow: 0 6px 20px rgba(60, 172, 59, 0.4);
      border: none;
    }

    .hero-cta:hover {
      transform: translateY(-4px) scale(1.05);
      box-shadow: 0 12px 30px rgba(60, 172, 59, 0.5);
      background: #44c043;
    }

    .nav-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5em;
      padding: 3em 2em;
      max-width: 1100px;
      margin: 0 auto;
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

    .nav-card--accent {
      background: linear-gradient(135deg, var(--clr-primary) 0%, var(--clr-primary-dark) 100%);
      color: white;
      border-color: transparent;
    }

    .nav-card--accent:hover {
      border-color: transparent;
    }

    .nav-card__icon {
      font-size: 2rem;
      color: var(--clr-primary);
      margin-bottom: 0.25em;
    }

    .nav-card--accent .nav-card__icon {
      color: white;
    }

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

    .nav-card--accent p {
      opacity: 0.85;
    }

    @media (max-width: 700px) {
      .nav-cards { grid-template-columns: repeat(2, 1fr); padding: 1.5em 1em; }
      .hero { padding: 2em 1em 2.5em; }
    }

    @media (max-width: 450px) {
      .nav-cards { grid-template-columns: 1fr; }
    }
  `]
})
export class HomeComponent {}
