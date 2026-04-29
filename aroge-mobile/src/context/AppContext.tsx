import React, { createContext, useContext, useMemo, useState } from 'react';

interface AppContextValue {
  isAuthenticated: boolean;
  hasSeenOnboarding: boolean;
  sellerMode: boolean;
  setAuthenticated: (value: boolean) => void;
  completeOnboarding: () => void;
  setSellerMode: (value: boolean) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [sellerMode, setSellerMode] = useState(false);

  const value = useMemo(
    () => ({
      isAuthenticated,
      hasSeenOnboarding,
      sellerMode,
      setAuthenticated,
      completeOnboarding: () => setHasSeenOnboarding(true),
      setSellerMode,
      logout: () => {
        setAuthenticated(false);
        setSellerMode(false);
      },
    }),
    [hasSeenOnboarding, isAuthenticated, sellerMode],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
