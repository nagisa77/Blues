<script setup lang="ts">
import type { ProgressMetricItem } from '~/types/archive'

const props = defineProps<{
  metric: ProgressMetricItem
  index?: number
  updatedAt?: string | null
}>()
</script>

<template>
  <article class="metric-card">
    <div class="metric-card-head">
      <span>0{{ (index || 0) + 1 }}</span>
      <EvidenceBadge :evidence="metric.evidence" compact />
    </div>
    <h3>{{ metric.label }}</h3>
    <div class="metric-fact">
      <span>当前事实</span>
      <p>{{ metric.currentFact }}</p>
    </div>
    <div class="metric-target">
      <span>目标</span>
      <strong>{{ metric.target }}</strong>
    </div>
    <p v-if="updatedAt" class="metric-updated">档案更新于 {{ formatArchiveDate(updatedAt, true) }}</p>
  </article>
</template>
