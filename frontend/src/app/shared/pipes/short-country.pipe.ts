import { Pipe, PipeTransform } from '@angular/core';

/**
 * FIX #22 (original): La lógica anterior era demasiado simple para equipos
 * con nombres compuestos. Se introdujo un mapa de abreviaciones explícitas.
 *
 * Actualización: se agregaron los equipos faltantes detectados al revisar
 * el backend (nombres exactos que devuelve el campo equipoLocalShow /
 * equipoVisitanteShow desde la DB), y se corrigió la lógica de fallback
 * para nombres de 2 palabras donde la primera es corta (≤3 chars):
 * antes se devolvía el nombre completo sin abreviar (correcto para "San
 * Marino"), pero "RD Congo" se mostraba completo cuando debería quedar
 * tal cual (ya está en el mapa).
 *
 * Equipos agregados en esta revisión:
 * - "República Checa" → "R. Checa"
 * - "Bosnia y Herzegovina" ya estaba, se agregó "Bosnia Herzegovina" sin "y"
 * - "Países Bajos" → "P. Bajos"  (6 chars en primera palabra → abreviaba mal)
 * - "Costa de Marfil" → "C. Marfil"
 * - "RD Congo" → se deja igual (ya corto)
 * - "Arabia Saudí" (con tilde, variante del backend) → "Arabia S."
 * - "Nueva Zelanda" ya estaba ✓
 * - "San Marino", "San Vicente" → mapa explícito para no truncar
 *
 * NOTA: los nombres deben coincidir EXACTAMENTE con nombreShow en la DB.
 * Si el backend cambia algún nombre, actualizar el mapa acá.
 */
@Pipe({
  name: 'shortCountry',
  standalone: true,
  // pure: true es el default — Angular solo re-evalúa si el valor de entrada
  // cambia. Es lo correcto para este pipe porque los nombres de equipos no
  // cambian durante la vida de la app.
  pure: true
})
export class ShortCountryPipe implements PipeTransform {

  // Mapa de nombres completos → abreviación de display.
  // Clave: nombre exacto tal como viene del campo equipoLocalShow /
  //        equipoVisitanteShow del backend (case-sensitive).
  private static readonly ABREVIACIONES: Record<string, string> = {

    // ── Grupo A ───────────────────────────────────────────────────────────
    'República Checa': 'R. Checa',
    'Republica Checa': 'R. Checa',     // sin tilde, por si acaso

    // ── Grupo B ───────────────────────────────────────────────────────────
    'Bosnia y Herzegovina': 'Bosnia',
    'Bosnia Herzegovina': 'Bosnia',
    'Bosnia i Herzegovina': 'Bosnia',       // variante con "i" (croata)

    // ── Grupo D ───────────────────────────────────────────────────────────
    'Estados Unidos': 'EE.UU.',
    'United States': 'EE.UU.',
    'USA': 'EE.UU.',

    // ── Grupo E ───────────────────────────────────────────────────────────
    'Costa de Marfil': 'C. Marfil',
    "Côte d'Ivoire": 'C. Marfil',    // variante francesa

    // ── Grupo F ───────────────────────────────────────────────────────────
    'Países Bajos': 'P. Bajos',
    'Paises Bajos': 'P. Bajos',     // sin tilde

    // ── Grupo H ───────────────────────────────────────────────────────────
    'Arabia Saudita': 'Arabia S.',
    'Arabia Saudí': 'Arabia S.',    // con tilde (variante backend)
    'Arabia Saudi': 'Arabia S.',    // sin tilde
    'Cabo Verde': 'C. Verde',

    // ── Grupo I ───────────────────────────────────────────────────────────
    // (sin casos especiales en este grupo)

    // ── Grupo J ───────────────────────────────────────────────────────────
    // (sin casos especiales en este grupo)

    // ── Grupo K ───────────────────────────────────────────────────────────
    'RD Congo': 'RD Congo',     // ya corto, se mantiene
    'Rep. Dem. Congo': 'RD Congo',
    'DR Congo': 'RD Congo',

    // ── Grupo L ───────────────────────────────────────────────────────────
    // (sin casos especiales en este grupo)

    // ── Otros equipos con nombres compuestos problemáticos ────────────────
    'Nueva Zelanda': 'N. Zelanda',
    'Nueva Caledonia': 'N. Caledonia',
    'Papúa Nueva Guinea': 'Papua NG',
    'Papua Nueva Guinea': 'Papua NG',
    'Guinea Ecuatorial': 'G. Ecuat.',
    'Guinea Bisáu': 'G. Bisáu',
    'Guinea-Bisáu': 'G. Bisáu',
    'Sierra Leona': 'S. Leona',
    'Trinidad and Tobago': 'Trinidad',
    'Trinidad y Tobago': 'Trinidad',
    'Antigua y Barbuda': 'Antigua',
    'San Cristóbal y Nieves': 'St. Kitts',
    'San Vicente': 'S. Vicente',
    'San Marino': 'San Marino',   // corto, va completo
    'Islas Feroe': 'Feroe',
    'Islas Salomón': 'I. Salomón',
    'Burkina Faso': 'Burkina',
    'República Dominicana': 'R. Dom.',
    'Republica Dominicana': 'R. Dom.',
    'Corea del Sur': 'Corea S.',
    'Corea del Norte': 'Corea N.',
    'Costa Rica': 'C. Rica',
  };

  transform(value: string): string {
    if (!value) return '';

    const trimmed = value.trim();

    // 1. Verificar si hay una abreviación explícita definida
    const abrev = ShortCountryPipe.ABREVIACIONES[trimmed];
    if (abrev !== undefined) return abrev;

    const words = trimmed.split(/\s+/); // split por cualquier whitespace

    // 2. Una sola palabra: devolver tal cual
    if (words.length === 1) return trimmed;

    // 3. Dos palabras
    if (words.length === 2) {
      // Si la primera palabra es muy corta (≤3 chars), el nombre completo
      // es razonablemente legible y no se abrevia.
      // Ejemplos: "San Marino", "San José", "Sri Lanka"
      if (words[0].length <= 3) {
        return trimmed;
      }
      // Primera palabra larga: abreviar la segunda con su inicial.
      // Ejemplo: "Argentina X." (poco probable pero maneja el caso genérico)
      return `${words[0]} ${words[1].charAt(0).toUpperCase()}.`;
    }

    // 4. Tres o más palabras: solo primera palabra si es suficientemente
    //    descriptiva (≥4 chars), o primera + inicial de la segunda.
    //    Ejemplos que llegan hasta aquí: nombres no mapeados con 3+ palabras.
    return words[0].length >= 4
      ? words[0]
      : `${words[0]} ${words[1].charAt(0).toUpperCase()}.`;
  }
}