import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cpf'
})
export class CpfPipe implements PipeTransform {

  transform(value: string): string {
    if (!value) return '';
    
    // Remove caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara
    if (numbers.length >= 11) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
    } else if (numbers.length >= 4) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
    } else if (numbers.length >= 7) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    } else if (numbers.length >= 4) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    }
    
    return numbers;
  }
}
