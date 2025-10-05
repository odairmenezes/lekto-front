import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';

import { AuthService } from '../../../../core/services/auth.service';
import { ProfileModalComponent } from '../profile-modal/profile-modal.component';
import { AuditLogsComponent } from '../audit-logs/audit-logs.component';
import { DashboardStatsService, DashboardStats, SystemInfo, ActivityLog } from '../../../../core/services/dashboard-stats.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { environment } from '../../../../../environments/environment';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  cpf: string;
  phone: string;
  isActive: boolean;
}

// Interface importada do serviço DashboardStatsService

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatGridListModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentUser: User | null = null;
  isLoading = true;
  environment = environment;
  dashboardStats: DashboardStats = {
    totalUsers: 0,
    activeUsers: 0,
    recentLogins: 0,
    systemHealth: 'healthy'
  };

  quickActions = [
    {
      title: 'Meu Perfil',
      description: 'Visualizar e editar suas informações pessoais',
      icon: 'person',
      route: '/profile',
      color: 'accent'
    },
    {
      title: 'Gerenciar Usuários',
      description: 'Visualizar e gerenciar todos os usuários do sistema',
      icon: 'people',
      route: '/users',
      color: 'primary'
    },
    {
      title: 'Auditoria do Sistema',
      description: 'Visualizar relatórios e auditoria do sistema',
      icon: 'assessment',
      route: '/reports',
      color: 'primary'
    },
    {
      title: 'Contato',
      description: 'Entre em contato conosco',
      icon: 'support_agent',
      route: '/contact',
      color: 'warn'
    }
  ];

  systemInfo: SystemInfo[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private dashboardStatsService: DashboardStatsService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Limpar dados mockados primeiro
    this.clearMockedData();
    
    // Verificar se há usuário logado
    if (!this.authService.isLoggedIn()) {
      console.log('Usuário não está logado. Redirecionando para login...');
      this.router.navigate(['/auth/login']);
      return;
    }

    console.log('🚀 Dashboard inicializando - carregando dados...');
    
    // Garantir que o usuário atual seja carregado primeiro
    this.loadCurrentUser();
    
    // Aguardar um momento para garantir que a autenticação esteja totalmente processada
    // e depois carregar as estatísticas
    setTimeout(() => {
      console.log('⏰ Executando refresh automático das estatísticas...');
      this.loadDashboardStats();
      this.loadSystemInfo();
    }, 100); // Pequeno delay para garantir que auth tokens estejam prontos
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Limpa todos os dados de autenticação e redireciona para login
   */
  logout(): void {
    this.authService.logout();
    console.log('Usuário deslogado. Redirecionando para login...');
    this.router.navigate(['/auth/login']);
  }

  testBackendConnection(): void {
    console.log('🔗 Testando conectividade com o backend...');
    
    // Testar health check do backend
    this.dashboardStatsService.getSystemInfo().subscribe({
      next: (info) => {
        console.log('✅ Backend conectado:', info);
        this.notificationService.showSuccess('Backend conectado com sucesso!');
      },
      error: (error) => {
        console.error('❌ Erro de conectividade com backend:', error);
        
        if (error.status === 0) {
          this.notificationService.showError('Backend não está rodando. Verifique se o servidor está ativo.');
        } else {
          this.notificationService.showError(`Erro de conexão: ${error.status} - ${error.statusText}`);
        }
      }
    });
  }

  /**
   * Carrega informações do sistema do backend
   */
  private loadSystemInfo(): void {
    this.dashboardStatsService.getSystemInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (info) => {
          this.systemInfo = info;
        },
        error: (error) => {
          console.error('Erro ao carregar informações do sistema:', error);
          // Fallback para informações básicas
          this.systemInfo = [
            {
              label: 'Versão do Sistema',
              value: 'Cad+ ERP v2.0.0',
              icon: 'info'
            },
            {
              label: 'Última Atualização',
              value: this.currentDateFormatted,
              icon: 'update'
            },
            {
              label: 'Status do Sistema',
              value: 'Verificando...',
              icon: 'refresh',
              status: 'warning'
            }
          ];
        }
      });
  }

  /**
   * Carrega dados do usuário atual
   */
  private loadCurrentUser(): void {
    this.authService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: User | null) => {
        this.currentUser = user;
        
        // Debug: verificar dados do usuário
        if (user) {
          console.log('✅ Usuário atual carregado:', {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isActive: user.isActive
          });
          
          // Força atualização das estatísticas com dados do usuário atual
          setTimeout(() => {
            this.loadStatsFromCurrentUser();
          }, 100);
          
        } else {
          console.log('❌ Nenhum usuário logado encontrado');
          this.clearMockedData();
        }
      });
  }

  /**
   * Remove dados mockados do localStorage
   */
  private clearMockedData(): void {
    // Limpar localStorage se dados estão mockados
    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
      try {
        const user = JSON.parse(currentUserStr);
        if (user.firstName === 'Maria' && user.lastName === 'Santos') {
          console.log('Removendo dados mockados do usuário...');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      } catch (error) {
        console.error('Erro ao verificar dados mockados:', error);
      }
    }
  }

  /**
   * Carrega estatísticas do dashboard do backend
   */
  private loadDashboardStats(): void {
    this.dashboardStatsService.getDashboardStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.dashboardStats = stats;
          this.isLoading = false;
          
          // Estatísticas carregadas com sucesso
        },
        error: (error) => {
          console.error('Erro ao carregar estatísticas do dashboard:', error);
          this.isLoading = false;
          
          // Fallback para estatísticas baseadas no usuário atual logado
          this.loadStatsFromCurrentUser();
        }
      });
  }

  /**
   * Carrega estatísticas baseadas no usuário atual quando API não está disponível
   */
  private loadStatsFromCurrentUser(): void {
    if (this.currentUser) {
      console.log('Carregando estatísticas baseadas no usuário atual:', this.currentUser.firstName);
      
      this.dashboardStats = {
        totalUsers: 1, // Pelo menos o usuário atual
        activeUsers: this.currentUser.isActive !== false ? 1 : 0,
        recentLogins: 1, // Se está logado agora, tem acesso hoje
        systemHealth: 'healthy'
      };

      // Estatísticas calculadas com base no usuário atual
      
    } else {
      // Se não há usuário, mantém zerado
      this.dashboardStats = {
        totalUsers: 0,
        activeUsers: 0,
        recentLogins: 0,
        systemHealth: 'warning'
      };
    }
  }

  /**
   * Retorna o nome completo do usuário
   */
  get fullUserName(): string {
    if (this.currentUser) {
      return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }
    return 'Usuário';
  }

  /**
   * Retorna mensagem de boas-vindas personalizada
   * REQUISITO: "Bem-vindo {NomeUsuario}! O que deseja fazer hoje?"
   */
  get welcomeMessage(): string {
    const firstName = this.currentUser?.firstName || 'Usuário';
    return `Bem-vindo ${firstName}! O que deseja fazer hoje?`;
  }

  /**
   * Retorna horário de saudação baseado no momento do dia
   */
  get timeGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  /**
   * Navega para uma ação rápida ou abre modal
   */
  navigateToAction(route: string): void {
    console.log('Navegando para rota:', route);
    
    // Verificar se a rota existe
    if (!route) {
      console.error('Rota não definida');
      return;
    }
    
    // Se for perfil, abrir modal
    if (route === '/profile') {
      this.openProfileModal();
      return;
    }
    
    // Se for auditoria, abrir modal
    if (route === '/reports') {
      this.openAuditModal();
      return;
    }
    
    this.router.navigate([route]).then(
      (success) => {
        if (success) {
          console.log('✅ Navegação bem-sucedida para:', route);
        } else {
          console.error('❌ Falha na navegação para:', route);
          this.notificationService.showError(`Não foi possível acessar: ${route}`);
        }
      },
      (error) => {
        console.error('❌ Erro na navegação:', error);
        this.notificationService.showError(`Erro ao navegar para: ${route}`);
      }
    );
  }

  /**
   * Abre o modal de perfil
   */
  private openProfileModal(): void {
    console.log('👤 Abrindo modal de perfil...');
    
    const dialogRef = this.dialog.open(ProfileModalComponent, {
      width: '90%',
      maxWidth: '800px',
      maxHeight: '90vh',
      data: { user: this.currentUser },
      panelClass: 'profile-modal-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('👤 Modal de perfil fechado:', result);
      
      if (result === 'logout') {
        // Se o usuário fez logout do modal, redirecionar para login
        this.authService.logout();
        this.router.navigate(['/auth/login']);
      } else if (result) {
        // Se houve alguma atualização, recarregar dados do usuário
        this.loadCurrentUser();
      }
    });
  }

  /**
   * Abre o modal de auditoria
   */
  private openAuditModal(): void {
    console.log('📊 Abrindo modal de auditoria...');
    
    const dialogRef = this.dialog.open(AuditLogsComponent, {
      width: '95%',
      maxWidth: '1400px',
      maxHeight: '90vh',
      panelClass: 'audit-modal-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('📊 Modal de auditoria fechado:', result);
    });
  }

  /**
   * Retorna cor baseada no status da estatística
   */
  getStatColor(stat: string): string {
    if (!this.dashboardStats) return 'primary';
    
    switch (stat) {
      case 'totalUsers':
        return 'primary';
      case 'activeUsers':
        return 'accent';
      case 'recentLogins':
        return 'warn';
      default:
        return 'primary';
    }
  }

  /**
   * Retorna ícone baseado no status
   */
  getStatIcon(stat: string): string {
    switch (stat) {
      case 'totalUsers':
        return 'people';
      case 'activeUsers':
        return 'person_check';
      case 'recentLogins':
        return 'login';
      default:
        return 'analytics';
    }
  }

  /**
   * Retorna título da estatística
   */
  getStatTitle(stat: string): string {
    switch (stat) {
      case 'totalUsers':
        return 'Total de Usuários';
      case 'activeUsers':
        return 'Usuários Ativos';
      case 'recentLogins':
        return 'Acessos Hoje';
      default:
        return 'Estatística';
    }
  }

  /**
   * Formata número para exibição
   */
  formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }

  /**
   * Retorna data atual formatada para exibição no template
   */
  public getCurrentDate(): string {
    const date = new Date();
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Retorna porcentagem de usuários ativos
   */
  get activeUsersPercentage(): number {
    if (this.dashboardStats.totalUsers === 0) return 0;
    return Math.round((this.dashboardStats.activeUsers / this.dashboardStats.totalUsers) * 100);
  }

  /**
   * Data atual formatada (computed property para uso no template)
   */
  get currentDateFormatted(): string {
    const date = new Date();
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Refresh dos dados do dashboard
   */
  refreshDashboard(): void {
    this.isLoading = true;
    this.loadDashboardStats();
    this.loadSystemInfo();
  }

  /**
   * Testa diretamente a chamada para /api/users para debug do erro 401
   */
  testUsersEndpoint(): void {
    console.log('🧪 ========== TESTE DIRETO /api/users ==========');
    console.log('🧪 Chamando cadDataService.loadUsers() diretamente...');
    
    // Importar CadDataService diretamente para teste
    import('../../../../core/services/cad-data.service').then((module) => {
      // Este método requer uma instância do serviço, vamos fazer um teste mais simples
      this.testUsersWithHttpClient();
    });
  }
  
  /**
   * Teste usando HttpClient diretamente
   */
  private testUsersWithHttpClient(): void {
    console.log('🔧 ========== TESTE COM HTTPCLIENT DIRETO ==========');
    
    // Verificar localStorage primeiro
    const token = localStorage.getItem('accessToken');
    console.log('🔧 Token encontrado:', !!token);
    console.log('🔧 Token preview:', token ? token.substring(0, 50) + '...' : 'null');
    
    if (!token) {
      alert('ATENÇÃO: Token não encontrado! Faça login primeiro.');
      return;
    }
    
    // Testar chamada direta para API
    const url = '/api/users?page=1&pageSize=10';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    console.log('🔧 URL:', url);
    console.log('🔧 Headers:', headers);
    
    fetch(url, {
      method: 'GET',
      headers: headers
    })
    .then(response => {
      console.log('🔧 Response status:', response.status);
      console.log('🔧 Response ok:', response.ok);
      console.log('🔧 Response headers:', response.headers);
      
      if (response.ok) {
        return response.json();
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    })
    .then(data => {
      console.log('✅ SUCESSO - Dados recebidos:', data);
      alert('SUCESSO! API /users respondeu corretamente. Veja o console para detalhes.');
    })
    .catch(error => {
      console.error('<｜tool▁call▁begin｜> ❌ ERRO - Requisição falhou:', error);
      alert(`ERRO: ${error.message}. Veja o console para detalhes.`);
    });
  }
}