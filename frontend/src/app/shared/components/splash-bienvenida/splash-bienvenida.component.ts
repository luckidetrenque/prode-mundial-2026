// src/app/shared/components/splash-bienvenida/splash-bienvenida.component.ts
//
// Splash screen que se muestra UNA SOLA VEZ (localStorage) al entrar a /home
// después del cierre de inscripciones.
//
// SECUENCIA:
//   0.6s  → aparece pantalla "503 Service Unavailable" (fase = 'error')
//   4.5s  → transición a splash de bienvenida con Lyle Lanley (fase = 'splash')
//   8.5s  → auto-cierre
//   click en overlay → salta al splash si está en 'error', cierra si está en 'splash'
//   click en "Reintentar" → salta directo al splash
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

type Fase = 'error' | 'splash';

@Component({
  selector: 'app-splash-bienvenida',
  standalone: true,
  template: `
    @if (visible()) {
      <!-- Overlay oscuro -->
      <div
        class="splash-overlay"
        [class.splash-saliendo]="saliendo()"
        (click)="onOverlayClick()"
        role="dialog"
        aria-modal="true"
        aria-label="Bienvenida al torneo"
      >

        <!-- ══════════════════════════════════════════════
             FASE 1: 503 falso estilo nginx
             ══════════════════════════════════════════════ -->
        @if (fase() === 'error') {
          <div class="error-card" (click)="$event.stopPropagation()">

            <!-- Barra de progreso roja (4s) -->
            <div class="splash-progress">
              <div class="splash-progress-bar" [class.corriendo-error]="!saliendo()"></div>
            </div>

            <div class="error-body">
              <p class="error-code">503</p>
              <p class="error-title">Service Unavailable</p>
              <hr class="error-sep" />
              <p class="error-detail">
                The server is temporarily unable to service your request
                due to maintenance downtime or capacity problems.
                Please try again later.
              </p>
              <p class="error-server">nginx/1.18.0 (Ubuntu)</p>

              <!-- Detalle técnico falso -->
              <div class="error-trace">
                <span class="trace-label">Request ID:</span>
                <span class="trace-val">a3f8-prode26-0610-4499</span><br/>
                <span class="trace-label">Timestamp:</span>
                <span class="trace-val">2026-06-10T23:59:47Z</span><br/>
                <span class="trace-label">Upstream:</span>
                <span class="trace-val">prode-api-prod:8080 — Connection timed out</span><br/>
                <span class="trace-label">Cause:</span>
                <span class="trace-val trace-red">Too many simultaneous inscription requests</span>
              </div>

              <p class="error-hint">
                ⚠️ Si tenías una inscripción en curso, es posible que no haya
                sido guardada correctamente.
              </p>

              <button class="error-btn" (click)="avanzarASplash()" type="button">
                Reintentar
              </button>
            </div>

          </div>
        }

        <!-- ══════════════════════════════════════════════
             FASE 2: Splash de bienvenida (Lyle Lanley)
             ══════════════════════════════════════════════ -->
        @if (fase() === 'splash') {
          <div
            class="splash-card"
            [class.splash-card-entrando]="entrando()"
            (click)="$event.stopPropagation()"
          >

            <!-- Barra de progreso verde/dorada (4s) -->
            <div class="splash-progress">
              <div
                class="splash-progress-bar"
                [class.corriendo]="!saliendo() && !entrando()"
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
        }

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

    /* ── Barra de progreso compartida ────────────────────────────────────── */
    .splash-progress {
      height: 4px;
      background: rgba(0, 0, 0, 0.08);
      width: 100%;
      flex-shrink: 0;
    }

    .splash-progress-bar {
      height: 100%;
      width: 0%;
      border-radius: 0 2px 2px 0;
    }

    /* Fase error: barra roja en 4.5s */
    .splash-progress-bar.corriendo-error {
      background: linear-gradient(90deg, #c0392b, #e74c3c);
      animation: progressRun 4.5s linear forwards;
    }

    /* Fase splash: barra verde/dorada en 4s */
    .splash-progress-bar.corriendo {
      background: linear-gradient(90deg, #3CAC3B, #FFD700);
      animation: progressRun 4s linear forwards;
    }

    @keyframes progressRun {
      from { width: 0%; }
      to   { width: 100%; }
    }

    /* ══════════════════════════════════════════════════════════════════════
       FASE 1 — Error card (estilo nginx / browser error)
       ══════════════════════════════════════════════════════════════════════ */
    .error-card {
      position: relative;
      background: #fff;
      border-radius: 4px;
      width: 100%;
      max-width: 520px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      animation: splashSlideUp 0.4s ease both;
      font-family: 'Courier New', Courier, monospace;
      color: #111;
    }

    .error-body {
      padding: 2em 2.5em 2em;
    }

    .error-code {
      font-size: 5rem;
      font-weight: 900;
      color: #c0392b;
      line-height: 1;
      margin: 0 0 0.1em;
      font-family: Arial, sans-serif;
    }

    .error-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #333;
      margin: 0 0 0.75em;
      font-family: Arial, sans-serif;
    }

    .error-sep {
      border: none;
      border-top: 1px solid #ccc;
      margin: 0 0 1em;
    }

    .error-detail {
      font-size: 0.88rem;
      color: #444;
      line-height: 1.6;
      margin-bottom: 0.4em;
    }

    .error-server {
      font-size: 0.78rem;
      color: #888;
      margin-bottom: 1.25em;
    }

    .error-trace {
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 0.75em 1em;
      font-size: 0.75rem;
      line-height: 1.9;
      margin-bottom: 1em;
      color: #333;
    }

    .trace-label {
      color: #888;
      min-width: 90px;
      display: inline-block;
    }

    .trace-val {
      color: #222;
    }

    .trace-red {
      color: #c0392b;
      font-weight: bold;
    }

    .error-hint {
      font-size: 0.82rem;
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 4px;
      padding: 0.6em 0.9em;
      color: #856404;
      margin-bottom: 1.25em;
      line-height: 1.5;
      font-family: 'DM Sans', Arial, sans-serif;
    }

    .error-btn {
      display: inline-block;
      padding: 0.55em 1.6em;
      background: #2c6fad;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 0.88rem;
      font-family: Arial, sans-serif;
      cursor: pointer;
      transition: background 0.2s;
    }

    .error-btn:hover {
      background: #1a5490;
    }

    /* ══════════════════════════════════════════════════════════════════════
       FASE 2 — Splash Lyle Lanley
       ══════════════════════════════════════════════════════════════════════ */
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
    }

    .splash-card.splash-card-entrando {
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
      .error-body { padding: 1.5em 1.25em 1.5em; }
      .error-code { font-size: 3.5rem; }
      .error-title { font-size: 1.2rem; }
    }
  `]
})
export class SplashBienvenidaComponent implements OnInit, OnDestroy {

