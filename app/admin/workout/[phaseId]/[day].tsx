import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminBar, AdminHeading, EditableField, Pill } from '@/components/admin/AdminChrome';
import { WORKOUT_PHASES } from '@/data/programs';
import { EXERCISE_GROUPS } from '@/data/exercises';
import { applySessionEdits } from '@/data/adminOverlay';
import { useAdminEdits, workoutExerciseKey, workoutSessionKey } from '@/store/useAdminEdits';
import { colors, radius, space, touch, type } from '@/theme';

export default function SessionEditor() {
  const { phaseId, day } = useLocalSearchParams<{ phaseId: string; day: string }>();
  const {
    edits,
    editExercise,
    addExercise,
    editAddedExercise,
    removeAddedExercise,
  } = useAdminEdits();
  const [adding, setAdding] = useState(false);

  const phase = WORKOUT_PHASES.find((p) => p.phaseId === phaseId);
  const raw = phase?.days.find((d) => d.day === Number(day));

  if (!phase || !raw) {
    return (
      <SafeAreaView style={styles.safe}>
        <AdminBar role="trainer" />
        <View style={styles.content}>
          <Text style={type.small}>
            No session {day} in phase “{phaseId}”.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const session = applySessionEdits(raw, phase.phaseId, edits);
  const added = edits.addedExercises?.[workoutSessionKey(phase.phaseId, raw.day)] ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <AdminBar role="trainer" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AdminHeading
          title={session.label}
          subtitle="Edit name, sets and reps. Flip “content is real” once this is your programming rather than a stand-in."
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
                  <Pill text={confirmed ? 'REAL' : 'PLACEHOLDER'} tone={confirmed ? 'ok' : 'warn'} />
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
                    width={88}
                    keyboardType="numeric"
                    value={ex.sets === undefined ? '' : String(ex.sets)}
                    onCommit={(v) => {
                      const n = Number(v);
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

                {ex.targets?.length ? (
                  <View style={styles.targets}>
                    {ex.targets.map((t) => (
                      <View key={t} style={styles.target}>
                        <Text style={styles.targetText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View style={styles.confirmRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={type.body}>Content is real</Text>
                    <Text style={type.tiny}>
                      The phase banner lifts only when every exercise is confirmed.
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

          {/* ---- exercises this trainer added ---- */}
          {added.map((ex, i) => (
            <View key={`added-${i}`} style={[styles.card, styles.cardAdded]}>
              <View style={styles.cardHeader}>
                <Text style={type.tiny}>ADDED BY YOU</Text>
                <Pill text="PLACEHOLDER" tone="warn" />
              </View>

              <EditableField
                label="Name"
                value={ex.name}
                onCommit={(v) =>
                  editAddedExercise(phase.phaseId, raw.day, i, { name: v.trim() || ex.name })
                }
              />
              <View style={styles.doseRow}>
                <EditableField
                  label="Sets"
                  width={88}
                  keyboardType="numeric"
                  value={ex.sets === undefined ? '' : String(ex.sets)}
                  onCommit={(v) => {
                    const n = Number(v);
                    if (v.trim() === '' || Number.isNaN(n)) return;
                    editAddedExercise(phase.phaseId, raw.day, i, { sets: n });
                  }}
                />
                <EditableField
                  label="Reps"
                  value={ex.reps ?? ''}
                  placeholder="8-10, 30 sec…"
                  onCommit={(v) => editAddedExercise(phase.phaseId, raw.day, i, { reps: v.trim() })}
                />
              </View>

              <Pressable
                onPress={() => removeAddedExercise(phase.phaseId, raw.day, i)}
                accessibilityRole="button"
                style={styles.removeBtn}
              >
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
          ))}
        </View>

        {/* ---- add ---- */}
        {adding ? (
          <AddPicker
            onPick={(name, exerciseId, targets) => {
              addExercise(phase.phaseId, raw.day, { name, exerciseId, targets, sets: 3, reps: '8-10' });
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <Pressable
            onPress={() => setAdding(true)}
            accessibilityRole="button"
            style={styles.addBtn}
          >
            <Text style={styles.addText}>+  Add an exercise</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Pick from the library rather than typing free text. Anything chosen this way
 * arrives with its movement pattern and targets already attached, so a
 * trainer-added exercise is swappable for members from the moment it exists.
 */
function AddPicker({
  onPick,
  onCancel,
}: {
  onPick: (name: string, exerciseId: string, targets: string[]) => void;
  onCancel: () => void;
}) {
  return (
    <View style={styles.picker}>
      <View style={styles.pickerHeader}>
        <Text style={type.h3}>Add an exercise</Text>
        <Pressable onPress={onCancel} accessibilityRole="button" hitSlop={10}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
      </View>
      <Text style={styles.pickerHint}>
        From the library, so it comes with its movement pattern and targets — which is what makes it
        swappable for members.
      </Text>

      {EXERCISE_GROUPS.map((g) => (
        <View key={g.groupId} style={{ marginTop: space.md }}>
          <Text style={styles.groupLabel}>{g.label}</Text>
          {g.members.map((m) => (
            <Pressable
              key={m.exerciseId}
              onPress={() => onPick(m.label, m.exerciseId, m.targets)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.pickRow, pressed && { opacity: 0.6 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={type.body}>{m.label}</Text>
                <Text style={type.tiny}>{m.equipment}</Text>
              </View>
              <Text style={styles.plus}>+</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, paddingBottom: space.xxl },
  list: { gap: space.md },
  card: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: space.lg,
    gap: space.md,
    boxShadow: '0 4px 12px rgba(33,46,84,0.08)',
  },
  cardAdded: { borderColor: colors.accent, borderStyle: 'dashed' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  doseRow: { flexDirection: 'row', gap: space.md },
  targets: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  target: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
  },
  targetText: { fontSize: 11, fontWeight: '700', color: colors.accentInk },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: space.md,
  },
  removeBtn: { alignSelf: 'flex-start', minHeight: touch.min, justifyContent: 'center' },
  removeText: { ...type.small, color: colors.increasedInk, fontWeight: '700' },

  addBtn: {
    marginTop: space.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    minHeight: touch.min + 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addText: { ...type.body, color: colors.accentInk, fontWeight: '700' },

  picker: {
    marginTop: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space.lg,
  },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerHint: { ...type.tiny, marginTop: space.xs, lineHeight: 17 },
  cancel: { ...type.small, color: colors.accentInk, fontWeight: '700' },
  groupLabel: { ...type.tiny, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touch.min,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  plus: { fontSize: 22, color: colors.accentInk, fontWeight: '700' },
});
