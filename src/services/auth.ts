import { supabase } from '../lib/supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'

export interface SignUpData {
  email: string
  password: string
  name?: string
}

export interface SignInData {
  email: string
  password: string
}

export interface AuthResponse {
  user: User | null
  session: Session | null
  error: AuthError | null
}

// Map Supabase errors to user-friendly messages
const mapAuthError = (error: AuthError | null): string => {
  if (!error) return ''
  
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Invalid email or password'
    case 'Email already registered':
    case 'User already registered':
      return 'Email already exists'
    case 'Password should be at least 6 characters':
      return 'Password must be at least 6 characters'
    case 'Signup is disabled':
      return 'Signup is currently disabled'
    case 'Email not confirmed':
      return 'Please verify your email address'
    default:
      return error.message || 'An error occurred. Please try again.'
  }
}

export const authService = {
  async signUp(data: SignUpData): Promise<{ user: User | null; error: string }> {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name || ''
          }
        }
      })

      if (error) {
        return { user: null, error: mapAuthError(error) }
      }

      return { user: authData.user, error: '' }
    } catch (error) {
      return { 
        user: null, 
        error: 'Connection error. Please try again.' 
      }
    }
  },

  async signIn(data: SignInData): Promise<{ user: User | null; error: string }> {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (error) {
        return { user: null, error: mapAuthError(error) }
      }

      return { user: authData.user, error: '' }
    } catch (error) {
      return { 
        user: null, 
        error: 'Connection error. Please try again.' 
      }
    }
  },

  async signOut(): Promise<{ error: string }> {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        return { error: mapAuthError(error) }
      }

      return { error: '' }
    } catch (error) {
      return { error: 'Failed to sign out. Please try again.' }
    }
  },

  async getSession(): Promise<Session | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return session
    } catch (error) {
      return null
    }
  },

  async getUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    } catch (error) {
      return null
    }
  },

  async checkEmailExists(email: string): Promise<{ exists: boolean; error: string }> {
    try {
      const { data, error } = await supabase.rpc('check_email_exists', {
        user_email: email
      })

      if (error) {
        console.error('Error checking email:', error)
        return { exists: false, error: 'Failed to check email availability' }
      }

      return { exists: data === true, error: '' }
    } catch (error) {
      console.error('Error checking email:', error)
      return { exists: false, error: 'Connection error. Please try again.' }
    }
  },

  async signInWithGoogle(): Promise<{ error: string }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account'
          }
        }
      })

      if (error) {
        return { error: mapAuthError(error) }
      }

      return { error: '' }
    } catch (error) {
      return { error: 'Failed to sign in with Google. Please try again.' }
    }
  }
}

