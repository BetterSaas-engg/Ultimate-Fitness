import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminBar, AdminHeading, Pill } from '@/components/admin/AdminChrome';
import { NUTRITION_PHASES } from '@/data/programs';
import { macroApprovalKey } from '@/data/adminOverlay';
import { useAdminEdits } from '@/store/useAdminEdits';
import type { Macros } from '@/types/program';
import { colors, radius, space, type } from '@/theme';

interface MacroGroup {
  key: string;
  food: string;
  qty: number | string | null;
  unit: string | null;
  macros: Macros;
  /** How many times this food+serving appears across both weeks. */
  occurrences: number;
}

/**
 * Review queue, grouped by FOOD + SERVING rather than by item occurrence.
 *
 * "chicken breast 5 oz" appears ten times across the two weeks; approving each
 * separately would be 165 toggles. Grouping makes it ~40 and means an approval
 * is a statement about a food, which is how a nutritionist actually thinks.
 */
function buildGroups(): MacroGroup[] {
  const map = new Map<string, MacroGroup>();
  for (const phase of NUTRITION_PHASES)
    for (const day of phase.days)
      for (const meal of day.meals)
        for (const item of meal.items) {
          if (!item.macros || !item.macrosEstimated) continue;
          const key = macroApprovalKey(item);
          const existing = map.get(key);
          if (existing) existing.occurrences++;
          else
            map.set(key, {
              key,
              food: item.food,
              qty: item.qty,
              unit: item.unit,
              macros: item.macros,
              occurrences: 1,
            });
        }
  return [...map.values()].sort(
    (a, b) => b.macros.protein - a.macros.protein || a.food.localeCompare(b.food)
  );
}

export default function MacroReview() {
  const { edits, setMacroApproved } = useAdminEdits();
  const groups = useMemo(buildGroups, []);

  const approved = groups.filter((g) => edits.approvedMacros[g.key]).length;
  const allApproved = approved === groups.length;

  return (
    <SafeAreaView style={styles.safe}>
      <AdminBar role="nutritionist" />
      <ScrollView contentContainerStyle={styles.content}>
        <AdminHeading
          title="Review macros"
          subtitle="Every estimated value, grouped by food and serving. Approving one covers every occurrence of that food at that amount."
        />

        <View style={styles.summary}>
          <Text style={styles.summaryValue}>
            {approved}
            <Text style={styles.summaryOf}> / {groups.length}</Text>
          </Text>
          <Text style={type.small}>
            {allApproved
              ? 'All approved. Members no longer see the “estimated values” caption.'
              : 'Members see an “estimated values” note until the items on their day are approved.'}
          </Text>
          <View style={styles.bulkRow}>
            <Pressable
              onPress={() => groups.forEach((g) => setMacroApproved(g.key, true))}
              style={styles.bulkBtn}
              accessibilityRole="button"
            >
              <Text style={styles.bulkText}>Approve all</Text>
            </Pressable>
            <Pressable
              onPress={() => groups.forEach((g) => setMacroApproved(g.key, false))}
              style={styles.bulkBtn}
              accessibilityRole="button"
            >
              <Text style={styles.bulkText}>Clear all</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.list}>
          {groups.map((g) => {
            const isApproved = Boolean(edits.approvedMacros[g.key]);
            return (
              <View key={g.key} style={[styles.row, isApproved && styles.rowApproved]}>
                <View style={{ flex: 1 }}>
                  <Text style={type.body}>
                    {g.food}
                    <Text style={styles.serving}>
                      {'  '}
                      {g.qty ?? '—'}
                      {g.unit ? ` ${g.unit}` : ''}
                    </Text>
                  </Text>
                  <Text style={styles.macroLine}>
                    {g.macros.protein}g protein · {g.macros.carbs}g carbs · {g.macros.fat}g fat
                  </Text>
                  <Text style={type.tiny}>
                    appears {g.occurrences}× across the two weeks
                  </Text>
                </View>
                <View style={styles.approveCol}>
                  <Pill text={isApproved ? 'APPROVED' : 'ESTIMATED'} tone={isApproved ? 'ok' : 'off'} />
                  <Switch
                    value={isApproved}
                    onValueChange={(v) => setMacroApproved(g.key, v)}
                    trackColor={{ true: colors.added, false: colors.surfaceAlt }}
                    accessibilityLabel={`Approve ${g.food}`}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, paddingBottom: space.xxl },
  summary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.sm,
    marginBottom: space.lg,
  },
  summaryValue: { fontSize: 30, fontWeight: '800', color: colors.text },
  summaryOf: { fontSize: 18, color: colors.textMuted, fontWeight: '600' },
  bulkRow: { flexDirection: 'row', gap: space.md, marginTop: space.xs },
  bulkBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: space.sm,
    alignItems: 'center',
  },
  bulkText: { ...type.small, fontWeight: '700' },
  list: { gap: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
  },
  rowApproved: { borderColor: colors.added },
  serving: { ...type.small, color: colors.textMuted },
  macroLine: { ...type.small, marginTop: 2 },
  approveCol: { alignItems: 'flex-end', gap: space.xs },
});
