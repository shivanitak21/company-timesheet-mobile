import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, type TextProps, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useUnreadCount } from '@/hooks/queries'
import { initials, personName } from '@/lib/format'
import { useAuth } from '@/state/AuthProvider'
import { fonts } from '@/theme/colors'
import { useTheme } from '@/theme/ThemeProvider'
import type { Tone } from '@/lib/status'

type Variant = 'display' | 'title' | 'body' | 'muted' | 'eyebrow' | 'label'

export function AppText({ variant = 'body', style, ...props }: TextProps & { variant?: Variant }) {
  const { colors } = useTheme()
  const variants = {
    display: { fontFamily: fonts.display, color: colors.ink, fontSize: 32, lineHeight: 38 },
    title: { fontFamily: fonts.display, color: colors.ink, fontSize: 26, lineHeight: 32 },
    body: { fontFamily: fonts.body, color: colors.ink, fontSize: 15, lineHeight: 22 },
    muted: { fontFamily: fonts.body, color: colors.muted, fontSize: 14, lineHeight: 20 },
    eyebrow: {
      fontFamily: fonts.semibold,
      color: colors.gold,
      fontSize: 11,
      letterSpacing: 1.4,
      textTransform: 'uppercase' as const,
    },
    label: { fontFamily: fonts.semibold, color: colors.ink, fontSize: 13, lineHeight: 18 },
  }
  return <Text {...props} style={[variants[variant], style]} />
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { colors, theme } = useTheme()
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.line,
          shadowOpacity: theme === 'dark' ? 0.28 : 0.06,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const { colors } = useTheme()
  const map = {
    neutral: { bg: colors.canvas, fg: colors.muted },
    pending: { bg: colors.pendingSoft, fg: colors.gold },
    good: { bg: colors.goodSoft, fg: colors.accent },
    bad: { bg: colors.badSoft, fg: colors.danger },
    info: { bg: colors.infoSoft, fg: colors.info },
  }
  const toneStyle = map[tone]
  return (
    <View style={[styles.badge, { backgroundColor: toneStyle.bg }]}>
      <Text style={{ color: toneStyle.fg, fontFamily: fonts.semibold, fontSize: 12 }}>{label}</Text>
    </View>
  )
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
}: {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  disabled?: boolean
  loading?: boolean
}) {
  const { colors } = useTheme()
  const background =
    variant === 'primary' ? colors.accent : variant === 'danger' ? colors.danger : variant === 'secondary' ? colors.canvas : 'transparent'
  const color = variant === 'primary' ? colors.onAccent : variant === 'danger' ? '#fff' : colors.ink
  const border = variant === 'ghost' || variant === 'secondary' ? colors.line : 'transparent'
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: background,
          borderColor: border,
          opacity: disabled ? 0.45 : pressed ? 0.86 : 1,
        },
      ]}
    >
      {loading ? <ActivityIndicator color={color} /> : <Text style={{ color, fontFamily: fonts.semibold, fontSize: 15 }}>{label}</Text>}
    </Pressable>
  )
}

export function IconButton({
  name,
  label,
  onPress,
  badge,
}: {
  name: keyof typeof Ionicons.glyphMap
  label: string
  onPress: () => void
  badge?: number
}) {
  const { colors } = useTheme()
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.card, borderColor: colors.line, opacity: pressed ? 0.75 : 1 }]}
    >
      <Ionicons name={name} size={18} color={colors.ink} />
      {badge && badge > 0 ? (
        <View style={[styles.dot, { backgroundColor: colors.danger }]}>
          <Text style={styles.dotText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  )
}

export function HeaderActions() {
  const unread = useUnreadCount()
  const { user } = useAuth()
  const { colors } = useTheme()
  const count = unread.data?.data.unreadCount ?? 0
  return (
    <View style={styles.actions}>
      <IconButton name="notifications-outline" label="Notifications" badge={count} onPress={() => router.push('/notifications')} />
      <Pressable
        accessibilityLabel="Profile"
        onPress={() => router.push('/profile')}
        style={({ pressed }) => [styles.avatar, { backgroundColor: colors.accentSoft, opacity: pressed ? 0.8 : 1 }]}
      >
        <Text style={{ color: colors.accent, fontFamily: fonts.semibold, fontSize: 13 }}>{initials(personName(user))}</Text>
      </Pressable>
    </View>
  )
}

export function TabScreen({
  eyebrow,
  title,
  subtitle,
  children,
  onRefresh,
  refreshing,
  footer,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  children: ReactNode
  onRefresh?: () => void
  refreshing?: boolean
  footer?: ReactNode
}) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top + 8 }}>
      <View style={styles.header}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          {eyebrow ? <AppText variant="eyebrow">{eyebrow}</AppText> : null}
          <AppText variant="display" style={{ marginTop: eyebrow ? 4 : 0 }}>{title}</AppText>
          {subtitle ? <AppText variant="muted" style={{ marginTop: 6 }}>{subtitle}</AppText> : null}
        </View>
        <HeaderActions />
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
          ) : undefined
        }
        contentContainerStyle={styles.scroll}
      >
        {children}
      </ScrollView>
      {footer ? (
        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.line, paddingBottom: Math.max(insets.bottom, 12) }]}>
          {footer}
        </View>
      ) : null}
    </View>
  )
}

export function StackScreen({
  children,
  onRefresh,
  refreshing,
  footer,
}: {
  children: ReactNode
  onRefresh?: () => void
  refreshing?: boolean
  footer?: ReactNode
}) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
          ) : undefined
        }
        contentContainerStyle={styles.scroll}
      >
        {children}
      </ScrollView>
      {footer ? (
        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.line, paddingBottom: Math.max(insets.bottom, 12) }]}>
          {footer}
        </View>
      ) : null}
    </View>
  )
}

export function LoadingBlock({ label = 'Loading' }: { label?: string }) {
  const { colors } = useTheme()
  return (
    <View style={styles.state}>
      <ActivityIndicator color={colors.accent} />
      <AppText variant="muted" style={{ marginTop: 10 }}>{label}</AppText>
    </View>
  )
}

export function EmptyBlock({ title, body }: { title: string; body: string }) {
  const { colors } = useTheme()
  return (
    <Card style={styles.stateCard}>
      <View style={[styles.emptyMark, { backgroundColor: colors.accentSoft }]}>
        <Ionicons name="leaf-outline" size={22} color={colors.accent} />
      </View>
      <AppText variant="title" style={{ textAlign: 'center', marginTop: 12 }}>{title}</AppText>
      <AppText variant="muted" style={{ textAlign: 'center', marginTop: 6 }}>{body}</AppText>
    </Card>
  )
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card style={styles.stateCard}>
      <AppText variant="title" style={{ textAlign: 'center' }}>Something didn’t load</AppText>
      <AppText variant="muted" style={{ textAlign: 'center', marginTop: 6 }}>{message}</AppText>
      {onRetry ? <View style={{ marginTop: 14 }}><Button label="Try again" variant="secondary" onPress={onRetry} /></View> : null}
    </Card>
  )
}

export function ScreenLoader() {
  const { colors } = useTheme()
  return (
    <View style={[styles.loader, { backgroundColor: colors.canvas }]}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#171b22',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  button: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  dotText: { color: '#fff', fontSize: 9, fontFamily: fonts.bold },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingBottom: 12 },
  scroll: { paddingHorizontal: 20, paddingBottom: 28, gap: 14 },
  footer: { borderTopWidth: 1, paddingHorizontal: 20, paddingTop: 12 },
  state: { alignItems: 'center', paddingVertical: 28 },
  stateCard: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 },
  emptyMark: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
