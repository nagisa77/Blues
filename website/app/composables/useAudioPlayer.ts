export interface PlayerTrack {
  id: string
  title: string
  subtitle: string
  duration: string
  source: string
}

export const useAudioPlayer = () => {
  const currentTrack = useState<PlayerTrack | null>('player-track', () => null)
  const isPlaying = useState('player-playing', () => false)
  const playRequest = useState('player-request', () => 0)

  const play = (track: PlayerTrack) => {
    currentTrack.value = track
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
    playRequest.value += 1
  }

  return { currentTrack, isPlaying, playRequest, play, toggle, close }
}
