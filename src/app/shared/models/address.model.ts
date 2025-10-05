export interface Address {
  id: string;
  userId?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isMain: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAddressDto {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isMain: boolean;
}
