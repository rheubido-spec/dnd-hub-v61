const API_BASE = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_BASE ?? '/api/v1'

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('dndhub_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function buildApiUrl(path: string): string {
  return `${API_BASE}${path}`
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...(options.headers as Record<string, string> | undefined),
  }

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Request failed')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export async function apiFetchBlob(path: string, options: RequestInit = {}): Promise<Blob> {
  const headers: HeadersInit = {
    ...authHeaders(),
    ...(options.headers as Record<string, string> | undefined),
  }

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Request failed')
  }

  return response.blob()
}
