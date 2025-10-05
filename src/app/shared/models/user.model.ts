// ====== MODELOS DO CADPLUS ERP ======

export interface CadPlusAddress {
  Id: string;
  Street: string;
  Number?: string;
  Neighborhood?: string;
  Complement?: string;
  City: string;
  State: string;
  ZipCode: string;
  Country: string;
  IsPrimary: boolean;
}

export interface CadPlusUser {
  Id: string;
  FirstName: string;
  LastName: string;
  FullName: string;
  Cpf: string;
  Email: string;
  Phone: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string | null;
  Addresses: CadPlusAddress[];
}

export interface CadPlusLoginRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CadPlusLoginResponse {
  Success: boolean;
  Message: string;
  Data: {
    AccessToken: string;
    RefreshToken: string;
    ExpiresAt: string;
    User: CadPlusUser;
  };
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    user: User;
  };
}

export interface CadPlusRegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  cpf: string;
  phone: string;
  password: string;
}

export interface UserCreateRequest {
  firstName: string;
  lastName: string;
  email: string;
  cpf: string;
  phone: string;
  password: string;
  confirmPassword: string;
  addresses: AddressCreateRequest[];
}

export interface CadPlusUsersResponse {
  Success: boolean;
  Message: string;
  Data: {
    TotalCount: number;
    Data: CadPlusUser[];
  };
}

export interface UsersResponse {
  users: User[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface CadPlusAddressCreateRequest {
  street: string;
  number?: string;
  neighborhood?: string;
  complement?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isPrimary: boolean;
}

export interface AddressCreateRequest {
  street: string;
  number?: string;
  neighborhood?: string;
  complement?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isPrimary: boolean;
}

export interface CadPlusAddressResponse {
  Success: boolean;
  Message: string;
  Data: CadPlusAddress[];
}

export interface AddressResponse {
  success: boolean;
  message: string;
  data: Address[];
}

export interface SingleUserResponse {
  success: boolean;
  data: User;
}

export interface AddressUpdateRequest {
  street?: string;
  number?: string;
  neighborhood?: string;
  complement?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isPrimary?: boolean;
}

// ====== MODELOS LEGADOS (para compatibilidade) ======

export interface Address {
  id: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isMain: boolean;
  userId?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  cpf: string;
  phone: string;
  password?: string;
  confirmPassword?: string;
  isActive: boolean;
  addresses?: Address[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserCreateDto {
  firstName: string;
  lastName: string;
  email: string;
  cpf: string;
  phone: string;
  password: string;
  confirmPassword: string;
  addresses: Omit<Address, 'id'>[];
}

export interface UserUpdateDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}
