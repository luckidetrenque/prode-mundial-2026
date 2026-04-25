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
      padding: 3em 1em 3.5em;
      background: linear-gradient(135deg, var(--clr-primary-dark) 0%, var(--clr-primary) 60%, var(--clr-primary-light) 100%);
      color: white;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4em;
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 20px;
      padding: 0.3em 1em;
      font-size: 0.85rem;
      margin-bottom: 1em;
      backdrop-filter: blur(4px);
    }

    .hero-title {
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: 800;
      margin: 0.2em 0 0.5em;
      letter-spacing: -1px;
    }

    .highlight {
      color: #fec310;
    }

    .hero-subtitle {
      font-size: 1rem;
      opacity: 0.9;
      margin-bottom: 2em;
      line-height: 1.7;
    }

    .hero-cta {
      font-size: 1.05rem;
      padding: 0.75em 2em;
      border-radius: 30px;
      background: white;
      color: var(--clr-primary-dark);
      font-weight: bold;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5em;
      transition: all 0.2s;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }

    .hero-cta:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.25);
    }

    .nav-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25em;
      padding: 2.5em 2em;
      max-width: 960px;
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
