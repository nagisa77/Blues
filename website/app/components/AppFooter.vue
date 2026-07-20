<script setup lang="ts">
import { SITE } from '~/config/site'
</script>

<template>
  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <p class="footer-mark">TIM / BLUES</p>
        <p class="footer-note">练习留下声音，声音成为证据。</p>
      </div>
      <p class="footer-meta">
        最后更新以训练档案为准<br>
        文件事实、用户自评与实际回听分别记录 ·
        <a :href="SITE.repositoryUrl" target="_blank" rel="noreferrer">查看 GitHub 源档案</a>
      </p>
    </div>
  </footer>
</template>
