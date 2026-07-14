<script setup lang="ts">
const route = useRoute()

const navigation = [
  { label: '首页', to: '/' },
  { label: '练习日志', to: '/logs' },
  { label: '曲目', to: '/repertoire' },
  { label: '录音', to: '/recordings' },
  { label: '进度', to: '/progress' },
]

const isActive = (to: string) =>
  to === '/' ? route.path === '/' : route.path.startsWith(to)
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
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          :class="{ active: isActive(item.to) }"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <a
        class="header-github"
        href="https://github.com/nagisa77/Blues"
        target="_blank"
        rel="noreferrer"
        aria-label="在 GitHub 查看训练档案"
      >
        <AppIcon name="github" :size="18" />
        <span>GitHub</span>
      </a>
    </div>
  </header>
</template>
