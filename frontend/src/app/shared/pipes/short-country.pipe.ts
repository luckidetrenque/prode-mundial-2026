import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortCountry',
  standalone: true
})
export class ShortCountryPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    
    const words = value.trim().split(' ');
    
    // Si tiene más de una palabra, toma la primera y la inicial de la segunda
    if (words.length > 1) {
      return `${words[0]} ${words[1].charAt(0)}.`;
    }
    
    return value;
  }
}
