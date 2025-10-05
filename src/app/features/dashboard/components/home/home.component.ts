import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="home-container">
      <mat-card class="welcome-card">
        <mat-card-content>
          <h1>Sistema Cad+ ERP</h1>
          <p>Sistema de gestão empresarial para hospitais</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .home-container {
      padding: 24px;
      text-align: center;
    }
    
    .welcome-card {
      max-width: 600px;
      margin: 0 auto;
    }
  `]
})
export class HomeComponent { }
