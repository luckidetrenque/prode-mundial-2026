import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PlanillaService } from '../../core/services/planilla.service';
import { PartidoService } from '../../core/services/partido.service';
import { PlanillaResponse, ResultadoPrediccion } from '../../shared/models/planilla.model';
import { Partido } from '../../shared/models/partido.model';
import { forkJoin } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const GRUPOS_2026 = ['A','B','C','D','E','F','G','H','I','J','K','L'];

@Component({
  selector: 'app-planilla-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './planilla-detalle.component.html',
  styleUrl: './planilla-detalle.component.css'
})
export class PlanillaDetalleComponent implements OnInit {

  cargando = signal(true);
  planilla = signal<PlanillaResponse | null>(null);
  partidos = signal<Partido[]>([]);
  errorMensaje = signal<string | null>(null);
  grupos = GRUPOS_2026;

  // Mapa para búsqueda rápida: partidoId -> prediccion
  prediccionesMap = computed(() => {
    const p = this.planilla();
    const map = new Map<number, ResultadoPrediccion>();
    if (p?.predicciones) {
      p.predicciones.forEach(item => map.set(item.partidoId, item.prediccion));
    }
    return map;
  });

  constructor(
    private route: ActivatedRoute,
    private planillaService: PlanillaService,
    private partidoService: PartidoService
  ) {}

  ngOnInit(): void {
    const codigoStr = this.route.snapshot.paramMap.get('codigo');
    const codigo = Number(codigoStr);
    
    if (!codigoStr || isNaN(codigo)) {
      this.errorMensaje.set('Código de planilla inválido.');
      this.cargando.set(false);
      return;
    }

    // Cargamos planilla y partidos en paralelo para asegurar consistencia
    forkJoin({
      planilla: this.planillaService.obtener(codigo),
      partidos: this.partidoService.getPartidos()
    }).subscribe({
      next: ({ planilla, partidos }) => {
        this.planilla.set(planilla);
        this.partidos.set(partidos.filter(p => p.fase === 'GRUPOS'));
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

  getPrediccion(partidoId: number): ResultadoPrediccion | null {
    return this.prediccionesMap().get(partidoId) ?? null;
  }

  descargarPDF(): void {
    const p = this.planilla();
    if (!p) return;

    const doc = new jsPDF();
    const margin = 14;

    // Título
    doc.setFontSize(20);
    doc.setTextColor(134, 18, 51); // Color institucional (bordó)
    doc.text('PRODE MUNDIAL 2026', margin, 20);

    // Subtítulo / Info Planilla
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text(`Planilla N°: ${p.codigo}`, margin, 30);
    doc.text(`Participante: ${p.nombre} ${p.apellido}`, margin, 37);
    doc.text(`Afiliado: ${p.afiliado}`, margin, 44);
    doc.text(`Estado: ${p.confirmada ? 'CONFIRMADA' : 'PENDIENTE'}`, margin, 51);

    const tableData: any[] = [];
    
    this.grupos.forEach(grupo => {
      const partidosGrupo = this.getPartidosPorGrupo(grupo);
      
      // Fila de encabezado de grupo
      tableData.push([
        { content: `GRUPO ${grupo}`, colSpan: 4, styles: { fillColor: [56, 120, 135], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' } }
      ]);

      partidosGrupo.forEach(partido => {
        const pred = this.getPrediccion(partido.id);
        let predText = '-';
        if (pred === 'LOCAL') predText = 'LOCAL (L)';
        else if (pred === 'EMPATE') predText = 'EMPATE (E)';
        else if (pred === 'VISITANTE') predText = 'VISITANTE (V)';

        tableData.push([
          partido.numero,
          partido.equipoLocalShow,
          predText,
          partido.equipoVisitanteShow
        ]);
      });
    });

    autoTable(doc, {
      startY: 60,
      head: [['#', 'Local', 'Predicción', 'Visitante']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [134, 18, 51] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { halign: 'right', cellWidth: 50 },
        2: { halign: 'center', fontStyle: 'bold', cellWidth: 40 },
        3: { halign: 'left', cellWidth: 50 }
      },
      didParseCell: (data) => {
        // Estilo condicional para la predicción
        if (data.section === 'body' && data.column.index === 2) {
          const text = data.cell.text[0];
          if (text.includes('LOCAL')) data.cell.styles.textColor = [56, 120, 135];
          if (text.includes('EMPATE')) data.cell.styles.textColor = [18, 51, 59];
          if (text.includes('VISITANTE')) data.cell.styles.textColor = [134, 18, 51];
        }
      }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Documento generado el ${new Date().toLocaleString()} - Página ${i} de ${pageCount}`,
        margin,
        doc.internal.pageSize.height - 10
      );
    }

    doc.save(`planilla_${p.codigo}_${p.apellido}.pdf`);
  }
}
