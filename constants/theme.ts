import { Platform } from 'react-native'

// ─── Brand Colors ────────────────────────────────────────────────────────────
export const Colors = {
  // Brand
  primary: '#0F1F3D',       // Midnight Navy
  accent: '#1AA6F1',        // Pulse Cyan
  accentDark: '#0D8FD4',    // Cyan pressed state

  // Backgrounds
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF2F7',

  // Text
  textPrimary: '#0F1F3D',
  textSecondary: '#6B7A99',
  textInverse: '#FFFFFF',
  textMuted: '#A0AABF',

  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#1AA6F1',

  // Borders
  border: '#E2E8F0',
  divider: '#F0F4F8',

  // Themed aliases (used by existing ThemedText / ThemedView)
  light: {
    text: '#0F1F3D',
    background: '#F5F7FA',
    tint: '#1AA6F1',
    icon: '#6B7A99',
    tabIconDefault: '#A0AABF',
    tabIconSelected: '#1AA6F1',
  },
  dark: {
    text: '#E8EDF5',
    background: '#080E1C',
    tint: '#1AA6F1',
    icon: '#6B7A99',
    tabIconDefault: '#4A5568',
    tabIconSelected: '#1AA6F1',
  },
}

// ─── Spacing ─────────────────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

// ─── Border Radius ───────────────────────────────────────────────────────────
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
}

// ─── Shadows ─────────────────────────────────────────────────────────────────
export const Shadow = {
  card: {
    shadowColor: '#0F1F3D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#0F1F3D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
}

// ─── Typography ──────────────────────────────────────────────────────────────
export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  xxxl: 38,
}

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
}

export const Fonts = Platform.select({
  ios: {
    sans: 'Inter Tight',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Inter Tight',
    mono: 'monospace',
  },
  web: {
    sans: "'Inter Tight', system-ui, -apple-system, sans-serif",
    mono: "SFMono-Regular, Menlo, monospace",
  },
})
