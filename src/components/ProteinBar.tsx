import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { proteinTargetFor, round1 } from '@/lib/macros';
import { colors, gradients, radius, space, type } from '@/theme';

/**
 * Logged protein against the day's target.
 *
 * The target is THE DAY'S PLANNED TOTAL by default - eat what the gym wrote
 * down and you hit 100%. A fixed number was the wrong model: this plan runs
 * ~190g on week 2, so a 100g default filled the bar before lunch and stopped
 * meaning anything.
 *
 * An explicit onboarding value overrides it, and when it does we say so, since
 * "target 120 / plan 190" needs explaining rather than hiding.
 */
export function ProteinBar({
  logged,
  planned,
  overrideTarget,
  estimated,
}: {
  logged: number;
  /** Sum of everything on today's plan, substitutions applied. */
  planned: number;
  /** Optional fixed target from onboarding. Falls back to `planned`. */
  overrideTarget?: number;
  estimated: boolean;
}) {
  const usingOverride = typeof overrideTarget === 'number' && overrideTarget > 0;
  const target = proteinTargetFor(planned, overrideTarget);

  const safeTarget = target > 0 ? target : 1;
  const pct = Math.min(100, (logged / safeTarget) * 100);
  const hit = logged >= target && target > 0;
  const remaining = round1(Math.max(0, target - logged));

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>Protein today</Text>
        <Text style={styles.readout}>
          <Text style={[styles.big, hit && { color: colors.addedInk }]}>{round1(logged)}</Text>
          <Text style={styles.of}> / {round1(target)}g</Text>
        </Text>
      </View>

      <View style={styles.track}>
        {hit ? (
          <View style={[styles.fill, { width: `${pct}%`, backgroundColor: colors.added }]} />
        ) : (
          <LinearGradient
            colors={gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.fill, { width: `${pct}%` }]}
          />
        )}
      </View>

      <Text style={styles.caption}>
        {hit
          ? "That's the day's plan covered."
          : `${remaining}g to go${usingOverride ? '' : " — that's everything on today's plan"}.`}
        {usingOverride ? ` Your target, not the plan's ${round1(planned)}g.` : ''}
        {estimated ? ' Estimated values.' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: space.lg,
    gap: space.sm,
    boxShadow: '0 4px 12px rgba(33,46,84,0.08)',
  },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  label: { ...type.h3 },
  readout: { flexDirection: 'row' },
  big: { fontSize: 24, fontWeight: '800', color: colors.text },
  of: { ...type.small },
  track: {
    height: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
  caption: { ...type.tiny, lineHeight: 17 },
});
