import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import { AppText, Badge, Card } from '@/components/ui/primitives'
import { ENTRY_WINDOW_LABEL, formatHours, monthLabel, statusLabel } from '@/lib/format'
import { statusTone } from '@/lib/status'
import { fonts } from '@/theme/colors'
import { useTheme } from '@/theme/ThemeProvider'
import type { CalendarDay, MonthCalendar } from '@/types/api'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const COLUMNS = 7
const GAP = 4
const CELL_HEIGHT = 62

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
  const { width: windowWidth } = useWindowDimensions()
  const [gridWidth, setGridWidth] = useState(0)
  const available = gridWidth || Math.max(windowWidth - 80, 280)
  const cellWidth = Math.floor((available - GAP * (COLUMNS - 1)) / COLUMNS)
  const lead = data?.days[0] ? (data.days[0].weekday + 6) % 7 : 0
  const status = data?.timesheet?.status ?? null

  return (
    <Card style={{ padding: 12 }}>
      {data?.entryWindow ? (
        <View style={[styles.window, { backgroundColor: colors.canvas, borderColor: colors.line }]}>
          <AppText variant="label">{ENTRY_WINDOW_LABEL}</AppText>
        </View>
      ) : null}
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
      <View
        onLayout={(event) => {
          const next = Math.floor(event.nativeEvent.layout.width)
          setGridWidth((current) => (current === next ? current : next))
        }}
      >
        <View style={styles.weekdays}>
          {WEEKDAYS.map((day) => (
            <AppText key={day} variant="eyebrow" style={[styles.weekday, { width: cellWidth, color: colors.muted }]}>
              {day}
            </AppText>
          ))}
        </View>
        <View style={styles.grid}>
          {Array.from({ length: lead }).map((_, index) => (
            <View key={`pad-${index}`} style={{ width: cellWidth, height: CELL_HEIGHT }} />
          ))}
          {data?.days.map((day) => {
            const isToday = data.entryWindow.today === day.date
            const isYesterday = data.entryWindow.yesterday === day.date
            const older = day.lockReasons.includes('entry_window') && !day.isFuture
            const editable = day.isFillable
            const background = day.isHoliday
              ? colors.holidaySoft
              : day.isOnLeave
                ? colors.infoSoft
                : editable && isYesterday
                  ? colors.accentSoft
                  : day.isWeekend || older
                    ? colors.canvas
                    : editable
                      ? colors.card
                      : colors.canvas
            const caption = isToday
              ? 'Today'
              : isYesterday && editable
                ? 'Yday'
                : day.isHoliday
                  ? 'Holiday'
                  : day.isOnLeave
                    ? 'Leave'
                    : day.isWeekend
                      ? 'Weekend'
                      : day.isFuture
                        ? 'Future'
                        : older
                          ? 'Locked'
                          : editable
                            ? day.entryCount > 0
                              ? 'Edit'
                              : 'Add'
                            : null
            const captionColor = isToday || (isYesterday && editable)
              ? colors.accent
              : day.isHoliday
                ? colors.holiday
                : day.isOnLeave
                  ? colors.info
                  : colors.muted
            const hours = day.totalMinutes > 0 ? `${formatHours(day.totalMinutes)}h` : null
            return (
              <Pressable
                key={day.date}
                accessibilityState={{ disabled: !editable }}
                accessibilityLabel={day.date}
                onPress={() => onSelect(day)}
                style={[
                  styles.cell,
                  {
                    width: cellWidth,
                    height: CELL_HEIGHT,
                    backgroundColor: isToday ? colors.accentSoft : background,
                    borderColor: isToday || (editable && isYesterday) ? colors.accent : colors.line,
                    borderWidth: isToday ? 2 : 1,
                    opacity: day.isFuture ? 0.4 : !editable && !isToday ? 0.72 : 1,
                  },
                ]}
              >
                <AppText style={[styles.dayNumber, { color: isToday ? colors.accent : colors.ink }]}>{Number(day.date.slice(8))}</AppText>
                <View style={styles.captionBlock}>
                  {caption ? (
                    <AppText numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[styles.micro, { color: captionColor }]}>
                      {caption}
                    </AppText>
                  ) : null}
                  {hours ? (
                    <AppText numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[styles.micro, { color: colors.accent }]}>
                      {hours}
                    </AppText>
                  ) : null}
                </View>
              </Pressable>
            )
          })}
        </View>
      </View>
      <View style={styles.legend}>
        <Legend swatch={colors.accentSoft} label="Today" />
        <Legend swatch={colors.canvas} label="Locked" />
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
  window: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  toolbar: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 4 },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 8, paddingHorizontal: 4 },
  navButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  weekdays: { flexDirection: 'row', gap: GAP, marginTop: 4 },
  weekday: { textAlign: 'center', fontSize: 10, lineHeight: 14, letterSpacing: 0.2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginTop: 4 },
  cell: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 2,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  dayNumber: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 16, textAlign: 'center', includeFontPadding: false },
  captionBlock: { width: '100%', alignItems: 'center', gap: 1 },
  micro: { fontFamily: fonts.semibold, fontSize: 9, lineHeight: 11, textAlign: 'center', width: '100%', includeFontPadding: false },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, rowGap: 8, marginTop: 16, paddingHorizontal: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 12, height: 12, borderRadius: 4, borderWidth: 1 },
})
