<script setup lang="ts">
const route = useRoute()
const items = [
  { label: '今天', to: '/', icon: 'home' as const },
  { label: '历史', to: '/logs', icon: 'logs' as const },
  { label: '曲目', to: '/repertoire', icon: 'repertoire' as const },
  { label: '录音', to: '/recordings', icon: 'recordings' as const },
  { label: '能力', to: '/progress', icon: 'progress' as const },
]
const active = (to: string) =>
  to === '/' ? ['/', '/practice'].includes(route.path) : route.path.startsWith(to)
</script>

<template>
  <nav class="mobile-nav" aria-label="移动端主导航">
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      :class="{ active: active(item.to) }"
    >
      <AppIcon :name="item.icon" :size="19" />
      <span>{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>
