import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../shared/models/user.model';
import { UserService } from '../../../../core/services/user.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { cpfValidator } from '../../../../shared/validators';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-profile',
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
    MatExpansionModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentUser: User | null = null;
  profileForm!: FormGroup;
  isLoading = false;
  isEditing = false;

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
    console.log('📍 ProfileComponent inicializado');
    this.loadCurrentUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      cpf: [{ value: '', disabled: true }], // CPF não pode ser alterado
      phone: ['', [Validators.required, Validators.pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)]],
    });

    // Adiciona formatação automática para telefone
    this.profileForm.get('phone')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(value => {
      if (value && !value.includes('(')) {
        const formatted = this.formatPhone(value);
        if (formatted !== value) {
          this.profileForm.get('phone')?.setValue(formatted, { emitEvent: false });
        }
      }
    });
  }

  private loadCurrentUser(): void {
    console.log('👤 Carregando dados do usuário atual no perfil...');
    this.authService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: User | null) => {
        console.log('📊 Usuário carregado no perfil:', user ? `${user.firstName} ${user.lastName}` : 'null');
        this.currentUser = user;
        if (user) {
          this.populateForm(user);
        }
      });
  }

  private populateForm(user: User): void {
    this.profileForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      cpf: this.formatCpf(user.cpf), // CPF formatado para exibição
      phone: this.formatPhone(user.phone) // Telefone formatado
    }, { emitEvent: false }); // Não emite eventos para evitar loops
    
    // Desabilitar campos se necessário
    this.profileForm.get('email')?.disable();
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    
    if (this.isEditing) {
      this.profileForm.get('firstName')?.enable();
      this.profileForm.get('lastName')?.enable();
      this.profileForm.get('phone')?.enable();
      // Email e CPF permanecem desabilitados por segurança
    } else {
      this.profileForm.get('firstName')?.disable();
      this.profileForm.get('lastName')?.disable();
      this.profileForm.get('phone')?.disable();
    }
  }

  onSubmit(): void {
    if (this.profileForm.valid && this.isEditing && !this.isLoading && this.currentUser) {
      this.isLoading = true;
      
      const updateData = {
        firstName: this.profileForm.get('firstName')?.value.trim(),
        lastName: this.profileForm.get('lastName')?.value.trim(),
        phone: this.profileForm.get('phone')?.value.replace(/\D/g, '')
      };

      this.userService.updateUser(this.currentUser.id, updateData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            this.isLoading = false;
            this.isEditing = false;
            this.notificationService.showSuccess('Perfil atualizado com sucesso!');
            
            // Atualizar o usuário atual no AuthService
            // this.authService.updateCurrentUser(response);
          },
          error: (error: any) => {
            this.isLoading = false;
            console.error('Erro ao atualizar perfil:', error);
          }
        });
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    if (this.currentUser) {
      this.populateForm(this.currentUser);
    }
  }

  openPasswordChange(): void {
    // Implementar modal/dialog para alteração de senha
    this.notificationService.showInfo('Funcionalidade de alteração de senha em desenvolvimento');
  }

  getFieldErrorMessage(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    
    if (field?.errors && field.touched) {
      const errors = field.errors;
      
      if (errors['required']) {
        const labels = {
          firstName: 'Nome',
          lastName: 'Sobrenome',
          email: 'Email',
          phone: 'Telefone'
        };
        return `${labels[fieldName as keyof typeof labels]} é obrigatório`;
      }
      
      if (errors['email']) return 'Email deve ser válido';
      if (errors['minlength']) return 'Deve ter pelo menos 2 caracteres';
      if (errors['pattern']) return 'Formato inválido';
    }
    
    return '';
  }

  getUserInitials(): string {
    if (this.currentUser) {
      return `${this.currentUser.firstName.charAt(0)}${this.currentUser.lastName.charAt(0)}`.toUpperCase();
    }
    return 'U';
  }

  getMemberSince(): string {
    // if (this.currentUser && this.currentUser.createdAt) {
    //   const createdDate = new Date(this.currentUser.createdAt);
    //   return createdDate.toLocaleDateString('pt-BR');
    // }
    return 'Data não disponível';
  }

  getLastLogin(): string {
    // if (this.currentUser && this.currentUser.lastLoginAt) {
    //   const lastLogin = new Date(this.currentUser.lastLoginAt);
    //   return lastLogin.toLocaleDateString('pt-BR');
    // }
    return 'Primeira vez';
  }

  /**
   * Formata telefone automaticamente conforme usuário digita
   */
  private formatPhone(value: string): string {
    if (!value) return value;
    
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica máscara conforme tamanho
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  }

  /**
   * Formata CPF automaticamente
   */
  formatCpf(cpf: string): string {
    if (!cpf) return cpf;
    
    const numbers = cpf.replace(/\D/g, '');
    
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    } else if (numbers.length <= 9) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    } else {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
    }
  }

  /**
   * Limpa formato para enviar apenas números
   */
  getCleanPhone(): string {
    const phone = this.profileForm.get('phone')?.value;
    return phone ? phone.replace(/\D/g, '') : '';
  }

  /**
   * Limpa formato CPF para enviar apenas números
   */
  getCleanCpf(): string {
    const cpf = this.currentUser?.cpf;
    return cpf ? cpf.replace(/\D/g, '') : '';
  }

  /**
   * Manipula input do telefone para formatação automática
   */
  onPhoneInput(event: any): void {
    const input = event.target;
    let value = input.value;
    
    // Remove caracteres não numéricos para aplicar formatação limpa
    const numbers = value.replace(/\D/g, '');
    
    // Aplica formatação
    const formatted = this.formatPhone(numbers);
    
    // Atualiza o campo se a formatação mudou
    if (formatted !== value) {
      input.value = formatted;
      this.profileForm.get('phone')?.setValue(formatted, { emitEvent: false });
      
      // Ajusta posição do cursor
      setTimeout(() => {
        const cursorPos = formatted.length;
        input.setSelectionRange(cursorPos, cursorPos);
      }, 0);
    }
  }

  /**
   * Navega para o menu principal (dashboard)
   */
  navigateToDashboard(): void {
    console.log('🏠 Navegando para menu principal...');
    this.router.navigate(['/dashboard']);
  }

  /**
   * Realiza logout e retorna à página de login
   */
  logout(): void {
    console.log('🚪 Fazendo logout do sistema...');
    this.authService.logout();
    this.router.navigate(['/auth/login']);
    this.notificationService.showInfo('Você foi deslogado com sucesso');
  }

  exportData(): void {
    // Implementar exportação de dados pessoais
    this.notificationService.showInfo('Funcionalidade de exportação em desenvolvimento');
  }

  deleteAccount(): void {
    if (confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
      this.notificationService.showWarning('Esta funcionalidade será implementada em breve');
    }
  }
}
