import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatButtonModule, MatIconModule],
  template: `
    <div class="auth-layout">
      <div class="auth-container">
        <div class="auth-header">
          <!-- Botão Menu Inicial removido - usuários não autenticados devem fazer login primeiro -->
          
          <img src="/assets/images/logo.svg" alt="Cad+ ERP" class="auth-logo" *ngIf="false">
          <div class="auth-brand">
            <h1>Cad+ ERP</h1>
            <p>Sistema de Gestão Hospitalar</p>
          </div>
        </div>
        
        <div class="auth-content">
          <router-outlet></router-outlet>
        </div>
        
        <div class="auth-footer">
          <p>&copy; 2024 Cad+ ERP. Todos os direitos reservados.</p>
        </div>
      </div>
      
      <!-- Background decoration -->
      <div class="auth-background">
        <div class="decoration-circle decoration-1"></div>
        <div class="decoration-circle decoration-2"></div>
        <div class="decoration-circle decoration-3"></div>
      </div>
    </div>
  `,
  styleUrls: ['./auth-layout.component.scss']
})
export class AuthLayoutComponent {
  constructor(private router: Router) {}
}
