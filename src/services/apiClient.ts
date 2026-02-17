/**
 * API client for authenticated FastAPI requests
 */
import { API_BASE_URL } from '../constants'
import { authService } from './auth'

function getErrorMsg(status: number, detail: string | { detail?: string } | unknown): string {
  if (typeof detail === 'string') return detail
  if (detail && typeof detail === 'object' && 'detail' in detail) {
    const d = (detail as { detail?: string }).detail
    return typeof d === 'string' ? d : 'Có lỗi xảy ra'
  }
  switch (status) {
    case 401:
      return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
    case 404:
      return 'Không tìm thấy'
    case 500:
      return 'Lỗi máy chủ. Vui lòng thử lại sau.'
    default:
      return 'Có lỗi xảy ra'
  }
}

export interface FetchWithAuthOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>
}

/**
 * Fetch with Bearer token. Returns { data, error }.
 * On 401/404/500, returns error string. On success, returns parsed JSON as data.
 */
export async function fetchWithAuth<T>(
  path: string,
  options: FetchWithAuthOptions = {}
): Promise<{ data: T | null; error: string }> {
  const session = await authService.getSession()
  if (!session?.access_token) {
    return { data: null, error: 'Chưa đăng nhập. Vui lòng đăng nhập lại.' }
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

    // 204 No Content - success with no body
    if (res.status === 204) {
      return { data: null, error: '' }
    }

    return { data: (body as T) ?? null, error: '' }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Lỗi kết nối'
    return { data: null, error: msg }
  }
}
