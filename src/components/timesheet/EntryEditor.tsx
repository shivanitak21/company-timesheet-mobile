import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Alert, Pressable, Text, View } from 'react-native'
import { timesheetApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { SelectField, TextArea, TimeField } from '@/components/ui/fields'
import { AppText, Badge, Button, Card } from '@/components/ui/primitives'
import { useInvalidateTimesheets, useProjects, useTasks } from '@/hooks/queries'
import { formatMinutes, previewDuration } from '@/lib/format'
import { fonts } from '@/theme/colors'
import { useTheme } from '@/theme/ThemeProvider'
import { useToast } from '@/state/ToastProvider'
import type { EntryPayload, TimeEntry } from '@/types/api'
import { entrySchema, type EntryValues } from '@/validation/schemas'

const emptyForm: EntryValues = {
  workType: 'assigned',
  taskId: '',
  projectId: '',
  startTime: '09:00',
  endTime: '17:00',
  description: '',
}

export function EntryEditor({ date, entries, editable }: { date: string; entries: TimeEntry[]; editable: boolean }) {
  const toast = useToast()
  const { colors } = useTheme()
  const invalidate = useInvalidateTimesheets()
  const tasks = useTasks()
  const projects = useProjects(editable)
  const [editing, setEditing] = useState<TimeEntry | null>(null)
  const form = useForm<EntryValues>({ resolver: zodResolver(entrySchema), defaultValues: emptyForm })
  const workType = form.watch('workType')
  const startTime = form.watch('startTime')
  const endTime = form.watch('endTime')
  const duration = previewDuration(startTime, endTime)

  const reset = form.reset
  useEffect(() => {
    setEditing(null)
    reset(emptyForm)
  }, [date, reset])

  const save = useMutation({
    mutationFn: (body: EntryPayload) => (editing ? timesheetApi.updateEntry(editing.id, body) : timesheetApi.createEntry(body)),
    onSuccess: () => {
      toast.push(editing ? 'Entry updated' : 'Entry saved')
      setEditing(null)
      form.reset(emptyForm)
      void invalidate()
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  const remove = useMutation({
    mutationFn: (entryId: string) => timesheetApi.deleteEntry(entryId),
    onSuccess: () => {
      toast.push('Entry deleted')
      setEditing(null)
      form.reset(emptyForm)
      void invalidate()
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  function onSubmit(values: EntryValues) {
    const shared = {
      date,
      startTime: values.startTime,
      endTime: values.endTime,
      description: values.description.trim(),
    }
    const body: EntryPayload =
      values.workType === 'assigned'
        ? { workType: 'assigned', taskId: values.taskId ?? '', ...shared }
        : { workType: 'unassigned', ...shared, ...(values.projectId ? { projectId: values.projectId } : {}) }
    save.mutate(body)
  }

  function beginEdit(entry: TimeEntry) {
    setEditing(entry)
    form.reset({
      workType: entry.workType,
      taskId: entry.task?.id ?? '',
      projectId: entry.project?.id ?? '',
      startTime: entry.startTime,
      endTime: entry.endTime,
      description: entry.description,
    })
  }

  const taskOptions = (tasks.data?.data ?? []).map((task) => ({
    value: task.id,
    label: task.title,
    hint: task.project.name ?? 'Project',
  }))
  const projectOptions = [
    { value: '', label: 'No project' },
    ...(projects.data?.data ?? []).map((project) => ({ value: project.id, label: project.name, hint: project.code })),
  ]

  return (
    <View style={{ gap: 12 }}>
      {entries.length === 0 ? <AppText variant="muted">No time logged for this day yet.</AppText> : null}
      {entries.map((entry) => (
        <Card key={entry.id} style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <AppText variant="label">
              {entry.startTime} – {entry.endTime}
            </AppText>
            <Badge label={formatMinutes(entry.durationMinutes)} />
          </View>
          <AppText variant="body">{entry.workType === 'assigned' ? (entry.task?.title ?? 'Assigned task') : 'Unassigned work'}</AppText>
          {entry.project ? <AppText variant="muted">{entry.project.name}</AppText> : null}
          <AppText variant="body">{entry.description}</AppText>
          {editable ? (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              <View style={{ flex: 1 }}>
                <Button label="Edit" variant="secondary" onPress={() => beginEdit(entry)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Delete"
                  variant="ghost"
                  onPress={() =>
                    Alert.alert('Delete this entry?', entry.description, [
                      { text: 'Keep', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(entry.id) },
                    ])
                  }
                />
              </View>
            </View>
          ) : null}
        </Card>
      ))}
      {editable ? (
        <Card style={{ gap: 12 }}>
          <AppText variant="title">{editing ? 'Edit entry' : 'Add time'}</AppText>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Choice label="Assigned task" active={workType === 'assigned'} onPress={() => form.setValue('workType', 'assigned')} />
            <Choice label="Unassigned" active={workType === 'unassigned'} onPress={() => form.setValue('workType', 'unassigned')} />
          </View>
          {workType === 'assigned' ? (
            <Controller
              control={form.control}
              name="taskId"
              render={({ field }) => (
                <SelectField
                  label="Assigned task"
                  value={field.value}
                  placeholder={taskOptions.length ? 'Choose a task' : 'No tasks assigned'}
                  options={taskOptions}
                  onChange={field.onChange}
                  error={form.formState.errors.taskId?.message}
                />
              )}
            />
          ) : (
            <Controller
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <SelectField
                  label="Project"
                  value={field.value}
                  placeholder="Optional project"
                  options={projectOptions}
                  onChange={field.onChange}
                  error={form.formState.errors.projectId?.message}
                />
              )}
            />
          )}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Controller
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <TimeField label="Start" value={field.value} onChange={field.onChange} error={form.formState.errors.startTime?.message} />
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <TimeField label="End" value={field.value} onChange={field.onChange} error={form.formState.errors.endTime?.message} />
                )}
              />
            </View>
          </View>
          <AppText variant="muted">{duration ? `${formatMinutes(duration)} preview` : 'End time must be after the start.'}</AppText>
          <Controller
            control={form.control}
            name="description"
            render={({ field }) => (
              <TextArea
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="What did you work on?"
                error={form.formState.errors.description?.message}
              />
            )}
          />
          {form.formState.errors.description?.message ? (
            <Text style={{ color: colors.danger, fontFamily: fonts.medium, fontSize: 12 }}>{form.formState.errors.description.message}</Text>
          ) : null}
          <Button label={editing ? 'Save changes' : 'Add entry'} loading={save.isPending} onPress={form.handleSubmit(onSubmit)} />
          {editing ? (
            <Button
              label="Cancel edit"
              variant="ghost"
              onPress={() => {
                setEditing(null)
                form.reset(emptyForm)
              }}
            />
          ) : null}
        </Card>
      ) : null}
    </View>
  )
}

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 42,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? colors.accent : colors.line,
        backgroundColor: active ? colors.accentSoft : colors.canvas,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
      }}
    >
      <Text style={{ color: active ? colors.accent : colors.ink, fontFamily: fonts.semibold, fontSize: 13 }}>{label}</Text>
    </Pressable>
  )
}
