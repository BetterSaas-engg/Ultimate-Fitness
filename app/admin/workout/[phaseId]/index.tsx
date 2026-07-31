import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminBar, AdminHeading, EditableField, Pill } from '@/components/admin/AdminChrome';
import { WORKOUT_PHASES, WORKOUT_PROGRAM } from '@/data/programs';
import { applySessionEdits } from '@/data/adminOverlay';
import { useAdminEdits, workoutExerciseKey } from '@/store/useAdminEdits';
import { colors, radius, space, type } from '@/theme';

export default function PhaseSessions() {
  const router = useRouter();
  const { phaseId } = useLocalSearchParams<{ phaseId: string }>();
  const { edits, editSessionLabel } = useAdminEdits();

  const index = WORKOUT_PHASES.findIndex((p) => p.phaseId === phaseId);
  const phase = WORKOUT_PHASES[index];

  if (!phase) {
    return (
      <SafeAreaView style={styles.safe}>
        <AdminBar role="trainer" />
        <View style={styles.content}>
          <Text style={type.small}>No phase with id “{phaseId}”.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const meta = WORKOUT_PROGRAM.phases[index];

  return (
    <SafeAreaView style={styles.safe}>
      <AdminBar role="trainer" />
      <ScrollView contentContainerStyle={styles.content}>
        <AdminHeading
          title={meta?.name ?? phase.phaseId}
          subtitle={`${phase.durationWeeks} weeks · ${phase.sessionsPerWeek} sessions a week. Rename a session or open it to edit exercises.`}
        />

        <View style={styles.list}>
          {phase.days.map((raw) => {
            const session = applySessionEdits(raw, phase.phaseId, edits);
            const confirmed = raw.exercises.filter(
              (_, i) => edits.workoutExercises[workoutExerciseKey(phase.phaseId, raw.day, i)]?.confirmedReal
            ).length;

            return (
              <View key={raw.day} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={type.tiny}>SESSION {raw.day}</Text>
                  <Pill
                    text={confirmed === raw.exercises.length ? 'REAL' : 'PLACEHOLDER'}
                    tone={confirmed === raw.exercises.length ? 'ok' : 'warn'}
                  />
                </View>

                <EditableField
                  label="Session name"
                  value={session.label}
                  onCommit={(v) => editSessionLabel(phase.phaseId, raw.day, v.trim() || raw.label)}
                />

                <Text
                  style={styles.open}
                  onPress={() => router.push(`/admin/workout/${phase.phaseId}/${raw.day}`)}
                  accessibilityRole="button"
                >
                  {raw.exercises.length} exercises · {confirmed} confirmed real  ›
                </Text>
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
  list: { gap: space.md },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  open: { ...type.small, color: colors.accent, fontWeight: '700' },
});
