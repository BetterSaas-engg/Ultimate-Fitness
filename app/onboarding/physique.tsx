import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhysiquePicker } from '@/components/PhysiquePicker';
import { useProfile } from '@/store/useProfile';
import { colors, radius, space, type } from '@/theme';

export default function PhysiqueScreen() {
  const router = useRouter();
  const { update } = useProfile();
  const [current, setCurrent] = useState<number | undefined>();
  const [target, setTarget] = useState<number | undefined>();

  const ready = current !== undefined && target !== undefined;

  async function next() {
    await update({ physiqueCurrent: current, physiqueTarget: target });
    router.push('/onboarding/ready');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={type.h1}>Where are you now?</Text>
        <Text style={styles.sub}>Rough is fine. Nobody sees this but you.</Text>
        <PhysiquePicker value={current} onChange={setCurrent} tint={colors.swapped} />

        <View style={{ height: space.xl }} />

        <Text style={type.h1}>Where do you want to be?</Text>
        <Text style={styles.sub}>
          This is the “before and after” we'll show you in a few months.
        </Text>
        <PhysiquePicker value={target} onChange={setTarget} tint={colors.added} />

        <Pressable
          disabled={!ready}
          onPress={next}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.cta,
            !ready && styles.ctaOff,
            pressed && ready && { opacity: 0.85 },
          ]}
        >
          <Text style={[styles.ctaText, !ready && { color: colors.textFaint }]}>
            {ready ? 'Continue' : 'Pick both to continue'}
          </Text>
        </Pressable>

        <Text style={styles.footnote}>
          Physique is profile context only — it doesn't change which plan you get. Your goal does
          that.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, paddingBottom: space.xxl },
  sub: { ...type.small, marginTop: space.xs, marginBottom: space.sm, lineHeight: 20 },
  cta: {
    marginTop: space.xxl,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: space.lg,
    alignItems: 'center',
  },
  ctaOff: { backgroundColor: colors.surfaceAlt },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  footnote: { ...type.tiny, marginTop: space.lg, lineHeight: 16 },
});
