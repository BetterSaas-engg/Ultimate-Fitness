import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ConfirmDialog, EditableField } from '@/components/admin/AdminChrome';
import { useNotes, type Note } from '@/store/useNotes';
import type { Role } from '@/types/admin';
import { colors, radius, space, touch, type } from '@/theme';

/**
 * Notes, for whichever role is asking. One component, three surfaces.
 *
 * Two save patterns on purpose, both already used elsewhere in the app:
 * composing a new note needs an explicit Save (blur-to-create would litter the
 * list with empty notes every time a field lost focus), while editing an
 * existing one autosaves on blur exactly like the admin editors do.
 */

const COPY: Record<Role, { placeholder: string; empty: string }> = {
  member: {
    placeholder: 'Notes from your check-in, things to ask, how the week felt…',
    empty: 'Nothing here yet. Jot something down before your next check-in.',
  },
  trainer: {
    placeholder: 'Form cues, what to progress next, how a session actually went…',
    empty: 'No notes yet. Anything you want to remember before the next session.',
  },
  nutritionist: {
    placeholder: 'Adherence, what to adjust next block, what they said about the plan…',
    empty: 'No notes yet. Anything worth remembering for the next review.',
  },
};

export function NotesPanel({ role }: { role: Role }) {
  const { notes, create, update, remove } = useNotes(role);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const copy = COPY[role];
  const canSave = body.trim().length > 0;

  async function save() {
    if (!canSave) return;
    await create(title, body);
    setTitle('');
    setBody('');
  }

  return (
    <View style={{ gap: space.md }}>
      {/* ---- composer ---- */}
      <View style={styles.composer}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title (optional)"
          placeholderTextColor={colors.textFaint}
          style={styles.titleInput}
          accessibilityLabel="Note title"
        />
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder={copy.placeholder}
          placeholderTextColor={colors.textFaint}
          multiline
          textAlignVertical="top"
          style={styles.bodyInput}
          accessibilityLabel="Note"
        />
        <Pressable
          onPress={save}
          disabled={!canSave}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSave }}
          style={({ pressed }) => [
            styles.saveBtn,
            !canSave && styles.saveBtnOff,
            pressed && canSave && { opacity: 0.85 },
          ]}
        >
          <Text style={[styles.saveText, !canSave && { color: colors.textMuted }]}>Save note</Text>
        </Pressable>
      </View>

      {/* ---- list, newest first ---- */}
      {notes.length === 0 ? (
        <Text style={styles.empty}>{copy.empty}</Text>
      ) : (
        notes.map((n) => (
          <NoteCard
            key={n.id}
            note={n}
            placeholder={copy.placeholder}
            onEdit={(patch) => void update(n.id, patch)}
            onDelete={() => setConfirmId(n.id)}
          />
        ))
      )}

      <ConfirmDialog
        visible={confirmId !== null}
        title="Delete this note?"
        body="It will be gone from this device. There is no undo."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) void remove(confirmId);
          setConfirmId(null);
        }}
      />
    </View>
  );
}

function NoteCard({
  note,
  placeholder,
  onEdit,
  onDelete,
}: {
  note: Note;
  placeholder: string;
  onEdit: (patch: { title?: string; body?: string }) => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.stamp}>{stamp(note.createdAt)}</Text>
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel="Delete note"
          hitSlop={8}
          style={({ pressed }) => [styles.delete, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>

      <EditableField
        value={note.title ?? ''}
        placeholder="Title (optional)"
        onCommit={(v) => onEdit({ title: v })}
      />
      <EditableField
        value={note.body}
        placeholder={placeholder}
        multiline
        onCommit={(v) => onEdit({ body: v })}
      />

      {note.updatedAt ? <Text style={styles.edited}>Edited {stamp(note.updatedAt)}</Text> : null}
    </View>
  );
}

/** "13 Aug, 2:45 pm" - enough to place a note in time without a full date. */
function stamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}, ${d
    .toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    .toLowerCase()}`;
}

const styles = StyleSheet.create({
  composer: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: space.lg,
    gap: space.sm,
    boxShadow: '0 4px 12px rgba(33,46,84,0.08)',
  },
  titleInput: {
    ...type.h3,
    paddingVertical: space.xs,
    color: colors.text,
  },
  bodyInput: {
    ...type.body,
    minHeight: 92,
    lineHeight: 22,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.md,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    minHeight: touch.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnOff: { backgroundColor: colors.surfaceAlt },
  saveText: { ...type.body, fontWeight: '700', color: colors.onAccent },

  empty: { ...type.small, lineHeight: 20 },

  card: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: space.lg,
    gap: space.sm,
    boxShadow: '0 4px 12px rgba(33,46,84,0.08)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stamp: { ...type.tiny, fontWeight: '700', letterSpacing: 0.3 },
  delete: { minHeight: 28, justifyContent: 'center' },
  deleteText: { ...type.tiny, color: colors.increasedInk, fontWeight: '700' },
  edited: { ...type.tiny, fontStyle: 'italic' },
});
