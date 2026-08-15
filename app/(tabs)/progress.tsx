import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Section } from '@/components/Section';
import { UpsellCard } from '@/components/UpsellCard';
import { ProteinTargetStepper } from '@/components/ProteinTargetStepper';
import { BrandHeader } from '@/components/BrandHeader';
import { WeekProteinChart } from '@/components/WeekProteinChart';
import { StreakCalendar } from '@/components/StreakCalendar';

import { useLog } from '@/store/useLog';
import { DEFAULT_PROTEIN_TARGET_G, useProfile } from '@/store/useProfile';
import { useSubstitutions } from '@/store/useSubstitutions';
import { useExerciseSwaps } from '@/store/useExerciseSwaps';
import { useAdminEdits } from '@/store/useAdminEdits';
import { clearMilestones } from '@/store/useMilestones';
import { clearNotes, useNotes } from '@/store/useNotes';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { ConfirmDialog } from '@/components/admin/AdminChrome';
import { useStreak } from '@/store/useStreak';
import { addDays, daysBetween, programDayIndex, todayKey } from '@/lib/date';
import { colors, radius, space, touch, type } from '@/theme';

export default function ProgressScreen() {
  const router = useRouter();
  const { profile, update, reset } = useProfile();
  const { log, clear } = useLog();
  // Open by default: the role switcher lives in here, and hiding the demo's
  // most-used control behind a collapsed section is the problem, not the fix.
  const [showDemo, setShowDemo] = useState(true);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const dateKey = addDays(todayKey(), profile?.demoDayOffset ?? 0);
  const { clearAll: clearSubs } = useSubstitutions(dateKey);
  const { clearAll: clearSwaps } = useExerciseSwaps(dateKey);
  const { revertAll: revertAdminEdits } = useAdminEdits();
  const { streak, activeDays } = useStreak(log, dateKey);
  // The member's own notes, whatever role is currently being previewed - this
  // is the member surface. Staff notes live in the admin area.
  const { notes } = useNotes('member');
  const programDay = profile ? programDayIndex(profile.startDate, dateKey) : 1;

  return (
    <SafeAreaView style={styles.safe}>
      <BrandHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={type.h1}>Progress</Text>

        <View style={styles.stats}>
          <Stat value={String(streak)} label="day streak" big />
          <Stat value={String(activeDays)} label="days active" />
          <Stat value={String(programDay)} label="day of program" />
        </View>

        {streak === 0 ? (
          <Text style={styles.nudge}>
            Log one thing today — a meal or a session — and the streak starts.
          </Text>
        ) : (
          <Text style={styles.nudge}>
            {streak} day{streak === 1 ? '' : 's'} in a row. This is the part that actually works.
          </Text>
        )}

        <View style={{ marginTop: space.xl, gap: space.md }}>
          <StreakCalendar today={dateKey} />
          <WeekProteinChart today={dateKey} />
        </View>

        <Section title="Notes" subtitle="For your next check-in">
          <Pressable
            onPress={() => router.push('/notes')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.notesCard, pressed && { opacity: 0.8 }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={type.body}>
                {notes.length === 0
                  ? 'Start a note'
                  : `${notes.length} note${notes.length === 1 ? '' : 's'}`}
              </Text>
              <Text style={styles.notesHint} numberOfLines={1}>
                {notes.length === 0
                  ? 'Things to ask, how the week felt'
                  : (notes[0].title ?? notes[0].body)}
              </Text>
            </View>
            <Text style={styles.notesChevron}>›</Text>
          </Pressable>
        </Section>

        <Section
          title="Daily protein target"
          subtitle="By default the bar aims at whatever that day's plan adds up to"
        >
          <View style={styles.targetCard}>
            <View style={styles.targetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={type.body}>Set my own target</Text>
                <Text style={type.tiny}>Only if your trainer gave you a number</Text>
              </View>
              <Switch
                value={typeof profile?.proteinTargetG === 'number'}
                onValueChange={(v) =>
                  update({ proteinTargetG: v ? DEFAULT_PROTEIN_TARGET_G : undefined })
                }
                trackColor={{ true: colors.accent, false: colors.surfaceAlt }}
              />
            </View>
            {typeof profile?.proteinTargetG === 'number' && (
              <ProteinTargetStepper
                value={profile.proteinTargetG}
                onChange={(v) => update({ proteinTargetG: v })}
              />
            )}
          </View>
        </Section>

        <Section title="From the gym">
          <UpsellCard
            title="Your first free session with a trainer"
            body="You've shown up. One of the Ultimate Fitness trainers will walk you through the machines and fix your form — no charge, no sales pitch."
            cta="Book at the front desk"
          />
        </Section>

        {/* ---- demo controls -------------------------------------- */}
        <Section title="Demo controls" subtitle="Not part of the member experience">
          <Pressable onPress={() => setShowDemo((s) => !s)} style={styles.toggleRow}>
            <Text style={type.body}>{showDemo ? 'Hide' : 'Show'} demo controls</Text>
            <Text style={styles.chevron}>{showDemo ? '▾' : '▸'}</Text>
          </Pressable>

          {showDemo && profile && (
            <View style={styles.demo}>
              <View>
                <Text style={type.body}>Viewing as</Text>
                <Text style={type.tiny}>
                  Switches straight to that role's home. Nothing is cleared — your log, streak,
                  notes and edits all stay.
                </Text>
                <View style={{ marginTop: space.sm }}>
                  <RoleSwitcher />
                </View>
                <Pressable
                  onPress={() => router.push('/?pick=1')}
                  accessibilityRole="button"
                  style={styles.switchRole}
                >
                  <Text style={styles.switchRoleText}>Back to the role picker</Text>
                </Pressable>
              </View>

              <View style={styles.demoRow}>
                <View style={{ flex: 1 }}>
                  <Text style={type.body}>Nutrition Coaching unlocked</Text>
                  <Text style={type.tiny}>Flip to premium to show the full meal plan</Text>
                </View>
                <Switch
                  value={profile.tier === 'premium'}
                  onValueChange={(v) => update({ tier: v ? 'premium' : 'free' })}
                  trackColor={{ true: colors.premium, false: colors.surfaceAlt }}
                />
              </View>

              <View style={styles.demoRow}>
                <View style={{ flex: 1 }}>
                  <Text style={type.body}>Jump to day {programDay}</Text>
                  <Text style={type.tiny}>Day 8+ shows the week-2 progression</Text>
                </View>
              </View>
              <View style={styles.jumpRow}>
                {[1, 4, 8, 11, 15, 22].map((d) => (
                  <Pressable
                    key={d}
                    // Offset is relative to today, but program day counts from
                    // the start date - which is only the same thing on day one.
                    onPress={() =>
                      update({ demoDayOffset: d - 1 - daysBetween(profile.startDate, todayKey()) })
                    }
                    style={[styles.jump, programDay === d && styles.jumpOn]}
                  >
                    <Text style={[styles.jumpText, programDay === d && styles.jumpTextOn]}>
                      {d}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Deliberately unlike the role switcher above it. Switching role
                  keeps everything; this throws it all away, and mid-demo the
                  two must not be mistakable for one another. */}
              <View style={styles.reset}>
                <Text style={styles.resetTitle}>Danger zone</Text>
                <Text style={type.tiny}>
                  Wipes the log, streak, milestones, notes and every trainer and nutritionist edit.
                  Not the same as switching role.
                </Text>
                <Pressable
                  onPress={() => setConfirmingReset(true)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.resetBtn, pressed && { opacity: 0.8 }]}
                >
                  <Text style={styles.resetText}>Reset all data</Text>
                </Pressable>
              </View>
            </View>
          )}
        </Section>
      </ScrollView>

      <ConfirmDialog
        visible={confirmingReset}
        title="Reset all data?"
        body="The log, streak, milestones, notes and every trainer and nutritionist edit go. The gym's own content is untouched. There is no undo."
        confirmLabel="Reset all data"
        destructive
        onCancel={() => setConfirmingReset(false)}
        onConfirm={async () => {
          setConfirmingReset(false);
          await clearSubs();
          await clearSwaps();
          await revertAdminEdits();
          await clear();
          // Otherwise "start over" leaves every milestone suppressed and the
          // first-meal moment never fires again.
          await clearMilestones();
          await clearNotes();
          await reset();
          router.replace('/');
        }}
      />
    </SafeAreaView>
  );
}

function Stat({ value, label, big }: { value: string; label: string; big?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, big && { color: colors.accentInk }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, paddingBottom: space.xxl },
  stats: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.lg,
    alignItems: 'center',
  },
  statValue: { fontSize: 28, fontWeight: '800', color: colors.text },
  statLabel: { ...type.tiny, marginTop: 2, textAlign: 'center' },
  nudge: { ...type.small, color: colors.text, marginTop: space.lg, lineHeight: 20 },

  switchRole: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minHeight: touch.min,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: space.sm,
  },
  switchRoleText: { ...type.small, color: colors.accentInk, fontWeight: '700' },
  notesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.lg,
    minHeight: touch.min,
  },
  notesHint: { ...type.tiny, marginTop: 2 },
  notesChevron: { color: colors.textMuted, fontSize: 22 },

  targetHeader: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  targetCard: {
    gap: space.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.lg,
  },
  chevron: { color: colors.textMuted },
  demo: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.lg,
    gap: space.lg,
  },
  demoRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  jumpRow: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  jump: {
    width: 46,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jumpOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  jumpText: { ...type.small, fontWeight: '700' },
  jumpTextOn: { color: colors.onAccent },
  reset: {
    borderWidth: 1,
    borderColor: colors.increased,
    borderRadius: radius.md,
    backgroundColor: colors.increasedSoft,
    padding: space.lg,
    gap: space.sm,
  },
  resetTitle: { ...type.h3, color: colors.increasedInk },
  resetBtn: {
    borderWidth: 1,
    borderColor: colors.increasedInk,
    borderRadius: radius.md,
    minHeight: touch.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: { ...type.small, color: colors.increasedInk, fontWeight: '800' },
});
