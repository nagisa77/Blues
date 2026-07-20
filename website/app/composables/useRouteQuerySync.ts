import type { WatchSource } from 'vue'
import type { LocationQuery, LocationQueryRaw } from 'vue-router'

export const stringQueryValue = (
  query: LocationQuery,
  key: string,
  fallback = 'all',
) => typeof query[key] === 'string' ? query[key] : fallback

/**
 * Keeps page-local filters shareable without coupling domain composables to
 * Vue Router. Pages own serialization; debounce and lifecycle cleanup live here.
 */
export const useRouteQuerySync = (
  sources: WatchSource[],
  serialize: () => LocationQueryRaw,
  delay = 180,
) => {
  const router = useRouter()
  let timer: number | undefined

  const stop = watch(sources, () => {
    if (!import.meta.client) return
    if (timer) window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      void router.replace({ query: serialize() })
    }, delay)
  }, { deep: true })

  onBeforeUnmount(() => {
    stop()
    if (timer) window.clearTimeout(timer)
  })
}
