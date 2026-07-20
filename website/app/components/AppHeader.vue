<script setup lang="ts">
import { isNavigationItemActive, NAVIGATION_ITEMS, SITE } from '~/config/site'

const route = useRoute()
const { theme, toggleTheme } = useTheme()

const isActive = (to: string) => isNavigationItemActive(route.path, to)
</script>

<template>
  <header class="site-header">
    <div class="container header-inner">
      <NuxtLink class="brand" to="/" aria-label="Tim 的 Blues 练习记录首页">
        <span class="brand-mark"><span>T</span><i /></span>
        <span class="brand-copy">
          <strong>TIM / BLUES</strong>
          <small>PRACTICE ARCHIVE</small>
        </span>
      </NuxtLink>

      <nav class="desktop-nav" aria-label="主导航">
        <NuxtLink
          v-for="item in NAVIGATION_ITEMS"
          :key="item.to"
          :to="item.to"
          :class="{ active: isActive(item.to) }"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="header-actions">
        <button
          class="theme-toggle"
          type="button"
          :aria-label="theme === 'dark' ? '切换到白天模式' : '切换到黑夜模式'"
          :title="theme === 'dark' ? '切换到白天模式' : '切换到黑夜模式'"
          @click="toggleTheme"
        >
          <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="17" />
          <span>{{ theme === 'dark' ? '白天' : '黑夜' }}</span>
        </button>

        <a
          class="header-github"
          :href="SITE.repositoryUrl"
          target="_blank"
          rel="noreferrer"
          aria-label="在 GitHub 查看训练档案"
        >
          <AppIcon name="github" :size="18" />
          <span>GitHub</span>
        </a>
      </div>
    </div>
  </header>
</template>
