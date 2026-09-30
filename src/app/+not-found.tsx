import { Link, Stack } from 'expo-router'
import { AppText, StackScreen } from '@/components/ui/primitives'

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <StackScreen>
        <AppText variant="title">That screen isn’t here.</AppText>
        <Link href="/(tabs)">
          <AppText variant="label">Back home</AppText>
        </Link>
      </StackScreen>
    </>
  )
}
