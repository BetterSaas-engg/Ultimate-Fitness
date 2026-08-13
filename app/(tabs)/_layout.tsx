import { Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfile } from '@/store/useProfile';
import { colors } from '@/theme';

/**
 * Height of the bar's own content, before any safe-area inset.
 *
 * Each tab is a column flex container that needs icon (28) + label (16) + its
 * own 10px padding = 54, plus the bar's 6/8 padding = 68. At the old 62 the
 * label was a flex item with nowhere to go: it shrank to 9px and its
 * overflow: hidden cut the descender off "Today" on every platform.
 */
const TAB_BAR_CONTENT_HEIGHT = 70;

function Icon({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ color, fontSize: 18 }}>{glyph}</Text>;
}

export default function TabsLayout() {
  const { profile } = useProfile();
  const insets = useSafeAreaInsets();
  // Admin is hidden entirely for members - the member experience is untouched.
  const showAdmin = (profile?.role ?? 'member') !== 'member';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentInk,
        tabBarInactiveTintColor: colors.textMuted,
        // Both values have to carry insets.bottom. react-navigation only adds
        // the inset itself when height is left unset (getTabBarHeight returns a
        // numeric height verbatim), and tabBarStyle is merged last - so a bare
        // `height: 62, paddingBottom: 8` dropped the inset AND overrode the
        // library's own `paddingBottom: insets.bottom`. On an installed iPhone
        // PWA that put the labels under the home indicator.
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 6,
        },
        // lineHeight is not optional here: the label renders with
        // overflow: hidden, and at the default line box a 12px label gets a 9px
        // box - which clips the descender off "Today" on every platform.
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700', lineHeight: 16 },
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
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: showAdmin ? undefined : null,
          tabBarIcon: ({ color }) => <Icon glyph="✎" color={color} />,
        }}
      />
    </Tabs>
  );
}
