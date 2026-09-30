import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { taskApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { AppText, Badge, Card, EmptyBlock, ErrorBlock, LoadingBlock, TabScreen } from '@/components/ui/primitives'
import { useTasks } from '@/hooks/queries'
import { formatDate, statusLabel } from '@/lib/format'
import { statusTone } from '@/lib/status'
import { fonts } from '@/theme/colors'
import { useTheme } from '@/theme/ThemeProvider'
import { useToast } from '@/state/ToastProvider'
import type { TaskStatus } from '@/types/api'

const FILTERS: { id: TaskStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'todo', label: 'To do' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'done', label: 'Done' },
]

const NEXT: Record<string, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
}

export default function TasksScreen() {
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all')
  const tasks = useTasks(filter === 'all' ? undefined : filter)
  const toast = useToast()
  const client = useQueryClient()
  const update = useMutation({
    mutationFn: (input: { id: string; status: TaskStatus }) => taskApi.update(input.id, { status: input.status }),
    onSuccess: async () => {
      toast.push('Task updated')
      await client.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  return (
    <TabScreen
      eyebrow="Work"
      title="Tasks"
      subtitle="Assigned work. You can move your own tasks between to do, in progress, and done."
      refreshing={tasks.isRefetching}
      onRefresh={() => tasks.refetch()}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {FILTERS.map((item) => (
          <Chip key={item.id} label={item.label} active={filter === item.id} onPress={() => setFilter(item.id)} />
        ))}
      </View>
      {tasks.isLoading ? <LoadingBlock label="Loading tasks" /> : null}
      {tasks.isError ? <ErrorBlock message={errorMessage(tasks.error)} onRetry={() => tasks.refetch()} /> : null}
      {(tasks.data?.data.length ?? 0) === 0 && !tasks.isLoading ? (
        <EmptyBlock title="No tasks here" body="Assigned work will show up in this list." />
      ) : null}
      {tasks.data?.data.map((task) => (
        <Card key={task.id} style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <AppText variant="label" style={{ flex: 1 }}>{task.title}</AppText>
            <Badge label={statusLabel(task.priority)} tone={statusTone(task.priority)} />
          </View>
          {task.description ? <AppText variant="muted" numberOfLines={3}>{task.description}</AppText> : null}
          <AppText variant="muted">{task.project.name ?? 'Project'}{task.dueDate ? ` · Due ${formatDate(task.dueDate)}` : ''}</AppText>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Badge label={statusLabel(task.status)} tone={statusTone(task.status)} />
          </View>
          {task.status !== 'cancelled' ? (
            <Chip
              label={`Move to ${statusLabel(NEXT[task.status] ?? 'todo')}`}
              active={false}
              onPress={() => update.mutate({ id: task.id, status: NEXT[task.status] ?? 'todo' })}
            />
          ) : null}
        </Card>
      ))}
    </TabScreen>
  )
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? colors.accent : colors.line,
        backgroundColor: active ? colors.accentSoft : colors.card,
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
    >
      <Text style={{ color: active ? colors.accent : colors.ink, fontFamily: fonts.semibold, fontSize: 13 }}>{label}</Text>
    </Pressable>
  )
}
