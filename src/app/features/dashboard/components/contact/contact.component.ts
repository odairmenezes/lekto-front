import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { 
  emailValidator, 
  nameValidator,
  phoneValidator 
} from '../../../../shared/validators/cadplus-validators';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatSelectModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  contactForm: FormGroup;
  isLoading = false;

  contactOptions = [
    {
      type: 'technical',
      title: 'Suporte Técnico',
      description: 'Problemas técnicos, bugs, configurações',
      icon: 'build',
      color: 'primary',
      email: 'suporte@cadplus.com.br',
      phone: '+55 11 1234-5678'
    },
    {
      type: 'commercial',
      title: 'Comercial',
      description: 'Informações sobre produtos, vendas, contratos',
      icon: 'monetization_on',
      color: 'accent',
      email: 'comercial@cadplus.com.br',
      phone: '+55 11 2345-6789'
    },
    {
      type: 'training',
      title: 'Treinamento',
      description: 'Capacitação, cursos, certificações',
      icon: 'school',
      color: 'warn',
      email: 'treinamento@cadplus.com.br',
      phone: '+55 11 3456-7890'
    },
    {
      type: 'general',
      title: 'Geral',
      description: 'Outras informações e dúvidas',
      icon: 'help',
      color: 'primary',
      email: 'contato@cadplus.com.br',
      phone: '+55 11 9876-5432'
    }
  ];

  priorityOptions = [
    { value: 'low', label: 'Baixa', icon: 'arrow_downward', color: 'success' },
    { value: 'medium', label: 'Média', icon: 'remove', color: 'warning' },
    { value: 'high', label: 'Alta', icon: 'arrow_upward', color: 'error' },
    { value: 'urgent', label: 'Urgente', icon: 'priority_high', color: 'error' }
  ];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private router: Router
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, nameValidator]],
      email: ['', [Validators.required, emailValidator]],
      phone: ['', [phoneValidator]],
      department: ['', [Validators.required]],
      priority: ['medium', [Validators.required]],
      subject: ['', [Validators.required, Validators.minLength(10)]],
      message: ['', [Validators.required, Validators.minLength(20)]],
      attachment: [null]
    });
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carrega dados do usuário logado
   */
  loadUserData(): void {
    // Busca dados reais do usuário logado via AuthService
    this.authService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          if (user) {
            this.contactForm.patchValue({
              name: `${user.firstName} ${user.lastName}`.trim(),
              email: user.email,
              phone: user.phone || ''
            });
          } else {
            // Fallback para caso não tenha usuário logado
            this.contactForm.patchValue({
              name: '',
              email: '',
              phone: ''
            });
          }
        },
        error: (error) => {
          console.error('Erro ao carregar dados do usuário:', error);
          // Fallback para dados vazios em caso de erro
          this.contactForm.patchValue({
            name: '',
            email: '',
            phone: ''
          });
        }
      });
  }

  /**
   * Submete o formulário de contato
   */
  async onSubmit(): Promise<void> {
    if (!this.contactForm.valid) {
      this.markFormGroupTouched(this.contactForm);
      this.snackBar.open(
        'Por favor, preencha todos os campos obrigatórios corretamente', 
        'Fechar', 
        { duration: 3000 }
      );
      return;
    }

    this.isLoading = true;

    // Enviar formulário para o backend
    try {
      await this.submitContactForm();
      
      this.snackBar.open(
        'Mensagem enviada com sucesso! Entraremos em contato em breve.',
        'Fechar',
        { duration: 5000 }
      );
      
      this.contactForm.reset();
      this.loadUserData();
      
    } catch (error) {
      this.snackBar.open(
        'Erro ao enviar mensagem. Tente novamente.',
        'Fechar',
        { duration: 3000 }
      );
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Submete o formulário de contato para o backend
   */
  private submitContactForm(): Promise<void> {
    const formData = {
      ...this.contactForm.value,
      submittedAt: new Date().toISOString(),
      userId: 'current_user' // Será implementado quando necessário
    };

    // Aqui você faria a chamada real para a API
    // return this.http.post('/api/contact', formData).toPromise();
    
    // Por enquanto, vamos simular um sucesso garantido
    return Promise.resolve();
  }

  /**
   * Retorna informações do departamento selecionado
   */
  get selectedDepartment(): any {
    const deptType = this.contactForm.get('department')?.value;
    return this.contactOptions.find(option => option.type === deptType);
  }

  /**
   * Retorna informações da prioridade selecionada
   */
  get selectedPriority(): any {
    const priority = this.contactForm.get('priority')?.value;
    return this.priorityOptions.find(option => option.value === priority);
  }

  /**
   * Marca todos os campos como touched para mostrar erros
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Formatar telefone enquanto digita
   */
  formatPhone(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      value = value.replace(/(\d{2})(\d)/, '($1) $2');
      value = value.replace(/(\d{5})(\d)/, '$1-$2');
      event.target.value = value;
    }
  }

  /**
   * Abre cliente de email padrão
   */
  openEmailClient(dept: any): void {
    const subject = encodeURIComponent('Suporte CadPlus ERP');
    const body = encodeURIComponent(
      `Olá equipe ${dept.title},\n\n` +
      `Gostaria de solicitar suporte para o sistema CadPlus ERP.\n\n` +
      `Detalhes:\n` +
      `- Sistema: CadPlus ERP Hospitais v2.1.0\n` +
      `- Usuário: Administrador Sistema\n` +
      `- Data: ${new Date().toLocaleDateString('pt-BR')}\n\n` +
      `Por favor, entre em contato o quanto antes.\n\n` +
      `Atenciosamente,\n` +
      `Administrador Sistema`
    );
    
    window.open(`mailto:${dept.email}?subject=${subject}&body=${body}`);
  }

  /**
   * Copia informações de contato para área de transferência
   */
  copyContactInfo(dept: any): void {
    const contactInfo = `Email: ${dept.email}\nTelefone: ${dept.phone}`;
    navigator.clipboard.writeText(contactInfo).then(() => {
      this.snackBar.open('Informações copiadas para a área de transferência', 'Fechar', { duration: 2000 });
    });
  }

  /**
   * Navega para o menu principal (dashboard)
   */
  goToMainMenu(): void {
    console.log('🏠 Navegando para o menu principal...');
    this.router.navigate(['/dashboard']);
  }
}