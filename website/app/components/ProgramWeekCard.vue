<script setup lang="ts">
import type { ProgramWeekItem } from '~/types/archive'

const props = defineProps<{
  week: ProgramWeekItem
  activeWeek: number
}>()

const title = computed(() => {
  if (props.week.number === props.activeWeek - 1) return '完整曲目中的稳定连接'
  if (props.week.number === props.activeWeek) return '跨段连续进入与失误恢复'
  if (props.week.number === props.activeWeek + 1) return '连续 set 与失误恢复'
  return props.week.deliverable
})
</script>

<template>
  <article
    class="week-card"
    :class="[`status-${week.status}`, { active: week.number === activeWeek }]"
  >
    <div class="week-number"><span>阶段</span>{{ week.number.toString().padStart(2, '0') }}</div>
    <div class="week-status"><i />{{ week.statusLabel }}</div>
    <h3>{{ title }}</h3>
    <p>{{ week.evidenceSummary || '尚无交付证据。' }}</p>
    <div v-if="week.nextStep" class="week-next"><span>下一步</span>{{ week.nextStep }}</div>
  </article>
</template>
