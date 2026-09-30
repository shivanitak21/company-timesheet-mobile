import { useQueryClient } from '@tanstack/react-query'
import { View } from 'react-native'
import { PunchCard } from '@/components/attendance/PunchCard'
import { AppText, Card, EmptyBlock, ErrorBlock, LoadingBlock, TabScreen } from '@/components/ui/primitives'
import { useAttendanceHistory, useTodayAttendance } from '@/hooks/queries'
import { currentYearMonth, formatDate, formatMinutes, formatTime, monthLabel, monthRange } from '@/lib/format'

export default function AttendanceScreen() {
  const now = currentYearMonth()
  const range = monthRange(now.year, now.month)
  const today = useTodayAttendance()
  const history = useAttendanceHistory(range.from, range.to)
  const client = useQueryClient()

  return (
    <TabScreen
      eyebrow="Presence"
      title="Attendance"
      subtitle={`Check in and out for today. ${monthLabel(now.year, now.month)} comes from your attendance record.`}
      refreshing={today.isRefetching || history.isRefetching}
      onRefresh={() =>
        client.invalidateQueries({
          predicate: (query) => String(query.queryKey[0]).startsWith('attendance') || String(query.queryKey[0]) === 'report-attendance',
        })
      }
    >
      {today.isLoading ? <LoadingBlock label="Loading today" /> : <PunchCard record={today.data?.data.attendance} showNotes />}
      {today.isError ? <ErrorBlock message="Today’s attendance could not be loaded." onRetry={() => today.refetch()} /> : null}
      <AppText variant="title">This month</AppText>
      {history.isLoading ? <LoadingBlock /> : null}
      {history.isError ? <ErrorBlock message="History could not be loaded." onRetry={() => history.refetch()} /> : null}
      {(history.data?.data.rows.length ?? 0) === 0 && !history.isLoading ? (
        <EmptyBlock title="No attendance yet" body="Check in on a working day and it will show up here." />
      ) : null}
      {history.data?.data.rows.map((row) => (
        <Card key={row.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <AppText variant="label">{formatDate(row.date)}</AppText>
            <AppText variant="muted">
              {formatTime(row.checkInAt)}
              {row.checkOutAt ? ` – ${formatTime(row.checkOutAt)}` : ' · still in'}
            </AppText>
          </View>
          <AppText variant="title" style={{ fontSize: 22 }}>
            {formatMinutes(row.workMinutes ?? 0)}
          </AppText>
        </Card>
      ))}
    </TabScreen>
  )
}
