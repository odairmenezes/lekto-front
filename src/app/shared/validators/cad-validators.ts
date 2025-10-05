import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validador para email com formato rigoroso
 */
export function cadEmailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const email = control.value.trim();
    
    // Regex mais rigoroso para email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(email)) {
      return { cadEmailInvalid: { message: 'Email deve ter formato válido (ex: usuario@dominio.com)' } };
    }

    // Verificar se tem pelo menos um ponto após o @
    const parts = email.split('@');
    if (parts.length !== 2) {
      return { cadEmailInvalid: { message: 'Email deve ter formato válido' } };
    }

    const domain = parts[1];
    if (!domain.includes('.')) {
      return { cadEmailInvalid: { message: 'Domínio deve ter extensão válida (ex: .com, .br)' } };
    }

    // Verificar se o domínio não termina com ponto
    if (domain.endsWith('.')) {
      return { cadEmailInvalid: { message: 'Domínio não pode terminar com ponto' } };
    }

    // Verificar se a extensão tem pelo menos 2 caracteres
    const extension = domain.split('.').pop();
    if (!extension || extension.length < 2) {
      return { cadEmailInvalid: { message: 'Extensão do domínio deve ter pelo menos 2 caracteres' } };
    }

    return null;
  };
}

/**
 * Validador para CPF seguindo as especificações do desafio
 */
export function cadCpfValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const cpf = control.value.replace(/\D/g, '');
    
    // Verificar se tem 11 dígitos
    if (cpf.length !== 11) {
      return { cadCpfInvalid: { message: 'CPF deve ter 11 dígitos' } };
    }

    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) {
      return { cadCpfInvalid: { message: 'CPF inválido' } };
    }

    // Calcular primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) {
      return { cadCpfInvalid: { message: 'CPF inválido' } };
    }

    // Calcular segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) {
      return { cadCpfInvalid: { message: 'CPF inválido' } };
    }

    return null;
  };
}

/**
 * Validador para nome com mínimo 4 caracteres apenas letras e espaços
 */
export function cadNameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const name = control.value.trim();
    
    // Mínimo 4 caracteres
    if (name.length < 4) {
      return { cadNameLength: { message: 'Nome deve ter pelo menos 4 caracteres' } };
    }

    // Apenas letras e espaços
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(name)) {
      return { cadNameInvalid: { message: 'Nome deve conter apenas letras e espaços' } };
    }

    return null;
  };
}

/**
 * Validador para endereços únicos por usuário
 */
export function cadUniqueAddressValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const addresses = control.value as any[];
    if (!Array.isArray(addresses)) return null;

    const addressStrings = addresses.map((addr: any) => {
      if (addr.street && addr.number && addr.neighborhood && addr.city && addr.zipCode) {
        return `${addr.street.toLowerCase()}-${addr.number.toLowerCase()}-${addr.neighborhood.toLowerCase()}-${addr.city.toLowerCase()}-${addr.zipCode}`;
      }
      return '';
    }).filter(addr => addr !== '');

    // Verificar duplicatas
    const uniqueAddresses = new Set(addressStrings);
    if (addressStrings.length !== uniqueAddresses.size) {
      return { cadDuplicateAddress: { message: 'Endereço já cadastrado para este usuário' } };
    }

    return null;
  };
}

/**
 * Validador para senha com maiúsculas, minúsculas e caracteres especiais
 */
export function cadPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const password = control.value;
    const errors: ValidationErrors = {};

    // Maiúsculas
    if (!/[A-Z]/.test(password)) {
      errors['cadPasswordUpper'] = { message: 'Senha deve conter pelo menos uma letra maiúscula' };
    }

    // Minúsculas
    if (!/[a-z]/.test(password)) {
      errors['cadPasswordLower'] = { message: 'Senha deve conter pelo menos uma letra minúscula' };
    }

    // Caracteres especiais
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors['cadPasswordSpecial'] = { message: 'Senha deve conter pelo menos um caractere especial' };
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}

/**
 * Validador para telefone com DDD
 */
export function cadPhoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const phone = control.value.replace(/\D/g, '');
    
    // Deve ter exatamente 11 dígitos (2 para DDD + 9 para número)
    if (phone.length !== 11) {
      return { cadPhoneInvalid: { message: 'Telefone deve ter DDD + 9 dígitos (ex: 11987654321)' } };
    }

    // Primeiro dígito do DDD deve ser entre 1 e 9
    if (!/^[1-9]/.test(phone)) {
      return { cadPhoneInvalid: { message: 'DDD inválido' } };
    }

    return null;
  };
}

/**
 * Validador para obrigatoriedade de pelo menos um endereço principal
 */
export function cadMainAddressValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const addresses = control.value as any[];
    if (!Array.isArray(addresses) || addresses.length === 0) {
      return { cadMainAddressRequired: { message: 'Pelo menos um endereço é obrigatório' } };
    }

    // Deve haver pelo menos um endereço marcado como principal
    const hasMainAddress = addresses.some((addr: any) => addr.isMain === true);
    if (!hasMainAddress) {
      return { cadMainAddressRequired: { message: 'Deve haver pelo menos um endereço principal' } };
    }

    return null;
  };
}