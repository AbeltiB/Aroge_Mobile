import * as Linking from 'expo-linking'
import { tokenStorage } from './tokenStorage'
import { api } from './api'
import type { JwtUserPayload } from '@arogenpm/sdk'

type StartResponse = { token: string; deepLink: string; expiresIn: number }
type PollResponse =
  | { status: 'pending' }
  | { status: 'verified'; accessToken: string; user: JwtUserPayload }

const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 5 * 60 * 1000

// Bot deep-link login: the user confirms inside their already-logged-in
// Telegram app instead of Telegram's own web login screen (which falls back
// to asking for a phone number whenever there's no active Telegram Web
// session — this is what the old oauth.telegram.org flow hit in practice).
export async function loginWithTelegram(): Promise<{ user: JwtUserPayload } | null> {
  const startRes = await api.post<StartResponse>('/auth/telegram/bot/start', { intent: 'user' })
  if (!startRes.success) return null

  const { token, deepLink } = startRes.data
  await Linking.openURL(deepLink)

  const deadline = Date.now() + POLL_TIMEOUT_MS
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))

    const poll = await api.get<PollResponse>(`/auth/telegram/bot/poll/${token}`)
    if (!poll.success) return null
    if (poll.data.status === 'pending') continue

    await tokenStorage.setAccess(poll.data.accessToken)
    await tokenStorage.setUser(poll.data.user)
    return { user: poll.data.user }
  }

  return null
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout', {})
  await tokenStorage.clearAll()
}
