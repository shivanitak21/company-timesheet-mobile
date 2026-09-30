import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Stack, useLocalSearchParams } from 'expo-router'
import { Alert, View } from 'react-native'
import type { ReactNode } from 'react'
import { timesheetApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { EntryEditor } from '@/components/timesheet/EntryEditor'
import { AppText, Badge, Button, Card, ErrorBlock, LoadingBlock, StackScreen } from '@/components/ui/primitives'
import { useDaily } from '@/hooks/queries'
import { formatMinutes, formatWeekday, lockMessage, statusLabel } from '@/lib/format'
import { statusTone } from '@/lib/status'
import { useToast } from '@/state/ToastProvider'

export default function DailyTimesheetScreen() {
  const { date } = useLocalSearchParams<{ date: string }>()
  const day = typeof date === 'string' ? date : ''
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(day)
  const daily = useDaily(valid ? day : null)
  const data = daily.data?.data
  const toast = useToast()
  const client = useQueryClient()
  const sheet = data?.timesheet
  const monthLocked = Boolean(data?.lockReasons.includes('previous_month') || data?.lockReasons.includes('future'))
  const canSubmit = Boolean(sheet && !monthLocked && (sheet.status === 'draft' || sheet.status === 'rejected'))

  const submit = useMutation({
    mutationFn: (id: string) => timesheetApi.submit(id),
    onSuccess: async () => {
      toast.push('Timesheet submitted')
      await client.invalidateQueries({ predicate: (query) => ['calendar', 'daily'].includes(String(query.queryKey[0])) })
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  return (
    <>
      <Stack.Screen options={{ title: valid ? formatWeekday(day) : 'Daily timesheet' }} />
      <StackScreen
        refreshing={daily.isRefetching}
        onRefresh={() => daily.refetch()}
        footer={
          canSubmit && sheet ? (
            <Button
              label="Submit timesheet"
              loading={submit.isPending}
              onPress={() =>
                Alert.alert('Submit this month?', 'Your manager will be asked to review it.', [
                  { text: 'Not now', style: 'cancel' },
                  { text: 'Submit', onPress: () => submit.mutate(sheet.id) },
                ])
              }
            />
          ) : undefined
        }
      >
        {!valid ? <ErrorBlock message="This day is missing." /> : null}
        {daily.isLoading ? <LoadingBlock label="Loading day" /> : null}
        {daily.isError ? <ErrorBlock message={errorMessage(daily.error)} onRetry={() => daily.refetch()} /> : null}
        {data ? (
          <>
            <Card style={{ gap: 8 }}>
              <Row>
                <AppText variant="title">{formatMinutes(data.totalMinutes)}</AppText>
                <Badge label={statusLabel(sheet?.status)} tone={statusTone(sheet?.status)} />
              </Row>
              <AppText variant="muted">Daily total</AppText>
              <AppText variant="body">{data.isFillable ? 'This weekday can be edited.' : lockMessage(data.lockReasons)}</AppText>
              {sheet?.status === 'rejected' && sheet.rejectionReason ? <AppText variant="body">{sheet.rejectionReason}</AppText> : null}
            </Card>
            <EntryEditor date={data.date} entries={data.entries} editable={data.isFillable} />
          </>
        ) : null}
      </StackScreen>
    </>
  )
}

function Row({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>{children}</View>
}
