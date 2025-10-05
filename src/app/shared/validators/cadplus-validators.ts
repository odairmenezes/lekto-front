import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validação de CPF conforme algoritmo oficial brasileiro
 * REQUISITO: O Usuário deve inserir um CPF válido
 */
export function cpfValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }

  const cpf = control.value.replace(/[^\d]/g, '');
  
  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) {
    return { cpf: { message: 'CPF deve ter 11 dígitos' } };
  }
  
  // Verifica se não são todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(cpf)) {
    return { cpf: { message: 'CPF inválido (dígitos iguais)' } };
  }
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit === 10 || digit === 11) digit = 0;
  if (digit !== parseInt(cpf.charAt(9))) {
    return { cpf: { message: 'CPF inválido' } };
  }
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit === 10 || digit === 11) digit = 0;
  if (digit !== parseInt(cpf.charAt(10))) {
    return { cpf: { message: 'CPF inválido' } };
  }
  
  return null;
}

/**
 * Validador de nome do usuário
 * REQUISITO: Nome deve possuir no mínimo 4 caracteres e conter apenas letras e espaços
 */
export function nameValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }

  const name = control.value.trim();
  
  // Mínimo 4 caracteres
  if (name.length < 4) {
    return { name: { message: 'Nome deve ter no mínimo 4 caracteres' } };
  }
  
  // Apenas letras e espaços
  if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(name)) {
    return { name: { message: 'Nome deve conter apenas letras e espaços' } };
  }
  
  // Não pode ter espaços no início ou fim
  if (name !== control.value.trim()) {
    return { name: { message: 'Nome não pode ter espaços no início ou fim' } };
  }
  
  return null;
}

/**
 * Validador de senha conforme regras do CadPlus ERP:
 * - Mínimo 6 caracteres
 * - Pelo menos 1 letra maiúscula
 * - Pelo menos 1 letra minúscula
 * - Pelo menos 1 número
 * - Pelo menos 1 caractere especial
 */
export function passwordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const password = control.value;
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors: ValidationErrors = {};
    
    if (password.length < minLength) {
      errors['minlength'] = { message: 'Mínimo 6 caracteres' };
    }
    if (!hasUpperCase) {
      errors['noUpperCase'] = { message: 'Pelo menos 1 letra maiúscula' };
    }
    if (!hasLowerCase) {
      errors['noLowerCase'] = { message: 'Pelo menos 1 letra minúscula' };
    }
    if (!hasNumbers) {
      errors['noNumbers'] = { message: 'Pelo menos 1 número' };
    }
    if (!hasSpecialChar) {
      errors['noSpecialChar'] = { message: 'Pelo menos 1 caractere especial' };
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}

/**
 * Validador de confirmação de senha
 */
export function confirmPasswordValidator(passwordField: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const passwordControl = control.parent?.get(passwordField);
    if (passwordControl && control.value !== passwordControl.value) {
      return { passwordMismatch: { message: 'Senhas não coincidem' } };
    }

    return null;
  };
}

/**
 * Validador de email customizado
 */
export function emailValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(control.value)) {
    return { email: { message: 'Email inválido' } };
  }

  return null;
}

/**
 * Validador de telefone brasileiro com DDD
 * REQUISITO: Número de telefone válido com DDD
 */
export function phoneValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }

  const phone = control.value.replace(/[^\d]/g, '');
  
  // Telefone brasileiro deve ter 10 ou 11 dígitos (DDD + número)
  if (phone.length !== 10 && phone.length !== 11) {
    return { phone: { message: 'Telefone deve ter 10 ou 11 dígitos com DDD' } };
  }
  
  // Verifica se começa com DDD válido (11 a 99)
  const ddd = phone.substring(0, 2);
  if (parseInt(ddd) < 11 || parseInt(ddd) > 99) {
    return { phone: { message: 'DDD inválido' } };
  }
  
  // Para telefones com 11 dígitos, verifica se começa com 9 (celular)
  if (phone.length === 11) {
    const phoneNumber = phone.substring(2, 3);
    if (phoneNumber !== '9') {
      return { phone: { message: 'Celular deve começar com 9' } };
    }
  }

  return null;
}

/**
 * Validador de CEP brasileiro
 */
export function zipCodeValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }

  const zipCode = control.value.replace(/[^\d]/g, '');
  
  // CEP brasileiro deve ter 8 dígitos
  if (zipCode.length !== 8) {
    return { zipCode: { message: 'CEP deve ter 8 dígitos' } };
  }

  return null;
}

/**
 * Validador para verificar endereços duplicados
 * REQUISITO: Endereço não pode ser cadastrado mais de uma vez para o mesmo usuário
 */
export function duplicateAddressValidator(existingAddresses: any[], currentAddressIndex?: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value || !existingAddresses) {
      return null;
    }

    const addressToCheck = control.value;
    const addressKey = `${addressToCheck.street?.trim()}-${addressToCheck.number?.trim()}-${addressToCheck.city?.trim()}`.toLowerCase();

    const duplicateIndex = existingAddresses.findIndex((addr, index) => {
      if (index === currentAddressIndex) return false; // Ignora o endereço atual sendo editado
      
      const existingKey = `${addr.street?.trim()}-${addr.number?.trim()}-${addr.city?.trim()}`.toLowerCase();
      return existingKey === addressKey;
    });

    if (duplicateIndex !== -1) {
      return { duplicateAddress: { message: 'Este endereço já foi cadastrado anteriormente' } };
    }

    return null;
  };
}

/**
 * Função utilitária para obter mensagens de erro de validação
 */
export function getValidationErrors(control: AbstractControl): string[] {
  if (!control.errors) {
    return [];
  }

  const errors: string[] = [];
  Object.keys(control.errors).forEach(key => {
    if (control.errors![key]?.message) {
      errors.push(control.errors![key].message);
    } else {
      // Mensagens padrão para alguns tipos de erro
      switch (key) {
        case 'required':
          errors.push('Campo obrigatório');
          break;
        case 'minlength':
          errors.push(`Mínimo ${control.errors![key]?.requiredLength} caracteres`);
          break;
        case 'maxlength':
          errors.push(`Máximo ${control.errors![key]?.requiredLength} caracteres`);
          break;
        case 'pattern':
          errors.push('Formato inválido');
          break;
        default:
          errors.push(`Erro de validação: ${key}`);
      }
    }
  });

  return errors;
}
