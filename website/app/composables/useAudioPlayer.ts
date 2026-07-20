export interface PlayerTrack {
  id: string
  title: string
  subtitle: string
  duration: string
  durationSeconds?: number
  source: string
  startSeconds?: number
  endSeconds?: number
  loop?: boolean
}

export const useAudioPlayer = () => {
  const currentTrack = useState<PlayerTrack | null>('player-track', () => null)
  const isPlaying = useState('player-playing', () => false)
  const playRequest = useState('player-request', () => 0)
  const currentSeconds = useState('player-current-seconds', () => 0)
  const mediaDuration = useState('player-media-duration', () => 0)
  const requestedSeekRatio = useState('player-seek-ratio', () => 0)
  const seekRequest = useState('player-seek-request', () => 0)

  const trackStart = computed(() => currentTrack.value?.startSeconds || 0)
  const trackEnd = computed(() => {
    const requestedEnd = currentTrack.value?.endSeconds
    const availableDuration = mediaDuration.value || currentTrack.value?.durationSeconds || 0
    if (requestedEnd && availableDuration) return Math.min(requestedEnd, availableDuration)
    return requestedEnd || availableDuration
  })
  const timelineDuration = computed(() => Math.max(0, trackEnd.value - trackStart.value))
  const timelinePosition = computed(() => Math.min(
    timelineDuration.value,
    Math.max(0, currentSeconds.value - trackStart.value),
  ))
  const playbackPercentage = computed(() =>
    timelineDuration.value > 0
      ? Math.min(100, (timelinePosition.value / timelineDuration.value) * 100)
      : 0,
  )

  const play = (track: PlayerTrack) => {
    const isNewTrack = currentTrack.value?.id !== track.id
      || currentTrack.value?.source !== track.source
      || currentTrack.value?.startSeconds !== track.startSeconds
      || currentTrack.value?.endSeconds !== track.endSeconds

    currentTrack.value = track
    if (isNewTrack) {
      currentSeconds.value = track.startSeconds || 0
      mediaDuration.value = 0
      requestedSeekRatio.value = 0
      seekRequest.value += 1
    }
    isPlaying.value = true
    playRequest.value += 1
  }

  const toggle = () => {
    if (!currentTrack.value) return
    isPlaying.value = !isPlaying.value
    playRequest.value += 1
  }

  const close = () => {
    isPlaying.value = false
    currentTrack.value = null
    currentSeconds.value = 0
    mediaDuration.value = 0
    requestedSeekRatio.value = 0
    playRequest.value += 1
  }

  const seekTo = (ratio: number) => {
    if (!currentTrack.value || !Number.isFinite(ratio)) return
    requestedSeekRatio.value = Math.min(1, Math.max(0, ratio))
    if (timelineDuration.value) {
      currentSeconds.value = trackStart.value + requestedSeekRatio.value * timelineDuration.value
    }
    seekRequest.value += 1
  }

  return {
    currentTrack,
    isPlaying,
    playRequest,
    currentSeconds,
    mediaDuration,
    requestedSeekRatio,
    seekRequest,
    trackStart,
    trackEnd,
    timelineDuration,
    timelinePosition,
    playbackPercentage,
    play,
    toggle,
    close,
    seekTo,
  }
}
