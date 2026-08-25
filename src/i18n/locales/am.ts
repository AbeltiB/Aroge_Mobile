import type { TranslationKeys } from './en'

// Partial on purpose — any key missing here falls back to English (see i18n/index.tsx).
// Screens are being migrated to use translation keys incrementally; this file
// only needs to cover keys as they're wired up, not every string in the app yet.
export const am: DeepPartial<TranslationKeys> = {
  common: {
    save: 'አስቀምጥ',
    cancel: 'ሰርዝ',
    delete: 'አጥፋ',
    edit: 'አርትዕ',
    loading: 'በመጫን ላይ…',
    submit: 'አስገባ',
    back: 'ተመለስ',
    done: 'ተጠናቀቀ',
    retry: 'እንደገና ሞክር',
    ok: 'እሺ',
  },
  nav: {
    home: 'መነሻ',
    search: 'ፍለጋ',
    sell: 'ሽጥ',
    messages: 'መልእክቶች',
    profile: 'መገለጫ',
  },
  profile: {
    myOffers: 'የእኔ አቅርቦቶች',
    settings: 'ቅንብሮች',
    logout: 'ውጣ',
    language: 'ቋንቋ',
  },
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] }
