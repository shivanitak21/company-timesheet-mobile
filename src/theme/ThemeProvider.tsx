import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import { darkPalette, lightPalette, type Palette } from '@/theme/colors'

type ThemeName = 'light' | 'dark'
type Preference = ThemeName | 'system'

type ThemeContextValue = {
  theme: ThemeName
  preference: Preference
  colors: Palette
  toggle: () => void
  setPreference: (preference: Preference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const KEY = 'meridian.theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme()
  const [preference, setPreferenceState] = useState<Preference>('system')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    AsyncStorage.getItem(KEY)
      .then((stored) => {
        if (!active) return
        if (stored === 'light' || stored === 'dark' || stored === 'system') setPreferenceState(stored)
      })
      .finally(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [])

  const theme: ThemeName = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      preference,
      colors: theme === 'dark' ? darkPalette : lightPalette,
      toggle: () => {
        const next: ThemeName = theme === 'dark' ? 'light' : 'dark'
        setPreferenceState(next)
        void AsyncStorage.setItem(KEY, next)
      },
      setPreference: (next) => {
        setPreferenceState(next)
        void AsyncStorage.setItem(KEY, next)
      },
    }),
    [preference, theme],
  )

  if (!ready) return null
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = use(ThemeContext)
  if (!value) throw new Error('useTheme must be used within ThemeProvider')
  return value
}
