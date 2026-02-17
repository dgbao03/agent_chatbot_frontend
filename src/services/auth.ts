// ========== SUPABASE COMMENTED - Migrating to FastAPI ==========
// import { supabase } from '../lib/supabase'
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

// ========== SUPABASE COMMENTED - Map Supabase errors to user-friendly messages ==========
// const mapAuthError = (error: AuthError | null): string => {
//   if (!error) return ''
//   switch (error.message) {
//     case 'Invalid login credentials': return 'Invalid email or password'
//     case 'Email already registered':
//     case 'User already registered': return 'Email already exists'
//     case 'Password should be at least 6 characters': return 'Password must be at least 6 characters'
//     case 'Signup is disabled': return 'Signup is currently disabled'
//     case 'Email not confirmed': return 'Please verify your email address'
//     default: return error.message || 'An error occurred. Please try again.'
//   }
// }

export const authService = {
  async signUp(_data: SignUpData): Promise<{ user: User | null; error: string }> {
    // ========== SUPABASE COMMENTED ==========
    // try {
    //   const { data: authData, error } = await supabase.auth.signUp({
    //     email: data.email,
    //     password: data.password,
    //     options: { data: { name: data.name || '' } }
    //   })
    //   if (error) return { user: null, error: mapAuthError(error) }
    //   return { user: authData.user, error: '' }
    // } catch (error) {
    //   return { user: null, error: 'Connection error. Please try again.' }
    // }
    return { user: null, error: '' }
  },

  async signIn(_data: SignInData): Promise<{ user: User | null; error: string }> {
    // ========== SUPABASE COMMENTED ==========
    // try {
    //   const { data: authData, error } = await supabase.auth.signInWithPassword({
    //     email: data.email,
    //     password: data.password
    //   })
    //   if (error) return { user: null, error: mapAuthError(error) }
    //   return { user: authData.user, error: '' }
    // } catch (error) {
    //   return { user: null, error: 'Connection error. Please try again.' }
    // }
    return { user: null, error: '' }
  },

  async signOut(): Promise<{ error: string }> {
    // ========== SUPABASE COMMENTED ==========
    // try {
    //   const { error } = await supabase.auth.signOut()
    //   if (error) return { error: mapAuthError(error) }
    //   return { error: '' }
    // } catch (error) {
    //   return { error: 'Failed to sign out. Please try again.' }
    // }
    return { error: '' }
  },

  async getSession(): Promise<Session | null> {
    // ========== SUPABASE COMMENTED ==========
    // try {
    //   const { data: { session } } = await supabase.auth.getSession()
    //   return session
    // } catch (error) {
    //   return null
    // }
    return null
  },

  async getUser(): Promise<User | null> {
    // ========== SUPABASE COMMENTED ==========
    // try {
    //   const { data: { user } } = await supabase.auth.getUser()
    //   return user
    // } catch (error) {
    //   return null
    // }
    return null
  },

  async checkEmailExists(_email: string): Promise<{ exists: boolean; error: string }> {
    // ========== SUPABASE COMMENTED ==========
    // try {
    //   const { data, error } = await supabase.rpc('check_email_exists', { user_email: email })
    //   if (error) return { exists: false, error: 'Failed to check email availability' }
    //   return { exists: data === true, error: '' }
    // } catch (error) {
    //   return { exists: false, error: 'Connection error. Please try again.' }
    // }
    return { exists: false, error: '' }
  },

  async checkUserAuthProviders(_email: string): Promise<{ providers: string[]; error: string }> {
    // ========== SUPABASE COMMENTED ==========
    // try {
    //   const { data, error } = await supabase.rpc('check_user_auth_providers', { user_email: email })
    //   if (error) return { providers: [], error: 'Failed to check authentication methods' }
    //   return { providers: (data as string[]) || [], error: '' }
    // } catch (error) {
    //   return { providers: [], error: 'Connection error. Please try again.' }
    // }
    return { providers: [], error: '' }
  },

  async signInWithGoogle(): Promise<{ error: string }> {
    // ========== SUPABASE COMMENTED ==========
    // try {
    //   const { error } = await supabase.auth.signInWithOAuth({
    //     provider: 'google',
    //     options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { prompt: 'select_account' } }
    //   })
    //   if (error) return { error: mapAuthError(error) }
    //   return { error: '' }
    // } catch (error) {
    //   return { error: 'Failed to sign in with Google. Please try again.' }
    // }
    return { error: '' }
  },

  async resetPasswordForEmail(_email: string): Promise<{ error: string }> {
    // ========== SUPABASE COMMENTED ==========
    // try {
    //   const { error } = await supabase.auth.resetPasswordForEmail(email, {
    //     redirectTo: `${window.location.origin}/reset-password`
    //   })
    //   if (error) return { error: mapAuthError(error) }
    //   return { error: '' }
    // } catch (error) {
    //   return { error: 'Failed to send password reset email. Please try again.' }
    // }
    return { error: '' }
  },

  async updatePassword(_newPassword: string): Promise<{ error: string }> {
    // ========== SUPABASE COMMENTED ==========
    // try {
    //   const { error } = await supabase.auth.updateUser({ password: newPassword })
    //   if (error) return { error: mapAuthError(error) }
    //   return { error: '' }
    // } catch (error) {
    //   return { error: 'Failed to update password. Please try again.' }
    // }
    return { error: '' }
  }
}

