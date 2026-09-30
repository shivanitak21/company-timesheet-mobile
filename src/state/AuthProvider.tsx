import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '@/api/resources'
import { ApiError } from '@/api/client'
import { onAuthExpired } from '@/lib/auth-events'
import { session } from '@/lib/session'
import type { AuthUser, EmployeeProfile } from '@/types/api'

type Status = 'loading' | 'authenticated' | 'anonymous'

type AuthContextValue = {
  status: Status
  user: AuthUser | null
  profile: EmployeeProfile | null
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<EmployeeProfile | null>(null)

  async function refreshMe() {
    const result = await authApi.me()
    setUser(result.data.user)
    setProfile(result.data.profile)
    setStatus('authenticated')
  }

  useEffect(() => {
    let active = true
    async function boot() {
      await session.hydrate()
      if (!session.refresh && !session.access) {
        if (active) setStatus('anonymous')
        return
      }
      try {
        const result = await authApi.me()
        if (!active) return
        setUser(result.data.user)
        setProfile(result.data.profile)
        setStatus('authenticated')
      } catch (error) {
        if (!active) return
        if (error instanceof ApiError && (error.status === 401 || error.status === 0)) await session.clear()
        setUser(null)
        setProfile(null)
        setStatus('anonymous')
      }
    }
    void boot()
    const unsubscribe = onAuthExpired(() => {
      setUser(null)
      setProfile(null)
      setStatus('anonymous')
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      profile,
      async login(email, password) {
        const result = await authApi.login({ email, password })
        await session.setTokens(result.data.accessToken, result.data.refreshToken)
        const me = await authApi.me()
        setUser(me.data.user)
        setProfile(me.data.profile)
        setStatus('authenticated')
        return me.data.user
      },
      async logout() {
        const refreshToken = session.refresh
        await session.clear()
        setUser(null)
        setProfile(null)
        setStatus('anonymous')
        if (refreshToken) {
          try {
            await authApi.logout(refreshToken)
          } catch {
            /* local session is already cleared */
          }
        }
      },
      refreshMe,
    }),
    [profile, status, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = use(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
