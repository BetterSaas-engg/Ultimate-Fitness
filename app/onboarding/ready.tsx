import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  const [proteinTarget, setProteinTarget] = useState(DEFAULT_PROTEIN_TARGET_G);

  async function start() {
    const start = todayKey();
    await update({
      startDate: start,
      proteinTargetG: proteinTarget,
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
            body="Today's classes show up on your daily plan, with the instructor's name."
          />
          <Step
            n="4"
            title="Eat like the plan says"
            body="The 7-day meal plan is part of Nutrition Coaching. You'll get a taste of it for free."
          />
        </View>

        <View style={styles.targetBlock}>
          <Text style={type.h3}>Daily protein target</Text>
          <Text style={styles.targetHint}>
            {DEFAULT_PROTEIN_TARGET_G}g is a sensible starting point. A trainer will tune it once
            they've met you.
          </Text>
          <ProteinTargetStepper value={proteinTarget} onChange={setProteinTarget} />
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
    color: colors.accent,
    letterSpacing: 1.2,
    marginBottom: space.sm,
  },
  list: { marginTop: space.xl, gap: space.lg },
  step: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  num: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { color: colors.accent, fontWeight: '800', fontSize: 13 },
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
  targetHint: { ...type.small, lineHeight: 19, marginTop: -space.sm },
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
