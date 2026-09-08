import Constants from 'expo-constants'
import type { ApiResponse } from '@arogenpm/sdk'
import { tokenStorage } from './tokenStorage'

const BASE_URL: string =
  Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:4000/api/v1'

async function refreshTokens(): Promise<string | null> {
  const refresh = await tokenStorage.getRefresh()
  if (!refresh) return null

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `aroge_refresh=${refresh}`,
    },
  })
  if (!res.ok) return null

  const data = await res.json()
  if (data.success && data.data?.accessToken) {
    await tokenStorage.setAccess(data.data.accessToken)
    return data.data.accessToken
  }
  return null
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<ApiResponse<T>> {
  let token = await tokenStorage.getAccess()

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (res.status === 401 && retry) {
    token = await refreshTokens()
    if (token) {
      return apiRequest<T>(path, options, false)
    }
    await tokenStorage.clearAll()
    return { success: false, message: 'Session expired' }
  }

  return res.json() as Promise<ApiResponse<T>>
}

/**
 * Uploads a local file (camera roll URI) as multipart/form-data. Deliberately
 * bypasses apiRequest's default JSON content-type — fetch must set its own
 * multipart boundary, which it can only do if Content-Type is left unset.
 */
export async function uploadFile<T>(
  path: string,
  fileUri: string,
  fieldName: string
): Promise<ApiResponse<T>> {
  const token = await tokenStorage.getAccess()
  const filename = fileUri.split('/').pop() ?? 'upload.jpg'
  const ext = (/\.(\w+)$/.exec(filename)?.[1] ?? 'jpg').toLowerCase()

  const formData = new FormData()
  formData.append(fieldName, {
    uri: fileUri,
    name: filename,
    type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
  } as any)

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  })
  return res.json() as Promise<ApiResponse<T>>
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
  uploadFile,
}
