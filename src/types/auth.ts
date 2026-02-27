export interface AuthUser {
  id: string
  email: string
  name?: string | null
  avatar_url?: string | null
  user_metadata?: { name?: string }
  providers?: string[]
}

export interface AuthSession {
  access_token: string
  user: AuthUser
}
