/**
 * Aroge Color System
 * Derived from Marché Color Directive v1.0
 *
 * Four-color narrative:
 * Trust (Green) → Comfort (Cream) → Worth (Gold) → Action (Terracotta)
 */

export const Colors = {
  // ─── Primary Palette ───────────────────────────────────────────────────────
  green: {
    /** Structural chrome: header, nav bar, hero banners, section headings */
    primary: '#1f7a5a',
    /** Deep green for dark text on cream surfaces (AAA 11.2:1) */
    dark: '#1a3028',
    /** Subtle tint for success states */
    tint: 'rgba(31, 122, 90, 0.08)',
    /** Pressed / darkened green */
    pressed: '#196647',
  },
  cream: {
    /** App background — warm white (never pure white) */
    background: '#f3efe7',
    /** Card interior surfaces — gentle separation from cream */
    surface: '#ffffff',
    /** Input / subtle surface */
    subtle: '#f8f5ef',
  },
  gold: {
    /** Prices, cart badges, earnings, featured labels */
    primary: '#c89b3c',
    /** Dark text on gold surfaces (AA 4.81:1) */
    dark: '#3d2a10',
    /** Muted gold for secondary value indicators */
    muted: '#d4b06a',
  },
  terracotta: {
    /** Primary buyer CTAs, seller flow, Sell pill */
    primary: '#B85C2A',
    /** Pressed / darkened terracotta */
    pressed: '#994c23',
    /** Flash deal / urgency background strip */
    tint: 'rgba(184, 92, 42, 0.10)',
  },

  // ─── Semantic Text ──────────────────────────────────────────────────────────
  text: {
    /** Primary body text on cream (11.2:1 AAA) */
    primary: '#1a3028',
    /** Secondary / descriptive text */
    secondary: '#4a5a52',
    /** Muted / placeholder text */
    muted: '#8a9990',
    /** Text on green surfaces — cream only (5.91:1 AA) */
    onGreen: '#f3efe7',
    /** Text on terracotta surfaces — white only (4.56:1 AA) */
    onTerracotta: '#ffffff',
    /** Text on gold surfaces */
    onGold: '#3d2a10',
  },

  // ─── UI Chrome ──────────────────────────────────────────────────────────────
  border: {
    default: '#e8e4dc',
    focus: '#1f7a5a',
    subtle: '#f0ece4',
  },

  // ─── Status ─────────────────────────────────────────────────────────────────
  /** Error states only — never for sale/discount (reserved for system error) */
  error: '#c0392b',
  success: '#1f7a5a',

  // ─── Third-party Brand ──────────────────────────────────────────────────────
  telegram: '#2AABEE',
  telegramDark: '#1e96d6',
} as const;

export type ColorKeys = typeof Colors;