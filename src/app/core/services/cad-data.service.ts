import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { 
  User, 
  Address, 
  LoginRequest,
  LoginResponse,
  UserCreateRequest,
  UsersResponse,
  AddressCreateRequest,
  AddressResponse,
  AddressUpdateRequest
} from '../../shared/models/user.model';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

// ====== INTERFACES LOCAIS ======
export interface UserCreateDto {
  firstName: string;
  lastName: string;
  email: string;
  cpf: string;
  phone: string;
  password: string;
  confirmPassword: string;
  addresses: AddressCreateRequest[];
  isActive?: boolean;
}

export interface UserUpdateDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  cpf?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  addresses?: Address[];
}

export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  cpf: string;
  phone: string;
  isActive: boolean;
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
}

export interface UsersApiResponse {
  users: UserResponse[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class CadDataService {
  private readonly apiUrl = environment.apiUrl;
  
  private userSubject = new BehaviorSubject<User | null>(null);
  private usersSubject = new BehaviorSubject<UserResponse[]>([]);
  
  // Users observable para componentes
  users$ = this.usersSubject.asObservable();
  currentUser$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {
    this.loadUserFromStorage();
    this.testBackendConnection();
  }

  // ====== HELPER METHODS ======

  getToken(): string | null {
    const token = localStorage.getItem("accessToken");
    console.log('🔑 getToken():', !!token);
    return token;
  }

  private getHttpOptions(): any {
    const token = this.getToken();
    
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      })
    };
    
