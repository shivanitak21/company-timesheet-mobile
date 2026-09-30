import { createContext, use, useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { StyleSheet, Text } from 'react-native'
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fonts } from '@/theme/colors'
import { useTheme } from '@/theme/ThemeProvider'

type Toast = { id: number; message: string; tone: 'success' | 'error' }

type ToastContextValue = {
  push: (message: string, tone?: Toast['tone']) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()

  const push = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    if (timer.current) clearTimeout(timer.current)
    const next = { id: Date.now(), message, tone }
    setToast(next)
    timer.current = setTimeout(() => setToast((current) => (current?.id === next.id ? null : current)), 3200)
  }, [])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          entering={FadeInUp.duration(220)}
          exiting={FadeOut.duration(180)}
          style={[
            styles.toast,
            {
              bottom: Math.max(insets.bottom, 16) + 72,
              backgroundColor: toast.tone === 'error' ? colors.danger : colors.ink,
            },
          ]}
        >
          <Text style={styles.text}>{toast.message}</Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const value = use(ToastContext)
  if (!value) throw new Error('useToast must be used within ToastProvider')
  return value
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    zIndex: 20,
  },
  text: {
    color: '#fff',
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
})
