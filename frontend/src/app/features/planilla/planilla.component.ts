// src/app/features/planilla/planilla.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PartidoService } from '../../core/services/partido.service';
import { PlanillaService } from '../../core/services/planilla.service';
import { Partido } from '../../shared/models/partido.model';
import { PlanillaResponse, ResultadoPrediccion } from '../../shared/models/planilla.model';

const GRUPOS_2026 = ['A','B','C','D','E','F','G','H','I','J','K','L'];

@Component({
  selector: 'app-planilla',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './planilla.component.html',
  styleUrl: './planilla.component.css'
})
export class PlanillaComponent implements OnInit {

  cargando        = signal(true);
  guardando       = signal(false);
  errorMensaje    = signal<string | null>(null);
  planillaGuardada = signal<PlanillaResponse | null>(null);

  partidos: Partido[] = [];
  grupos = GRUPOS_2026;

  private predicciones = new Map<number, ResultadoPrediccion>();

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private partidoService: PartidoService,
    private planillaService: PlanillaService
  ) {
    this.form = this.fb.group({
      nombre:   ['', [Validators.required, Validators.maxLength(50)]],
      apellido: ['', [Validators.required, Validators.maxLength(50)]],
      afiliado: [null, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.partidoService.getPartidos().subscribe({
      next: partidos => {
        this.partidos = partidos.filter(p => p.fase === 'GRUPOS');
        this.cargando.set(false);
      },
      error: () => {
        this.errorMensaje.set('No se pudieron cargar los partidos. Intentá de nuevo.');
        this.cargando.set(false);
      }
    });
  }

  getPartidosPorGrupo(grupo: string): Partido[] {
    return this.partidos.filter(p => p.grupo === grupo);
  }

  seleccionar(partidoId: number, prediccion: ResultadoPrediccion): void {
    this.predicciones.set(partidoId, prediccion);
  }

  prediccionSeleccionada(partidoId: number): boolean {
    return this.predicciones.has(partidoId);
  }

  prediccionesCompletadas(): number { return this.predicciones.size; }
  totalPartidos(): number { return this.partidos.length; }

  formularioValido(): boolean {
    return this.form.valid && this.predicciones.size === this.partidos.length;
  }

  guardar(): void {
    if (!this.formularioValido()) return;
    this.guardando.set(true);
    this.errorMensaje.set(null);
    const request = {
      nombre:   this.form.value.nombre.toUpperCase(),
      apellido: this.form.value.apellido.toUpperCase(),
      afiliado: this.form.value.afiliado,
      predicciones: Array.from(this.predicciones.entries()).map(
        ([partidoId, prediccion]) => ({ partidoId, prediccion })
      )
    };
    this.planillaService.guardar(request).subscribe({
      next: response => { this.planillaGuardada.set(response); this.guardando.set(false); },
      error: err => { this.errorMensaje.set(err.error?.error ?? 'Error al guardar la planilla.'); this.guardando.set(false); }
    });
  }

  nuevaPlanilla(): void {
    this.planillaGuardada.set(null);
    this.predicciones.clear();
    this.form.reset();
  }
}
