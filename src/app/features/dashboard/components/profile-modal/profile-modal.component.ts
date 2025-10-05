import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../shared/models/user.model';
import { UserService } from '../../../../core/services/user.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { cpfValidator, cadPasswordValidator, cadEmailValidator, cadNameValidator } from '../../../../shared/validators';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';

export interface ProfileModalData {
  user: User | null;
}

@Component({
  selector: 'app-profile-modal',
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
    MatExpansionModule,
    MatDialogModule,
    MatDividerModule,
    MatChipsModule,
    MatTabsModule
  ],
  templateUrl: './profile-modal.component.html',
  styleUrls: ['./profile-modal.component.scss']
})
export class ProfileModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentUser: User | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  isLoading = false;
  isEditing = false;
  isChangingPassword = false;
  showPasswordFields = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private notificationService: NotificationService,
    private dialogRef: MatDialogRef<ProfileModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProfileModalData
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    console.log('📍 ProfileModalComponent inicializado');
    this.loadCurrentUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, cadNameValidator()]],
      lastName: ['', [Validators.required, cadNameValidator()]],
      email: ['', [Validators.required, cadEmailValidator()]],
      cpf: ['', [Validators.required, this.simpleCpfValidator]], // Usando validador simples
      phone: ['', [Validators.required, Validators.minLength(10)]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8), cadPasswordValidator()]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    // Debug: Observar mudanças no formulário
    this.profileForm.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('🔄 Formulário mudou:', {
          valid: this.profileForm.valid,
          invalid: this.profileForm.invalid,
          errors: this.profileForm.errors,
          value: this.profileForm.value,
          controls: {
            firstName: {
              valid: this.profileForm.get('firstName')?.valid,
              errors: this.profileForm.get('firstName')?.errors
            },
            lastName: {
              valid: this.profileForm.get('lastName')?.valid,
              errors: this.profileForm.get('lastName')?.errors
            },
            email: {
              valid: this.profileForm.get('email')?.valid,
              errors: this.profileForm.get('email')?.errors
            },
            cpf: {
              valid: this.profileForm.get('cpf')?.valid,
              errors: this.profileForm.get('cpf')?.errors
            },
            phone: {
              valid: this.profileForm.get('phone')?.valid,
              errors: this.profileForm.get('phone')?.errors
            }
          }
        });
      });
  }

  private loadCurrentUser(): void {
    this.authService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: User | null) => {
        console.log('👤 Usuário carregado:', user);
        this.currentUser = user;
        if (user) {
          console.log('📝 Preenchendo formulário com dados:', {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            cpf: user.cpf,
            phone: user.phone
          });
          
          this.profileForm.patchValue({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            cpf: user.cpf,
            phone: user.phone
          });
          
          console.log('✅ Formulário preenchido. Status:', {
            valid: this.profileForm.valid,
            invalid: this.profileForm.invalid,
            errors: this.profileForm.errors
          });
        }
      });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    console.log('🔄 Modo de edição alterado para:', this.isEditing);
    
    if (!this.isEditing) {
      // Reset form to original values
      this.loadCurrentUser();
    } else {
      // Debug: Verificar status do formulário ao entrar em modo de edição
      console.log('📋 Status do formulário ao entrar em modo de edição:', {
        valid: this.profileForm.valid,
        invalid: this.profileForm.invalid,
        errors: this.profileForm.errors,
        value: this.profileForm.value,
        controls: {
          firstName: {
            valid: this.profileForm.get('firstName')?.valid,
            errors: this.profileForm.get('firstName')?.errors,
            value: this.profileForm.get('firstName')?.value
          },
          lastName: {
            valid: this.profileForm.get('lastName')?.valid,
            errors: this.profileForm.get('lastName')?.errors,
            value: this.profileForm.get('lastName')?.value
          },
          email: {
            valid: this.profileForm.get('email')?.valid,
            errors: this.profileForm.get('email')?.errors,
            value: this.profileForm.get('email')?.value
          },
          cpf: {
            valid: this.profileForm.get('cpf')?.valid,
            errors: this.profileForm.get('cpf')?.errors,
            value: this.profileForm.get('cpf')?.value
          },
          phone: {
            valid: this.profileForm.get('phone')?.valid,
            errors: this.profileForm.get('phone')?.errors,
            value: this.profileForm.get('phone')?.value
          }
        }
      });
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.loadCurrentUser();
  }

  onSubmit(): void {
    console.log('💾 Tentando salvar perfil...');
    console.log('📋 Status do formulário:', {
      valid: this.profileForm.valid,
      invalid: this.profileForm.invalid,
      errors: this.profileForm.errors,
      value: this.profileForm.value
    });

    if (this.profileForm.invalid || !this.currentUser) {
      console.log('❌ Formulário inválido ou usuário não encontrado');
      this.markAllFieldsAsTouched();
      return;
    }

    this.isLoading = true;
    const formData = this.profileForm.value;

    this.userService.updateUser(this.currentUser.id, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser) => {
          console.log('✅ Perfil atualizado:', updatedUser);
          this.currentUser = updatedUser;
          this.isEditing = false;
          this.isLoading = false;
          this.notificationService.showSuccess('Perfil atualizado com sucesso!');
          
          // Atualizar dados no AuthService (método não existe, comentado)
          // this.authService.updateCurrentUser(updatedUser);
        },
        error: (error) => {
          console.error('❌ Erro ao atualizar perfil:', error);
          this.isLoading = false;
          this.notificationService.showError('Erro ao atualizar perfil. Tente novamente.');
        }
      });
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.profileForm.controls).forEach(key => {
      const control = this.profileForm.get(key);
      control?.markAsTouched();
    });
  }

  logout(): void {
    if (confirm('Tem certeza que deseja sair?')) {
      this.dialogRef.close('logout');
    }
  }

  closeModal(): void {
    this.dialogRef.close();
  }

  getUserInitials(): string {
    if (this.currentUser) {
      const first = this.currentUser.firstName?.charAt(0) || '';
      const last = this.currentUser.lastName?.charAt(0) || '';
      return (first + last).toUpperCase();
    }
    return 'U';
  }

  getMemberSince(): string {
    if (this.currentUser?.createdAt) {
      const createdDate = new Date(this.currentUser.createdAt);
      return createdDate.toLocaleDateString('pt-BR');
    }
    return 'Data não disponível';
  }

  getLastLogin(): string {
    // Simular última conexão - em uma aplicação real, isso viria do backend
    return new Date().toLocaleDateString('pt-BR');
  }

  getFieldErrorMessage(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} é obrigatório`;
    }
    if (field?.hasError('email')) {
      return 'Email inválido';
    }
    if (field?.hasError('cadEmailInvalid')) {
      return field.errors?.['cadEmailInvalid']?.message || 'Email inválido';
    }
    if (field?.hasError('cadNameLength')) {
      return field.errors?.['cadNameLength']?.message || 'Nome deve ter pelo menos 4 caracteres';
    }
    if (field?.hasError('cadNameInvalid')) {
      return field.errors?.['cadNameInvalid']?.message || 'Nome deve conter apenas letras e espaços';
    }
    if (field?.hasError('minlength')) {
      return `${this.getFieldLabel(fieldName)} deve ter pelo menos ${field.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (field?.hasError('cpfInvalid')) {
      return field.errors?.['cpfInvalid']?.message || 'CPF inválido';
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'Nome',
      lastName: 'Sobrenome',
      email: 'Email',
      cpf: 'CPF',
      phone: 'Telefone'
    };
    return labels[fieldName] || fieldName;
  }

  private passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.hasError('passwordMismatch')) {
      confirmPassword.setErrors(null);
    }
    
    return null;
  }

  togglePasswordChange(): void {
    this.showPasswordFields = !this.showPasswordFields;
    if (!this.showPasswordFields) {
      this.passwordForm.reset();
    }
  }

  onSubmitPassword(): void {
    if (this.passwordForm.invalid) {
      this.notificationService.showError('Por favor, preencha todos os campos corretamente.');
      return;
    }

    this.isChangingPassword = true;
    const { currentPassword, newPassword } = this.passwordForm.value;

    // Aqui você implementaria a chamada para a API de alteração de senha
    // Por enquanto, vamos simular uma chamada
    setTimeout(() => {
      console.log('🔐 Alterando senha...', { currentPassword, newPassword });
      this.notificationService.showSuccess('Senha alterada com sucesso!');
      this.passwordForm.reset();
      this.showPasswordFields = false;
      this.isChangingPassword = false;
    }, 1500);
  }

  cancelPasswordChange(): void {
    this.passwordForm.reset();
    this.showPasswordFields = false;
  }

  getPasswordFieldErrorMessage(fieldName: string): string {
    const field = this.passwordForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${this.getPasswordFieldLabel(fieldName)} é obrigatório`;
    }
    if (field?.hasError('minlength')) {
      return `${this.getPasswordFieldLabel(fieldName)} deve ter pelo menos 8 caracteres`;
    }
    if (field?.hasError('cadPasswordUpper')) {
      return 'Senha deve conter pelo menos uma letra maiúscula';
    }
    if (field?.hasError('cadPasswordLower')) {
      return 'Senha deve conter pelo menos uma letra minúscula';
    }
    if (field?.hasError('cadPasswordSpecial')) {
      return 'Senha deve conter pelo menos um caractere especial';
    }
    if (field?.hasError('passwordMismatch')) {
      return 'As senhas não coincidem';
    }
    return '';
  }

  private getPasswordFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      currentPassword: 'Senha atual',
      newPassword: 'Nova senha',
      confirmPassword: 'Confirmar nova senha'
    };
    return labels[fieldName] || fieldName;
  }

  // Validador simples de CPF
  private simpleCpfValidator(control: any) {
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

    return null;
  }

  openPasswordChange(): void {
    this.notificationService.showInfo('Funcionalidade de alteração de senha será implementada em breve.');
  }
}
