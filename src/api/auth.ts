import client from './client'
import type { User } from '../types'

export interface AuthResponse {
  user: User
  token: string
}

export const authApi = {
  register: (payload: { name: string; email: string; password: string }) =>
    client.post<AuthResponse>('/auth/register', payload).then((r) => r.data),

  login: (payload: { email: string; password: string }) =>
    client.post<AuthResponse>('/auth/login', payload).then((r) => r.data),

  me: () =>
    client.get<User>('/auth/me').then((r) => r.data),

  verifyEmail: (email: string, otp: string) =>
    client.post<{ user: User; token: string; message: string }>('/auth/verify-email', { email, otp }).then((r) => r.data),

  forgotPassword: (email: string) =>
    client.post<{ message: string }>('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (token: string, password: string) =>
    client.post<{ message: string }>('/auth/reset-password', { token, password }).then((r) => r.data),

  resendVerification: (email: string) =>
    client.post<{ message: string }>('/auth/resend-verification', { email }).then((r) => r.data),
}
