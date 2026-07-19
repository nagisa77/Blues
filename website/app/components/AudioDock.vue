<script setup lang="ts">
const audio = ref<HTMLAudioElement | null>(null)
const currentSeconds = ref(0)
const actualDuration = ref(0)
const loadedSource = ref('')
const loadedTrackSignature = ref('')
const { currentTrack, isPlaying, playRequest, toggle, close } = useAudioPlayer()

const trackStart = computed(() => currentTrack.value?.startSeconds || 0)
const trackEnd = computed(() => {
  const requestedEnd = currentTrack.value?.endSeconds
  if (requestedEnd && actualDuration.value) return Math.min(requestedEnd, actualDuration.value)
  return requestedEnd || actualDuration.value
})
const timelineDuration = computed(() => Math.max(0, trackEnd.value - trackStart.value))
const timelinePosition = computed(() => Math.max(0, currentSeconds.value - trackStart.value))
const percentage = computed(() =>
  timelineDuration.value > 0
    ? Math.min(100, (timelinePosition.value / timelineDuration.value) * 100)
    : 0,
)

const formatClock = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.floor(seconds % 60)
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

watch(playRequest, () => {
  if (!audio.value) return

  if (!currentTrack.value) {
    audio.value.pause()
    audio.value.removeAttribute('src')
    audio.value.load()
    loadedSource.value = ''
    loadedTrackSignature.value = ''
    return
  }

  const signature = [
    currentTrack.value.id,
    currentTrack.value.startSeconds || 0,
    currentTrack.value.endSeconds || 0,
  ].join(':')

  if (loadedSource.value !== currentTrack.value.source) {
    loadedSource.value = currentTrack.value.source
    currentSeconds.value = 0
    actualDuration.value = 0
    audio.value.src = currentTrack.value.source
    audio.value.load()
  }


  if (loadedTrackSignature.value !== signature) {
    loadedTrackSignature.value = signature
    if (audio.value.readyState >= 1) {
      audio.value.currentTime = currentTrack.value.startSeconds || 0
      currentSeconds.value = audio.value.currentTime
    }
  }

  if (isPlaying.value) {
    void audio.value.play().catch(() => {
      isPlaying.value = false
    })
  } else {
    audio.value.pause()
  }
}, { flush: 'sync' })

const handleLoadedMetadata = () => {
  if (!audio.value) return
  actualDuration.value = audio.value.duration || 0
  const start = currentTrack.value?.startSeconds || 0
  if (start > 0 && start < actualDuration.value) {
    audio.value.currentTime = start
    currentSeconds.value = start
  }
}

const handleTimeUpdate = () => {
  if (!audio.value) return
  currentSeconds.value = audio.value.currentTime || 0
  const end = currentTrack.value?.endSeconds
  if (!end || audio.value.currentTime < end) return

  if (currentTrack.value?.loop) {
    audio.value.currentTime = currentTrack.value.startSeconds || 0
    void audio.value.play().catch(() => {
      isPlaying.value = false
    })
  } else {
    audio.value.pause()
  }
}

const seek = (event: Event) => {
  const value = Number((event.target as HTMLInputElement).value)
  if (!audio.value || !timelineDuration.value) return
  audio.value.currentTime = trackStart.value + (value / 100) * timelineDuration.value
}
</script>

<template>
  <audio
    ref="audio"
    preload="metadata"
    @timeupdate="handleTimeUpdate"
    @loadedmetadata="handleLoadedMetadata"
    @play="isPlaying = true"
    @pause="isPlaying = false"
    @ended="isPlaying = false"
  />

  <Transition name="player-rise">
    <aside v-if="currentTrack" class="audio-dock" aria-label="全局录音播放器">
      <div class="dock-art" aria-hidden="true">
        <span class="record-groove" />
      </div>

      <div class="dock-copy">
        <span>{{ currentTrack.loop ? 'LOOPING SEGMENT' : 'NOW PLAYING' }}</span>
        <strong>{{ currentTrack.title }}</strong>
        <small>{{ currentTrack.subtitle }}</small>
      </div>

      <button class="dock-play" type="button" :aria-label="isPlaying ? '暂停' : '播放'" @click="toggle">
        <AppIcon :name="isPlaying ? 'pause' : 'play'" :size="20" />
      </button>

      <div class="dock-progress">
        <span>{{ formatClock(timelinePosition) }}</span>
        <label class="sr-only" for="audio-progress">播放进度</label>
        <input
          id="audio-progress"
          type="range"
          min="0"
          max="100"
          step="0.1"
          :value="percentage"
          :style="{ '--progress': `${percentage}%` }"
          @input="seek"
        >
        <span>{{ timelineDuration ? formatClock(timelineDuration) : currentTrack.duration }}</span>
      </div>

      <a :href="currentTrack.source" class="dock-source" target="_blank" rel="noreferrer">
        <span>源文件</span>
        <AppIcon name="external" :size="15" />
      </a>

      <button class="dock-close" type="button" aria-label="关闭播放器" @click="close">
        <AppIcon name="close" :size="18" />
      </button>
    </aside>
  </Transition>
</template>
