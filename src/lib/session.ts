import * as SecureStore from 'expo-secure-store'

const ACCESS_KEY = 'meridian.access'
const REFRESH_KEY = 'meridian.refresh'

export const session = {
  access: null as string | null,
  refresh: null as string | null,

  async hydrate() {
    try {
      const [access, refresh] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_KEY),
        SecureStore.getItemAsync(REFRESH_KEY),
      ])
      this.access = access
      this.refresh = refresh
    } catch {
      this.access = null
      this.refresh = null
    }
  },

  async setTokens(access: string, refresh: string) {
    this.access = access
    this.refresh = refresh
    await Promise.all([SecureStore.setItemAsync(ACCESS_KEY, access), SecureStore.setItemAsync(REFRESH_KEY, refresh)])
  },

  async clear() {
    this.access = null
    this.refresh = null
    await Promise.all([SecureStore.deleteItemAsync(ACCESS_KEY), SecureStore.deleteItemAsync(REFRESH_KEY)]).catch(() => undefined)
  },
}
