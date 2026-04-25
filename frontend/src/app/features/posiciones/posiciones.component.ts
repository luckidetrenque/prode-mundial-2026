// src/app/features/posiciones/posiciones.component.ts
import { Component, OnInit, signal } from '@angular/core';
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
      <h2>Tabla de Posiciones</h2>
      <div class="referencias">
        <span class="ref first-place"><i class="fas fa-trophy"></i> 1° Puesto</span>
        <span class="ref second-place"><i class="fas fa-medal"></i> 2° Puesto</span>
        <span class="ref third-place"><i class="fas fa-medal"></i> 3° Puesto</span>
      </div>
      @if (cargando()) {
        <div class="spinner-container"><div class="spinner"></div></div>
      }
      @if (!cargando() && posiciones().length === 0) {
        <p class="msg-warning">Aún no hay resultados cargados. Las posiciones se actualizarán a medida que se jueguen los partidos.</p>
      }
      @if (!cargando() && posiciones().length > 0) {
        <p class="subtitulo">Resultados computados: {{ posiciones()[0]?.totalPartidos }} partidos</p>
        <table class="tabla-posiciones">
          <thead>
            <tr>
              <th>Puesto</th>
              <th>Participante</th>
              <th>Afiliado N°</th>
              <th>Planilla N°</th>
              <th>Puntos</th>
            </tr>
          </thead>
          <tbody>
            @for (pos of posicionesPaginadas(); track pos.codigoPlanilla) {
              <tr [class]="getClasePosicion(pos.posicion)">
                <td class="posicion-num">
                  @switch (pos.posicion) {
                    @case (1) { <i class="fas fa-trophy first-place"></i> }
                    @case (2) { <i class="fas fa-medal second-place"></i> }
                    @case (3) { <i class="fas fa-medal third-place"></i> }
                    @default  { {{ pos.posicion }} }
                  }
                </td>
                <td>{{ pos.nombre }} {{ pos.apellido }}</td>
                <td>{{ pos.afiliado }}</td>
                <td>
                  {{ pos.codigoPlanilla }}
                  <a [routerLink]="['/planillas', pos.codigoPlanilla]" title="Ver planilla">
                    <i class="fas fa-magnifying-glass"></i>
                  </a>
                </td>
                <td class="puntos">{{ pos.puntos }}</td>
              </tr>
            }
          </tbody>
        </table>
        <div class="paginacion">
          <button class="btn btn-secondary" (click)="paginaAnterior()" [disabled]="paginaActual() === 1">← Anterior</button>
          <span>Página {{ paginaActual() }} de {{ totalPaginas() }}</span>
          <button class="btn btn-secondary" (click)="paginaSiguiente()" [disabled]="paginaActual() === totalPaginas()">Siguiente →</button>
        </div>
      }
    </main>
  `,
  styles: [`
    .referencias { display: flex; gap: 1.5em; margin-bottom: 1em; font-size: 0.85rem; }
    .ref { display: flex; align-items: center; gap: 0.3em; }
    .tabla-posiciones { margin-top: 0.5em; }
    .posicion-num { text-align: center; font-weight: bold; }
    .puntos { text-align: center; font-weight: bold; font-size: 1.1rem; }
    tr.fila-gold   { background-color: #fffde7 !important; }
    tr.fila-silver { background-color: #f5f5f5 !important; }
    tr.fila-bronze { background-color: #fff8f0 !important; }
    .subtitulo { font-size: 0.85rem; color: #666; margin-bottom: 0.5em; }
    .paginacion { display: flex; justify-content: center; align-items: center; gap: 1em; margin-top: 1em; font-size: 0.9rem; }
  `]
})
export class PosicionesComponent implements OnInit {

  cargando     = signal(true);
  posiciones   = signal<Posicion[]>([]);
  paginaActual = signal(1);
  readonly POR_PAGINA = 20;

  constructor(private posicionService: PosicionService) {}

  ngOnInit(): void {
    this.posicionService.getPosiciones().subscribe({
      next: data => { this.posiciones.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false)
    });
  }

  posicionesPaginadas(): Posicion[] {
    const inicio = (this.paginaActual() - 1) * this.POR_PAGINA;
    return this.posiciones().slice(inicio, inicio + this.POR_PAGINA);
  }

  totalPaginas(): number { return Math.ceil(this.posiciones().length / this.POR_PAGINA); }
  paginaAnterior(): void { if (this.paginaActual() > 1) this.paginaActual.update(p => p - 1); }
  paginaSiguiente(): void { if (this.paginaActual() < this.totalPaginas()) this.paginaActual.update(p => p + 1); }
  getClasePosicion(posicion: number): string {
    if (posicion === 1) return 'fila-gold';
    if (posicion === 2) return 'fila-silver';
    if (posicion === 3) return 'fila-bronze';
    return '';
  }
}
