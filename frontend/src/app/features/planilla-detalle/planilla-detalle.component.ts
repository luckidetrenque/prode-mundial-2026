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
    const pageWidth = doc.internal.pageSize.width;
    
    // --- Header / Top Bar ---
    // Barra superior decorativa (Usa el azul de USA como base)
    doc.setFillColor(42, 57, 141); // #2a398d
    doc.rect(0, 0, pageWidth, 25, 'F');
    
    // Título en blanco sobre la barra
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('PRODE MUNDIAL 2026', margin, 17);

    // --- Información de la Planilla ---
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Bloque Izquierdo: Datos del Participante
    doc.setFont('helvetica', 'bold');
    doc.text('PARTICIPANTE', margin, 35);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`${p.nombre} ${p.apellido}`, margin, 44);
    
    // Bloque Derecho: Detalle de la Planilla
    const rightCol = pageWidth - 80;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE REGISTRO', rightCol, 35);
    doc.setFont('helvetica', 'normal');
    doc.text(`Número de Planilla:`, rightCol, 42);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(192, 23, 29); // Rojo Canada
    doc.text(`${p.codigo}`, rightCol + 35, 42);
    
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(`Estado:`, rightCol, 48);
    if (p.confirmada) {
      doc.setTextColor(60, 172, 59); // Verde Mexico
      doc.text('CONFIRMADA', rightCol + 15, 48);
    } else {
      doc.setTextColor(150, 150, 150);
      doc.text('PENDIENTE', rightCol + 15, 48);
    }

    // Línea divisoria
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, 55, pageWidth - margin, 55);

    // --- Tabla de Partidos ---
    const tableData: any[] = [];
    
    this.grupos.forEach(grupo => {
      const partidosGrupo = this.getPartidosPorGrupo(grupo);
      
      // Fila de encabezado de grupo
      tableData.push([
        { 
          content: `GRUPO ${grupo}`, 
          colSpan: 4, 
          styles: { 
            fillColor: [240, 240, 240], 
            textColor: [42, 57, 141], 
            fontStyle: 'bold', 
            halign: 'center',
            fontSize: 10
          } 
        }
      ]);

      partidosGrupo.forEach(partido => {
        const pred = this.getPrediccion(partido.id);
        let predText = '-';
        if (pred === 'LOCAL') predText = 'LOCAL (L)';
        else if (pred === 'EMPATE') predText = 'EMPATE (E)';
        else if (pred === 'VISITANTE') predText = 'VISITANTE (V)';

        tableData.push([
          { content: partido.numero, styles: { halign: 'center' } },
          { content: partido.equipoLocalShow, styles: { halign: 'right' } },
          { content: predText, styles: { halign: 'center', fontStyle: 'bold' } },
          { content: partido.equipoVisitanteShow, styles: { halign: 'left' } }
        ]);
      });
    });

    autoTable(doc, {
      startY: 60,
      head: [['#', 'Equipo Local', 'Tu Predicción', 'Equipo Visitante']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [42, 57, 141], 
        textColor: [255, 255, 255],
        halign: 'center'
      },
      styles: { 
        fontSize: 8,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 60 },
        2: { cellWidth: 40 },
        3: { cellWidth: 60 }
      },
      didParseCell: (data) => {
        // Colorear el texto de la predicción según el resultado
        if (data.section === 'body' && data.column.index === 2) {
          const text = data.cell.text[0] || '';
          if (text.includes('LOCAL')) data.cell.styles.textColor = [42, 57, 141];
          if (text.includes('EMPATE')) data.cell.styles.textColor = [100, 100, 100];
          if (text.includes('VISITANTE')) data.cell.styles.textColor = [192, 23, 29];
        }
      }
    });

    // --- Footer y Numeración ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Slogan del torneo
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      const slogan = 'Canadá · Estados Unidos · México 2026';
      doc.text(slogan, pageWidth / 2, doc.internal.pageSize.height - 15, { align: 'center' });

      // Info de página
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generado el ${new Date().toLocaleString()} - Página ${i} de ${pageCount}`,
        margin,
        doc.internal.pageSize.height - 10
      );
      
      doc.text(
        'Prode Mundial 2026 - Sitio Oficial',
        pageWidth - margin,
        doc.internal.pageSize.height - 10,
        { align: 'right' }
      );
    }

    doc.save(`Prode_2026_Planilla_${p.codigo}_${p.apellido}.pdf`);
  }
}
