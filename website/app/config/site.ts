export type AppIconName =
  | 'home'
  | 'logs'
  | 'recordings'
  | 'repertoire'
  | 'progress'
  | 'play'
  | 'pause'
  | 'arrow'
  | 'external'
  | 'target'
  | 'clock'
  | 'search'
  | 'close'
  | 'github'
  | 'moon'
  | 'sun'

export interface NavigationItem {
  label: string
  to: string
  icon: AppIconName
}

export const SITE = {
  repository: 'nagisa77/Blues',
  branch: 'main',
  repositoryUrl: 'https://github.com/nagisa77/Blues',
} as const

export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { label: '今天', to: '/', icon: 'home' },
  { label: '历史', to: '/logs', icon: 'logs' },
  { label: '曲目', to: '/repertoire', icon: 'repertoire' },
  { label: '录音', to: '/recordings', icon: 'recordings' },
  { label: '能力', to: '/progress', icon: 'progress' },
]

export const isNavigationItemActive = (path: string, target: string) =>
  target === '/'
    ? ['/', '/practice'].includes(path)
    : path.startsWith(target)
