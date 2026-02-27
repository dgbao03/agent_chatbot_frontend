import { API_BASE_URL } from '../constants'
import { authService } from './auth'

function getErrorMsg(status: number, detail: string | { detail?: string } | unknown): string {
  if (typeof detail === 'string') return detail
  if (detail && typeof detail === 'object' && 'detail' in detail) {
    const d = (detail as { detail?: string }).detail
    return typeof d === 'string' ? d : 'An error occurred'
  }
  switch (status) {
    case 401:
      return 'Session expired. Please sign in again.'
    case 404:
      return 'Not found'
    case 500:
      return 'Server error. Please try again later.'
    default:
      return 'An error occurred'
  }
}

export interface FetchWithAuthOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>
}

export async function fetchWithAuth<T>(
  path: string,
  options: FetchWithAuthOptions = {}
): Promise<{ data: T | null; error: string }> {
  const session = await authService.getSession()
  if (!session?.access_token) {
    return { data: null, error: 'Not signed in. Please sign in again.' }
  }

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
    ...options.headers,
  }

  try {
    const res = await fetch(url, { ...options, headers })
    const text = await res.text()
    let body: unknown = null
    try {
      body = text?.trim() ? JSON.parse(text) : null
    } catch {
      body = { detail: text || res.statusText }
    }

    if (!res.ok) {
      return {
        data: null,
        error: getErrorMsg(res.status, (body as { detail?: string })?.detail ?? res.statusText),
      }
    }

    if (res.status === 204) {
      return { data: null, error: '' }
    }

    return { data: (body as T) ?? null, error: '' }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Connection error'
    return { data: null, error: msg }
  }
}