  private platformId = inject(PLATFORM_ID);

  protected readonly imageSrc = IMAGE_SRC;

  readonly visible  = signal(false);
  readonly saliendo = signal(false);
  readonly entrando = signal(false);         // controla animación entrada del splash
  readonly fase     = signal<Fase>('error'); // 'error' | 'splash'

  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const yaVisto = localStorage.getItem(STORAGE_KEY);
    if (yaVisto) return;

    // Pequeño delay para que el home ya esté pintado
    const t1 = setTimeout(() => {
      this.fase.set('error');
      this.visible.set(true);

      // Después de 4.5s, pasar a la fase splash
      const t2 = setTimeout(() => this.avanzarASplash(), 4500);
      this.timers.push(t2);
    }, 600);

    this.timers.push(t1);
  }

  ngOnDestroy(): void {
    this.timers.forEach(t => clearTimeout(t));
  }

  /** Transición de la fase 'error' a la fase 'splash' */
  avanzarASplash(): void {
    // Cancelar timers pendientes (por si hizo click en Reintentar antes del auto-avance)
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];

    this.entrando.set(true);
    this.fase.set('splash');

    // Quitar clase entrando luego de que termine la animación (450ms)
    const t1 = setTimeout(() => this.entrando.set(false), 450);

    // Auto-close a los 4s desde que aparece el splash
    const t2 = setTimeout(() => this.cerrar(), 4000);

    this.timers.push(t1, t2);
  }

  onOverlayClick(): void {
    if (this.fase() === 'error') {
      // Click en el overlay oscuro durante la fase error: acelera a la fase splash
      this.avanzarASplash();
    } else {
      this.cerrar();
    }
  }

  cerrar(): void {
    if (this.saliendo()) return;
    this.saliendo.set(true);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, '1');
    }

    const t = setTimeout(() => this.visible.set(false), 350);
    this.timers.push(t);
  }
}
