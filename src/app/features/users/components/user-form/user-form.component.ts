import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { UsersService } from '../../services/users.service';
import { UserResponse, UserCreateDto, UserUpdateDto, UserService } from '../../../../core/services/user.service';
import { Address } from '../../../../shared/models/user.model';
import { cpfValidator, passwordValidator, basePasswordMatchValidator as passwordMatchValidator, cadCpfValidator, cadNameValidator, cadPasswordValidator, cadPhoneValidator, zipCodeValidator, cadEmailValidator } from '../../../../shared/validators';
import { NotificationService } from '../../../../core/services/notification.service';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface UserFormData {
  user?: UserResponse;
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  userForm!: FormGroup;
  isEditMode!: boolean;
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;
  
  stateOptions = [
    { value: 'AC', label: 'Acre' },
    { value: 'AL', label: 'Alagoas' },
    { value: 'AP', label: 'Amapá' },
    { value: 'AM', label: 'Amazonas' },
    { value: 'BA', label: 'Bahia' },
    { value: 'CE', label: 'Ceará' },
    { value: 'DF', label: 'Distrito Federal' },
    { value: 'ES', label: 'Espírito Santo' },
    { value: 'GO', label: 'Goiás' },
    { value: 'MA', label: 'Maranhão' },
    { value: 'MT', label: 'Mato Grosso' },
    { value: 'MS', label: 'Mato Grosso do Sul' },
    { value: 'MG', label: 'Minas Gerais' },
    { value: 'PA', label: 'Pará' },
    { value: 'PB', label: 'Paraíba' },
    { value: 'PR', label: 'Paraná' },
    { value: 'PE', label: 'Pernambuco' },
    { value: 'PI', label: 'Piauí' },
    { value: 'RJ', label: 'Rio de Janeiro' },
    { value: 'RN', label: 'Rio Grande do Norte' },
    { value: 'RS', label: 'Rio Grande do Sul' },
    { value: 'RO', label: 'Rondônia' },
    { value: 'RR', label: 'Roraima' },
    { value: 'SC', label: 'Santa Catarina' },
    { value: 'SP', label: 'São Paulo' },
    { value: 'SE', label: 'Sergipe' },
    { value: 'TO', label: 'Tocantins' }
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private notificationService: NotificationService,
    private dialogRef: MatDialogRef<UserFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserFormData
  ) {
    console.log('🔧 UserFormComponent - Dados recebidos:', data);
    this.isEditMode = data.mode === 'edit';
    this.createForm();
  }

  ngOnInit(): void {
    console.log('🚀 ngOnInit - Mode:', this.isEditMode, 'User data:', this.data.user);
    if (this.isEditMode && this.data.user) {
      console.log('📝 Preenchendo formulário no ngOnInit');
      this.populateForm(this.data.user);
    } else {
      console.log('⚠️ Não há usuário para preencher ou não está no modo edição');
    }
    
    // Log do estado inicial do formulário
    console.log('📋 Estado inicial do formulário:');
    console.log('- Form válido:', this.userForm.valid);
    console.log('- Endereços:', this.userForm.get('addresses')?.value);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): void {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, cadNameValidator()]],
      lastName: ['', [Validators.required, cadNameValidator()]],
      email: ['', [Validators.required, cadEmailValidator()]],
      cpf: ['', this.isEditMode ? [] : [Validators.required, cadCpfValidator()]],
      phone: ['', [Validators.required, cadPhoneValidator()]],
      
      // Campos de senha - apenas para criação
      password: ['', this.isEditMode ? [] : [Validators.required, cadPasswordValidator()]],
      confirmPassword: ['', this.isEditMode ? [] : [Validators.required]],
      
      // Endereços
      addresses: this.fb.array([this.createAddressForm()])
    });

    // Validador de confirmação de senha apenas para criação
    if (!this.isEditMode) {
      this.userForm.setValidators(passwordMatchValidator('password', 'confirmPassword'));
    }

    // Observar mudanças no formulário para debug
    this.userForm.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        console.log('🔄 Formulário mudou - Válido:', this.userForm.valid, 'Validação para submissão:', this.isFormValidForSubmission());
      });
  }

  private createAddressForm(): FormGroup {
    return this.fb.group({
      street: ['', [Validators.required]],
      number: [''], // Campo totalmente opcional
      complement: [''], // Campo totalmente opcional
      neighborhood: [''], // Campo totalmente opcional
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required, zipCodeValidator]],
      country: ['Brasil', [Validators.required]],
      isMain: [true]
    });
  }

  private populateForm(user: UserResponse): void {
    console.log('📝 Preenchendo formulário com dados do usuário:', user);
    
    this.userForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      cpf: user.cpf,
      phone: user.phone
    });

    // Desabilitar CPF quando editando usuário existente
    if (this.isEditMode) {
      console.log('🔒 Desabilitando campo CPF para edição');
      this.userForm.get('cpf')?.disable();
    }

    // Carregar endereços
    if (user.addresses && user.addresses.length > 0) {
      console.log('🏠 ========== CARREGANDO ENDEREÇOS DO USUÁRIO ==========');
      console.log('🏠 Total de endereços na resposta:', user.addresses.length);
      this.addresses.clear();
      user.addresses.forEach((address: Address, index) => {
        console.log(`🏠 Endereço ${index}:`, {
          street: address.street,
          isMain: address.isMain,
          id: address.id
        });
        console.log(`🏠 Valor isMain do backend: ${address.isMain} (tipo: ${typeof address.isMain})`);
        
        const formGroup = this.createAddressFormFromAddress(address);
        console.log(`🏠 FormGroup criado - isMain value:`, formGroup.get('isMain')?.value);
        console.log(`🏠 FormGroup criado - isMain tipo:`, typeof formGroup.get('isMain')?.value);
        
        this.addresses.push(formGroup);
      });
      
      console.log('🏠 Endereços carregados no FormArray:', this.addresses.controls.length);
      console.log('🏠 Status isMain de cada endereço:');
      this.addresses.controls.forEach((addr, index) => {
        console.log(`🏠  Endereço ${index} - isMain: ${addr.get('isMain')?.value}`);
      });
      
      // Verificar se há endereços principais na resposta do backend
      const mainAddressesFromResponse = user.addresses.filter(addr => addr.isMain);
      console.log('🏠 Endereços principais na resposta:', mainAddressesFromResponse.length);
      console.log('🏠 Lista de endereços principais:', mainAddressesFromResponse.map(addr => ({ isMain: addr.isMain, street: addr.street })));
      
      // Forçar verificação após carregar endereços
      console.log('🏠 Executando verificação de endereços principais...');
      this.checkMainAddressStatus();
    } else {
      console.log('🏠 Usuário sem endereços registrados');
      // Se não há endereços, adicionar pelo menos um endereço vazio
      this.addresses.clear();
      this.addAddress();
      console.log('🏠 Após adicionar endereço vazio, verificando status principal...');
      this.checkMainAddressStatus();
    }
    
    console.log('✅ Formulário preenchido com sucesso');
    
    // Marcar todos os campos como tocados para habilitar validação
    this.markAllFieldsAsTouched();
    
    // Verificação final de estados
    console.log('🔍 VERIFICAÇÃO FINAL DE ENDEREÇOS PRINCIPAIS:');
    this.checkMainAddressStatus();
  }
  
  private markAllFieldsAsTouched(): void {
    // Marcar campos principais como tocados
    const mainFields = ['firstName', 'lastName', 'email', 'cpf', 'phone'];
    mainFields.forEach(field => {
      const control = this.userForm.get(field);
      if (control) control.markAsTouched();
    });
    
    // Marcar campos de endereços como tocados
    const addresses = this.userForm.get('addresses') as FormArray;
    addresses.controls.forEach(address => {
      const addrFields = ['street', 'number', 'neighborhood', 'city', 'state', 'zipCode', 'country'];
      addrFields.forEach(field => {
        const control = address.get(field);
        if (control) control.markAsTouched();
      });
    });
    
    console.log('🎯 Todos os campos marcados como tocados para validação');
  }
  
  private checkMainAddressStatus(): void {
    console.log('🔍 ======= VERIFICAÇÃO FORÇADA DE ENDEREÇOS PRINCIPAIS =======');
    console.log('🔍 Total de endereços:', this.addresses.length);
    
    this.addresses.controls.forEach((addr, index) => {
      const isMain = addr.get('isMain')?.value;
      const street = addr.get('street')?.value || 'SEM STREET';
      console.log(`🔍 Endereço ${index}: isMain = ${isMain} (tipo: ${typeof isMain}), street = "${street}"`);
    });
    
    const hasMainAddress = this.addresses.controls.some(addr => addr.get('isMain')?.value);
    const countMainAddresses = this.addresses.controls.filter(addr => addr.get('isMain')?.value).length;
    
    console.log('🔍 Possui endereço principal:', hasMainAddress);
    console.log('🔍 Quantidade de endereços principais:', countMainAddresses);
    
    // Se não há endereço principal, corrigir automaticamente
    if (!hasMainAddress && this.addresses.length > 0) {
      console.log('🔧 CORRIGINDO AUTOMATICAMENTE: Marcando primeiro endereço como principal');
      this.addresses.at(0)?.get('isMain')?.setValue(true);
      const correctedMain = this.addresses.at(0)?.get('isMain')?.value;
      console.log('🔧 Status após correção:', correctedMain);
    }
    
    console.log('🔍 ======= FIM DA VERIFICAÇÃO =======');
  }

  private createAddressFormFromAddress(address: Address): FormGroup {
    return this.fb.group({
      street: [address.street, [Validators.required]],
      number: [address.number || ''], // Campo opcional
      complement: [address.complement || ''],
      neighborhood: [address.neighborhood || ''], // Campo opcional
      city: [address.city, [Validators.required]],
      state: [address.state, [Validators.required]],
      zipCode: [address.zipCode, [Validators.required, zipCodeValidator]],
      country: [address.country || 'Brasil', [Validators.required]],
      isMain: [address.isMain]
    });
  }

  get addresses(): FormArray {
    return this.userForm.get('addresses') as FormArray;
  }

  addAddress(): void {
    if (this.addresses.length < 5) {
      const newAddress = this.createAddressForm();
      newAddress.get('isMain')?.setValue(false);
      
      // Marcar campos opcionais como válidos para evitar bordas vermelhas
      const optionalFields = ['number', 'neighborhood', 'complement'];
      optionalFields.forEach(field => {
        const fieldControl = newAddress.get(field);
        if (fieldControl) {
          // Remover qualquer validador e marcar como válido
          fieldControl.clearValidators();
          fieldControl.updateValueAndValidity();
        }
      });
      
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

  handleButtonClick(event: Event): void {
    this.onSubmit();
  }

  onSubmit(): void {
    console.log('🎯 MÉTODO onSubmit() CHAMADO');
    console.log('📝 Formulário válido (this.userForm.valid):', this.userForm.valid);
    console.log('🔧 Validação customizada (isFormValidForSubmission):', this.isFormValidForSubmission());
    console.log('⏳ isLoading:', this.isLoading);
    
    if (this.isFormValidForSubmission() && !this.isLoading) {
      console.log('✅ VALIDAÇÃO PASSOU! Prosseguindo com submissão...');
      
      // Validações adicionais antes de enviar
      const formData = this.userForm.value;
      
      // Verificar se há pelo menos um endereço
      console.log('🏠 Verificando endereços. Quantidade:', this.addresses.length);
      if (this.addresses.length === 0) {
        console.log('❌ REJEITADO: Nenhum endereço encontrado');
        this.notificationService.showWarning('Por favor, adicione pelo menos um endereço.');
        return;
      }
      
      // Verificar se há endereço principal definido
      const hasMainAddress = this.addresses.controls.some(addr => addr.get('isMain')?.value);
      console.log('🏠 ========== VALIDAÇÃO DE ENDEREÇO PRINCIPAL ==========');
      console.log('🏠 Quantidade de endereços:', this.addresses.controls.length);
      console.log('🏠 Endereços detalhados:');
      this.addresses.controls.forEach((addr, index) => {
        const isMain = addr.get('isMain')?.value;
        const street = addr.get('street')?.value || 'SEM STREET';
        console.log(`🏠  Endereço ${index}: isMain=${isMain}, street="${street}"`);
        console.log(`🏠  Valor brute isMain:`, addr.get('isMain')?.value);
        console.log(`🏠  Tipo do valor:`, typeof addr.get('isMain')?.value);
      });
      console.log('🏠 hasMainAddress result:', hasMainAddress);
      
      if (!hasMainAddress) {
        console.log('❌ ===== REJEITADO POR ENDEREÇO PRINCIPAL =====');
        console.log('❌ Motivo: hasMainAddress = false');
        console.log('❌ Total de endereços:', this.addresses.controls.length);
        console.log('❌ Primeiro endereço deveria ser automaticamente principal!');
        this.notificationService.showWarning('Por favor, defina um endereço principal.');
        return;
      }
      
      // Verificar senhas em modo de criação
      if (!this.isEditMode) {
        const password = this.userForm.get('password')?.value;
        const confirmPassword = this.userForm.get('confirmPassword')?.value;
        
        if (!password || password.length < 6) {
          this.notificationService.showWarning('A senha deve ter pelo menos 6 caracteres.');
          return;
        }
        
        if (password !== confirmPassword) {
          this.notificationService.showWarning('As senhas não coincidem.');
          return;
        }
      }

      console.log('🚀 INICIANDO SUBMISSÃO DO FORMULÁRIO');
      console.log('🔍 Modo edição:', this.isEditMode);
      console.log('📝 Formulário válido:', this.userForm.valid);
      
      this.isLoading = true;
      
      const processedData = this.processFormData(formData);
      console.log('📋 Dados processados para envio:', processedData);
      console.log('📋 Tipo de dados:', typeof processedData);
      console.log('🔍 Dados não são nulos?', processedData !== null && processedData !== undefined);

      if (this.isEditMode) {
        console.log('✏️ EXECUTANDO: this.updateUser(processedData)');
        this.updateUser(processedData);
      } else {
        console.log('📝 EXECUTANDO: this.createUser(processedData)');
        this.createUser(processedData);
      }
    } else {
      console.log('❌ FORMULÁRIO NÃO VÁLIDO PARA SUBMISSÃO');
      console.log('📝 this.userForm.valid:', this.userForm.valid);
      console.log('🔧 this.isFormValidForSubmission():', this.isFormValidForSubmission());
      console.log('⏳ this.isLoading:', this.isLoading);
      
      this.userForm.markAllAsTouched();
      this.notificationService.showWarning('Por favor, corrija os erros no formulário');
      
      // Log detalhado dos erros para debug
      Object.keys(this.userForm.controls).forEach(key => {
        const controlErrors = this.userForm.get(key)?.errors;
        if (controlErrors) {
          console.error(`🚨 Erro no campo ${key}:`, controlErrors);
        }
      });
      
      // Log específico dos endereços
      console.log('🏠 Endereços válidos:', this.addresses.controls.map((addr, i) => ({
        index: i,
        valid: addr.valid,
        errors: addr.errors
      })));
    }
  }

  private processFormData(formData: any): any {
    const processedData: any = {
      firstName: (formData.firstName || '').trim(),
      lastName: (formData.lastName || '').trim(),
      email: (formData.email || '').trim().toLowerCase(),
      cpf: (formData.cpf || '').replace(/\D/g, ''),
      phone: (formData.phone || '').replace(/\D/g, ''),
      addresses: formData.addresses.map((addr: any) => ({
        street: (addr.street || '').trim(),
        number: (addr.number || '').trim(),
        complement: (addr.complement || '').trim(),
        neighborhood: (addr.neighborhood || '').trim(),
        city: (addr.city || '').trim(),
        state: (addr.state || '').trim(),
        zipCode: (addr.zipCode || '').replace(/\D/g, ''),
        country: (addr.country || '').trim(),
        isMain: addr.isMain
      }))
    };

    // Para criação, incluir password e confirmPassword
    // Para atualização, não incluir senha se não foi alterada
    if (!this.isEditMode) {
      processedData.password = formData.password;
      processedData.confirmPassword = formData.confirmPassword;
    } else if (formData.password && formData.password.length > 0) {
      processedData.password = formData.password;
      processedData.confirmPassword = formData.confirmPassword;
    }

    return processedData;
  }

  private createUser(userData: UserCreateDto): void {
    this.userService.createUser(userData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.notificationService.showSuccess('Usuário criado com sucesso!');
          this.dialogRef.close(response);
        },
        error: (error: any) => {
          this.isLoading = false;
          console.error('Erro ao criar usuário:', error);
          
          // Tratar diferentes tipos de erro HTTP
          if (error.status === 409) {
            this.notificationService.showError('Este usuário já existe! Email ou CPF já cadastrados.');
          } else if (error.status === 500) {
            this.notificationService.showError('Erro interno do servidor. Tente novamente mais tarde.');
          } else if (error.status === 0) {
            this.notificationService.showError('Erro de conexão. Verifique sua internet e tente novamente.');
          } else {
            const message = error.error?.message || error.message || 'Erro desconhecido ao criar usuário.';
            this.notificationService.showError(message);
          }
        }
      });
  }

  private updateUser(userData: Partial<UserUpdateDto>): void {
    console.log('🔧 Dados recebidos para updateUser:');
    console.log('- this.data:', this.data);
    console.log('- this.data.user:', this.data.user);
    console.log('- ID do usuário:', this.data.user?.id);
    console.log('- userData que será enviado:', userData);
    
    if (!this.data.user?.id) {
      console.error('❌ ID do usuário não encontrado nos dados recebidos!');
      this.notificationService.showError('ID do usuário não encontrado');
      return;
    }

    console.log('📡 Fazendo requisição UPDATE para ID:', this.data.user.id);
    this.userService.updateUser(this.data.user.id, userData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          console.log('✅ Usuário atualizado com sucesso!', response);
          this.notificationService.showSuccess('Usuário atualizado com sucesso!');
          this.dialogRef.close(response); // Passa os dados atualizados para o componente pai
        },
        error: (error: any) => {
          this.isLoading = false;
          console.error('❌ Erro ao atualizar usuário:', error);
          console.error('🔍 Detalhes completos do erro:', {
            status: error.status,
            message: error.message,
            url: error.url,
            error: error.error,
            userAgent: navigator.userAgent
          });
          
          if (error.status === 409) {
            this.notificationService.showError('Este email/CPF já está sendo usado por outro usuário.');
          } else if (error.status === 400) {
            this.notificationService.showError(error.error?.message || 'Dados inválidos. Verifique as informações.');
            console.log('📍 ERRO 400 - Informações detalhadas:');
            console.log('- ID usado:', this.data.user?.id);
            console.log('- Dados enviados:', userData);
            console.log('- Resposta do erro:', error.error);
          } else if (error.status === 500) {
            this.notificationService.showError('Erro interno do servidor. Tente novamente.');
          } else if (error.status === 0) {
            this.notificationService.showError('Erro de conexão. Verifique sua internet e tente novamente.');
          } else {
            const message = error.error?.message || error.message || 'Erro desconhecido ao atualizar usuário.';
            this.notificationService.showError(message);
          }
        }
      });
  }

  getFieldErrorMessage(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    
    if (field?.errors && field.touched) {
      const errors = field.errors;
      
      // Verificar erros específicos primeiro (antes do required)
      if (errors['cadNameLength']) return errors['cadNameLength']['message'];
      if (errors['cadNameInvalid']) return errors['cadNameInvalid']['message'];
      if (errors['cadEmailInvalid']) return errors['cadEmailInvalid']['message'];
      if (errors['cadCpfInvalid']) return errors['cadCpfInvalid']['message'];
      if (errors['cadPhoneInvalid']) return errors['cadPhoneInvalid']['message'];
      
      // Erros específicos de senha
      if (errors['passwordLowercase']) return errors['passwordLowercase']['message'];
      if (errors['passwordUppercase']) return errors['passwordUppercase']['message'];
      if (errors['passwordSpecial']) return errors['passwordSpecial']['message'];
      if (errors['passwordNumber']) return errors['passwordNumber']['message'];
      if (errors['passwordMinLength']) return errors['passwordMinLength']['message'];
      
      // Erros padrão do Angular
      if (errors['email']) return 'Email deve ser válido';
      if (errors['minlength']) return 'Deve ter pelo menos 2 caracteres';
      if (errors['pattern']) return 'Formato inválido';
      if (errors['cpfInvalid']) return errors['cpfInvalid']['message'];
      
      // Erro de campo obrigatório por último
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
    }
    
    return '';
  }

  getAddressFieldErrorMessage(addressIndex: number, fieldName: string): string {
    const addressGroup = this.addresses.at(addressIndex);
    const field = addressGroup.get(fieldName);
    
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        const labels = {
          street: 'Rua',
          number: 'Número',
          neighborhood: 'Bairro',
          city: 'Cidade',
          state: 'Estado',
          zipCode: 'CEP'
        };
        return `${labels[fieldName as keyof typeof labels]} é obrigatório`;
      }
      
      if (field.errors['pattern'] && fieldName === 'zipCode') {
        return 'CEP deve ter formato 00000-000';
      }
    }
    
    return '';
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  getDialogTitle(): string {
    return this.isEditMode ? 'Editar Usuário' : 'Novo Usuário';
  }

  getSubmitButtonText(): string {
    return this.isEditMode ? 'Atualizar' : 'Criar';
  }

  isFormValidForSubmission(): boolean {
    // Campos obrigatórios - CPF não é obrigatório quando editando
    const requiredFields = this.isEditMode 
      ? ['firstName', 'lastName', 'email', 'phone']  // CPF removido para edição
      : ['firstName', 'lastName', 'email', 'cpf', 'phone'];  // CPF incluído para criação
    const requiredValid = requiredFields.every(field => {
      const fieldValid = this.userForm.get(field)?.valid;
      console.log(`🔍 Campo ${field} válido:`, fieldValid, 'Erros:', this.userForm.get(field)?.errors);
      return fieldValid;
    });
    
    // Endereços válidos - apenas campos obrigatórios no endereço
    const addresses = this.userForm.get('addresses') as FormArray;
    const requiredAddressFields = ['street', 'city', 'state', 'zipCode'];
    const addressesValid = addresses.length > 0 && addresses.controls.every(addr => {
      // Valida apenas campos obrigatórios, não 'number' e 'neighborhood' que podem entrar vazios
      return requiredAddressFields.every(field => addr.get(field)?.valid);
    });
    console.log('🏠 Endereços válidos:', addressesValid, 'Quantidade:', addresses.length);
    
    // Debug específico de cada endereço
    addresses.controls.forEach((addr, index) => {
      console.log(`🏠 Endereço ${index}: válido:`, addr.valid, 'Erros:', addr.errors);
      const addrFields = ['street', 'number', 'neighborhood', 'city', 'state', 'zipCode', 'country'];
      addrFields.forEach(field => {
        const fieldControl = addr.get(field);
        if (fieldControl && fieldControl.invalid) {
          console.log(`❌ Campo endereço ${index}.${field}:`, fieldControl.errors, 'Valor:', fieldControl.value);
        }
      });
    });
    
    if (this.isEditMode) {
      // No edit mode, não precisa validar senha
      console.log('✏️ Modo edição - campos obrigatórios válidos:', requiredValid);
      console.log('✏️ Endereços válidos:', addressesValid);
      console.log('✏️ RESULTADO FINAL:', requiredValid && addressesValid);
      
      if (!requiredValid) {
        console.log('❌ CAMPOS OBRIGATÓRIOS INVÁLIDOS!');
        requiredFields.forEach(field => {
          const fieldControl = this.userForm.get(field);
          if (fieldControl && fieldControl.invalid) {
            console.log(`❌ Campo ${field} inválido:`, fieldControl.errors, 'Valor:', fieldControl.value);
          }
        });
      }
      
      if (!addressesValid) {
        console.log('❌ ENDEREÇOS INVÁLIDOS!');
        addresses.controls.forEach((addr, index) => {
          const invalidFields = requiredAddressFields.filter(field => addr.get(field)?.invalid);
          if (invalidFields.length > 0) {
            console.log(`❌ Endereço ${index}: campos inválidos ${invalidFields.join(', ')}`);
            invalidFields.forEach(field => {
              const fieldControl = addr.get(field);
              console.log(`❌ Endereço ${index}.${field}:`, fieldControl?.errors, 'Valor:', fieldControl?.value);
            });
          }
        });
      }
      
      return requiredValid && addressesValid;
    } else {
      // No create mode, precisa validar senha também
      const passwordField = this.userForm.get('password');
      const confirmPasswordField = this.userForm.get('confirmPassword');
      const passwordValid = Boolean(passwordField?.valid && 
                                   confirmPasswordField?.valid &&
                                   !this.userForm.hasError('passwordMismatch'));
      
      console.log('🔒 Campo password válido:', passwordField?.valid, 'Erros:', passwordField?.errors);
      console.log('🔒 Campo confirmPassword válido:', confirmPasswordField?.valid, 'Erros:', confirmPasswordField?.errors);
      console.log('🔒 Erro passwordMismatch no form:', this.userForm.hasError('passwordMismatch'));
      console.log('🔒 Senha válida:', passwordValid);
      
      const finalResult = requiredValid && addressesValid && passwordValid;
      console.log('✅ Resultado final validação:', finalResult);
      return finalResult;
    }
  }
}
