import { api } from '@/api/client'
import type {
  Attendance,
  AttendanceReportRow,
  AuthUser,
  DailyTimesheet,
  EmployeeProfile,
  EntryPayload,
  Leave,
  LeaveReportRow,
  LeaveStatus,
  LoginResult,
  MeResult,
  MonthCalendar,
  NotificationItem,
  PendingTimesheet,
  Project,
  Task,
  TaskStatus,
  TimeEntry,
  Timesheet,
} from '@/types/api'

export const authApi = {
  login: (body: { email: string; password: string }) => api.post<LoginResult>('/auth/login', body),
  logout: (refreshToken: string) => api.post<{ revoked: boolean }>('/auth/logout', { refreshToken }),
  me: () => api.get<MeResult>('/auth/me'),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api.post<{ changed: boolean }>('/auth/change-password', body),
}

export const employeeApi = {
  update: (id: string, body: { phone: string }) => api.patch<EmployeeProfile>(`/employees/${id}`, body),
}

export const timesheetApi = {
  calendar: (params: { year: number; month: number }) => api.get<MonthCalendar>('/timesheets/calendar', params),
  daily: (params: { date: string }) => api.get<DailyTimesheet>('/timesheets/daily', params),
  pending: (params: { page?: number; limit?: number }) => api.get<PendingTimesheet[]>('/timesheets/pending', params),
  createEntry: (body: EntryPayload) =>
    api.post<{ entry: TimeEntry; timesheet: Timesheet; dayTotalMinutes: number; monthTotalMinutes: number }>('/timesheets/entries', body),
  updateEntry: (entryId: string, body: EntryPayload) =>
    api.patch<{ entry: TimeEntry; timesheet: Timesheet; dayTotalMinutes: number; monthTotalMinutes: number }>(
      `/timesheets/entries/${entryId}`,
      body,
    ),
  deleteEntry: (entryId: string) => api.delete<{ deleted: boolean }>(`/timesheets/entries/${entryId}`),
  submit: (id: string) => api.post<Timesheet>(`/timesheets/${id}/submit`),
  approve: (id: string) => api.post<Timesheet>(`/timesheets/${id}/approve`),
  reject: (id: string, reason: string) => api.post<Timesheet>(`/timesheets/${id}/reject`, { reason }),
}

export const attendanceApi = {
  checkIn: (notes?: string) => api.post<Attendance>('/attendance/check-in', { platform: 'mobile', notes: notes || undefined }),
  checkOut: (notes?: string) => api.post<Attendance>('/attendance/check-out', { platform: 'mobile', notes: notes || undefined }),
  today: () => api.get<{ attendance: Attendance | null }>('/attendance/today'),
  history: (params: { from?: string; to?: string }) =>
    api.get<{ from: string; to: string; userId: string; rows: Attendance[] }>('/attendance/history', params),
}

export const taskApi = {
  assigned: (params: { page?: number; limit?: number; status?: TaskStatus }) => api.get<Task[]>('/tasks/assigned', params),
  update: (id: string, body: { status: TaskStatus }) => api.patch<Task>(`/tasks/${id}`, body),
}

export const projectApi = {
  list: () => api.get<Project[]>('/projects', { limit: 100, status: 'active' }),
}

export const leaveApi = {
  create: (body: { type: string; startDate: string; endDate: string; reason: string }) => api.post<Leave>('/leaves', body),
  list: (params: { page?: number; limit?: number; status?: LeaveStatus }) => api.get<Leave[]>('/leaves', params),
  pending: (params: { page?: number; limit?: number }) => api.get<Leave[]>('/leaves/pending', params),
  approve: (id: string) => api.post<Leave>(`/leaves/${id}/approve`),
  reject: (id: string, reason: string) => api.post<Leave>(`/leaves/${id}/reject`, { reason }),
  cancel: (id: string) => api.post<Leave>(`/leaves/${id}/cancel`),
}

export const notificationApi = {
  list: (params: { page?: number; limit?: number; unreadOnly?: 'true' | 'false' }) =>
    api.get<NotificationItem[]>('/notifications', params),
  unread: () => api.get<{ unreadCount: number }>('/notifications/unread-count'),
  markRead: (id: string) => api.patch<NotificationItem>(`/notifications/${id}/read`),
  markAllRead: () => api.post<{ updated: number }>('/notifications/read-all'),
}

export const reportApi = {
  attendance: (params: { from: string; to: string; userId: string }) =>
    api.get<{ from: string; to: string; rows: AttendanceReportRow[] }>('/reports/attendance', { ...params, page: 1, limit: 1 }),
  leaves: (params: { year: number; userId: string }) =>
    api.get<{ year: number; rows: LeaveReportRow[] }>('/reports/leaves', { ...params, page: 1, limit: 1 }),
}

export type SignedInUser = AuthUser
