import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { en } from './locales/en';
import { am } from './locales/am';

export type Locale = 'en' | 'am';

const LOCALE_KEY = 'aroge_locale';
const LOCALES = { en, am } as const;

type Path<T, Prefix extends string = ''> = T extends object
  ? { [K in keyof T & string]: Path<T[K], `${Prefix}${K}.`> }[keyof T & string]
  : Prefix extends `${infer P}.` ? P : never;

export type TranslationKey = Path<typeof en>;

function resolve(dict: object, key: string): string | undefined {
  const value = key.split('.').reduce<any>((acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined), dict);
  return typeof value === 'string' ? value : undefined;
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    SecureStore.getItemAsync(LOCALE_KEY).then((stored) => {
      if (stored === 'am' || stored === 'en') setLocaleState(stored);
    });
  }, []);

  const setLocale = useCallback(async (next: Locale) => {
    await SecureStore.setItemAsync(LOCALE_KEY, next);
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      // Amharic dictionary is filled in incrementally — any key not yet
      // translated there falls back to English rather than showing raw keys.
      return resolve(LOCALES[locale], key) ?? resolve(en, key) ?? key;
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
}
