export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  phone?: string
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export interface User {
  id: number
  name: string
  email: string
  phone?: string
  role: 'ADMIN' | 'MANAGER' | 'PROFESSIONAL' | 'CLIENT'
  professional: boolean
  active: boolean
  companyId?: number | null
  companyName?: string | null
}

export interface CreateManagerRequest {
  name: string
  email: string
  password: string
  phone?: string
  companyId?: number | null
  role?: 'MANAGER' | 'PROFESSIONAL'
  professional?: boolean
}