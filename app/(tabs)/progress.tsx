import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Section } from '@/components/Section';
import { UpsellCard } from '@/components/UpsellCard';
import { ProteinTargetStepper } from '@/components/ProteinTargetStepper';
import { BrandHeader } from '@/components/BrandHeader';

import { useLog } from '@/store/useLog';
import { DEFAULT_PROTEIN_TARGET_G, useProfile } from '@/store/useProfile';
import { useSubstitutions } from '@/store/useSubstitutions';
import { useExerciseSwaps } from '@/store/useExerciseSwaps';
import { useAdminEdits } from '@/store/useAdminEdits';
import { ROLES } from '@/types/admin';
import { useStreak } from '@/store/useStreak';
import { addDays, daysBetween, programDayIndex, todayKey } from '@/lib/date';
import { colors, radius, space, touch, type } from '@/theme';

export default function ProgressScreen() {
  const router = useRouter();
  const { profile, update, reset } = useProfile();
  const { log, clear } = useLog();
  const [showDemo, setShowDemo] = useState(false);

  const dateKey = addDays(todayKey(), profile?.demoDayOffset ?? 0);
  const { clearAll: clearSubs } = useSubstitutions(dateKey);
  const { clearAll: clearSwaps } = useExerciseSwaps(dateKey);
  const { revertAll: revertAdminEdits } = useAdminEdits();
  const { streak, activeDays } = useStreak(log, dateKey);
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

        <Section
          title="Demo mode"
          subtitle="No login behind this — role switching exists for this preview only"
        >
          <Pressable
            onPress={() => router.push('/?pick=1')}
            accessibilityRole="button"
            style={styles.switchRole}
          >
            <Text style={styles.switchRoleText}>Back to the role picker</Text>
          </Pressable>
          <View style={styles.roleCard}>
            {ROLES.map((r) => {
              const active = (profile?.role ?? 'member') === r.role;
              return (
                <Pressable
                  key={r.role}
                  onPress={() => update({ role: r.role })}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={[styles.role, active && styles.roleOn]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[type.body, active && { fontWeight: '700' }]}>{r.label}</Text>
                    <Text style={type.tiny}>{r.blurb}</Text>
                  </View>
                  {active ? <Text style={styles.roleMark}>●</Text> : null}
                </Pressable>
              );
            })}
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

              <Pressable
                onPress={async () => {
                  await clearSubs();
                  await clearSwaps();
                  await revertAdminEdits();
                  await clear();
                  await reset();
                  router.replace('/');
                }}
                style={styles.reset}
              >
                <Text style={styles.resetText}>Reset everything and start over</Text>
              </Pressable>
            </View>
          )}
        </Section>
      </ScrollView>
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
    marginBottom: space.sm,
  },
  switchRoleText: { ...type.small, color: colors.accentInk, fontWeight: '700' },
  roleCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.sm,
    gap: 2,
  },
  role: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    borderRadius: radius.md,
  },
  roleOn: { backgroundColor: colors.accentSoft },
  roleMark: { color: colors.accentInk, fontSize: 14 },
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: space.lg,
  },
  resetText: { ...type.small, color: colors.increasedInk, fontWeight: '700' },
});
