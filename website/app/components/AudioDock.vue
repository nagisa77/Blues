<script setup lang="ts">
const {
  audio,
  currentTrack,
  isPlaying,
  timelineDuration,
  timelinePosition,
  playbackPercentage,
  toggle,
  close,
  handleLoadedMetadata,
  handleTimeUpdate,
  seekFromInput,
} = useAudioElementController()
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
        <span>{{ formatSeconds(timelinePosition) }}</span>
        <label class="sr-only" for="audio-progress">播放进度</label>
        <input
          id="audio-progress"
          type="range"
          min="0"
          max="100"
          step="0.1"
          :value="playbackPercentage"
          :style="{ '--progress': `${playbackPercentage}%` }"
          :aria-valuetext="`${formatSeconds(timelinePosition)} / ${timelineDuration ? formatSeconds(timelineDuration) : currentTrack.duration}`"
          @input="seekFromInput"
        >
        <span>{{ timelineDuration ? formatSeconds(timelineDuration) : currentTrack.duration }}</span>
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
