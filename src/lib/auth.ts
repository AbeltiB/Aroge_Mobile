import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import Constants from 'expo-constants'
import { tokenStorage } from './tokenStorage'
import { api } from './api'
import type { JwtUserPayload } from 'aroge-sdk'

WebBrowser.maybeCompleteAuthSession()

// The Telegram Login Widget requires the bot's numeric ID (from @BotFather),
// not its @username — passing the username here silently fails auth.
const BOT_ID: string = Constants.expoConfig?.extra?.telegramBotId ?? ''
const LOGIN_ORIGIN: string =
  Constants.expoConfig?.extra?.telegramLoginOrigin ?? 'https://aroge.app'

export async function loginWithTelegram(): Promise<{ user: JwtUserPayload } | null> {
  const callbackUrl = Linking.createURL('auth/callback')

  const telegramAuthUrl =
    `https://oauth.telegram.org/auth?` +
    `bot_id=${encodeURIComponent(BOT_ID)}&` +
    `origin=${encodeURIComponent(LOGIN_ORIGIN)}&` +
    `return_to=${encodeURIComponent(callbackUrl)}`

  const result = await WebBrowser.openAuthSessionAsync(telegramAuthUrl, callbackUrl)
  if (result.type !== 'success' || !result.url) return null
  return handleAuthCallback(result.url)
}

export async function handleAuthCallback(url: string): Promise<{ user: JwtUserPayload } | null> {
  const parsed = Linking.parse(url)
  const params = parsed.queryParams as Record<string, string> | undefined
  if (!params?.hash) return null

  const telegramData = {
    id: Number(params.id),
    first_name: params.first_name ?? '',
    last_name: params.last_name,
    username: params.username,
    photo_url: params.photo_url,
    auth_date: Number(params.auth_date),
    hash: params.hash,
  }

  const res = await api.post<{ accessToken: string; user: JwtUserPayload }>(
    '/auth/telegram',
    telegramData
  )

  if (!res.success) return null

  await tokenStorage.setAccess(res.data.accessToken)
  await tokenStorage.setUser(res.data.user)
  return { user: res.data.user }
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout', {})
  await tokenStorage.clearAll()
}
