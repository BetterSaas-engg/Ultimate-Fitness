import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminBar, AdminHeading, AdminRow, Pill } from '@/components/admin/AdminChrome';
import { PlaceholderBadge } from '@/components/PlaceholderBadge';
import { WORKOUT_PHASES, WORKOUT_PROGRAM } from '@/data/programs';
import { phaseConfirmedCount, phaseStillPlaceholder } from '@/data/adminOverlay';
import { useAdminEdits } from '@/store/useAdminEdits';
import { colors, space, type } from '@/theme';

export default function WorkoutPhaseList() {
  const router = useRouter();
  const { edits } = useAdminEdits();

  const anyPlaceholder = WORKOUT_PHASES.some((p) => phaseStillPlaceholder(p, edits));

  return (
    <SafeAreaView style={styles.safe}>
      <AdminBar role="trainer" />
      <ScrollView contentContainerStyle={styles.content}>
        <AdminHeading title="Workout phases" subtitle={WORKOUT_PROGRAM.name} />

        {anyPlaceholder && (
          <View style={{ marginBottom: space.lg }}>
            <PlaceholderBadge />
          </View>
        )}

        <View style={styles.list}>
          {WORKOUT_PHASES.map((phase, i) => {
            const meta = WORKOUT_PROGRAM.phases[i];
            const { total, confirmed } = phaseConfirmedCount(phase, edits);
            const still = phaseStillPlaceholder(phase, edits);
            return (
              <AdminRow
                key={phase.phaseId}
                label={meta?.name ?? phase.phaseId}
                value={`${phase.durationWeeks} weeks · ${phase.sessionsPerWeek}× a week · ${phase.days.length} session templates`}
                meta={`${confirmed}/${total} exercises confirmed real`}
                onPress={() => router.push(`/admin/workout/${phase.phaseId}`)}
                right={
                  still ? <Pill text="PLACEHOLDER" tone="warn" /> : <Pill text="REAL" tone="ok" />
                }
              />
            );
          })}
        </View>

        <Text style={styles.footnote}>
          The placeholder banner clears only once every exercise in a phase is confirmed real —
          all-or-nothing on purpose, so it can’t disappear while stand-in programming is still on
          screen.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, paddingBottom: space.xxl },
  list: { gap: space.md },
  footnote: { ...type.tiny, marginTop: space.xl, lineHeight: 16 },
});
