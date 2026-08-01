import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminBar, AdminHeading, Pill } from '@/components/admin/AdminChrome';
import { EXERCISE_GROUPS } from '@/data/exercises';
import { exerciseGroupStatus } from '@/data/adminOverlay';
import { useAdminEdits } from '@/store/useAdminEdits';
import type { SwapGroupStatus } from '@/types/admin';
import { colors, radius, space, touch, type } from '@/theme';

/** Trainer sign-off on exercise swaps — the mirror of the nutritionist's food swaps. */
export default function ExerciseSwapReview() {
  const { edits, setExerciseGroupStatus } = useAdminEdits();

  return (
    <SafeAreaView style={styles.safe}>
      <AdminBar role="trainer" />
      <ScrollView contentContainerStyle={styles.content}>
        <AdminHeading
          title="Exercise swaps"
          subtitle="Grouped by movement pattern, not muscle — that's what makes two exercises actually interchangeable. Reject a pattern to stop offering it to members."
        />

        <View style={styles.list}>
          {EXERCISE_GROUPS.map((group) => {
            const status = exerciseGroupStatus(group.groupId, edits);
            return (
              <View
                key={group.groupId}
                style={[
                  styles.card,
                  status === 'approved' && { borderColor: colors.added },
                  status === 'rejected' && { borderColor: colors.removed, opacity: 0.7 },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={type.h3}>{group.label}</Text>
                  <StatusPill status={status} />
                </View>

                {group.members.map((m) => (
                  <View key={m.exerciseId} style={styles.member}>
                    <View style={{ flex: 1 }}>
                      <Text style={type.body}>{m.label}</Text>
                      <Text style={type.tiny}>{m.equipment}</Text>
                      <View style={styles.targets}>
                        {m.targets.map((t) => (
                          <View key={t} style={styles.target}>
                            <Text style={styles.targetText}>{t}</Text>
                          </View>
                        ))}
                      </View>
                      {m.note ? <Text style={styles.note}>{m.note}</Text> : null}
                    </View>
                  </View>
                ))}

                <View style={styles.actions}>
                  <Action
                    label="Reject"
                    active={status === 'rejected'}
                    tone={colors.removed}
                    onPress={() =>
                      setExerciseGroupStatus(
                        group.groupId,
                        status === 'rejected' ? 'pending' : 'rejected'
                      )
                    }
                  />
                  <Action
                    label="Approve"
                    active={status === 'approved'}
                    tone={colors.added}
                    onPress={() =>
                      setExerciseGroupStatus(
                        group.groupId,
                        status === 'approved' ? 'pending' : 'approved'
                      )
                    }
                  />
                </View>

                {status === 'rejected' && (
                  <Text style={styles.rejected}>
                    Members won't be offered these. The Swap button hides for this pattern.
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusPill({ status }: { status: SwapGroupStatus }) {
  if (status === 'approved') return <Pill text="APPROVED" tone="ok" />;
  if (status === 'rejected') return <Pill text="REJECTED" tone="off" />;
  return <Pill text="PENDING" tone="warn" />;
}

function Action({
  label,
  active,
  tone,
  onPress,
}: {
  label: string;
  active: boolean;
  tone: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.action,
        { borderColor: active ? tone : colors.border },
        active && { backgroundColor: tone },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Text style={[styles.actionText, active && { color: colors.onDark }]}>{label}</Text>
    </Pressable>
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
    boxShadow: '0 4px 12px rgba(33,46,84,0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  member: {
    flexDirection: 'row',
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  targets: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.xs },
  target: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  targetText: { fontSize: 11, fontWeight: '700', color: colors.accentInk },
  note: { ...type.tiny, color: colors.increasedInk, marginTop: space.xs, lineHeight: 16 },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.md },
  action: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: touch.min,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: { ...type.small, fontWeight: '700' },
  rejected: { ...type.tiny, color: colors.removed, marginTop: space.sm, lineHeight: 16 },
});
