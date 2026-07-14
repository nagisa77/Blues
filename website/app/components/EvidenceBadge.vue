<script setup lang="ts">
import type { EvidenceBoundary } from '~/types/archive'

const props = defineProps<{
  evidence: EvidenceBoundary
  compact?: boolean
}>()

const label = computed(() => {
  if (props.evidence.performanceReview === 'reviewed') return '已实际回听'
  if (props.evidence.selfReport === 'yes') return '用户自评 · 待回听'
  if (props.evidence.sources.includes('file_fact')) return '文件事实 · 待回听'
  return '证据待确认'
})

const tone = computed(() => {
  if (props.evidence.performanceReview === 'reviewed') return 'reviewed'
  if (props.evidence.selfReport === 'yes') return 'self-report'
  return 'neutral'
})
</script>

<template>
  <span class="evidence-badge" :class="[`tone-${tone}`, { compact }]">
    <i aria-hidden="true" />
    {{ label }}
  </span>
</template>
