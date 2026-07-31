import { StyleSheet, Text, View } from 'react-native';
import type { PhaseDiff } from '@/data/changes';
import { ChangeBadge } from './ChangeBadge';
import { colors, radius, space, type } from '@/theme';

/**
 * The demo beat: the owner sees their red pen turn into a feature.
 *
 * Counts come from the real diff, so this panel cannot drift out of sync with
 * what the day cards below it show.
 */
export function WhatsNewPanel({
  diff,
  summary,
}: {
  diff: PhaseDiff;
  summary?: string;
}) {
  const { counts } = diff;
  const changedDays = diff.days.filter((d) => d.hasChanges).length;

  return (
    <View style={styles.panel}>
      <Text style={styles.kicker}>WHAT'S NEW THIS WEEK</Text>
      <Text style={styles.headline}>
        {changedDays} of {diff.days.length} days change in week 2
      </Text>

      {summary ? <Text style={styles.summary}>{summary}</Text> : null}

      <View style={styles.counts}>
        {counts.increased > 0 && <CountChip kind="increased" n={counts.increased} />}
        {counts.added > 0 && <CountChip kind="added" n={counts.added} />}
        {counts.swappedIn > 0 && <CountChip kind="swapped-in" n={counts.swappedIn} />}
        {counts.removed > 0 && <CountChip kind="removed" n={counts.removed} />}
      </View>
    </View>
  );
}

function CountChip({
  kind,
  n,
}: {
  kind: 'added' | 'increased' | 'swapped-in' | 'removed';
  n: number;
}) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipN}>{n}</Text>
      <ChangeBadge kind={kind} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.sm,
  },
  kicker: { fontSize: 10, fontWeight: '800', color: colors.accent, letterSpacing: 0.8 },
  headline: { ...type.h2 },
  summary: { ...type.small, color: colors.text, lineHeight: 20 },
  counts: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.xs },
  chip: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  chipN: { ...type.h3, color: colors.text },
});
