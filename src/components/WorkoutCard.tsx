import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { WorkoutToday } from '@/data/programs';
import { PlaceholderBadge } from './PlaceholderBadge';
import { colors, radius, space, type } from '@/theme';

interface Props {
  today: WorkoutToday;
  logged?: boolean;
  onToggle?: () => void;
}

export function WorkoutCard({ today, logged, onToggle }: Props) {
  // Rest is a real state, not an empty screen. A beginner who opens the app and
  // sees nothing assumes it's broken.
  if (today.kind === 'rest') {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Rest day</Text>
        <Text style={styles.sub}>
          No session today. Walk, stretch, sleep. You train {today.phase.sessionsPerWeek}× a week and
          the days off are where the work sticks.
        </Text>
      </View>
    );
  }

  const session = today.session!;
  const isPlaceholder = today.phase.contentStatus === 'placeholder';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{session.label}</Text>
          <Text style={styles.sub}>
            Week {today.programWeek} · session {today.sessionOrdinal} of{' '}
            {today.phase.sessionsPerWeek}
          </Text>
        </View>
        {onToggle && (
          <Pressable
            onPress={onToggle}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: !!logged }}
            accessibilityLabel="Log workout"
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
        <View key={`${ex.name}-${i}`} style={styles.row}>
          <Text style={styles.exName}>{ex.name}</Text>
          <Text style={styles.exDose}>
            {ex.sets ? `${ex.sets} × ` : ''}
            {ex.reps ?? ''}
          </Text>
        </View>
      ))}

      {session.prep && <Text style={styles.prep}>{session.prep}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: space.md },
  title: { ...type.h3 },
  sub: { ...type.small, marginTop: 2 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  exName: { ...type.body, flex: 1 },
  exDose: { ...type.small, color: colors.textMuted },
  prep: { ...type.small, fontStyle: 'italic', marginTop: space.md },
  check: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.added, borderColor: colors.added },
  checkMark: { color: colors.textMuted, fontSize: 16, fontWeight: '700' },
  checkMarkOn: { color: '#06210F' },
});
