<script setup lang="ts">
import type { ProgressMetricItem } from '~/types/archive'

const props = defineProps<{
  metric: ProgressMetricItem
  index?: number
  updatedAt?: string | null
}>()

const state = computed(() => {
  if (props.metric.evidence.performanceReview === 'reviewed') return '已复核'
  if (/^(?:0|待验证|尚无)/.test(props.metric.currentFact)) return '未建立'
  if (props.metric.evidence.selfReport === 'yes') return '有自评，待复核'
  if (props.metric.evidence.sources.includes('file_fact')) return '已有文件事实'
  return '待确认'
})
</script>

<template>
  <article class="metric-card">
    <div class="metric-card-head">
      <span>0{{ (index || 0) + 1 }}</span>
      <EvidenceBadge :evidence="metric.evidence" compact />
    </div>
    <h3>{{ metric.label }}</h3>
    <p class="metric-state">{{ state }}</p>
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
