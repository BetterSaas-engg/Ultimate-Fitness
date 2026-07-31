import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, type } from '@/theme';

const STEP = 10;
const MIN = 40;
const MAX = 250;

/** Deliberately coarse. This is a target to aim at, not a prescription. */
export function ProteinTargetStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const set = (v: number) => onChange(Math.max(MIN, Math.min(MAX, v)));

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => set(value - STEP)}
        accessibilityRole="button"
        accessibilityLabel="Decrease protein target"
        disabled={value <= MIN}
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.6 }, value <= MIN && styles.off]}
      >
        <Text style={styles.btnText}>−</Text>
      </Pressable>

      <View style={styles.readout}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.unit}>g protein / day</Text>
      </View>

      <Pressable
        onPress={() => set(value + STEP)}
        accessibilityRole="button"
        accessibilityLabel="Increase protein target"
        disabled={value >= MAX}
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.6 }, value >= MAX && styles.off]}
      >
        <Text style={styles.btnText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  btn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  off: { opacity: 0.35 },
  btnText: { color: colors.text, fontSize: 22, fontWeight: '600' },
  readout: { flex: 1, alignItems: 'center' },
  value: { fontSize: 30, fontWeight: '800', color: colors.text },
  unit: { ...type.tiny },
});
