import type { ReactNode } from 'react';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { colors, radius, space, type } from '@/theme';

/**
 * Persistent bar on every admin screen. Nobody should be able to mistake this
 * for a real staff console - there is no login behind it.
 */
export function AdminBar({ role }: { role: string }) {
  const router = useRouter();
  return (
    <View style={styles.bar}>
      <View style={styles.barTop}>
        <View style={styles.dot} />
        <Text style={styles.barText}>
          DEMO MODE · {role.toUpperCase()} · no login, role switching is for this preview only
        </Text>
        {router.canGoBack() && (
          <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.back}>Back</Text>
          </Pressable>
        )}
      </View>
      {/* Getting back to the member view shouldn't mean hunting for the entry
          screen - it's the single most repeated move in a demo. */}
      <View style={styles.barSwitch}>
        <Text style={styles.barSwitchLabel}>VIEWING AS</Text>
        <RoleSwitcher compact />
      </View>
    </View>
  );
}

/** Screen title block used across the admin screens. */
export function AdminHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ marginBottom: space.lg }}>
      <Text style={type.h1}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function AdminRow({
  label,
  value,
  meta,
  onPress,
  right,
}: {
  label: string;
  value?: string;
  meta?: string;
  onPress?: () => void;
  right?: ReactNode;
}) {
  const Wrapper: any = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }: { pressed?: boolean }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={type.body}>{label}</Text>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {meta ? <Text style={type.tiny}>{meta}</Text> : null}
      </View>
      {right ?? (onPress ? <Text style={styles.chevron}>›</Text> : null)}
    </Wrapper>
  );
}

/**
 * Inline editor. Commits on blur or submit rather than per keystroke, so a
 * half-typed value never reaches the member's screen.
 */
export function EditableField({
  label,
  value,
  placeholder,
  keyboardType,
  onCommit,
  width,
  multiline,
  minHeight,
}: {
  label?: string;
  value: string;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  onCommit: (v: string) => void;
  width?: number;
  multiline?: boolean;
  minHeight?: number;
}) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);

  // Keep in step when the underlying value changes elsewhere (e.g. revert all)
  // but never yank the text out from under someone mid-edit.
  if (!focused && draft !== value) setDraft(value);

  return (
    <View style={width ? { width } : { flex: 1 }}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          if (draft !== value) onCommit(draft);
        }}
        // Not on multiline: there Enter means "new paragraph", not "done".
        onSubmitEditing={
          multiline
            ? undefined
            : () => {
                if (draft !== value) onCommit(draft);
              }
        }
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : undefined}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        keyboardType={keyboardType}
        style={[
          styles.input,
          focused && styles.inputFocused,
          multiline && { minHeight: minHeight ?? 96, paddingTop: space.sm },
        ]}
        accessibilityLabel={label}
      />
    </View>
  );
}

export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel,
  destructive,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={type.h2}>{title}</Text>
          <Text style={styles.dialogBody}>{body}</Text>
          <View style={styles.dialogActions}>
            <Pressable onPress={onCancel} accessibilityRole="button" style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              accessibilityRole="button"
              style={[styles.confirmBtn, destructive && { backgroundColor: colors.increased }]}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function Pill({ text, tone }: { text: string; tone: 'ok' | 'warn' | 'off' | 'info' }) {
  const map = {
    ok: { fg: colors.addedInk, bg: colors.addedSoft },
    warn: { fg: colors.increasedInk, bg: colors.increasedSoft },
    off: { fg: colors.removed, bg: colors.surfaceAlt },
    info: { fg: colors.accentInk, bg: colors.accentSoft },
  }[tone];
  return (
    <View style={[styles.pill, { backgroundColor: map.bg }]}>
      <Text style={[styles.pillText, { color: map.fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    gap: space.sm,
    backgroundColor: colors.increasedSoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.increased,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  barTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  barSwitch: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  barSwitchLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6, color: colors.increasedInk },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.increased },
  barText: { flex: 1, fontSize: 11, fontWeight: '800', color: colors.increasedInk, letterSpacing: 0.4 },
  back: { ...type.small, color: colors.accentInk, fontWeight: '700' },

  subtitle: { ...type.small, marginTop: 3, lineHeight: 19 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.lg,
  },
  rowValue: { ...type.small, marginTop: 2 },
  chevron: { color: colors.textMuted, fontSize: 22 },

  fieldLabel: { ...type.tiny, marginBottom: 3 },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    color: colors.text,
    fontSize: 15,
  },
  inputFocused: { borderColor: colors.accent },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(33,46,84,0.5)',
    justifyContent: 'center',
    padding: space.xl,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
    gap: space.md,
  },
  dialogBody: { ...type.body, color: colors.textMuted, lineHeight: 21 },
  dialogActions: { flexDirection: 'row', gap: space.md, marginTop: space.sm },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  cancelText: { ...type.h3 },
  confirmBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  confirmText: { color: colors.onAccent, fontWeight: '700', fontSize: 15 },

  pill: { borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: 2 },
  pillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
});
