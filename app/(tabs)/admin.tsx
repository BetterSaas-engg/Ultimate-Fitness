import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminBar, AdminHeading, AdminRow, ConfirmDialog, Pill } from '@/components/admin/AdminChrome';
import { BrandHeader } from '@/components/BrandHeader';
import { useProfile } from '@/store/useProfile';
import { useAdminEdits } from '@/store/useAdminEdits';
import { NUTRITION_PHASES, NUTRITION_PROGRAM, WORKOUT_PHASES, WORKOUT_PROGRAM } from '@/data/programs';
import { SUBSTITUTION_GROUPS } from '@/data/substitutions';
import { itemIsEstimated, phaseConfirmedCount, swapGroupStatus } from '@/data/adminOverlay';
import { colors, radius, space, type } from '@/theme';

/** Hub. What you see depends on the role - trainers never see meal editing. */
export default function AdminHub() {
  const router = useRouter();
  const { profile } = useProfile();
  const { edits, total, revertAll } = useAdminEdits();
  const [confirming, setConfirming] = useState(false);

  const role = profile?.role ?? 'member';

  if (role === 'member') {
    return (
      <SafeAreaView style={styles.safe}>
        <BrandHeader />
        <View style={styles.content}>
          <Text style={type.small}>Switch to Trainer or Nutritionist on the Progress tab.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Outstanding review counts, so the hub says what still needs doing.
  const pendingMacros = countPendingMacroGroups(edits);
  const pendingSwaps = SUBSTITUTION_GROUPS.filter(
    (g) => swapGroupStatus(g.groupId, edits) === 'pending'
  ).length;

  return (
    <SafeAreaView style={styles.safe}>
      <AdminBar role={role} />
      <ScrollView contentContainerStyle={styles.content}>
        <AdminHeading
          title={role === 'trainer' ? 'Trainer' : 'Nutritionist'}
          subtitle={
            role === 'trainer'
              ? 'View and edit the workout phases. Edits are saved on this device and show up on the member app straight away.'
              : 'View and edit your nutrition programs, and sign off on macros and swap groups.'
          }
        />

        {role === 'trainer' && (
          <View style={styles.list}>
            <AdminRow
              label={WORKOUT_PROGRAM.name}
              value={`${WORKOUT_PHASES.length} phases · ${WORKOUT_PHASES.reduce((n, p) => n + p.days.length, 0)} session templates`}
              meta={trainerMeta(edits)}
              onPress={() => router.push('/admin/workout')}
            />
          </View>
        )}

        {role === 'nutritionist' && (
          <View style={styles.list}>
            <AdminRow
              label={NUTRITION_PROGRAM.name}
              value={`${NUTRITION_PHASES.length} weeks · ${NUTRITION_PHASES.reduce((n, p) => n + p.days.length, 0)} days`}
              onPress={() => router.push('/admin/nutrition')}
            />
            <AdminRow
              label="Review macros"
              value="Sign off on estimated values, grouped by food and serving"
              onPress={() => router.push('/admin/nutrition/macros')}
              right={
                pendingMacros > 0 ? (
                  <Pill text={`${pendingMacros} TO REVIEW`} tone="warn" />
                ) : (
                  <Pill text="ALL APPROVED" tone="ok" />
                )
              }
            />
            <AdminRow
              label="Review swap groups"
              value="Approve or reject each group of substitutions"
              onPress={() => router.push('/admin/nutrition/swaps')}
              right={
                pendingSwaps > 0 ? (
                  <Pill text={`${pendingSwaps} PENDING`} tone="warn" />
                ) : (
                  <Pill text="REVIEWED" tone="ok" />
                )
              }
            />
          </View>
        )}

        <View style={styles.revertBlock}>
          <Text style={type.h3}>Revert all edits</Text>
          <Text style={styles.revertBody}>
            {total === 0
              ? 'No edits yet. The app is showing the gym’s content exactly as supplied.'
              : `${total} override${total === 1 ? '' : 's'} across trainer and nutritionist. The seed content is never changed, so reverting restores it exactly.`}
          </Text>
          <Pressable
            onPress={() => setConfirming(true)}
            disabled={total === 0}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.revertBtn,
              total === 0 && { opacity: 0.4 },
              pressed && total > 0 && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.revertBtnText}>Revert everything</Text>
          </Pressable>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirming}
        title="Revert all edits?"
        body="This clears all trainer and nutritionist edits — continue?"
        confirmLabel="Revert everything"
        destructive
        onCancel={() => setConfirming(false)}
        onConfirm={async () => {
          await revertAll();
          setConfirming(false);
        }}
      />
    </SafeAreaView>
  );
}

function trainerMeta(edits: ReturnType<typeof useAdminEdits>['edits']) {
  const parts = WORKOUT_PHASES.map((p) => {
    const { total, confirmed } = phaseConfirmedCount(p, edits);
    return `${p.phaseId}: ${confirmed}/${total} confirmed real`;
  });
  return parts.join(' · ');
}

/** Distinct food+serving groups that still carry an unapproved estimate. */
function countPendingMacroGroups(edits: ReturnType<typeof useAdminEdits>['edits']) {
  const pending = new Set<string>();
  for (const phase of NUTRITION_PHASES)
    for (const day of phase.days)
      for (const meal of day.meals)
        for (const item of meal.items)
          if (itemIsEstimated(item, edits))
            pending.add(`${item.food}|${item.qty ?? ''}|${item.unit ?? ''}`);
  return pending.size;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, paddingBottom: space.xxl },
  list: { gap: space.md },
  revertBlock: {
    marginTop: space.xxl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: space.xl,
    gap: space.sm,
  },
  revertBody: { ...type.small, lineHeight: 19 },
  revertBtn: {
    marginTop: space.sm,
    borderWidth: 1,
    borderColor: colors.increased,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  revertBtnText: { color: colors.increased, fontWeight: '700', fontSize: 15 },
});
