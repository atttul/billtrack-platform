import { api } from './api';
import { AuthResponse, LoginPayload, RegisterPayload, ForgotPasswordPayload, User } from '../types/auth';

export interface ApiResponseWrapper<T> {
  success: boolean;
  message: string;
  data: T;
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = (await api.post('/auth/register', payload)) as unknown as ApiResponseWrapper<AuthResponse>;
    return res.data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = (await api.post('/auth/login', payload)) as unknown as ApiResponseWrapper<AuthResponse>;
    return res.data;
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    await api.post('/auth/forgot-password', payload);
  },

  async getCurrentUser(): Promise<User> {
    const res = (await api.get('/auth/me')) as unknown as ApiResponseWrapper<User>;
    return res.data;
  },
};
