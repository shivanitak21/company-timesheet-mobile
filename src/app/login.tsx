import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { errorMessage } from '@/api/client'
import { Field, TextField } from '@/components/ui/fields'
import { AppText, Button } from '@/components/ui/primitives'
import { useAuth } from '@/state/AuthProvider'
import { fonts } from '@/theme/colors'
import { useTheme } from '@/theme/ThemeProvider'
import { loginSchema, type LoginValues } from '@/validation/schemas'

export default function LoginScreen() {
  const { login, status } = useAuth()
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.hero, { paddingTop: insets.top + 28 }]}>
        <AppText style={styles.brand}>Meridian</AppText>
        <AppText style={styles.kicker}>Timesheets · Attendance · Leave</AppText>
        <AppText style={styles.heroTitle}>A quieter way to account for the day.</AppText>
      </View>
      <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 24 }]}>
        <AppText variant="eyebrow">Welcome back</AppText>
        <AppText variant="display" style={{ marginTop: 6 }}>Sign in</AppText>
        <AppText variant="muted" style={{ marginTop: 6 }}>Use the account issued by your administrator.</AppText>
        <View style={{ marginTop: 22, gap: 14 }}>
          <Controller
            control={form.control}
            name="email"
            render={({ field }) => (
              <Field label="Email" error={form.formState.errors.email?.message}>
                <TextField
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  placeholder="you@company.com"
                  error={form.formState.errors.email?.message}
                />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="password"
            render={({ field }) => (
              <Field label="Password" error={form.formState.errors.password?.message}>
                <TextField
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  secureTextEntry
                  placeholder="Password"
                  error={form.formState.errors.password?.message}
                />
              </Field>
            )}
          />
          {error ? <AppText style={{ color: colors.danger }}>{error}</AppText> : null}
          <Button
            label="Sign in"
            loading={form.formState.isSubmitting || status === 'loading'}
            onPress={form.handleSubmit(async (values) => {
              setError(null)
              try {
                await login(values.email, values.password)
              } catch (caught) {
                setError(errorMessage(caught))
              }
            })}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  hero: { flex: 1, backgroundColor: '#12161c', paddingHorizontal: 24, justifyContent: 'flex-end', paddingBottom: 36 },
  brand: { color: '#f6f3ee', fontFamily: fonts.display, fontSize: 34 },
  kicker: { color: 'rgba(246,243,238,0.55)', fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 1.6, marginTop: 8, textTransform: 'uppercase' },
  heroTitle: { color: '#f6f3ee', fontFamily: fonts.display, fontSize: 30, lineHeight: 36, marginTop: 22, maxWidth: 320 },
  sheet: { marginTop: -28, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 28 },
})
