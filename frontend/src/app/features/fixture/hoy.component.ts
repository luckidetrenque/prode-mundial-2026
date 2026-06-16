// hoy.component.ts — Partidos del Día
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PartidoService } from '../../core/services/partido.service';
import { ResultadoService } from '../../core/services/resultado.service';
import { Partido } from '../../shared/models/partido.model';
import { ShortCountryPipe } from '../../shared/pipes/short-country.pipe';

@Component({
  selector: 'app-hoy',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, ShortCountryPipe],
  templateUrl: './hoy.component.html',
  styleUrl: './hoy.component.css'
})
export class HoyComponent implements OnInit {

  cargando = signal(true);

  private todosLosPartidos: Partido[] = [];
  private golesSignal = signal<Record<number, { local: number | null, visitante: number | null }>>({});

  partidosHoy = signal<Partido[]>([]);

  fechaHoy = computed(() => {
    const hoy = new Date();
    return hoy.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  constructor(private partidoService: PartidoService, private resultadoService: ResultadoService) { }

  ngOnInit(): void {
    forkJoin({
      partidos: this.partidoService.getPartidos(),
      resultados: this.resultadoService.getResultados()
    }).subscribe({
      next: ({ partidos, resultados }) => {
        this.todosLosPartidos = partidos;

        const goles: Record<number, { local: number | null, visitante: number | null }> = {};
        resultados.forEach(r => {
          goles[r.partido.id] = { local: r.golesLocal ?? null, visitante: r.golesVisitante ?? null };
        });
        this.golesSignal.set(goles);

        const hoy = partidos
          .filter(p => this.esHoy(p))
          .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
        this.partidosHoy.set(hoy);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  getGolesLocal(partidoId: number): number | null {
    return this.golesSignal()[partidoId]?.local ?? null;
  }

  getGolesVisitante(partidoId: number): number | null {
    return this.golesSignal()[partidoId]?.visitante ?? null;
  }

  esHoy(partido: Partido): boolean {
    const fechaPartido = new Date(partido.fechaHora);
    const hoy = new Date();
    return (
      fechaPartido.getFullYear() === hoy.getFullYear() &&
      fechaPartido.getMonth() === hoy.getMonth() &&
      fechaPartido.getDate() === hoy.getDate()
    );
  }

  esJugado(partido: Partido): boolean {
    const fechaHora = new Date(partido.fechaHora);
    const horaFinal = new Date(fechaHora.getTime() + 2 * 60 * 60 * 1000);
    return new Date() >= horaFinal;
  }

  esJugando(partido: Partido): boolean {
    const fechaHora = new Date(partido.fechaHora);
    const horaFinal = new Date(fechaHora.getTime() + 2 * 60 * 60 * 1000);
    const ahora = new Date();
    return ahora >= fechaHora && ahora < horaFinal;
  }

  formatEstadio(sede: string): string {
    if (!sede) return '';
    return sede.replace(/ Stadium/gi, '').trim();
  }

  faseLabel(fase: string): string {
    const labels: Record<string, string> = {
      GRUPOS: 'Grupos',
      DIECISEISAVOS: '16avos',
      OCTAVOS: 'Octavos',
      CUARTOS: 'Cuartos',
      SEMIFINAL: 'Semifinal',
      TERCER_PUESTO: 'Tercer Puesto',
      FINAL: 'Final',
    };
    return labels[fase] ?? fase;
  }
}
