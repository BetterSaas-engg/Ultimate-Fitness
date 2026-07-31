import { Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';
import { colors } from '@/theme';

function Icon({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ color, fontSize: 18 }}>{glyph}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => <Icon glyph="◉" color={color} />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color }) => <Icon glyph="▤" color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <Icon glyph="▲" color={color} />,
        }}
      />
    </Tabs>
  );
}
