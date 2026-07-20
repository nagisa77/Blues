<script setup lang="ts">
const { currentTrack } = useAudioPlayer()
</script>

<template>
  <div class="site-shell" :class="{ 'player-open': currentTrack }">
    <a class="skip-link" href="#main-content">跳到主要内容</a>
    <AppHeader />
    <main id="main-content">
      <slot />
    </main>
    <AppFooter />
    <AudioDock />
    <MobileNav />
  </div>
</template>
