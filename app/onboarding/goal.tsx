import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GOALS } from '@/data/catalog';
import { useProfile } from '@/store/useProfile';
import { colors, radius, space, type } from '@/theme';

export default function GoalScreen() {
  const router = useRouter();
  const { update } = useProfile();

  async function choose(goalType: (typeof GOALS)[number]['goalType']) {
    await update({ goalType });
    router.push('/onboarding/physique');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>ULTIMATE FITNESS</Text>
        <Text style={type.h1}>What are you here for?</Text>
        <Text style={styles.sub}>
          Pick the one that sounds most like you. You can change it later.
        </Text>

        <View style={styles.list}>
          {GOALS.map((g) => (
            <Pressable
              key={g.goalType}
              disabled={!g.available}
              onPress={() => choose(g.goalType)}
              accessibilityRole="button"
              accessibilityState={{ disabled: !g.available }}
              style={({ pressed }) => [
                styles.goal,
                !g.available && styles.goalOff,
                pressed && g.available && styles.goalPressed,
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.goalLabel, !g.available && styles.textOff]}>{g.label}</Text>
                <Text style={[styles.goalBlurb, !g.available && styles.textOff]}>{g.blurb}</Text>
              </View>
              {g.available ? (
                <Text style={styles.chevron}>›</Text>
              ) : (
                <View style={styles.soonPill}>
                  <Text style={styles.soonText}>COMING SOON</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        <Text style={styles.footnote}>
          Only “Stay healthy” is built out in this preview. The other journeys use the same
          structure — they're waiting on content from the gym.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, paddingBottom: space.xxl },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1.2,
    marginBottom: space.sm,
  },
  sub: { ...type.small, marginTop: space.sm, lineHeight: 20 },
  list: { marginTop: space.xl, gap: space.md },
  goal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  goalOff: { opacity: 0.55, backgroundColor: colors.bg },
  goalPressed: { borderColor: colors.accent },
  goalLabel: { ...type.h3 },
  goalBlurb: { ...type.small, marginTop: 3, lineHeight: 18 },
  textOff: { color: colors.textFaint },
  chevron: { color: colors.textMuted, fontSize: 24 },
  soonPill: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
  },
  soonText: { fontSize: 9, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.6 },
  footnote: { ...type.tiny, marginTop: space.xl, lineHeight: 16 },
});
