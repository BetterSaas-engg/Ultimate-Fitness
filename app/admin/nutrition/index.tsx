import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminBar, AdminHeading, AdminRow, Pill } from '@/components/admin/AdminChrome';
import { NUTRITION_PHASES, NUTRITION_PROGRAM } from '@/data/programs';
import { useAdminEdits, nutritionItemKey } from '@/store/useAdminEdits';
import { colors, space, type } from '@/theme';

export default function NutritionProgramList() {
  const router = useRouter();
  const { edits } = useAdminEdits();

  return (
    <SafeAreaView style={styles.safe}>
      <AdminBar role="nutritionist" />
      <ScrollView contentContainerStyle={styles.content}>
        <AdminHeading
          title={NUTRITION_PROGRAM.name}
          subtitle="Pick a week, then a day, to edit what's on the plan. Changes reach the member's Today screen immediately."
        />

        {NUTRITION_PHASES.map((phase, pi) => {
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
                <Text style={type.h2}>Week {pi + 1}</Text>
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
            </View>
          );
        })}
      </ScrollView>
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
});
