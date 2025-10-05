import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { CadDataService } from './cad-data.service';
import { User, LoginRequest, LoginResponse } from '../../shared/models/user.model';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  cpf: string;
  phone: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(@Inject(CadDataService) private readonly cadDataService: CadDataService) {}

  login(request: LoginRequest): Observable<LoginResponse> {
    console.log('🔐 AuthService.login chamado com:', request);
    return this.cadDataService.login(request).pipe(
      tap((response) => {
        console.log('🔐 AuthService.login resposta:', response);
        console.log('🔐 Token armazenado após login:', localStorage.getItem('accessToken'));
      })
    );
  }

  logout(): void {
    this.cadDataService.logout();
  }

  isLoggedIn(): boolean {
    return this.cadDataService.isLoggedIn();
  }

  getCurrentUser(): Observable<User | null> {
    return this.cadDataService.currentUser$;
  }

  register(userData: any): Observable<User> {
    return this.cadDataService.createUser({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      cpf: userData.cpf,
      phone: userData.phone,
      password: userData.password,
      confirmPassword: userData.confirmPassword,
      addresses: userData.addresses?.map((addr: any) => ({
        id: '',
        street: addr.street,
        number: addr.number,
        complement: addr.complement,
        neighborhood: addr.neighborhood,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zipCode,
        country: addr.country,
        isMain: addr.isMain
      }))
    });
  }

  checkEmailExists(email: string): Observable<boolean> {
    return this.cadDataService.checkEmailExists(email);
  }

  checkCpfExists(cpf: string): Observable<boolean> {
    return this.cadDataService.checkCpfExists(cpf);
  }
}