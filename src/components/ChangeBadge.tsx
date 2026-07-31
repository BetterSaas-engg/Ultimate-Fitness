import { StyleSheet, Text, View } from 'react-native';
import type { ChangeKind } from '@/types/program';
import { colors, radius, space } from '@/theme';

/**
 * The paper sheet marked week-2 changes in red caps. This is the digital
 * version of that pen.
 *
 * Colour is never the only signal - every state carries a text label and a
 * glyph too, so the meaning survives greyscale and colour-blindness.
 */
export type BadgeKind = ChangeKind | 'removed';

const STYLES: Record<BadgeKind, { label: string; glyph: string; fg: string; bg: string }> = {
  added: { label: 'NEW', glyph: '+', fg: colors.added, bg: colors.addedSoft },
  increased: { label: 'MORE', glyph: '▲', fg: colors.increased, bg: colors.increasedSoft },
  'swapped-in': { label: 'SWAPPED', glyph: '⇄', fg: colors.swapped, bg: colors.swappedSoft },
  removed: { label: 'DROPPED', glyph: '−', fg: colors.removed, bg: colors.surfaceAlt },
};

export function ChangeBadge({ kind }: { kind: BadgeKind }) {
  const s = STYLES[kind];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.glyph, { color: s.fg }]}>{s.glyph}</Text>
      <Text style={[styles.label, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  glyph: { fontSize: 10, fontWeight: '700' },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
});
