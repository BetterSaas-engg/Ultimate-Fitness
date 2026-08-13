import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useProfile } from '@/store/useProfile';
import { useLog } from '@/store/useLog';
import { useSubstitutions } from '@/store/useSubstitutions';
import { useAdminEdits } from '@/store/useAdminEdits';
import { dayStatus } from '@/lib/dayStatus';
import { wasActive } from '@/lib/milestones';
import { addDays, daysInMonth, dayOfWeekOf, monthName, startOfMonth } from '@/lib/date';
import { colors, radius, space, type } from '@/theme';

/**
 * The month at a glance.
 *
 * Cell colours follow the same rules everything else uses: green is a closed
 * day per dayStatus, cyan is the streak's own definition of active - anything
 * logged at all. That match is deliberate. If cyan meant something stricter
 * than the streak counter, the calendar would show gaps on days the counter
 * was still counting, and one of them would look broken.
 */

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type CellKind = 'perfect' | 'active' | 'idle' | 'outside';

interface Cell {
  dateKey: string;
  day: number;
  kind: CellKind;
  isToday: boolean;
}

export function StreakCalendar({ today }: { today: string }) {
  const { profile } = useProfile();
  const { log } = useLog();
  const { all: subs } = useSubstitutions(today);
  const { edits } = useAdminEdits();

  const { cells, lead, perfectCount } = useMemo(() => {
    if (!profile) return { cells: [] as Cell[], lead: 0, perfectCount: 0 };

    const first = startOfMonth(today);
    const total = daysInMonth(today);
    // Monday-start grid: how many blanks before the 1st.
    const lead = (dayOfWeekOf(first) + 6) % 7;

    const cells: Cell[] = [];
    for (let i = 0; i < total; i++) {
      const dateKey = addDays(first, i);
      const beforeStart = dateKey < profile.startDate;
      const future = dateKey > today;

      let kind: CellKind = 'idle';
      if (beforeStart || future) kind = 'outside';
      else if (dayStatus(dateKey, { profile, log, subs, edits }).allClosed) kind = 'perfect';
      else if (wasActive(log, dateKey)) kind = 'active';

      cells.push({ dateKey, day: i + 1, kind, isToday: dateKey === today });
    }

    return { cells, lead, perfectCount: cells.filter((c) => c.kind === 'perfect').length };
  }, [profile, log, subs, edits, today]);

  if (!profile || cells.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={type.h3}>{monthName(today)}</Text>
        <Text style={styles.count}>
          {perfectCount} perfect day{perfectCount === 1 ? '' : 's'}
        </Text>
      </View>

      <View style={styles.grid}>
        {LETTERS.map((l, i) => (
          <View key={`h${i}`} style={styles.cellWrap}>
            <Text style={styles.letter}>{l}</Text>
          </View>
        ))}

        {Array.from({ length: lead }, (_, i) => (
          <View key={`lead${i}`} style={styles.cellWrap} />
        ))}

        {cells.map((c) => (
          <View key={c.dateKey} style={styles.cellWrap}>
            <View style={[styles.cell, KIND[c.kind], c.isToday && styles.today]}>
              <Text style={[styles.day, TEXT[c.kind], c.isToday && styles.todayText]}>{c.day}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <Key style={styles.perfect} label="all closed" />
        <Key style={styles.active} label="logged something" />
        <Key style={styles.idle} label="nothing yet" />
      </View>
    </View>
  );
}

function Key({ style, label }: { style: object; label: string }) {
  return (
    <View style={styles.keyRow}>
      <View style={[styles.keySwatch, style]} />
      <Text style={styles.keyLabel}>{label}</Text>
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

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cellWrap: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 2 },
  letter: { ...type.tiny, fontWeight: '700', marginBottom: 2 },

  cell: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  day: { fontSize: 12, fontWeight: '600' },

  perfect: { backgroundColor: colors.added },
  active: { backgroundColor: colors.accent },
  idle: { backgroundColor: colors.surface },
  /** Before the member started, or still to come. Deliberately empty. */
  outside: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },

  today: { borderWidth: 2, borderStyle: 'solid', borderColor: colors.text },
  todayText: { fontWeight: '800' },

  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  keyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  keySwatch: { width: 10, height: 10, borderRadius: 3 },
  keyLabel: { ...type.tiny },
});

const KIND: Record<CellKind, object> = {
  perfect: styles.perfect,
  active: styles.active,
  idle: styles.idle,
  outside: styles.outside,
};

/** White on the vivid fills, ink on the pale ones. */
const TEXT: Record<CellKind, object> = {
  perfect: { color: colors.onDark },
  active: { color: colors.onAccent },
  idle: { color: colors.textMuted },
  outside: { color: 'transparent' },
};
