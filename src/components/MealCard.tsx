import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Meal, MealItem } from '@/types/program';
import type { DiffItem, MealDiff } from '@/data/changes';
import { formatIncrease } from '@/data/changes';
import { optionsForItem } from '@/data/substitutions';
import { useAdminEdits } from '@/store/useAdminEdits';
import {
  formatDelta,
  formatServing,
  resolveItem,
  substitutionKey,
  type DaySubstitutions,
} from '@/lib/macros';
import { ChangeBadge } from './ChangeBadge';
import { SubstituteSheet } from './SubstituteSheet';
import { colors, radius, space, type } from '@/theme';

interface Props {
  meal: Meal;
  /** When present, changed items are highlighted. */
  diff?: MealDiff;
  logged?: boolean;
  onToggle?: () => void;
  /** Substitutions for the whole day; this card reads its own slot's entries. */
  substitutions?: DaySubstitutions;
  onSubstitute?: (slot: number, itemIndex: number, foodId: string) => void;
  onRestore?: (slot: number, itemIndex: number) => void;
}

export function MealCard({
  meal,
  diff,
  logged,
  onToggle,
  substitutions,
  onSubstitute,
  onRestore,
}: Props) {
  const items: DiffItem[] = diff?.items ?? meal.items;
  const canSubstitute = Boolean(onSubstitute);

  return (
    <View style={[styles.card, diff?.hasChanges && styles.cardChanged]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.slot}>{meal.label}</Text>
          {meal.labelAssumed && <Text style={type.tiny}>slot {meal.slot} · label assumed</Text>}
        </View>
        {onToggle && (
          <Pressable
            onPress={onToggle}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: !!logged }}
            accessibilityLabel={`Log ${meal.label}`}
            style={[styles.check, logged && styles.checkOn]}
          >
            <Text style={[styles.checkMark, logged && styles.checkMarkOn]}>
              {logged ? '✓' : '+'}
            </Text>
          </Pressable>
        )}
      </View>

      {items.map((item, i) => (
        <ItemRow
          key={`${item.food}-${i}`}
          item={item}
          slot={meal.slot}
          index={i}
          substituteFoodId={substitutions?.[substitutionKey(meal.slot, i)]}
          canSubstitute={canSubstitute}
          onSubstitute={onSubstitute}
          onRestore={onRestore}
        />
      ))}

      {diff?.wholesaleSwap ? (
        <View style={styles.swapSummary}>
          <ChangeBadge kind="removed" />
          <Text style={styles.swapSummaryText}>
            Replaces {diff.removed.map((r) => r.food).join(', ')}
          </Text>
        </View>
      ) : (
        diff?.removed.map((r, i) => (
          <View key={`removed-${i}`} style={styles.row}>
            <Text style={styles.bullet}>·</Text>
            <Text style={styles.foodRemoved}>
              {r.food}
              {formatServing(r.qty, r.unit) ? `  ${formatServing(r.qty, r.unit)}` : ''}
            </Text>
            <ChangeBadge kind="removed" />
          </View>
        ))
      )}

      {meal.prep && <Text style={styles.prep}>{meal.prep}</Text>}

      {diff?.notes.map((n, i) => (
        <Text key={i} style={styles.note}>
          {n}
        </Text>
      ))}
    </View>
  );
}

function ItemRow({
  item,
  slot,
  index,
  substituteFoodId,
  canSubstitute,
  onSubstitute,
  onRestore,
}: {
  item: DiffItem;
  slot: number;
  index: number;
  substituteFoodId?: string;
  canSubstitute: boolean;
  onSubstitute?: (slot: number, itemIndex: number, foodId: string) => void;
  onRestore?: (slot: number, itemIndex: number) => void;
}) {
  const [picking, setPicking] = useState(false);
  const { edits } = useAdminEdits();

  const resolved = resolveItem(item, substituteFoodId);
  const swapped = Boolean(resolved.substitute);
  const hasOptions = canSubstitute && optionsForItem(item, edits).length > 0;

  // The change badge describes the ORIGINAL food. Once an item is swapped,
  // "5 oz → 6 oz" alongside a different food would be a lie, so it steps aside
  // for the substitution caption.
  const increase = swapped ? null : formatIncrease(item);
  const serving = formatServing(resolved.qty, resolved.unit);
  const deltaText = resolved.delta ? formatDelta(resolved.delta) : null;

  return (
    <View style={styles.itemBlock}>
      <View style={styles.row}>
        <Text style={styles.bullet}>·</Text>
        <Text style={[styles.food, swapped && styles.foodSwapped]}>
          {resolved.food}
          {serving ? <Text style={styles.qty}>{`  ${increase ?? serving}`}</Text> : null}
        </Text>

        {!swapped && item.changeKind && <ChangeBadge kind={item.changeKind} />}

        {hasOptions && (
          <Pressable
            onPress={() => setPicking(true)}
            accessibilityRole="button"
            accessibilityLabel={`Replace ${item.food}`}
            style={({ pressed }) => [styles.replace, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.replaceText}>{swapped ? 'Change' : 'Replace'}</Text>
          </Pressable>
        )}
      </View>

      {swapped && (
        <View style={styles.swapMeta}>
          <Text style={styles.swapFrom}>swapped for {item.food}</Text>
          {deltaText ? <Text style={styles.swapDelta}>{deltaText}</Text> : null}
        </View>
      )}

      {hasOptions && (
        <SubstituteSheet
          item={item}
          visible={picking}
          currentFoodId={substituteFoodId}
          onPick={(foodId) => {
            onSubstitute?.(slot, index, foodId);
            setPicking(false);
          }}
          onRestore={() => {
            onRestore?.(slot, index);
            setPicking(false);
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.xs,
  },
  cardChanged: { borderColor: colors.accent },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: space.sm },
  slot: { ...type.h3 },
  itemBlock: {},
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 2 },
  bullet: { color: colors.textFaint },
  food: { ...type.body, flexShrink: 1, flexGrow: 1 },
  foodSwapped: { color: colors.swapped },
  foodRemoved: {
    ...type.body,
    flexShrink: 1,
    color: colors.removed,
    textDecorationLine: 'line-through',
  },
  qty: { color: colors.textMuted },
  replace: {
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  replaceText: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.4 },
  swapMeta: { paddingLeft: space.lg, gap: 1, marginBottom: space.xs },
  swapFrom: { ...type.tiny, fontStyle: 'italic' },
  swapDelta: { ...type.tiny, color: colors.increased, fontWeight: '700' },
  swapSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.xs,
    paddingVertical: 2,
  },
  swapSummaryText: { ...type.small, color: colors.removed, flexShrink: 1 },
  prep: { ...type.small, fontStyle: 'italic', marginTop: space.sm },
  note: { ...type.small, color: colors.accent, marginTop: space.xs },
  check: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.added, borderColor: colors.added },
  checkMark: { color: colors.textMuted, fontSize: 16, fontWeight: '700' },
  checkMarkOn: { color: colors.onAccent },
});
