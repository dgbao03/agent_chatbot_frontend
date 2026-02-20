import { authApi } from './authApi'
import { tokenStorage } from '../lib/tokenStorage'
import type { AuthUser, AuthSession } from '../types/auth'

export interface SignUpData {
  email: string
  password: string
  name?: string
}

export interface SignInData {
  email: string
  password: string
}

/** Session với access_token - tương thích api.ts (session.access_token) */
export interface SessionLike {
  access_token: string
  user?: AuthUser
}

function isTokenExpired(token: string, bufferSeconds = 60): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    const exp = payload.exp as number
    return Date.now() + bufferSeconds * 1000 >= exp * 1000
  } catch {
    return true
  }
}

async function buildSessionFromTokens(access_token: string): Promise<AuthSession | null> {
  const { user, error } = await authApi.getMe(access_token)
  if (error || !user) return null
  return { access_token, user }
}

export const authService = {
  async signUp(data: SignUpData): Promise<{ user: AuthUser | null; error: string }> {
    try {
      const { data: tokens, error } = await authApi.register(data.email, data.password, data.name)
      if (error) return { user: null, error }
      if (!tokens) return { user: null, error: 'Đăng ký thất bại' }

      const session = await buildSessionFromTokens(tokens.access_token)
      if (!session) return { user: null, error: 'Không thể lấy thông tin người dùng' }

      tokenStorage.setStoredSession(session)
      return { user: session.user, error: '' }
    } catch {
      return { user: null, error: 'Lỗi kết nối. Vui lòng thử lại.' }
    }
  },

  async signIn(data: SignInData): Promise<{ user: AuthUser | null; error: string }> {
    try {
      const { data: tokens, error } = await authApi.login(data.email, data.password)
      if (error) return { user: null, error }
      if (!tokens) return { user: null, error: 'Đăng nhập thất bại' }

      const session = await buildSessionFromTokens(tokens.access_token)
      if (!session) return { user: null, error: 'Không thể lấy thông tin người dùng' }

      tokenStorage.setStoredSession(session)
      return { user: session.user, error: '' }
    } catch {
      return { user: null, error: 'Lỗi kết nối. Vui lòng thử lại.' }
    }
  },

  async signOut(): Promise<{ error: string }> {
    try {
      const session = tokenStorage.getStoredSession()
      if (session?.access_token) {
        await authApi.signOut(session.access_token)
      }
      tokenStorage.clearStoredSession()
      return { error: '' }
    } catch {
      tokenStorage.clearStoredSession()
      return { error: '' }
    }
  },

  async getSession(): Promise<SessionLike | null> {
    try {
      let session = tokenStorage.getStoredSession()
      if (!session) return null

      if (isTokenExpired(session.access_token)) {
        const { data: tokens, error } = await authApi.refreshToken()
        if (error || !tokens) {
          tokenStorage.clearStoredSession()
          return null
        }
        session = await buildSessionFromTokens(tokens.access_token)
        if (!session) return null
        tokenStorage.setStoredSession(session)
      }

      return {
        access_token: session.access_token,
        user: session.user,
      }
    } catch {
      return null
    }
  },

  async getUser(): Promise<AuthUser | null> {
    const session = await this.getSession()
    return session?.user ?? null
  },

  async checkEmailExists(email: string): Promise<{ exists: boolean; error: string }> {
    try {
      const { providers, error } = await authApi.checkProviders(email)
      if (error) return { exists: false, error }
      return { exists: providers.length === 1, error: '' }
    } catch {
      return { exists: false, error: 'Lỗi kết nối. Vui lòng thử lại.' }
    }
  },

  async checkUserAuthProviders(email: string): Promise<{ providers: string[]; error: string }> {
    try {
      const { providers, error } = await authApi.checkProviders(email)
      if (error) return { providers: [], error }
      return { providers, error: '' }
    } catch {
      return { providers: [], error: 'Lỗi kết nối. Vui lòng thử lại.' }
    }
  },

  async signInWithGoogle(): Promise<{ error: string }> {
    try {
      const { url, error } = await authApi.getGoogleAuthUrl()
      if (error) return { error }
      if (!url) return { error: 'Không thể lấy URL đăng nhập Google' }
      window.location.href = url
      return { error: '' }
    } catch {
      return { error: 'Không thể đăng nhập với Google. Vui lòng thử lại.' }
    }
  },

  async resetPasswordForEmail(email: string): Promise<{ error: string }> {
    try {
      const { error } = await authApi.forgotPassword(email)
      return { error }
    } catch {
      return { error: 'Connection error. Please try again.' }
    }
  },

  async verifyResetToken(token: string): Promise<{ valid: boolean; error: string }> {
    try {
      const { valid, error } = await authApi.verifyResetToken(token)
      return { valid: valid ?? false, error }
    } catch {
      return { valid: false, error: 'Connection error. Please try again.' }
    }
  },

  async updatePassword(token: string, newPassword: string): Promise<{ error: string }> {
    try {
      const { error } = await authApi.resetPassword(token, newPassword)
      return { error }
    } catch {
      return { error: 'Connection error. Please try again.' }
    }
  },
}
