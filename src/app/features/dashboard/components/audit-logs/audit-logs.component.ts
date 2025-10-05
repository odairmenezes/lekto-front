import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil, Observable } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuditService, AuditLog, AuditLogResponse, AuditSearchParams } from '../../../../core/services/audit.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { cpfValidator } from '../../../../shared/validators';

@Component({
  selector: 'app-audit-logs',
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
    MatChipsModule,
    MatDividerModule,
    MatPaginatorModule,
    MatTooltipModule
  ],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss']
})
export class AuditLogsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Form
  cpfSearchForm!: FormGroup;
  
  // Data
  auditLogs: AuditLog[] = [];
  auditResponse: AuditLogResponse | null = null;
  isLoading = false;
  
  // Pagination
  pageSize = 20;
  currentPage = 0;
  totalCount = 0;

  constructor(
    private fb: FormBuilder,
    private auditService: AuditService,
    private notificationService: NotificationService,
    private dialogRef: MatDialogRef<AuditLogsComponent>
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    console.log('🔍 AuditLogsComponent inicializado');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): void {
    this.cpfSearchForm = this.fb.group({
      cpf: ['', [Validators.required, cpfValidator]]
    });
  }

  searchByCpf(): void {
    if (this.cpfSearchForm.invalid) {
      this.notificationService.showError('Por favor, informe um CPF válido');
      return;
    }

    const cpf = this.cpfSearchForm.get('cpf')?.value;
    if (!cpf) {
      this.notificationService.showError('CPF é obrigatório');
      return;
    }

    this.performSearch(() => this.auditService.getLogsByCpf(cpf, this.getSearchParams()));
  }

  private performSearch(searchFunction: () => Observable<AuditLogResponse>): void {
    this.isLoading = true;
    this.currentPage = 0;

    searchFunction()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: AuditLogResponse) => {
          console.log('✅ Busca realizada:', response);
          this.auditLogs = response.logs;
          this.auditResponse = response;
          this.totalCount = response.totalCount;
          this.isLoading = false;
          this.notificationService.showSuccess(`${response.logs.length} logs encontrados`);
        },
        error: (error: any) => {
          console.error('❌ Erro na busca:', error);
          this.notificationService.showError('Erro ao buscar logs de auditoria');
          this.isLoading = false;
        }
      });
  }

  private getSearchParams(): AuditSearchParams {
    return {
      page: this.currentPage + 1,
      limit: this.pageSize
    };
  }

  onPageChange(event: PageEvent): void {
    console.log('📄 Mudança de página:', event);
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    
    // Recarregar dados com nova página se houver CPF pesquisado
    const cpf = this.cpfSearchForm.get('cpf')?.value;
    if (cpf) {
      this.performSearch(() => this.auditService.getLogsByCpf(cpf, this.getSearchParams()));
    }
  }

  clearSearch(): void {
    console.log('🧹 Limpando busca...');
    this.cpfSearchForm.reset();
    this.auditLogs = [];
    this.auditResponse = null;
    this.totalCount = 0;
    this.currentPage = 0;
  }

  formatDate(dateString: string): string {
    return this.auditService.formatDate(dateString);
  }

  getEntityIcon(entityType: string): string {
    return this.auditService.getEntityIcon(entityType);
  }

  getActionColor(fieldName: string): string {
    return this.auditService.getActionColor(fieldName);
  }

  getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      'FirstName': 'Nome',
      'LastName': 'Sobrenome',
      'Email': 'Email',
      'Phone': 'Telefone',
      'Password': 'Senha',
      'IsActive': 'Status Ativo',
      'Created': 'Criado',
      'Updated': 'Atualizado',
      'Deleted': 'Excluído',
      'SetPrimary': 'Definido como Principal'
    };
    return fieldNames[fieldName] || fieldName;
  }

  getEntityDisplayName(entityType: string): string {
    const entityTypes: { [key: string]: string } = {
      'User': 'Usuário',
      'Address': 'Endereço',
      'Profile': 'Perfil',
      'System': 'Sistema'
    };
    return entityTypes[entityType] || entityType;
  }

  getCpfErrorMessage(): string {
    const cpfField = this.cpfSearchForm.get('cpf');
    if (cpfField?.hasError('required')) {
      return 'CPF é obrigatório';
    }
    if (cpfField?.hasError('cpfInvalid')) {
      return cpfField.errors?.['cpfInvalid']?.message || 'CPF inválido';
    }
    return '';
  }

  closeModal(): void {
    this.dialogRef.close();
  }
}
