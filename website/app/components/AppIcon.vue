<script setup lang="ts">
import type { AppIconName } from '~/config/site'

defineProps<{
  name: AppIconName
  size?: number
}>()
</script>

<template>
  <svg
    width="1em"
    height="1em"
    :style="{ width: `${size || 20}px`, height: `${size || 20}px` }"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'home'">
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" />
    </template>
    <template v-else-if="name === 'logs'">
      <path d="M6 3h12v18H6z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </template>
    <template v-else-if="name === 'recordings'">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v6" />
    </template>
    <template v-else-if="name === 'repertoire'">
      <path d="M5 4h14v16H5z" />
      <path d="M9 4v16M13 8h3M13 12h3M13 16h3" />
    </template>
    <template v-else-if="name === 'progress'">
      <path d="M4 19V9M10 19V5M16 19v-7M22 19V3" />
    </template>
    <template v-else-if="name === 'play'">
      <path d="m8 5 11 7-11 7V5Z" />
    </template>
    <template v-else-if="name === 'pause'">
      <path d="M9 5v14M15 5v14" />
    </template>
    <template v-else-if="name === 'arrow'">
      <path d="M5 12h14M14 7l5 5-5 5" />
    </template>
    <template v-else-if="name === 'external'">
      <path d="M14 4h6v6M20 4l-9 9" />
      <path d="M18 13v6H5V6h6" />
    </template>
    <template v-else-if="name === 'target'">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M15 9 21 3M17 3h4v4" />
    </template>
    <template v-else-if="name === 'clock'">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </template>
    <template v-else-if="name === 'search'">
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 5 5" />
    </template>
    <template v-else-if="name === 'close'">
      <path d="m6 6 12 12M18 6 6 18" />
    </template>
    <template v-else-if="name === 'github'">
      <path d="M15 22v-4c.1-1-.3-1.8-.8-2.3 2.7-.3 5.5-1.3 5.5-6A4.7 4.7 0 0 0 18.5 6c.1-.4.5-1.7-.1-3.5 0 0-1-.4-3.7 1.4a13 13 0 0 0-6.7 0C5.3 2.1 4.3 2.5 4.3 2.5 3.7 4.3 4.1 5.6 4.2 6A4.8 4.8 0 0 0 3 9.7c0 4.6 2.8 5.7 5.5 6-.4.4-.8 1-.8 2v4" />
      <path d="M7.7 19c-2.7.8-2.7-1.3-3.8-1.6" />
    </template>
    <template v-else-if="name === 'moon'">
      <path d="M20.4 15.1A8.5 8.5 0 0 1 8.9 3.6 8.5 8.5 0 1 0 20.4 15.1Z" />
    </template>
    <template v-else-if="name === 'sun'">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
    </template>
  </svg>
</template>
