import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MealCard } from '@/components/MealCard';
import { WorkoutCard } from '@/components/WorkoutCard';
import { ClassRow } from '@/components/ClassRow';
import { UpsellCard } from '@/components/UpsellCard';
import { Section } from '@/components/Section';
import { BrandHeader } from '@/components/BrandHeader';
import { ProteinBar } from '@/components/ProteinBar';

import { classesOn } from '@/data/classes';
import { getNutritionForDay, getWorkoutForDay, NUTRITION_PHASES } from '@/data/programs';
import { diffForDay } from '@/data/changes';
import { tierAllows } from '@/data/catalog';
import { NUTRITION_PROGRAM } from '@/data/programs';

import { mealEntryId, useLog, WORKOUT_ENTRY } from '@/store/useLog';
import { useProfile, DEFAULT_PROTEIN_TARGET_G } from '@/store/useProfile';
import { useSubstitutions } from '@/store/useSubstitutions';
import { useAdminEdits } from '@/store/useAdminEdits';
import { applyNutritionDayEdits, applySessionEdits, itemIsEstimated, phaseStillPlaceholder } from '@/data/adminOverlay';
import { anyEstimated, loggedMacros, plannedMacros } from '@/lib/macros';
import { addDays, dayOfWeekOf, formatDateLong, programDayIndex, todayKey } from '@/lib/date';
import { colors, radius, space, type } from '@/theme';

export default function TodayScreen() {
  const router = useRouter();
  const { profile, loading } = useProfile();
  const { toggle, isLogged } = useLog();

  // The demo offset shifts the whole day - both clocks move together, so a
  // jump to week 2 also shows that date's real classes.
  const dateKey = useMemo(
    () => addDays(todayKey(), profile?.demoDayOffset ?? 0),
    [profile?.demoDayOffset]
  );

  const { substitutions, substitute, restore } = useSubstitutions(dateKey);
  const { edits } = useAdminEdits();

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.accent} style={{ marginTop: space.xxl }} />
      </SafeAreaView>
    );
  }

  const programDay = programDayIndex(profile.startDate, dateKey);
  const rawWorkout = getWorkoutForDay(programDay);
  const rawNutrition = getNutritionForDay(programDay);

  // Admin edits overlay the seed here, so a nutritionist's change is on this
  // screen the moment you switch role - no reload, no seed mutation.
  const workout =
    rawWorkout && rawWorkout.session
      ? { ...rawWorkout, session: applySessionEdits(rawWorkout.session, rawWorkout.phase.phaseId, edits) }
      : rawWorkout;
  const nutrition = rawNutrition
    ? { ...rawNutrition, day: applyNutritionDayEdits(rawNutrition.day, rawNutrition.phase.phaseId, edits) }
    : rawNutrition;
  const todaysClasses = classesOn(dayOfWeekOf(dateKey));

  const nutritionUnlocked = tierAllows(profile.tier, NUTRITION_PROGRAM.tier);

  // Week 2 items are highlighted against week 1.
  const dayDiff =
    nutrition && nutrition.phaseIndex > 0
      ? diffForDay(NUTRITION_PHASES[nutrition.phaseIndex - 1], nutrition.phase, nutrition.dayInPhase)
      : null;

  // Free members see the protein bar for the one meal they actually have, so
  // the number stays truthful about what's on their screen.
  const visibleMeals = !nutrition
    ? []
    : nutritionUnlocked
      ? nutrition.day.meals
      : nutrition.day.meals.slice(0, 1);

  const proteinTarget = profile.proteinTargetG ?? DEFAULT_PROTEIN_TARGET_G;
  const planned = plannedMacros(visibleMeals, substitutions);
  const eaten = loggedMacros(visibleMeals, substitutions, (slot) =>
    isLogged(dateKey, mealEntryId(slot))
  );

  return (
    <SafeAreaView style={styles.safe}>
      <BrandHeader right={`Day ${programDay}`} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={type.h1}>{formatDateLong(dateKey)}</Text>
        {(workout?.beyondProgram || nutrition?.beyondProgram) && (
          <Text style={styles.beyond}>
            You're past the content we have. Repeating the last block until the gym adds more.
          </Text>
        )}

        {visibleMeals.length > 0 && (
          <View style={{ marginTop: space.lg }}>
            <ProteinBar
              logged={eaten.protein}
              planned={planned.protein}
              target={proteinTarget}
              estimated={visibleMeals.some((m) => m.items.some((i) => itemIsEstimated(i, edits)))}
            />
          </View>
        )}

        {workout && (
          <Section title="Your workout" subtitle={workout.phase.phaseId.replace('-', ' ')}>
            <WorkoutCard
              today={workout}
              logged={isLogged(dateKey, WORKOUT_ENTRY)}
              onToggle={
                workout.kind === 'session' ? () => toggle(dateKey, WORKOUT_ENTRY) : undefined
              }
            />
          </Section>
        )}

        {nutrition && (
          <Section
            title="Your meals"
            subtitle={
              nutritionUnlocked
                ? `Week ${nutrition.phaseIndex + 1}, day ${nutrition.dayInPhase}`
                : 'Nutrition Coaching · preview'
            }
          >
            {nutritionUnlocked ? (
              nutrition.day.meals.map((meal) => (
                <MealCard
                  key={meal.slot}
                  meal={meal}
                  diff={dayDiff?.meals.find((m) => m.slot === meal.slot)}
                  logged={isLogged(dateKey, mealEntryId(meal.slot))}
                  onToggle={() => toggle(dateKey, mealEntryId(meal.slot))}
                  substitutions={substitutions}
                  onSubstitute={substitute}
                  onRestore={restore}
                />
              ))
            ) : (
              <>
                {/* Free members get one real meal, not a blurred screenshot.
                    The taste is what makes the upsell land. */}
                <MealCard
                  meal={nutrition.day.meals[0]}
                  diff={dayDiff?.meals.find((m) => m.slot === nutrition.day.meals[0].slot)}
                  logged={isLogged(dateKey, mealEntryId(nutrition.day.meals[0].slot))}
                  onToggle={() => toggle(dateKey, mealEntryId(nutrition.day.meals[0].slot))}
                  substitutions={substitutions}
                  onSubstitute={substitute}
                  onRestore={restore}
                />
                <View style={styles.locked}>
                  <Text style={styles.lockedTitle}>
                    {nutrition.day.meals.length - 1} more meals today
                  </Text>
                  <Text style={styles.lockedBody}>
                    The full 7-day plan — every meal, every portion, with prep notes — comes with
                    Nutrition Coaching.
                  </Text>
                </View>
                <UpsellCard
                  title="Unlock the full meal plan"
                  body="Sheena and the team build these week by week. Week 2 steps your portions up and adds complex carbs."
                  cta="Talk to the front desk"
                  onPress={() => router.push('/(tabs)/progress')}
                />
              </>
            )}
          </Section>
        )}

        <Section title="Today at the gym" subtitle="Drop in — no booking through the app">
          <View style={styles.classes}>
            {todaysClasses.length === 0 ? (
              <Text style={type.small}>No classes on the schedule today.</Text>
            ) : (
              todaysClasses.map((c) => <ClassRow key={c.id} gymClass={c} />)
            )}
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, paddingBottom: space.xxl },
  beyond: { ...type.small, color: colors.increased, marginTop: space.sm },
  locked: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    padding: space.lg,
    alignItems: 'center',
    gap: space.xs,
  },
  lockedTitle: { ...type.h3, color: colors.textMuted },
  lockedBody: { ...type.small, textAlign: 'center', lineHeight: 19 },
  classes: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
});
