<script setup lang="ts">
import type { RecordingArchiveItem } from '~/types/archive'

const props = defineProps<{
  recording: RecordingArchiveItem
  featured?: boolean
}>()

const { currentTrack, isPlaying, play, toggle } = useAudioPlayer()
const isCurrent = computed(() => currentTrack.value?.id === props.recording.id)

const handlePlay = () => {
  if (isCurrent.value) toggle()
  else play(recordingPlayerTrack(props.recording))
}

const waveform = computed(() => {
  let seed = [...props.recording.id].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return Array.from({ length: props.featured ? 42 : 28 }, (_, index) => {
    seed = (seed * 9301 + 49297 + index) % 233280
    return 20 + Math.round((seed / 233280) * 75)
  })
})
</script>

<template>
  <article class="recording-card" :class="{ featured, playing: isCurrent && isPlaying }">
    <div class="recording-topline">
      <span class="recording-type">{{ recording.typeLabel }}</span>
      <span>{{ formatArchiveDate(recording.date, true) }}</span>
    </div>

    <div class="recording-main">
      <button
        class="recording-play"
        type="button"
        :aria-label="isCurrent && isPlaying ? `暂停 ${recording.title}` : `播放 ${recording.title}`"
        @click="handlePlay"
      >
        <AppIcon :name="isCurrent && isPlaying ? 'pause' : 'play'" :size="featured ? 24 : 19" />
      </button>

      <div class="recording-copy">
        <h3>{{ recording.title }}</h3>
        <p>
          <span v-if="recording.keyLabel">{{ recording.keyLabel }}</span>
          <span v-if="recording.tempoLabel">{{ recording.tempoLabel }}</span>
          <span>{{ recording.durationLabel || '时长待确认' }}</span>
        </p>
      </div>
    </div>

    <div class="waveform" :aria-label="`录音时长 ${recording.durationLabel || '待确认'}`">
      <i v-for="(height, index) in waveform" :key="index" :style="{ height: `${height}%` }" />
    </div>

    <div class="recording-footer">
      <EvidenceBadge :evidence="recording.evidence" compact />
      <a :href="githubFileUrl(recording.resourcePath)" target="_blank" rel="noreferrer">
        GitHub 源文件
        <AppIcon name="external" :size="13" />
      </a>
    </div>

    <p v-if="featured && recording.nextChange" class="recording-next">
      <span>下一遍只改</span>
      {{ recording.nextChange }}
    </p>
  </article>
</template>
