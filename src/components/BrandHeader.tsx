import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, gradients, radius, space } from '@/theme';

/**
 * The gym's logo. Two variants exist because the site ships both:
 *   uf-logo.png       light-on-dark — for the gradient band
 *   uf-logo-dark.png  dark-on-light — for white surfaces
 *
 * Native aspect is 291x100, so widths here keep that 2.91:1 ratio.
 */
const LOGO_LIGHT = require('../../assets/uf-logo.png');
const LOGO_DARK = require('../../assets/uf-logo-dark.png');
const RATIO = 291 / 100;

export function Logo({ width = 150, onLight }: { width?: number; onLight?: boolean }) {
  return (
    <Image
      source={onLight ? LOGO_DARK : LOGO_LIGHT}
      style={{ width, height: width / RATIO }}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Ultimate Fitness"
    />
  );
}

/**
 * Gradient header band — their --theme-gradient, which is the site's signature
 * depth device. Without it a light theme is just white boxes with blue accents.
 *
 * Text on the band is white, which is fine at this size: the AA problem with
 * #07A4E7 is for SMALL text, and everything here is 14px+ bold or a pill.
 */
export function BrandHeader({ right, title, subtitle }: { right?: string; title?: string; subtitle?: string }) {
  return (
    <LinearGradient
      colors={gradients.brand}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.band}
    >
      <SafeAreaView edges={['top']}>
        <View style={styles.row}>
          <Logo width={132} />
          {right ? (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{right}</Text>
            </View>
          ) : null}
        </View>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  band: { paddingHorizontal: space.xl, paddingBottom: space.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: space.md,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 5,
  },
  pillText: {
    color: colors.onDark,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.onDark, marginTop: space.lg },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.92)', marginTop: 3 },
});
