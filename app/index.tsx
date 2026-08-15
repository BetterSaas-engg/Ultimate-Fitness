import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Logo } from '@/components/BrandHeader';
import { useProfile } from '@/store/useProfile';
import { homeForRole } from '@/lib/roleHome';
import { ROLES } from '@/types/admin';
import type { Role } from '@/types/admin';
import { colors, gradients, radius, shadow, space, touch, type } from '@/theme';

/**
 * Role-first entry. The app opens by asking who you are, rather than dropping
 * straight into the member experience with the admin sides hidden behind a
 * settings toggle.
 *
 * Still demo-only: no auth, and the screen says so.
 *
 * Routing once a role exists:
 *   member  -> onboarding, or straight to Today if already onboarded
 *   staff   -> the admin hub
 * Pass ?pick=1 to force the picker back up for someone who wants to switch.
 */
export default function Entry() {
  const router = useRouter();
  const { profile, loading, update } = useProfile();
  const { pick } = useLocalSearchParams<{ pick?: string }>();
  const forcePicker = pick === '1';

  const role = profile?.role;
  const settled = !loading && Boolean(role) && !forcePicker;

  useEffect(() => {
    if (!settled || !role) return;
    router.replace(homeForRole(role, Boolean(profile?.onboardedAt)));
  }, [settled, role, profile?.onboardedAt, router]);

  async function choose(next: Role) {
    await update({ role: next });
    router.replace(homeForRole(next, Boolean(profile?.onboardedAt)));
  }

  if (loading || settled) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accentInk} />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <LinearGradient
        colors={gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <SafeAreaView edges={['top']}>
          <Logo width={200} />
          <Text style={styles.heroTitle}>Who's using the app?</Text>
          <Text style={styles.heroSub}>
            Pick a side to explore. You can switch at any time.
          </Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {ROLES.map((r) => (
          <Pressable
            key={r.role}
            onPress={() => choose(r.role)}
            accessibilityRole="button"
            accessibilityLabel={`Continue as ${r.label}`}
            style={({ pressed }) => [styles.card, shadow.card, pressed && styles.cardPressed]}
          >
            <View style={[styles.glyphWrap, r.role !== 'member' && styles.glyphStaff]}>
              <Text style={styles.glyph}>{GLYPH[r.role]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{r.label}</Text>
              <Text style={styles.cardBlurb}>{r.blurb}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}

        <Text style={styles.footnote}>
          Demo mode — there's no login behind these. Switching role is for this preview only.
        </Text>
      </ScrollView>
    </View>
  );
}

const GLYPH: Record<Role, string> = {
  member: '◉',
  trainer: '▲',
  nutritionist: '✽',
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },

  hero: { paddingHorizontal: space.xl, paddingBottom: space.xxl },
  heroTitle: { fontSize: 32, fontWeight: '800', color: colors.onDark, marginTop: space.xxl },
  heroSub: { fontSize: 16, color: 'rgba(255,255,255,0.92)', marginTop: space.xs, lineHeight: 22 },

  content: { padding: space.xl, gap: space.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: space.lg,
    minHeight: 88,
  },
  cardPressed: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  glyphWrap: {
    width: touch.min + 8,
    height: touch.min + 8,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphStaff: { backgroundColor: colors.premiumSoft },
  glyph: { fontSize: 22, color: colors.accentInk },
  cardTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  cardBlurb: { ...type.small, marginTop: 2, lineHeight: 19 },
  chevron: { color: colors.textMuted, fontSize: 28 },

  footnote: { ...type.tiny, textAlign: 'center', marginTop: space.lg, lineHeight: 17 },
});
