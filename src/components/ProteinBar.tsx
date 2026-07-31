import { StyleSheet, Text, View } from 'react-native';
import { round1 } from '@/lib/macros';
import { colors, radius, space, type } from '@/theme';

/**
 * Logged protein against the member's target, with the rest of the plan shown
 * behind it so the gap reads as "still to eat" rather than "failed".
 */
export function ProteinBar({
  logged,
  planned,
  target,
  estimated,
}: {
  logged: number;
  planned: number;
  target: number;
  estimated: boolean;
}) {
  const safeTarget = target > 0 ? target : 1;
  const loggedPct = Math.min(100, (logged / safeTarget) * 100);
  // Planned is what the whole day adds up to, so the ghost bar starts where the
  // logged bar ends and never double-counts it.
  const plannedPct = Math.min(100, (Math.max(planned, logged) / safeTarget) * 100);

  const hitTarget = logged >= target;
  const remaining = round1(Math.max(0, target - logged));

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>Protein today</Text>
        <Text style={styles.value}>
          <Text style={[styles.big, hitTarget && { color: colors.added }]}>{round1(logged)}</Text>
          <Text style={styles.of}> / {target}g</Text>
        </Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.ghost, { width: `${plannedPct}%` }]} />
        <View
          style={[
            styles.fill,
            { width: `${loggedPct}%`, backgroundColor: hitTarget ? colors.added : colors.accent },
          ]}
        />
      </View>

      <Text style={styles.caption}>
        {hitTarget
          ? `Target hit. The full day's plan comes to ${round1(planned)}g.`
          : `${remaining}g to go — the rest of today's plan has ${round1(Math.max(0, planned - logged))}g in it.`}
        {estimated ? ' Estimated values.' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.sm,
  },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  label: { ...type.h3 },
  value: { flexDirection: 'row' },
  big: { fontSize: 22, fontWeight: '800', color: colors.text },
  of: { ...type.small },
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  ghost: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.border },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: radius.pill },
  caption: { ...type.tiny, lineHeight: 15 },
});
