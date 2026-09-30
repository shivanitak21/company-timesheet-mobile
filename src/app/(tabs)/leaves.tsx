import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Pressable, Text, View } from 'react-native'
import { leaveApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { DateField, SelectField, TextArea } from '@/components/ui/fields'
import { AppText, Badge, Button, Card, EmptyBlock, ErrorBlock, LoadingBlock, TabScreen } from '@/components/ui/primitives'
import { useLeaves } from '@/hooks/queries'
import { formatDate, statusLabel } from '@/lib/format'
import { statusTone } from '@/lib/status'
import { fonts } from '@/theme/colors'
import { useTheme } from '@/theme/ThemeProvider'
import { useToast } from '@/state/ToastProvider'
import type { LeaveStatus } from '@/types/api'
import { leaveSchema, type LeaveValues } from '@/validation/schemas'

const FILTERS: { id: LeaveStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
]

export default function LeavesScreen() {
  const [filter, setFilter] = useState<LeaveStatus | 'all'>('all')
  const [open, setOpen] = useState(false)
  const leaves = useLeaves(filter === 'all' ? undefined : filter)
  const toast = useToast()
  const client = useQueryClient()
  const { colors } = useTheme()
  const form = useForm<LeaveValues>({
    resolver: zodResolver(leaveSchema),
    defaultValues: { type: 'annual', startDate: '', endDate: '', reason: '' },
  })

  async function refresh() {
    await client.invalidateQueries({ predicate: (query) => ['leaves', 'pending-leaves', 'calendar', 'report-leaves'].includes(String(query.queryKey[0])) })
  }

  const create = useMutation({
    mutationFn: leaveApi.create,
    onSuccess: async () => {
      toast.push('Leave requested')
      form.reset({ type: 'annual', startDate: '', endDate: '', reason: '' })
      setOpen(false)
      await refresh()
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  const cancel = useMutation({
    mutationFn: (id: string) => leaveApi.cancel(id),
    onSuccess: async () => {
      toast.push('Leave cancelled')
      await refresh()
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  return (
    <TabScreen
      eyebrow="Time away"
      title="Leave"
      subtitle="Request time away. Approved dates are blocked on your timesheet by the API."
      refreshing={leaves.isRefetching}
      onRefresh={() => leaves.refetch()}
    >
      <Button label={open ? 'Hide request' : 'Request leave'} variant={open ? 'secondary' : 'primary'} onPress={() => setOpen((value) => !value)} />
      {open ? (
        <Card style={{ gap: 12 }}>
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <SelectField
                label="Type"
                value={field.value}
                placeholder="Type"
                options={[
                  { value: 'annual', label: 'Annual' },
                  { value: 'sick', label: 'Sick' },
                  { value: 'unpaid', label: 'Unpaid' },
                  { value: 'other', label: 'Other' },
                ]}
                onChange={field.onChange}
                error={form.formState.errors.type?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="startDate"
            render={({ field }) => <DateField label="Start" value={field.value} onChange={field.onChange} error={form.formState.errors.startDate?.message} />}
          />
          <Controller
            control={form.control}
            name="endDate"
            render={({ field }) => <DateField label="End" value={field.value} onChange={field.onChange} error={form.formState.errors.endDate?.message} />}
          />
          <Controller
            control={form.control}
            name="reason"
            render={({ field }) => (
              <TextArea value={field.value} onChangeText={field.onChange} placeholder="Reason" error={form.formState.errors.reason?.message} />
            )}
          />
          {form.formState.errors.reason?.message ? (
            <Text style={{ color: colors.danger, fontFamily: fonts.medium, fontSize: 12 }}>{form.formState.errors.reason.message}</Text>
          ) : null}
          <Button label="Submit request" loading={create.isPending} onPress={form.handleSubmit((values) => create.mutate(values))} />
        </Card>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {FILTERS.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setFilter(item.id)}
            style={{
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: filter === item.id ? colors.accent : colors.line,
              backgroundColor: filter === item.id ? colors.accentSoft : colors.card,
            }}
          >
            <Text style={{ color: filter === item.id ? colors.accent : colors.ink, fontFamily: fonts.semibold }}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      {leaves.isLoading ? <LoadingBlock label="Loading leave" /> : null}
      {leaves.isError ? <ErrorBlock message={errorMessage(leaves.error)} onRetry={() => leaves.refetch()} /> : null}
      {(leaves.data?.data.length ?? 0) === 0 && !leaves.isLoading ? (
        <EmptyBlock title="No leave yet" body="Requests you make will be listed here." />
      ) : null}
      {leaves.data?.data.map((leave) => (
        <Card key={leave.id} style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Badge label={statusLabel(leave.type)} />
            <Badge label={statusLabel(leave.status)} tone={statusTone(leave.status)} />
          </View>
          <AppText variant="label">
            {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
          </AppText>
          <AppText variant="muted">{leave.dayCount} working day{leave.dayCount === 1 ? '' : 's'}</AppText>
          <AppText variant="body">{leave.reason}</AppText>
          {leave.rejectionReason ? <AppText variant="muted">{leave.rejectionReason}</AppText> : null}
          {leave.status === 'pending' ? (
            <Button label="Cancel request" variant="ghost" loading={cancel.isPending} onPress={() => cancel.mutate(leave.id)} />
          ) : null}
        </Card>
      ))}
    </TabScreen>
  )
}
