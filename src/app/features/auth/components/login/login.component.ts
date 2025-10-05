import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { cadEmailValidator } from '../../../../shared/validators';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-login',
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
    MatDividerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  loginForm: FormGroup;
  returnUrl: string;
  isLoading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, cadEmailValidator()]],
      password: ['', [Validators.required]]
    });

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  ngOnInit(): void {
    // Redireciona se já estiver logado
    if (this.authService.isLoggedIn()) {
      this.router.navigate([this.returnUrl]);
      return;
    }

    // Verifica se há mensagem de sucesso do cadastro
    const message = this.route.snapshot.queryParams['message'];
    const email = this.route.snapshot.queryParams['email'];
    
    if (message) {
      this.notificationService.showSuccess(message);
      
      // Se veio com email do cadastro, preencher o campo
      if (email) {
        this.loginForm.patchValue({ email: email });
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      
      const loginData = this.loginForm.value;
      
      this.authService.login(loginData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.notificationService.showSuccess(`Bem-vindo, ${response.data.user.firstName}!`);
            this.router.navigate([this.returnUrl]);
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Erro no login:', error);
            this.notificationService.showError('Email ou senha inválidos. Tente novamente.');
          }
        });
    } else {
      this.loginForm.markAllAsTouched();
      this.notificationService.showWarning('Por favor, preencha todos os campos obrigatórios.');
    }
  }

  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName === 'password' ? 'Senha' : 'Email'} é obrigatório`;
      }
      if (field.errors['cadEmailInvalid']) {
        return field.errors['cadEmailInvalid'].message;
      }
      if (field.errors['email']) {
        return 'Email deve ser válido';
      }
    }
    
    return '';
  }

}
