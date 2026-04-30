// cargar-resultados.component.ts — VERSIÓN MEJORADA CON EDICIÓN Y RESET
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { PartidoService } from '../../../core/services/partido.service';
import { ResultadoService } from '../../../core/services/resultado.service';
import { ToastService } from '../../../core/services/toast.service';
import { Partido } from '../../../shared/models/partido.model';

import { FormsModule } from '@angular/forms';

const GRUPOS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

@Component({
  selector: 'app-cargar-resultados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="main">
      <h2><i class="fas fa-database"></i> Cargar Resultados</h2>

      @if (cargando()) {
        <div class="spinner-container"><div class="spinner"></div></div>
      }

      @if (!cargando() && partidos().length > 0) {

        <!-- Resumen de progreso -->
        <div class="stats-overview">
          <div class="overview-card">
            <i class="fas fa-futbol"></i>
            <div class="overview-data">
              <span class="overview-num">{{ partidos().length }}</span>
              <span class="overview-label">Partidos Totales</span>
            </div>
          </div>
          
          <div class="overview-card">
            <i class="fas fa-check-double"></i>
            <div class="overview-data">
              <span class="overview-num">{{ resultadosGuardados().size }}</span>
              <span class="overview-label">Resultados Cargados</span>
            </div>
          </div>

          <div class="overview-card">
            <i class="fas fa-hourglass-half"></i>
            <div class="overview-data">
              <span class="overview-num">{{ partidos().length - resultadosGuardados().size }}</span>
              <span class="overview-label">Resultados Pendientes</span>
            </div>
          </div>

          <div class="overview-card">
            <i class="fas fa-chart-pie"></i>
            <div class="overview-data">
              <span class="overview-num">
                {{ (partidos().length ? (resultadosGuardados().size / partidos().length * 100) : 0) | number:'1.0-0' }}%
              </span>
              <span class="overview-label">Progreso General</span>
            </div>
          </div>
        </div>

        <!-- Filtro de grupo con botón de reset -->
        <div class="filtro-grupos">
          <div class="filtro-izq">
            <button class="btn-grupo" [class.activo]="grupoActivo() === null" (click)="grupoActivo.set(null)">
              Todos
            </button>
            @for (g of grupos; track g) {
              <button
                class="btn-grupo"
                [class.activo]="grupoActivo() === g"
                [class.completo]="grupoCompleto(g)"
                (click)="grupoActivo.set(g)"
              >
                {{ g }}
                @if (grupoCompleto(g)) {
                  <i class="fas fa-check" style="font-size:0.6rem"></i>
                }
              </button>
            }
          </div>

          <!-- Botones de reset -->
          @if (grupoActivo()) {
            <button
              class="btn btn-reset"
              (click)="abrirConfirmacionReset(grupoActivo()!)"
              [disabled]="contarGuardadosEnGrupo(grupoActivo()!) === 0 || reseteando()"
              title="Resetear resultados de este grupo"
            >
              <i class="fas fa-rotate-left"></i>
              Resetear Grupo {{ grupoActivo() }}
            </button>
          } @else {
            <button
              class="btn btn-reset-all"
              (click)="abrirConfirmacionResetAll()"
              [disabled]="resultadosGuardados().size === 0 || reseteando()"
              title="Resetear absolutamente todos los resultados"
            >
              <i class="fas fa-skull-crossbones"></i>
              Resetear TODO
            </button>
          }
        </div>

        <!-- Modal de confirmación de reset -->
        @if (modalResetAbierto()) {
          <div class="modal-overlay" (click)="cerrarModalReset()">
            <div class="modal-content" (click)="$event.stopPropagation()">
              <div class="modal-header">
                <i class="fas fa-triangle-exclamation modal-icon-warning"></i>
                <h3>Confirmar Reset</h3>
              </div>
              <div class="modal-body">
                <p>
                  ¿Estás seguro que querés <strong>borrar todos los resultados</strong> 
                  del Grupo {{ grupoParaReset() }}?
                </p>
                <p class="modal-warning">
                  <i class="fas fa-info-circle"></i>
                  Esta acción eliminará {{ contarGuardadosEnGrupo(grupoParaReset()!) }} 
                  resultado{{ contarGuardadosEnGrupo(grupoParaReset()!) !== 1 ? 's' : '' }} 
                  y <strong>no se puede deshacer</strong>.
                </p>
              </div>
              <div class="modal-footer">
                <button class="btn btn-secondary" (click)="cerrarModalReset()" [disabled]="reseteando()">
                  Cancelar
                </button>
                <button class="btn btn-danger" (click)="confirmarReset()" [disabled]="reseteando()">
                  @if (reseteando()) {
                    <i class="fas fa-spinner fa-spin"></i> Reseteando...
                  } @else {
                    <i class="fas fa-trash"></i> Sí, resetear
                  }
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Modal de confirmación de reset ALL -->
        @if (modalResetAllAbierto()) {
          <div class="modal-overlay" (click)="cerrarModalResetAll()">
            <div class="modal-content" (click)="$event.stopPropagation()">
              <div class="modal-header">
                <i class="fas fa-skull-crossbones" style="color: #dc3545; font-size: 2rem;"></i>
                <h3 style="color: #dc3545;">¡ADVERTENCIA CRÍTICA!</h3>
              </div>
              <div class="modal-body">
                <p>
                  Estás a punto de <strong>ELIMINAR ABSOLUTAMENTE TODOS LOS RESULTADOS</strong> 
                  cargados en el sistema ({{ resultadosGuardados().size }} resultados).
                </p>
                <p class="modal-warning" style="background: #f8d7da; border-color: #f5c6cb; color: #721c24;">
                  <i class="fas fa-exclamation-triangle"></i>
                  <strong>ESTA ACCIÓN ES IRREVERSIBLE Y AFECTARÁ A TODOS LOS USUARIOS.</strong>
                </p>
                <div style="margin-top: 1.5em;">
                  <label for="confirmText" style="display: block; margin-bottom: 0.5em; font-size: 0.85rem; font-weight: 600;">
                    Para confirmar, escribí "ELIMINAR TODO" en mayúsculas:
                  </label>
                  <input 
                    type="text" 
                    id="confirmText" 
                    class="form-control" 
                    [ngModel]="resetAllTextoConf()" 
                    (ngModelChange)="resetAllTextoConf.set($event)"
                    placeholder="ELIMINAR TODO"
                    style="width: 100%; padding: 0.6em; border: 1px solid var(--clr-border-strong); border-radius: var(--radius-sm);"
                  />
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-secondary" (click)="cerrarModalResetAll()" [disabled]="reseteando()">
                  Cancelar
                </button>
                <button 
                  class="btn btn-danger" 
                  (click)="confirmarResetAll()" 
                  [disabled]="reseteando() || resetAllTextoConf() !== 'ELIMINAR TODO'"
                >
                  @if (reseteando()) {
                    <i class="fas fa-spinner fa-spin"></i> Reseteando...
                  } @else {
                    <i class="fas fa-bomb"></i> DESTRUIR TODO
                  }
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Partidos por grupo -->
        @for (grupo of gruposMostrados(); track grupo) {
          @if (getPartidosPorGrupo(grupo).length > 0) {
            <div class="grupo-bloque">

              <div class="grupo-header">
                <span class="grupo-tag">GRUPO {{ grupo }}</span>
                <span class="grupo-estado">
                  {{ contarGuardadosEnGrupo(grupo) }}/{{ getPartidosPorGrupo(grupo).length }} cargados
                </span>
              </div>

              <div class="partidos-lista">
                @for (partido of getPartidosPorGrupo(grupo); track partido.id) {
                  <div class="partido-row" [class.guardado]="resultadosGuardados().has(partido.id)">

                    <span class="partido-n">#{{ partido.numero }}</span>

                    <div class="partido-equipo partido-equipo--local">
                      <span class="equipo-txt">{{ partido.equipoLocalShow }}</span>
                      <img [src]="partido.equipoLocalBandera" [alt]="partido.equipoLocalShow" class="flag" width="26" height="17" />
                    </div>

                    <!-- Selector de resultado -->
                    <div class="opciones-resultado">
                      <button
                        class="opcion-btn"
                        [class.activa-local]="getSeleccion(partido.id) === 'LOCAL'"
                        [class.guardada]="resultadosGuardados().has(partido.id) && getSeleccion(partido.id) === 'LOCAL'"
                        (click)="seleccionarResultado(partido.id, 'LOCAL')"
                        title="Local gana"
                      >L</button>
                      <button
                        class="opcion-btn"
                        [class.activa-empate]="getSeleccion(partido.id) === 'EMPATE'"
                        [class.guardada]="resultadosGuardados().has(partido.id) && getSeleccion(partido.id) === 'EMPATE'"
                        (click)="seleccionarResultado(partido.id, 'EMPATE')"
                        title="Empate"
                      >E</button>
                      <button
                        class="opcion-btn"
                        [class.activa-visitante]="getSeleccion(partido.id) === 'VISITANTE'"
                        [class.guardada]="resultadosGuardados().has(partido.id) && getSeleccion(partido.id) === 'VISITANTE'"
                        (click)="seleccionarResultado(partido.id, 'VISITANTE')"
                        title="Visitante gana"
                      >V</button>
                    </div>

                    <div class="partido-equipo partido-equipo--visit">
                      <img [src]="partido.equipoVisitanteBandera" [alt]="partido.equipoVisitanteShow" class="flag" width="26" height="17" />
                      <span class="equipo-txt">{{ partido.equipoVisitanteShow }}</span>
                    </div>

                    <!-- Botones de acción -->
                    <div class="partido-accion">
                      @if (resultadosGuardados().has(partido.id)) {
                        @if (editando() === partido.id) {
                          <!-- Modo edición -->
                          <button
                            class="btn btn-guardar-edit"
                            [disabled]="!getSeleccion(partido.id) || guardando() === partido.id"
                            (click)="guardar(partido.id)"
                          >
                            @if (guardando() === partido.id) {
                              <i class="fas fa-spinner fa-spin"></i>
                            } @else {
                              <i class="fas fa-check"></i> Guardar
                            }
                          </button>
                          <button
                            class="btn btn-cancelar-edit"
                            (click)="cancelarEdicion(partido.id)"
                            [disabled]="guardando() === partido.id"
                          >
                            <i class="fas fa-xmark"></i>
                          </button>
                        } @else {
                          <!-- Modo guardado -->
                          <span class="badge-guardado">
                            <i class="fas fa-check"></i> Guardado
                          </span>
                          <button
                            class="btn-editar"
                            (click)="habilitarEdicion(partido.id)"
                            title="Editar resultado"
                          >
                            <i class="fas fa-pen"></i>
                          </button>
                        }
                      } @else {
                        <!-- Sin guardar -->
                        <button
                          class="btn btn-guardar"
                          [disabled]="!getSeleccion(partido.id) || guardando() === partido.id"
                          (click)="guardar(partido.id)"
                        >
                          @if (guardando() === partido.id) {
                            <i class="fas fa-spinner fa-spin"></i>
                          } @else {
                            <i class="fas fa-floppy-disk"></i> Guardar
                          }
                        </button>
                      }
                    </div>

                  </div>
                }
              </div>

            </div>
          }
        }

      }
    </main>
  `,
  styles: [`
    /* ── Toasts ──────────────────────────────────────────────────────────── */
    .toast {
      display: flex;
      align-items: center;
      gap: 0.75em;
      padding: 1em 1.25em;
      border-radius: var(--radius-lg);
      margin-bottom: 1.5em;
      font-size: 0.9rem;
      font-weight: 500;
      box-shadow: var(--shadow-md);
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .toast-success {
      background: var(--clr-success-bg);
      color: var(--clr-success-text);
      border: 1px solid rgba(26,122,74,0.3);
    }

    .toast-error {
      background: var(--clr-error-bg);
      color: var(--clr-error-text);
      border: 1px solid rgba(192,57,43,0.3);
    }

    .toast i:first-child { font-size: 1.2rem; flex-shrink: 0; }

    .toast-close {
      margin-left: auto;
      background: transparent;
      border: none;
      color: inherit;
      cursor: pointer;
      font-size: 1rem;
      padding: 0.25em;
      opacity: 0.6;
      transition: opacity 0.2s;
    }

    .toast-close:hover { opacity: 1; }

    /* ── Overview Dashboard ──────────────────────────────────────────────── */
    .stats-overview {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1em;
      margin-bottom: 2em;
    }

    .overview-card {
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-lg);
      padding: 1.25em;
      display: flex;
      align-items: center;
      gap: 1em;
      box-shadow: var(--shadow-sm);
      transition: var(--transition);
    }

    .overview-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
      border-color: var(--clr-primary-light);
    }

    .overview-card i {
      font-size: 1.8rem;
      color: var(--clr-primary);
      background: var(--clr-surface-alt);
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      flex-shrink: 0;
    }

    .overview-data {
      display: flex;
      flex-direction: column;
    }

    .overview-num {
      font-family: var(--font-display);
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--clr-primary-dark);
      line-height: 1.1;
    }

    .overview-label {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--clr-text-muted);
      margin-top: 2px;
    }

    /* ── Filtro grupos con botón reset ──────────────────────────────────── */
    .filtro-grupos {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1em;
      margin-bottom: 1.5em;
      flex-wrap: wrap;
    }

    .filtro-izq {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35em;
    }

    .btn-grupo {
      display: inline-flex;
      align-items: center;
      gap: 0.3em;
      padding: 0.3em 0.75em;
      border: 1.5px solid var(--clr-border-strong);
      border-radius: 20px;
      background: var(--clr-surface);
      color: var(--clr-text-muted);
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      font-family: var(--font-body);
    }

    .btn-grupo:hover { border-color: var(--clr-primary); color: var(--clr-primary); }
    .btn-grupo.activo { border-color: var(--clr-primary); background: var(--clr-primary); color: white; }
    .btn-grupo.completo { border-color: var(--clr-success-text); color: var(--clr-success-text); background: var(--clr-success-bg); }
    .btn-grupo.completo.activo { background: var(--clr-success-text); color: white; border-color: var(--clr-success-text); }

    .btn-reset, .btn-reset-all {
      display: inline-flex;
      align-items: center;
      gap: 0.5em;
      padding: 0.5em 1em;
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      white-space: nowrap;
    }

    .btn-reset {
      background: #fff3cd;
      color: #856404;
      border: 1px solid #ffc107;
    }

    .btn-reset:hover:not(:disabled) {
      background: #ffc107;
      color: white;
      transform: translateY(-1px);
    }

    .btn-reset-all {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #dc3545;
    }

    .btn-reset-all:hover:not(:disabled) {
      background: #dc3545;
      color: white;
      transform: translateY(-1px);
    }

    .btn-reset:disabled, .btn-reset-all:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* ── Modal ───────────────────────────────────────────────────────────── */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-content {
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      max-width: 480px;
      width: 90%;
      animation: scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes scaleIn {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 0.75em;
      padding: 1.5em;
      border-bottom: 1px solid var(--clr-border);
    }

    .modal-icon-warning {
      font-size: 2rem;
      color: #ffc107;
      flex-shrink: 0;
    }

    .modal-header h3 {
      font-family: var(--font-display);
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--clr-primary-dark);
      margin: 0;
    }

    .modal-body {
      padding: 1.5em;
    }

    .modal-body p {
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 1em;
      color: var(--clr-text);
    }

    .modal-body p:last-child { margin-bottom: 0; }

    .modal-warning {
      display: flex;
      align-items: flex-start;
      gap: 0.5em;
      padding: 0.85em 1em;
      background: #fff3cd;
      border-left: 3px solid #ffc107;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      color: #856404;
    }

    .modal-warning i {
      font-size: 1rem;
      flex-shrink: 0;
      margin-top: 0.1em;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75em;
      padding: 1.25em 1.5em;
      border-top: 1px solid var(--clr-border);
      background: var(--clr-surface-alt);
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    }

    .btn-danger {
      background: #dc3545;
      color: white;
      border: none;
      padding: 0.6em 1.25em;
      border-radius: var(--radius-sm);
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
    }

    .btn-danger:hover:not(:disabled) {
      background: #c82333;
      transform: translateY(-1px);
    }

    .btn-danger:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* ── Grupo bloque ────────────────────────────────────────────────────── */
    .grupo-bloque { margin-bottom: 2em; }

    .grupo-header {
      display: flex;
      align-items: center;
      gap: 0.75em;
      margin-bottom: 0.6em;
    }

    .grupo-tag {
      font-family: var(--font-display);
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 2px;
      color: var(--clr-primary-dark);
      background: var(--clr-surface-alt);
      padding: 0.2em 0.8em;
      border-radius: 20px;
      border: 1.5px solid var(--clr-border-strong);
    }

    .grupo-estado {
      font-size: 0.75rem;
      color: var(--clr-text-muted);
    }

    /* ── Lista de partidos ───────────────────────────────────────────────── */
    .partidos-lista {
      display: flex;
      flex-direction: column;
      gap: 0.45em;
    }

    /* ── Fila de partido ─────────────────────────────────────────────────── */
    .partido-row {
      display: grid;
      grid-template-columns: 28px 1fr 90px 1fr auto;
      align-items: center;
      gap: 0.6em;
      padding: 0.65em 0.85em;
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      transition: var(--transition);
    }

    .partido-row:hover { border-color: var(--clr-border-strong); }

    .partido-row.guardado {
      border-left: 3px solid var(--clr-success-text);
      background: var(--clr-success-bg);
    }

    .partido-n {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--clr-text-muted);
      text-align: center;
    }

    .partido-equipo {
      display: flex;
      align-items: center;
      gap: 0.45em;
    }

    .partido-equipo--local  { justify-content: flex-end; }
    .partido-equipo--visit  { justify-content: flex-start; }

    .equipo-txt {
      font-size: 0.78rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      color: var(--clr-text);
    }

    /* Opciones L/E/V */
    .opciones-resultado {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    .opcion-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1.5px solid var(--clr-border-strong);
      background: var(--clr-surface);
      color: var(--clr-text-muted);
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.2px;
      cursor: pointer;
      transition: all 0.14s;
      font-family: var(--font-body);
    }

    .opcion-btn:hover:not(:disabled) {
      border-color: var(--clr-primary);
      color: var(--clr-primary);
      background: rgba(56,120,135,0.07);
    }

    .opcion-btn.activa-local {
      border-color: var(--clr-primary);
      background: var(--clr-primary);
      color: white;
      box-shadow: 0 2px 6px rgba(56,120,135,0.35);
    }

    .opcion-btn.activa-empate {
      border-color: var(--clr-primary-dark);
      background: var(--clr-primary-dark);
      color: white;
      box-shadow: 0 2px 6px rgba(18,51,59,0.3);
    }

    .opcion-btn.activa-visitante {
      border-color: var(--clr-maroon);
      background: var(--clr-maroon);
      color: white;
      box-shadow: 0 2px 6px rgba(86,4,44,0.35);
    }

    .partido-row.guardado .opcion-btn:not(.activa-local):not(.activa-empate):not(.activa-visitante) {
      opacity: 0.4;
    }

    /* Botones de acción */
    .partido-accion {
      min-width: 140px;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.4em;
    }

    .btn-guardar, .btn-guardar-edit {
      display: inline-flex;
      align-items: center;
      gap: 0.35em;
      padding: 0.4em 0.85em;
      border: none;
      border-radius: var(--radius-sm);
      background: var(--clr-maroon);
      color: white;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      font-family: var(--font-body);
      white-space: nowrap;
    }

    .btn-guardar:hover:not(:disabled), .btn-guardar-edit:hover:not(:disabled) {
      background: var(--clr-maroon-light);
      transform: translateY(-1px);
    }

    .btn-guardar:disabled, .btn-guardar-edit:disabled {
      background: var(--clr-border-strong);
      color: var(--clr-text-muted);
      cursor: not-allowed;
      transform: none;
    }

    .btn-guardar-edit {
      background: var(--clr-primary);
    }

    .btn-guardar-edit:hover:not(:disabled) {
      background: var(--clr-primary-dark);
    }

    .btn-cancelar-edit {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1.5px solid var(--clr-border-strong);
      background: white;
      color: var(--clr-text-muted);
      cursor: pointer;
      transition: var(--transition);
      padding: 0;
    }

    .btn-cancelar-edit:hover:not(:disabled) {
      border-color: var(--clr-error-text);
      color: var(--clr-error-text);
      background: var(--clr-error-bg);
    }

    .badge-guardado {
      display: inline-flex;
      align-items: center;
      gap: 0.35em;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--clr-success-text);
      background: var(--clr-success-bg);
      padding: 0.35em 0.75em;
      border-radius: var(--radius-sm);
      border: 1px solid rgba(26,122,74,0.2);
    }

    .btn-editar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1.5px solid var(--clr-primary);
      background: white;
      color: var(--clr-primary);
      cursor: pointer;
      transition: var(--transition);
      padding: 0;
      font-size: 0.75rem;
    }

    .btn-editar:hover {
      background: var(--clr-primary);
      color: white;
      transform: scale(1.1);
    }

    /* ── Responsive ──────────────────────────────────────────────────────── */
    @media (max-width: 800px) {
      .stats-overview { grid-template-columns: repeat(2, 1fr); }
      .filtro-grupos { flex-direction: column; align-items: flex-start; }
      .partido-row {
        grid-template-columns: 24px 1fr 80px 1fr auto;
        padding: 0.5em 0.6em;
        gap: 0.4em;
      }
      .equipo-txt { font-size: 0.7rem; }
    }

    @media (max-width: 500px) {
      .stats-overview { grid-template-columns: 1fr; }
      .equipo-txt { display: none; }
      .partido-row { grid-template-columns: 20px auto 80px auto auto; }
      .partido-accion { min-width: 90px; }
    }
  `]
})
export class CargarResultadosComponent implements OnInit {

  cargando     = signal(true);
  guardando    = signal<number | null>(null);
  editando     = signal<number | null>(null);
  reseteando   = signal(false);
  grupoActivo  = signal<string | null>(null);
  modalResetAbierto = signal(false);
  grupoParaReset = signal<string | null>(null);
  modalResetAllAbierto = signal(false);
  resetAllTextoConf = signal('');

  partidos = signal<Partido[]>([]);

  private selecciones = new Map<number, string>();
  private seleccionesOriginales = new Map<number, string>();
  resultadosGuardados = signal<Set<number>>(new Set());

  grupos = GRUPOS;

  private toastService = inject(ToastService);

  constructor(
    private partidoService: PartidoService,
    private resultadoService: ResultadoService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    forkJoin({
      partidos: this.partidoService.getPartidos(),
      resultados: this.resultadoService.getResultados()
    }).subscribe({
      next: ({ partidos, resultados }) => {
        const filtrados = partidos.filter(p => p.fase === 'GRUPOS');
        this.partidos.set(filtrados);

        const guardados = new Set<number>();
        resultados.forEach(r => {
          const partidoId = r.partido.id;
          this.selecciones.set(partidoId, r.resultado);
          this.seleccionesOriginales.set(partidoId, r.resultado);
          guardados.add(partidoId);
        });

        this.resultadosGuardados.set(guardados);
        this._selVersion.update(v => v + 1);
        this.cargando.set(false);
      },
      error: () => {
        this.toastService.error('No se pudieron cargar los datos del servidor.');
        this.cargando.set(false);
      }
    });
  }

  gruposMostrados(): string[] {
    const activo = this.grupoActivo();
    if (activo) return [activo];
    return this.grupos;
  }

  getPartidosPorGrupo(grupo: string): Partido[] {
    return this.partidos().filter(p => p.grupo === grupo);
  }

  seleccionarResultado(partidoId: number, valor: string): void {
    this.selecciones.set(partidoId, valor);
    this._selVersion.update(v => v + 1);
  }

  private _selVersion = signal(0);

  getSeleccion(partidoId: number): string {
    void this._selVersion();
    return this.selecciones.get(partidoId) ?? '';
  }

  contarGuardadosEnGrupo(grupo: string): number {
    return this.getPartidosPorGrupo(grupo)
      .filter(p => this.resultadosGuardados().has(p.id)).length;
  }

  grupoCompleto(grupo: string): boolean {
    const partidos = this.getPartidosPorGrupo(grupo);
    return partidos.length > 0 &&
      partidos.every(p => this.resultadosGuardados().has(p.id));
  }

  habilitarEdicion(partidoId: number): void {
    this.editando.set(partidoId);
  }

  cancelarEdicion(partidoId: number): void {
    const original = this.seleccionesOriginales.get(partidoId);
    if (original) {
      this.selecciones.set(partidoId, original);
      this._selVersion.update(v => v + 1);
    }
    this.editando.set(null);
  }

  guardar(partidoId: number): void {
    const resultado = this.selecciones.get(partidoId);
    if (!resultado) return;

    this.guardando.set(partidoId);

    this.resultadoService.guardar(partidoId, resultado).subscribe({
      next: () => {
        this.guardando.set(null);
        this.editando.set(null);
        
        const guardados = new Set(this.resultadosGuardados());
        guardados.add(partidoId);
        this.resultadosGuardados.set(guardados);
        
        this.seleccionesOriginales.set(partidoId, resultado);
        
        this.toastService.success('Resultado guardado exitosamente.');
      },
      error: () => {
        this.guardando.set(null);
        this.toastService.error('Error al guardar el resultado. Intentá de nuevo.');
      }
    });
  }

  abrirConfirmacionReset(grupo: string): void {
    this.grupoParaReset.set(grupo);
    this.modalResetAbierto.set(true);
  }

  cerrarModalReset(): void {
    this.modalResetAbierto.set(false);
    this.grupoParaReset.set(null);
  }

  abrirConfirmacionResetAll(): void {
    this.resetAllTextoConf.set('');
    this.modalResetAllAbierto.set(true);
  }

  cerrarModalResetAll(): void {
    this.modalResetAllAbierto.set(false);
    this.resetAllTextoConf.set('');
  }

  confirmarResetAll(): void {
    if (this.resetAllTextoConf() !== 'ELIMINAR TODO') return;

    this.reseteando.set(true);

    this.resultadoService.resetearTodos().subscribe({
      next: (res) => {
        this.resultadosGuardados.set(new Set());
        this.selecciones.clear();
        this.seleccionesOriginales.clear();
        
        this._selVersion.update(v => v + 1);
        this.reseteando.set(false);
        this.cerrarModalResetAll();
        this.toastService.success(res.mensaje);
      },
      error: () => {
        this.reseteando.set(false);
        this.cerrarModalResetAll();
        this.toastService.error('Error al resetear todo. Intentá de nuevo.');
      }
    });
  }

  confirmarReset(): void {
    const grupo = this.grupoParaReset();
    if (!grupo) return;

    this.reseteando.set(true);
    const partidosGrupo = this.getPartidosPorGrupo(grupo);
    const partidosIds = partidosGrupo
      .filter(p => this.resultadosGuardados().has(p.id))
      .map(p => p.id);

    this.resultadoService.resetearGrupo(grupo).subscribe({
      next: (res) => {
        partidosIds.forEach(id => {
          const guardados = new Set(this.resultadosGuardados());
          guardados.delete(id);
          this.resultadosGuardados.set(guardados);
          this.selecciones.delete(id);
          this.seleccionesOriginales.delete(id);
        });
        
        this._selVersion.update(v => v + 1);
        this.reseteando.set(false);
        this.cerrarModalReset();
        this.toastService.success(res.mensaje);
      },
      error: () => {
        this.reseteando.set(false);
        this.cerrarModalReset();
        this.toastService.error('Error al resetear el grupo. Intentá de nuevo.');
      }
    });
  }
}
