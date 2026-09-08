import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { JwtUserPayload } from '@arogenpm/sdk';
import { tokenStorage, type SellerProfile } from '../lib/tokenStorage';
import { logout as authLogout } from '../lib/auth';
import { api } from '../lib/api';
import { registerForPushNotifications } from '../lib/pushNotifications';

interface AppContextValue {
  isAuthenticated: boolean;
  user: JwtUserPayload | null;
  hasSeenOnboarding: boolean;
  sellerMode: boolean;
  sellerProfile: SellerProfile | null;
  unreadCount: number;
  refreshUnread: () => Promise<void>;
  setSellerMode: (on: boolean) => Promise<void>;
  setSellerProfile: (profile: SellerProfile) => Promise<void>;
  login: (user: JwtUserPayload) => void;
  logout: () => Promise<void>;
  completeOnboarding: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<JwtUserPayload | null>(null);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [sellerMode, setSellerModeState] = useState(false);
  const [sellerProfile, setSellerProfileState] = useState<SellerProfile | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    Promise.all([
      tokenStorage.getUser(),
      tokenStorage.getSellerMode(),
      tokenStorage.getSellerProfile(),
    ]).then(([storedUser, storedSellerMode, storedSellerProfile]) => {
      if (storedUser) setUser(storedUser);
      setSellerModeState(storedSellerMode);
      if (storedSellerProfile) setSellerProfileState(storedSellerProfile);
      setBootstrapped(true);
    });
  }, []);

  const refreshUnread = useCallback(async () => {
    try {
      const res = await api.get<{ count: number }>('/notifications/unread-count');
      if (res.success) setUnreadCount(res.data.count);
    } catch {
      // silently ignore — unread badge is best-effort
    }
  }, []);

  // Poll unread count every 30s when authenticated
  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    refreshUnread();
    const id = setInterval(refreshUnread, 30_000);
    return () => clearInterval(id);
  }, [user, refreshUnread]);

  // Register the device's push token once per session, whenever a user
  // becomes authenticated (fresh login or resuming a stored session).
  useEffect(() => {
    if (!user) return;
    registerForPushNotifications().catch(() => {
      // best-effort — a failed registration shouldn't block app usage
    });
  }, [user]);

  const setSellerMode = useCallback(async (on: boolean) => {
    await tokenStorage.setSellerMode(on);
    setSellerModeState(on);
  }, []);

  const setSellerProfile = useCallback(async (profile: SellerProfile) => {
    await tokenStorage.setSellerProfile(profile);
    setSellerProfileState(profile);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: !!user,
      user,
      hasSeenOnboarding,
      sellerMode,
      sellerProfile,
      unreadCount,
      refreshUnread,
      setSellerMode,
      setSellerProfile,
      login: (u: JwtUserPayload) => setUser(u),
      logout: async () => {
        await authLogout();
        setUser(null);
        setSellerModeState(false);
        setSellerProfileState(null);
        setUnreadCount(0);
      },
      completeOnboarding: () => setHasSeenOnboarding(true),
    }),
    [user, hasSeenOnboarding, sellerMode, sellerProfile, unreadCount, refreshUnread, setSellerMode, setSellerProfile],
  );

  if (!bootstrapped) return null;

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
