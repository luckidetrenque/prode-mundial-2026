// src/app/features/planilla-detalle/planilla-detalle.component.ts
//
// CAMBIO vs versión anterior:
//   - Se agrega getEquiposDelGrupo() — mismo patrón que fixture y planilla
//   - Se agrega ShortCountryPipe a imports
//   - El HTML del group-caption ahora incluye el bloque .group-teams-mobile
//     con banderas + nombres abreviados, visible solo en mobile (≤576px)
//     mediante los estilos ya definidos en el .css del componente.

import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PlanillaService } from '../../core/services/planilla.service';
import { PartidoService } from '../../core/services/partido.service';
import { ResultadoService } from '../../core/services/resultado.service';
import { PlanillaResponse, ResultadoPrediccion } from '../../shared/models/planilla.model';
import { Resultado } from '../../shared/models/resultado.model';
import { Partido } from '../../shared/models/partido.model';
import { ShortCountryPipe } from '../../shared/pipes/short-country.pipe';
import { forkJoin } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TorneoService } from '../../core/services/torneo.service';
import { SplashBienvenidaComponent } from '../../shared/components/splash-bienvenida/splash-bienvenida.component';

const GRUPOS_2026 = ['A','B','C','D','E','F','G','H','I','J','K','L'];

@Component({
  selector: 'app-planilla-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, ShortCountryPipe, SplashBienvenidaComponent],
  templateUrl: './planilla-detalle.component.html',
  styleUrl: './planilla-detalle.component.css'
})
export class PlanillaDetalleComponent implements OnInit {

  torneoService = inject(TorneoService);

  cargando     = signal(true);
  planilla     = signal<PlanillaResponse | null>(null);
  partidos     = signal<Partido[]>([]);
  resultados   = signal<Resultado[]>([]);
  errorMensaje = signal<string | null>(null);
  grupos       = GRUPOS_2026;

  prediccionesMap = computed(() => {
    const p = this.planilla();
    const map = new Map<number, ResultadoPrediccion>();
    if (p?.predicciones) {
      p.predicciones.forEach(item => map.set(item.partidoId, item.prediccion));
    }
    return map;
  });

  resultadosMap = computed(() => {
    const res = this.resultados();
    const map = new Map<number, ResultadoPrediccion>();
    res.forEach(item => map.set(item.partido.id, item.resultado));
    return map;
  });

  constructor(
    private route: ActivatedRoute,
    private planillaService: PlanillaService,
    private partidoService: PartidoService,
    private resultadoService: ResultadoService
  ) {}

  ngOnInit(): void {
    const codigoStr = this.route.snapshot.paramMap.get('codigo');
    const codigo    = Number(codigoStr);

    if (!codigoStr || isNaN(codigo)) {
      this.errorMensaje.set('Código de planilla inválido.');
      this.cargando.set(false);
      return;
    }

    forkJoin({
      planilla:   this.planillaService.obtener(codigo),
      partidos:   this.partidoService.getPartidos(),
      resultados: this.resultadoService.getResultados()
    }).subscribe({
      next: ({ planilla, partidos, resultados }) => {
        this.planilla.set(planilla);
        this.partidos.set(partidos.filter(p => p.fase === 'GRUPOS'));
        this.resultados.set(resultados);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando detalle:', err);
        this.errorMensaje.set('No se encontró la planilla o hubo un error al cargar los datos.');
        this.cargando.set(false);
      }
    });
  }

  getPartidosPorGrupo(grupo: string): Partido[] {
    return this.partidos().filter(p => p.grupo === grupo);
  }

  /** Devuelve los 4 equipos únicos del grupo con su bandera.
   *  Mismo patrón que fixture.component.ts y planilla.component.ts. */
  getEquiposDelGrupo(grupo: string): { nombre: string; bandera: string }[] {
    const partidos = this.getPartidosPorGrupo(grupo);
    const equipos  = new Map<string, string>();
    partidos.forEach(p => {
      if (p.equipoLocalShow)     equipos.set(p.equipoLocalShow,     p.equipoLocalBandera);
      if (p.equipoVisitanteShow) equipos.set(p.equipoVisitanteShow, p.equipoVisitanteBandera);
    });
    return Array.from(equipos.entries()).map(([nombre, bandera]) => ({ nombre, bandera }));
  }

  getPrediccion(partidoId: number): ResultadoPrediccion | null {
    return this.prediccionesMap().get(partidoId) ?? null;
  }

  getResultadoReal(partidoId: number): ResultadoPrediccion | null {
    return this.resultadosMap().get(partidoId) ?? null;
  }

  esAcierto(partidoId: number): boolean {
    const pred = this.getPrediccion(partidoId);
    const real = this.getResultadoReal(partidoId);
    return pred !== null && real !== null && pred === real;
  }

  esDesacierto(partidoId: number): boolean {
    const pred = this.getPrediccion(partidoId);
    const real = this.getResultadoReal(partidoId);
    return pred !== null && real !== null && pred !== real;
  }

