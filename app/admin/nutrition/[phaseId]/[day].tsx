import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminBar, AdminHeading, EditableField, Pill } from '@/components/admin/AdminChrome';
import { NUTRITION_PHASES } from '@/data/programs';
import {
  applyNutritionDayEdits,
  derivedNutritionPhases,
  derivedPhaseLabel,
  isMacroApproved,
} from '@/data/adminOverlay';
import { useAdminEdits, nutritionItemKey } from '@/store/useAdminEdits';
import { colors, radius, space, type } from '@/theme';

/** "" -> null, "5" -> 5, "2-3" -> "2-3". The sheet uses all three. */
function parseQty(v: string): number | string | null {
  const t = v.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isNaN(n) ? t : n;
}

export default function DayEditor() {
  const { phaseId, day } = useLocalSearchParams<{ phaseId: string; day: string }>();
  const { edits, editNutritionItem } = useAdminEdits();

  const phases = derivedNutritionPhases(NUTRITION_PHASES, edits);
  const phase = phases.find((p) => p.phaseId === phaseId);
  const rawDay = phase?.days.find((d) => d.day === Number(day));

  if (!phase || !rawDay) {
    return (
      <SafeAreaView style={styles.safe}>
        <AdminBar role="nutritionist" />
        <View style={styles.content}>
          <Text style={type.small}>No day {day} in “{phaseId}”.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const resolved = applyNutritionDayEdits(rawDay, phase.phaseId, edits);
  const weekNumber = phases.indexOf(phase) + 1;
  const weekLabel = derivedPhaseLabel(phase.phaseId, edits) ?? `Week ${weekNumber}`;

  return (
    <SafeAreaView style={styles.safe}>
      <AdminBar role="nutritionist" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AdminHeading
          title={`${weekLabel}, day ${rawDay.day}`}
          subtitle="Edit any item's food, quantity or unit. Leave quantity blank for items the sheet gives no amount for."
        />

        {resolved.meals.map((meal, mi) => (
          <View key={meal.slot} style={styles.meal}>
            <View style={styles.mealHeader}>
              <Text style={type.h3}>{meal.label}</Text>
              <Text style={type.tiny}>slot {meal.slot}</Text>
            </View>

            {meal.items.map((item, i) => {
              const raw = rawDay.meals[mi].items[i];
              const edited = Boolean(
                edits.nutritionItems[nutritionItemKey(phase.phaseId, rawDay.day, meal.slot, i)]
              );

              return (
                <View key={i} style={[styles.item, edited && styles.itemEdited]}>
                  <View style={styles.itemHeader}>
                    {edited ? <Pill text="EDITED" tone="info" /> : null}
                    {item.macrosInvalidated ? (
                      <Pill text="MACROS NEED RE-CHECKING" tone="warn" />
                    ) : item.macros ? (
                      <Pill
                        text={
                          isMacroApproved(item, edits)
                            ? `${item.macros.protein}g P · APPROVED`
                            : `${item.macros.protein}g P · ESTIMATED`
                        }
                        tone={isMacroApproved(item, edits) ? 'ok' : 'off'}
                      />
                    ) : (
                      <Pill text="NO MACROS" tone="off" />
                    )}
                  </View>

                  <EditableField
                    label="Food"
                    value={item.food}
                    onCommit={(v) =>
                      editNutritionItem(phase.phaseId, rawDay.day, meal.slot, i, {
                        food: v.trim() || raw.food,
                      })
                    }
                  />

                  <View style={styles.qtyRow}>
                    <EditableField
                      label="Qty"
                      width={90}
                      value={item.qty === null || item.qty === undefined ? '' : String(item.qty)}
                      placeholder="—"
                      onCommit={(v) =>
                        editNutritionItem(phase.phaseId, rawDay.day, meal.slot, i, {
                          qty: parseQty(v),
                        })
                      }
                    />
                    <EditableField
                      label="Unit"
                      value={item.unit ?? ''}
                      placeholder="oz, cup, slice…"
                      onCommit={(v) =>
                        editNutritionItem(phase.phaseId, rawDay.day, meal.slot, i, {
                          unit: v.trim() === '' ? null : v.trim(),
                        })
                      }
                    />
                  </View>

                  {item.macrosInvalidated && (
                    <Text style={styles.invalidated}>
                      The seed's macros were measured for “{raw.food}” at{' '}
                      {raw.qty ?? '—'} {raw.unit ?? ''}. They no longer describe this item, so the
                      app shows none rather than a stale number.
                    </Text>
                  )}
                </View>
              );
            })}

            {meal.prep ? <Text style={styles.prep}>{meal.prep}</Text> : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, paddingBottom: space.xxl },
  meal: { marginBottom: space.xl },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  item: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
    marginBottom: space.sm,
  },
  itemEdited: { borderColor: colors.accent },
  itemHeader: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  qtyRow: { flexDirection: 'row', gap: space.md },
  invalidated: { ...type.tiny, color: colors.increased, lineHeight: 16 },
  prep: { ...type.small, fontStyle: 'italic' },
});
