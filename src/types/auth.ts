/** Auth user - tương thích UserMenu, thay thế Supabase User */
export interface AuthUser {
  id: string
  email: string
  name?: string | null
  avatar_url?: string | null
  user_metadata?: { name?: string }
  /** List of auth providers (email, google) */
  providers?: string[]
}

/** Auth session - access_token, refresh_token, user */
export interface AuthSession {
  access_token: string
  refresh_token: string
  user: AuthUser
}
