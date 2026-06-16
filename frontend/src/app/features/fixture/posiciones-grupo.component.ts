import { Component, OnInit, signal } from '@angular/core'; // 1. Importa 'signal'
import { CommonModule } from '@angular/common';
import { PartidoService } from '../../core/services/partido.service';
import { GrupoPosicionesDTO } from '../../shared/models/posicionesGrupos';
import { ShortCountryPipe } from '../../shared/pipes/short-country.pipe';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-posiciones',
  standalone: true,
  imports: [CommonModule, ShortCountryPipe, RouterLink],
  templateUrl: './posiciones-grupo.component.html',
  styleUrls: ['./posiciones-grupo.component.css']
})
export class PosicionesComponent implements OnInit {
  // 2. Usamos una signal para los grupos
  grupos = signal<GrupoPosicionesDTO[]>([]);
  cargando = signal(true);

  constructor(private partidoService: PartidoService) { }

  ngOnInit(): void {
    this.cargarPosiciones();
  }

  cargarPosiciones() {
    this.cargando.set(true);
    this.partidoService.getTablaPosiciones().subscribe({
      next: (data) => {
        this.grupos.set(data); // 3. Actualizamos la signal
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error:', err);
        this.cargando.set(false);
      }
    });
  }
}