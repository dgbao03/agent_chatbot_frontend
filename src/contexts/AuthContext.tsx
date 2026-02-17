import { createContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
// ========== SUPABASE COMMENTED - Migrating to FastAPI ==========
// import { supabase } from '../lib/supabase'
import { authService } from '../services/auth'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: string }>
  signUp: (email: string, password: string, name?: string) => Promise<{ error: string }>
  signInWithGoogle: () => Promise<{ error: string }>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Check initial session and setup auth state listener
  useEffect(() => {
    // Get initial session
    authService.getSession().then((session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // ========== SUPABASE COMMENTED - Migrating to FastAPI ==========
    // Listen to auth state changes (Supabase onAuthStateChange)
    // const {
    //   data: { subscription },
    // } = supabase.auth.onAuthStateChange(async (event, session) => {
    //   setSession(session)
    //   setUser(session?.user ?? null)
    //   setLoading(false)
    //   if (event === 'SIGNED_OUT') { }
    // })
    // return () => { subscription.unsubscribe() }

    // Stub: không có subscription khi dùng stub
    return () => {}
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await authService.signIn({ email, password })
    // State will be updated automatically via onAuthStateChange
    return { error }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    const { error } = await authService.signUp({ email, password, name })
    // State will be updated automatically via onAuthStateChange
    return { error }
  }

  const signOut = async () => {
    await authService.signOut()
    // State will be updated automatically via onAuthStateChange
  }

  const signInWithGoogle = async () => {
    const { error } = await authService.signInWithGoogle()
    // State will be updated automatically via onAuthStateChange after redirect
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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

