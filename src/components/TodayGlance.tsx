import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { round1 } from '@/lib/macros';
import { closureFor, type WorkoutState } from '@/lib/dayStatus';
import { colors, radius, space, type } from '@/theme';

export type { WorkoutState };

/**
 * Today at a glance - three rings over the day's three commitments.
 *
 * Every value is derived from what the member can actually see and do today,
 * which is the whole point: a free member's meals ring counts only their
 * unlocked meals, so closing it is real rather than a tease. Rest days close
 * the workout ring instead of leaving it accusingly empty - the plan says rest,
 * and the member did what the plan said.
 *
 * Takes resolved numbers rather than reaching into stores itself, so it renders
 * off the same values as the cards below it and cannot drift from them.
 *
 * Rings are drawn with rotated half-circles rather than SVG - react-native-svg
 * isn't a dependency and one progress card doesn't justify adding it.
 */

interface Props {
  /** Which day this is a glance at. Resets the one-shot celebration. */
  dateKey: string;
  mealsDone: number;
  /** Meals this member can see today - tier already applied. */
  mealsTotal: number;
  proteinLogged: number;
  /** From proteinTargetFor(), the same number the protein bar shows. */
  proteinTarget: number;
  workout: WorkoutState;
}

const RING = 76;
const STROKE = 9;

/** Days already celebrated this session. In memory only - no new storage. */
const celebrated = new Set<string>();

interface RingState {
  key: string;
  label: string;
  detail: string;
  /** 0..1 */
  progress: number;
  complete: boolean;
  /** Nothing outstanding today. Renders muted and never blocks the celebration. */
  inactive?: boolean;
  center: ReactNode;
}

