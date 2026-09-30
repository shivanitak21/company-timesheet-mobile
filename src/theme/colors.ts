export type Palette = {
  canvas: string
  card: string
  ink: string
  muted: string
  line: string
  accent: string
  accentSoft: string
  onAccent: string
  gold: string
  danger: string
  goodSoft: string
  pendingSoft: string
  badSoft: string
  info: string
  infoSoft: string
  holiday: string
  holidaySoft: string
  overlay: string
}

export const lightPalette: Palette = {
  canvas: '#f3f0ea',
  card: '#fffcf8',
  ink: '#171b22',
  muted: '#6d675f',
  line: '#e6e0d6',
  accent: '#0f6e66',
  accentSoft: '#e5f4f1',
  onAccent: '#ffffff',
  gold: '#a8742c',
  danger: '#b42318',
  goodSoft: '#e5f4f1',
  pendingSoft: '#f8f1e4',
  badSoft: '#fdeceb',
  info: '#1d4f91',
  infoSoft: '#e7f0fb',
  holiday: '#6d28d9',
  holidaySoft: '#f3e8ff',
  overlay: 'rgba(23, 27, 34, 0.42)',
}

export const darkPalette: Palette = {
  canvas: '#0e1116',
  card: '#171c24',
  ink: '#f6f3ee',
  muted: '#b0a89e',
  line: '#2c333e',
  accent: '#5dcec2',
  accentSoft: '#16332f',
  onAccent: '#10211f',
  gold: '#e2b15a',
  danger: '#ff8d84',
  goodSoft: '#16332f',
  pendingSoft: '#2c2618',
  badSoft: '#3a2220',
  info: '#9ec1f5',
  infoSoft: '#1a2738',
  holiday: '#d4b4ff',
  holidaySoft: '#2a2140',
  overlay: 'rgba(0, 0, 0, 0.55)',
}

export const fonts = {
  body: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  display: 'Fraunces_600SemiBold',
}
