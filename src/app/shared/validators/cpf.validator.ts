import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function cpfValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const cpf = control.value;
    
    if (!cpf) {
      return null; // Permitir campo vazio se opcional
    }

    // Remove caracteres não numéricos
    const cleanCpf = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cleanCpf.length !== 11) {
      return { cpfInvalid: { message: 'CPF deve ter 11 dígitos' } };
    }

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCpf)) {
      return { cpfInvalid: { message: 'CPF inválido' } };
    }

    // Validação do primeiro dígito verificador :
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
    }
    let firstDigit = 11 - (sum % 11);
    if (firstDigit >= 10) firstDigit = 0;

    if (parseInt(cleanCpf.charAt(9)) !== firstDigit) {
      return { cpfInvalid: { message: 'CPF inválido' } };
    }

    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
    }
    let secondDigit = 11 - (sum % 11);
    if (secondDigit >= 10) secondDigit = 0;

    if (parseInt(cleanCpf.charAt(10)) !== secondDigit) {
      return { cpfInvalid: { message: 'CPF inválido' } };
    }

    return null;
  };
}
