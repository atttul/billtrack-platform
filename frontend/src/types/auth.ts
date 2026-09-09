export interface User {
  id: string;
  name: string;
  email: string;
  timezone: string;
  currency: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  timezone?: string;
  currency?: string;
}
