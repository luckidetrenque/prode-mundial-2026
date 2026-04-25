// src/app/features/planilla-detalle/planilla-detalle.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PlanillaService } from '../../core/services/planilla.service';
import { PlanillaResponse } from '../../shared/models/planilla.model';

@Component({
  selector: 'app-planilla-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="main">
      <a routerLink="/participantes" class="btn btn-secondary btn-back">
        ← Volver a participantes
      </a>

      @if (cargando()) {
        <div class="spinner-container"><div class="spinner"></div></div>
      }

      @if (errorMensaje()) {
        <p class="msg-error">❌ {{ errorMensaje() }}</p>
      }

      @if (!cargando() && planilla()) {
        <div class="planilla-info">
          <h2><i class="fas fa-list-check"></i> Planilla N° {{ planilla()!.codigo }}</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Participante</span>
              <span class="info-valor">{{ planilla()!.nombre }} {{ planilla()!.apellido }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">N° Afiliado</span>
              <span class="info-valor">{{ planilla()!.afiliado }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Estado</span>
              <span class="info-valor" [class.confirmada]="planilla()!.confirmada">
                @if (planilla()!.confirmada) {
                  ✅ Confirmada
                } @else {
                  ⏳ Pendiente de confirmación
                }
              </span>
            </div>
          </div>
          @if (planilla()!.mensaje) {
            <p class="planilla-mensaje">{{ planilla()!.mensaje }}</p>
          }
        </div>
      }
    </main>
  `,
  styles: [`
    .btn-back { margin-bottom: 1.5em; display: inline-flex; align-items: center; gap: 0.4em; }
    .planilla-info { background: white; border: 1px solid #e8e8e8; border-radius: 12px; padding: 2em; max-width: 600px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1em; margin-top: 1.5em; }
    .info-item { display: flex; flex-direction: column; gap: 0.25em; }
    .info-label { font-size: 0.75rem; text-transform: uppercase; color: #888; letter-spacing: 0.5px; }
    .info-valor { font-size: 1.05rem; font-weight: 600; }
    .info-valor.confirmada { color: #2e7d32; }
    .planilla-mensaje { margin-top: 1em; font-size: 0.85rem; color: #555; font-style: italic; }
  `]
})
export class PlanillaDetalleComponent implements OnInit {

  cargando = signal(true);
  planilla = signal<PlanillaResponse | null>(null);
  errorMensaje = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private planillaService: PlanillaService
  ) {}

  ngOnInit(): void {
    const codigo = Number(this.route.snapshot.paramMap.get('codigo'));
    if (!codigo) {
      this.errorMensaje.set('Código de planilla inválido.');
      this.cargando.set(false);
      return;
    }

    this.planillaService.obtener(codigo).subscribe({
      next: data => { this.planilla.set(data); this.cargando.set(false); },
      error: () => { this.errorMensaje.set('No se encontró la planilla.'); this.cargando.set(false); }
    });
  }
}
