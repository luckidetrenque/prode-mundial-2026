export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  nombre: string;
  apellido: string;
}

export interface AdminUser {
  email: string;
  nombre: string;
  apellido: string;
}
