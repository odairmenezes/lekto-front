import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.value;
    
    if (!password) {
      return null; // Permitir campo vazio se opcional
    }

    const errors: ValidationErrors = {};

    // Verifica comprimento mínimo
    if (password.length < 8) {
      errors['passwordMinLength'] = { message: 'Senha deve ter pelo menos 8 caracteres' };
    }

    // Verifica se tem pelo menos uma letra minúscula
    if (!/[a-z]/.test(password)) {
      errors['passwordLowercase'] = { message: 'Senha deve conter pelo menos uma letra minúscula' };
    }

    // Verifica se tem pelo menos uma letra maiúscula
    if (!/[A-Z]/.test(password)) {
      errors['passwordUppercase'] = { message: 'Senha deve conter pelo menos uma letra maiúscula' };
    }

    // Verifica se tem pelo menos um caractere especial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors['passwordSpecial'] = { message: 'Senha deve conter pelo menos um caractere especial' };
    }

    // Verifica se tem pelo menos um número
    if (!/\d/.test(password)) {
      errors['passwordNumber'] = { message: 'Senha deve conter pelo menos um número' };
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}

export function passwordMatchValidator(passwordFieldName: string, confirmPasswordFieldName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get(passwordFieldName);
    const confirmPassword = control.get(confirmPasswordFieldName);

    if (!password || !confirmPassword) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      return { passwordMismatch: { message: 'Senhas não coincidem' } };
    }

    return null;
  };
}
