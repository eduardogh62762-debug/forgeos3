import { create } from 'zustand'

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

  login: async (email: string, _password: string) => {
    set({ loading: true, error: null })
    void _password
    try {
      await new Promise(r => setTimeout(r, 800))

      // TODO Día 3: reemplazar por llamada real
      // const { data } = await api.post('/api/auth/login', { email, password })
      // const { token, user } = data
      // localStorage.setItem('forgeos3_token', token)
      // set({ user, token, isAuthenticated: true, loading: false })

      const mockUser = { id: 'u-1', name: email.split('@')[0], email }
      const mockToken = 'mock_token_' + Date.now()
      localStorage.setItem('forgeos3_token', mockToken)
      set({ user: mockUser, token: mockToken, isAuthenticated: true, loading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid credentials'
      set({ error: message, loading: false })
      throw err
    }
  },

  signup: async (name: string, email: string, _password: string) => {
    set({ loading: true, error: null })
    void _password
    try {
      await new Promise(r => setTimeout(r, 1000))

      // TODO Día 3: reemplazar por llamada real
      // const { data } = await api.post('/api/auth/signup', { name, email, password })
      // const { token, user } = data
      // localStorage.setItem('forgeos3_token', token)
      // set({ user, token, isAuthenticated: true, loading: false })

      const mockUser = { id: 'u-1', name, email }
      const mockToken = 'mock_token_' + Date.now()
      localStorage.setItem('forgeos3_token', mockToken)
      set({ user: mockUser, token: mockToken, isAuthenticated: true, loading: false })
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
