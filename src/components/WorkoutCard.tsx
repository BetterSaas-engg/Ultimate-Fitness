import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Exercise } from '@/types/program';
import type { WorkoutToday } from '@/data/programs';
import { PlaceholderBadge } from './PlaceholderBadge';
import { ExerciseSwapSheet } from './ExerciseSwapSheet';
import { phaseStillPlaceholder } from '@/data/adminOverlay';
import { exerciseOptionById, optionsForExercise } from '@/data/exercises';
import { useAdminEdits } from '@/store/useAdminEdits';
import type { DaySwaps } from '@/store/useExerciseSwaps';
import { exerciseSwapKey } from '@/store/useExerciseSwaps';
import { colors, radius, space, touch, type } from '@/theme';

interface Props {
  today: WorkoutToday;
  logged?: boolean;
  onToggle?: () => void;
  swaps?: DaySwaps;
  onSwap?: (index: number, exerciseId: string) => void;
  onRestore?: (index: number) => void;
}

export function WorkoutCard({ today, logged, onToggle, swaps, onSwap, onRestore }: Props) {
  const { edits } = useAdminEdits();

  // Rest is a real state, not an empty screen. A beginner who opens the app and
  // sees nothing assumes it's broken.
  if (today.kind === 'rest') {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Rest day</Text>
        <Text style={styles.sub}>
          Nothing scheduled. Walk, stretch, sleep — you train {today.phase.sessionsPerWeek}× a week
          and the days off are where the work sticks.
        </Text>
      </View>
    );
  }

  const session = today.session!;
  const isPlaceholder = phaseStillPlaceholder(today.phase, edits);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{session.label}</Text>
          <Text style={styles.sub}>
            Session {today.sessionOrdinal} of {today.phase.sessionsPerWeek} this week
          </Text>
        </View>
        {onToggle && (
          <Pressable
            onPress={onToggle}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: !!logged }}
            accessibilityLabel="Mark workout done"
            style={[styles.check, logged && styles.checkOn]}
          >
            <Text style={[styles.checkMark, logged && styles.checkMarkOn]}>
              {logged ? '✓' : '+'}
            </Text>
          </Pressable>
        )}
      </View>

      {isPlaceholder && (
        <View style={{ marginBottom: space.sm }}>
          <PlaceholderBadge />
        </View>
      )}

      {session.exercises.map((ex, i) => (
        <ExerciseRow
          key={`${ex.name}-${i}`}
          exercise={ex}
          index={i}
          swappedTo={swaps?.[exerciseSwapKey(i)]}
          onSwap={onSwap}
          onRestore={onRestore}
        />
      ))}

      {session.prep && <Text style={styles.prep}>{session.prep}</Text>}
    </View>
  );
}

function ExerciseRow({
  exercise,
  index,
  swappedTo,
  onSwap,
  onRestore,
}: {
  exercise: Exercise;
  index: number;
  swappedTo?: string;
  onSwap?: (index: number, exerciseId: string) => void;
  onRestore?: (index: number) => void;
}) {
  const [picking, setPicking] = useState(false);
  const { edits } = useAdminEdits();

  const sub = swappedTo ? exerciseOptionById(swappedTo) : undefined;
  const canSwap = Boolean(onSwap) && optionsForExercise(exercise, edits).length > 0;
  const shown = sub?.label ?? exercise.name;

  return (
    <View>
      <View style={styles.exRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.exName, sub && styles.exSwapped]}>{shown}</Text>
          {sub ? <Text style={styles.exFrom}>swapped for {exercise.name}</Text> : null}
        </View>
        <Text style={styles.exDose}>
          {exercise.sets ? `${exercise.sets} × ` : ''}
          {exercise.reps ?? ''}
        </Text>
        {canSwap && (
          <Pressable
            onPress={() => setPicking(true)}
            accessibilityRole="button"
            accessibilityLabel={`Swap ${exercise.name}`}
            style={({ pressed }) => [styles.swapBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.swapText}>{sub ? 'Change' : 'Swap'}</Text>
          </Pressable>
        )}
      </View>

      {canSwap && (
        <ExerciseSwapSheet
          exercise={exercise}
          visible={picking}
          currentExerciseId={swappedTo}
          onPick={(id) => {
            onSwap?.(index, id);
            setPicking(false);
          }}
          onRestore={() => {
            onRestore?.(index);
            setPicking(false);
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg,
    borderRadius: radius.xl,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0 4px 12px rgba(33,46,84,0.08)',
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: space.md },
  title: { ...type.h3 },
  sub: { ...type.small, marginTop: 2, lineHeight: 20 },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: touch.min,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exName: { ...type.body },
  exSwapped: { color: colors.accentInk, fontWeight: '700' },
  exFrom: { ...type.tiny, fontStyle: 'italic', marginTop: 1 },
  exDose: { ...type.small },
  swapBtn: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 8,
  },
  swapText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  prep: { ...type.small, fontStyle: 'italic', marginTop: space.md },
  check: {
    width: touch.min,
    height: touch.min,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.added, borderColor: colors.added },
  checkMark: { color: colors.textMuted, fontSize: 20, fontWeight: '800' },
  checkMarkOn: { color: colors.onDark },
});
