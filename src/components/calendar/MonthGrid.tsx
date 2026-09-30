import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import { AppText, Badge, Card } from '@/components/ui/primitives'
import { formatHours, monthLabel, statusLabel } from '@/lib/format'
import { statusTone } from '@/lib/status'
import { fonts } from '@/theme/colors'
import { useTheme } from '@/theme/ThemeProvider'
import type { CalendarDay, MonthCalendar } from '@/types/api'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function quietLocked(day: CalendarDay) {
  return (day.isWeekend || day.isHoliday || day.isOnLeave || day.isFuture) && day.entryCount === 0
}

export function MonthGrid({
  year,
  month,
  data,
  onMonthChange,
  onSelect,
}: {
  year: number
  month: number
  data?: MonthCalendar
  onMonthChange: (delta: number) => void
  onSelect: (day: CalendarDay) => void
}) {
  const { colors } = useTheme()
  const { width } = useWindowDimensions()
  const cell = Math.floor((width - 64) / 7) - 2
  const lead = data?.days[0] ? (data.days[0].weekday + 6) % 7 : 0
  const status = data?.timesheet?.status ?? null

  return (
    <Card style={{ padding: 12 }}>
      <View style={styles.toolbar}>
        <View style={{ flex: 1 }}>
          <AppText variant="eyebrow">Month</AppText>
          <AppText variant="title">{monthLabel(year, month)}</AppText>
        </View>
        <Badge label={statusLabel(status)} tone={statusTone(status)} />
      </View>
      <View style={styles.nav}>
        <Pressable accessibilityLabel="Previous month" onPress={() => onMonthChange(-1)} style={[styles.navButton, { borderColor: colors.line }]}>
          <Ionicons name="chevron-back" size={18} color={colors.ink} />
        </Pressable>
        <Pressable accessibilityLabel="Next month" onPress={() => onMonthChange(1)} style={[styles.navButton, { borderColor: colors.line }]}>
          <Ionicons name="chevron-forward" size={18} color={colors.ink} />
        </Pressable>
        <AppText variant="muted" style={{ marginLeft: 8 }}>{formatHours(data?.monthlyTotalMinutes ?? 0)}h logged</AppText>
      </View>
      <View style={styles.weekdays}>
        {WEEKDAYS.map((day) => (
          <AppText key={day} variant="eyebrow" style={[styles.weekday, { width: cell, color: colors.muted }]}>
            {day}
          </AppText>
        ))}
      </View>
      <View style={styles.grid}>
        {Array.from({ length: lead }).map((_, index) => (
          <View key={`pad-${index}`} style={{ width: cell, height: cell + 8 }} />
        ))}
        {data?.days.map((day) => {
          const locked = quietLocked(day)
          const today = data.today === day.date
          const background = day.isHoliday
            ? colors.holidaySoft
            : day.isOnLeave
              ? colors.infoSoft
              : day.isWeekend || day.isFuture
                ? colors.canvas
                : day.entryCount > 0
                  ? colors.accentSoft
                  : colors.card
          return (
            <Pressable
              key={day.date}
              disabled={locked}
              accessibilityLabel={day.date}
              onPress={() => onSelect(day)}
              style={[
                styles.cell,
                {
                  width: cell,
                  height: cell + 8,
                  backgroundColor: background,
                  borderColor: today ? colors.accent : colors.line,
                  opacity: locked ? 0.55 : 1,
                },
              ]}
            >
              <AppText variant="label" style={{ fontSize: 13 }}>{Number(day.date.slice(8))}</AppText>
              {day.isHoliday ? <AppText style={[styles.micro, { color: colors.holiday }]} numberOfLines={1}>Hol</AppText> : null}
              {day.isOnLeave && !day.isHoliday ? <AppText style={[styles.micro, { color: colors.info }]} numberOfLines={1}>Leave</AppText> : null}
              {day.totalMinutes > 0 ? <AppText style={[styles.micro, { color: colors.accent }]}>{formatHours(day.totalMinutes)}h</AppText> : null}
            </Pressable>
          )
        })}
      </View>
      <View style={styles.legend}>
        <Legend swatch={colors.canvas} label="Weekend" />
        <Legend swatch={colors.holidaySoft} label="Holiday" />
        <Legend swatch={colors.infoSoft} label="Leave" />
        <Legend swatch={colors.accentSoft} label="Logged" />
      </View>
    </Card>
  )
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  const { colors } = useTheme()
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: swatch, borderColor: colors.line }]} />
      <AppText variant="muted" style={{ fontSize: 12 }}>{label}</AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 4 },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 8, paddingHorizontal: 4 },
  navButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  weekdays: { flexDirection: 'row', marginTop: 4 },
  weekday: { textAlign: 'center', fontSize: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { borderWidth: 1, borderRadius: 12, margin: 1, padding: 4, justifyContent: 'space-between' },
  micro: { fontFamily: fonts.semibold, fontSize: 9 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12, paddingHorizontal: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 12, height: 12, borderRadius: 4, borderWidth: 1 },
})
