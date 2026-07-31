import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import type { GymClass } from '@/types/classes';
import { formatDuration, formatTime12h, weekdayName } from '@/lib/date';
import { colors, radius, space, type } from '@/theme';

/**
 * Read-only. Tapping opens a detail card; there is no booking and no action.
 * Pre-registration is handled by the gym, so we state it and stop there.
 */
export function ClassRow({ gymClass }: { gymClass: GymClass }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${gymClass.className} at ${formatTime12h(gymClass.time)}, details`}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <Text style={styles.time}>{formatTime12h(gymClass.time)}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{gymClass.className}</Text>
          <Text style={styles.meta}>
            {gymClass.instructor} · {formatDuration(gymClass.durationMin)}
          </Text>
        </View>
        <View style={styles.flags}>
          {gymClass.preRegistration && <Text style={styles.flagPre}>PRE-REG</Text>}
          {gymClass.note && <Text style={styles.flagNote}>NOT WEEKLY</Text>}
        </View>
      </Pressable>

      <ClassDetail gymClass={gymClass} visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

function ClassDetail({
  gymClass,
  visible,
  onClose,
}: {
  gymClass: GymClass;
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Swallow taps inside the card so only the backdrop dismisses. */}
        <Pressable style={styles.sheet} onPress={() => {}}>
          <ScrollView>
            <Text style={styles.detailName}>{gymClass.className}</Text>
            <Text style={styles.detailWhen}>
              {weekdayName(gymClass.dayOfWeek)} · {formatTime12h(gymClass.time)}
            </Text>

            <View style={styles.detailBlock}>
              <DetailLine label="Instructor" value={gymClass.instructor} />
              <DetailLine label="Duration" value={formatDuration(gymClass.durationMin)} />
            </View>

            {gymClass.note && (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>Schedule note</Text>
                <Text style={styles.noteText}>{gymClass.note}</Text>
              </View>
            )}

            {gymClass.preRegistration && (
              <View style={styles.preBox}>
                <Text style={styles.preLabel}>Pre-registration required</Text>
                <Text style={styles.preText}>
                  Sign up at the front desk. The app doesn't book classes.
                </Text>
              </View>
            )}

            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailLine}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: { opacity: 0.6 },
  time: { ...type.small, color: colors.text, width: 72, fontVariant: ['tabular-nums'] },
  name: { ...type.body },
  meta: { ...type.tiny, marginTop: 1 },
  flags: { alignItems: 'flex-end', gap: 2 },
  flagPre: { fontSize: 9, fontWeight: '800', color: colors.premium, letterSpacing: 0.5 },
  flagNote: { fontSize: 9, fontWeight: '800', color: colors.increased, letterSpacing: 0.5 },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
  detailName: { ...type.h2 },
  detailWhen: { ...type.small, marginTop: space.xs },
  detailBlock: { marginTop: space.lg, gap: space.sm },
  detailLine: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { ...type.small },
  detailValue: { ...type.body },
  noteBox: {
    marginTop: space.lg,
    backgroundColor: colors.increasedSoft,
    borderRadius: radius.md,
    padding: space.md,
  },
  noteLabel: { fontSize: 10, fontWeight: '800', color: colors.increased, letterSpacing: 0.6 },
  noteText: { ...type.small, color: colors.text, marginTop: space.xs },
  preBox: {
    marginTop: space.md,
    backgroundColor: colors.premiumSoft,
    borderRadius: radius.md,
    padding: space.md,
  },
  preLabel: { fontSize: 10, fontWeight: '800', color: colors.premium, letterSpacing: 0.6 },
  preText: { ...type.small, color: colors.text, marginTop: space.xs },
  closeBtn: {
    marginTop: space.xl,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  closeText: { ...type.h3 },
});
