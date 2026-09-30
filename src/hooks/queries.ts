import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  attendanceApi,
  leaveApi,
  notificationApi,
  projectApi,
  reportApi,
  taskApi,
  timesheetApi,
} from '@/api/resources'
import { useAuth } from '@/state/AuthProvider'
import type { LeaveStatus, TaskStatus } from '@/types/api'

export const keys = {
  calendar: (year: number, month: number) => ['calendar', year, month] as const,
  daily: (date: string) => ['daily', date] as const,
  pendingTimesheets: ['pending-timesheets'] as const,
  attendanceToday: ['attendance-today'] as const,
  attendanceHistory: (from?: string, to?: string) => ['attendance-history', from, to] as const,
  tasks: (status?: string) => ['tasks', 'assigned', status ?? 'all'] as const,
  projects: ['projects', 'active'] as const,
  leaves: (status?: string) => ['leaves', status ?? 'all'] as const,
  pendingLeaves: ['pending-leaves'] as const,
  notifications: (unreadOnly?: string) => ['notifications', unreadOnly ?? 'all'] as const,
  unread: ['unread'] as const,
  reportAttendance: (from: string, to: string, userId?: string) => ['report-attendance', from, to, userId] as const,
  reportLeaves: (year: number, userId?: string) => ['report-leaves', year, userId] as const,
}

function useSignedIn() {
  const { status } = useAuth()
  return status === 'authenticated'
}

export function useCalendar(year: number, month: number) {
  const enabled = useSignedIn()
  return useQuery({
    queryKey: keys.calendar(year, month),
    queryFn: () => timesheetApi.calendar({ year, month }),
    enabled,
  })
}

export function useDaily(date: string | null) {
  const enabled = useSignedIn()
  return useQuery({
    queryKey: keys.daily(date ?? ''),
    queryFn: () => timesheetApi.daily({ date: date as string }),
    enabled: enabled && Boolean(date),
  })
}

export function usePendingTimesheets(enabled = true) {
  const signedIn = useSignedIn()
  return useQuery({
    queryKey: keys.pendingTimesheets,
    queryFn: () => timesheetApi.pending({ page: 1, limit: 50 }),
    enabled: signedIn && enabled,
  })
}

export function useTodayAttendance() {
  const enabled = useSignedIn()
  return useQuery({ queryKey: keys.attendanceToday, queryFn: () => attendanceApi.today(), enabled })
}

export function useAttendanceHistory(from?: string, to?: string) {
  const enabled = useSignedIn()
  return useQuery({
    queryKey: keys.attendanceHistory(from, to),
    queryFn: () => attendanceApi.history({ from, to }),
    enabled,
  })
}

export function useTasks(status?: TaskStatus) {
  const enabled = useSignedIn()
  return useQuery({
    queryKey: keys.tasks(status),
    queryFn: () => taskApi.assigned({ limit: 50, status }),
    enabled,
  })
}

export function useProjects(enabled = true) {
  const signedIn = useSignedIn()
  return useQuery({
    queryKey: keys.projects,
    queryFn: () => projectApi.list(),
    enabled: signedIn && enabled,
  })
}

export function useLeaves(status?: LeaveStatus) {
  const enabled = useSignedIn()
  return useQuery({
    queryKey: keys.leaves(status),
    queryFn: () => leaveApi.list({ limit: 50, status }),
    enabled,
  })
}

export function usePendingLeaves(enabled = true) {
  const signedIn = useSignedIn()
  return useQuery({
    queryKey: keys.pendingLeaves,
    queryFn: () => leaveApi.pending({ page: 1, limit: 50 }),
    enabled: signedIn && enabled,
  })
}

export function useNotifications() {
  const enabled = useSignedIn()
  return useQuery({
    queryKey: keys.notifications('false'),
    queryFn: () => notificationApi.list({ limit: 40, unreadOnly: 'false' }),
    enabled,
  })
}

export function useUnreadCount() {
  const enabled = useSignedIn()
  return useQuery({
    queryKey: keys.unread,
    queryFn: () => notificationApi.unread(),
    enabled,
    refetchInterval: 60_000,
  })
}

export function useAttendanceReport(from: string, to: string, userId?: string) {
  const enabled = useSignedIn()
  return useQuery({
    queryKey: keys.reportAttendance(from, to, userId),
    queryFn: () => reportApi.attendance({ from, to, userId: userId as string }),
    enabled: enabled && Boolean(userId),
  })
}

export function useLeaveReport(year: number, userId?: string) {
  const enabled = useSignedIn()
  return useQuery({
    queryKey: keys.reportLeaves(year, userId),
    queryFn: () => reportApi.leaves({ year, userId: userId as string }),
    enabled: enabled && Boolean(userId),
  })
}

export function useInvalidateTimesheets() {
  const client = useQueryClient()
  return () =>
    client.invalidateQueries({
      predicate: (query) => ['calendar', 'daily', 'pending-timesheets'].includes(String(query.queryKey[0])),
    })
}
