import Constants from 'expo-constants'
import { emitAuthExpired } from '@/lib/auth-events'
import { session } from '@/lib/session'
import type { PageMeta } from '@/types/api'

function devMachineHost(): string | null {
  const candidates = [Constants.expoConfig?.hostUri, Constants.linkingUri]
  for (const value of candidates) {
    if (!value) continue
    const withoutScheme = value.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, '')
    const host = withoutScheme.split('/')[0]?.split(':')[0]
    if (host && host !== 'localhost' && host !== '127.0.0.1') return host
  }
  return null
}

function resolveApiBaseUrl(raw: string) {
  const trimmed = raw.replace(/\/$/, '')
  if (!trimmed) return ''
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return trimmed
  }
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  if (!local) return trimmed
  const host = devMachineHost()
  if (!host) return trimmed
  url.hostname = host
  return url.toString().replace(/\/$/, '')
}

export const apiBaseUrl = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL ?? '')

export class ApiError extends Error {
  status: number
  code: string
  details: unknown

  constructor(status: number, code: string, message: string, details: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

type Envelope<T> = {
  success: boolean
  data: T
  meta?: PageMeta
  error?: { code: string; message: string; details: unknown }
}

export type ApiResult<T> = { data: T; meta?: PageMeta }

type Query = Record<string, string | number | boolean | undefined>

let refreshPromise: Promise<string | null> | null = null

function withQuery(url: string, params?: Query) {
  if (!params) return url
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue
    search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `${url}?${qs}` : url
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = session.refresh
  if (!refreshToken || !apiBaseUrl) return null
  try {
    const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Client-Platform': 'mobile',
      },
      body: JSON.stringify({ refreshToken }),
    })
    if (!response.ok) throw new Error('refresh failed')
    const json = (await response.json()) as Envelope<{ accessToken: string; refreshToken: string }>
    await session.setTokens(json.data.accessToken, json.data.refreshToken)
    return json.data.accessToken
  } catch {
    await session.clear()
    emitAuthExpired()
    return null
  }
}

function queuedRefresh() {
  refreshPromise ??= refreshAccessToken().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

async function parseBody(response: Response): Promise<Envelope<unknown> | null> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as Envelope<unknown>
  } catch {
    return null
  }
}

async function send(path: string, init: RequestInit, token: string | null, allowRefresh: boolean): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  headers.set('X-Client-Platform', 'mobile')
  if (init.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(0, 'NETWORK', `The API could not be reached at ${apiBaseUrl}. Phone and computer need to be on the same Wi-Fi.`)
  }

  const isAuthCall = path.includes('/auth/login') || path.includes('/auth/refresh') || path.includes('/auth/logout')
  if (response.status === 401 && allowRefresh && !isAuthCall) {
    const next = await queuedRefresh()
    if (next) return send(path, init, next, false)
  }
  return response
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  if (!apiBaseUrl) throw new ApiError(0, 'API_URL_MISSING', 'Set EXPO_PUBLIC_API_BASE_URL before using the app.')
  const response = await send(path, init, session.access, true)
  const payload = await parseBody(response)
  if (!response.ok || !payload?.success) {
    const error = payload?.error
    if (error) throw new ApiError(response.status, error.code, error.message, error.details)
    if (!response.ok) throw new ApiError(response.status, 'REQUEST_FAILED', 'Request failed')
    throw new ApiError(response.status, 'REQUEST_FAILED', 'The API returned an unexpected response.')
  }
  return { data: payload.data as T, meta: payload.meta }
}

export const api = {
  get<T>(url: string, params?: Query) {
    return request<T>(withQuery(url, params), { method: 'GET' })
  },
  post<T>(url: string, data?: unknown) {
    return request<T>(url, { method: 'POST', body: JSON.stringify(data ?? {}) })
  },
  patch<T>(url: string, data?: unknown) {
    return request<T>(url, { method: 'PATCH', body: JSON.stringify(data ?? {}) })
  },
  delete<T>(url: string) {
    return request<T>(url, { method: 'DELETE' })
  },
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (Array.isArray(error.details) && error.details.length > 0) {
      const first = error.details[0] as { message?: string }
      if (first?.message) return first.message
    }
    return error.message
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}
