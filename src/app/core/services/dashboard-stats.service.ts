import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CadDataService } from './cad-data.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  recentLogins: number;
  systemHealth: 'healthy' | 'warning' | 'error';
  lastUpdate?: string;
}

export interface SystemInfo {
  label: string;
  value: string;
  icon: string;
  status?: string;
}

export interface ActivityLog {
  id: string;
  type: 'login' | 'registration' | 'update' | 'backup' | 'error';
  description: string;
  timestamp: Date;
  user?: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class DashboardStatsService {
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private cadDataService: CadDataService,
    private authService: AuthService
  ) {}

  /**
   * Busca estatísticas do dashboard usando CadDataService
   * Força uma nova busca sempre para garantir dados atualizados
   */
  getDashboardStats(): Observable<DashboardStats> {
    console.log('📊 Buscando estatísticas reais do dashboard (forçando refresh)...');
    
    return this.cadDataService.loadUsers(1, 100).pipe(
      map((usersResponse) => {
        // Obter usuário atual logado
        const currentUser = this.getCurrentUser();
        const isCurrentUserActive = currentUser?.isActive !== false;
        
        // Calcular estatísticas incluindo o usuário logado
        const totalUsers = usersResponse.totalCount + 1; // +1 para incluir usuário logado
        const activeUsers = usersResponse.users.filter(user => user.isActive).length + (isCurrentUserActive ? 1 : 0);
        
        console.log('📈 Estatísticas calculadas (incluindo usuário logado):', {
          totalUsersFromAPI: usersResponse.totalCount,
          totalUsersWithCurrent: totalUsers,
          activeUsersFromAPI: usersResponse.users.filter(user => user.isActive).length,
          activeUsersWithCurrent: activeUsers,
          currentUserActive: isCurrentUserActive,
          usersData: usersResponse.users.length
        });
        
        return {
          totalUsers: totalUsers,
          activeUsers: activeUsers,
          recentLogins: totalUsers, // Considerando que todos os usuários podem ter feito login recentemente
          systemHealth: 'healthy' as const,
          lastUpdate: new Date().toISOString()
        };
      }),
      catchError((error) => {
        console.warn('⚠️ API não disponível, usando dados locais:', error);
        return this.getLocalStats();
      })
    );
  }

  /**
   * Busca informações do sistema
   */
  getSystemInfo(): Observable<SystemInfo[]> {
    return of(this.getStaticSystemInfo());
  }

  /**
   * Busca atividades recentes
   */
  getRecentActivities(): Observable<ActivityLog[]> {
    return of(this.getStaticActivities());
  }

  /**
   * Atualiza estatísticas específicas usando CadDataService
   * Versão otimizada para refresh rápido
   */
  refreshUserStats(): Observable<{ totalUsers: number; activeUsers: number }> {
    console.log('🔄 Refreshing user stats...');
    
    return this.cadDataService.loadUsers(1, 100).pipe(
      map((usersResponse) => {
        // Obter usuário atual logado
        const currentUser = this.getCurrentUser();
        const isCurrentUserActive = currentUser?.isActive !== false;
        
        // Calcular estatísticas incluindo o usuário logado
        const totalUsers = usersResponse.totalCount + 1; // +1 para incluir usuário logado
        const activeUsers = usersResponse.users.filter(user => user.isActive).length + (isCurrentUserActive ? 1 : 0);
        
        console.log('📊 Stats atualizados (incluindo usuário logado):', { 
          totalUsers, 
          activeUsers,
          currentUserActive: isCurrentUserActive
        });
        
        return { 
          totalUsers: totalUsers, // Já inclui todos os usuários + usuário logado
          activeUsers: activeUsers 
        };
      }),
      catchError((error) => {
        console.warn('⚠️ Erro ao atualizar estatísticas:', error);
        return of({ totalUsers: 0, activeUsers: 0 });
      })
    );
  }

  /**
   * Fallback para estatísticas locais caso a API não esteja disponível
   */
  private getLocalStats(): Observable<DashboardStats> {
    return of({
      totalUsers: 1, // Pelo menos um usuário logado
      activeUsers: 1, // Pelo menos um usuário ativo
      recentLogins: 1, // Se está logado, teve acesso hoje
      systemHealth: 'warning',
      lastUpdate: new Date().toISOString()
    });
  }

  /**
   * Obtém o usuário atual logado
   */
  private getCurrentUser(): any {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Informações estáticas do sistema como fallback
   */
  private getStaticSystemInfo(): SystemInfo[] {
    return [
      {
        label: 'Versão do Sistema',
        value: 'Cad+ ERP v2.0.0',
        icon: 'info'
      },
      {
        label: 'Última Atualização',
        value: new Date().toLocaleDateString('pt-BR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        icon: 'update'
      },
      {
        label: 'Status do Sistema',
        value: 'Operacional',
        icon: 'check_circle',
        status: 'success'
      }
    ];
  }

  /**
   * Atividades estáticas como fallback
   */
  private getStaticActivities(): ActivityLog[] {
    const now = new Date();
    return [
      {
        id: '1',
        type: 'login',
        description: 'Login realizado com sucesso',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutos atrás
        user: 'Sistema',
        status: 'success'
      },
      {
        id: '2',
        type: 'update',
        description: 'Sistema atualizado para versão 2.0.0',
        timestamp: new Date(now.getTime() - 60 * 60 * 1000), // 1 hora atrás
        status: 'info'
      },
      {
        id: '3',
        type: 'backup',
        description: 'Backup automático realizado',
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 dia atrás
        status: 'success'
      }
    ];
  }
}