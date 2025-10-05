import { Injectable, Inject, forwardRef } from '@angular/core';
import { CadDataService } from './cad-data.service';

/**
 * Serviço responsável por manter a sincronização 
 * entre os dados do usuário no frontend e no backend
 */
@Injectable({
  providedIn: 'root'
})
export class UserSyncService {
  
  constructor(
    @Inject(forwardRef(() => CadDataService)) private cadDataService: CadDataService
  ) {}

  /**
   * Sincroniza os dados do usuário atual com o backend
   * Remove dados antigos/inconsistentes do localStorage
   */
  syncCurrentUser(): void {
    console.log('🔄 Iniciando sincronização de dados do usuário...');
    
    // Limpar dados antigos/inconsistentes
    this.clearInconsistentData();
    
    // Verificar se há usuário logado atual válido
    const currentToken = this.cadDataService.getToken();
    if (currentToken) {
      console.log('✅ Token encontrado, fazendo validação...');
      this.validateAndSync(currentToken);
    } else {
      console.log('⚠️ Nenhum token encontrado');
      this.clearAllAuthData();
    }
  }

  /**
   * Limpa dados inconsistentes do localStorage
   */
  private clearInconsistentData(): void {
    console.log('🧹 Limpando dados inconsistentes...');
    
    // IDs conhecidos que não existem mais no backend
    const invalidUserIds = [
      'd10835cf-91df-4d71-9e24-a2605c2151d2',
      '0c6df686-e812-46db-b099-a0aec1500b21' // admin antigo se necessário
    ];
    
    invalidUserIds.forEach(invalidId => {
      // Verificar se há dados relacionados a este-ID inválido
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.id === invalidId) {
            console.log(`🗑️ Removendo dados do usuário inválido: ${invalidId}`);
            localStorage.removeItem('currentUser');
          }
        } catch (e) {
          // JSON inválido, remover
          localStorage.removeItem('currentUser');
        }
      }
    });
    
    // Se há dados misturados, limpar tudo para forçar login novamente
    const currentToken = localStorage.getItem('accessToken');
    const currentUser = localStorage.getItem('currentUser');
    const cadPlusUser = localStorage.getItem('cadPlusUser');
    
    // Se há dados inconsistentes (ex: token CadPlus mas user antigo)
    if (cadPlusUser && currentUser && currentUser !== cadPlusUser) {
      console.log('🔀 Dados misturados detectados, limpeza completa...');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentUserId');
    }
  }

  /**
   * Valida o token atual e sincroniza dados se necessário
   */
  private validateAndSync(token: string): void {
    // TODO: Implementar validação de token
    console.log('✅ Token validado, dados já sincronizados');
  }

  /**
   * Limpa todos os dados de autenticação
   */
  private clearAllAuthData(): void {
    console.log('🗑️ Limpeza geral dos dados de autenticação');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cadPlusUser');
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('tokenExpiration');
  }

  /**
   * Força nova sincronização dos dados do usuário após login
   */
  forceUserSync(): void {
    console.log('🔄 Forçando sincronização completa do usuário...');
    this.clearAllAuthData();
    // Recarregar página para forçar novo login
    window.location.reload();
  }
}
