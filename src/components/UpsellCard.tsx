import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, shadow, space, touch } from '@/theme';

/**
 * The Ramp step. This is where the gym makes money, so it is a feature, not a
 * banner bolted on at the end.
 *
 * Rendered on --theme-gradient2 (pink -> blue), the one declared brand variable
 * the site never actually applies. It is dark enough end-to-end for white text,
 * unlike --theme-gradient, and it makes the single commercial moment the most
 * visually distinct thing on the screen.
 *
 * Copy is profession-based only - "the Ultimate Fitness nutrition team", never
 * a named person. Instructor names belong on class listings, where they are
 * factual schedule data.
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
    <LinearGradient
      colors={gradients.brand2}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, shadow.raised]}
    >
      <Text style={styles.kicker}>FROM THE GYM</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.ctaText}>{cta}</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, padding: space.lg, gap: space.sm },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1,
  },
  title: { fontSize: 19, fontWeight: '800', color: colors.onDark },
  body: { fontSize: 15, color: 'rgba(255,255,255,0.94)', lineHeight: 21 },
  cta: {
    marginTop: space.sm,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    minHeight: touch.min,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: { color: colors.premiumInk, fontWeight: '800', fontSize: 16 },
});
