/**
 * Ultimate Fitness brand palette.
 *
 * Extracted from ultimatefitnessclub.ca -> assets/css/style.css, which defines
 * proper custom properties, so these are the gym's real values rather than
 * colours sampled off a screenshot.
 *
 *   --theme-color        #07A4E7   primary
 *   --color-dark         #222222
 *   --footer-bg          #161616
 *   --footer-bg2         #0B0B0B
 *   --footer-text-color  #F5FAFF
 *   --body-text-color    #757F95
 *   --color-green        #11B76B
 *
 * THE ONE COMPROMISE: the site puts white text on #07A4E7 buttons, which is
 * 2.81:1 - well under AA. We keep their exact blue as the button fill and use
 * near-black labels instead (7.00:1, AAA). Their identity survives; only the
 * label ink changes. Every pair below is AA or better on our surfaces.
 *
 * The app shell stays dark. #0B0B0B / #161616 / #222222 are the gym's own
 * footer and dark-section values, so this is their palette, not an invention.
 */

export const colors = {
  // Surfaces - the site's dark-section stack
  bg: '#0B0B0B', // --footer-bg2
  surface: '#161616', // --footer-bg
  surfaceAlt: '#222222', // --color-dark
  border: 'rgba(255,255,255,0.10)', // --border-white-color, nudged up for dark UI

  // Text
  text: '#F5FAFF', // --footer-text-color      17.24:1  AAA
  textMuted: '#98A3B8', //                      7.12:1  AAA
  textFaint: '#757F95', // --body-text-color    4.50:1  AA

  // Brand
  accent: '#07A4E7', // --theme-color           6.44:1  AA as text on surface
  accentDeep: '#1c72b3', // --theme-gradient partner
  accentSoft: '#08283A', // dark tint for badge fills
  /** Labels on an accent-filled control. NEVER white - that pair fails at 2.81:1. */
  onAccent: '#0B0B0B', //                       7.00:1  AAA

  // Semantic states. These carry meaning independent of brand, so they stay
  // distinguishable - but green and pink are the gym's own values.
  added: '#11B76B', // --color-green            6.90:1  AA
  addedSoft: '#0C2A1B',
  increased: '#F2A93B', //                      9.06:1  AAA
  increasedSoft: '#33260E',
  swapped: '#e667a4', // --theme-gradient2      5.89:1  AA
  swappedSoft: '#3A1628',
  removed: '#8A93A3', //                        5.85:1  AA

  premium: '#d6b161', // gold from their CSS    8.89:1  AAA
  premiumSoft: '#2E260C',
  /** Labels on a premium-filled control. */
  onPremium: '#0B0B0B', //                      9.67:1  AAA
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
