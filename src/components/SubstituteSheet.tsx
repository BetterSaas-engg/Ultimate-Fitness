import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { MealItem } from '@/types/program';
import type { SubstitutionMember } from '@/types/substitutions';
import { optionsForItem, groupForFoodId } from '@/data/substitutions';
import { swapGroupStatus } from '@/data/adminOverlay';
import { useAdminEdits } from '@/store/useAdminEdits';
import { foodIdOf } from '@/data/foods';
import { formatDelta, formatServing, roundMacros, subtractMacros } from '@/lib/macros';
import { colors, radius, space, type } from '@/theme';

/**
 * Pick a replacement. Each option shows what it does to the numbers BEFORE it
 * is chosen - a swap that costs 17g of protein should say so up front, not
 * after the fact.
 */
export function SubstituteSheet({
  item,
  visible,
  currentFoodId,
  onPick,
  onRestore,
  onClose,
}: {
  item: MealItem;
  visible: boolean;
  currentFoodId?: string;
  onPick: (foodId: string) => void;
  onRestore: () => void;
  onClose: () => void;
}) {
  const { edits } = useAdminEdits();
  const options = optionsForItem(item, edits);
  const group = groupForFoodId(foodIdOf(item));
  const approved = group ? swapGroupStatus(group.groupId, edits) === 'approved' : false;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>Replace {item.food}</Text>
          <Text style={styles.sub}>
            {group?.label}
            {group?.placeholder && !approved ? ' · pending nutritionist approval' : ''}
            {approved ? ' · approved' : ''}
          </Text>

          <ScrollView style={{ marginTop: space.lg }}>
            {currentFoodId && (
              <Pressable onPress={onRestore} style={[styles.option, styles.restore]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optName}>{item.food}</Text>
                  <Text style={styles.optServing}>
                    {formatServing(item.qty, item.unit)} · the gym's original
                  </Text>
                </View>
                <Text style={styles.restoreMark}>↺</Text>
              </Pressable>
            )}

            {options.map((opt) => (
              <Option key={opt.foodId} item={item} option={opt} onPick={() => onPick(opt.foodId)} />
            ))}

            {options.length === 0 && (
              <Text style={type.small}>No swaps set up for this food yet.</Text>
            )}
          </ScrollView>

          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Option({
  item,
  option,
  onPick,
}: {
  item: MealItem;
  option: SubstitutionMember;
  onPick: () => void;
}) {
  const delta = item.macros ? roundMacros(subtractMacros(option.macros, item.macros)) : undefined;
  const deltaText = delta ? formatDelta(delta) : null;

  return (
    <Pressable onPress={onPick} style={({ pressed }) => [styles.option, pressed && { opacity: 0.7 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.optName}>{option.label}</Text>
        <Text style={styles.optServing}>
          {formatServing(option.serving.qty, option.serving.unit)} · {option.macros.protein}g protein
        </Text>
        {option.note ? <Text style={styles.optNote}>{option.note}</Text> : null}
      </View>
      {deltaText ? (
        <Text
          style={[
            styles.delta,
            delta && delta.protein < 0 ? { color: colors.increasedInk } : { color: colors.textMuted },
          ]}
        >
          {deltaText}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(33,46,84,0.45)',
    justifyContent: 'center',
    padding: space.xl,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
    maxHeight: '80%',
  },
  title: { ...type.h2 },
  sub: { ...type.small, marginTop: 2 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  restore: { borderBottomWidth: 1, borderBottomColor: colors.border },
  restoreMark: { color: colors.accentInk, fontSize: 20 },
  optName: { ...type.body },
  optServing: { ...type.tiny, marginTop: 2 },
  optNote: { ...type.tiny, color: colors.increasedInk, marginTop: 3, lineHeight: 16 },
  delta: { ...type.small, textAlign: 'right', flexShrink: 0, maxWidth: 130 },
  closeBtn: {
    marginTop: space.lg,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  closeText: { ...type.h3 },
});
