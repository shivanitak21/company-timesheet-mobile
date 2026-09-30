import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { AppText, Button, Card, EmptyBlock, ErrorBlock, LoadingBlock, StackScreen } from '@/components/ui/primitives'
import { useNotifications } from '@/hooks/queries'
import { formatDateTime } from '@/lib/format'
import { useTheme } from '@/theme/ThemeProvider'
import { useToast } from '@/state/ToastProvider'
import { Pressable } from 'react-native'

export default function NotificationsScreen() {
  const notes = useNotifications()
  const toast = useToast()
  const client = useQueryClient()
  const { colors } = useTheme()

  async function refresh() {
    await client.invalidateQueries({ predicate: (query) => ['notifications', 'unread'].includes(String(query.queryKey[0])) })
  }

  const markOne = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: refresh,
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  const markAll = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: async () => {
      toast.push('Notifications cleared')
      await refresh()
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  return (
    <StackScreen refreshing={notes.isRefetching} onRefresh={() => notes.refetch()}>
      <Button label="Mark all read" variant="secondary" loading={markAll.isPending} onPress={() => markAll.mutate()} />
      {notes.isLoading ? <LoadingBlock label="Loading notifications" /> : null}
      {notes.isError ? <ErrorBlock message={errorMessage(notes.error)} onRetry={() => notes.refetch()} /> : null}
      {(notes.data?.data.length ?? 0) === 0 && !notes.isLoading ? (
        <EmptyBlock title="You’re caught up" body="Approvals, assignments, and updates will land here." />
      ) : null}
      {notes.data?.data.map((item) => (
        <Pressable key={item.id} onPress={() => (item.readAt ? undefined : markOne.mutate(item.id))}>
          <Card style={{ gap: 6, backgroundColor: item.readAt ? colors.card : colors.accentSoft }}>
            <AppText variant="label">{item.title}</AppText>
            <AppText variant="body">{item.message}</AppText>
            <AppText variant="muted">{formatDateTime(item.createdAt)}</AppText>
          </Card>
        </Pressable>
      ))}
    </StackScreen>
  )
}
