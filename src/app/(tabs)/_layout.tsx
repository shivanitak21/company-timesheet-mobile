import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { Text, useWindowDimensions, type ColorValue } from 'react-native'
import { fonts } from '@/theme/colors'
import { useTheme } from '@/theme/ThemeProvider'

const ICON_SIZE = 22

function tabIcon(name: keyof typeof Ionicons.glyphMap) {
  return ({ color }: { color: ColorValue }) => <Ionicons name={name} color={color} size={ICON_SIZE} />
}

function TabLabel({ color, children }: { color: ColorValue; children: string }) {
  const { width } = useWindowDimensions()
  const labelWidth = Math.floor(width / 5) - 6
  return (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.72}
      allowFontScaling={false}
      style={{
        color,
        width: labelWidth,
        textAlign: 'center',
        fontFamily: fonts.semibold,
        fontSize: 11,
        lineHeight: 13,
        includeFontPadding: false,
      }}
    >
      {children}
    </Text>
  )
}

export default function TabLayout() {
  const { colors } = useTheme()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.line,
        },
        tabBarItemStyle: { minWidth: 0, paddingHorizontal: 2 },
        tabBarIconStyle: { marginBottom: -2 },
        tabBarLabel: ({ color, children }) => <TabLabel color={color}>{String(children)}</TabLabel>,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: tabIcon('home-outline'),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: tabIcon('time-outline'),
        }}
      />
      <Tabs.Screen
        name="timesheet"
        options={{
          title: 'Timesheet',
          tabBarIcon: tabIcon('calendar-outline'),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: tabIcon('checkbox-outline'),
        }}
      />
      <Tabs.Screen
        name="leaves"
        options={{
          title: 'Leave',
          tabBarIcon: tabIcon('airplane-outline'),
        }}
      />
    </Tabs>
  )
}
