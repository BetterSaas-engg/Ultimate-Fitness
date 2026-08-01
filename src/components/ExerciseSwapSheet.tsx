import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Exercise } from '@/types/program';
import type { ExerciseOption } from '@/types/exercises';
import { groupForExerciseId, optionsForExercise } from '@/data/exercises';
import { exerciseGroupStatus } from '@/data/adminOverlay';
import { useAdminEdits } from '@/store/useAdminEdits';
import { colors, radius, space, touch, type } from '@/theme';

/**
 * Swap an exercise for another in the same movement pattern.
 *
 * The food sheet leads with the macro delta because that's the honest cost of
 * a food swap. The equivalent here is what the movement TRAINS and what KIT it
 * needs — the two reasons a beginner swaps at all ("the rack is busy", "does
 * this still work my back?"). So both are on every option, up front.
 */
export function ExerciseSwapSheet({
  exercise,
  visible,
  currentExerciseId,
  onPick,
  onRestore,
  onClose,
}: {
  exercise: Exercise;
  visible: boolean;
  currentExerciseId?: string;
  onPick: (exerciseId: string) => void;
  onRestore: () => void;
  onClose: () => void;
}) {
  const { edits } = useAdminEdits();
  const options = optionsForExercise(exercise, edits);
  const group = groupForExerciseId(exercise.exerciseId);
  const approved = group ? exerciseGroupStatus(group.groupId, edits) === 'approved' : false;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={type.h2}>Swap {exercise.name}</Text>
          <Text style={styles.sub}>
            {group?.label}
            {group?.placeholder && !approved ? ' · pending trainer approval' : ''}
            {approved ? ' · trainer approved' : ''}
          </Text>

          <ScrollView style={{ marginTop: space.lg }}>
            {currentExerciseId && (
              <Pressable onPress={onRestore} style={[styles.option, styles.restore]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optName}>{exercise.name}</Text>
                  <Text style={styles.optMeta}>the gym's original</Text>
                </View>
                <Text style={styles.restoreMark}>↺</Text>
              </Pressable>
            )}

            {options.map((opt) => (
              <Option key={opt.exerciseId} option={opt} onPick={() => onPick(opt.exerciseId)} />
            ))}

            {options.length === 0 && (
              <Text style={type.small}>No swaps set up for this movement yet.</Text>
            )}
          </ScrollView>

          <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
            <Text style={styles.closeText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Option({ option, onPick }: { option: ExerciseOption; onPick: () => void }) {
  return (
    <Pressable
      onPress={onPick}
      accessibilityRole="button"
      accessibilityLabel={`Swap to ${option.label}`}
      style={({ pressed }) => [styles.option, pressed && { opacity: 0.7 }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.optName}>{option.label}</Text>
        <Text style={styles.optMeta}>{option.equipment}</Text>
        <View style={styles.targets}>
          {option.targets.map((t) => (
            <View key={t} style={styles.target}>
              <Text style={styles.targetText}>{t}</Text>
            </View>
          ))}
        </View>
        {option.note ? <Text style={styles.optNote}>{option.note}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(33,46,84,0.45)',
    justifyContent: 'center',
    padding: space.xl,
  },
  sheet: {
    backgroundColor: colors.bg,
    borderRadius: radius.xl,
    padding: space.xl,
    maxHeight: '82%',
    boxShadow: '0 8px 24px rgba(33,46,84,0.12)',
  },
  sub: { ...type.small, marginTop: 2 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    minHeight: touch.min + 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  restore: { borderBottomWidth: 2, borderBottomColor: colors.border },
  restoreMark: { color: colors.accentInk, fontSize: 20 },
  optName: { ...type.body, fontWeight: '700' },
  optMeta: { ...type.tiny, marginTop: 2 },
  targets: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.sm },
  target: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
  },
  targetText: { fontSize: 11, fontWeight: '700', color: colors.accentInk },
  optNote: { ...type.tiny, color: colors.increasedInk, marginTop: space.xs, lineHeight: 16 },
  closeBtn: {
    marginTop: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    minHeight: touch.min,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: { ...type.h3 },
});
