import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminBar, AdminHeading, Pill } from '@/components/admin/AdminChrome';
import { SUBSTITUTION_GROUPS } from '@/data/substitutions';
import { swapGroupStatus } from '@/data/adminOverlay';
import { useAdminEdits } from '@/store/useAdminEdits';
import { formatServing } from '@/lib/macros';
import type { SwapGroupStatus } from '@/types/admin';
import { colors, radius, space, type } from '@/theme';

export default function SwapReview() {
  const { edits, setSwapGroupStatus } = useAdminEdits();

  return (
    <SafeAreaView style={styles.safe}>
      <AdminBar role="nutritionist" />
      <ScrollView contentContainerStyle={styles.content}>
        <AdminHeading
          title="Review swap groups"
          subtitle="Approve a group to sign off on it, or reject it to stop offering those swaps to members. Pending groups still work but stay flagged."
        />

        <View style={styles.list}>
          {SUBSTITUTION_GROUPS.map((group) => {
            const status = swapGroupStatus(group.groupId, edits);
            return (
              <View
                key={group.groupId}
                style={[
                  styles.card,
                  status === 'approved' && { borderColor: colors.added },
                  status === 'rejected' && { borderColor: colors.removed, opacity: 0.75 },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={type.h3}>{group.label}</Text>
                  <StatusPill status={status} />
                </View>

                {group.members.map((m) => (
                  <View key={m.foodId} style={styles.member}>
                    <Text style={styles.memberName}>
                      {m.label}
                      <Text style={styles.memberServing}>
                        {'  '}
                        {formatServing(m.serving.qty, m.serving.unit)}
                      </Text>
                    </Text>
                    <Text style={styles.memberMacros}>
                      {m.macros.protein}g P · {m.macros.carbs}g C · {m.macros.fat}g F
                    </Text>
                  </View>
                ))}

                {group.members.some((m) => m.note) && (
                  <Text style={styles.note}>
                    {group.members.find((m) => m.note)?.note}
                  </Text>
                )}

                <View style={styles.actions}>
                  <Action
                    label="Reject"
                    active={status === 'rejected'}
                    tone={colors.removed}
                    onPress={() =>
                      setSwapGroupStatus(group.groupId, status === 'rejected' ? 'pending' : 'rejected')
                    }
                  />
                  <Action
                    label="Approve"
                    active={status === 'approved'}
                    tone={colors.added}
                    onPress={() =>
                      setSwapGroupStatus(group.groupId, status === 'approved' ? 'pending' : 'approved')
                    }
                  />
                </View>

                {status === 'rejected' && (
                  <Text style={styles.rejected}>
                    Members won't be offered these swaps. The Replace button hides for these foods.
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
      <Text style={[styles.actionText, active && { color: colors.onAccent }]}>{label}</Text>
    </Pressable>
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
    gap: space.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  memberName: { ...type.body, flexShrink: 1 },
  memberServing: { ...type.small, color: colors.textMuted },
  memberMacros: { ...type.tiny },
  note: { ...type.tiny, color: colors.increased, marginTop: space.sm, lineHeight: 16 },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.md },
  action: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: space.sm,
    alignItems: 'center',
  },
  actionText: { ...type.small, fontWeight: '700' },
  rejected: { ...type.tiny, color: colors.removed, marginTop: space.sm, lineHeight: 16 },
});
