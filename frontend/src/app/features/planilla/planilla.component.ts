// planilla.component.ts
// FIX #17: Se elimina el hack _selVersion + Map no reactivo.
// Ahora las predicciones se guardan en un signal<Record<number, ResultadoPrediccion>>
// que Angular detecta automáticamente en los templates sin trucos adicionales.
import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { startWith } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { PartidoService } from '../../core/services/partido.service';
import { PlanillaService } from '../../core/services/planilla.service';
import { ToastService } from '../../core/services/toast.service';
import { Partido } from '../../shared/models/partido.model';
import { PlanillaResponse, ResultadoPrediccion } from '../../shared/models/planilla.model';

const GRUPOS_2026 = ['A','B','C','D','E','F','G','H','I','J','K','L'];

function emailValidator(control: any) {
  if (!control.value) return null;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(control.value) ? null : { invalidEmail: true };
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

  /**
   * FIX #17: Las predicciones se almacenan en un signal<Record<number, ResultadoPrediccion>>.
   *
   * Problema anterior: Map<number, string> no es reactivo — Angular no detecta
   * cambios internos al Map, por eso existía el hack _selVersion que forzaba
   * un re-render manual incrementando un signal auxiliar en cada mutación.
   *
   * Solución: Record (objeto plano) SÍ es compatible con la detección de cambios
   * de Angular cuando se reemplaza la referencia completa con signal.update().
   * No se necesitan signals auxiliares ni void calls.
   */
  private prediccionesSignal = signal<Record<number, ResultadoPrediccion>>({});

  form: FormGroup;
  private formValidezSignal = signal(false);
  private destroyRef = inject(DestroyRef);

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
        // Regex más permisivo para nombres (admite guiones, apóstrofes, puntos y espacios)
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\.\']+$/)
      ]],
      apellido: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\.\']+$/)
      ]],
      email: ['', [Validators.required, emailValidator]]
    });

    // Escuchamos los cambios de estado del formulario para que el signal computed reaccione
    this.form.statusChanges.pipe(
      startWith(this.form.status),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(status => {
      this.formValidezSignal.set(status === 'VALID');
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

  getEquiposDelGrupo(grupo: string): { nombre: string, bandera: string }[] {
    const partidos = this.getPartidosPorGrupo(grupo);
    const equipos = new Map<string, string>();
    partidos.forEach(p => {
      if (p.equipoLocalShow) equipos.set(p.equipoLocalShow, p.equipoLocalBandera);
      if (p.equipoVisitanteShow) equipos.set(p.equipoVisitanteShow, p.equipoVisitanteBandera);
    });
    return Array.from(equipos.entries()).map(([nombre, bandera]) => ({ nombre, bandera }));
  }

  // FIX #17: reemplaza la referencia del objeto para disparar reactividad
  seleccionar(partidoId: number, prediccion: ResultadoPrediccion): void {
    const id = Number(partidoId);
    this.prediccionesSignal.update(actual => {
      const copia = { ...actual };
      // MEJORA: No hacemos toggle si es la misma opción. 
      // Si el usuario hace click en lo que ya está seleccionado, queda seleccionado.
      // Esto evita confusiones y el "a veces se marca y otras no".
      copia[id] = prediccion;
      return copia;
    });
  }

  autocompletar(): void {
    const opciones: ResultadoPrediccion[] = ['LOCAL', 'EMPATE', 'VISITANTE'];
    let completados = 0;

    this.prediccionesSignal.update(actual => {
      const copia = { ...actual };
      this.partidos.forEach(p => {
        if (!copia[p.id]) {
          copia[p.id] = opciones[Math.floor(Math.random() * opciones.length)];
          completados++;
        }
      });
      return copia;
    });

    if (completados > 0) {
      this.toastService.success(
        `¡Listo! Se completaron ${completados} predicción${completados !== 1 ? 'es' : ''} automáticamente.`
      );
    } else {
      this.toastService.info('Ya tenés todas las predicciones completas.');
    }
  }

  resetearPlanilla(): void {
    if (Object.keys(this.prediccionesSignal()).length === 0) return;
    this.prediccionesSignal.set({});
    this.toastService.info('Se han borrado todas tus predicciones.');
  }

  resetearGrupo(grupo: string): void {
    const idsGrupo = this.getPartidosPorGrupo(grupo).map(p => p.id);
    this.prediccionesSignal.update(actual => {
      const copia = { ...actual };
      idsGrupo.forEach(id => delete copia[id]);
      return copia;
    });
    this.toastService.info(`Grupo ${grupo} reiniciado.`);
  }

  grupoCompletado(grupo: string): boolean {
    const partidos = this.getPartidosPorGrupo(grupo);
    return partidos.length > 0 && partidos.every(p => this.prediccionSeleccionada(p.id));
  }

  // FIX #17: computed signals leen prediccionesSignal reactivamente — sin hacks
  getPrediccion(partidoId: number): ResultadoPrediccion | null {
    return this.prediccionesSignal()[Number(partidoId)] ?? null;
  }

  prediccionSeleccionada(partidoId: number): boolean {
    return !!this.prediccionesSignal()[Number(partidoId)];
  }

  prediccionesCompletadas = computed(() => {
    const pred = this.prediccionesSignal();
    // Contamos solo las predicciones de partidos que realmente existen en nuestro listado
    return this.partidos.filter(p => !!pred[p.id]).length;
  });

  totalPartidos(): number { return this.partidos.length; }

  formularioValido = computed(() => {
    const formValid = this.formValidezSignal(); // Dependencia reactiva del formulario
    const pred = this.prediccionesSignal();
    // Verificamos que CADA partido del listado tenga una predicción
    const partidosCompletos = this.partidos.length > 0 && 
                             this.partidos.every(p => !!pred[p.id]);
    
    return formValid && partidosCompletos;
  });

  getErrorMensaje(campo: string): string {
    const control = this.form.get(campo);
    if (!control || !control.errors || !control.touched) return '';
    if (control.errors['required'])   return `El ${campo} es obligatorio`;
    if (control.errors['minlength'])  return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength'])  return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['pattern'])    return `Solo se permiten letras y espacios`;
    if (control.errors['invalidEmail']) return `El email no es válido`;
    return 'Campo inválido';
  }

  guardar(): void {
    const pred = this.prediccionesSignal();
    if (Object.keys(pred).length !== this.partidos.length) {
      this.toastService.warning('Completá todas las predicciones antes de guardar.');
      return;
    }
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this.toastService.error('Revisá los datos del formulario. Hay campos con errores.');
      
      // MEJORA: Focus automático en el primer campo inválido
      setTimeout(() => {
        const firstInvalid = document.querySelector('.ng-invalid[formControlName], .ng-invalid[formControl]');
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (firstInvalid as HTMLElement).focus();
        }
      }, 100);
      return;
    }

    this.guardando.set(true);
    this.errorMensaje.set(null);

    const request = {
      nombre:   this.form.value.nombre.trim().toUpperCase(),
      apellido: this.form.value.apellido.trim().toUpperCase(),
      email:    this.form.value.email.trim().toLowerCase(),
      predicciones: Object.entries(pred).map(([partidoId, prediccion]) => ({
        partidoId: Number(partidoId),
        prediccion
      }))
    };

    this.planillaService.guardar(request).subscribe({
      next: response => {
        this.planillaGuardada.set(response);
        this.guardando.set(false);
        this.toastService.success('¡Planilla guardada exitosamente!', 6000);
        setTimeout(() => {
          document.querySelector('.planilla-exito')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    this.prediccionesSignal.set({});
    this.form.reset();
    this.toastService.info('Formulario reiniciado. Podés cargar una nueva planilla.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}