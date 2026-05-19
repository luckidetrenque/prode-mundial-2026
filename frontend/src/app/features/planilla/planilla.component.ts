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

      // 1. Fondo de la tarjeta (Off-white con gradiente sutil)
      const gradient = ctx.createLinearGradient(0, 0, 1200, 700);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(1, '#f5f7fa');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1200, 700);

      // 2. Líneas tácticas de fútbol decorativas en verde sumamente sutil (marca de agua)
      ctx.strokeStyle = 'rgba(46, 158, 45, 0.03)';
      ctx.lineWidth = 3;
      // Círculo central
      ctx.beginPath();
      ctx.arc(600, 380, 150, 0, 2 * Math.PI);
      ctx.stroke();
      // Línea media
      ctx.beginPath();
      ctx.moveTo(600, 130);
      ctx.lineTo(600, 630);
      ctx.stroke();
      // Áreas de penal
      ctx.beginPath();
      ctx.rect(-50, 230, 230, 300);
      ctx.stroke();
      ctx.beginPath();
      ctx.rect(1020, 230, 230, 300);
      ctx.stroke();

      // 3. Cabecera (Estilo Navbar del Sitio)
      // Rectángulo azul de la barra de navegación (#2A398D)
      ctx.fillStyle = '#2A398D';
      ctx.beginPath();
      const rx = 20, ry = 20, rw = 1160, rh = 90, rad = 12;
      ctx.moveTo(rx + rad, ry);
      ctx.lineTo(rx + rw - rad, ry);
      ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rad);
      ctx.lineTo(rx + rw, ry + rh);
      ctx.lineTo(rx, ry + rh);
      ctx.lineTo(rx, ry + rad);
      ctx.quadraticCurveTo(rx, ry, rx + rad, ry);
      ctx.closePath();
      ctx.fill();

      // Borde exterior de la tarjeta en azul (#2A398D)
      ctx.strokeStyle = '#2A398D';
      ctx.lineWidth = 6;
      ctx.strokeRect(20, 20, 1160, 660);

      // Línea dorada divisoria debajo de la cabecera (#d4a017)
      ctx.fillStyle = '#d4a017';
      ctx.fillRect(20, 110, 1160, 4);

      // Texto de la Cabecera "PRODE MUNDIAL 2026"
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 42px 'Barlow Condensed', Arial, sans-serif";
      ctx.fillText('PRODE MUNDIAL 2026', 600, 65);

      // 4. Caja principal de contenido (Estilo Glass / Tarjeta del Sitio)
      const cardX = 80;
      const cardY = 160;
      const cardW = 1040;
      const cardH = 390;
      const cardR = 16;
      
      // Sombra sutil para la tarjeta blanca
      ctx.shadowColor = 'rgba(0, 0, 0, 0.05)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 5;
      
      ctx.fillStyle = '#ffffff';
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

      // Borde de la tarjeta blanca
      ctx.shadowColor = 'transparent'; // Desactivar sombra para el trazo
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 5. Contenido de Datos
      ctx.textBaseline = 'top';

      // Columna Izquierda (Datos del Participante)
      ctx.textAlign = 'left';

      // Título Sección Participante
      ctx.fillStyle = '#6b7a80'; // Muted
      ctx.font = "bold 15px 'DM Sans', Arial, sans-serif";
      ctx.fillText('DATOS DEL PARTICIPANTE', 140, 205);

      // Nombre y Apellido (Azul de identidad y negrita)
      ctx.fillStyle = '#2A398D';
      ctx.font = "bold 32px 'DM Sans', Arial, sans-serif";
      const nameText = `${planilla.nombre} ${planilla.apellido}`.toUpperCase();
      ctx.fillText(nameText, 140, 235);

      // Email
      ctx.fillStyle = '#6b7a80'; // Muted
      ctx.font = "bold 15px 'DM Sans', Arial, sans-serif";
      ctx.fillText('EMAIL REGISTRADO', 140, 325);

      ctx.fillStyle = '#474A4A'; // Body text color
      ctx.font = "500 24px 'DM Sans', Arial, sans-serif";
      ctx.fillText(planilla.email.toLowerCase(), 140, 355);

      // Estado "PENDIENTE DE CONFIRMACIÓN"
      // Caja/Badge verde como en el sitio
      const badgeX = 140;
      const badgeY = 445;
      const badgeW = 340;
      const badgeH = 46;
      const badgeR = 8;
      
      ctx.fillStyle = '#e8f8ef'; // verde claro bg
      ctx.beginPath();
      ctx.moveTo(badgeX + badgeR, badgeY);
      ctx.lineTo(badgeX + badgeW - badgeR, badgeY);
      ctx.quadraticCurveTo(badgeX + badgeW, badgeY, badgeX + badgeW, badgeY + badgeR);
      ctx.lineTo(badgeX + badgeW, badgeY + badgeH - badgeR);
      ctx.quadraticCurveTo(badgeX + badgeW, badgeY + badgeH, badgeX + badgeW - badgeR, badgeY + badgeH);
      ctx.lineTo(badgeX + badgeR, badgeY + badgeH);
      ctx.quadraticCurveTo(badgeX, badgeY + badgeH, badgeX, badgeY + badgeH - badgeR);
      ctx.lineTo(badgeX, badgeY + badgeR);
      ctx.quadraticCurveTo(badgeX, badgeY, badgeX + badgeR, badgeY);
      ctx.closePath();
      ctx.fill();

      // Borde del badge verde
      ctx.strokeStyle = '#1a7a4a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Círculo del check en verde
      ctx.beginPath();
      ctx.arc(175, 468, 11, 0, 2 * Math.PI);
      ctx.fillStyle = '#1a7a4a';
      ctx.fill();
      // Dibujar checkmark blanca adentro del círculo
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(170, 468);
      ctx.lineTo(174, 472);
      ctx.lineTo(180, 464);
      ctx.stroke();

      // Texto de estado
      ctx.fillStyle = '#1a7a4a';
      ctx.font = "bold 15px 'DM Sans', Arial, sans-serif";
      ctx.fillText('PENDIENTE DE CONFIRMACIÓN', 200, 458);

      // Línea divisoria vertical
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(600, 200);
      ctx.lineTo(600, 510);
      ctx.stroke();

      // Columna Derecha (Código de Planilla estilo Cupón / Ticket)
      ctx.textAlign = 'center';

      ctx.fillStyle = '#6b7a80';
      ctx.font = "bold 15px 'DM Sans', Arial, sans-serif";
      ctx.fillText('NÚMERO DE PLANILLA', 870, 205);

      // Caja troquelada / dashed roja para el código (idéntico a la web)
      const ticketX = 690;
      const ticketY = 235;
      const ticketW = 360;
      const ticketH = 150;
      const ticketR = 12;

      ctx.fillStyle = '#f8f9fa'; // color de fondo
      ctx.beginPath();
      ctx.moveTo(ticketX + ticketR, ticketY);
      ctx.lineTo(ticketX + ticketW - ticketR, ticketY);
      ctx.quadraticCurveTo(ticketX + ticketW, ticketY, ticketX + ticketW, ticketY + ticketR);
      ctx.lineTo(ticketX + ticketW, ticketY + ticketH - ticketR);
      ctx.quadraticCurveTo(ticketX + ticketW, ticketY + ticketH, ticketX + ticketW - ticketR, ticketY + ticketH);
      ctx.lineTo(ticketX + ticketR, ticketY + ticketH);
      ctx.quadraticCurveTo(ticketX, ticketY + ticketH, ticketX, ticketY + ticketH - ticketR);
      ctx.lineTo(ticketX, ticketY + ticketR);
      ctx.quadraticCurveTo(ticketX, ticketY, ticketX + ticketR, ticketY);
      ctx.closePath();
      ctx.fill();

      // Borde de guiones (dashed) en color rojo acción del sitio (#c0171d)
      ctx.strokeStyle = '#c0171d';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]); // Reset

      // El código de planilla en fuente Barlow Condensed gigante y color rojo (#c0171d)
      ctx.fillStyle = '#c0171d';
      ctx.font = "bold 64px 'Barlow Condensed', Arial, sans-serif";
      ctx.textBaseline = 'middle';
      ctx.fillText(String(planilla.codigo), 870, 310);

      // Info debajo del código
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#474A4A';
      ctx.font = "14px 'DM Sans', Arial, sans-serif";
      ctx.fillText('Presentá este número al administrador', 870, 420);
      ctx.fillText('para registrar y confirmar tu planilla.', 870, 442);

      // 6. Pie de página del comprobante
      ctx.textAlign = 'center';
      ctx.fillStyle = '#6b7a80';
      ctx.font = "500 14px 'DM Sans', Arial, sans-serif";
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
      ctx.fillText(`Comprobante generado el ${dateStr} · Prode Mundial 2026`, 600, 610);

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