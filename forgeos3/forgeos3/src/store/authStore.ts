import { create } from 'zustand'
import api from '../lib/api'

interface User {
  id: string
  name: string
  email: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('forgeos3_token'),
  isAuthenticated: !!localStorage.getItem('forgeos3_token'),
  loading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post<{ token: string; user: User }>('/api/auth/login', { email, password })
      localStorage.setItem('forgeos3_token', data.token)
      set({ user: data.user, token: data.token, isAuthenticated: true, loading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid credentials'
      set({ error: message, loading: false })
      throw err
    }
  },

  signup: async (name: string, email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post<{ token: string; user: User }>('/api/auth/signup', { name, email, password })
      localStorage.setItem('forgeos3_token', data.token)
      set({ user: data.user, token: data.token, isAuthenticated: true, loading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      set({ error: message, loading: false })
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem('forgeos3_token')
    set({ user: null, token: null, isAuthenticated: false, error: null })
  },

  clearError: () => set({ error: null }),
}))
