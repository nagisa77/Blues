<script setup lang="ts">
import type { PracticeLogItem } from '~/types/archive'

defineProps<{
  log: PracticeLogItem
  index?: number
}>()
</script>

<template>
  <article class="log-card">
    <div class="log-date">
      <strong>{{ formatArchiveDate(log.date) }}</strong>
      <span>{{ log.dayToken || 'SESSION' }}</span>
    </div>

    <div class="log-card-content">
      <div class="log-meta">
        <span v-if="log.calendarWeekId">{{ log.calendarWeekId }}</span>
        <span v-if="log.durationText"><AppIcon name="clock" :size="14" />{{ log.durationText }}</span>
      </div>
      <h3>{{ log.title }}</h3>
      <p>{{ log.focus || log.task.output || '本次事实正在整理。' }}</p>
      <div class="log-evidence-row">
        <EvidenceBadge :evidence="log.evidence" compact />
        <span v-if="log.recordingIds.length">{{ log.recordingIds.length }} 条录音</span>
      </div>
    </div>

    <NuxtLink class="log-open" :to="`/logs/${log.id}`" :aria-label="`查看 ${log.title}`">
      <AppIcon name="arrow" :size="20" />
    </NuxtLink>
  </article>
</template>