    console.log('🔧 Headers criados:', options.headers.get('Authorization') ? 'com token' : 'sem token');
    return options;
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userSubject.next(user);
      } catch (error) {
        console.error('Erro ao carregar usuário do storage:', error);
      }
    }
  }

  private testBackendConnection(): void {
    // Usar proxy em vez de backendUrl direto para evitar CORS
    this.http.get(`/health`, { observe: 'response' }).subscribe({
      next: (response) => {
        console.log('✅ CadPlus ERP conectado:', response.status);
        this.notificationService.showSuccess('Backend conectado!');
      },
      error: (error) => {
        console.warn('⚠️ Backend não disponível:', error.message);
        this.notificationService.showWarning('Backend não conectado. Verifique se está rodando na porta 7001.');
      }
    });
  }

  // ====== AUTENTICAÇÃO ======

  login(request: LoginRequest): Observable<LoginResponse> {
    console.log('🔐 Login iniciado:', request.email);
    
    return this.http.post(`${this.apiUrl}/auth/login`, request).pipe(
      tap((response: any) => {
        console.log('📥 Resposta completa:', response);
        console.log('📊 Success (PascalCase):', response?.Success);
        console.log('📋 Data (PascalCase):', response?.Data);
      }),
      map((response: any) => {
        // API retorna Success/PascalCase mas nosso modelo espera success/camelCase
        if (!response?.Success) {
          console.error('❌ Login falhou:', response?.Message);
          throw new Error(response?.Message || 'Login falhou');
        }
        
        // Converte da estrutura da API para nossa estrutura padrão
        const loginResponse: LoginResponse = {
          success: response.Success,
          message: response.Message,
          data: {
            accessToken: response.Data.AccessToken,
            refreshToken: response.Data.RefreshToken,
            expiresAt: response.Data.ExpiresAt,
            user: {
              id: response.Data.User.Id,
              firstName: response.Data.User.FirstName,
              lastName: response.Data.User.LastName,
              email: response.Data.User.Email,
              cpf: response.Data.User.Cpf,
              phone: response.Data.User.Phone,
              isActive: response.Data.User.IsActive,
              addresses: response.Data.User.Addresses || []
            }
          }
        };
        
        return loginResponse;
      }),
      tap((response: LoginResponse) => {
        console.log('✅ Login bem-sucedido');
        if (response?.success && response?.data) {
          this.saveAuthData(response);
          this.userSubject.next(response.data.user);
          this.notificationService.showSuccess(`Bem-vindo, ${response.data.user.firstName}!`);
        }
      }),
      catchError((error) => {
        console.error('❌ Erro no login:', error);
        return this.handleError(error);
      })
    );
  }

  logout(): void {
    const token = this.getToken();
    if (token) {
      // Tentar fazer logout no backend via proxy
      this.http.post(`/logout`, {}, this.getHttpOptions()).subscribe({
        error: () => {
          // Ignora erros de logout, pois o token pode estar expirado
        }
      });
    }
    this.clearAuthData();
    this.userSubject.next(null);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = Date.now() / 1000 >= payload.exp;
      console.log('🔍 Token expirado?', isExpired);
      return !isExpired;
    } catch {
      return true; 
    }
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser$;
  }

  // ====== GESTÃO DE USUÁRIOS ======

  loadUsers(page: number = 1, pageSize: number = 10, search?: string): Observable<UsersApiResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (search) params.append('search', search);

    const url = `${this.apiUrl}/users?${params.toString()}`;
    console.log('🔗 Carregando usuários:', url);
    console.log('🔗 Token presente:', !!this.getToken());

    return this.http.get(url, this.getHttpOptions()).pipe(
      tap((response: any) => {
        console.log('📥 Resposta da API (users):', response);
        console.log('📊 Success (PascalCase):', response?.Success);
        console.log('📋 Data (PascalCase):', response?.Data);
      }),
      map((response: any) => {
        // API retorna Success/PascalCase, pode ter estrutura direta ou aninhada
        if (response?.Success || response?.success) {
          // Verificar estrutura da resposta - pode ser direta ou com data aninhada
          let usersData: any[] = [];
          
          if (response?.Success && response?.Data) {
            // Estrutura aninhada: { Success: true, Data: { Data: [...] } }
            if (response.Data.Data && Array.isArray(response.Data.Data)) {
              usersData = response.Data.Data;
            } else if (Array.isArray(response.Data)) {
              usersData = response.Data;
            }
          } else if (response?.success && response?.data) {
            // Estrutura camelCase: { success: true, data: [...] }
            usersData = Array.isArray(response.data) ? response.data : response.data.data || [];
          }
          
          console.log('👥 Usuários extraídos:', usersData.length);
          
          // Filtrar usuário atual da lista - não exibir na gestão de usuários
          const currentUserId = this.getCurrentUserId();
          const filteredUsers = usersData.filter((user: any) => 
            user.id !== currentUserId && user.Id !== currentUserId
          );
          
          console.log('🚫 Usuário atual filtrado:', currentUserId);
          console.log('📝 Usuários após filtragem:', filteredUsers.length, 'de', usersData.length);
          
          return {
            users: filteredUsers.map((user: any) => ({
              id: user.Id || user.id,
              firstName: user.FirstName || user.firstName || '',
              lastName: user.LastName || user.lastName || '',
              email: user.Email || user.email || '',
              cpf: user.Cpf || user.cpf || '',
              phone: user.Phone || user.phone || '',
              isActive: user.IsActive !== undefined ? user.IsActive : (user.isActive !== undefined ? user.isActive : true),
              addresses: [],
              createdAt: user.CreatedAt || user.createdAt || new Date().toISOString(),
              updatedAt: user.UpdatedAt || user.updatedAt || new Date().toISOString()
            })) as UserResponse[],
            totalCount: filteredUsers.length,
            pageNumber: page,
            pageSize: pageSize,
            totalPages: Math.ceil(filteredUsers.length / pageSize)
          } as UsersApiResponse;
        } else {
          console.log('⚠️ Resposta não esperada:', response);
          return {
            users: [],
            totalCount: 0,
            pageNumber: page,
            pageSize: pageSize,
            totalPages: 0
          } as UsersApiResponse;
        }
      }),
      tap((response: UsersApiResponse) => {
        console.log('✅ Dados estruturados:', response.users.length, 'usuários');
        this.usersSubject.next(response.users);
      }),
      catchError((error) => {
        console.error('❌ Erro ao carregar usuários:', error);
        return this.handleError(error);
      })
    );
  }

  getUserById(id: string): Observable<UserResponse> {
    console.log('🔍 getUserById chamado com ID:', id);
    return this.http.get(`${this.apiUrl}/users/${id}`, this.getHttpOptions()).pipe(
      tap((response: any) => {
        console.log('📥 Resposta completa getUserById:', response);
        console.log('📊 Success (PascalCase):', response?.Success);
        console.log('📋 Data (PascalCase):', response?.Data);
        console.log('📊 success (camelCase):', response?.success);
        console.log('📋 data (camelCase):', response?.data);
      }),
      map((response: any) => {
        // Verificar estrutura PascalCase primeiro (padrão da API)
        if (response?.Success && response?.Data) {
          console.log('✅ Estrutura PascalCase detectada');
          const userData = response.Data;
          return {
            id: userData.Id || userData.id,
            firstName: userData.FirstName || userData.firstName || '',
            lastName: userData.LastName || userData.lastName || '',
            email: userData.Email || userData.email || '',
            cpf: userData.Cpf || userData.cpf || '',
            phone: userData.Phone || userData.phone || '',
            isActive: userData.IsActive !== undefined ? userData.IsActive : (userData.isActive !== undefined ? userData.isActive : true),
            addresses: [],
            createdAt: userData.CreatedAt || userData.createdAt || new Date().toISOString(),
            updatedAt: userData.UpdatedAt || userData.updatedAt || new Date().toISOString()
          } as UserResponse;
        }
        // Verificar estrutura camelCase
        else if (response?.success && response?.data) {
          console.log('✅ Estrutura camelCase detectada');
          const userData = response.data;
          return {
            id: userData.Id || userData.id,
            firstName: userData.FirstName || userData.firstName || '',
            lastName: userData.LastName || userData.lastName || '',
            email: userData.Email || userData.email || '',
            cpf: userData.Cpf || userData.cpf || '',
            phone: userData.Phone || userData.phone || '',
            isActive: userData.IsActive !== undefined ? userData.IsActive : (userData.isActive !== undefined ? userData.isActive : true),
            addresses: [],
            createdAt: userData.CreatedAt || userData.createdAt || new Date().toISOString(),
            updatedAt: userData.UpdatedAt || userData.updatedAt || new Date().toISOString()
          } as UserResponse;
        } else {
          console.error('❌ Estrutura de resposta não reconhecida:', response);
          throw new Error('Resposta inválida');
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  createUser(userData: UserCreateRequest): Observable<UserResponse> {
    console.log('📡 createUser chamado com dados:', userData);
    
    return this.http.post(`${this.apiUrl}/users`, userData, this.getHttpOptions()).pipe(
      tap((response: any) => {
        console.log('📥 Resposta completa createUser:', response);
        console.log('📊 Success (PascalCase):', response?.Success);
        console.log('📋 Data (PascalCase):', response?.Data);
        console.log('📊 success (camelCase):', response?.success);
        console.log('📋 data (camelCase):', response?.data);
      }),
      map((response: any) => {
        // Verificar estrutura PascalCase primeiro (padrão da API)
        if (response?.Success && response?.Data) {
          console.log('✅ Estrutura PascalCase detectada (createUser)');
          const userData = response.Data;
          return {
            id: userData.Id || userData.id,
            firstName: userData.FirstName || userData.firstName || '',
            lastName: userData.LastName || userData.lastName || '',
            email: userData.Email || userData.email || '',
            cpf: userData.Cpf || userData.cpf || '',
            phone: userData.Phone || userData.phone || '',
            isActive: userData.IsActive !== undefined ? userData.IsActive : (userData.isActive !== undefined ? userData.isActive : true),
            addresses: [],
            createdAt: userData.CreatedAt || userData.createdAt || new Date().toISOString(),
            updatedAt: userData.UpdatedAt || userData.updatedAt || new Date().toISOString()
          } as UserResponse;
        }
        // Verificar estrutura camelCase
        else if (response?.success && response?.data) {
          console.log('✅ Estrutura camelCase detectada (createUser)');
          const userData = response.data;
          return {
            id: userData.Id || userData.id,
            firstName: userData.FirstName || userData.firstName || '',
            lastName: userData.LastName || userData.lastName || '',
            email: userData.Email || userData.email || '',
            cpf: userData.Cpf || userData.cpf || '',
            phone: userData.Phone || userData.phone || '',
            isActive: userData.IsActive !== undefined ? userData.IsActive : (userData.isActive !== undefined ? userData.isActive : true),
            addresses: [],
            createdAt: userData.CreatedAt || userData.createdAt || new Date().toISOString(),
            updatedAt: userData.UpdatedAt || userData.updatedAt || new Date().toISOString()
          } as UserResponse;
        } else {
          console.error('❌ Estrutura de resposta não reconhecida (createUser):', response);
          throw new Error(response?.Message || response?.message || 'Erro ao criar usuário');
        }
      }),
      tap(() => {
        this.loadUsers();
        this.notificationService.showSuccess('Usuário criado com sucesso!');
      }),
      catchError(this.handleError.bind(this))
    );
  }

  updateUser(id: string, userData: UserUpdateDto): Observable<UserResponse> {
    console.log('🔧 updateUser chamado com ID:', id);
    console.log('📝 Dados enviados:', userData);
    
    // Remover campos sensíveis do payload
    const { addresses, cpf, password, confirmPassword, ...safeData } = userData;
    console.log('📤 Payload limpo enviado:', safeData);
    
    return this.http.put(`${this.apiUrl}/users/${id}`, safeData, this.getHttpOptions()).pipe(
      tap((response: any) => {
        console.log('📥 Resposta completa updateUser:', response);
        console.log('📊 Success (PascalCase):', response?.Success);
        console.log('📋 Data (PascalCase):', response?.Data);
        console.log('📊 success (camelCase):', response?.success);
        console.log('📋 data (camelCase):', response?.data);
      }),
      map((response: any) => {
        // Verificar estrutura PascalCase primeiro (padrão da API)
        if (response?.Success && response?.Data) {
          console.log('✅ Estrutura PascalCase detectada (updateUser)');
          const userData = response.Data;
          return {
            id: userData.Id || userData.id,
            firstName: userData.FirstName || userData.firstName || '',
            lastName: userData.LastName || userData.lastName || '',
            email: userData.Email || userData.email || '',
            cpf: userData.Cpf || userData.cpf || '',
            phone: userData.Phone || userData.phone || '',
            isActive: userData.IsActive !== undefined ? userData.IsActive : (userData.isActive !== undefined ? userData.isActive : true),
            addresses: [],
            createdAt: userData.CreatedAt || userData.createdAt || new Date().toISOString(),
            updatedAt: userData.UpdatedAt || userData.updatedAt || new Date().toISOString()
          } as UserResponse;
        }
        // Verificar estrutura camelCase
        else if (response?.success && response?.data) {
          console.log('✅ Estrutura camelCase detectada (updateUser)');
          const userData = response.data;
          return {
            id: userData.Id || userData.id,
            firstName: userData.FirstName || userData.firstName || '',
            lastName: userData.LastName || userData.lastName || '',
            email: userData.Email || userData.email || '',
            cpf: userData.Cpf || userData.cpf || '',
            phone: userData.Phone || userData.phone || '',
            isActive: userData.IsActive !== undefined ? userData.IsActive : (userData.isActive !== undefined ? userData.isActive : true),
            addresses: [],
            createdAt: userData.CreatedAt || userData.createdAt || new Date().toISOString(),
            updatedAt: userData.UpdatedAt || userData.updatedAt || new Date().toISOString()
          } as UserResponse;
        } else {
          console.error('❌ Estrutura de resposta não reconhecida (updateUser):', response);
          throw new Error('Resposta inválida');
        }
      }),
      tap(() => {
        this.loadUsers();
        this.notificationService.showSuccess('Usuário atualizado com sucesso!');
      }),
      catchError(this.handleError.bind(this))
    );
  }

  deleteUser(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete(`${this.apiUrl}/users/${id}`, this.getHttpOptions()).pipe(
      map(() => ({ success: true, message: 'Usuário excluído com sucesso!' })),
      tap(() => {
        this.loadUsers();
        this.notificationService.showSuccess('Usuário excluído com sucesso!');
      }),
      catchError(this.handleError.bind(this))
    );
  }

  toggleUserStatus(id: string, isActive: boolean): Observable<any> {
    const endpoint = isActive ? `/${id}/activate` : `/${id}/deactivate`;
    const method = isActive ? 'post' : 'delete';
    
    return this.http[method](`${this.apiUrl}/users${endpoint}`, this.getHttpOptions()).pipe(
      tap(() => {
        this.loadUsers();
        this.notificationService.showSuccess(`Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso!`);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // ====== GESTÃO DE ENDEREÇOS ======

  getAddressesByUserId(userId: string): Observable<Address[]> {
    console.log('🏠 getAddressesByUserId chamado para ID:', userId);
    return this.http.get(`${this.apiUrl}/addresses/users/${userId}`, this.getHttpOptions()).pipe(
      tap((response: any) => {
        console.log('📥 Resposta completa getAddressesByUserId:', response);
        console.log('📊 Success (PascalCase):', response?.Success);
        console.log('📋 Data (PascalCase):', response?.Data);
      }),
      map((response: any) => {
        let addresses: any[] = [];
        
        // Verificar estrutura PascalCase primeiro (padrão da API)
        if (response?.Success && response?.Data) {
          console.log('✅ Estrutura PascalCase detectada (getAddressesByUserId)');
          addresses = Array.isArray(response.Data) ? response.Data : [];
        }
        // Verificar estrutura camelCase
        else if (response?.success && response?.data) {
          console.log('✅ Estrutura camelCase detectada (getAddressesByUserId)');
          addresses = Array.isArray(response.data) ? response.data : [];
        } else {
          console.warn('⚠️ Estrutura de resposta não reconhecida:', response);
          return [];
        }
        
        const mappedAddresses = addresses.map((addr: any) => ({
          id: addr.Id || addr.id,
          street: addr.Street || addr.street || '',
          number: addr.Number || addr.number || '',
          complement: addr.Complement || addr.complement || '',
          neighborhood: addr.Neighborhood || addr.neighborhood || '',
          city: addr.City || addr.city || '',
          state: addr.State || addr.state || '',
          zipCode: addr.ZipCode || addr.zipCode || '',
          country: addr.Country || addr.country || 'Brasil',
          isMain: addr.IsPrimary !== undefined ? addr.IsPrimary : (addr.isMain !== undefined ? addr.isMain : false)
        })) as Address[];
        
        console.log('✅ Endereços mapeados:', mappedAddresses.length);
        return mappedAddresses;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  createAddress(userId: string, addressData: AddressCreateRequest): Observable<Address> {
    console.log('🏠 createAddress chamado para userId:', userId);
    console.log('📝 Dados do endereço:', addressData);
    
    return this.http.post(`${this.apiUrl}/addresses/users/${userId}`, addressData, this.getHttpOptions()).pipe(
      tap((response: any) => {
        console.log('📥 Resposta completa createAddress:', response);
        console.log('📊 Success (PascalCase):', response?.Success);
        console.log('📋 Data (PascalCase):', response?.Data);
      }),
      map((response: any) => {
        let addressData: any = null;
        
        // Verificar estrutura PascalCase primeiro (padrão da API)
        if (response?.Success && response?.Data) {
          console.log('✅ Estrutura PascalCase detectada (createAddress)');
          addressData = response.Data;
        }
        // Verificar estrutura camelCase
        else if (response?.success && response?.data) {
          console.log('✅ Estrutura camelCase detectada (createAddress)');
          addressData = response.data;
        }
        
        if (addressData) {
          return {
            id: addressData.Id || addressData.id,
            street: addressData.Street || addressData.street || '',
            number: addressData.Number || addressData.number || '',
            complement: addressData.Complement || addressData.complement || '',
            neighborhood: addressData.Neighborhood || addressData.neighborhood || '',
            city: addressData.City || addressData.city || '',
            state: addressData.State || addressData.state || '',
            zipCode: addressData.ZipCode || addressData.zipCode || '',
            country: addressData.Country || addressData.country || 'Brasil',
            isMain: addressData.IsPrimary !== undefined ? addressData.IsPrimary : (addressData.isMain !== undefined ? addressData.isMain : false)
          } as Address;
        } else {
          throw new Error(response?.Message || response?.message || 'Erro ao criar endereço');
        }
      }),
      tap(() => {
        this.notificationService.showSuccess('Endereço criado com sucesso!');
      }),
      catchError(this.handleError.bind(this))
    );
  }

  updateAddress(addressId: string, addressData: AddressUpdateRequest): Observable<Address> {
    console.log('🏠 updateAddress chamado para addressId:', addressId);
    console.log('📝 Dados de atualização:', addressData);
    
    return this.http.put(`${this.apiUrl}/addresses/${addressId}`, addressData, this.getHttpOptions()).pipe(
      tap((response: any) => {
        console.log('📥 Resposta completa updateAddress:', response);
        console.log('📊 Success (PascalCase):', response?.Success);
        console.log('📋 Data (PASCALCase):', response?.Data);
      }),
      map((response: any) => {
        let responseData: any = null;
        
        // Verificar estrutura PascalCase primeiro (padrão da API)
        if (response?.Success && response?.Data) {
          console.log('✅ Estrutura PascalCase detectada (updateAddress)');
          responseData = response.Data;
        }
        // Verificar estrutura camelCase
        else if (response?.success && response?.data) {
          console.log('✅ Estrutura camelCase detectada (updateAddress)');
          responseData = response.data;
        }
        
        if (responseData) {
          return {
            id: responseData.Id || responseData.id,
            street: responseData.Street || responseData.street || '',
            number: responseData.Number || responseData.number || '',
            complement: responseData.Complement || responseData.complement || '',
            neighborhood: responseData.Neighborhood || responseData.neighborhood || '',
            city: responseData.City || responseData.city || '',
            state: responseData.State || responseData.state || '',
            zipCode: responseData.ZipCode || responseData.zipCode || '',
            country: responseData.Country || responseData.country || 'Brasil',
            isMain: responseData.IsPrimary !== undefined ? responseData.IsPrimary : (responseData.isMain !== undefined ? responseData.isMain : false)
          } as Address;
        } else {
          throw new Error(response?.Message || response?.message || 'Erro ao atualizar endereço');
        }
      }),
      tap(() => {
        this.notificationService.showSuccess('Endereço atualizado com sucesso!');
      }),
      catchError(this.handleError.bind(this))
    );
  }

  deleteAddress(addressId: string): Observable<{ success: boolean }> {
    console.log('🏠 deleteAddress chamado para addressId:', addressId);
    
    return this.http.delete(`${this.apiUrl}/addresses/${addressId}`, this.getHttpOptions()).pipe(
      tap((response: any) => {
        console.log('📥 Resposta completa deleteAddress:', response);
        console.log('📊 Success (PascalCase):', response?.Success);
      }),
      map((response: any) => {
        // A API retorna Success: true ou simplesmente remove
        return { success: true };
      }),
      tap(() => {
        this.notificationService.showSuccess('Endereço excluído com sucesso!');
      }),
      catchError((error) => {
        if (error.status === 400) {
          this.notificationService.showWarning('Não é possível excluir o último endereço do usuário.');
        }
        return this.handleError(error);
      })
    );
  }

  setPrimaryAddress(addressId: string): Observable<boolean> {
    console.log('⭐ setPrimaryAddress chamado para addressId:', addressId);
    
    return this.http.post(`${this.apiUrl}/addresses/${addressId}/set-primary`, {}, this.getHttpOptions()).pipe(
      tap((response: any) => {
        console.log('📥 Resposta completa setPrimaryAddress:', response);
        console.log('📊 Success (PascalCase):', response?.Success);
        console.log('📋 Data (PascalCase):', response?.Data);
      }),
      map((response: any) => {
        // Verificar estrutura PascalCase primeiro (padrão da API)
        if (response?.Success !== undefined) {
          console.log('✅ Estrutura PascalCase detectada (setPrimaryAddress)');
          return response.Data === true || response.Success === true;
        }
        // Verificar estrutura camelCase
        else if (response?.success !== undefined) {
          console.log('✅ Estrutura camelCase detectada (setPrimaryAddress)');
          return response.data === true || response.success === true;
        }
        
        return true; // Default se não conseguir determinar
      }),
      tap(() => {
        this.notificationService.showSuccess('Endereço definido como principal!');
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // ====== VALIDAÇÕES ======

  checkEmailExists(email: string): Observable<boolean> {
    return this.http.get(`${this.apiUrl}/users/check-email/${email}`, this.getHttpOptions()).pipe(
      map((response: any) => response as boolean),
      catchError(this.handleError.bind(this))
    );
  }

  checkCpfExists(cpf: string): Observable<boolean> {
    return this.http.get(`${this.apiUrl}/users/check-cpf/${cpf}`, this.getHttpOptions()).pipe(
      map((response: any) => response as boolean),
      catchError(this.handleError.bind(this))
    );
  }

  // ====== UTILITIES ======

  private getCurrentUserId(): string | null {
    console.log('🔍 Buscando ID do usuário atual...');
    
    // Tentar diferentes possíveis keys onde o usuário pode estar armazenado
    const possibleKeys = ['currentUser', 'authUser', 'user'];
    
    for (const key of possibleKeys) {
      const userStr = localStorage.getItem(key);
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const userId = user?.id || user?.Id || user?.userId || user?.UserId;
          if (userId) {
            console.log('✅ ID do usuário atual encontrado:', userId);
            return userId;
          }
        } catch (error) {
          console.warn(`⚠️ Erro ao parsear ${key}:`, error);
          continue;
        }
      }
    }
    
    console.log('❌ ID do usuário atual não encontrado');
    return null;
  }

  private saveAuthData(response: LoginResponse): void {
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    localStorage.setItem('currentUser', JSON.stringify(response.data.user));
    localStorage.setItem('tokenExpiration', response.data.expiresAt);
  }

  private clearAuthData(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('tokenExpiration');
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Erro desconhecido do servidor';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      if (error.status === 401) {
        console.error('🚨 ERRO 401: Token inválido ou expirado');
        console.error('🚨 Clearing authentication data...');
        errorMessage = 'Sessão expirada. Faça login novamente.';
        this.clearAuthData();
        this.userSubject.next(null);
      } else if (error.status === 403) {
        errorMessage = 'Acesso negado. Você não tem permissão para esta ação.';
      } else if (error.status === 404) {
        errorMessage = 'Recurso não encontrado.';
      } else if (error.status === 409) {
        errorMessage = error.error?.message || error.error?.error || 'Conflito: Este registro já existe.';
      } else if (error.status === 500) {
        errorMessage = error.error?.message || error.error?.error || 'Erro interno do servidor.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      }
    }

    this.notificationService.showError(errorMessage);
    return throwError(() => error);
  }
}
