<script setup lang="ts">
import type { ProgressMetricItem } from '~/types/archive'

const props = defineProps<{
  metric: ProgressMetricItem
  index?: number
}>()

const progress = computed(() => {
  const maximum = props.metric.targetMaximum || props.metric.targetValue
  if (props.metric.currentValue === null || !maximum) return null
  return Math.min(100, Math.round((props.metric.currentValue / maximum) * 100))
})
</script>

<template>
  <article class="metric-card">
    <div class="metric-card-head">
      <span>0{{ (index || 0) + 1 }}</span>
      <strong v-if="progress !== null">{{ progress }}%</strong>
      <strong v-else>待验证</strong>
    </div>
    <h3>{{ metric.label }}</h3>
    <p>{{ metric.currentFact }}</p>
    <div class="metric-track" :class="{ unknown: progress === null }">
      <i :style="{ width: `${progress || 0}%` }" />
    </div>
    <div class="metric-target">
      <span>当前事实</span>
      <span>目标 {{ metric.target }}</span>
    </div>
  </article>
</template>
