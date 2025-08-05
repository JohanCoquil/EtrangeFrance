export const COLORS = {
  // Couleurs principales
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    900: '#1e3a8a',
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    900: '#0f172a',
  },
  success: {
    500: '#10b981',
    600: '#059669',
    700: '#047857',
  },
  danger: {
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  warning: {
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  // Couleurs neutres
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
} as const;

export const TYPOGRAPHY = {
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const BORDERS = {
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
  },
  width: {
    thin: 1,
    thick: 2,
  },
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
} as const;

// Styles communs pour l'application
export const COMMON_STYLES = {
  container: 'flex-1 px-4 py-6',
  containerCentered: 'flex-1 px-4 py-6 justify-center items-center',
  card: 'bg-white rounded-xl p-4 shadow-sm',
  cardDark: 'bg-gray-800 rounded-xl p-4 shadow-sm',
  input: 'bg-white border border-gray-300 rounded-lg px-4 py-3 text-base',
  inputFocused: 'border-blue-500',
  inputError: 'border-red-500',
  text: {
    title: 'text-2xl font-bold text-gray-900',
    subtitle: 'text-lg font-semibold text-gray-700',
    body: 'text-base text-gray-600',
    caption: 'text-sm text-gray-500',
    error: 'text-sm text-red-600',
    success: 'text-sm text-green-600',
  },
} as const; 