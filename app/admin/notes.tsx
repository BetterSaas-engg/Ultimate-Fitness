import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminBar, AdminHeading } from '@/components/admin/AdminChrome';
import { NotesPanel } from '@/components/NotesPanel';
import { useProfile } from '@/store/useProfile';
import { colors, space, type } from '@/theme';

/** Staff notes. Same panel as the member's, filtered to whoever is signed in. */
export default function AdminNotes() {
  const { profile } = useProfile();
  const role = profile?.role ?? 'member';

  if (role === 'member') {
    return (
      <SafeAreaView style={styles.safe}>
        <AdminBar role={role} />
        <View style={styles.content}>
          <Text style={type.small}>Switch to Trainer or Nutritionist on the Progress tab.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AdminBar role={role} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AdminHeading
          title="Notes"
          subtitle={
            role === 'trainer'
              ? 'Your own working notes. The member cannot see these, and neither can the nutritionist.'
              : 'Your own working notes. The member cannot see these, and neither can the trainer.'
          }
        />
        <NotesPanel role={role} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, paddingBottom: space.xxl },
});
