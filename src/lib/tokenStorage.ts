import type { AuthSession } from '../types/auth'

const STORAGE_KEY = 'auth_session'

export const tokenStorage = {
  getStoredSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as AuthSession
      if (!parsed?.access_token || !parsed?.user) return null
      return parsed
    } catch {
      return null
    }
  },

  setStoredSession(session: AuthSession): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } catch (e) {
      console.error('Failed to store session', e)
    }
  },

  clearStoredSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.error('Failed to clear session', e)
    }
  },
}
