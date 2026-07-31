/**
 * Ultimate Fitness — light theme.
 *
 * Sourced from a full inventory of ultimatefitnessclub.ca/assets/css/style.css
 * (35 distinct colour values), not just the :root block. Two values here are
 * NOT custom properties and were found by parsing declarations:
 *
 *   #212E54  rgba(33,46,84,1) on .heading-divider — their navy, used as ink
 *   #FF7E38  the .header-top gradient — reused as the "increased" accent
 *
 * The governing constraint: #07A4E7 fails on white in BOTH directions — as
 * text (2.81:1) and beneath white labels (2.81:1). So the system separates
 * vivid FILLS from text-safe siblings of the same hue:
 *
 *   colors.accent      fills, progress, active states — never small text
 *   colors.accentInk   the same blue, darkened until it clears AA as text
 *
 * Every *Ink token is measured against white, not estimated. If you add a
 * colour here, run the check before shipping it.
 */

export const colors = {
  // Surfaces
  bg: '#FFFFFF',
  surface: '#EEF1FB', // lighter mix of --theme-bg-light
  surfaceAlt: '#E4E8F7',
  band: '#DBDEF3', // --theme-bg-light, as-is
  border: '#D6DBE8', // decorative card edges
  borderStrong: '#757F95', // control outlines — their --body-text-color, 4.02:1

  // Text — brand-native navy, not a generic grey
  text: '#212E54', // 13.26:1 on white · 9.95:1 on the band   AAA
  textMuted: '#5C6780', //  5.67:1 on white                        AA
  /** Same as textMuted on purpose: hierarchy comes from size and weight. */
  textFaint: '#5C6780',
  /** For text sitting on an accent/gradient fill. */
  onDark: '#FFFFFF',

  // Brand
  accent: '#07A4E7', // --theme-color. FILLS ONLY
  accentInk: '#067EB2', // links and blue text            4.53:1  AA
  accentDeep: '#1C72B3', // --theme-gradient partner        5.11:1  AA
  accentSoft: '#DDF1FC', // tinted fill behind blue badges
  onAccent: '#212E54', // labels on an accent fill        4.72:1  AA

  // Semantic — vivid fill, darkened sibling for text, same hue family
  added: '#11B76B', // --color-green
  addedInk: '#0E7A48', //  5.39:1  AA
  addedSoft: '#DCF7EA',
  increased: '#FF7E38', // .header-top gradient start
  increasedInk: '#C2410C', //  5.18:1  AA
  increasedSoft: '#FFEAD9',
  swapped: '#E667A4', // --theme-gradient2 start
  swappedInk: '#B83A72', //  5.40:1  AA
  swappedSoft: '#FBE3EF',
  removed: '#5C6780',

  // Premium — the gradient2 pink→blue, not gold. gradient2 is a declared brand
  // variable; the gold only ever appeared as a text-selection highlight.
  premium: '#E667A4',
  premiumInk: '#B83A72', //  5.40:1  AA
  premiumSoft: '#FBE3EF',
  onPremium: '#FFFFFF',
};

/**
 * Their signature depth device. White text cannot sit on `brand` — it fails at
 * the #07A4E7 end — so that one stays decorative or carries ink-navy text.
 * `brand2` is dark enough throughout for white text.
 */
export const gradients = {
  /** --theme-gradient */
  brand: ['#07A4E7', '#1C72B3'] as [string, string],
  /** --theme-gradient2, the declared-but-unused pink→blue. Premium surfaces. */
  brand2: ['#E667A4', '#1C72B3'] as [string, string],
  /** .header-top */
  hot: ['#FF7E38', '#FA4014'] as [string, string],
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };

/**
 * The site separates cards with soft shadow rather than heavy borders.
 * boxShadow, not the deprecated shadow* props.
 */
export const shadow = {
  card: { boxShadow: '0 4px 12px rgba(33,46,84,0.08)' },
  raised: { boxShadow: '0 8px 24px rgba(33,46,84,0.12)' },
};

/** Minimum comfortable tap target. */
export const touch = { min: 44 };

export const type = {
  h1: { fontSize: 30, fontWeight: '800' as const, color: colors.text },
  h2: { fontSize: 21, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: 17, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 16, color: colors.text },
  small: { fontSize: 14, color: colors.textMuted },
  tiny: { fontSize: 12, color: colors.textMuted },
};
