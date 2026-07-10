<script setup lang="ts">
defineProps<{ error: { statusCode?: number; statusMessage?: string } }>()
const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <main class="error-page">
    <div class="error-record" aria-hidden="true"><span>{{ error.statusCode || 404 }}</span></div>
    <p class="eyebrow"><span /> LOST THE FORM / 位置丢了</p>
    <h1>{{ error.statusMessage || '这一页没有声音。' }}</h1>
    <p>回到首页，重新从第一小节开始。</p>
    <button class="button button-primary" type="button" @click="handleError">回到首页</button>
  </main>
</template>
