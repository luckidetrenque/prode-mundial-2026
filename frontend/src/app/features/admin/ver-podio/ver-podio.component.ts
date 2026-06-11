// src/app/features/admin/ver-podio/ver-podio.component.ts
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Participante {
  nombre: string;
  rival: string;
  rival_pts: number;
  ventaja: number;
}

interface Par {
  a: string;
  b: string;
  comun: number;
  dif: number;
}

type TabActiva = 'ranking' | 'pares' | 'info';

@Component({
  selector: 'app-ver-podio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ver-podio.component.html',
  styleUrls: ['./ver-podio.component.css']
})
export class VerPodioComponent {

  tabActiva = signal<TabActiva>('ranking');
  busqueda = signal('');

  readonly data: Participante[] = [
    {nombre:"SEBASTIAN PEREZ",rival:"JULIETA MUÑIZ",rival_pts:37,ventaja:47},
    {nombre:"PATRICIA BOZAN",rival:"GABRIEL G. RACEDO",rival_pts:39,ventaja:45},
    {nombre:"GUSTAVO MATHEU (1)",rival:"BENICIO HORNUNG",rival_pts:40,ventaja:44},
    {nombre:"VERÓNICA BITEZNIK (1)",rival:"MAILÉN VENTIMIGLIA",rival_pts:46,ventaja:38},
    {nombre:"NATALIA NUÑEZ",rival:"JERÓNIMO MORÉ",rival_pts:48,ventaja:36},
    {nombre:"GUSTAVO LEZICA",rival:"LUCAS D. BORGHETTI",rival_pts:49,ventaja:35},
    {nombre:"JOSÉ MARTÍNEZ",rival:"GUSTAVO MATHEU",rival_pts:49,ventaja:35},
    {nombre:"GUSTAVO MATHEU (2)",rival:"JOSÉ MARTÍNEZ",rival_pts:49,ventaja:35},
    {nombre:"ROMINA NUÑEZ FAVRE",rival:"VITTO Y NACHO C.",rival_pts:50,ventaja:34},
    {nombre:"DIEGO ESCOBAR ONEILL",rival:"ALEJO MEANA",rival_pts:51,ventaja:33},
    {nombre:"GABRIEL G. RACEDO",rival:"GASTÓN MORÉ",rival_pts:52,ventaja:32},
    {nombre:"CINTIA BITEZNIK",rival:"ADRIÁN VISCAY",rival_pts:52,ventaja:32},
    {nombre:"VERÓNICA BITEZNIK (2)",rival:"CHRISTIAN ALBANESE",rival_pts:53,ventaja:31},
    {nombre:"MARGUI CALANDRA",rival:"LUCIA LABARRAZ",rival_pts:54,ventaja:30},
    {nombre:"CHRISTIAN ALBANESE",rival:"LUCIANO RODRÍGUEZ",rival_pts:55,ventaja:29},
    {nombre:"CLAUDIA NAVARRO",rival:"AGUSTIN ALBANESE",rival_pts:56,ventaja:28},
    {nombre:"VIVIANA GOMEZ",rival:"FERNANDO DE CARO",rival_pts:56,ventaja:28},
    {nombre:"NICOLAS MARTINEZ R.",rival:"GASTÓN MORÉ",rival_pts:57,ventaja:27},
    {nombre:"JOAQUINA BARRIOS",rival:"JULIETA MUÑIZ",rival_pts:57,ventaja:27},
    {nombre:"PABLO LAGUILON",rival:"CHRISTIAN ELIGGI",rival_pts:57,ventaja:27},
    {nombre:"MARIANO S. DÍAZ B.",rival:"NATALIA C. ZANONA",rival_pts:58,ventaja:26},
    {nombre:"FACUNDO RODRÍGUEZ K.",rival:"ADRIÁN VISCAY",rival_pts:59,ventaja:25},
    {nombre:"GABRIEL MIGO",rival:"MATIAS AMADO",rival_pts:59,ventaja:25},
    {nombre:"AGUSTÍN MORÉ",rival:"LUCIANA DIKGOLZ",rival_pts:59,ventaja:25},
    {nombre:"XIMENA BELOSO",rival:"OCTAVIO HID",rival_pts:60,ventaja:24},
    {nombre:"MARCELO VIVIANI",rival:"FERNANDO DE CARO",rival_pts:60,ventaja:24},
    {nombre:"VERONICA MERLO",rival:"CLAUDIA LUPA",rival_pts:60,ventaja:24},
    {nombre:"CLAUDIA LUPA",rival:"VERONICA MERLO",rival_pts:60,ventaja:24},
    {nombre:"JULIETA MUÑIZ",rival:"GRACIELA POIS",rival_pts:60,ventaja:24},
    {nombre:"GRACIELA POIS",rival:"JULIETA MUÑIZ",rival_pts:60,ventaja:24},
    {nombre:"FRANCISCO ESPOSITO",rival:"LUCAS D. BORGHETTI",rival_pts:60,ventaja:24},
    {nombre:"ADRIÁN VISCAY",rival:"GASTÓN MORÉ",rival_pts:61,ventaja:23},
    {nombre:"NATALIA C. ZANONA",rival:"LUCIANO RODRÍGUEZ",rival_pts:61,ventaja:23},
    {nombre:"EZEQUIEL LAVINIA",rival:"LIA FERNANDEZ T.",rival_pts:61,ventaja:23},
    {nombre:"SEBASTIAN CHIENTAROLI",rival:"FELIPE A. CAPANDEGUI",rival_pts:61,ventaja:23},
    {nombre:"LUCAS BORGHETTI",rival:"FERNANDO DE CARO",rival_pts:62,ventaja:22},
    {nombre:"LUCAS MARTÍNEZ A.",rival:"LUCAS D. BORGHETTI",rival_pts:62,ventaja:22},
    {nombre:"THEO ALBORNOZ",rival:"ROMINA BARBA",rival_pts:62,ventaja:22},
    {nombre:"LISANDRO FRIAS",rival:"SILVANA PAGNUSSAT",rival_pts:62,ventaja:22},
    {nombre:"AGUSTIN ALBANESE",rival:"VICTORIA MATHEU",rival_pts:62,ventaja:22},
    {nombre:"SABRINA RANCAN",rival:"FELIPE A. CAPANDEGUI",rival_pts:62,ventaja:22},
    {nombre:"JERÓNIMO MORÉ",rival:"OCTAVIO HID",rival_pts:63,ventaja:21},
    {nombre:"GASTÓN MORÉ",rival:"LUCIANA DIKGOLZ",rival_pts:63,ventaja:21},
    {nombre:"FELIPE A. CAPANDEGUI",rival:"LUCIANA DIKGOLZ",rival_pts:63,ventaja:21},
    {nombre:"GABRIEL D. MIGUEL",rival:"CHRISTIAN ELIGGI",rival_pts:64,ventaja:20},
    {nombre:"LUCIANO RODRÍGUEZ",rival:"LIA FERNANDEZ T.",rival_pts:64,ventaja:20},
    {nombre:"MAILÉN VENTIMIGLIA",rival:"ALEJO MEANA",rival_pts:64,ventaja:20},
    {nombre:"VITTO Y NACHO C.",rival:"LUCIANA DIKGOLZ",rival_pts:64,ventaja:20},
    {nombre:"LUCIA LABARRAZ",rival:"GABRIEL D. MIGUEL",rival_pts:64,ventaja:20},
    {nombre:"MATIAS AMADO",rival:"ROMINA BARBA",rival_pts:65,ventaja:19},
    {nombre:"DANIELA ALBORNOZ",rival:"BENICIO HORNUNG",rival_pts:65,ventaja:19},
    {nombre:"BENICIO HORNUNG",rival:"DANIELA ALBORNOZ",rival_pts:65,ventaja:19},
    {nombre:"VICTORIA MATHEU",rival:"ROMINA BARBA",rival_pts:66,ventaja:18},
    {nombre:"SANTIAGO MATHEU",rival:"OCTAVIO HID",rival_pts:66,ventaja:18},
    {nombre:"FERNANDO DE CARO",rival:"CHRISTIAN ELIGGI",rival_pts:66,ventaja:18},
    {nombre:"IAN ZANABRE",rival:"FERNANDO DE CARO",rival_pts:66,ventaja:18},
    {nombre:"CHRISTIAN ELIGGI",rival:"HORACIO CARDENES",rival_pts:67,ventaja:17},
    {nombre:"JUAN JOSE MERLO",rival:"ROMINA BARBA",rival_pts:67,ventaja:17},
    {nombre:"LUCAS D. BORGHETTI",rival:"ROMINA BARBA",rival_pts:67,ventaja:17},
    {nombre:"MANUEL CHALU",rival:"MARIANO BECCACECI",rival_pts:67,ventaja:17},
    {nombre:"LIA FERNANDEZ T.",rival:"VALENTINO LAGUILON",rival_pts:68,ventaja:16},
    {nombre:"MARIANO BECCACECI",rival:"OCTAVIO HID",rival_pts:68,ventaja:16},
    {nombre:"ROMINA BARBA",rival:"HORACIO CARDENES",rival_pts:68,ventaja:16},
    {nombre:"SILVANA PAGNUSSAT",rival:"OCTAVIO HID",rival_pts:69,ventaja:15},
    {nombre:"HORACIO CARDENES",rival:"LUCIANA DIKGOLZ",rival_pts:70,ventaja:14},
    {nombre:"LUCIANA DIKGOLZ",rival:"HORACIO CARDENES",rival_pts:70,ventaja:14},
    {nombre:"ALEJO MEANA",rival:"VALENTINO LAGUILON",rival_pts:71,ventaja:13},
    {nombre:"VALENTINO LAGUILON",rival:"ALEJO MEANA",rival_pts:71,ventaja:13},
    {nombre:"GONZALO FERNÁNDEZ",rival:"OCTAVIO HID",rival_pts:72,ventaja:12},
    {nombre:"OCTAVIO HID",rival:"GONZALO FERNÁNDEZ",rival_pts:72,ventaja:12},
  ];

