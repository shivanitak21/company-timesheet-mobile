import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { timesheetApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { MonthGrid } from '@/components/calendar/MonthGrid'
import { AppText, Button, Card, ErrorBlock, LoadingBlock, TabScreen } from '@/components/ui/primitives'
import { useCalendar } from '@/hooks/queries'
import { coversOpenWindow, currentYearMonth, dayTapMessage, formatHours, monthLabel, shiftMonth, statusLabel } from '@/lib/format'
import { useToast } from '@/state/ToastProvider'
import type { CalendarDay } from '@/types/api'

export default function TimesheetScreen() {
  const [cursor, setCursor] = useState(currentYearMonth)
  const [alignedToCompany, setAlignedToCompany] = useState(false)
  const calendar = useCalendar(cursor.year, cursor.month)
  const client = useQueryClient()
  const toast = useToast()
  const data = calendar.data?.data
  const companyToday = data?.entryWindow?.today
  useEffect(() => {
    if (!companyToday || alignedToCompany) return
    const [year, month] = companyToday.split('-').map(Number)
    if (year && month) setCursor({ year, month })
    setAlignedToCompany(true)
  }, [alignedToCompany, companyToday])
  const canSubmit =
    coversOpenWindow(cursor.year, cursor.month, data?.entryWindow?.today, data?.entryWindow?.yesterday) &&
    (data?.timesheet?.status === 'draft' || data?.timesheet?.status === 'rejected')
  const submit = useMutation({
    mutationFn: (id: string) => timesheetApi.submit(id),
    onSuccess: async () => {
      toast.push('Timesheet submitted')
      await client.invalidateQueries({ predicate: (query) => String(query.queryKey[0]) === 'calendar' })
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  function openDay(day: CalendarDay) {
    const message = dayTapMessage(day)
    if (message) {
      toast.push(message)
      return
    }
    router.push({ pathname: '/day/[date]', params: { date: day.date } })
  }

  return (
    <TabScreen
      eyebrow="Time"
      title="Timesheet"
      subtitle="The month stays visible. Add and edit follow the days the API marks as open."
      refreshing={calendar.isRefetching}
      onRefresh={() => calendar.refetch()}
      footer={
        canSubmit && data?.timesheet ? (
          <Button
            label="Submit timesheet"
            loading={submit.isPending}
            onPress={() =>
              Alert.alert('Submit this month?', 'Your manager will be asked to review it.', [
                { text: 'Not now', style: 'cancel' },
                { text: 'Submit', onPress: () => submit.mutate(data.timesheet!.id) },
              ])
            }
          />
        ) : undefined
      }
    >
      {calendar.isLoading ? <LoadingBlock label="Loading calendar" /> : null}
      {calendar.isError ? <ErrorBlock message={errorMessage(calendar.error)} onRetry={() => calendar.refetch()} /> : null}
      {data?.timesheet?.status === 'rejected' && data.timesheet.rejectionReason ? (
        <Card>
          <AppText variant="eyebrow">Needs another look</AppText>
          <AppText variant="body" style={{ marginTop: 6 }}>{data.timesheet.rejectionReason}</AppText>
        </Card>
      ) : null}
      <MonthGrid
        year={cursor.year}
        month={cursor.month}
        data={data}
        onMonthChange={(delta) => setCursor((currentMonth) => shiftMonth(currentMonth.year, currentMonth.month, delta))}
        onSelect={openDay}
      />
      <Card>
        <AppText variant="label">{monthLabel(cursor.year, cursor.month)}</AppText>
        <AppText variant="muted" style={{ marginTop: 4 }}>
          {statusLabel(data?.timesheet?.status)} · {formatHours(data?.monthlyTotalMinutes ?? 0)}h
          {data && !coversOpenWindow(cursor.year, cursor.month, data.entryWindow?.today, data.entryWindow?.yesterday) ? ' · read only' : ''}
        </AppText>
      </Card>
    </TabScreen>
  )
}
