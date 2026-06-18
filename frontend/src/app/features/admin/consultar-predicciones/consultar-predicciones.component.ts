import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PartidoService } from '../../../core/services/partido.service';
import { PlanillaService, FiltroPrediccionUsuario } from '../../../core/services/planilla.service';

@Component({
    selector: 'app-consultar-predicciones',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './consultar-predicciones.component.html',
    styleUrls: ['./consultar-predicciones.component.css']
})
export class ConsultarPrediccionesComponent {
    private partidoService = inject(PartidoService);
    private planillaService = inject(PlanillaService);

    // Signals y estados de UI
    partidos = signal<any[]>([]);
    usuariosEncontrados = signal<FiltroPrediccionUsuario[]>([]);

    partidoSeleccionado = signal<number | null>(null);
    prediccionSeleccionada = signal<string>('LOCAL');
    cargando = signal<boolean>(false);

    ngOnInit() {
        // Cargamos los partidos para llenar el <select> de la interfaz
        this.partidoService.getPartidos().subscribe(res => {
            this.partidos.set(res);
        });
    }

    buscar() {
        const id = this.partidoSeleccionado();
        if (!id) return;

        this.cargando.set(true);
        this.planillaService.obtenerUsuariosPorPrediccion(id, this.prediccionSeleccionada()).subscribe({
            next: (res) => {
                this.usuariosEncontrados.set(res);
                this.cargando.set(false);
            },
            error: () => this.cargando.set(false)
        });
    }
}