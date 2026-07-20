/** Bridges the global player state to the single HTMLAudioElement in AudioDock. */
export const useAudioElementController = () => {
  const audio = ref<HTMLAudioElement | null>(null)
  const loadedSource = ref('')
  const loadedTrackSignature = ref('')
  const appliedSeekRequest = ref(0)
  const player = useAudioPlayer()

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
    seekTo,
  } = player

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
      void audio.value.play().catch(() => { isPlaying.value = false })
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

  watch(seekRequest, applyRequestedSeek, { flush: 'sync' })

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
      void audio.value.play().catch(() => { isPlaying.value = false })
      return
    }

    currentSeconds.value = end
    audio.value.pause()
  }

  const seekFromInput = (event: Event) => {
    const value = Number((event.target as HTMLInputElement).value)
    seekTo(value / 100)
  }

  return {
    ...player,
    audio,
    handleLoadedMetadata,
    handleTimeUpdate,
    seekFromInput,
  }
}
