import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {/* The title has to come from here, not +html.tsx: expo-router renders
          its own <title> first, and the browser takes the first one. */}
      <Head>
        <title>Ultimate Fitness</title>
        <meta
          name="description"
          content="Your training plan, meals and class schedule from Durham Ultimate Fitness Club."
        />
      </Head>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
    </SafeAreaProvider>
  );
}
