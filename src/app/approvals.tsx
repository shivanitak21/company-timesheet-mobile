import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Redirect } from 'expo-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { leaveApi, timesheetApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { Field, TextArea } from '@/components/ui/fields'
import { AppText, Badge, Button, Card, EmptyBlock, ErrorBlock, LoadingBlock, StackScreen } from '@/components/ui/primitives'
import { usePendingLeaves, usePendingTimesheets } from '@/hooks/queries'
import { formatDate, monthLabel, personName, statusLabel } from '@/lib/format'
import { canReview } from '@/lib/roles'
import { useAuth } from '@/state/AuthProvider'
import { useToast } from '@/state/ToastProvider'
import { rejectSchema, type RejectValues } from '@/validation/schemas'

export default function ApprovalsScreen() {
  const { user, status } = useAuth()
  const sheets = usePendingTimesheets(canReview(user?.role))
  const leaves = usePendingLeaves(canReview(user?.role))
  const toast = useToast()
  const client = useQueryClient()
  const [rejecting, setRejecting] = useState<{ kind: 'timesheet' | 'leave'; id: string } | null>(null)
  const form = useForm<RejectValues>({ resolver: zodResolver(rejectSchema), defaultValues: { reason: '' } })

  if (status === 'loading') return <LoadingBlock />
  if (!canReview(user?.role)) return <Redirect href="/(tabs)" />

  async function refresh() {
    await client.invalidateQueries({
      predicate: (query) => ['pending-timesheets', 'pending-leaves', 'leaves', 'calendar'].includes(String(query.queryKey[0])),
    })
  }

  const decide = useMutation({
    mutationFn: async (input: { kind: 'timesheet' | 'leave'; id: string; action: 'approve' | 'reject'; reason?: string }) => {
      if (input.kind === 'timesheet' && input.action === 'approve') return timesheetApi.approve(input.id)
      if (input.kind === 'timesheet') return timesheetApi.reject(input.id, input.reason ?? '')
      if (input.action === 'approve') return leaveApi.approve(input.id)
      return leaveApi.reject(input.id, input.reason ?? '')
    },
    onSuccess: async () => {
      toast.push('Updated')
      setRejecting(null)
      form.reset({ reason: '' })
      await refresh()
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  return (
    <StackScreen refreshing={sheets.isRefetching || leaves.isRefetching} onRefresh={refresh}>
      <AppText variant="muted">Pending timesheets and leave for people you can review.</AppText>
      <AppText variant="title">Timesheets</AppText>
      {sheets.isLoading ? <LoadingBlock /> : null}
      {sheets.isError ? <ErrorBlock message={errorMessage(sheets.error)} onRetry={() => sheets.refetch()} /> : null}
      {(sheets.data?.data.length ?? 0) === 0 && !sheets.isLoading ? <EmptyBlock title="No timesheets waiting" body="Submitted months will appear here." /> : null}
      {sheets.data?.data.map((sheet) => (
        <Card key={sheet.id} style={{ gap: 8 }}>
          <AppText variant="label">{personName(sheet.employee)}</AppText>
          <AppText variant="muted">
            {monthLabel(sheet.year, sheet.month)} · {statusLabel(sheet.status)}
          </AppText>
          <ViewActions
            onApprove={() => decide.mutate({ kind: 'timesheet', id: sheet.id, action: 'approve' })}
            onReject={() => setRejecting({ kind: 'timesheet', id: sheet.id })}
          />
        </Card>
      ))}
      <AppText variant="title">Leave</AppText>
      {leaves.isLoading ? <LoadingBlock /> : null}
      {leaves.isError ? <ErrorBlock message={errorMessage(leaves.error)} onRetry={() => leaves.refetch()} /> : null}
      {(leaves.data?.data.length ?? 0) === 0 && !leaves.isLoading ? <EmptyBlock title="No leave waiting" body="New requests will land here." /> : null}
      {leaves.data?.data.map((leave) => (
        <Card key={leave.id} style={{ gap: 8 }}>
          <AppText variant="label">{personName(leave.user)}</AppText>
          <Badge label={statusLabel(leave.type)} />
          <AppText variant="muted">
            {formatDate(leave.startDate)} – {formatDate(leave.endDate)} · {leave.dayCount} days
          </AppText>
          <AppText variant="body">{leave.reason}</AppText>
          <ViewActions
            onApprove={() => decide.mutate({ kind: 'leave', id: leave.id, action: 'approve' })}
            onReject={() => setRejecting({ kind: 'leave', id: leave.id })}
          />
        </Card>
      ))}
      {rejecting ? (
        <Card style={{ gap: 12 }}>
          <AppText variant="title">Rejection reason</AppText>
          <Field label="Reason" error={form.formState.errors.reason?.message}>
            <TextArea value={form.watch('reason')} onChangeText={(value) => form.setValue('reason', value)} placeholder="Why is this being sent back?" />
          </Field>
          <Button
            label="Reject"
            variant="danger"
            loading={decide.isPending}
            onPress={form.handleSubmit((values) => decide.mutate({ ...rejecting, action: 'reject', reason: values.reason }))}
          />
          <Button label="Cancel" variant="ghost" onPress={() => setRejecting(null)} />
        </Card>
      ) : null}
    </StackScreen>
  )
}

function ViewActions({ onApprove, onReject }: { onApprove: () => void; onReject: () => void }) {
  return (
    <>
      <Button label="Approve" onPress={onApprove} />
      <Button label="Reject" variant="secondary" onPress={onReject} />
    </>
  )
}
