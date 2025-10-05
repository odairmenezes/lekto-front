import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { User, Address } from '../../shared/models/user.model';
import { CadDataService, UserCreateDto, UserUpdateDto, UserResponse } from './cad-data.service';

export type { UserCreateDto, UserUpdateDto, UserResponse } from './cad-data.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  
  constructor(@Inject(CadDataService) private readonly cadDataService: CadDataService) {}

  // Proxies para CadDataService
  createUser(userData: UserCreateDto): Observable<UserResponse> {
    return this.cadDataService.createUser(userData);
  }

  updateUser(id: string, userData: UserUpdateDto): Observable<UserResponse> {
    return this.cadDataService.updateUser(id, userData);
  }

  deleteUser(id: string): Observable<{ success: boolean; message: string }> {
    return this.cadDataService.deleteUser(id);
  }

  loadUsers(page: number = 1, pageSize: number = 10, search?: string): Observable<any> {
    return this.cadDataService.loadUsers(page, pageSize, search);
  }

  getUserById(id: string): Observable<any> {
    return this.cadDataService.getUserById(id);
  }

  toggleUserStatus(id: string, isActive: boolean): Observable<any> {
    return this.cadDataService.toggleUserStatus(id, isActive);
  }

  checkEmailExists(email: string): Observable<boolean> {
    return this.cadDataService.checkEmailExists(email);
  }

  checkCpfExists(cpf: string): Observable<boolean> {
    return this.cadDataService.checkCpfExists(cpf);
  }

  getUsers(filter: any): Observable<any> {
    return this.loadUsers(filter?.page || 1, filter?.pageSize || 10, filter?.search);
  }

  // Funções específicas de endereços
  getAddressesByUserId(userId: string): Observable<Address[]> {
    return this.cadDataService.getAddressesByUserId(userId);
  }

  createAddress(userId: string, addressData: any): Observable<Address> {
    return this.cadDataService.createAddress(userId, addressData);
  }

  updateAddress(addressId: string, addressData: any): Observable<Address> {
    return this.cadDataService.updateAddress(addressId, addressData);
  }

  deleteAddress(addressId: string): Observable<{ success: boolean }> {
    return this.cadDataService.deleteAddress(addressId);
  }

  setPrimaryAddress(addressId: string): Observable<boolean> {
    return this.cadDataService.setPrimaryAddress(addressId);
  }
}