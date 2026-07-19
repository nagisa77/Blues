<script setup lang="ts">
import type { RecordingArchiveItem } from '~/types/archive'

const props = defineProps<{
  recording: RecordingArchiveItem
  featured?: boolean
  compareMode?: boolean
  compareSelected?: boolean
  compareDisabled?: boolean
  compareDisabledLabel?: string
}>()

const emit = defineEmits<{
  toggleCompare: [recording: RecordingArchiveItem]
}>()

const { currentTrack, isPlaying, play, toggle } = useAudioPlayer()
const isCurrent = computed(() => currentTrack.value?.id === props.recording.id)

const handlePlay = () => {
  if (isCurrent.value) toggle()
  else play(recordingPlayerTrack(props.recording))
}

const waveform = computed(() => {
  if (!props.recording.waveform?.length) return []
  return props.featured
    ? props.recording.waveform
    : props.recording.waveform.filter((_, index) => index % 2 === 0)
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

    <div v-if="waveform.length" class="waveform" :aria-label="`真实音频波形，录音时长 ${recording.durationLabel || '待确认'}`">
      <i v-for="(height, index) in waveform" :key="index" :style="{ height: `${height}%` }" />
    </div>
    <div v-else class="waveform waveform-unavailable" role="img" :aria-label="`音频波形暂不可用，录音时长 ${recording.durationLabel || '待确认'}`">
      <span>波形暂不可用</span>
    </div>

    <div class="recording-footer">
      <EvidenceBadge :evidence="recording.evidence" compact />
      <div class="recording-links">
        <button
          v-if="compareMode"
          class="recording-compare"
          type="button"
          :aria-pressed="compareSelected"
          :disabled="compareDisabled"
          :title="compareDisabled ? compareDisabledLabel || 'A/B 对比需选择同一曲目的录音' : undefined"
          @click="emit('toggleCompare', recording)"
        >
          {{ compareSelected ? '已加入对比' : compareDisabled ? compareDisabledLabel || '仅限同曲' : '加入 A/B' }}
        </button>
        <NuxtLink v-if="recording.logIds[0]" :to="`/logs/${recording.logIds[0]}`">日志</NuxtLink>
        <NuxtLink v-if="recording.songId" :to="{ path: '/repertoire', query: { song: recording.songId } }">曲目</NuxtLink>
        <a :href="githubFileUrl(recording.resourcePath)" target="_blank" rel="noreferrer" aria-label="在 GitHub 打开源文件">
          源文件<AppIcon name="external" :size="13" />
        </a>
      </div>
    </div>

    <p v-if="featured && recording.nextChange" class="recording-next">
      <span>下一遍只改</span>
      {{ recording.nextChange }}
    </p>
  </article>
</template>