export function TodayGlance({
  dateKey,
  mealsDone,
  mealsTotal,
  proteinLogged,
  proteinTarget,
  workout,
}: Props) {
  // One definition of "closed", shared with the week chart on Progress.
  const {
    mealsInactive,
    mealsClosed: mealsComplete,
    proteinInactive,
    proteinClosed: proteinComplete,
    workoutInactive,
    workoutClosed: workoutComplete,
    activeCount,
    closedCount,
    allClosed,
  } = closureFor({ mealsDone, mealsTotal, proteinLogged, proteinTarget, workout });

  const rings: RingState[] = [
    {
      key: 'meals',
      label: 'Meals',
      detail: mealsInactive ? 'None today' : `${mealsDone} of ${mealsTotal}`,
      progress: mealsInactive ? 0 : mealsDone / mealsTotal,
      complete: mealsComplete,
      inactive: mealsInactive,
      center: mealsComplete ? <Tick /> : <Big>{mealsInactive ? '—' : String(mealsDone)}</Big>,
    },
    {
      key: 'protein',
      label: 'Protein',
      detail: proteinInactive
        ? 'No target'
        : `${round1(proteinLogged)} / ${round1(proteinTarget)}g`,
      progress: proteinInactive ? 0 : proteinLogged / proteinTarget,
      complete: proteinComplete,
      inactive: proteinInactive,
      center: proteinComplete ? <Tick /> : <Big>{proteinInactive ? '—' : round1(proteinLogged)}</Big>,
    },
    {
      key: 'workout',
      label: 'Workout',
      detail:
        workout === 'rest'
          ? 'Rest day'
          : workout === 'done'
            ? 'Logged'
            : workout === 'todo'
              ? 'Not yet'
              : 'No session',
      progress: workoutComplete ? 1 : 0,
      complete: workoutComplete,
      inactive: workoutInactive,
      center: workoutComplete ? <Tick rest={workout === 'rest'} /> : <Big>—</Big>,
    },
  ];

  // One-shot entrance, once per day. The interpolations below never drive
  // opacity to 0: if the animation doesn't run - a paused tab, reduced motion,
  // a headless renderer - the message must still be on screen. Visibility is
  // not something to make conditional on a flourish.
  const anim = useRef(new Animated.Value(celebrated.has(dateKey) ? 1 : 0)).current;
  useEffect(() => {
    if (!allClosed) return;
    if (celebrated.has(dateKey)) {
      anim.setValue(1);
      return;
    }
    celebrated.add(dateKey);
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [allClosed, dateKey, anim]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={type.h3}>Today at a glance</Text>
        <Text style={styles.count}>
          {closedCount}/{activeCount} closed
        </Text>
      </View>

      <View style={styles.rings}>
        {rings.map((r) => (
          <View key={r.key} style={styles.column}>
            <Ring progress={r.progress} complete={r.complete} inactive={r.inactive}>
              {r.center}
            </Ring>
            <Text style={styles.ringLabel}>{r.label}</Text>
            <Text style={[styles.ringDetail, r.complete && styles.ringDetailDone]}>{r.detail}</Text>
          </View>
        ))}
      </View>

      {allClosed && (
        <Animated.View
          style={[
            styles.celebrate,
            {
              opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
              transform: [
                { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
                { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) },
              ],
            },
          ]}
        >
          <Text style={styles.celebrateText}>
            All closed. That's the whole day done — the streak is the point.
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Ring                                                                */
/* ------------------------------------------------------------------ */

function Ring({
  progress,
  complete,
  inactive,
  children,
}: {
  progress: number;
  complete: boolean;
  inactive?: boolean;
  children: ReactNode;
}) {
  const deg = Math.max(0, Math.min(1, progress)) * 360;
  const fill = complete ? colors.added : colors.accent;

  return (
    <View style={styles.ring}>
      <View style={[styles.track, inactive && { borderColor: colors.border }]} />
      {!inactive && deg > 0 && (
        <>
          <Arc side="right" deg={deg} color={fill} />
          <Arc side="left" deg={deg} color={fill} />
        </>
      )}
      <View style={styles.ringCenter}>{children}</View>
    </View>
  );
}

/**
 * Half of the progress arc.
 *
 * A bordered circle draws each side as a 90 degree arc, so borderTop +
 * borderRight is a 180 degree sweep. Rotated 45 degrees it covers exactly the
 * right half; rotating it back by (180 - deg) leaves only the first `deg`
 * degrees inside the clip. Same trick mirrored for the left half, which only
 * starts showing past the halfway point.
 */
function Arc({ side, deg, color }: { side: 'left' | 'right'; deg: number; color: string }) {
  const rotate =
    side === 'right' ? Math.min(deg, 180) - 135 : deg > 180 ? deg - 315 : -135;

  const half =
    side === 'right'
      ? { borderTopColor: color, borderRightColor: color }
      : { borderBottomColor: color, borderLeftColor: color };

  return (
    <View style={[styles.clip, side === 'right' ? styles.clipRight : styles.clipLeft]}>
      <View
        style={[
          styles.arc,
          side === 'right' ? styles.arcRight : styles.arcLeft,
          half,
          { transform: [{ rotate: `${rotate}deg` }] },
        ]}
      />
    </View>
  );
}

function Big({ children }: { children: ReactNode }) {
  return <Text style={styles.big}>{children}</Text>;
}

function Tick({ rest }: { rest?: boolean }) {
  return <Text style={[styles.tick, rest && { color: colors.addedInk }]}>{rest ? 'z' : '✓'}</Text>;
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
  count: { ...type.tiny, fontWeight: '700' },

  rings: { flexDirection: 'row', justifyContent: 'space-around' },
  column: { alignItems: 'center', gap: 2, flex: 1 },
  ringLabel: { ...type.small, color: colors.text, fontWeight: '700', marginTop: space.sm },
  ringDetail: { ...type.tiny, textAlign: 'center' },
  ringDetailDone: { color: colors.addedInk, fontWeight: '700' },

  ring: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  track: {
    position: 'absolute',
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: STROKE,
    borderColor: colors.surfaceAlt,
  },
  clip: { position: 'absolute', top: 0, width: RING / 2, height: RING, overflow: 'hidden' },
  clipRight: { left: RING / 2 },
  clipLeft: { left: 0 },
  arc: {
    position: 'absolute',
    top: 0,
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: STROKE,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  arcRight: { left: -RING / 2 },
  arcLeft: { left: 0 },
  ringCenter: { alignItems: 'center', justifyContent: 'center' },
  big: { fontSize: 20, fontWeight: '800', color: colors.text },
  tick: { fontSize: 24, fontWeight: '800', color: colors.addedInk },

  celebrate: {
    backgroundColor: colors.addedSoft,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  celebrateText: { ...type.small, color: colors.addedInk, fontWeight: '700', textAlign: 'center' },
});
