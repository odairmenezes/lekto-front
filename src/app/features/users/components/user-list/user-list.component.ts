import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormControl } from '@angular/forms';

import { UsersService } from '../../services/users.service';
import { UserResponse } from '../../../../core/services/user.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserProfileFormComponent } from '../user-profile-form/user-profile-form.component';
import { UserSyncService } from '../../../../core/services/user-sync.service';
import { environment } from '../../../../../environments/environment';

// Angular Material imports
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { CpfPipe, PhonePipe } from '../../../../shared/pipes';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatSelectModule,
    MatChipsModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    CpfPipe,
    PhonePipe
  ],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = [
    'firstName', 
    'lastName', 
    'email', 
    'cpf', 
    'phone', 
    'actions'
  ];

  dataSource = new MatTableDataSource<UserResponse>([]);
  
  searchControl = new FormControl('');
  
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  
  isDeleteDialogOpen = false;
  userToDelete: UserResponse | null = null;
  isStatusDialogOpen = false;
  userToToggle: UserResponse | null = null;
  isLoading = false;


  // Seleção múltipla
  selectedUsers = new Set<string>();
  isSelectMode = false;

  constructor(
    private usersService: UsersService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private userSyncService: UserSyncService
  ) {}

  ngOnInit(): void {
    console.log('🚀 UserListComponent inicializado');
    console.log('🔧 Configurando componentes...');
    this.setupDataSource();
    this.setupSearch();
    this.setupFilters();
    console.log('📡 Iniciando carregamento de usuários...');
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupDataSource(): void {
    this.usersService.users$
      .pipe(takeUntil(this.destroy$))
      .subscribe(users => {
        console.log('👥 Dados recebidos no UserListComponent:', users);
        console.log('📊 Quantidade de usuários para tabela:', users.length);
        this.dataSource.data = users;
        console.log('✅ DataSource atualizado com:', this.dataSource.data.length, 'usuários');
        this.cdr.markForCheck(); // Força detecção de mudanças
      });

    this.usersService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        console.log('🔄 Estado de loading:', loading);
        this.isLoading = loading;
      });
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        if (searchTerm) {
          this.usersService.searchUsers(searchTerm);
        } else {
          this.usersService.refreshCurrentUsers();
        }
      });
  }

  private setupFilters(): void {
    // Filtros removidos - apenas busca mantida
  }

  private loadUsers(): void {
    this.usersService.loadUsers({
      page: this.pageIndex + 1,
      pageSize: this.pageSize
    }).subscribe({
      next: (response) => {
        this.totalItems = response.totalCount;
        console.log('📋 Dados reais carregados:', response.data.length, 'usuários do backend');
        this.cdr.markForCheck(); // Força detecção de mudanças
      },
      error: (error) => {
        console.error('❌ Erro ao carregar usuários do backend:', error);
        this.notificationService.showError('Erro de conexão com o servidor. Verifique se o backend está rodando.');
      }
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  onPageChange(event: any): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.usersService.paginateUsers(this.pageIndex + 1, this.pageSize);
  }

  openUserForm(user?: UserResponse): void {
    console.log('🔧 Abrindo formulário de usuário...', user ? 'Edição' : 'Criação');
    
    if (user) {
      // Para edição, buscar dados completos do usuário (incluindo endereços)
      console.log('📡 Buscando dados completos do usuário:', user.id);
      this.usersService.getUserById(user.id).subscribe({
        next: (completeUserData) => {
          console.log('📋 Dados completos recebidos:', completeUserData);
          if (completeUserData) {
            console.log('✅ Abrindo modal com dados completos');
            this.openDialogWithData(completeUserData, 'edit');
          } else {
            console.warn('⚠️ Usuário não encontrado, abrindo com dados básicos');
            this.openDialogWithData(user, 'edit');
          }
        },
        error: (error) => {
          console.error('❌ Erro ao buscar dados completos do usuário:', error);
          this.notificationService.showWarning('Erro ao carregar dados completos, usando dados básicos');
          this.openDialogWithData(user, 'edit');
        }
      });
    } else {
      // Para criação, abrir diretamente
      this.openDialogWithData(null, 'create');
    }
  }

  private openDialogWithData(user: UserResponse | null, mode: 'create' | 'edit'): void {
    console.log('🚪 Abrindo dialog com dados:', { user, mode });
    try {
      const dialogRef = this.dialog.open(UserProfileFormComponent, {
        width: '95%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        data: { user, mode },
        panelClass: 'user-profile-dialog'
      });

      console.log('✅ Dialog aberto com sucesso para modo:', mode);

      dialogRef.afterClosed().subscribe(result => {
        console.log('🚪 Modal fechado com resultado:', result);
        if (result) {
          console.log('📝 Formulário submetido - dados atualizados, chamando refreshCurrentUsers');
          this.usersService.refreshCurrentUsers();
          this.cdr.markForCheck(); // Force detection após atualização
        } else {
          console.log('❌ Formulário cancelado ou fechado sem salvar');
        }
      });
    } catch (error) {
      console.error('❌ Erro ao abrir formulário de usuário:', error);
      this.notificationService.showError('Erro ao abrir formulário de usuário');
    }
  }

  viewUserDetails(user: UserResponse): void {
    this.router.navigate(['/users', user.id]);
  }


  deleteUser(user: UserResponse): void {
    console.log('🗑️ Iniciando exclusão do usuário:', user);
    this.userToDelete = user;
    this.isDeleteDialogOpen = true;
  }

  showStatusDialog(user: UserResponse): void {
    console.log('🔄 Mostrando modal de status para usuário:', user);
    this.userToToggle = user;
    this.isStatusDialogOpen = true;
  }

  cancelStatusChange(): void {
    this.isStatusDialogOpen = false;
    this.userToToggle = null;
  }

  confirmStatusChange(): void {
    if (this.userToToggle) {
      console.log('✅ Confirmando mudança de status do usuário:', this.userToToggle.id);
      this.usersService.toggleUserStatus(this.userToToggle.id, !this.userToToggle.isActive);
    }
    this.isStatusDialogOpen = false;
    this.userToToggle = null;
  }

  confirmDelete(): void {
    if (this.userToDelete) {
      console.log('✅ Confirmando exclusão do usuário:', this.userToDelete.id);
      this.usersService.deleteUser(this.userToDelete.id).subscribe({
        next: (response) => {
          console.log('✅ Usuário excluído com sucesso:', response);
          this.isDeleteDialogOpen = false;
          this.userToDelete = null;
          this.notificationService.showSuccess('Usuário excluído com sucesso!');
          this.usersService.refreshCurrentUsers();
        },
        error: (error: any) => {
          console.error('❌ Erro ao excluir usuário:', error);
          this.isDeleteDialogOpen = false;
          this.userToDelete = null;
          
          // Tratamento específico de erros da API
          if (error.status === 400 && error.error?.Message) {
            this.notificationService.showError(error.error.Message);
          } else if (error.status === 403) {
            this.notificationService.showError('Você não tem permissão para excluir este usuário.');
          } else if (error.status === 404) {
            this.notificationService.showError('Usuário não encontrado.');
          } else {
            this.notificationService.showError('Erro ao excluir usuário. Tente novamente.');
          }
        }
      });
    }
  }

  cancelDelete(): void {
    this.isDeleteDialogOpen = false;
    this.userToDelete = null;
  }

  clearFilters(): void {
    this.searchControl.setValue('');
  }

  refreshUsers(): void {
    this.usersService.refreshCurrentUsers();
  }


  navigateToHome(): void {
    this.router.navigate(['/dashboard']);
  }

  async testUserEndpoint(): Promise<void> {
    console.log('🧪 Testando endpoint de usuários diretamente...');
    console.log('🔗 URL atual:', environment.apiUrl);
    
    try {
      // Teste direto do serviço
      this.usersService.loadUsers({ page: 1, pageSize: 10 }).subscribe({
        next: (response) => {
          console.log('✅ Teste direto bem-sucedido:', response);
          console.log('📊 Total de usuários:', response.totalCount);
          console.log('📋 Usuários na página:', response.data.length);
          this.notificationService.showSuccess(`✅ API OK! ${response.totalCount} usuários total, ${response.data.length} nesta página`);
        },
        error: (error) => {
          console.error('❌ Teste direto falhou:', error);
          console.error('🔍 Detalhes do erro:', {
            status: error.status,
            message: error.message,
            url: error.url,
            statusText: error.statusText
          });
          
          let errorMessage = `Erro: ${error.status}`;
          if (error.status === 0) {
            errorMessage = 'Erro de conexão: Verifique se o backend está rodando em http://127.0.0.1:7001';
          } else if (error.status === 401) {
            errorMessage = 'Erro de autenticação: Token inválido ou expirado';
          } else if (error.status === 404) {
            errorMessage = 'Endpoint não encontrado: /api/users';
          } else if (error.status === 500) {
            errorMessage = 'Erro interno do servidor';
          }
          
          this.notificationService.showError(errorMessage);
        }
      });
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      this.notificationService.showError('Erro inesperado no teste da API');
    }
  }

  async testBackendHealth(): Promise<void> {
    console.log('🏥 Testando saúde do backend...');
    
    try {
      const response = await fetch(`${environment.backendUrl}/health`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend saudável:', data);
        this.notificationService.showSuccess(`Backend OK! Status: ${data.status}`);
      } else {
        console.error('❌ Backend não saudável:', response.status);
        this.notificationService.showError(`Backend erro: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Erro ao testar backend:', error);
      this.notificationService.showError('Erro de conexão com o backend');
    }
  }

  forceUserSync(): void {
    console.log('🔄 Botão de sincronização de emergência clicado');
    const confirmed = confirm(
      'ATENÇÃO: Esta operação irá:\n\n' +
      '• Limpar todos os dados de usuário do navegador\n' +
      '• Forçar um novo login\n' +
      '• Sincronizar dados com o backend\n\n' +
      'Clique OK para continuar ou Cancelar para abortar.'
    );
    
    if (confirmed) {
      console.log('✅ Usuário solicitou sincronização forçada');
      this.notificationService.showWarning('Iniciando sincronização... A página será recarregada.');
      
      // Aguardar um pouco para mostrar a mensagem
      setTimeout(() => {
        this.userSyncService.forceUserSync();
      }, 1500);
    } else {
      console.log('❌ Usuário cancelou sincronização');
    }
  }

  // Seleção múltipla
  toggleSelectMode(): void {
    this.isSelectMode = !this.isSelectMode;
    if (!this.isSelectMode) {
      this.selectedUsers.clear();
    }
  }

  toggleUserSelection(userId: string): void {
    if (this.selectedUsers.has(userId)) {
      this.selectedUsers.delete(userId);
    } else {
      this.selectedUsers.add(userId);
    }
  }

  selectAllUsers(): void {
    this.dataSource.data.forEach(user => this.selectedUsers.add(user.id));
  }

  clearSelection(): void {
    this.selectedUsers.clear();
  }

  isUserSelected(userId: string): boolean {
    return this.selectedUsers.has(userId);
  }

  getSelectedUsersCount(): number {
    return this.selectedUsers.size;
  }

  hasSelection(): boolean {
    return this.selectedUsers.size > 0;
  }

  bulkActivateUsers(): void {
    const userIds = Array.from(this.selectedUsers);
    this.usersService.bulkToggleUsers(userIds, true);
    this.clearSelection();
  }

  bulkDeactivateUsers(): void {
    const userIds = Array.from(this.selectedUsers);
    this.usersService.bulkToggleUsers(userIds, false);
    this.clearSelection();
  }

  bulkDeleteUsers(): void {
    const userIds = Array.from(this.selectedUsers);
    this.usersService.bulkDeleteUsers(userIds);
    this.clearSelection();
    this.toggleSelectMode();
  }

  getDisplayedColumns(): string[] {
    return this.isSelectMode ? ['select', ...this.displayedColumns] : this.displayedColumns;
  }
}
