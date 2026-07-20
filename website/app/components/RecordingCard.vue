<script setup lang="ts">
import type { RecordingArchiveItem } from '~/types/archive'

const props = defineProps<{
  recording: RecordingArchiveItem
  featured?: boolean
  compareMode?: boolean
  compareSelected?: boolean
  compareDisabled?: boolean
  compareDisabledLabel?: string
  hideSongLink?: boolean
  compareWithLabel?: string
  showDecision?: boolean
  wide?: boolean
}>()

const emit = defineEmits<{
  toggleCompare: [recording: RecordingArchiveItem]
  comparePair: [recording: RecordingArchiveItem]
}>()

const {
  currentTrack,
  isPlaying,
  timelinePosition,
  timelineDuration,
  playbackPercentage,
  play,
  toggle,
  seekTo,
} = useAudioPlayer()
const isCurrent = computed(() => currentTrack.value?.id === props.recording.id)
const waveformProgress = computed(() => isCurrent.value ? playbackPercentage.value : 0)

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

const handleWaveformSeek = (event: Event) => {
  const value = Number((event.target as HTMLInputElement).value)
  if (!Number.isFinite(value)) return
  if (!isCurrent.value) play(recordingPlayerTrack(props.recording))
  seekTo(value / 100)
}
</script>

<template>
  <article class="recording-card" :class="{ featured, wide, playing: isCurrent && isPlaying, 'condensed-actions': hideSongLink }">
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

    <div
      v-if="waveform.length"
      class="waveform"
      :class="{ 'waveform-current': isCurrent }"
      :style="{ '--wave-progress': `${waveformProgress}%` }"
    >
      <span class="waveform-bars waveform-base" aria-hidden="true">
        <i v-for="(height, index) in waveform" :key="`base-${index}`" :style="{ height: `${height}%` }" />
      </span>
      <span class="waveform-bars waveform-played" aria-hidden="true">
        <i v-for="(height, index) in waveform" :key="`played-${index}`" :style="{ height: `${height}%` }" />
      </span>
      <label class="sr-only" :for="`waveform-seek-${recording.id}`">
        {{ isCurrent ? '播放进度，可拖动跳转' : '音频波形，拖动后开始播放' }}
      </label>
      <input
        :id="`waveform-seek-${recording.id}`"
        class="waveform-seek"
        type="range"
        min="0"
        max="100"
        step="0.1"
        :value="waveformProgress"
        :aria-valuetext="isCurrent ? `${formatSeconds(timelinePosition)} / ${formatSeconds(timelineDuration)}` : `录音时长 ${recording.durationLabel || '待确认'}`"
        @input="handleWaveformSeek"
      >
      <span class="waveform-playhead" aria-hidden="true" />
    </div>
    <div v-else class="waveform waveform-unavailable" role="img" :aria-label="`音频波形暂不可用，录音时长 ${recording.durationLabel || '待确认'}`">
      <span>波形暂不可用</span>
    </div>

    <div v-if="showDecision && (recording.evidenceSummary || recording.nextChange)" class="recording-decision">
      <p v-if="recording.evidenceSummary"><span>听完确认</span>{{ recording.evidenceSummary }}</p>
      <p v-if="recording.nextChange"><span>下一遍只改</span>{{ recording.nextChange }}</p>
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
          :title="compareDisabled ? compareDisabledLabel || 'A/B 对比需选择同一音乐片段的录音' : undefined"
          @click="emit('toggleCompare', recording)"
        >
          {{ compareSelected ? '已选 A/B' : compareDisabled ? compareDisabledLabel || '仅限同段' : '选择 A/B' }}
        </button>
        <button
          v-if="compareMode && compareWithLabel && !compareSelected && !compareDisabled"
          class="recording-compare recording-compare-direct"
          type="button"
          @click="emit('comparePair', recording)"
        >
          {{ compareWithLabel }}
        </button>
        <NuxtLink v-if="recording.logIds[0]" :to="`/logs/${recording.logIds[0]}`">日志</NuxtLink>
        <NuxtLink v-if="recording.songId && !hideSongLink" :to="{ path: '/repertoire', query: { song: recording.songId } }">曲目</NuxtLink>
        <a
          class="recording-source-link"
          :href="githubFileUrl(recording.resourcePath)"
          target="_blank"
          rel="noreferrer"
          aria-label="在 GitHub 打开源文件"
          title="在 GitHub 打开源文件"
        >
          <AppIcon name="external" :size="14" />
        </a>
      </div>
    </div>

    <p v-if="featured && recording.nextChange && !showDecision" class="recording-next">
      <span>下一遍只改</span>
      {{ recording.nextChange }}
    </p>
  </article>
</template>
