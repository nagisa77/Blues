<script setup lang="ts">
import type { EvidenceBoundary } from '~/types/archive'

const props = defineProps<{
  evidence: EvidenceBoundary
  compact?: boolean
}>()

const presentation = computed(() => evidencePresentation(props.evidence))
const label = computed(() => presentation.value.label)
const visibleLabel = computed(() => props.compact
  ? presentation.value.compactLabel
  : presentation.value.label)
</script>

<template>
  <span class="evidence-badge" :class="[`tone-${presentation.tone}`, { compact }]" :title="compact ? label : undefined">
    <i aria-hidden="true">{{ presentation.mark }}</i>
    {{ visibleLabel }}
  </span>
</template>
