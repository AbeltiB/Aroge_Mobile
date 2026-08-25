import { Platform } from 'react-native';

/**
 * Aroge Typography System
 *
 * Serif (Georgia) — brand wordmark, editorial headings, prices
 * Sans (system)   — UI, body, labels
 */
export const FontFamily = {
  /** Georgia serif for brand-level headings and price display */
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia',
  }) as string,
  /** System sans-serif for all UI copy */
  sans: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }) as string,
  /** Condensed for compact labels */
  sansCondensed: Platform.select({
    ios: 'System',
    android: 'sans-serif-condensed',
    default: 'System',
  }) as string,
  /** Mono for hex codes, prices inline */
  mono: Platform.select({
    ios: 'Courier New',
    android: 'monospace',
    default: 'Courier New',
  }) as string,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 36,
  '4xl': 48,
  /** Splash display */
  display: 72,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const LineHeight = {
  tight: 1.1,
  snug: 1.3,
  normal: 1.55,
  relaxed: 1.75,
  loose: 2.0,
} as const;

export const LetterSpacing = {
  tighter: -0.5,
  tight: -0.2,
  normal: 0,
  wide: 0.5,
  wider: 1.2,
  widest: 2.0,
  eyebrow: 3.0,
} as const;