import { router } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { PunchCard } from '@/components/attendance/PunchCard'
import { AppText, Badge, Card, ErrorBlock, LoadingBlock, TabScreen } from '@/components/ui/primitives'
import {
  useAttendanceReport,
  useCalendar,
  useLeaveReport,
  usePendingLeaves,
  usePendingTimesheets,
  useTasks,
  useTodayAttendance,
} from '@/hooks/queries'
import { currentYearMonth, formatHours, formatMinutes, greeting, monthLabel, monthRange, statusLabel } from '@/lib/format'
import { canReview } from '@/lib/roles'
import { statusTone } from '@/lib/status'
import { useAuth } from '@/state/AuthProvider'
import { useTheme } from '@/theme/ThemeProvider'
import { useQueryClient } from '@tanstack/react-query'

export default function DashboardScreen() {
  const { user } = useAuth()
  const { colors } = useTheme()
  const client = useQueryClient()
  const now = currentYearMonth()
  const range = monthRange(now.year, now.month)
  const calendar = useCalendar(now.year, now.month)
  const attendance = useTodayAttendance()
  const tasks = useTasks()
  const attendanceReport = useAttendanceReport(range.from, range.to, user?.id)
  const leaveReport = useLeaveReport(now.year, user?.id)
  const review = canReview(user?.role)
  const pendingSheets = usePendingTimesheets(review)
  const pendingLeaves = usePendingLeaves(review)

  const sheet = calendar.data?.data
  const missing = sheet?.days.filter((day) => day.isFillable && day.entryCount === 0).length ?? 0
  const openTasks = (tasks.data?.data ?? []).filter((task) => task.status !== 'done' && task.status !== 'cancelled')
  const presence = attendanceReport.data?.data.rows[0]
  const leave = leaveReport.data?.data.rows[0]
  const refreshing = calendar.isRefetching || attendance.isRefetching

  return (
    <TabScreen
      eyebrow={monthLabel(now.year, now.month)}
      title={`${greeting()}, ${user?.firstName ?? 'there'}`}
      subtitle="Today’s attendance, this month’s hours, and the work still open."
      refreshing={refreshing}
      onRefresh={() => client.invalidateQueries()}
    >
      <Animated.View entering={FadeInDown.duration(360)}>
        <PunchCard record={attendance.data?.data.attendance} />
      </Animated.View>
      {attendance.isError ? <ErrorBlock message="Attendance could not be loaded." onRetry={() => attendance.refetch()} /> : null}

      <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        <Stat label="Today" value={todayLabel(attendance.data?.data.attendance)} />
        <Stat label="Month hours" value={`${formatHours(sheet?.monthlyTotalMinutes ?? 0)}h`} hint={statusLabel(sheet?.timesheet?.status)} />
        <Stat label="Pending days" value={String(missing)} hint="Fillable days with no entry" />
        <Stat label="Open tasks" value={String(openTasks.length)} hint="Assigned to you" />
        <Stat label="Leave taken" value={String(leave?.approvedDays ?? 0)} hint={`${leave?.pendingDays ?? 0} pending`} />
      </ScrollView>

      <Card>
        <AppText variant="eyebrow">Attendance</AppText>
        <AppText variant="title" style={{ marginTop: 4 }}>This month</AppText>
        {attendanceReport.isLoading ? <LoadingBlock label="Loading summary" /> : null}
        {attendanceReport.isError ? <ErrorBlock message="The attendance summary could not be loaded." onRetry={() => attendanceReport.refetch()} /> : null}
        {presence ? (
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
            <View>
              <AppText variant="display" style={{ fontSize: 28 }}>{presence.daysPresent}</AppText>
              <AppText variant="muted">Days present</AppText>
            </View>
            <View>
              <AppText variant="display" style={{ fontSize: 28 }}>{formatMinutes(presence.totalWorkMinutes)}</AppText>
              <AppText variant="muted">Recorded</AppText>
            </View>
          </View>
        ) : null}
      </Card>

      <Card>
        <AppText variant="eyebrow">Leave</AppText>
        <AppText variant="title" style={{ marginTop: 4 }}>This year</AppText>
        <AppText variant="muted" style={{ marginTop: 4 }}>Approved and pending working days from the leave report.</AppText>
        {leaveReport.isLoading ? <LoadingBlock label="Loading leave" /> : null}
        {leave ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            <Badge label={`Approved ${leave.approvedDays}`} tone="good" />
            <Badge label={`Pending ${leave.pendingDays}`} tone="pending" />
            <Badge label={`Annual ${leave.byType.annual}`} />
            <Badge label={`Sick ${leave.byType.sick}`} />
            <Badge label={`Unpaid ${leave.byType.unpaid}`} />
          </View>
        ) : null}
      </Card>

      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="title">Open tasks</AppText>
          <Pressable onPress={() => router.push('/(tabs)/tasks')}>
            <AppText style={{ color: colors.accent }}>See all</AppText>
          </Pressable>
        </View>
        {tasks.isLoading ? <LoadingBlock /> : null}
        {openTasks.slice(0, 3).map((task) => (
          <View key={task.id} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <AppText variant="label">{task.title}</AppText>
              <AppText variant="muted">{task.project.name ?? 'Project'}</AppText>
            </View>
            <Badge label={statusLabel(task.status)} tone={statusTone(task.status)} />
          </View>
        ))}
        {openTasks.length === 0 && !tasks.isLoading ? <AppText variant="muted">Nothing assigned right now.</AppText> : null}
      </Card>

      {review ? (
        <Pressable onPress={() => router.push('/approvals')}>
          <Card>
            <AppText variant="eyebrow">Review</AppText>
            <AppText variant="title" style={{ marginTop: 4 }}>Approvals</AppText>
            <AppText variant="muted" style={{ marginTop: 4 }}>
              {(pendingSheets.data?.data.length ?? 0) + (pendingLeaves.data?.data.length ?? 0)} waiting for you
            </AppText>
          </Card>
        </Pressable>
      ) : null}
      {calendar.isLoading ? <LoadingBlock label="Loading month" /> : null}
    </TabScreen>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card style={{ width: 148, minHeight: 112 }}>
      <AppText variant="eyebrow">{label}</AppText>
      <AppText variant="title" style={{ marginTop: 8 }}>{value}</AppText>
      {hint ? <AppText variant="muted" style={{ marginTop: 4 }} numberOfLines={2}>{hint}</AppText> : null}
    </Card>
  )
}

function todayLabel(record: { workMinutes: number | null; status: string; checkInAt: string } | null | undefined) {
  if (!record) return '0m'
  if (record.workMinutes != null) return formatMinutes(record.workMinutes)
  if (record.status === 'checked_in') return 'In'
  return '0m'
}
