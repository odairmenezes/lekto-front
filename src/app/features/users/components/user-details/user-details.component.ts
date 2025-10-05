import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Location } from '@angular/common';
import { UsersService } from '../../services/users.service';
import { UserResponse } from '../../../../core/services/user.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CpfPipe, PhonePipe } from '../../../../shared/pipes';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// MatDialogModule removido - não mais necessário sem botões de ação

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    CpfPipe,
    PhonePipe
  ],
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss']
})
export class UserDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  user: UserResponse | null = null;
  isLoading = true;
  userId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private usersService: UsersService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.userId = params['id'];
      if (this.userId) {
        this.loadUser();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUser(): void {
    if (!this.userId) return;

    this.isLoading = true;
    this.usersService.getUserById(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.user = user;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erro ao carregar usuário:', error);
          this.notificationService.showError('Erro ao carregar dados do usuário');
          this.isLoading = false;
          this.goBack();
        }
      });
  }

  navigateToHome(): void {
    this.router.navigate(['/dashboard']);
  }

  goBack(): void {
    this.location.back();
  }

  // Método de edição removido da visualização de detalhes

  // Método de alteração de status removido da visualização de detalhes

  // Método de exclusão removido da visualização de detalhes

  getStatusIcon(isActive: boolean): string {
    return isActive ? 'check_circle' : 'cancel';
  }

  getStatusColor(isActive: boolean): string {
    return isActive ? 'primary' : 'warn';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Ativo' : 'Inativo';
  }

  getMemberSince(): string {
    if (this.user?.createdAt) {
      const createdDate = new Date(this.user.createdAt);
      return createdDate.toLocaleDateString('pt-BR');
    }
    return 'Data não disponível';
  }

  getLastUpdate(): string {
    if (this.user?.updatedAt) {
      const updatedDate = new Date(this.user.updatedAt);
      return updatedDate.toLocaleDateString('pt-BR');
    }
    return 'Data não disponível';
  }
}
