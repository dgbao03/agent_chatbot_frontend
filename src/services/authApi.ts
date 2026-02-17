import { API_BASE_URL } from '../constants'
import type { AuthUser } from '../types/auth'

const AUTH_PREFIX = `${API_BASE_URL}/auth`

function mapError(status: number, detail: string | { detail?: string }): string {
  const msg = typeof detail === 'string' ? detail : detail?.detail || 'Có lỗi xảy ra'
  switch (status) {
    case 400:
      if (msg.toLowerCase().includes('email') && msg.toLowerCase().includes('registered')) return 'Email đã được đăng ký'
      return msg
    case 401:
      if (msg.toLowerCase().includes('invalid') && msg.toLowerCase().includes('password')) return 'Email hoặc mật khẩu không đúng'
      if (msg.toLowerCase().includes('token')) return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
      return msg
    case 500:
      return 'Lỗi máy chủ. Vui lòng thử lại sau.'
    default:
      return msg || 'Có lỗi xảy ra'
  }
}

async function handleResponse<T>(res: Response): Promise<{ data: T; error: string }> {
  const text = await res.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = { detail: text || res.statusText }
  }
  const detail = (body as { detail?: string })?.detail
  if (!res.ok) {
    return { data: null as unknown as T, error: mapError(res.status, detail || res.statusText) }
  }
  return { data: (body as T) ?? (null as unknown as T), error: '' }
}

function toAuthUser(data: {
  user_id: string
  email: string
  name?: string | null
  avatar_url?: string | null
  provider?: string
}): AuthUser {
  return {
    id: data.user_id,
    email: data.email,
    name: data.name ?? null,
    avatar_url: data.avatar_url ?? null,
    user_metadata: data.name ? { name: data.name } : undefined,
  }
}

export const authApi = {
  async register(email: string, password: string, name?: string) {
    const res = await fetch(`${AUTH_PREFIX}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: name || null }),
    })
    const { data, error } = await handleResponse<{ access_token: string; refresh_token: string; user_id: string; email: string }>(res)
    if (error) return { data: null, error }
    return { data, error: '' }
  },

  async login(email: string, password: string) {
    const res = await fetch(`${AUTH_PREFIX}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const { data, error } = await handleResponse<{ access_token: string; refresh_token: string; user_id: string; email: string }>(res)
    if (error) return { data: null, error }
    return { data, error: '' }
  },

  async refreshToken(refresh_token: string) {
    const res = await fetch(`${AUTH_PREFIX}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    })
    const { data, error } = await handleResponse<{ access_token: string; refresh_token: string; user_id: string; email: string }>(res)
    if (error) return { data: null, error }
    return { data, error: '' }
  },

  async getMe(access_token: string) {
    const res = await fetch(`${AUTH_PREFIX}/me`, {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    const { data, error } = await handleResponse<{
      user_id: string
      email: string
      name?: string | null
      avatar_url?: string | null
      provider?: string
    }>(res)
    if (error) return { user: null, error }
    return { user: data ? toAuthUser(data) : null, error: '' }
  },

  async checkProviders(email: string) {
    const res = await fetch(`${AUTH_PREFIX}/check-providers?email=${encodeURIComponent(email)}`)
    const { data, error } = await handleResponse<{ providers: string[] }>(res)
    if (error) return { providers: [] as string[], error }
    return { providers: data?.providers ?? [], error: '' }
  },

  async signOut(access_token: string, refresh_token: string) {
    const res = await fetch(`${AUTH_PREFIX}/signout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ refresh_token }),
    })
    const { error } = await handleResponse<{ message?: string }>(res)
    return { error }
  },

  async getGoogleAuthUrl() {
    const res = await fetch(`${AUTH_PREFIX}/google`)
    const { data, error } = await handleResponse<{ authorization_url: string; state: string }>(res)
    if (error) return { url: null, error }
    return { url: data?.authorization_url ?? null, error: '' }
  },
}
