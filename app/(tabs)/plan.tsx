import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MealCard } from '@/components/MealCard';
import { ClassRow } from '@/components/ClassRow';
import { WhatsNewPanel } from '@/components/WhatsNewPanel';
import { PlaceholderBadge } from '@/components/PlaceholderBadge';
import { BrandHeader } from '@/components/BrandHeader';

import { NUTRITION_PHASES, NUTRITION_PROGRAM, WORKOUT_PHASES, WORKOUT_PROGRAM } from '@/data/programs';
import { diffPhases } from '@/data/changes';
import { CLASSES } from '@/data/classes';
import { weekdayName } from '@/lib/date';
import { colors, radius, space, type } from '@/theme';

type Tab = 'meals' | 'workouts' | 'classes';

export default function PlanScreen() {
  const [tab, setTab] = useState<Tab>('meals');

  return (
    <SafeAreaView style={styles.safe}>
      <BrandHeader />
      <View style={styles.header}>
        <Text style={type.h1}>The plan</Text>
        <View style={styles.segments}>
          {(['meals', 'workouts', 'classes'] as Tab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t }}
              style={[styles.segment, tab === t && styles.segmentOn]}
            >
              <Text style={[styles.segmentText, tab === t && styles.segmentTextOn]}>
                {t[0].toUpperCase() + t.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {tab === 'meals' && <MealsTab />}
      {tab === 'workouts' && <WorkoutsTab />}
      {tab === 'classes' && <ClassesTab />}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */

function MealsTab() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const phase = NUTRITION_PHASES[phaseIndex];
  const prev = phaseIndex > 0 ? NUTRITION_PHASES[phaseIndex - 1] : undefined;

  const diff = useMemo(() => (prev ? diffPhases(prev, phase) : null), [prev, phase]);

  const summary = NUTRITION_PROGRAM.phases.find((p) => p.phaseId === phase.phaseId)
    ?.progressionSummary;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.weekPicker}>
        {NUTRITION_PHASES.map((p, i) => (
          <Pressable
            key={p.phaseId}
            onPress={() => setPhaseIndex(i)}
            accessibilityRole="button"
            style={[styles.week, phaseIndex === i && styles.weekOn]}
          >
            <Text style={[styles.weekText, phaseIndex === i && styles.weekTextOn]}>
              Week {i + 1}
            </Text>
          </Pressable>
        ))}
      </View>

      {!phase.verified && (
        <Text style={styles.unverified}>
          Week 1 was reconstructed from a blurry photo — spot-check it with the gym before anyone
          relies on it.
        </Text>
      )}

      {diff && (
        <View style={{ marginBottom: space.lg }}>
          <WhatsNewPanel diff={diff} summary={summary} />
        </View>
      )}

      {phase.days.map((day) => {
        const dayDiff = diff?.days.find((d) => d.day === day.day);
        return (
          <View key={day.day} style={styles.dayBlock}>
            <View style={styles.dayHeader}>
              <Text style={type.h2}>Day {day.day}</Text>
              {dayDiff?.hasChanges && <Text style={styles.dayChanged}>CHANGED</Text>}
            </View>
            <View style={{ gap: space.md }}>
              {day.meals.map((meal) => (
                <MealCard
                  key={meal.slot}
                  meal={meal}
                  diff={dayDiff?.meals.find((m) => m.slot === meal.slot)}
                />
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ */

function WorkoutsTab() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <PlaceholderBadge />

      {WORKOUT_PHASES.map((phase, i) => {
        const meta = WORKOUT_PROGRAM.phases[i];
        return (
          <View key={phase.phaseId} style={styles.dayBlock}>
            <Text style={type.h2}>{meta?.name ?? phase.phaseId}</Text>
            <Text style={styles.phaseMeta}>
              {phase.durationWeeks} weeks · {phase.sessionsPerWeek} sessions a week
            </Text>
            {meta?.progressionSummary && (
              <Text style={styles.phaseSummary}>{meta.progressionSummary}</Text>
            )}

            <View style={{ gap: space.md, marginTop: space.md }}>
              {phase.days.map((session) => (
                <View key={session.day} style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <Text style={type.h3}>{session.label}</Text>
                    <PlaceholderBadge compact />
                  </View>
                  {session.exercises.map((ex, k) => (
                    <View key={`${ex.name}-${k}`} style={styles.exRow}>
                      <Text style={styles.exName}>{ex.name}</Text>
                      <Text style={styles.exDose}>
                        {ex.sets ? `${ex.sets} × ` : ''}
                        {ex.reps ?? ''}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ */

function ClassesTab() {
  const byDay = useMemo(() => {
    const groups: Record<number, typeof CLASSES> = {};
    for (const c of CLASSES) (groups[c.dayOfWeek] ??= []).push(c);
    for (const k of Object.keys(groups)) {
      groups[Number(k)].sort((a, b) => a.time.localeCompare(b.time));
    }
    return groups;
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.classesIntro}>
        The gym's weekly schedule. Read-only — drop in, or ask the front desk about anything marked
        pre-reg.
      </Text>
      {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
        const list = byDay[dow] ?? [];
        if (list.length === 0) return null;
        return (
          <View key={dow} style={styles.dayBlock}>
            <Text style={type.h2}>{weekdayName(dow)}</Text>
            <View style={styles.classes}>
              {list.map((c) => (
                <ClassRow key={c.id} gymClass={c} />
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: space.xl, paddingTop: space.lg, gap: space.md },
  content: { padding: space.xl, paddingBottom: space.xxl },

  segments: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 3,
    gap: 3,
  },
  segment: { flex: 1, paddingVertical: space.sm, borderRadius: radius.sm, alignItems: 'center' },
  segmentOn: { backgroundColor: colors.surfaceAlt },
  segmentText: { ...type.small, fontWeight: '600' },
  segmentTextOn: { color: colors.text },

  weekPicker: { flexDirection: 'row', gap: space.sm, marginBottom: space.lg },
  week: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  weekText: { ...type.small, fontWeight: '700' },
  weekTextOn: { color: colors.onAccent },

  unverified: { ...type.small, color: colors.increased, marginBottom: space.lg, lineHeight: 18 },

  dayBlock: { marginBottom: space.xl },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.md },
  dayChanged: { fontSize: 10, fontWeight: '800', color: colors.accent, letterSpacing: 0.8 },

  phaseMeta: { ...type.small, marginTop: 2 },
  phaseSummary: { ...type.small, color: colors.text, marginTop: space.sm, lineHeight: 19 },
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  exRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  exName: { ...type.body, flex: 1 },
  exDose: { ...type.small },

  classesIntro: { ...type.small, marginBottom: space.lg, lineHeight: 19 },
  classes: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    marginTop: space.md,
  },
});
