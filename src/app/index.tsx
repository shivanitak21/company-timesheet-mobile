import { Redirect } from 'expo-router'
import { ScreenLoader } from '@/components/ui/primitives'
import { useAuth } from '@/state/AuthProvider'

export default function Index() {
  const { status } = useAuth()
  if (status === 'loading') return <ScreenLoader />
  if (status === 'anonymous') return <Redirect href="/login" />
  return <Redirect href="/(tabs)" />
}
