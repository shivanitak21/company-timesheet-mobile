import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'
import { AppText } from '@/components/ui/primitives'
import { formatClock, formatIsoDate, parseClock, parseIsoDate } from '@/lib/format'
import { fonts } from '@/theme/colors'
import { useTheme } from '@/theme/ThemeProvider'

export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  const { colors } = useTheme()
  return (
    <View style={{ gap: 6 }}>
      <AppText variant="label">{label}</AppText>
      {children}
      {error ? <Text style={{ color: colors.danger, fontFamily: fonts.medium, fontSize: 12 }}>{error}</Text> : null}
    </View>
  )
}

export function TextField({ error, ...props }: TextInputProps & { error?: string }) {
  const { colors } = useTheme()
  return (
    <TextInput
      placeholderTextColor={colors.muted}
      {...props}
      style={[
        styles.input,
        { color: colors.ink, backgroundColor: colors.canvas, borderColor: error ? colors.danger : colors.line, fontFamily: fonts.body },
        props.style,
      ]}
    />
  )
}

export function TextArea(props: TextInputProps & { error?: string }) {
  return <TextField {...props} multiline style={[styles.area, props.style]} />
}

export function TimeField({ label, value, onChange, error }: { label: string; value: string; onChange: (value: string) => void; error?: string }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(() => parseClock(value))
  const { colors } = useTheme()

  function commit(date: Date) {
    onChange(formatClock(date))
  }

  function onPicker(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setOpen(false)
    if (event.type === 'dismissed' || !date) return
    setDraft(date)
    if (Platform.OS === 'android') commit(date)
  }

  return (
    <Field label={label} error={error}>
      <Pressable
        onPress={() => {
          setDraft(parseClock(value))
          setOpen(true)
        }}
        style={[styles.input, styles.press, { backgroundColor: colors.canvas, borderColor: error ? colors.danger : colors.line }]}
      >
        <Text style={{ color: colors.ink, fontFamily: fonts.semibold, fontSize: 16 }}>{value || 'Select'}</Text>
      </Pressable>
      {open && Platform.OS === 'android' ? <DateTimePicker value={draft} mode="time" is24Hour onChange={onPicker} /> : null}
      {open && Platform.OS === 'ios' ? (
        <Modal transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={() => setOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <DateTimePicker value={draft} mode="time" display="spinner" onChange={onPicker} />
            <Pressable
              onPress={() => {
                commit(draft)
                setOpen(false)
              }}
              style={[styles.done, { backgroundColor: colors.accent }]}
            >
              <Text style={{ color: colors.onAccent, fontFamily: fonts.semibold }}>Done</Text>
            </Pressable>
          </View>
        </Modal>
      ) : null}
    </Field>
  )
}

export function DateField({ label, value, onChange, error }: { label: string; value: string; onChange: (value: string) => void; error?: string }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(() => parseIsoDate(value))
  const { colors } = useTheme()

  function commit(date: Date) {
    onChange(formatIsoDate(date))
  }

  function onPicker(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setOpen(false)
    if (event.type === 'dismissed' || !date) return
    setDraft(date)
    if (Platform.OS === 'android') commit(date)
  }

  return (
    <Field label={label} error={error}>
      <Pressable
        onPress={() => {
          setDraft(parseIsoDate(value))
          setOpen(true)
        }}
        style={[styles.input, styles.press, { backgroundColor: colors.canvas, borderColor: error ? colors.danger : colors.line }]}
      >
        <Text style={{ color: value ? colors.ink : colors.muted, fontFamily: fonts.medium, fontSize: 15 }}>{value || 'Select a date'}</Text>
      </Pressable>
      {open && Platform.OS === 'android' ? <DateTimePicker value={draft} mode="date" onChange={onPicker} /> : null}
      {open && Platform.OS === 'ios' ? (
        <Modal transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={() => setOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <DateTimePicker value={draft} mode="date" display="spinner" onChange={onPicker} />
            <Pressable
              onPress={() => {
                commit(draft)
                setOpen(false)
              }}
              style={[styles.done, { backgroundColor: colors.accent }]}
            >
              <Text style={{ color: colors.onAccent, fontFamily: fonts.semibold }}>Done</Text>
            </Pressable>
          </View>
        </Modal>
      ) : null}
    </Field>
  )
}

export function SelectField({
  label,
  value,
  placeholder,
  options,
  onChange,
  error,
}: {
  label: string
  value?: string
  placeholder: string
  options: { value: string; label: string; hint?: string }[]
  onChange: (value: string) => void
  error?: string
}) {
  const [open, setOpen] = useState(false)
  const { colors } = useTheme()
  const selected = options.find((option) => option.value === value)
  return (
    <Field label={label} error={error}>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.input, styles.press, { backgroundColor: colors.canvas, borderColor: error ? colors.danger : colors.line }]}
      >
        <Text style={{ color: selected ? colors.ink : colors.muted, fontFamily: fonts.medium, fontSize: 15 }} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={() => setOpen(false)} />
        <View style={[styles.optionSheet, { backgroundColor: colors.card }]}>
          <AppText variant="title">{label}</AppText>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 10, paddingBottom: 12 }}>
          {options.length === 0 ? <AppText variant="muted">Nothing to choose yet.</AppText> : null}
          {options.map((option) => {
            const active = option.value === value
            return (
              <Pressable
                key={option.value || 'none'}
                onPress={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                style={[styles.option, { borderColor: colors.line, backgroundColor: active ? colors.accentSoft : 'transparent' }]}
              >
                <Text style={{ color: colors.ink, fontFamily: fonts.semibold, fontSize: 15 }}>{option.label}</Text>
                {option.hint ? <Text style={{ color: colors.muted, fontFamily: fonts.body, marginTop: 2 }}>{option.hint}</Text> : null}
              </Pressable>
            )
          })}
          </ScrollView>
        </View>
      </Modal>
    </Field>
  )
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 48,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  area: { minHeight: 96, paddingTop: 12, textAlignVertical: 'top' },
  press: { justifyContent: 'center' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  sheet: { position: 'absolute', left: 12, right: 12, bottom: 24, borderRadius: 24, padding: 12 },
  optionSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 10, maxHeight: '75%' },
  option: { borderWidth: 1, borderRadius: 16, padding: 14 },
  done: { borderRadius: 999, minHeight: 44, alignItems: 'center', justifyContent: 'center', margin: 8 },
})
