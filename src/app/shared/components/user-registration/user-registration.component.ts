import { Component, Injectable, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { finalize } from 'rxjs/operators';

import { 
  emailValidator, 
  passwordValidator, 
  cpfValidator,
  phoneValidator,
  nameValidator,
  zipCodeValidator,
  duplicateAddressValidator
} from '../../validators/cadplus-validators';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-registration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatStepperModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDividerModule
  ],
  templateUrl: './user-registration.component.html',
  styleUrls: ['./user-registration.component.scss']
})
export class UserRegistrationComponent implements OnInit {
  userForm: FormGroup;
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;

  // Estados brasileiros para o select
  estadosBrasileiros = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MA', 'MG', 'MS', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.userForm = this.fb.group({
      // Dados pessoais
      firstName: ['', [Validators.required, nameValidator]],
      lastName: ['', [Validators.required, nameValidator]],
      email: ['', [Validators.required, emailValidator]],
      cpf: ['', [Validators.required, cpfValidator]],
      phone: ['', [Validators.required, phoneValidator]],
      
      // Senha
      password: ['', [Validators.required, passwordValidator()]],
      confirmPassword: ['', [Validators.required]],
      
      // Endereços (array de endereços)
      addresses: this.fb.array([])
    });

    // Validador de confirmação de senha
    this.userForm.setValidators(this.passwordMatchValidator.bind(this));
  }

  ngOnInit(): void {
    // Adiciona um endereço inicial
    this.addAddress();
  }

  get addressesFormArray(): FormArray {
    return this.userForm.get('addresses') as FormArray;
  }

  /**
   * Cria um novo formulário de endereço
   */
  createAddressFormGroup(): FormGroup {
    return this.fb.group({
      street: ['', [Validators.required, Validators.minLength(5)]],
      number: ['', [Validators.required]],
      complement: [''],
      neighborhood: ['', [Validators.required]],
      city: ['', [Validators.required, Validators.minLength(3)]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required, zipCodeValidator]],
      country: ['Brasil', [Validators.required]],
      isMain: [false]
    });
  }

  /**
   * Adiciona um novo endereço
   */
  addAddress(): void {
    const addressForm = this.createAddressFormGroup();
    
    // Adiciona validador de endereço duplicado
    addressForm.setValidators([
      duplicateAddressValidator(this.addressesFormArray.value, this.addressesFormArray.length)
    ]);

    this.addressesFormArray.push(addressForm);
    
    // Event listener para detectar mudanças e re-validar duplicatas
    addressForm.valueChanges.subscribe(() => {
      this.validateDuplicateAddresses();
    });

    this.snackBar.open('Novo endereço adicionado', 'Fechar', { duration: 2000 });
  }

  /**
   * Remove um endereço
   */
  removeAddress(index: number): void {
    if (this.addressesFormArray.length > 1) {
      this.addressesFormArray.removeAt(index);
      this.validateDuplicateAddresses();
    } else {
      this.snackBar.open('É necessário ter pelo menos um endereço', 'Fechar', { duration: 3000 });
    }
  }

  /**
   * Valida endereços duplicados após mudanças
   */
  private validateDuplicateAddresses(): void {
    this.addressesFormArray.controls.forEach((control, index) => {
      control.setValidators([
        duplicateAddressValidator(this.addressesFormArray.value, index)
      ]);
      control.updateValueAndValidity();
    });
  }

  /**
   * Marca um endereço como principal
   */
  setMainAddress(index: number): void {
    this.addressesFormArray.controls.forEach((control, controlIndex) => {
      control.get('isMain')?.setValue(controlIndex === index);
    });
  }

  /**
   * Validador de confirmação de senha
   */
  private passwordMatchValidator(control: AbstractControl): any {
    const form = control as FormGroup;
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (password !== confirmPassword && form.get('confirmPassword')) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (form.get('confirmPassword')?.hasError?.('passwordMismatch')) {
      form.get('confirmPassword')?.setErrors(null);
    }
    
    return null;
  }

  /**
   * Submete o formulário de cadastro
   */
  async onSubmit(): Promise<void> {
    if (!this.userForm.valid) {
      this.markFormGroupTouched(this.userForm);
      this.snackBar.open('Por favor, corrija os erros no formulário', 'Fechar', { duration: 3000 });
      return;
    }

    // Verifica se pelo menos um endereço está marcado como principal
    const hasMainAddress = this.addressesFormArray.value.some((addr: any) => addr.isMain);
    if (!hasMainAddress) {
      this.snackBar.open('Marque pelo menos um endereço como principal', 'Fechar', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    const userData = {
      firstName: this.userForm.value.firstName.trim(),
      lastName: this.userForm.value.lastName.trim(),
      email: this.userForm.value.email.trim(),
      cpf: this.userForm.value.cpf.replace(/[^\d]/g, ''),
      phone: this.userForm.value.phone.replace(/[^\d]/g, ''),
      password: this.userForm.value.password,
      confirmPassword: this.userForm.value.confirmPassword,
      addresses: this.userForm.value.addresses.map((addr: any, index: number) => ({
        street: addr.street.trim(),
        number: addr.number.trim(),
        complement: addr.complement?.trim() || '',
        neighborhood: addr.neighborhood.trim(),
        city: addr.city.trim(),
        state: addr.state,
        zipCode: addr.zipCode.replace(/[^\d]/g, ''),
        country: addr.country,
        isMain: addr.isMain,
        order: index + 1
      }))
    };

    try {
      const user = await this.authService.register(userData);
      
      this.snackBar.open('Usuário cadastrado com sucesso!', 'Fechar', { duration: 3000 });
      
      // Redireciona para login após cadastro bem-sucedido
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Erro no cadastro:', error);
      const errorMessage = error.error?.Message || error.message || 'Erro interno do servidor';
      this.snackBar.open(`Erro: ${errorMessage}`, 'Fechar', { duration: 5000 });
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Marca todos os campos do formulário como touched para exibir erros
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(group => {
          if (group instanceof FormGroup) {
            this.markFormGroupTouched(group);
          }
        });
      }
    });
  }

  /**
   * Formatar CPF enquanto o usuário digita
   */
  formatCPF(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      event.target.value = value;
    }
  }

  /**
   * Formatar telefone enquanto o usuário digita
   */
  formatPhone(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      if (value.length <= 10) {
        value = value.replace(/(\d{2})(\d)/, '($1) $2');
        value = value.replace(/(\d{4})(\d)/, '$1-$2');
      } else {
        value = value.replace(/(\d{2})(\d)/, '($1) $2');
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
      }
      event.target.value = value;
    }
  }

  /**
   * Formatar CEP enquanto o usuário digita
   */
  formatZipCode(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length <= 8) {
      value = value.replace(/(\d{5})(\d)/, '$1-$2');
      event.target.value = value;
    }
  }
}
