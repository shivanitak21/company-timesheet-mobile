import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { Pressable, Switch, View } from 'react-native'
import { authApi, employeeApi } from '@/api/resources'
import { errorMessage } from '@/api/client'
import { Field, TextField } from '@/components/ui/fields'
import { AppText, Badge, Button, Card, StackScreen } from '@/components/ui/primitives'
import { formatDate, personName, statusLabel } from '@/lib/format'
import { canReview } from '@/lib/roles'
import { statusTone } from '@/lib/status'
import { useAuth } from '@/state/AuthProvider'
import { useTheme } from '@/theme/ThemeProvider'
import { useToast } from '@/state/ToastProvider'
import { changePasswordSchema, profilePhoneSchema } from '@/validation/schemas'

export default function ProfileScreen() {
  const { user, profile, logout, refreshMe } = useAuth()
  const { theme, toggle, colors } = useTheme()
  const toast = useToast()
  const phoneForm = useForm<{ phone: string }>({ resolver: zodResolver(profilePhoneSchema), values: { phone: profile?.phone ?? '' } })
  const passwordForm = useForm<{ currentPassword: string; newPassword: string }>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  })

  const savePhone = useMutation({
    mutationFn: (phone: string) => employeeApi.update(profile?.id ?? '', { phone }),
    onSuccess: async () => {
      toast.push('Phone updated')
      await refreshMe()
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  const changePassword = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: async () => {
      toast.push('Password changed. Sign in again.')
      await logout()
    },
    onError: (error) => toast.push(errorMessage(error), 'error'),
  })

  return (
    <StackScreen>
      <Card style={{ gap: 8 }}>
        <AppText variant="display" style={{ fontSize: 28 }}>{personName(user)}</AppText>
        <AppText variant="muted">{user?.email}</AppText>
        <Badge label={statusLabel(user?.role)} tone={statusTone(user?.role)} />
        <Row label="Department" value={profile?.department ?? '—'} />
        <Row label="Designation" value={profile?.designation ?? '—'} />
        <Row label="Employee code" value={profile?.employeeCode ?? '—'} />
        <Row label="Joined" value={formatDate(profile?.joiningDate)} />
        <Row label="Weekly hours" value={profile ? String(profile.weeklyHours) : '—'} />
        <Row label="Manager" value={personName(profile?.manager)} />
      </Card>

      {canReview(user?.role) ? (
        <Pressable onPress={() => router.push('/approvals')}>
          <Card>
            <AppText variant="title">Approvals</AppText>
            <AppText variant="muted" style={{ marginTop: 4 }}>Timesheets and leave waiting on you.</AppText>
          </Card>
        </Pressable>
      ) : null}

      {user?.role === 'admin' ? (
        <Card>
          <AppText variant="title">Company admin</AppText>
          <AppText variant="muted" style={{ marginTop: 4 }}>
            Employees, projects, holidays, and settings stay in the web app. This phone is for your own time.
          </AppText>
        </Card>
      ) : null}

      <Card style={{ gap: 12 }}>
        <AppText variant="title">Phone</AppText>
        {profile ? (
          <>
            <Controller
              control={phoneForm.control}
              name="phone"
              render={({ field }) => (
                <Field label="Phone" error={phoneForm.formState.errors.phone?.message}>
                  <TextField value={field.value} onChangeText={field.onChange} keyboardType="phone-pad" placeholder="Phone" />
                </Field>
              )}
            />
            <Button label="Save phone" loading={savePhone.isPending} onPress={phoneForm.handleSubmit((values) => savePhone.mutate(values.phone))} />
          </>
        ) : (
          <AppText variant="muted">This account has no employee profile.</AppText>
        )}
      </Card>

      <Card style={{ gap: 12 }}>
        <AppText variant="title">Password</AppText>
        <AppText variant="muted">Changing your password signs you out.</AppText>
        <Controller
          control={passwordForm.control}
          name="currentPassword"
          render={({ field }) => (
            <Field label="Current password" error={passwordForm.formState.errors.currentPassword?.message}>
              <TextField value={field.value} onChangeText={field.onChange} secureTextEntry />
            </Field>
          )}
        />
        <Controller
          control={passwordForm.control}
          name="newPassword"
          render={({ field }) => (
            <Field label="New password" error={passwordForm.formState.errors.newPassword?.message}>
              <TextField value={field.value} onChangeText={field.onChange} secureTextEntry />
            </Field>
          )}
        />
        <Button label="Update password" loading={changePassword.isPending} onPress={passwordForm.handleSubmit((values) => changePassword.mutate(values))} />
      </Card>

      <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <AppText variant="label">Dark theme</AppText>
          <AppText variant="muted">{theme === 'dark' ? 'On' : 'Off'}</AppText>
        </View>
        <Switch value={theme === 'dark'} onValueChange={toggle} trackColor={{ true: colors.accent, false: colors.line }} />
      </Card>

      <Button label="Log out" variant="danger" onPress={() => logout()} />
    </StackScreen>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <AppText variant="muted">{label}</AppText>
      <AppText variant="label" style={{ flex: 1, textAlign: 'right' }}>{value}</AppText>
    </View>
  )
}
