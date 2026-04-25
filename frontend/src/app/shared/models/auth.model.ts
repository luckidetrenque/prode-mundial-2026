export interface LoginRequest {
  afiliado: number;
  password: string;
}

export interface LoginResponse {
  token: string;
  nombre: string;
  apellido: string;
}

export interface AdminUser {
  afiliado: number;
  nombre: string;
  apellido: string;
}
