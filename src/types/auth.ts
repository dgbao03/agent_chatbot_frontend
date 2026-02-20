/** Auth user - used by UserMenu, AuthContext */
export interface AuthUser {
  id: string
  email: string
  name?: string | null
  avatar_url?: string | null
  user_metadata?: { name?: string }
  /** List of auth providers (email, google) */
  providers?: string[]
}

/** Auth session - access_token, user (refresh_token in httpOnly cookie) */
export interface AuthSession {
  access_token: string
  user: AuthUser
}
