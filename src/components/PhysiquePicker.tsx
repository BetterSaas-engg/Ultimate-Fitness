import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, type } from '@/theme';

/**
 * Five-point silhouette scale, drawn in code - no image assets, since the gym
 * hasn't supplied artwork. Swap for real illustrations when they do; the stored
 * value (1..5) does not change.
 */
const LEVELS = [
  { value: 1, label: 'Slim', torso: 26, shoulder: 34 },
  { value: 2, label: 'Lean', torso: 30, shoulder: 42 },
  { value: 3, label: 'Average', torso: 38, shoulder: 46 },
  { value: 4, label: 'Solid', torso: 46, shoulder: 52 },
  { value: 5, label: 'Larger', torso: 56, shoulder: 56 },
];

export function PhysiquePicker({
  value,
  onChange,
  tint,
}: {
  value?: number;
  onChange: (v: number) => void;
  tint: string;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {LEVELS.map((lvl) => {
        const selected = value === lvl.value;
        return (
          <Pressable
            key={lvl.value}
            onPress={() => onChange(lvl.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={lvl.label}
            style={[styles.option, selected && { borderColor: tint, backgroundColor: colors.surfaceAlt }]}
          >
            <Silhouette
              torso={lvl.torso}
              shoulder={lvl.shoulder}
              color={selected ? tint : colors.textFaint}
            />
            <Text style={[styles.label, selected && { color: colors.text }]}>{lvl.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function Silhouette({
  torso,
  shoulder,
  color,
}: {
  torso: number;
  shoulder: number;
  color: string;
}) {
  return (
    <View style={styles.figure}>
      <View style={[styles.head, { backgroundColor: color }]} />
      <View
        style={{
          width: shoulder,
          height: 34,
          backgroundColor: color,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 4,
          marginTop: 3,
        }}
      />
      <View
        style={{
          width: torso,
          height: 26,
          backgroundColor: color,
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
          marginTop: 2,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: space.md, paddingVertical: space.sm, paddingRight: space.lg },
  option: {
    width: 92,
    alignItems: 'center',
    paddingVertical: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  figure: { alignItems: 'center', height: 84, justifyContent: 'flex-start' },
  head: { width: 18, height: 18, borderRadius: 9 },
  label: { ...type.small, marginTop: space.sm },
});
