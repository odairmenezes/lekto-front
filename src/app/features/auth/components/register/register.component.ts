import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { cpfValidator, passwordValidator, basePasswordMatchValidator as passwordMatchValidator, cadCpfValidator, cadNameValidator, cadPasswordValidator, cadPhoneValidator } from '../../../../shared/validators';
import { MatStepper } from '@angular/material/stepper';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

interface AddressForm {
  street: FormGroup;
  number: FormGroup;
  complement?: FormGroup;
  neighborhood: FormGroup;
  city: FormGroup;
  state: FormGroup;
  zipCode: FormGroup;
  country: FormGroup;
  isMain: FormGroup;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatSelectModule,
    MatProgressBarModule,
    MatTooltipModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {
  @ViewChild('stepper') stepper!: MatStepper;
  private destroy$ = new Subject<void>();
  
  registerForm!: FormGroup;
  isLoading = false;
  currentStep = 1;
  totalSteps = 3;
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    // Auto-redirect se já estiver logado
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Configurar validação em tempo real com debounce
    this.setupRealTimeValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): void {
    this.registerForm = this.fb.group({
      // Dados pessoais
      firstName: ['', [Validators.required, cadNameValidator()]],
      lastName: ['', [Validators.required, cadNameValidator()]],
      cpf: ['', [Validators.required, cadCpfValidator()]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, cadPhoneValidator()]],
      
      // Senhas
      password: ['', [Validators.required, cadPasswordValidator()]],
      confirmPassword: ['', [Validators.required]],
      
      // Endereços
      addresses: this.fb.array([this.createAddressForm()])
    }, { validators: passwordMatchValidator('password', 'confirmPassword') });
  }

  private createAddressForm(): FormGroup {
    return this.fb.group({
      street: ['', [Validators.required]],
      number: ['', [Validators.required]],
      complement: [''],
      neighborhood: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}-\d{3}$/)]],
      country: ['Brasil', [Validators.required]],
      isMain: [true]
    });
  }

  get addresses() {
    return this.registerForm.get('addresses') as FormArray;
  }

  nextStep(): void {
    // Navegar para próximo step
    
    // Navegar usando stepper Angular Material DIRETAMENTE
    if (this.stepper.selectedIndex < 2) {
      this.stepper.next();
      // Step atualizado
    }
    
    // Marcar campos para mostrar erros visuais
    this.registerForm.markAllAsTouched();
  }

  previousStep(): void {
    // Voltar para step anterior
    
    // Navegar usando stepper Angular Material DIRETAMENTE
    if (this.stepper.selectedIndex > 0) {
      this.stepper.previous();
      // Step anterior atualizado
    }
  }

  isCurrentStepValid(): boolean {
    switch (this.currentStep) {
      case 1:
        const personalData = ['firstName', 'lastName', 'cpf', 'email', 'phone'];
        return personalData.every(field => this.registerForm.get(field)?.valid);
      case 2:
        return Boolean(this.registerForm.get('password')?.valid) && 
               Boolean(this.registerForm.get('confirmPassword')?.valid) &&
               !this.hasPasswordMismatch();
      case 3:
        return this.addresses.length > 0 && this.addresses.controls.every(address => address.valid);
      default:
        return false;
    }
  }

  addAddress(): void {
    if (this.addresses.length < 5) { // Limite de 5 endereços
      const newAddress = this.createAddressForm();
      newAddress.get('isMain')?.setValue(false);
      this.addresses.push(newAddress);
    }
  }

  removeAddress(index: number): void {
    if (this.addresses.length > 1) {
      this.addresses.removeAt(index);
      
      // Se removemos um endereço principal, marcar o primeiro como principal
      const mainAddresses = this.addresses.controls.filter(addr => addr.get('isMain')?.value);
      if (mainAddresses.length === 0 && this.addresses.length > 0) {
        this.addresses.at(0).get('isMain')?.setValue(true);
      }
    }
  }

  setMainAddress(index: number): void {
    this.addresses.controls.forEach((_, i) => {
      this.addresses.at(i).get('isMain')?.setValue(i === index);
    });
  }

  private showStepValidationErrors(): void {
    // Array para coletar erros da etapa atual
    const errors: string[] = [];

    switch (this.currentStep) {
      case 1: // Dados Pessoais
        // Verificar campos da primeira etapa
        // Verificar todos os campos obrigatórios da etapa 1
        const requiredFields = [
          { field: 'firstName', name: 'Nome', exists: false },
          { field: 'lastName', name: 'Sobrenome', exists: false },
          { field: 'email', name: 'Email', exists: false },
          { field: 'cpf', name: 'CPF', exists: false },
          { field: 'phone', name: 'Telefone', exists: false }
        ];

        requiredFields.forEach(requiredField => {
          const field = this.registerForm.get(requiredField.field);
          
          // Verificar se campo existe (foi preenchido) - apenas para campos obrigatórios
          if (!field?.value || field.value.trim() === '') {
            errors.push(`${requiredField.name} é obrigatório`);
          }
          // Verificar erros de validação se o campo foi preenchido
          else if (field?.errors) {
            if (field.errors['required']) {
              errors.push(`${requiredField.name} é obrigatório`);
            } else if (field.errors['minlength'] && (requiredField.field === 'firstName' || requiredField.field === 'lastName')) {
              errors.push(`${requiredField.name} deve ter pelo menos 2 caracteres`);
            } else if (field.errors['email'] && requiredField.field === 'email') {
              errors.push(`${requiredField.name} deve ter formato válido`);
            } else if (field.errors['cpfInvalid'] && requiredField.field === 'cpf') {
              errors.push(`${requiredField.name} inválido. Use o formato 000.000.000-00`);
            } else if (field.errors['pattern'] && requiredField.field === 'phone') {
              errors.push(`${requiredField.name} deve ter formato válido (00) 00000-0000`);
            }
          }
        });
        break;

      case 2: // Senha
        // Verificar campos da etapa 2
        const passwordRequiredFields = [
          { field: 'password', name: 'Senha' },
          { field: 'confirmPassword', name: 'Confirmação de senha' }
        ];

        passwordRequiredFields.forEach(requiredField => {
          const field = this.registerForm.get(requiredField.field);
          
          // Verificar se campo existe (foi preenchido)
          if (!field?.value || field.value.trim() === '') {
            errors.push(`${requiredField.name} é obrigatória`);
          }
          // Verificar erros de validação se o campo foi preenchido
          else if (field?.errors) {
            if (field.errors['required']) {
              errors.push(`${requiredField.name} é obrigatória`);
            } else if (requiredField.field === 'password') {
              // Erros específicos da senha
              if (field.errors['passwordMinLength']) {
                errors.push('Senha deve ter pelo menos 8 caracteres');
              } else if (field.errors['passwordLowercase']) {
                errors.push('Senha deve conter pelo menos 1 letra minúscula');
              } else if (field.errors['passwordUppercase']) {
                errors.push('Senha deve conter pelo menos 1 letra maiúscula');
              } else if (field.errors['passwordNumber']) {
                errors.push('Senha deve conter pelo menos 1 número');
              } else if (field.errors['passwordSpecial']) {
                errors.push('Senha deve conter pelo menos 1 caractere especial (!@#$%^&*)');
              }
            }
          }
        });

        // Verificar senhas diferentes
        if (this.registerForm.hasError('passwordMismatch')) {
          errors.push('As senhas não coincidem');
        }
        break;

      case 3: // Endereços
        const addresses = this.registerForm.get('addresses') as FormArray;
        if (addresses.length === 0) {
          errors.push('Adicione pelo menos um endereço');
        } else {
          addresses.controls.forEach((addressGroup, index) => {
            const addressNumber = index + 1;
            const addressFormGroup = addressGroup as FormGroup;
            
            // Verificar campos obrigatórios do endereço
            const requiredAddressFields = [
              { field: 'street', name: 'Rua' },
              { field: 'number', name: 'Número' },
              { field: 'neighborhood', name: 'Bairro' },
              { field: 'city', name: 'Cidade' },
              { field: 'state', name: 'Estado' },
              { field: 'zipCode', name: 'CEP' },
              { field: 'country', name: 'País' }
            ];

            requiredAddressFields.forEach(requiredField => {
              const field = addressFormGroup.get(requiredField.field);
              
              // Verificar se campo está vazio (obrigatório)
              if (!field?.value || field.value.trim() === '') {
                errors.push(`Endereço ${addressNumber}: ${requiredField.name} é obrigatório`);
              }
              // Verificar erros de validação se o campo foi preenchido
              else if (field?.errors) {
                if (field.errors['required']) {
                  errors.push(`Endereço ${addressNumber}: ${requiredField.name} é obrigatório`);
                } else if (field.errors['pattern'] && requiredField.field === 'zipCode') {
                  errors.push(`Endereço ${addressNumber}: CEP deve ter formato 00000-000`);
                }
              }
            });
          });

          // Verificar se pelo menos uma endereço principal existe
          const hasMainAddress = addresses.controls.some(control => control.get('isMain')?.value);
          if (!hasMainAddress && addresses.length > 0) {
            errors.push('Marque pelo menos um endereço como principal');
          }
        }
        break;
    }

    // Mostrar erros da etapa atual
    if (errors.length > 0) {
      // Mostrar primeiro erro como principal
      this.notificationService.showError(errors[0]);
      
      // Mostrar outros erros com delay para não sobrepor
      errors.slice(1).forEach((error, index) => {
        setTimeout(() => {
          this.notificationService.showWarning(error);
        }, (index + 1) * 1500); // 1.5 segundos entre cada toast
      });
    }
  }

  onSubmit(): void {
    if (!this.registerForm.valid && !this.isLoading) {
      this.registerForm.markAllAsTouched();
      this.showValidationErrors();
      return;
    }

    if (this.isLoading || !this.registerForm.valid) return;

    this.isLoading = true;
    
    // Verificar se email já existe
    this.userService.checkEmailExists(this.registerForm.get('email')?.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (emailExists) => {
          if (emailExists) {
            this.isLoading = false;
            this.notificationService.showError('Este email já está cadastrado');
            return;
          }
          
          // Verificar se CPF já existe
          this.userService.checkCpfExists(this.registerForm.get('cpf')?.value.replace(/\D/g, ''))
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (cpfExists) => {
                if (cpfExists) {
                  this.isLoading = false;
                  this.notificationService.showError('Este CPF já está cadastrado');
                  return;
                }
                
                // Fazer registro
                this.performRegister();
              },
              error: (error) => {
                this.isLoading = false;
                console.error('Erro ao verificar CPF:', error);
                this.notificationService.showError('Erro ao verificar dados');
              }
            });
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Erro ao verificar email:', error);
          this.notificationService.showError('Erro ao verificar dados');
        }
      });
  }

  private showValidationErrors(): void {
    // Array para coletar todos os erros
    const errors: string[] = [];

    // Verificar cada campo individualmente
    const firstNameField = this.registerForm.get('firstName');
    if (firstNameField?.errors && firstNameField.touched) {
      if (firstNameField.errors['required']) {
        errors.push('Nome é obrigatório');
      } else if (firstNameField.errors['minlength']) {
        errors.push('Nome deve ter pelo menos 2 caracteres');
      }
    }

    const lastNameField = this.registerForm.get('lastName');
    if (lastNameField?.errors && lastNameField.touched) {
      if (lastNameField.errors['required']) {
        errors.push('Sobrenome é obrigatório');
      } else if (lastNameField.errors['minlength']) {
        errors.push('Sobrenome deve ter pelo menos 2 caracteres');
      }
    }

    const emailField = this.registerForm.get('email');
    if (emailField?.errors && emailField.touched) {
      if (emailField.errors['required']) {
        errors.push('Email é obrigatório');
      } else if (emailField.errors['email']) {
        errors.push('Email deve ter um formato válido');
      }
    }

    const cpfField = this.registerForm.get('cpf');
    if (cpfField?.errors && cpfField.touched) {
      if (cpfField.errors['required']) {
        errors.push('CPF é obrigatório');
      } else if (cpfField.errors['cpfInvalid']) {
        errors.push('CPF inválido');
      }
    }

    const phoneField = this.registerForm.get('phone');
    if (phoneField?.errors && phoneField.touched) {
      if (phoneField.errors['required']) {
        errors.push('Telefone é obrigatório');
      } else if (phoneField.errors['pattern']) {
        errors.push('Telefone deve ter formato válido');
      }
    }

    const passwordField = this.registerForm.get('password');
    if (passwordField?.errors && passwordField.touched) {
      if (passwordField.errors['required']) {
        errors.push('Senha é obrigatória');
      } else if (passwordField.errors['passwordMinLength']) {
        errors.push('Senha deve ter pelo menos 8 caracteres');
      } else if (passwordField.errors['passwordLowercase']) {
        errors.push('Senha deve conter pelo menos 1 letra minúscula');
      } else if (passwordField.errors['passwordUppercase']) {
        errors.push('Senha deve conter pelo menos 1 letra maiúscula');
      } else if (passwordField.errors['passwordNumber']) {
        errors.push('Senha deve conter pelo menos 1 número');
      } else if (passwordField.errors['passwordSpecial']) {
        errors.push('Senha deve conter pelo menos 1 caractere especial');
      }
    }

    const confirmPasswordField = this.registerForm.get('confirmPassword');
    if (confirmPasswordField?.errors && confirmPasswordField.touched) {
      if (confirmPasswordField.errors['required']) {
        errors.push('Confirmação de senha é obrigatória');
      }
    }

    // Verificar erro de senhas diferentes
    if (this.registerForm.hasError('passwordMismatch')) {
      errors.push('As senhas não coincidem');
    }

    // Verificar endereços
    const addresses = this.registerForm.get('addresses') as FormArray;
    addresses.controls.forEach((addressGroup, index) => {
      const addressNumber = index + 1;
      const addressFormGroup = addressGroup as FormGroup;
      
      Object.keys(addressFormGroup.controls).forEach(fieldName => {
        const field = addressFormGroup.get(fieldName);
        if (field?.errors && field.touched) {
          const fieldLabels: { [key: string]: string } = {
            street: 'Rua',
            number: 'Número',
            neighborhood: 'Bairro',
            city: 'Cidade',
            state: 'Estado',
            zipCode: 'CEP',
            country: 'País'
          };

          if (field.errors['required']) {
            errors.push(`Endereço ${addressNumber}: ${fieldLabels[fieldName]} é obrigatório`);
          } else if (field.errors['pattern'] && fieldName === 'zipCode') {
            errors.push(`Endereço ${addressNumber}: CEP deve ter formato 00000-000`);
          }
        }
      });
    });

    // Mostrar todos os erros encontrados
    if (errors.length > 0) {
      // Mostrar primeiro erro como principal
      this.notificationService.showError(errors[0]);
      
      // Mostrar outros erros com delay para não sobrepor
      errors.slice(1).forEach((error, index) => {
        setTimeout(() => {
          this.notificationService.showWarning(error);
        }, (index + 1) * 2000); // 2 segundos entre cada toast
      });
    }
  }

  private setupRealTimeValidation(): void {
    // Debounce para evitar muitos toasts enquanto o usuário digita
    const debounceDelay = 1500; // 1.5 segundos

    // Monitorar campos principais
    this.registerForm.get('firstName')?.valueChanges
      .pipe(
        debounceTime(debounceDelay),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.validateSingleField('firstName'));

    this.registerForm.get('lastName')?.valueChanges
      .pipe(
        debounceTime(debounceDelay),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.validateSingleField('lastName'));

    this.registerForm.get('email')?.valueChanges
      .pipe(
        debounceTime(debounceDelay),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.validateSingleField('email'));

    this.registerForm.get('cpf')?.valueChanges
      .pipe(
        debounceTime(debounceDelay),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.validateSingleField('cpf'));

    this.registerForm.get('phone')?.valueChanges
      .pipe(
        debounceTime(debounceDelay),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.validateSingleField('phone'));

    this.registerForm.get('password')?.valueChanges
      .pipe(
        debounceTime(debounceDelay),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.validateSingleField('password'));

    this.registerForm.get('confirmPassword')?.valueChanges
      .pipe(
        debounceTime(debounceDelay),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.validatePasswordConfirmation());

    // Monitorar mudanças no formulário geral para senhas
    this.registerForm.statusChanges
      .pipe(
        debounceTime(debounceDelay),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.registerForm.hasError('passwordMismatch')) {
          this.notificationService.showWarning('As senhas não coincidem');
        }
      });
  }

  private validateSingleField(fieldName: string): void {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.touched || field.value === '') return;

    if (field.errors) {
      let errorMessage = '';

      switch (fieldName) {
        case 'firstName':
          if (field.errors['required']) {
            errorMessage = 'Nome é obrigatório';
          } else if (field.errors['minlength']) {
            errorMessage = 'Nome deve ter pelo menos 2 caracteres';
          }
          break;
        case 'lastName':
          if (field.errors['required']) {
            errorMessage = 'Sobrenome é obrigatório';
          } else if (field.errors['minlength']) {
            errorMessage = 'Sobrenome deve ter pelo menos 2 caracteres';
          }
          break;
        case 'email':
          if (field.errors['required']) {
            errorMessage = 'Email é obrigatório';
          } else if (field.errors['email']) {
            errorMessage = 'Email deve ter um formato válido';
          }
          break;
        case 'cpf':
          if (field.errors['required']) {
            errorMessage = 'CPF é obrigatório';
          } else if (field.errors['cpfInvalid']) {
            errorMessage = 'CPF inválido. Use o formato 000.000.000-00';
          }
          break;
        case 'phone':
          if (field.errors['required']) {
            errorMessage = 'Telefone é obrigatório';
          } else if (field.errors['pattern']) {
            errorMessage = 'Telefone deve ter formato válido (00) 00000-0000';
          }
          break;
        case 'password':
          if (field.errors['required']) {
            errorMessage = 'Senha é obrigatória';
          } else if (field.errors['passwordMinLength']) {
            errorMessage = 'Senha deve ter pelo menos 8 caracteres';
          } else if (field.errors['passwordLowercase']) {
            errorMessage = 'Senha deve conter pelo menos 1 letra minúscula';
          } else if (field.errors['passwordUppercase']) {
            errorMessage = 'Senha deve conter pelo menos 1 letra maiúscula';
          } else if (field.errors['passwordNumber']) {
            errorMessage = 'Senha deve conter pelo menos 1 número';
          } else if (field.errors['passwordSpecial']) {
            errorMessage = 'Senha deve conter pelo menos 1 caractere especial (!@#$%^&*)';
          }
          break;
      }

      if (errorMessage) {
        this.notificationService.showError(errorMessage);
      }
    }
  }

  private validatePasswordConfirmation(): void {
    const passwordField = this.registerForm.get('password');
    const confirmPasswordField = this.registerForm.get('confirmPassword');
    
    if (!confirmPasswordField?.touched || !confirmPasswordField.value) return;

    if (passwordField?.value !== confirmPasswordField.value && confirmPasswordField.value !== '') {
      this.notificationService.showWarning('As senhas não coincidem');
    }
  }

  private performRegister(): void {
    const formData = this.registerForm.value;
    
    const registerData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      cpf: formData.cpf.replace(/\D/g, ''),
      phone: formData.phone.replace(/\D/g, ''),
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      addresses: formData.addresses.map((addr: any) => ({
        street: addr.street.trim(),
        number: addr.number.trim(),
        complement: addr.complement?.trim(),
        neighborhood: addr.neighborhood.trim(),
        city: addr.city.trim(),
        state: addr.state.trim(),
        zipCode: addr.zipCode.replace(/\D/g, ''),
        country: addr.country.trim(),
        isMain: addr.isMain
      }))
    };

    this.userService.createUser(registerData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.isLoading = false;
          this.notificationService.showSuccess(`Usuário ${user.firstName} cadastrado com sucesso!`);
          this.router.navigate(['/auth/login'], { 
            queryParams: { 
              message: 'Cadastro realizado com sucesso. Entre com suas credenciais.',
              email: user.email 
            } 
          });
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Erro no registro:', error);
          
          if (error.message) {
            this.notificationService.showError(error.message);
          } else {
            this.notificationService.showError('Erro ao realizar cadastro. Verifique os dados e tente novamente.');
          }
        }
      });
  }

  hasPasswordMismatch(): boolean {
    return this.registerForm.hasError('passwordMismatch');
  }

  // Métodos para exibir erros formatados
  getFieldErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    
    if (field?.errors && field.touched) {
      const errors = field.errors;
      
      if (errors['required']) {
        const labels = {
          firstName: 'Nome',
          lastName: 'Sobrenome',
          email: 'Email',
          cpf: 'CPF',
          phone: 'Telefone',
          password: 'Senha',
          confirmPassword: 'Confirmação de senha'
        };
        return `${labels[fieldName as keyof typeof labels]} é obrigatório`;
      }
      
      if (errors['email']) return 'Email deve ser válido';
      if (errors['minlength']) return 'Deve ter pelo menos 2 caracteres';
      if (errors['pattern']) return 'Formato inválido';
      if (errors['cpfInvalid']) return errors['cpfInvalid']['message'];
      
      // Erros específicos de senha
      if (errors['passwordLowercase']) return errors['passwordLowercase']['message'];
      if (errors['passwordUppercase']) return errors['passwordUppercase']['message'];
      if (errors['passwordSpecial']) return errors['passwordSpecial']['message'];
      if (errors['passwordNumber']) return errors['passwordNumber']['message'];
      if (errors['passwordMinLength']) return errors['passwordMinLength']['message'];
    }
    
    return '';
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  getPasswordStrength(): number {
    const password = this.registerForm.get('password')?.value || '';
    let strength = 0;

    if (password.length >= 8) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 20;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 20;

    return strength;
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    if (strength < 40) return 'Fraca';
    if (strength < 80) return 'Média';
    return 'Forte';
  }

  onSelect(event: any): void {
    // Método para lidar com seleção de opções, se necessário
  }
}
