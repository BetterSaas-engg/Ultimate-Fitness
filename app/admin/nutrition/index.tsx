import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminBar, AdminHeading, AdminRow, Pill } from '@/components/admin/AdminChrome';
import { NUTRITION_PHASES, NUTRITION_PROGRAM } from '@/data/programs';
import { useAdminEdits, nutritionItemKey } from '@/store/useAdminEdits';
import { derivedNutritionPhases, derivedPhaseLabel } from '@/data/adminOverlay';
import { ConfirmDialog } from '@/components/admin/AdminChrome';
import { useState } from 'react';
import { colors, radius, space, touch, type } from '@/theme';

export default function NutritionProgramList() {
  const router = useRouter();
  const { edits, derivePhase, removeDerivedPhase } = useAdminEdits();
  const [confirmDrop, setConfirmDrop] = useState<string | null>(null);

  const phases = derivedNutritionPhases(NUTRITION_PHASES, edits);
  const nextWeek = phases.length + 1;

  return (
    <SafeAreaView style={styles.safe}>
      <AdminBar role="nutritionist" />
      <ScrollView contentContainerStyle={styles.content}>
        <AdminHeading
          title={NUTRITION_PROGRAM.name}
          subtitle="Pick a week, then a day, to edit what's on the plan. Changes reach the member's Today screen immediately."
        />

        {phases.map((phase, pi) => {
          const edited = phase.days.reduce(
            (n, d) =>
              n +
              d.meals.reduce(
                (m, meal) =>
                  m +
                  meal.items.filter(
                    (_, i) => edits.nutritionItems[nutritionItemKey(phase.phaseId, d.day, meal.slot, i)]
                  ).length,
                0
              ),
            0
          );

          return (
            <View key={phase.phaseId} style={styles.week}>
              <View style={styles.weekHeader}>
                <Text style={type.h2}>{derivedPhaseLabel(phase.phaseId, edits) ?? `Week ${pi + 1}`}</Text>
                {phase.verified ? (
                  <Pill text="VERIFIED" tone="ok" />
                ) : (
                  <Pill text="UNVERIFIED TRANSCRIPTION" tone="warn" />
                )}
              </View>

              {!phase.verified && (
                <Text style={styles.warn}>
                  Reconstructed from a blurry photo. Worth checking days 1–3, slot 2 against your
                  own copy.
                </Text>
              )}
              {edited > 0 && (
                <Text style={styles.edited}>
                  {edited} item{edited === 1 ? '' : 's'} edited in this week
                </Text>
              )}

              {derivedPhaseLabel(phase.phaseId, edits) && (
                <Text style={styles.derived}>
                  Duplicated from {phase.source?.includes('week-2') ? 'week 2' : 'an earlier week'} —
                  edits here don't touch the original.
                </Text>
              )}

              <View style={styles.days}>
                {phase.days.map((d) => (
                  <AdminRow
                    key={d.day}
                    label={`Day ${d.day}`}
                    value={`${d.meals.length} meals · ${d.meals.reduce((n, m) => n + m.items.length, 0)} items`}
                    onPress={() => router.push(`/admin/nutrition/${phase.phaseId}/${d.day}`)}
                  />
                ))}
              </View>
              {derivedPhaseLabel(phase.phaseId, edits) && (
                <Pressable
                  onPress={() => setConfirmDrop(phase.phaseId)}
                  accessibilityRole="button"
                  style={styles.dropBtn}
                >
                  <Text style={styles.dropText}>Delete this week</Text>
                </Pressable>
              )}
            </View>
          );
        })}

        {/* ---- duplicate-then-edit. No blank canvas. ---- */}
        <Pressable
          onPress={() => derivePhase(phases[phases.length - 1].phaseId, `Week ${nextWeek}`, nextWeek)}
          accessibilityRole="button"
          style={styles.saveAs}
        >
          <Text style={styles.saveAsText}>+  Save as week {nextWeek}</Text>
          <Text style={styles.saveAsHint}>
            Starts as a copy of week {phases.length}. Change what's different — you never start from
            an empty page.
          </Text>
        </Pressable>
      </ScrollView>

      <ConfirmDialog
        visible={confirmDrop !== null}
        title="Delete this week?"
        body="The week and every edit made to it will be removed. The weeks it was copied from are untouched."
        confirmLabel="Delete week"
        destructive
        onCancel={() => setConfirmDrop(null)}
        onConfirm={async () => {
          if (confirmDrop) await removeDerivedPhase(confirmDrop);
          setConfirmDrop(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, paddingBottom: space.xxl },
  week: { marginBottom: space.xxl },
  weekHeader: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  warn: { ...type.small, color: colors.increased, marginTop: space.xs, lineHeight: 18 },
  edited: { ...type.small, color: colors.accent, marginTop: space.xs },
  days: { gap: space.sm, marginTop: space.md },
  derived: { ...type.small, color: colors.accentInk, marginTop: space.xs, lineHeight: 19 },
  dropBtn: { marginTop: space.md, minHeight: touch.min, justifyContent: 'center' },
  dropText: { ...type.small, color: colors.increasedInk, fontWeight: '700' },
  saveAs: {
    marginTop: space.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.accent,
    borderRadius: radius.xl,
    padding: space.lg,
    gap: space.xs,
  },
  saveAsText: { ...type.h3, color: colors.accentInk },
  saveAsHint: { ...type.tiny, lineHeight: 17 },
});
