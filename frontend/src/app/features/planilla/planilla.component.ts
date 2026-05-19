// planilla.component.ts
// FIX #17: Se elimina el hack _selVersion + Map no reactivo.
// Ahora las predicciones se guardan en un signal<Record<number, ResultadoPrediccion>>
// que Angular detecta automáticamente en los templates sin trucos adicionales.
// EDITAR PLANILLA: nuevo flow de búsqueda por código+email y actualización de predicciones.
import { Component, OnInit, signal, computed, inject, DestroyRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
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

// Modos de la vista planilla
type VistaMode = 'nueva' | 'exito' | 'buscar-editar' | 'editando';

@Component({
  selector: 'app-planilla',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './planilla.component.html',
  styleUrl: './planilla.component.css'
})
export class PlanillaComponent implements OnInit {

  private toastService = inject(ToastService);
  private platformId   = inject(PLATFORM_ID);

  cargando         = signal(true);
  guardando        = signal(false);
  errorMensaje     = signal<string | null>(null);
  planillaGuardada = signal<PlanillaResponse | null>(null);

  // ── Modo de vista ──────────────────────────────────────────────────────────
  vistaMode        = signal<VistaMode>('nueva');

  // ── Edición ────────────────────────────────────────────────────────────────
  buscandoPlanilla  = signal(false);
  errorBusqueda     = signal<string | null>(null);
  planillaAEditar   = signal<PlanillaResponse | null>(null);
  guardandoEdicion  = signal(false);
  edicionExitosa    = signal(false);

  partidos: Partido[] = [];
  grupos = GRUPOS_2026;

  /**
   * FIX #17: Las predicciones se almacenan en un signal<Record<number, ResultadoPrediccion>>.
   */
  private prediccionesSignal = signal<Record<number, ResultadoPrediccion>>({});

  form: FormGroup;
  formBusqueda: FormGroup;
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
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\.\\']+$/)
      ]],
      apellido: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\.\\']+$/)
      ]],
      email: ['', [Validators.required, emailValidator]]
    });

    // Formulario de búsqueda para edición
    this.formBusqueda = this.fb.group({
      codigoBusqueda: ['', [Validators.required, Validators.pattern(/^\d{7,9}$/)]],
      emailBusqueda:  ['', [Validators.required, emailValidator]]
    });

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

  seleccionar(partidoId: number, prediccion: ResultadoPrediccion): void {
    const id = Number(partidoId);
    this.prediccionesSignal.update(actual => {
      const copia = { ...actual };
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

  getPrediccion(partidoId: number): ResultadoPrediccion | null {
    return this.prediccionesSignal()[Number(partidoId)] ?? null;
  }

  prediccionSeleccionada(partidoId: number): boolean {
    return !!this.prediccionesSignal()[Number(partidoId)];
  }

  prediccionesCompletadas = computed(() => {
    const pred = this.prediccionesSignal();
    return this.partidos.filter(p => !!pred[p.id]).length;
  });

  totalPartidos(): number { return this.partidos.length; }

  formularioValido = computed(() => {
    const formValid = this.formValidezSignal();
    const pred = this.prediccionesSignal();
    const partidosCompletos = this.partidos.length > 0 &&
                             this.partidos.every(p => !!pred[p.id]);
    return formValid && partidosCompletos;
  });

  prediccionesEditarCompletas = computed(() => {
    const pred = this.prediccionesSignal();
    return this.partidos.length > 0 && this.partidos.every(p => !!pred[p.id]);
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
        this.vistaMode.set('exito');
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
    this.vistaMode.set('nueva');
    this.toastService.info('Formulario reiniciado. Podés cargar una nueva planilla.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Flow de edición ────────────────────────────────────────────────────────

  irAEditarPlanilla(): void {
    this.vistaMode.set('buscar-editar');
    this.formBusqueda.reset();
    this.errorBusqueda.set(null);
    this.planillaAEditar.set(null);
    this.edicionExitosa.set(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  buscarPlanillaParaEditar(): void {
    if (this.formBusqueda.invalid) {
      this.formBusqueda.markAllAsTouched();
      return;
    }

    const codigo = Number(this.formBusqueda.value.codigoBusqueda);
    const email  = this.formBusqueda.value.emailBusqueda.trim();

    this.buscandoPlanilla.set(true);
    this.errorBusqueda.set(null);

    this.planillaService.buscar(codigo, email).subscribe({
      next: planilla => {
        if (planilla.confirmada) {
          this.errorBusqueda.set('Esta planilla ya fue confirmada y no puede editarse.');
          this.buscandoPlanilla.set(false);
          return;
        }
        this.planillaAEditar.set(planilla);

        // Pre-cargar predicciones existentes
        if (planilla.predicciones) {
          const pred: Record<number, ResultadoPrediccion> = {};
          planilla.predicciones.forEach((p: any) => {
            pred[p.partidoId] = p.prediccion as ResultadoPrediccion;
          });
          this.prediccionesSignal.set(pred);
        }

        this.buscandoPlanilla.set(false);
        this.vistaMode.set('editando');
        this.toastService.success(`Planilla de ${planilla.nombre} ${planilla.apellido} cargada. Ya podés editar.`);
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
      },
      error: err => {
        const msg = err.error?.error ?? 'No se pudo encontrar la planilla. Verificá los datos ingresados.';
        this.errorBusqueda.set(msg);
        this.buscandoPlanilla.set(false);
      }
    });
  }

  guardarEdicion(): void {
    if (!this.prediccionesEditarCompletas()) {
      this.toastService.warning('Completá todas las predicciones antes de guardar los cambios.');
      return;
    }

    const planilla = this.planillaAEditar();
    if (!planilla) return;

    const pred = this.prediccionesSignal();
    const payload: any = {
      codigo: planilla.codigo,
      email:  planilla.email,
      predicciones: Object.entries(pred).map(([partidoId, prediccion]) => ({
        partidoId: Number(partidoId),
        prediccion
      }))
    };

    this.guardandoEdicion.set(true);

    this.planillaService.editar(planilla.codigo, payload).subscribe({
      next: response => {
        this.guardandoEdicion.set(false);
        this.edicionExitosa.set(true);
        this.toastService.success('¡Planilla actualizada correctamente!', 6000);
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
      },
      error: err => {
        const msg = err.error?.error ?? 'Error al guardar los cambios. Intentá de nuevo.';
        this.toastService.error(msg, 6000);
        this.guardandoEdicion.set(false);
      }
    });
  }

  descargarComprobante(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const planilla = this.planillaGuardada();
    if (!planilla) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 700;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Fondo gradiente
      const gradient = ctx.createLinearGradient(0, 0, 1200, 700);
      gradient.addColorStop(0, '#0a2710');
      gradient.addColorStop(0.5, '#123f1b');
      gradient.addColorStop(1, '#0c220f');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1200, 700);

      // 2. Dibujar líneas de fútbol decorativas (semi-transparentes)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 4;
      // Círculo central
      ctx.beginPath();
      ctx.arc(600, 350, 150, 0, 2 * Math.PI);
      ctx.stroke();
      // Línea media
      ctx.beginPath();
      ctx.moveTo(600, 0);
      ctx.lineTo(600, 700);
      ctx.stroke();
      // Áreas de penal
      ctx.beginPath();
      ctx.rect(-50, 180, 230, 340);
      ctx.stroke();
      ctx.beginPath();
      ctx.rect(1020, 180, 230, 340);
      ctx.stroke();

      // O y X tácticos decorativos
      ctx.font = "bold 24px Arial";
      ctx.fillStyle = 'rgba(212, 160, 23, 0.15)'; // dorado suave
      ctx.fillText('X', 450, 280);
      ctx.fillText('O', 520, 420);
      ctx.fillText('X', 750, 430);
      ctx.fillText('O', 680, 250);

      // Línea de pase punteada
      ctx.strokeStyle = 'rgba(212, 160, 23, 0.15)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(530, 410);
      ctx.quadraticCurveTo(600, 450, 740, 425);
      ctx.stroke();
      ctx.setLineDash([]); // reset

      // 3. Bordes elegantes
      ctx.strokeStyle = '#d4a017'; // dorado
      ctx.lineWidth = 8;
      ctx.strokeRect(20, 20, 1160, 660);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.strokeRect(32, 32, 1136, 636);

      // 4. Logo y cabecera
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      // Título "PRODE MUNDIAL 2026"
      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 52px 'Barlow Condensed', Arial, sans-serif";
      ctx.fillText('PRODE MUNDIAL 2026', 600, 70);

      // Badge de tipo de documento
      const badgeText = 'COMPROBANTE OFICIAL DE PLANILLA';
      ctx.font = "bold 16px 'DM Sans', Arial, sans-serif";
      const badgeW = ctx.measureText(badgeText).width + 30;
      const bx = 600 - badgeW / 2;
      const by = 145;
      const bh = 34;
      const r = 17;
      ctx.fillStyle = '#d4a017';
      ctx.beginPath();
      ctx.moveTo(bx + r, by);
      ctx.lineTo(bx + badgeW - r, by);
      ctx.quadraticCurveTo(bx + badgeW, by, bx + badgeW, by + r);
      ctx.lineTo(bx + badgeW, by + bh - r);
      ctx.quadraticCurveTo(bx + badgeW, by + bh, bx + badgeW - r, by + bh);
      ctx.lineTo(bx + r, by + bh);
      ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r);
      ctx.lineTo(bx, by + r);
      ctx.quadraticCurveTo(bx, by, bx + r, by);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#0a2710';
      ctx.fillText(badgeText, 600, 153);

      // 5. Contenedor principal de datos
      const cardX = 120;
      const cardY = 215;
      const cardW = 960;
      const cardH = 340;
      const cardR = 15;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(cardX + cardR, cardY);
      ctx.lineTo(cardX + cardW - cardR, cardY);
      ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + cardR);
      ctx.lineTo(cardX + cardW, cardY + cardH - cardR);
      ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - cardR, cardY + cardH);
      ctx.lineTo(cardX + cardR, cardY + cardH);
      ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - cardR);
      ctx.lineTo(cardX, cardY + cardR);
      ctx.quadraticCurveTo(cardX, cardY, cardX + cardR, cardY);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Textos - Columna izquierda (Datos del Participante)
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = "600 18px 'DM Sans', Arial, sans-serif";
      ctx.fillText('PARTICIPANTE', 170, 255);

      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 34px 'DM Sans', Arial, sans-serif";
      const nameStr = `${planilla.nombre} ${planilla.apellido}`.toUpperCase();
      ctx.fillText(nameStr, 170, 285);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = "600 18px 'DM Sans', Arial, sans-serif";
      ctx.fillText('EMAIL REGISTRADO', 170, 365);

      ctx.fillStyle = '#ffffff';
      ctx.font = "500 24px 'DM Sans', Arial, sans-serif";
      ctx.fillText(planilla.email.toLowerCase(), 170, 395);

      // Línea vertical divisoria
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.moveTo(630, 245);
      ctx.lineTo(630, 525);
      ctx.stroke();

      // Textos - Columna derecha (Código e Información)
      ctx.textAlign = 'center';

      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = "600 18px 'DM Sans', Arial, sans-serif";
      ctx.fillText('NÚMERO DE PLANILLA', 870, 255);

      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 64px 'Barlow Condensed', Arial, sans-serif";
      ctx.fillText(String(planilla.codigo), 870, 285);

      ctx.fillStyle = '#d4a017';
      ctx.font = "bold 20px 'DM Sans', Arial, sans-serif";
      ctx.fillText('PENDIENTE DE CONFIRMACIÓN', 870, 395);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.font = "14px 'DM Sans', Arial, sans-serif";
      ctx.fillText('Presentá este número al administrador', 870, 435);
      ctx.fillText('para registrar y confirmar tu planilla.', 870, 455);

      // 6. Pie de página del comprobante
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = "italic 15px 'DM Sans', Arial, sans-serif";
      ctx.fillText('Podés editar tus pronósticos con tu código y tu email antes de ser confirmada.', 600, 580);

      const dateStr = new Date().toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      ctx.font = "13px 'DM Sans', Arial, sans-serif";
      ctx.fillText(`Comprobante generado el ${dateStr} · Prode Mundial 2026`, 600, 615);

      // Descarga de la imagen
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `comprobante-prode-${planilla.codigo}.png`;
      link.href = dataUrl;
      link.click();
      this.toastService.success('Comprobante descargado con éxito.');
    } catch (err) {
      console.error('Error al generar el comprobante:', err);
      this.toastService.error('Ocurrió un error al intentar descargar el comprobante.');
    }
  }

  volverAlInicio(): void {
    this.vistaMode.set('nueva');
    this.prediccionesSignal.set({});
    this.planillaAEditar.set(null);
    this.edicionExitosa.set(false);
    this.formBusqueda.reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}