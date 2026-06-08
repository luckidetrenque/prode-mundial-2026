// src/app/core/services/torneo.service.ts
//
// Centraliza el estado del torneo (countdown + tiempoExpirado) que antes
// vivía directamente en App. Al moverlo a un servicio singleton, cualquier
// componente puede inyectarlo sin duplicar lógica ni prop-drilling.
//
// Uso en App (migración):
//   private torneoService = inject(TorneoService);
//   tiempoExpirado = this.torneoService.tiempoExpirado;
//   countdownText  = this.torneoService.countdownText;
//
// Uso en cualquier otro componente:
//   private torneoService = inject(TorneoService);
//   protected tiempoExpirado = this.torneoService.tiempoExpirado;

import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { signal } from '@angular/core';
import { timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class TorneoService {

  private readonly platformId = inject(PLATFORM_ID);

  // Fecha límite de inscripción: 10/06/2026 a las 14:00 hs Argentina (UTC-3)
  private readonly deadline = new Date('2026-06-10T14:00:00-03:00');

  /** Signal pública: texto del countdown (ej: "2d 3h 15m 42s") */
  readonly countdownText = signal('');

  /** Signal pública: true cuando se superó la fecha límite */
  readonly tiempoExpirado = signal(false);

  constructor() {
    // El timer solo tiene sentido en el browser; en SSR no hay window ni Date live.
    if (!isPlatformBrowser(this.platformId)) {
      // En SSR asumimos que el torneo puede estar activo; el cliente corregirá.
      return;
    }

    timer(0, 1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.tick());
  }

  private tick(): void {
    const diff = this.deadline.getTime() - Date.now();

    if (diff <= 0) {
      this.countdownText.set('¡Tiempo agotado!');
      this.tiempoExpirado.set(true);
      return;
    }

    const dias    = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diff % (1000 * 60)) / 1000);

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 400;

    this.countdownText.set(
      isMobile && dias > 0
        ? `${dias}d ${horas}h`
        : `${dias}d ${horas}h ${minutos}m ${segundos}s`
    );
    this.tiempoExpirado.set(false);
  }
}
