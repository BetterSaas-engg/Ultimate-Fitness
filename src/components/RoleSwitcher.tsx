import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useProfile } from '@/store/useProfile';
import { homeForRole } from '@/lib/roleHome';
import { ROLES, type Role } from '@/types/admin';
import { colors, radius, space, touch, type } from '@/theme';

/**
 * "Viewing as" - switch role and land on that role's home in one tap.
 *
 * This ONLY writes profile.role. Logs, streaks, milestones, notes, admin edits
 * and substitutions all live in their own stores and are not touched, so a
 * switch mid-demo costs nothing. Full Reset is the destructive one, and it is
 * deliberately styled to look it.
 *
 * `compact` is the version that fits the admin bar: labels only, no blurbs.
 */
export function RoleSwitcher({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const { profile, update } = useProfile();
  const current: Role = profile?.role ?? 'member';

  async function go(role: Role) {
    if (role === current) return;
    await update({ role });
    router.replace(homeForRole(role, Boolean(profile?.onboardedAt)));
  }

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {ROLES.map((r) => {
        const active = current === r.role;
        return (
          <Pressable
            key={r.role}
            onPress={() => void go(r.role)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`View as ${r.label}`}
            style={({ pressed }) => [
              styles.option,
              compact && styles.optionCompact,
              active && (compact ? styles.optionCompactOn : styles.optionOn),
              pressed && !active && { opacity: 0.7 },
            ]}
          >
            <Text
              style={[
                compact ? styles.labelCompact : styles.label,
                active && (compact ? styles.labelCompactOn : styles.labelOn),
              ]}
              numberOfLines={1}
            >
              {r.label}
            </Text>
            {!compact && <Text style={type.tiny}>{r.blurb}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: space.sm },
  wrapCompact: { gap: 4, flexWrap: 'wrap', flexShrink: 1 },

  option: {
    flex: 1,
    minHeight: touch.min,
    justifyContent: 'center',
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  optionCompact: {
    // Not `flex: 0`: react-native-web emits the CSS shorthand, which resolves
    // to `0 1 0%` - basis zero and still shrinkable, so the pill collapses to
    // an empty oval and eats its own label. Set the three parts explicitly.
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    minHeight: 30,
    paddingVertical: 4,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    borderColor: colors.increased,
    backgroundColor: 'transparent',
  },
  optionOn: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  /**
   * Filled with increasedInk, not the vivid increased: white on #FF7E38 is
   * 2.6:1 and unreadable. increasedInk clears AA at 5.18:1 and stays in the
   * admin bar's own colour family.
   */
  optionCompactOn: { backgroundColor: colors.increasedInk, borderColor: colors.increasedInk },

  label: { ...type.small, fontWeight: '700', color: colors.text },
  labelOn: { color: colors.accentInk },
  labelCompact: { fontSize: 11, fontWeight: '800', color: colors.increasedInk },
  labelCompactOn: { color: colors.onDark },
});
