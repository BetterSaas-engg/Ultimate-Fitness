import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEFAULT_PROTEIN_TARGET_G, useProfile } from '@/store/useProfile';
import { ProteinTargetStepper } from '@/components/ProteinTargetStepper';
import { Logo } from '@/components/BrandHeader';
import { WORKOUT_PROGRAM } from '@/data/programs';
import { formatDateLong, todayKey } from '@/lib/date';
import { colors, radius, space, type } from '@/theme';

export default function ReadyScreen() {
  const router = useRouter();
  const { update } = useProfile();
  // Off by default: the bar targets the day's planned total unless a member
  // deliberately overrides it.
  const [useOverride, setUseOverride] = useState(false);
  const [proteinTarget, setProteinTarget] = useState(DEFAULT_PROTEIN_TARGET_G);

  async function start() {
    const start = todayKey();
    await update({
      startDate: start,
      proteinTargetG: useOverride ? proteinTarget : undefined,
      onboardedAt: new Date().toISOString(),
    });
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoWrap}>
          <Logo width={190} />
        </View>
        <Text style={styles.kicker}>YOUR FIRST 90 DAYS</Text>
        <Text style={type.h1}>Here's the plan</Text>

        <View style={styles.list}>
          <Step
            n="1"
            title="Train 3× a week"
            body={`${WORKOUT_PROGRAM.phases[0].name} for 4 weeks, then a lower / upper / full split. Free with your membership.`}
          />
          <Step
            n="2"
            title="Log what you do"
            body="Tick off sessions and meals. That's the whole tracking job — no weighing, no barcode scanning."
          />
          <Step
            n="3"
            title="See what's on at the gym"
            body="Today's classes show up on your daily plan, with the instructor and the time."
          />
          <Step
            n="4"
            title="Eat like the plan says"
            body="The 7-day meal plan is part of Nutrition Coaching, built by the Ultimate Fitness nutrition team. You'll get a taste of it for free."
          />
        </View>

        <View style={styles.targetBlock}>
          <View style={styles.targetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={type.h3}>Daily protein target</Text>
              <Text style={styles.targetHint}>
                By default you're aiming for whatever that day's plan adds up to. Set your own
                number only if your trainer gave you one.
              </Text>
            </View>
            <Switch
              value={useOverride}
              onValueChange={setUseOverride}
              trackColor={{ true: colors.accent, false: colors.surfaceAlt }}
              accessibilityLabel="Set my own protein target"
            />
          </View>
          {useOverride && (
            <ProteinTargetStepper value={proteinTarget} onChange={setProteinTarget} />
          )}
        </View>

        <Pressable onPress={start} accessibilityRole="button" style={styles.cta}>
          <Text style={styles.ctaText}>Start today</Text>
        </Pressable>
        <Text style={styles.footnote}>Day 1 is {formatDateLong(todayKey())}.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.num}>
        <Text style={styles.numText}>{n}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={type.h3}>{title}</Text>
        <Text style={styles.stepBody}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, paddingBottom: space.xxl },
  logoWrap: { marginBottom: space.xl },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accentInk,
    letterSpacing: 1.2,
    marginBottom: space.sm,
  },
  list: { marginTop: space.xl, gap: space.lg },
  step: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  num: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { color: colors.accentInk, fontWeight: '800', fontSize: 14 },
  stepBody: { ...type.small, marginTop: 3, lineHeight: 19 },
  targetBlock: {
    marginTop: space.xxl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
  },
  targetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  targetHint: { ...type.small, lineHeight: 19, marginTop: space.xs },
  cta: {
    marginTop: space.xl,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: space.lg,
    alignItems: 'center',
  },
  ctaText: { color: colors.onAccent, fontWeight: '700', fontSize: 16 },
  footnote: { ...type.tiny, marginTop: space.md, textAlign: 'center' },
});
