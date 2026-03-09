// Uygulama genelinde tutarli tipografi, renk ve boyut sabitleri

// Tipografi olcegi
export const FONTS = {
  // Boyutlar
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,

  // Agirliklar (React Native icin string)
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,

  // Satir yuksekligi carpanlari
  lineHeightTight: 1.2,
  lineHeightNormal: 1.4,
  lineHeightRelaxed: 1.6,
};

// Renk tokenlari
export const COLORS = {
  // Arka planlar
  bgPrimary: '#0A0E27',
  bgSecondary: '#141B3D',
  bgTertiary: '#1B1040',
  bgCard: 'rgba(139,92,246,0.08)',
  bgCardHover: 'rgba(139,92,246,0.14)',

  // Metin
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.75)',
  textTertiary: 'rgba(167,139,250,0.6)',
  textDisabled: 'rgba(255,255,255,0.2)',

  // Vurgu
  primary: '#7C3AED',
  primaryLight: '#8B5CF6',
  secondary: '#A78BFA',
  secondaryLight: '#C4B5FD',

  // Geri bildirim
  success: '#34D399',
  successSoft: '#6EE7B7',
  error: '#F87171',
  errorSoft: '#FCA5A5',
  warning: '#FBBF24',

  // Oyunlastirma
  xp: '#FBBF24',
  streak: '#F87171',
  level: '#C4B5FD',

  // Kenarliklar
  border: 'rgba(139,92,246,0.12)',
  borderLight: 'rgba(139,92,246,0.2)',
};

// Bosluk olcegi
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Kenar yuvarlakligi
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 9999,
};
