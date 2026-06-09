import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types/auth.types'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  setTokens: (access: string, refresh: string) => void
  setUser: (user: User) => void
  switchCompany: (companyId: number, companyName: string) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken:  null,
      refreshToken: null,
      user:         null,
      setTokens:    (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser:      (user) => set({ user }),
      switchCompany: (companyId, companyName) =>
        set(state => ({ user: state.user ? { ...state.user, companyId, companyName } : null })),
      logout:       () => set({ accessToken: null, refreshToken: null, user: null }),
      isAuthenticated: () => !!get().accessToken,
    }),
    { name: 'auth-storage' }
  )
)
