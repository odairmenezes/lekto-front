import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, switchMap, catchError } from 'rxjs/operators';
import { UserService, UserResponse } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';

export interface UsersFilterOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}

export interface PagedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface UserActionsSubject {
  type: 'REFRESH' | 'SEARCH' | 'FILTER';
  payload?: any;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private usersSubject = new BehaviorSubject<UserResponse[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private filterSubject = new BehaviorSubject<UsersFilterOptions>({ page: 1, pageSize: 10 });
  private userActionsSubject = new BehaviorSubject<UserActionsSubject>({ type: 'REFRESH' });

  public users$ = this.usersSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public currentFilter$ = this.filterSubject.asObservable();
  public userActions$ = this.userActionsSubject.asObservable();

  private currentFilter: UsersFilterOptions = { page: 1, pageSize: 10 };
  private cachedUsers: UserResponse[] = [];

  constructor(
    private userService: UserService,
    private notificationService: NotificationService
  ) {}

  loadUsers(filter?: Partial<UsersFilterOptions>): Observable<PagedResponse<UserResponse>> {
    this.updateFilter(filter);
    this.loadingSubject.next(true);

    return this.userService.getUsers(this.currentFilter).pipe(
      tap((rawResponse: any) => {
        console.log('🔍 UsersService.loadUsers - Resposta bruta:', rawResponse);
        console.log('🔍 UsersService.loadUsers - Tipo:', typeof rawResponse);
        console.log('🔍 UsersService.loadUsers - Propriedades:', rawResponse ? Object.keys(rawResponse) : 'null');
      }),
      map((response: any) => {
        console.log('🗂️ Mapeando resposta em UsersService:', response);
        
        // A resposta vem do CadDataService.loadUsers() que retorna UsersApiResponse
        return {
          data: response.users || [],
          totalCount: response.totalCount || 0,
          page: response.pageNumber || 1,
          pageSize: response.pageSize || 10
        };
      }),
      tap(response => {
        this.cachedUsers = response.data || [];
        this.usersSubject.next(response.data || []);
        this.loadingSubject.next(false);
      }),
      tap(() => {
        this.userActionsSubject.next({ type: 'REFRESH' });
      })
    );
  }

  getUserById(id: string): Observable<UserResponse | null> {
    console.log('🔍 getUserById chamado para ID:', id);
    this.loadingSubject.next(true);
    
    return this.userService.getUserById(id).pipe(
      switchMap((userData: UserResponse) => {
        console.log('👤 Dados básicos do usuário carregados:', userData);
        
        // Se há dados do usuário, carregar endereços
        if (userData && userData.id) {
          return this.userService.getAddressesByUserId(userData.id).pipe(
            map((addresses) => {
              console.log('🏠 Endereços carregados:', addresses);
              // Atualizar userData com os endereços
              userData.addresses = addresses;
              console.log('📋 Usuário completo com endereços:', userData);
              return userData;
            }),
            catchError((error) => {
              console.error('❌ Erro ao carregar endereços:', error);
              // Mesmo sem endereços, continuar retornando o usuário
              userData.addresses = [];
              return of(userData);
            })
          );
        } else {
          // Se não há dados do usuário, retornar conforme recebido
          return of(userData);
        }
      }),
      tap(() => this.loadingSubject.next(false))
    );
  }

  refreshCurrentUsers(): void {
    console.log('🗂️ refreshCurrentUsers chamado');
    const currentFilter = this.filterSubject.value;
    console.log('🔧 Filtro atual:', currentFilter);
    this.loadUsers(currentFilter).subscribe({
      next: (response) => {
        console.log('✅ refreshCurrentUsers concluído:', response.data.length, 'usuários');
      },
      error: (error) => {
        console.error('❌ Erro no refreshCurrentUsers:', error);
      }
    });
  }

  searchUsers(searchTerm: string): void {
    const filter = { ...this.currentFilter, search: searchTerm, page: 1 };
    this.loadUsers(filter).subscribe({
      next: () => {
        this.userActionsSubject.next({ type: 'SEARCH', payload: searchTerm });
      },
      error: (error) => {
        console.error('Erro na pesquisa:', error);
        this.notificationService.showError('Erro ao pesquisar usuários');
      }
    });
  }

  filterUsers(filter: Partial<UsersFilterOptions>): void {
    this.loadUsers(filter).subscribe({
      next: () => {
        this.userActionsSubject.next({ type: 'FILTER' });
      },
      error: (error) => {
        console.error('Erro no filtro:', error);
        this.notificationService.showError('Erro ao filtrar usuários');
      }
    });
  }

  paginateUsers(page: number, pageSize?: number): void {
    const filter = { ...this.currentFilter, page };
    if (pageSize) {
      filter.pageSize = pageSize;
    }
    
    this.loadUsers(filter).subscribe();
  }

  toggleUserStatus(userId: string, isActive: boolean): void {
    this.userService.toggleUserStatus(userId, isActive).subscribe({
      next: () => {
        this.refreshCurrentUsers();
        const message = isActive ? 'Usuário ativado com sucesso' : 'Usuário desativado com sucesso';
        this.notificationService.showSuccess(message);
      },
      error: (error) => {
        console.error('Erro ao alterar status:', error);
        this.notificationService.showError('Erro ao alterar status do usuário');
      }
    });
  }

  deleteUser(userId: string): Observable<{ success: boolean; message: string }> {
    this.loadingSubject.next(true);

    return this.userService.deleteUser(userId).pipe(
      map(() => ({ success: true, message: 'Usuário excluído com sucesso!' })),
      tap(response => {
        this.notificationService.showSuccess(response.message);
        this.refreshCurrentUsers();
        this.loadingSubject.next(false);
      })
    );
  }

  getCachedUsers(): UserResponse[] {
    return this.cachedUsers;
  }

  getCurrentFilter(): UsersFilterOptions {
    return { ...this.currentFilter };
  }

  private updateFilter(newFilter?: Partial<UsersFilterOptions>): void {
    this.currentFilter = { ...this.currentFilter, ...newFilter };
    this.filterSubject.next(this.currentFilter);
  }

  // Exportação de usuários
  exportUsers(format: 'csv' | 'excel' = 'csv'): void {
    this.loadingSubject.next(true);
    
    // Carregar todos os usuários para exportação
    this.userService.getUsers({ page: 1, pageSize: 1000 }).subscribe({
      next: (response: any) => {
        this.generateExportFile(response.users || [], format);
        this.loadingSubject.next(false);
        this.notificationService.showSuccess(`Arquivo ${format.toUpperCase()} gerado com sucesso!`);
      },
      error: (error: any) => {
        console.error('Erro ao exportar usuários:', error);
        this.notificationService.showError('Erro ao gerar arquivo de exportação');
        this.loadingSubject.next(false);
      }
    });
  }

  private generateExportFile(users: UserResponse[], format: string): void {
    const timestamp = new Date().toISOString().split('.').join('-').replace('T', '_').slice(0, 19);
    
    if (format === 'csv') {
      this.exportToCSV(users, `usuarios_${timestamp}.csv`);
    } else if (format === 'excel') {
      this.exportToExcel(users, `usuarios_${timestamp}.xlsx`);
    }
  }

  private exportToCSV(users: UserResponse[], filename: string): void {
    const headers = ['ID', 'Nome', 'Sobrenome', 'Email', 'CPF', 'Telefone', 'Status', 'Criado em'];
    const csvContent = [
      headers.join(','),
      ...users.map((user: UserResponse) => [
        user.id,
        `"${user.firstName}"`,
        `"${user.lastName}"`,
        `"${user.email}"`,
        `"${user.cpf}"`,
        `"${user.phone}"`,
        user.isActive ? 'Ativo' : 'Inativo',
        user.createdAt || ''
      ].join(','))
    ].join('\n');

    this.downloadFile(csvContent, filename, 'text/csv');
  }

  private exportToExcel(users: UserResponse[], filename: string): void {
    // Para Excel, usar CSV por enquanto (em produção, usar uma biblioteca como xlsx)
    this.exportToCSV(users, filename.replace('.xlsx', '.csv'));
    this.notificationService.showInfo('Exportação realizada como CSV (Excel será implementado em breve)');
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Operações em lote
  bulkToggleUsers(userIds: string[], isActive: boolean): void {
    if (userIds.length === 0) {
      this.notificationService.showWarning('Selecione pelo menos um usuário');
      return;
    }

    const action = isActive ? 'ativar' : 'desativar';
    const confirmed = confirm(`Tem certeza que deseja ${action} ${userIds.length} usuário(s) selecionado(s)?`);
    
    if (!confirmed) return;

    this.loadingSubject.next(true);
    let completedCount = 0;
    let errorCount = 0;

    userIds.forEach(userId => {
      this.userService.toggleUserStatus(userId, isActive).subscribe({
        next: () => {
          completedCount++;
          if (completedCount + errorCount === userIds.length) {
            this.loadingSubject.next(false);
            this.refreshCurrentUsers();
            
            if (errorCount === 0) {
              this.notificationService.showSuccess(`${completedCount} usuário(s) ${action}(s) com sucesso!`);
            } else {
              this.notificationService.showWarning(`${completedCount} usuário(s) ${action}(s), ${errorCount} com erro`);
            }
          }
        },
        error: (error) => {
          console.error(`Erro ao ${action} usuário ${userId}:`, error);
          errorCount++;
          
          if (completedCount + errorCount === userIds.length) {
            this.loadingSubject.next(false);
            this.refreshCurrentUsers();
            
            if (completedCount > 0) {
              this.notificationService.showWarning(`${completedCount} usuário(s) ${action}(s), ${errorCount} com erro`);
            } else {
              this.notificationService.showError(`Erro ao ${action} usuários`);
            }
          }
        }
      });
    });
  }

  bulkDeleteUsers(userIds: string[]): void {
    if (userIds.length === 0) {
      this.notificationService.showWarning('Selecione pelo menos um usuário');
      return;
    }

    const confirmed = confirm(`Tem certeza que deseja excluir ${userIds.length} usuário(s) selecionado(s)? Esta ação não pode ser desfeita.`);
    
    if (!confirmed) return;

    this.loadingSubject.next(true);
    let completedCount = 0;
    let errorCount = 0;

    userIds.forEach(userId => {
      this.userService.deleteUser(userId).subscribe({
        next: (response) => {
          completedCount++;
          if (completedCount + errorCount === userIds.length) {
            this.loadingSubject.next(false);
            this.refreshCurrentUsers();
            
            if (errorCount === 0) {
              this.notificationService.showSuccess(`${completedCount} usuário(s) excluído(s) com sucesso!`);
            } else {
              this.notificationService.showWarning(`${completedCount} usuário(s) excluído(s), ${errorCount} com erro`);
            }
          }
        },
        error: (error) => {
          console.error(`Erro ao excluir usuário ${userId}:`, error);
          errorCount++;
          
          if (completedCount + errorCount === userIds.length) {
            this.loadingSubject.next(false);
            this.refreshCurrentUsers();
            
            if (completedCount > 0) {
              this.notificationService.showWarning(`${completedCount} usuário(s) excluído(s), ${errorCount} com erro`);
            } else {
              this.notificationService.showError(`Erro ao excluir usuários`);
            }
          }
        }
      });
    });
  }

  // Estatísticas de usuários - dados sempre atualizados
  getUsersStats(): Observable<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    recentUsers: number;
  }> {
    console.log('📊 Buscando estatísticas de usuários...');
    
    return this.userService.getUsers({ page: 1, pageSize: 1000 }).pipe(
      map((response: any) => {
        // Garantir acesso correto aos dados da resposta
        const users = response.users || [];
        const now = new Date();
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const stats = {
          totalUsers: users.length,
          activeUsers: users.filter((u: UserResponse) => u.isActive).length,
          inactiveUsers: users.filter((u: UserResponse) => !u.isActive).length,
          recentUsers: users.filter((u: UserResponse) => u.createdAt && new Date(u.createdAt) > lastWeek).length
        };
        
        console.log('📈 Estatísticas de usuários calculadas:', stats);
        return stats;
      })
    );
  }

  // Busca avançada
  advancedSearch(criteria: {
    name?: string;
    email?: string;
    cpf?: string;
    phone?: string;
    isActive?: boolean;
    dateFrom?: string;
    dateTo?: string;
  }): void {
    let filter: Partial<UsersFilterOptions> = { page: 1 };
    
    if (criteria.name) {
      filter.search = criteria.name;
    }
    
    if (criteria.isActive !== undefined) {
      filter.isActive = criteria.isActive;
    }

    this.loadUsers(filter).subscribe({
      next: (response) => {
        // Filtrar localmente adicionais se necessário
        let filteredUsers = response.data;
        
        if (criteria.email) {
          filteredUsers = filteredUsers.filter((u: UserResponse) => 
            u.email.toLowerCase().includes(criteria.email!.toLowerCase())
          );
        }
        
        if (criteria.cpf) {
          filteredUsers = filteredUsers.filter((u: UserResponse) => 
            u.cpf.includes(criteria.cpf!.replace(/\D/g, ''))
          );
        }
        
        if (criteria.phone) {
          filteredUsers = filteredUsers.filter((u: UserResponse) => 
            u.phone.includes(criteria.phone!.replace(/\D/g, ''))
          );
        }
        
        if (criteria.dateFrom || criteria.dateTo) {
          filteredUsers = filteredUsers.filter((u: UserResponse) => {
            if (!u.createdAt) return false;
            
            const createdDate = new Date(u.createdAt);
            const fromDate = criteria.dateFrom ? new Date(criteria.dateFrom) : null;
            const toDate = criteria.dateTo ? new Date(criteria.dateTo) : null;
            
            if (fromDate && createdDate < fromDate) return false;
            if (toDate && createdDate > toDate) return false;
            
            return true;
          });
        }
        
        this.usersSubject.next(filteredUsers);
        this.userActionsSubject.next({ type: 'SEARCH', payload: criteria });
      },
      error: (error) => {
        console.error('Erro na busca avançada:', error);
        this.notificationService.showError('Erro ao realizar busca avançada');
      }
    });
  }
}