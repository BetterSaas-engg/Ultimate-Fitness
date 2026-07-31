import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, type } from '@/theme';

/**
 * Anything a trainer still has to write carries this. Deliberately loud - the
 * failure we are guarding against is placeholder programming reaching a real
 * member and being taken as advice.
 */
export function PlaceholderBadge({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <View style={styles.pill}>
        <Text style={styles.pillText}>PLACEHOLDER</Text>
      </View>
    );
  }
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerTitle}>Placeholder content</Text>
      <Text style={styles.bannerBody}>
        These exercises are a structural stand-in so the app can be demoed. Real programming comes
        from the Ultimate Fitness trainers.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  pillText: { fontSize: 10, fontWeight: '800', color: colors.accent, letterSpacing: 0.6 },
  banner: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.xs,
  },
  bannerTitle: { ...type.h3, color: colors.accent },
  bannerBody: { ...type.small, color: colors.text },
});
