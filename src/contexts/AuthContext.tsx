import { createContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { authService } from '../services/auth'
import type { AuthUser, AuthSession } from '../types/auth'

const AUTH_SESSION_UPDATED = 'auth-session-updated'

interface AuthContextType {
  user: AuthUser | null
  session: AuthSession | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: string }>
  signUp: (email: string, password: string, name?: string) => Promise<{ error: string }>
  signInWithGoogle: () => Promise<{ error: string }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    const s = await authService.getSession()
    if (s && s.user) {
      setSession({ access_token: s.access_token, refresh_token: s.refresh_token || '', user: s.user })
      setUser(s.user)
    } else {
      setSession(null)
      setUser(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  useEffect(() => {
    const handler = () => {
      refreshSession()
    }
    window.addEventListener(AUTH_SESSION_UPDATED, handler)
    return () => window.removeEventListener(AUTH_SESSION_UPDATED, handler)
  }, [refreshSession])

  const signIn = async (email: string, password: string) => {
    const { user: u, error } = await authService.signIn({ email, password })
    if (!error && u) {
      await refreshSession()
    }
    return { error }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    const { user: u, error } = await authService.signUp({ email, password, name })
    if (!error && u) {
      await refreshSession()
    }
    return { error }
  }

  const signOut = async () => {
    await authService.signOut()
    setSession(null)
    setUser(null)
  }

  const signInWithGoogle = async () => {
    const { error } = await authService.signInWithGoogle()
    return { error }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function emitAuthSessionUpdated() {
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_UPDATED))
}
