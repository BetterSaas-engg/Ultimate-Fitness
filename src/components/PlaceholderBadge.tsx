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
    backgroundColor: colors.increasedSoft,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  pillText: { fontSize: 11, fontWeight: '800', color: colors.increasedInk, letterSpacing: 0.6 },
  banner: {
    backgroundColor: colors.increasedSoft,
    borderWidth: 1,
    borderColor: colors.increased,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.xs,
  },
  bannerTitle: { ...type.h3, color: colors.increasedInk },
  bannerBody: { ...type.small, color: colors.text },
});
