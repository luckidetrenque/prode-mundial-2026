// src/app/features/admin/tabla-posiciones/tabla-posiciones.component.ts
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PosicionService } from '../../../core/services/posicion.service';
import { Posicion } from '../../../shared/models/posicion.model';

interface ParticipanteFiltro {
  nombre: string;
  apellido: string;
  codigo: number;
}

@Component({
  selector: 'app-tabla-posiciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabla-posiciones.component.html',
  styleUrls: ['./tabla-posiciones.component.css']
})
export class TablaPosicionesComponent implements OnInit {

  private posicionService = inject(PosicionService);

  cargando = signal(true);
  error = signal(false);
  posicionesFiltradas = signal<Posicion[]>([]);

  // Participantes habilitados (nombre parcial + código de planilla)
  private readonly PARTICIPANTES: ParticipanteFiltro[] = [
    { nombre: 'LUCAS',    apellido: 'MARTÍNEZ AZPELICUETA', codigo: 93179414 },
    { nombre: 'XIMENA',   apellido: 'BELOSO',               codigo: 78068696 },
    { nombre: 'LUCIANO',  apellido: 'RODRÍGUEZ',            codigo: 64398342 },
    { nombre: 'LUCAS',    apellido: 'BORGHETTI',            codigo: 73267770 },
    { nombre: 'CLAUDIA',  apellido: 'NAVARRO',              codigo: 36027853 },
    { nombre: 'FACUNDO',  apellido: 'RODRIGUEZ KARAMANOS',  codigo: 59353880 },
    { nombre: 'VERÓNICA', apellido: 'BITEZNIK',             codigo: 52581703 },
    { nombre: 'SANTIAGO', apellido: 'MATHEU',               codigo: 62509210 },
    { nombre: 'VERÓNICA', apellido: 'BITEZNIK',             codigo: 34461411 },
    { nombre: 'VERONICA', apellido: 'MERLO',                codigo: 12739293 },
    { nombre: 'LUCAS DAMIAN', apellido: 'BORGHETTI',        codigo: 20719114 },
    { nombre: 'DIEGO',    apellido: 'ESCOBAR ONEILL',       codigo: 46299816 },
    { nombre: 'SABRINA',  apellido: 'RANCAN',               codigo: 56600974 },
    { nombre: 'MAILÉN',   apellido: 'VENTIMIGLIA',          codigo: 21943385 },
    { nombre: 'GABRIEL DAMIAN',   apellido: 'MIGUEL',       codigo: 41427606 },
    { nombre: 'OCTAVIO',   apellido: 'HID',                 codigo: 95397965 },
    { nombre: 'IAN',   apellido: 'ZANABRE',                 codigo: 55187994 },
  ];

  private readonly CODIGOS = new Set(this.PARTICIPANTES.map(p => p.codigo));

  ultimo = computed(() => {
    const lista = this.posicionesFiltradas();
    return lista.length > 0 ? lista[lista.length - 1] : null;
  });

  podioAgrupado = computed(() => {
    const agrupado = new Map<number, { posicion: number, jugadores: Posicion[], puntos: number }>();
    for (const p of this.posicionesFiltradas()) {
      if (p.posicion <= 3) {
        if (!agrupado.has(p.posicion)) {
          agrupado.set(p.posicion, { posicion: p.posicion, jugadores: [], puntos: p.puntos });
        }
        agrupado.get(p.posicion)!.jugadores.push(p);
      }
    }
    return Array.from(agrupado.values()).sort((a, b) => a.posicion - b.posicion);
  });

  ngOnInit(): void {
    this.posicionService.getPosiciones().subscribe({
      next: data => {
        // Filtrar por código de planilla
        const filtrados = data.filter(p => this.CODIGOS.has(p.codigoPlanilla));

        // Re-rankear dentro del grupo
        const sorted = [...filtrados].sort((a, b) => b.puntos - a.puntos);
        let rank = 0, lastPts = -1;
        const rankeados = sorted.map(p => {
          if (p.puntos !== lastPts) { rank++; lastPts = p.puntos; }
          return { ...p, posicion: rank };
        });

        this.posicionesFiltradas.set(rankeados);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      }
    });
  }

  getClaseRow(posicion: number): string {
    if (posicion === 1) return 'row-gold';
    if (posicion === 2) return 'row-silver';
    if (posicion === 3) return 'row-bronze';
    return '';
  }

  nombreCompleto(p: Posicion): string {
    return `${p.nombre} ${p.apellido}`;
  }
}
