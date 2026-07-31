import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminBar, AdminHeading, EditableField, Pill } from '@/components/admin/AdminChrome';
import { WORKOUT_PHASES } from '@/data/programs';
import { applySessionEdits } from '@/data/adminOverlay';
import { useAdminEdits, workoutExerciseKey } from '@/store/useAdminEdits';
import { colors, radius, space, type } from '@/theme';

export default function SessionEditor() {
  const { phaseId, day } = useLocalSearchParams<{ phaseId: string; day: string }>();
  const { edits, editExercise } = useAdminEdits();

  const phase = WORKOUT_PHASES.find((p) => p.phaseId === phaseId);
  const raw = phase?.days.find((d) => d.day === Number(day));

  if (!phase || !raw) {
    return (
      <SafeAreaView style={styles.safe}>
        <AdminBar role="trainer" />
        <View style={styles.content}>
          <Text style={type.small}>No session {day} in phase “{phaseId}”.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const session = applySessionEdits(raw, phase.phaseId, edits);

  return (
    <SafeAreaView style={styles.safe}>
      <AdminBar role="trainer" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AdminHeading
          title={session.label}
          subtitle="Edit the name, sets and reps. Flip “content is real” once this is your programming rather than a stand-in."
        />

        <View style={styles.list}>
          {raw.exercises.map((rawEx, i) => {
            const ex = session.exercises[i];
            const patch = edits.workoutExercises[workoutExerciseKey(phase.phaseId, raw.day, i)];
            const confirmed = Boolean(patch?.confirmedReal);

            return (
              <View key={i} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={type.tiny}>EXERCISE {i + 1}</Text>
                  {confirmed ? (
                    <Pill text="REAL" tone="ok" />
                  ) : (
                    <Pill text="PLACEHOLDER" tone="warn" />
                  )}
                </View>

                <EditableField
                  label="Name"
                  value={ex.name}
                  onCommit={(v) =>
                    editExercise(phase.phaseId, raw.day, i, { name: v.trim() || rawEx.name })
                  }
                />

                <View style={styles.doseRow}>
                  <EditableField
                    label="Sets"
                    width={80}
                    keyboardType="numeric"
                    value={ex.sets === undefined ? '' : String(ex.sets)}
                    onCommit={(v) => {
                      const n = Number(v);
                      // Reject anything non-numeric rather than storing NaN.
                      if (v.trim() === '' || Number.isNaN(n)) return;
                      editExercise(phase.phaseId, raw.day, i, { sets: n });
                    }}
                  />
                  <EditableField
                    label="Reps"
                    value={ex.reps ?? ''}
                    placeholder="8-10, 30 sec…"
                    onCommit={(v) => editExercise(phase.phaseId, raw.day, i, { reps: v.trim() })}
                  />
                </View>

                <View style={styles.confirmRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={type.body}>Content is real</Text>
                    <Text style={type.tiny}>
                      Clears the placeholder flag for this exercise. The phase banner only lifts
                      when every exercise is confirmed.
                    </Text>
                  </View>
                  <Switch
                    value={confirmed}
                    onValueChange={(v) =>
                      editExercise(phase.phaseId, raw.day, i, { confirmedReal: v })
                    }
                    trackColor={{ true: colors.added, false: colors.surfaceAlt }}
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
  doseRow: { flexDirection: 'row', gap: space.md },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: space.md,
  },
});
