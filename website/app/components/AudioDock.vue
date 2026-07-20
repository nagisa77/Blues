<script setup lang="ts">
const audio = ref<HTMLAudioElement | null>(null)
const loadedSource = ref('')
const loadedTrackSignature = ref('')
const appliedSeekRequest = ref(0)
const {
  currentTrack,
  isPlaying,
  playRequest,
  currentSeconds,
  mediaDuration,
  requestedSeekRatio,
  seekRequest,
  trackStart,
  timelineDuration,
  timelinePosition,
  playbackPercentage,
  toggle,
  close,
  seekTo,
} = useAudioPlayer()

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
    currentSeconds.value = currentTrack.value.startSeconds || 0
    mediaDuration.value = 0
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

const applyRequestedSeek = () => {
  if (!audio.value || audio.value.readyState < 1 || !timelineDuration.value) return false
  const nextTime = trackStart.value + requestedSeekRatio.value * timelineDuration.value
  audio.value.currentTime = nextTime
  currentSeconds.value = nextTime
  appliedSeekRequest.value = seekRequest.value
  return true
}

watch(seekRequest, () => {
  applyRequestedSeek()
}, { flush: 'sync' })

const handleLoadedMetadata = () => {
  if (!audio.value) return
  mediaDuration.value = audio.value.duration || 0
  const start = currentTrack.value?.startSeconds || 0
  if (start > 0 && start < mediaDuration.value) {
    audio.value.currentTime = start
    currentSeconds.value = start
  }
  if (appliedSeekRequest.value !== seekRequest.value) applyRequestedSeek()
}

const handleTimeUpdate = () => {
  if (!audio.value) return
  currentSeconds.value = audio.value.currentTime || 0
  const end = currentTrack.value?.endSeconds
  if (!end || audio.value.currentTime < end) return

  if (currentTrack.value?.loop) {
    audio.value.currentTime = currentTrack.value.startSeconds || 0
    currentSeconds.value = audio.value.currentTime
    void audio.value.play().catch(() => {
      isPlaying.value = false
    })
  } else {
    currentSeconds.value = end
    audio.value.pause()
  }
}

const seek = (event: Event) => {
  const value = Number((event.target as HTMLInputElement).value)
  seekTo(value / 100)
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
    <aside
      v-if="currentTrack"
      class="audio-dock"
      aria-label="全局录音播放器"
    >
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
          :value="playbackPercentage"
          :style="{ '--progress': `${playbackPercentage}%` }"
          :aria-valuetext="`${formatClock(timelinePosition)} / ${timelineDuration ? formatClock(timelineDuration) : currentTrack.duration}`"
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