  readonly pares: Par[] = [
    {a:"GONZALO FERNÁNDEZ",b:"OCTAVIO HID",comun:72,dif:12},
    {a:"ALEJO MEANA",b:"VALENTINO LAGUILON",comun:71,dif:13},
    {a:"HORACIO CARDENES",b:"LUCIANA DIKGOLZ",comun:70,dif:14},
    {a:"ALEJO MEANA",b:"GONZALO FERNÁNDEZ",comun:69,dif:15},
    {a:"SILVANA PAGNUSSAT",b:"OCTAVIO HID",comun:69,dif:15},
    {a:"LIA FERNANDEZ T.",b:"VALENTINO LAGUILON",comun:68,dif:16},
    {a:"MARIANO BECCACECI",b:"OCTAVIO HID",comun:68,dif:16},
    {a:"ROMINA BARBA",b:"HORACIO CARDENES",comun:68,dif:16},
    {a:"HORACIO CARDENES",b:"VALENTINO LAGUILON",comun:68,dif:16},
    {a:"LIA FERNANDEZ T.",b:"OCTAVIO HID",comun:67,dif:17},
    {a:"CHRISTIAN ELIGGI",b:"HORACIO CARDENES",comun:67,dif:17},
    {a:"ALEJO MEANA",b:"OCTAVIO HID",comun:67,dif:17},
    {a:"GONZALO FERNÁNDEZ",b:"SILVANA PAGNUSSAT",comun:67,dif:17},
    {a:"JUAN JOSE MERLO",b:"ROMINA BARBA",comun:67,dif:17},
    {a:"LUCAS D. BORGHETTI",b:"ROMINA BARBA",comun:67,dif:17},
  ];

