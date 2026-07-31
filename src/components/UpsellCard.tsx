import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, type } from '@/theme';

/**
 * The Ramp step. This is where the gym makes money, so it is a feature, not a
 * banner bolted on at the end.
 *
 * The tier model does the work here: the meal plan is premium, so a free
 * member's locked nutrition tab IS the upsell surface. No invented trigger.
 */
export function UpsellCard({
  title,
  body,
  cta,
  onPress,
}: {
  title: string;
  body: string;
  cta: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>FROM THE GYM</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.8 }]}
      >
        <Text style={styles.ctaText}>{cta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.premiumSoft,
    borderWidth: 1,
    borderColor: colors.premium,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.sm,
  },
  kicker: { fontSize: 10, fontWeight: '800', color: colors.premium, letterSpacing: 0.8 },
  title: { ...type.h3 },
  body: { ...type.small, color: colors.text },
  cta: {
    marginTop: space.sm,
    backgroundColor: colors.premium,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  ctaText: { color: colors.onPremium, fontWeight: '700', fontSize: 15 },
});
