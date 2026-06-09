import { api } from './axios'
import type { LoginRequest, RegisterRequest, TokenResponse } from '../types/auth.types'

export const login = (data: LoginRequest) =>
  api.post<TokenResponse>('/auth/login', data).then(r => r.data)

export const register = (data: RegisterRequest) =>
  api.post<TokenResponse>('/auth/register', data).then(r => r.data)

export const logout = () =>
  api.post('/auth/logout')

export const getMe = () =>
  api.get('/users/me').then(r => r.data)

export const forgotPassword = (email: string) =>
  api.post('/auth/forgot-password', { email })

export const resetPassword = (token: string, newPassword: string) =>
  api.post('/auth/reset-password', { token, newPassword })
