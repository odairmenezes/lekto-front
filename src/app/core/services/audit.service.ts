import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AuditLog {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  changedAt: string;
  changedBy: string;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
}

export interface AuditLogResponse {
  logs: AuditLog[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
}

export interface AuditSearchParams {
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Busca logs por CPF do usuário
   */
  getLogsByCpf(cpf: string, params: AuditSearchParams = {}): Observable<AuditLogResponse> {
    const httpParams = this.buildHttpParams(params);
    console.log('🔍 Buscando logs por CPF:', cpf, params);
    
    return this.http.get<any>(`${this.apiUrl}/audit/cpf/${cpf}`, { 
      params: httpParams,
      ...this.getHttpOptions()
    }).pipe(
      map(response => this.mapAuditResponse(response)),
      catchError(error => {
        console.error('❌ Erro ao buscar logs por CPF:', error);
        throw error;
      })
    );
  }

  /**
   * Cria opções HTTP com token de autorização
   */
  private getHttpOptions(): any {
    const token = this.getToken();
    
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      })
    };
    
    console.log('🔧 Headers criados (AuditService):', options.headers.get('Authorization') ? 'com token' : 'sem token');
    return options;
  }

  /**
   * Obtém token de acesso do localStorage
   */
  private getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Constrói parâmetros HTTP
   */
  private buildHttpParams(params: AuditSearchParams): HttpParams {
    let httpParams = new HttpParams();
    
    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    
    return httpParams;
  }

  /**
   * Mapeia resposta da API para o formato interno
   */
  private mapAuditResponse(response: any): AuditLogResponse {
    console.log('📊 Mapeando resposta de auditoria:', response);
    
    // Suporte para ambos os formatos (PascalCase e camelCase)
    const data = response.Data || response.data;
    const logs = data?.Logs || data?.logs || [];
    
    return {
      logs: logs.map((log: any) => ({
        id: log.Id || log.id,
        userId: log.UserId || log.userId,
        entityType: log.EntityType || log.entityType,
        entityId: log.EntityId || log.entityId,
        fieldName: log.FieldName || log.fieldName,
        oldValue: log.OldValue || log.oldValue,
        newValue: log.NewValue || log.newValue,
        changedAt: log.ChangedAt || log.changedAt,
        changedBy: log.ChangedBy || log.changedBy,
        ipAddress: log.IpAddress || log.ipAddress,
        userAgent: log.UserAgent || log.userAgent,
        description: log.Description || log.description
      })),
      totalCount: data?.TotalCount || data?.totalCount || 0,
      currentPage: data?.CurrentPage || data?.currentPage || 1,
      totalPages: data?.TotalPages || data?.totalPages || 1,
      itemsPerPage: data?.ItemsPerPage || data?.itemsPerPage || 20
    };
  }

  /**
   * Formata data para exibição
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Obtém ícone baseado no tipo de entidade
   */
  getEntityIcon(entityType: string): string {
    const icons: { [key: string]: string } = {
      'User': 'person',
      'Address': 'home',
      'Profile': 'account_circle',
      'System': 'settings'
    };
    return icons[entityType] || 'description';
  }

  /**
   * Obtém cor baseada no tipo de ação
   */
  getActionColor(fieldName: string): string {
    const colors: { [key: string]: string } = {
      'FirstName': 'primary',
      'LastName': 'primary',
      'Email': 'accent',
      'Phone': 'accent',
      'Password': 'warn',
      'IsActive': 'warn',
      'Created': 'primary',
      'Updated': 'accent',
      'Deleted': 'warn',
      'SetPrimary': 'primary'
    };
    return colors[fieldName] || 'primary';
  }
}
