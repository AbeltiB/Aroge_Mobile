import * as SecureStore from 'expo-secure-store'

const ACCESS_KEY = 'aroge_access_token'
const REFRESH_KEY = 'aroge_refresh_token'
const USER_KEY = 'aroge_user'
const SELLER_MODE_KEY = 'aroge_seller_mode'
const SELLER_PROFILE_KEY = 'aroge_seller_profile'

export interface SellerProfile {
  businessId?: string
  businessName: string
  businessType: string
  city: string
  contactName: string
  phone?: string
  tin?: string
  registeredAt: string
}

export const tokenStorage = {
  getAccess: () => SecureStore.getItemAsync(ACCESS_KEY),
  setAccess: (token: string) => SecureStore.setItemAsync(ACCESS_KEY, token),
  getRefresh: () => SecureStore.getItemAsync(REFRESH_KEY),
  setRefresh: (token: string) => SecureStore.setItemAsync(REFRESH_KEY, token),
  getUser: async () => {
    const raw = await SecureStore.getItemAsync(USER_KEY)
    return raw ? JSON.parse(raw) : null
  },
  setUser: (user: object) => SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
  getSellerMode: async (): Promise<boolean> => {
    const raw = await SecureStore.getItemAsync(SELLER_MODE_KEY)
    return raw === 'true'
  },
  setSellerMode: (on: boolean) => SecureStore.setItemAsync(SELLER_MODE_KEY, on ? 'true' : 'false'),
  getSellerProfile: async (): Promise<SellerProfile | null> => {
    const raw = await SecureStore.getItemAsync(SELLER_PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  },
  setSellerProfile: (profile: SellerProfile) =>
    SecureStore.setItemAsync(SELLER_PROFILE_KEY, JSON.stringify(profile)),
  clearAll: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
      SecureStore.deleteItemAsync(SELLER_MODE_KEY),
      SecureStore.deleteItemAsync(SELLER_PROFILE_KEY),
    ])
  },
}
