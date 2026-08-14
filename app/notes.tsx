import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/BrandHeader';
import { NotesPanel } from '@/components/NotesPanel';
import { colors, space, touch, type } from '@/theme';

/**
 * The member's notes. Reached from Progress rather than a fourth tab - three
 * tabs is already the right number, and notes are something you go to
 * deliberately rather than check daily.
 */
export default function MemberNotes() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <BrandHeader />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/progress'))}
          accessibilityRole="button"
          style={styles.back}
        >
          <Text style={styles.backText}>‹  Progress</Text>
        </Pressable>

        <Text style={type.h1}>Notes</Text>
        <Text style={styles.sub}>
          Yours alone, kept on this device. Your trainer and nutritionist keep their own.
        </Text>

        <View style={{ marginTop: space.lg }}>
          <NotesPanel role="member" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, paddingBottom: space.xxl },
  back: { minHeight: touch.min, justifyContent: 'center' },
  backText: { ...type.small, color: colors.accentInk, fontWeight: '700' },
  sub: { ...type.small, marginTop: 3, lineHeight: 20 },
});
