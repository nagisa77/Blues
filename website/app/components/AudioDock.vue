<script setup lang="ts">
const audio = ref<HTMLAudioElement | null>(null)
const currentSeconds = ref(0)
const actualDuration = ref(0)
const loadedSource = ref('')
const { currentTrack, isPlaying, playRequest, toggle, close } = useAudioPlayer()

const percentage = computed(() =>
  actualDuration.value > 0
    ? Math.min(100, (currentSeconds.value / actualDuration.value) * 100)
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
    return
  }

  if (loadedSource.value !== currentTrack.value.source) {
    loadedSource.value = currentTrack.value.source
    currentSeconds.value = 0
    actualDuration.value = 0
    audio.value.src = currentTrack.value.source
    audio.value.load()
  }

  if (isPlaying.value) {
    void audio.value.play().catch(() => {
      isPlaying.value = false
    })
  } else {
    audio.value.pause()
  }
}, { flush: 'sync' })

const seek = (event: Event) => {
  const value = Number((event.target as HTMLInputElement).value)
  if (!audio.value || !actualDuration.value) return
  audio.value.currentTime = (value / 100) * actualDuration.value
}
</script>

<template>
  <audio
    ref="audio"
    preload="metadata"
    @timeupdate="currentSeconds = audio?.currentTime || 0"
    @loadedmetadata="actualDuration = audio?.duration || 0"
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
        <span>NOW PLAYING</span>
        <strong>{{ currentTrack.title }}</strong>
        <small>{{ currentTrack.subtitle }}</small>
      </div>

      <button class="dock-play" type="button" :aria-label="isPlaying ? '暂停' : '播放'" @click="toggle">
        <AppIcon :name="isPlaying ? 'pause' : 'play'" :size="20" />
      </button>

      <div class="dock-progress">
        <span>{{ formatClock(currentSeconds) }}</span>
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
        <span>{{ actualDuration ? formatClock(actualDuration) : currentTrack.duration }}</span>
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
