<script setup lang="ts">
import type { EvidenceBoundary } from '~/types/archive'

const props = defineProps<{
  evidence: EvidenceBoundary
}>()

const items = computed(() => [
  {
    label: '文件事实',
    state: props.evidence.sources.includes('file_fact') ? '已确认' : '未关联',
    active: props.evidence.sources.includes('file_fact'),
  },
  {
    label: '用户自评',
    state: props.evidence.selfReport === 'yes' ? '已记录' : '未记录',
    active: props.evidence.selfReport === 'yes',
  },
  {
    label: '实际回听',
    state: props.evidence.performanceReview === 'reviewed' ? '已完成' : '待回听',
    active: props.evidence.performanceReview === 'reviewed',
  },
])
</script>

<template>
  <dl class="evidence-breakdown" aria-label="证据明细">
    <div v-for="item in items" :key="item.label" :class="{ active: item.active }">
      <dt>{{ item.label }}</dt>
      <dd>{{ item.state }}</dd>
    </div>
  </dl>
</template>
