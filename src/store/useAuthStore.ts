import { create } from 'zustand'
import { authApi } from '../api/auth'
import { toast } from './useToastStore'
import type { User } from '../types'

const TOKEN_KEY = 'dodo_token'

type AuthPage = 'login' | 'register' | 'forgot' | 'reset' | 'verify-pending'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
  authPage: AuthPage
  pendingEmail: string   // email awaiting verification

  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  forgotPassword: (email: string) => Promise<string>
  resetPassword: (token: string, password: string) => Promise<string>
  verifyEmail: (email: string, otp: string) => Promise<void>
  resendVerification: (email: string) => Promise<string>
  updatePreferences: (prefs: { digestHour?: number; digestTimezoneOffset?: number }) => Promise<void>
  setAuthPage: (page: AuthPage) => void
  clearError: () => void
}

function apiError(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const r = (err as { response?: { data?: { error?: string } } }).response
    if (r?.data?.error) return r.data.error
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong'
}

function getErrorCode(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const r = (err as { response?: { data?: { code?: string; email?: string } } }).response
    return r?.data?.code
  }
}

function getErrorEmail(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const r = (err as { response?: { data?: { email?: string } } }).response
    return r?.data?.email
  }
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: localStorage.getItem(TOKEN_KEY),
  loading: false,
  error: null,
  authPage: 'login',
  pendingEmail: '',

  setAuthPage: (page) => set({ authPage: page, error: null }),
  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const { user, token } = await authApi.login({ email, password })
      localStorage.setItem(TOKEN_KEY, token)
      set({ user, token, loading: false })
    } catch (err) {
      // Email not verified — redirect to verification pending screen
      if (getErrorCode(err) === 'EMAIL_NOT_VERIFIED') {
        set({
          loading: false,
          error: null,
          authPage: 'verify-pending',
          pendingEmail: getErrorEmail(err) ?? email,
        })
        return
      }
      set({ loading: false, error: apiError(err) })
      throw err
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null })
    try {
      // Backend no longer returns a token — user must verify email first
      await authApi.register({ name, email, password })
      set({ loading: false, authPage: 'verify-pending', pendingEmail: email })
    } catch (err) {
      set({ loading: false, error: apiError(err) })
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    set({ user: null, token: null, authPage: 'login', pendingEmail: '' })
  },

  checkAuth: async () => {
    const token = get().token
    if (!token) return
    set({ loading: true })
    try {
      const user = await authApi.me()
      // If somehow an unverified user has a token, block them
      if (!user.emailVerified) {
        localStorage.removeItem(TOKEN_KEY)
        set({ user: null, token: null, loading: false, authPage: 'verify-pending', pendingEmail: user.email })
        return
      }
      set({ user, loading: false })
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      set({ user: null, token: null, loading: false })
    }
  },

  forgotPassword: async (email) => {
    set({ loading: true, error: null })
    try {
      const { message } = await authApi.forgotPassword(email)
      set({ loading: false })
      return message
    } catch (err) {
      set({ loading: false, error: apiError(err) })
      throw err
    }
  },

  resetPassword: async (token, password) => {
    set({ loading: true, error: null })
    try {
      const { message } = await authApi.resetPassword(token, password)
      set({ loading: false })
      return message
    } catch (err) {
      set({ loading: false, error: apiError(err) })
      throw err
    }
  },

  updatePreferences: async (prefs) => {
    try {
      const updated = await authApi.updatePreferences(prefs)
      set({ user: updated })
    } catch (err) {
      set({ error: apiError(err) })
      toast.error('Failed to save preferences')
    }
  },

  verifyEmail: async (email, otp) => {
    set({ loading: true, error: null })
    try {
      const { user, token } = await authApi.verifyEmail(email, otp)
      localStorage.setItem(TOKEN_KEY, token)
      set({ user, token, loading: false })
    } catch (err) {
      set({ loading: false, error: apiError(err) })
      throw err
    }
  },

  resendVerification: async (email) => {
    set({ loading: true, error: null })
    try {
      const { message } = await authApi.resendVerification(email)
      set({ loading: false })
      return message
    } catch (err) {
      set({ loading: false, error: apiError(err) })
      throw err
    }
  },
}))
