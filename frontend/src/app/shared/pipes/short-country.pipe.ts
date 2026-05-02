import { Pipe, PipeTransform } from '@angular/core';

/**
 * FIX #22: La lógica anterior era demasiado simple para equipos con nombres compuestos.
 * Ejemplos problemáticos:
 *   "Trinidad and Tobago"  → "Trinidad a."  (incorrecto)
 *   "Arabia Saudita"       → "Arabia S."    (aceptable pero poco claro)
 *   "Bosnia Herzegovina"   → "Bosnia H."    (aceptable)
 *   "Costa Rica"           → "Costa R."     (confuso)
 *   "Corea del Sur"        → "Corea d."     (incorrecto)
 *   "Nueva Zelanda"        → "Nueva Z."     (aceptable)
 *
 * Solución: mapa de abreviaciones explícitas para nombres problemáticos.
 * Para el resto se aplica la lógica original (primera palabra + inicial de la segunda).
 * El mapa se puede extender fácilmente para cualquier torneo futuro.
 */
@Pipe({
  name: 'shortCountry',
  standalone: true
})
export class ShortCountryPipe implements PipeTransform {

  // Mapa de nombres completos → abreviación de display
  // Clave: nombre exacto tal como viene del backend (campo equipoLocalShow/equipoVisitanteShow)
  private static readonly ABREVIACIONES: Record<string, string> = {
    // Equipos con nombres compuestos problemáticos — Mundial 2026
    'Trinidad and Tobago':    'Trinidad',
    'Trinidad y Tobago':      'Trinidad',
    'Arabia Saudita':         'Arabia S.',
    'Arabia Saudi':           'Arabia S.',
    'Bosnia Herzegovina':     'Bosnia',
    'Bosnia y Herzegovina':   'Bosnia',
    'Costa Rica':             'C. Rica',
    'Corea del Sur':          'Corea S.',
    'Corea del Norte':        'Corea N.',
    'República Dominicana':   'R. Dom.',
    'Republica Dominicana':   'R. Dom.',
    'Cabo Verde':             'C. Verde',
    'Guinea Ecuatorial':      'G. Ecuat.',
    'Guinea Bisáu':           'G. Bisáu',
    'Sierra Leona':           'S. Leona',
    'San Cristóbal y Nieves': 'St. Kitts',
    'Nueva Zelanda':          'N. Zelanda',
    'Nueva Caledonia':        'N. Caledonia',
    'Papúa Nueva Guinea':     'Papua NG',
    'Antigua y Barbuda':      'Antigua',
    'San Vicente':            'S. Vicente',
    'Islas Feroe':            'Feroe',
    'Islas Salomón':          'I. Salomón',
    'Burkina Faso':           'Burkina',
    'Estados Unidos':         'EE.UU.',
    'United States':          'EE.UU.',
    'USA':                    'EE.UU.',
  };

  transform(value: string): string {
    if (!value) return '';

    const trimmed = value.trim();

    // 1. Verificar si hay una abreviación explícita definida
    const abrev = ShortCountryPipe.ABREVIACIONES[trimmed];
    if (abrev) return abrev;

    const words = trimmed.split(' ');

    // 2. Una sola palabra: devolver tal cual
    if (words.length === 1) return trimmed;

    // 3. Dos palabras: "Argentina" queda igual, "Costa Rica" → "C. Rica"
    //    Si la primera palabra es muy corta (≤3 chars), usarla entera
    if (words.length === 2) {
      if (words[0].length <= 3) {
        return trimmed; // ej: "San Marino" → "San Marino"
      }
      return `${words[0]} ${words[1].charAt(0)}.`;
    }

    // 4. Tres o más palabras: solo primera palabra si es suficientemente descriptiva
    return words[0].length >= 4
      ? words[0]
      : `${words[0]} ${words[1].charAt(0)}.`;
  }
}