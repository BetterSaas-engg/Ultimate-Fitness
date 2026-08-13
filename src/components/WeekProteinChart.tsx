import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useLog } from '@/store/useLog';
import { useProfile } from '@/store/useProfile';
import { useSubstitutions } from '@/store/useSubstitutions';
import { useAdminEdits } from '@/store/useAdminEdits';
import { dayStatus, type DayStatus } from '@/lib/dayStatus';
import { round1 } from '@/lib/macros';
import { addDays, startOfWeek } from '@/lib/date';
import { colors, radius, space, type } from '@/theme';

/**
 * This week - protein logged per day against that day's plan, plus a marker for
 * the days that closed completely.
 *
 * Everything is rebuilt from the existing date-keyed stores; nothing new is
 * persisted. See lib/dayStatus for which inputs are genuinely historical and
 * which are applied as they stand today.
 *
 * Drawn with plain Views. A seven-bar chart does not need a charting library.
 */

const PLOT = 104;
/** So a small but real intake is still a visible bar rather than a hairline. */
const MIN_BAR = 4;

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface Props {
  /** The demo's current day. Anchors the week and marks "today". */
  today: string;
}

interface Column extends DayStatus {
  letter: string;
  isToday: boolean;
  isFuture: boolean;
}

export function WeekProteinChart({ today }: Props) {
  const { profile } = useProfile();
  const { log } = useLog();
  const { all: subs } = useSubstitutions(today);
  const { edits } = useAdminEdits();

  const columns = useMemo<Column[]>(() => {
    if (!profile) return [];
    const monday = startOfWeek(today);
    return LETTERS.map((letter, i) => {
      const dateKey = addDays(monday, i);
      return {
        ...dayStatus(dateKey, { profile, log, subs, edits }),
        letter,
        isToday: dateKey === today,
        isFuture: dateKey > today,
      };
    });
  }, [profile, log, subs, edits, today]);

  if (!profile || columns.length === 0) return null;

  // One scale across the week so the bars are comparable to each other. The
  // headroom matters: without it the tallest plan line sits exactly on the top
  // edge of the plot and renders outside it, so the busiest day - the one most
  // worth seeing a target on - is the one that loses its line.
  const ceiling =
    Math.max(1, ...columns.map((c) => Math.max(c.isFuture ? 0 : c.proteinLogged, c.proteinTarget))) *
    1.12;

  const closedDays = columns.filter((c) => !c.isFuture && c.allClosed).length;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={type.h3}>This week</Text>
        <Text style={styles.count}>
          {closedDays} perfect day{closedDays === 1 ? '' : 's'}
        </Text>
      </View>

      <View style={styles.plot}>
        {columns.map((c) => (
          <DayColumn key={c.dateKey} column={c} ceiling={ceiling} />
        ))}
      </View>

      <Text style={styles.caption}>
        Bars are the protein you ticked off. The line across each bar is that day's plan.
        A dot underneath means everything closed that day.
      </Text>
    </View>
  );
}

function DayColumn({ column: c, ceiling }: { column: Column; ceiling: number }) {
  // A day with no plan and no future to it is an empty slot, not a zero. A
  // zero-height bar reads as a rendering fault rather than as "nothing here".
  const hasPlan = !c.isFuture && c.proteinTarget > 0;
  const barH = hasPlan && c.proteinLogged > 0
    ? Math.max(MIN_BAR, Math.round((c.proteinLogged / ceiling) * PLOT))
    : 0;
  const lineBottom = hasPlan ? Math.round((c.proteinTarget / ceiling) * PLOT) : 0;

  return (
    <View style={styles.column}>
      <View style={[styles.track, c.isToday && styles.trackToday]}>
        {hasPlan ? (
          <>
            {barH > 0 && (
              <View
                style={[
                  styles.bar,
                  { height: barH, backgroundColor: c.proteinClosed ? colors.added : colors.accent },
                ]}
              />
            )}
            <View style={[styles.planLine, { bottom: lineBottom }]} />
          </>
        ) : (
          <View style={styles.emptySlot} />
        )}
      </View>

      {/* perfect-day marker */}
      <View
        style={[
          styles.dot,
          c.isFuture || !c.inProgram
            ? styles.dotNone
            : c.allClosed
              ? styles.dotClosed
              : styles.dotOpen,
        ]}
      />

      <Text style={[styles.letter, c.isToday && styles.letterToday]}>{c.letter}</Text>
      <Text style={styles.grams}>{hasPlan && c.proteinLogged > 0 ? round1(c.proteinLogged) : ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: space.lg,
    gap: space.md,
    boxShadow: '0 4px 12px rgba(33,46,84,0.08)',
  },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  count: { ...type.tiny, fontWeight: '700', color: colors.addedInk },

  plot: { flexDirection: 'row', alignItems: 'flex-end' },
  column: { flex: 1, alignItems: 'center' },

  track: {
    width: '100%',
    height: PLOT,
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  trackToday: { backgroundColor: colors.accentSoft },

  bar: { width: 18, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  planLine: {
    position: 'absolute',
    left: '50%',
    marginLeft: -14,
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.borderStrong,
  },
  /** A dashed stub, so "no data" looks deliberate rather than broken. */
  emptySlot: {
    width: 18,
    height: 3,
    borderRadius: 2,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },

  dot: { width: 8, height: 8, borderRadius: 4, marginTop: space.sm },
  dotClosed: { backgroundColor: colors.added },
  dotOpen: { borderWidth: 1, borderColor: colors.border },
  dotNone: { backgroundColor: 'transparent' },

  caption: { ...type.tiny, lineHeight: 17 },
  letter: { ...type.tiny, marginTop: space.xs },
  letterToday: { color: colors.accentInk, fontWeight: '800' },
  grams: { fontSize: 10, color: colors.textMuted, minHeight: 13 },
});
