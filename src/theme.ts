/** One file for the whole visual language. Swap for the gym's real brand later. */

export const colors = {
  bg: '#0E1116',
  surface: '#171C24',
  surfaceAlt: '#1F2631',
  border: '#2A3341',

  text: '#F2F5F9',
  textMuted: '#9BA6B6',
  textFaint: '#6B7688',

  accent: '#E8442F', // gym red - also the paper sheet's "what changed" ink
  accentSoft: '#3A1D1A',

  added: '#3FBF7F',
  addedSoft: '#12301F',
  increased: '#F2A93B',
  increasedSoft: '#33260E',
  swapped: '#5B9CF5',
  swappedSoft: '#152438',
  removed: '#8A93A3',

  premium: '#C9A227',
  premiumSoft: '#2E260C',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

export const type = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  h2: { fontSize: 20, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  small: { fontSize: 13, color: colors.textMuted },
  tiny: { fontSize: 11, color: colors.textFaint },
};
