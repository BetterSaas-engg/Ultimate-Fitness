import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, space, type } from '@/theme';

/**
 * The gym's logo, from ultimatefitnessclub.ca/assets/img/logo/logo.png - the
 * light-on-dark variant, which is the one that works on our dark shell.
 *
 * Native aspect is 291x100, so widths here keep that 2.91:1 ratio.
 */
const LOGO = require('../../assets/uf-logo.png');
const RATIO = 291 / 100;

export function Logo({ width = 150 }: { width?: number }) {
  return (
    <Image
      source={LOGO}
      style={{ width, height: width / RATIO }}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Ultimate Fitness"
    />
  );
}

/** Header for the tab screens: logo left, optional context right. */
export function BrandHeader({ right }: { right?: string }) {
  return (
    <View style={styles.header}>
      <Logo width={132} />
      {right ? <Text style={styles.right}>{right}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  right: { ...type.tiny, letterSpacing: 0.6, textTransform: 'uppercase' },
});
