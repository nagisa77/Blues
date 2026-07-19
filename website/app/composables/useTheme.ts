export type ColorTheme = 'light' | 'dark'

const storageKey = 'tim-blues-theme'

export const useTheme = () => {
  const theme = useState<ColorTheme>('color-theme', () => 'light')
  let systemTheme: MediaQueryList | undefined

  const applyTheme = (nextTheme: ColorTheme, persist = true) => {
    theme.value = nextTheme

    if (!import.meta.client) return

    document.documentElement.dataset.theme = nextTheme
    document.documentElement.style.colorScheme = nextTheme
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute('content', nextTheme === 'dark' ? '#111412' : '#f5f4ef')

    if (persist) localStorage.setItem(storageKey, nextTheme)
  }

  const toggleTheme = () => {
    applyTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  const handleSystemThemeChange = (event: MediaQueryListEvent) => {
    if (!localStorage.getItem(storageKey)) {
      applyTheme(event.matches ? 'dark' : 'light', false)
    }
  }

  onMounted(() => {
    const storedTheme = localStorage.getItem(storageKey)
    const initialTheme: ColorTheme = storedTheme === 'dark' || storedTheme === 'light'
      ? storedTheme
      : document.documentElement.dataset.theme === 'dark'
        ? 'dark'
        : 'light'

    applyTheme(initialTheme, false)

    systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
    systemTheme.addEventListener('change', handleSystemThemeChange)
  })

  onBeforeUnmount(() => systemTheme?.removeEventListener('change', handleSystemThemeChange))

  return {
    theme: readonly(theme),
    toggleTheme,
  }
}
