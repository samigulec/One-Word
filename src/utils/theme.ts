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
  bgPrimary: '#0F0A2E',
  bgSecondary: '#1A1145',
  bgTertiary: '#1E1650',
  bgCard: 'rgba(255,255,255,0.06)',
  bgCardHover: 'rgba(255,255,255,0.1)',

  // Metin
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textTertiary: 'rgba(255,255,255,0.45)',
  textDisabled: 'rgba(255,255,255,0.2)',

  // Vurgu
  primary: '#6366F1',
  primaryLight: '#818CF8',
  secondary: '#8B5CF6',
  secondaryLight: '#A78BFA',

  // Geri bildirim
  success: '#10B981',
  successSoft: '#66BB6A',
  error: '#EF4444',
  errorSoft: '#EF5350',
  warning: '#F59E0B',

  // Oyunlastirma
  xp: '#FFB74D',
  streak: '#FF6B6B',
  level: '#A78BFA',

  // Kenarliklar
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.12)',
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
