import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { UsersService } from '../../services/users.service';
import { UserResponse, UserCreateDto, UserUpdateDto, UserService } from '../../../../core/services/user.service';
import { Address } from '../../../../shared/models/user.model';
import { cpfValidator, passwordValidator, basePasswordMatchValidator as passwordMatchValidator, cadCpfValidator, cadNameValidator, cadPasswordValidator, cadPhoneValidator, zipCodeValidator } from '../../../../shared/validators';
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
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

export interface UserProfileFormData {
  user?: UserResponse;
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-user-profile-form',
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
    MatProgressSpinnerModule,
    MatTabsModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './user-profile-form.component.html',
  styleUrls: ['./user-profile-form.component.scss']
})
export class UserProfileFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  userForm!: FormGroup;
  addressForm!: FormGroup;
  isEditMode!: boolean;
  isLoading = false;
  isLoadingAddresses = false;
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

  userAddresses: Address[] = [];
  showAddAddressForm = false;
  selectedTabIndex = 0; // Controla qual aba está ativa
  
  // Controle de edição de endereços
  editingAddressId: string | null = null;
  isEditingAddress = false;
  
  // Modal de exclusão de endereço
  isDeleteAddressDialogOpen = false;
  addressToDelete: Address | null = null;
  
  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private notificationService: NotificationService,
    private dialogRef: MatDialogRef<UserProfileFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserProfileFormData
  ) {
    this.isEditMode = data.mode === 'edit';
    this.createForms();
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.user) {
      this.populateUserForm(this.data.user);
      if (this.data.user.id) {
        this.loadUserAddresses(this.data.user.id);
      }
    } else {
      // No modo de criação, mostrar automaticamente o formulário de endereço
      if (!this.isEditMode) {
        this.showAddAddressForm = true;
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForms(): void {
    // Formulário de dados pessoais
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, cadNameValidator()]],
      lastName: ['', [Validators.required, cadNameValidator()]],
      email: ['', [Validators.required, Validators.email]],
      cpf: ['', this.isEditMode ? [] : [Validators.required, cadCpfValidator()]],
      phone: ['', [Validators.required, cadPhoneValidator()]],
      password: ['', this.isEditMode ? [] : [Validators.required, cadPasswordValidator()]],
      confirmPassword: ['', this.isEditMode ? [] : [Validators.required]]
    });

    // Validador de confirmação de senha apenas para criação
    if (!this.isEditMode) {
      this.userForm.setValidators(passwordMatchValidator('password', 'confirmPassword'));
    }

    // Formulário de endereço (para adicionar novos)
    this.addressForm = this.fb.group({
      street: ['', [Validators.required]],
      number: [''],
      complement: [''],
      neighborhood: [''],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required, zipCodeValidator]],
      country: ['Brasil', [Validators.required]],
      isMain: [false]
    });

    // Observar mudanças nos formulários para validação
    this.userForm.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Validação em tempo real do formulário
      });
  }

  private populateUserForm(user: UserResponse): void {
    this.userForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      cpf: user.cpf,
      phone: user.phone
    });

    // Desabilitar CPF quando editando usuário existente
    if (this.isEditMode) {
      this.userForm.get('cpf')?.disable();
    }
  }

  private loadUserAddresses(userId: string): void {
    console.log('🏠 Carregando endereços do usuário:', userId);
    this.isLoadingAddresses = true;
    
    this.userService.getAddressesByUserId(userId).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (addresses) => {
          console.log('🏠 Endereços carregados:', addresses);
          this.userAddresses = addresses;
          this.isLoadingAddresses = false;
        },
        error: (error) => {
          console.error('❌ Erro ao carregar endereços:', error);
          this.notificationService.showError('Erro ao carregar endereços');
          this.isLoadingAddresses = false;
        }
      });
  }

  onSubmitUser(): void {
    if (this.userForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    // No modo de criação, navegar para a aba de endereços
    if (!this.isEditMode) {
      this.goToAddressTab();
      return;
    }

    // Modo de edição - atualizar usuário
    this.isLoading = true;
    
    const formValue = this.userForm.value;
    // Remover campos de senha vazios em modo edição
    if (this.isEditMode && (!formValue.password || formValue.password.trim() === '')) {
      delete formValue.password;
      delete formValue.confirmPassword;
    }

    if (this.data.user?.id) {
      this.updateUser(formValue);
    }
  }

  onCreateUser(): void {
    if (this.userForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    if (!this.userAddresses || this.userAddresses.length === 0) {
      this.notificationService.showError('É obrigatório informar pelo menos um endereço para criar o usuário.');
      return;
    }

    this.isLoading = true;
    
    const formValue = this.userForm.value;
    this.createUser(formValue);
  }

  goToAddressTab(): void {
    // Navegar para a aba de endereços (índice 1)
    this.selectedTabIndex = 1;
  }

  onSubmitAddress(): void {
    if (this.addressForm.invalid) {
      this.markAddressFieldsAsTouched();
      return;
    }

    // Se está editando um endereço existente
    if (this.isEditingAddress && this.editingAddressId) {
      const addressData = this.addressForm.value;
      
      // Se for um endereço temporário (modo criação), apenas atualizar na lista local
      if (this.editingAddressId.startsWith('temp-')) {
        const addressIndex = this.userAddresses.findIndex(a => a.id === this.editingAddressId);
        if (addressIndex !== -1) {
          this.userAddresses[addressIndex] = {
            ...this.userAddresses[addressIndex],
            street: addressData.street,
            number: addressData.number,
            complement: addressData.complement,
            neighborhood: addressData.neighborhood,
            city: addressData.city,
            state: addressData.state,
            zipCode: addressData.zipCode,
            country: addressData.country,
            isMain: addressData.isMain
          };
        }
        this.notificationService.showSuccess('Endereço atualizado!');
        this.cancelAddressEdit();
        this.showAddAddressForm = false;
        return;
      }
      
      // Se for um endereço salvo (modo edição), atualizar no backend
      this.userService.updateAddress(this.editingAddressId, addressData).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedAddress) => {
            console.log('✅ Endereço atualizado:', updatedAddress);
            const index = this.userAddresses.findIndex(a => a.id === this.editingAddressId);
            if (index !== -1) {
              this.userAddresses[index] = updatedAddress;
            }
            this.isLoading = false;
            this.notificationService.showSuccess('Endereço atualizado com sucesso!');
            this.cancelAddressEdit();
            this.showAddAddressForm = false;
          },
          error: (error) => {
            console.error('❌ Erro ao atualizar endereço:', error);
            this.isLoading = false;
            this.notificationService.showError('Erro ao atualizar endereço. Tente novamente.');
          }
        });
      return;
    }

    // No modo de criação, adicionar endereço à lista local
    if (!this.isEditMode) {
      const addressData = this.addressForm.value;
      const newAddress: Address = {
        id: `temp-${Date.now()}`, // ID temporário para endereços não salvos
        street: addressData.street,
        number: addressData.number,
        complement: addressData.complement,
        neighborhood: addressData.neighborhood,
        city: addressData.city,
        state: addressData.state,
        zipCode: addressData.zipCode,
        country: addressData.country,
        isMain: addressData.isMain
      };
      
      this.userAddresses.push(newAddress);
      this.notificationService.showSuccess('Endereço adicionado!');
      this.toggleAddAddressForm();
      return;
    }

    // No modo de edição, salvar no backend
    if (!this.data.user?.id) {
      this.notificationService.showError('ID do usuário não encontrado');
      return;
    }

    this.isLoading = true;
    
    const addressData = this.addressForm.value;
    console.log('📝 Criando endereço:', addressData);
    
    this.userService.createAddress(this.data.user.id, addressData).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newAddress) => {
          console.log('✅ Endereço criado:', newAddress);
          this.userAddresses.push(newAddress);
          this.isLoading = false;
          this.notificationService.showSuccess('Endereço adicionado com sucesso!');
          this.toggleAddAddressForm(); // Fechar o formulário após sucesso
        },
        error: (error) => {
          console.error('❌ Erro ao criar endereço:', error);
          this.isLoading = false;
        }
      });
  }

  updateAddress(address: Address): void {
    if (!this.data.user?.id) return;

    this.isLoading = true;
    
    const addressData = {
      street: address.street,
      number: address.number,
      complement: address.complement,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      isMain: address.isMain
    };
    
    console.log('📝 Atualizando endereço:', address.id, addressData);
    
    this.userService.updateAddress(address.id, addressData).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedAddress) => {
          console.log('✅ Endereço atualizado:', updatedAddress);
          const index = this.userAddresses.findIndex(a => a.id === address.id);
          if (index !== -1) {
            this.userAddresses[index] = updatedAddress;
          }
          this.isLoading = false;
          this.notificationService.showSuccess('Endereço atualizado com sucesso!');
        },
        error: (error) => {
          console.error('❌ Erro ao atualizar endereço:', error);
          this.isLoading = false;
        }
      });
  }

  deleteAddress(address: Address): void {
    if (this.userAddresses.length <= 1) {
      this.notificationService.showWarning('Não é possível excluir o último endereço do usuário');
      return;
    }

    // Abrir modal de confirmação
    this.addressToDelete = address;
    this.isDeleteAddressDialogOpen = true;
  }

  /**
   * Confirma a exclusão do endereço
   */
  confirmAddressDeletion(): void {
    if (!this.addressToDelete) {
      return;
    }

    console.log('🗑️ Confirmando exclusão do endereço:', this.addressToDelete.id);
    
    // Se for um endereço temporário (modo criação), apenas remover da lista local
    if (this.addressToDelete.id.startsWith('temp-')) {
      this.userAddresses = this.userAddresses.filter(a => a.id !== this.addressToDelete!.id);
      this.notificationService.showSuccess('Endereço removido!');
      this.cancelAddressDeletion();
      return;
    }
    
    // Se for um endereço salvo (modo edição), deletar do backend
    this.userService.deleteAddress(this.addressToDelete.id).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('✅ Endereço excluído com sucesso');
          this.userAddresses = this.userAddresses.filter(a => a.id !== this.addressToDelete!.id);
          this.notificationService.showSuccess('Endereço excluído com sucesso!');
          this.cancelAddressDeletion();
        },
        error: (error) =>{
          console.error('❌ Erro ao excluir endereço:', error);
          this.cancelAddressDeletion();
          
          // Tratamento específico de erros
          if (error.status === 400 && error.error?.Message) {
            this.notificationService.showError(error.error.Message);
          } else if (error.status === 403) {
            this.notificationService.showError('Você não tem permissão para excluir este endereço.');
          } else if (error.status === 404) {
            this.notificationService.showError('Endereço não encontrado.');
          } else {
            this.notificationService.showError('Erro ao excluir endereço. Tente novamente.');
          }
        }
      });
  }

  /**
   * Cancela a exclusão do endereço
   */
  cancelAddressDeletion(): void {
    this.isDeleteAddressDialogOpen = false;
    this.addressToDelete = null;
  }

  setPrimaryAddress(address: Address): void {
    // Se for um endereço temporário (modo criação), apenas atualizar localmente
    if (address.id.startsWith('temp-')) {
      // Atualizar todos os endereços para não serem principais
      this.userAddresses.forEach(a => {
        if (a.id !== address.id) {
          a.isMain = false;
        }
      });
      // Definir como principal
      const targetAddress = this.userAddresses.find(a => a.id === address.id);
      if (targetAddress) {
        targetAddress.isMain = true;
      }
      this.notificationService.showSuccess('Endereço definido como principal!');
      return;
    }
    
    // Se for um endereço salvo (modo edição), atualizar no backend
    this.userService.setPrimaryAddress(address.id).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            // Atualizar todos os endereços para não serem principais
            this.userAddresses.forEach(a => {
              if (a.id !== address.id) {
                a.isMain = false;
              }
            });
            // Definir como principal
            const targetAddress = this.userAddresses.find(a => a.id === address.id);
            if (targetAddress) {
              targetAddress.isMain = true;
            }
            this.notificationService.showSuccess('Endereço definido como principal!');
          }
        },
        error: (error) => {
          console.error('❌ Erro ao definir endereço principal:', error);
        }
      });
  }

  private createUser(userData: UserCreateDto): void {
    console.log('📡 Criando usuário:', userData);
    
    // Verificar se há endereços informados
    if (!this.userAddresses || this.userAddresses.length === 0) {
      this.isLoading = false; // Parar o loading
      this.notificationService.showError('É obrigatório informar pelo menos um endereço para criar o usuário.');
      return;
    }
    
    // Converter endereços para o formato esperado pelo backend
    const addresses = this.userAddresses.map(addr => ({
      street: addr.street,
      number: addr.number,
      neighborhood: addr.neighborhood,
      complement: addr.complement,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      country: addr.country,
      isPrimary: addr.isMain
    }));
    
    const userCreateData: UserCreateDto = {
      ...userData,
      addresses: addresses
    };
    
    console.log('📡 Dados completos para criação:', userCreateData);
    
    this.userService.createUser(userCreateData as UserCreateDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('✅ Usuário criado com sucesso!', response);
          this.notificationService.showSuccess('Usuário criado com sucesso!');
          this.dialogRef.close(response);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('❌ Erro ao criar usuário:', error);
          this.handleCreateUserError(error);
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
        next: (response) => {
          this.isLoading = false;
          console.log('✅ Usuário atualizado com sucesso!', response);
          this.notificationService.showSuccess('Usuário atualizado com sucesso!');
          this.dialogRef.close(response);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('❌ Erro ao atualizar usuário:', error);
          this.handleUpdateUserError(error);
        }
      });
  }

  private handleCreateUserError(error: any): void {
    if (error.status === 409) {
      this.notificationService.showError('Este email/CPF já está sendo usado por outro usuário.');
    } else if (error.status === 400) {
      this.notificationService.showError(error.error?.message || 'Dados inválidos. Verifique as informações.');
    } else if (error.status === 500) {
      this.notificationService.showError('Erro interno do servidor. Tente novamente.');
    } else {
      const message = error.error?.message || error.message || 'Erro desconhecido ao criar usuário.';
      this.notificationService.showError(message);
    }
  }

  private handleUpdateUserError(error: any): void {
    if (error.status === 409) {
      this.notificationService.showError('Este email/CPF já está sendo usado por outro usuário.');
    } else if (error.status === 400) {
      this.notificationService.showError(error.error?.message || 'Dados inválidos. Verifique as informações.');
    } else if (error.status === 500) {
      this.notificationService.showError('Erro interno do servidor. Tente novamente.');
    } else {
      const message = error.error?.message || error.message || 'Erro desconhecido ao atualizar usuário.';
      this.notificationService.showError(message);
    }
  }

  private markAllFieldsAsTouched(): void {
    const mainFields = ['firstName', 'lastName', 'email', 'cpf', 'phone'];
    mainFields.forEach(field => {
      const control = this.userForm.get(field);
      if (control) control.markAsTouched();
    });
  }

  private markAddressFieldsAsTouched(): void {
    const fields = ['street', 'city', 'state', 'zipCode', 'country'];
    fields.forEach(field => {
      const control = this.addressForm.get(field);
      if (control) control.markAsTouched();
    });
  }

  getDialogTitle(): string {
    return this.isEditMode ? 'Editar Usuário' : 'Criar Usuário';
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  editAddress(address: Address): void {
    // Iniciar edição inline
    this.editingAddressId = address.id;
    this.isEditingAddress = true;
    
    // Preencher o formulário com os dados do endereço
    this.addressForm.patchValue({
      street: address.street,
      number: address.number,
      complement: address.complement,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      isMain: address.isMain
    });
    
    // Mostrar o formulário de endereço
    this.showAddAddressForm = true;
  }

  toggleAddressMain(address: Address): void {
    if (address.isMain) {
      // Se já é principal, não fazer nada
      return;
    }
    
    // Se não é principal, definir como principal
    this.setPrimaryAddress(address);
  }

  toggleAddAddressForm(): void {
    this.showAddAddressForm = !this.showAddAddressForm;
    if (!this.showAddAddressForm) {
      // Fechando o formulário - limpar tudo
      this.addressForm.reset();
      this.addressForm.patchValue({
        country: 'Brasil',
        isMain: false
      });
      this.cancelAddressEdit();
    } else {
      // Abrindo o formulário - garantir que não está em modo de edição
      this.cancelAddressEdit();
      this.addressForm.reset();
      this.addressForm.patchValue({
        country: 'Brasil',
        isMain: false
      });
    }
  }

  cancelAddressEdit(): void {
    this.isEditingAddress = false;
    this.editingAddressId = null;
  }

  cancelAddAddress(): void {
    this.showAddAddressForm = false;
    this.addressForm.reset();
    this.addressForm.patchValue({
      country: 'Brasil',
      isMain: false
    });
  }
}
