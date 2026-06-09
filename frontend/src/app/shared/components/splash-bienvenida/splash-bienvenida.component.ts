// src/app/shared/components/splash-bienvenida/splash-bienvenida.component.ts
//
// Splash screen que se muestra UNA SOLA VEZ (localStorage) al entrar a /home
// después del cierre de inscripciones. Se cierra automáticamente a los 4s
// o al hacer click en el botón / en el overlay.
//
// Uso en HomeComponent:
//   <app-splash-bienvenida />   (solo renderizar, el componente se gestiona solo)
//
// Para cambiar la imagen estática por un GIF, reemplazar la URL en IMAGE_SRC.

import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  inject,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const STORAGE_KEY = 'prode2026_splash_visto';
const IMAGE_SRC   = 'assets/images/splash-lyle-lanley.jpg';

@Component({
  selector: 'app-splash-bienvenida',
  standalone: true,
  template: `
    @if (visible()) {
      <!-- Overlay oscuro — click cierra -->
      <div
        class="splash-overlay"
        [class.splash-saliendo]="saliendo()"
        (click)="cerrar()"
        role="dialog"
        aria-modal="true"
        aria-label="Bienvenida al torneo"
      >
        <!-- Card — click NO propaga al overlay -->
        <div class="splash-card" (click)="$event.stopPropagation()">

          <!-- Barra de progreso auto-close -->
          <div class="splash-progress">
            <div
              class="splash-progress-bar"
              [class.corriendo]="!saliendo()"
            ></div>
          </div>

          <!-- Imagen -->
          <div class="splash-img-wrap">
            <img
              [src]="imageSrc"
              alt="Burns escapando con las valijas de plata"
              class="splash-img"
              draggable="false"
            />
          </div>

          <!-- Texto -->
          <div class="splash-body">
            <p class="splash-titulo">⚽ ¡Arrancó el Mundial!</p>
            <p class="splash-texto">
              Las inscripciones cerraron, las planillas están publicadas y el show
              ya empezó. Que la pelota ruede a tu favor…
              <strong>o no, igual ya apostaste.</strong> 🍀
            </p>
            <p class="splash-sub">
              — El Prode más serio del barrio
            </p>
          </div>

          <!-- Botón cerrar -->
          <button
            class="splash-btn-cerrar"
            (click)="cerrar()"
            type="button"
            aria-label="Cerrar"
          >
            Entendido, vamos 🔥
          </button>

          <!-- X esquina -->
          <button
            class="splash-x"
            (click)="cerrar()"
            type="button"
            aria-label="Cerrar splash"
          >&times;</button>

        </div>
      </div>
    }
  `,
  styles: [`
    /* ── Overlay ─────────────────────────────────────────────────────────── */
    .splash-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.72);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9000;
      padding: 1em;
      animation: splashFadeIn 0.4s ease both;
      backdrop-filter: blur(3px);
    }

    .splash-overlay.splash-saliendo {
      animation: splashFadeOut 0.35s ease forwards;
    }

    @keyframes splashFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    @keyframes splashFadeOut {
      from { opacity: 1; }
      to   { opacity: 0; }
    }

    /* ── Card ────────────────────────────────────────────────────────────── */
    .splash-card {
      position: relative;
      background: #1a1a2e;
      border-radius: 20px;
      width: 100%;
      max-width: 480px;
      overflow: hidden;
      box-shadow:
        0 25px 60px rgba(0, 0, 0, 0.6),
        0 0 0 1px rgba(255, 255, 255, 0.08);
      animation: splashSlideUp 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
    }

    .splash-overlay.splash-saliendo .splash-card {
      animation: splashSlideDown 0.3s ease forwards;
    }

    @keyframes splashSlideUp {
      from { transform: translateY(40px) scale(0.95); opacity: 0; }
      to   { transform: translateY(0)    scale(1);    opacity: 1; }
    }

    @keyframes splashSlideDown {
      from { transform: translateY(0)    scale(1);    opacity: 1; }
      to   { transform: translateY(30px) scale(0.96); opacity: 0; }
    }

    /* ── Barra de progreso ───────────────────────────────────────────────── */
    .splash-progress {
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      width: 100%;
    }

    .splash-progress-bar {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #3CAC3B, #FFD700);
      border-radius: 0 2px 2px 0;
    }

    /* Anima de 0% → 100% en exactamente 4s cuando tiene la clase .corriendo */
    .splash-progress-bar.corriendo {
      animation: progressRun 4s linear forwards;
    }

    @keyframes progressRun {
      from { width: 0%; }
      to   { width: 100%; }
    }

    /* ── Imagen ──────────────────────────────────────────────────────────── */
    .splash-img-wrap {
      width: 100%;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      background: #111;
    }

    .splash-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
      /* Pequeño zoom-in para dar sensación de movimiento con imagen estática */
      animation: splashZoom 4.5s ease forwards;
    }

    @keyframes splashZoom {
      from { transform: scale(1);    }
      to   { transform: scale(1.06); }
    }

    /* ── Texto ───────────────────────────────────────────────────────────── */
    .splash-body {
      padding: 1.25em 1.5em 0.75em;
    }

    .splash-titulo {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: #FFD700;
      letter-spacing: 0.5px;
      margin-bottom: 0.5em;
    }

    .splash-texto {
      font-size: 0.92rem;
      line-height: 1.65;
      color: rgba(255, 255, 255, 0.85);
      margin-bottom: 0.5em;
    }

    .splash-texto strong {
      color: white;
    }

    .splash-sub {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.35);
      font-style: italic;
      margin-bottom: 0;
    }

    /* ── Botón principal ─────────────────────────────────────────────────── */
    .splash-btn-cerrar {
      display: block;
      width: calc(100% - 3em);
      margin: 1em 1.5em 1.5em;
      padding: 0.75em 1em;
      background: linear-gradient(135deg, #3CAC3B, #2e8a2d);
      color: white;
      border: none;
      border-radius: 12px;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      letter-spacing: 0.2px;
      box-shadow: 0 4px 14px rgba(60, 172, 59, 0.4);
    }

    .splash-btn-cerrar:hover {
      background: linear-gradient(135deg, #44c043, #3CAC3B);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(60, 172, 59, 0.5);
    }

    .splash-btn-cerrar:active {
      transform: translateY(0);
    }

    /* ── X esquina ───────────────────────────────────────────────────────── */
    .splash-x {
      position: absolute;
      top: 12px;
      right: 14px;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      line-height: 1;
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      transition: all 0.18s;
      z-index: 2;
    }

    .splash-x:hover {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      transform: scale(1.1);
    }

    /* ── Responsive ──────────────────────────────────────────────────────── */
    @media (max-width: 520px) {
      .splash-card { border-radius: 16px; }
      .splash-titulo { font-size: 1.3rem; }
      .splash-texto { font-size: 0.85rem; }
      .splash-btn-cerrar {
        width: calc(100% - 2em);
        margin: 0.75em 1em 1.25em;
      }
      .splash-body { padding: 1em 1em 0.5em; }
    }
  `]
})
export class SplashBienvenidaComponent implements OnInit, OnDestroy {

  private platformId = inject(PLATFORM_ID);

  protected readonly imageSrc = IMAGE_SRC;
  readonly visible  = signal(false);
  readonly saliendo = signal(false);

  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Mostrar solo si nunca se mostró antes en este navegador
    const yaVisto = localStorage.getItem(STORAGE_KEY);
    if (yaVisto) return;

    // Pequeño delay para que el home ya esté pintado cuando aparece
    const t1 = setTimeout(() => {
      this.visible.set(true);

      // Auto-close a los 4 segundos
      const t2 = setTimeout(() => this.cerrar(), 4000);
      this.timers.push(t2);
    }, 600);

    this.timers.push(t1);
  }

  ngOnDestroy(): void {
    this.timers.forEach(t => clearTimeout(t));
  }

  cerrar(): void {
    if (this.saliendo()) return;   // evitar doble llamada
    this.saliendo.set(true);

    // Marcar como visto ANTES de que termine la animación de salida
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, '1');
    }

    // Esperar que termine la animación de salida (350ms) y luego desmontar
    const t = setTimeout(() => this.visible.set(false), 350);
    this.timers.push(t);
  }
}
