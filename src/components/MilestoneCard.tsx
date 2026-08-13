import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { MILESTONE_COPY, type MilestoneId } from '@/lib/milestones';
import { colors, gradients, radius, space, touch, type } from '@/theme';

/**
 * A milestone moment. Dismissible, never blocking - it sits at the top of Today
 * and can be waved away. A modal would interrupt the one screen the member
 * opened the app to use.
 */
export function MilestoneCard({
  id,
  onDismiss,
}: {
  id: MilestoneId;
  onDismiss: () => void;
}) {
  const copy = MILESTONE_COPY[id];

  return (
    <LinearGradient
      colors={gradients.brand2}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>MILESTONE</Text>
          <Text style={styles.title}>{copy.title}</Text>
        </View>
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          hitSlop={10}
          style={({ pressed }) => [styles.close, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.closeMark}>✕</Text>
        </Pressable>
      </View>
      <Text style={styles.body}>{copy.body}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: space.lg,
    gap: space.xs,
    boxShadow: '0 8px 24px rgba(33,46,84,0.12)',
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.onDark,
    opacity: 0.85,
  },
  title: { ...type.h2, color: colors.onDark, marginTop: 2 },
  body: { ...type.small, color: colors.onDark, opacity: 0.95, lineHeight: 20 },
  close: {
    width: touch.min,
    height: touch.min,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -space.xs,
    marginRight: -space.sm,
  },
  closeMark: { color: colors.onDark, fontSize: 16, fontWeight: '700' },
});
