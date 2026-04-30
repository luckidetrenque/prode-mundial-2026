// planilla.component.ts — VERSIÓN MEJORADA con mejor validación y feedback
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PartidoService } from '../../core/services/partido.service';
import { PlanillaService } from '../../core/services/planilla.service';
import { ToastService } from '../../core/services/toast.service';
import { Partido } from '../../shared/models/partido.model';
import { PlanillaResponse, ResultadoPrediccion } from '../../shared/models/planilla.model';

const GRUPOS_2026 = ['A','B','C','D','E','F','G','H','I','J','K','L'];

// Validador personalizado de email más estricto
function emailValidator(control: any) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const valid = emailRegex.test(control.value);
  return valid ? null : { invalidEmail: true };
}

@Component({
  selector: 'app-planilla',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './planilla.component.html',
  styleUrl: './planilla.component.css'
})
export class PlanillaComponent implements OnInit {

  private toastService = inject(ToastService);

  cargando         = signal(true);
  guardando        = signal(false);
  errorMensaje     = signal<string | null>(null);
  planillaGuardada = signal<PlanillaResponse | null>(null);

  partidos: Partido[] = [];
  grupos = GRUPOS_2026;

  // Mapa interno de predicciones: partidoId → resultado
  private predicciones = new Map<number, ResultadoPrediccion>();

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private partidoService: PartidoService,
    private planillaService: PlanillaService
  ) {
    this.form = this.fb.group({
      nombre:   ['', [
        Validators.required, 
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      ]],
      apellido: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      ]],
      email:    ['', [Validators.required, emailValidator]]
    });
  }

  ngOnInit(): void {
    this.partidoService.getPartidos().subscribe({
      next: partidos => {
        this.partidos = partidos.filter(p => p.fase === 'GRUPOS');
        this.cargando.set(false);
        
        if (this.partidos.length === 0) {
          this.toastService.warning('No hay partidos disponibles en este momento.');
        }
      },
      error: () => {
        this.errorMensaje.set('No se pudieron cargar los partidos. Intentá de nuevo.');
        this.toastService.error('Error al cargar los partidos del servidor.');
        this.cargando.set(false);
      }
    });
  }

  getPartidosPorGrupo(grupo: string): Partido[] {
    return this.partidos.filter(p => p.grupo === grupo);
  }

  seleccionar(partidoId: number, prediccion: ResultadoPrediccion): void {
    // Si ya estaba seleccionado, lo deselecciona (toggle)
    if (this.predicciones.get(partidoId) === prediccion) {
      this.predicciones.delete(partidoId);
    } else {
      this.predicciones.set(partidoId, prediccion);
    }
    this._prediccionesVersion.update(v => v + 1);
  }

  autocompletar(): void {
    const opciones: ResultadoPrediccion[] = ['LOCAL', 'EMPATE', 'VISITANTE'];
    let completados = 0;
    
    this.partidos.forEach(p => {
      if (!this.predicciones.has(p.id)) {
        const random = Math.floor(Math.random() * opciones.length);
        this.predicciones.set(p.id, opciones[random]);
        completados++;
      }
    });
    
    this._prediccionesVersion.update(v => v + 1);
    
    if (completados > 0) {
      this.toastService.success(`¡Listo! Se completaron ${completados} predicción${completados !== 1 ? 'es' : ''} automáticamente.`);
    } else {
      this.toastService.info('Ya tenés todas las predicciones completas.');
    }
  }

  // Signal auxiliar para forzar re-render al cambiar el mapa
  private _prediccionesVersion = signal(0);

  getPrediccion(partidoId: number): ResultadoPrediccion | null {
    void this._prediccionesVersion();
    return this.predicciones.get(partidoId) ?? null;
  }

  prediccionSeleccionada(partidoId: number): boolean {
    void this._prediccionesVersion();
    return this.predicciones.has(partidoId);
  }

  prediccionesCompletadas(): number {
    void this._prediccionesVersion();
    return this.predicciones.size;
  }

  totalPartidos(): number { return this.partidos.length; }

  formularioValido(): boolean {
    void this._prediccionesVersion();
    return this.form.valid && this.predicciones.size === this.partidos.length;
  }

  // Helper para mostrar errores específicos
  getErrorMensaje(campo: string): string {
    const control = this.form.get(campo);
    if (!control || !control.errors || !control.touched) return '';

    if (control.errors['required']) return `El ${campo} es obligatorio`;
    if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['pattern']) return `Solo se permiten letras y espacios`;
    if (control.errors['invalidEmail']) return `El email no es válido`;
    
    return 'Campo inválido';
  }

  guardar(): void {
    // Validación extra antes de enviar
    if (this.predicciones.size !== this.partidos.length) {
      this.toastService.warning('Completá todas las predicciones antes de guardar.');
      return;
    }

    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this.toastService.error('Revisá los datos del formulario. Hay campos con errores.');
      return;
    }

    this.guardando.set(true);
    this.errorMensaje.set(null);

    const request = {
      nombre:   this.form.value.nombre.trim().toUpperCase(),
      apellido: this.form.value.apellido.trim().toUpperCase(),
      email:    this.form.value.email.trim().toLowerCase(),
      predicciones: Array.from(this.predicciones.entries()).map(
        ([partidoId, prediccion]) => ({ partidoId, prediccion })
      )
    };

    this.planillaService.guardar(request).subscribe({
      next: response => {
        this.planillaGuardada.set(response);
        this.guardando.set(false);
        this.toastService.success('¡Planilla guardada exitosamente!', 6000);
        
        // Scroll suave al mensaje de éxito
        setTimeout(() => {
          const exitoElement = document.querySelector('.planilla-exito');
          if (exitoElement) {
            exitoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      },
      error: err => {
        const mensaje = err.error?.error ?? 'Error al guardar la planilla. Intentá de nuevo.';
        this.errorMensaje.set(mensaje);
        this.toastService.error(mensaje, 6000);
        this.guardando.set(false);
      }
    });
  }

  nuevaPlanilla(): void {
    this.planillaGuardada.set(null);
    this.predicciones.clear();
    this._prediccionesVersion.update(v => v + 1);
    this.form.reset();
    this.toastService.info('Formulario reiniciado. Podés cargar una nueva planilla.');
    
    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
