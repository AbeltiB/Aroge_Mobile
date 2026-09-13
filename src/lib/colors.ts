import { colors as sdkColors } from '@arogenpm/sdk';

/**
 * Canonical color source for the whole app. Starts from the SDK's brand
 * palette (the values every existing screen already reads via `colors.*`)
 * and adds the extra semantic tokens the shared UI kit needs — pressed
 * states, status colors, third-party brand colors — so there's one place
 * to look up any color instead of the two competing systems that existed
 * before (SDK `colors` vs. `src/constants/colors.ts`).
 */
export const colors = {
  ...sdkColors,

  // Pressed/active variants (buttons, list rows)
  brandPressed: '#196647',
  actionPressed: '#994c23',

  // Status
  error: '#c0392b',
  warning: '#c89b3c',
  success: sdkColors.brand,

  // Third-party brand (Telegram sign-in)
  telegram: '#2AABEE',
  telegramDark: '#1e96d6',

  // Neutral scale for chrome that isn't brand-tinted (dividers, disabled states)
  black: '#000000',
  white: '#ffffff',
} as const;

export type ColorKey = keyof typeof colors;