  readonly top3 = this.data.slice(0, 3);

  dataFiltrada = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    if (!q) return this.data;
    return this.data.filter(d =>
      d.nombre.toLowerCase().includes(q) || d.rival.toLowerCase().includes(q)
    );
  });

  setTab(tab: TabActiva): void {
    this.tabActiva.set(tab);
  }

  getDificultad(ventaja: number): { label: string; clase: string } {
    if (ventaja >= 35) return { label: 'Fácil de separarse', clase: 'badge-green' };
    if (ventaja >= 25) return { label: 'Moderada', clase: 'badge-blue' };
    if (ventaja >= 18) return { label: 'Difícil', clase: 'badge-amber' };
    return { label: 'Muy difícil', clase: 'badge-gray' };
  }

  getSimil(comun: number): { label: string; clase: string } {
    if (comun >= 70) return { label: 'Casi idénticas', clase: 'badge-gray' };
    if (comun >= 65) return { label: 'Muy similares', clase: 'badge-amber' };
    return { label: 'Similares', clase: 'badge-blue' };
  }

  trClass(i: number): string {
    if (i === 0) return 'tr-top1';
    if (i === 1) return 'tr-top2';
    if (i === 2) return 'tr-top3';
    return '';
  }

  trackByNombre(_i: number, d: Participante): string { return d.nombre; }
  trackByIdx(i: number): number { return i; }
}
