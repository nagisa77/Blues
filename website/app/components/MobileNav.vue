<script setup lang="ts">
import { isNavigationItemActive, NAVIGATION_ITEMS } from '~/config/site'

const route = useRoute()
const active = (to: string) => isNavigationItemActive(route.path, to)
</script>

<template>
  <nav class="mobile-nav" aria-label="移动端主导航">
    <NuxtLink
      v-for="item in NAVIGATION_ITEMS"
      :key="item.to"
      :to="item.to"
      :class="{ active: active(item.to) }"
    >
      <AppIcon :name="item.icon" :size="19" />
      <span>{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>
