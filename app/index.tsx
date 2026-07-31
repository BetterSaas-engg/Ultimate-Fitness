import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfile } from '@/store/useProfile';
import { colors } from '@/theme';

/** Gate: onboarded members go straight to Today, everyone else starts at goal. */
export default function Index() {
  const router = useRouter();
  const { profile, loading } = useProfile();

  useEffect(() => {
    if (loading) return;
    router.replace(profile?.onboardedAt ? '/(tabs)' : '/onboarding/goal');
  }, [loading, profile, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}
