import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { attendanceApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { TextField } from '@/components/ui/fields'
import { AppText, Badge, Button, Card } from '@/components/ui/primitives'
import { elapsedMinutes, formatMinutes, formatTime, statusLabel } from '@/lib/format'
import { statusTone } from '@/lib/status'
import { useToast } from '@/state/ToastProvider'
import type { Attendance } from '@/types/api'

export function PunchCard({
  record,
  showNotes = false,
}: {
  record: Attendance | null | undefined
  showNotes?: boolean
}) {
  const [notes, setNotes] = useState('')
  const [now, setNow] = useState(Date.now())
  const toast = useToast()
  const client = useQueryClient()
  const checkedIn = record?.status === 'checked_in'

  useEffect(() => {
    if (!checkedIn) return
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [checkedIn])

  const punch = useMutation({
    mutationFn: (kind: 'in' | 'out') => (kind === 'in' ? attendanceApi.checkIn(notes) : attendanceApi.checkOut(notes)),
    onSuccess: async () => {
      toast.push('Attendance updated')
      setNotes('')
      await client.invalidateQueries({
        predicate: (query) => ['attendance-today', 'attendance-history', 'report-attendance', 'calendar'].includes(String(query.queryKey[0])),
      })
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  const hours =
    record?.workMinutes != null
      ? formatMinutes(record.workMinutes)
      : checkedIn && record
        ? formatMinutes(elapsedMinutes(record.checkInAt, now))
        : '0m'

  return (
    <Card>
      <Badge label={record ? statusLabel(record.status) : 'Away'} tone={statusTone(record?.status)} />
      <AppText variant="title" style={{ marginTop: 10 }}>
        {record ? statusLabel(record.status) : 'Not checked in'}
      </AppText>
      <AppText variant="muted" style={{ marginTop: 4 }}>
        {record
          ? `In ${formatTime(record.checkInAt)}${record.checkOutAt ? ` · Out ${formatTime(record.checkOutAt)}` : ''}`
          : 'Start the day when you arrive.'}
      </AppText>
      <AppText variant="display" style={{ marginTop: 12, fontSize: 36 }}>
        {hours}
      </AppText>
      <AppText variant="muted">{checkedIn ? 'So far, until you check out' : 'Recorded today'}</AppText>
      {showNotes ? <TextField value={notes} onChangeText={setNotes} placeholder="Optional note" style={{ marginTop: 14 }} /> : null}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <View style={{ flex: 1 }}>
          <Button
            label="Check in"
            disabled={punch.isPending || Boolean(record)}
            loading={punch.isPending && punch.variables === 'in'}
            onPress={() => punch.mutate('in')}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label="Check out"
            variant="secondary"
            disabled={punch.isPending || !checkedIn}
            loading={punch.isPending && punch.variables === 'out'}
            onPress={() => punch.mutate('out')}
          />
        </View>
      </View>
    </Card>
  )
}
