import { apiClient, serverFetch } from './client';
import { AuthResponse, TokenPair } from '@/types/api.types';

export const authApi = {
  register: (data: { email: string; username: string; password: string; displayName: string }) =>
    apiClient.post<AuthResponse>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/login', data),

  refresh: (refreshToken: string) =>
    apiClient.post<TokenPair>('/auth/refresh', { refreshToken }),

  logout: () => apiClient.post<void>('/auth/logout'),
};