  descargarPDF(): void {
    const p = this.planilla();
    if (!p) return;

    const doc       = new jsPDF();
    const margin    = 14;
    const pageWidth = doc.internal.pageSize.width;

    doc.setFillColor(42, 57, 141);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('PRODE MUNDIAL 2026', margin, 17);

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PARTICIPANTE', margin, 35);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`${p.nombre} ${p.apellido}`, margin, 44);

    const rightCol = pageWidth - 80;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE REGISTRO', rightCol, 35);
    doc.setFont('helvetica', 'normal');
    doc.text('Número de Planilla:', rightCol, 42);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(192, 23, 29);
    doc.text(`${p.codigo}`, rightCol + 35, 42);

    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'normal');
    doc.text('Estado:', rightCol, 48);
    if (p.confirmada) {
      doc.setTextColor(60, 172, 59);
      doc.text('CONFIRMADA', rightCol + 15, 48);
    } else {
      doc.setTextColor(150, 150, 150);
      doc.text('PENDIENTE', rightCol + 15, 48);
    }

    doc.setDrawColor(220, 220, 220);
    doc.line(margin, 55, pageWidth - margin, 55);

    const rowToPartidoId = new Map<number, number>();
    let rowIndex = 0;
    this.grupos.forEach(grupo => {
      rowIndex++;
      const partidosGrupo = this.getPartidosPorGrupo(grupo);
      partidosGrupo.forEach(partido => {
        rowToPartidoId.set(rowIndex, partido.id);
        rowIndex++;
      });
    });

    const tableData: any[] = [];
    this.grupos.forEach(grupo => {
      const partidosGrupo = this.getPartidosPorGrupo(grupo);
      tableData.push([{
        content: `GRUPO ${grupo}`,
        colSpan: 4,
        styles: {
          fillColor: [240, 240, 240],
          textColor: [42, 57, 141],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 10
        }
      }]);

      partidosGrupo.forEach(partido => {
        const acierto    = this.esAcierto(partido.id);
        const desacierto = this.esDesacierto(partido.id);
        const real       = this.getResultadoReal(partido.id);
        let rowStyles    = {};
        if (real !== null) {
          if (acierto)    rowStyles = { fillColor: [239, 248, 239] };
          else if (desacierto) rowStyles = { fillColor: [253, 237, 238] };
        }
        const numeroText = partido.multiplicador > 1
          ? `${partido.numero} (x2)`
          : String(partido.numero);

        tableData.push([
          { content: numeroText,               styles: { halign: 'center', ...rowStyles } },
          { content: partido.equipoLocalShow,  styles: { halign: 'right',  ...rowStyles } },
          { content: '',                        styles: { halign: 'center', ...rowStyles } },
          { content: partido.equipoVisitanteShow, styles: { halign: 'left', ...rowStyles } }
        ]);
      });
    });

    autoTable(doc, {
      startY: 60,
      head: [['#', 'Equipo Local', 'Tu Predicción', 'Equipo Visitante']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [42, 57, 141], textColor: [255, 255, 255], halign: 'center' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 16 },
        1: { cellWidth: 63 },
        2: { cellWidth: 40 },
        3: { cellWidth: 63 }
      },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          const partidoId = rowToPartidoId.get(data.row.index);
          if (partidoId === undefined) return;
          const pred        = this.getPrediccion(partidoId);
          const docInstance = data.doc;
          const cell        = data.cell;
          const centerY     = cell.y + cell.height / 2;
          const centerX     = cell.x + cell.width / 2;
          const radius      = 2.4;
          const spacing     = 7.5;
          const xL = centerX - spacing;
          const xE = centerX;
          const xV = centerX + spacing;

          const drawOption = (
            x: number,
            label: string,
            isActive: boolean,
            activeColor: [number, number, number],
            activeBg: [number, number, number]
          ) => {
            if (isActive) {
              docInstance.setFillColor(activeBg[0], activeBg[1], activeBg[2]);
              docInstance.setDrawColor(activeColor[0], activeColor[1], activeColor[2]);
              docInstance.setLineWidth(0.3);
              docInstance.circle(x, centerY, radius, 'FD');
              docInstance.setTextColor(activeColor[0], activeColor[1], activeColor[2]);
            } else {
              docInstance.setFillColor(255, 255, 255);
              docInstance.setDrawColor(220, 220, 220);
              docInstance.setLineWidth(0.3);
              docInstance.circle(x, centerY, radius, 'FD');
              docInstance.setTextColor(200, 200, 200);
            }
            docInstance.setFont('helvetica', 'bold');
            docInstance.setFontSize(5.5);
            docInstance.text(label, x, centerY + 0.8, { align: 'center' });
          };

          drawOption(xL, 'L', pred === 'LOCAL',     [46, 158, 45],  [232, 248, 239]);
          drawOption(xE, 'E', pred === 'EMPATE',    [42, 57, 141],  [232, 234, 246]);
          drawOption(xV, 'V', pred === 'VISITANTE', [192, 23, 29],  [255, 235, 238]);
        }
      }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('Canadá · Estados Unidos · México 2026', pageWidth / 2, doc.internal.pageSize.height - 15, { align: 'center' });
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generado el ${new Date().toLocaleString()} - Página ${i} de ${pageCount}`,
        margin,
        doc.internal.pageSize.height - 10
      );
      doc.text('Prode Mundial 2026 - Sitio Oficial', pageWidth - margin, doc.internal.pageSize.height - 10, { align: 'right' });
    }

    doc.save(`Planilla_${p.codigo}_${p.nombre}_${p.apellido}.pdf`);
  }
}
