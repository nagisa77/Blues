import type { RecordingArchiveItem } from '~/types/archive'

/** Domain state for comparing two recordings of the same musical segment. */
export const useRecordingComparison = () => {
  const catalog = useArchiveCatalog()
  const { play } = useAudioPlayer()
  const comparisonIds = ref<string[]>([])
  const compareLength = ref(20)
  const comparisonOffsets = reactive<Record<string, number>>({})

  const comparisonRecordings = computed(() => comparisonIds.value
    .map(id => catalog.recording(id))
    .filter((recording): recording is RecordingArchiveItem => Boolean(recording)))

  const comparisonScope = computed(() =>
    comparisonRecordings.value[0]?.comparisonGroup || null,
  )

  const groupItems = (recording: RecordingArchiveItem) =>
    catalog.comparisonGroup(recording)

  const hasPeer = (recording: RecordingArchiveItem) => groupItems(recording).length > 1

  const peer = (recording: RecordingArchiveItem) => {
    const group = groupItems(recording)
    const index = group.findIndex(other => other.id === recording.id)
    if (index < 0) return null
    return group[index + 1] || group[index - 1] || null
  }

  const disabledReason = (recording: RecordingArchiveItem) => {
    if (!hasPeer(recording)) return '暂无同段版本'
    if (comparisonScope.value && recording.comparisonGroup !== comparisonScope.value) {
      return '仅限同一片段'
    }
    return null
  }

  const isDisabled = (recording: RecordingArchiveItem) => Boolean(disabledReason(recording))

  const seedOffset = (recording: RecordingArchiveItem) => {
    if (!(recording.id in comparisonOffsets)) {
      comparisonOffsets[recording.id] = recording.comparisonStartSeconds || 0
    }
  }

  const toggle = (recording: RecordingArchiveItem) => {
    if (isDisabled(recording)) return false
    if (comparisonIds.value.includes(recording.id)) {
      comparisonIds.value = comparisonIds.value.filter(id => id !== recording.id)
      return false
    }
    seedOffset(recording)
    comparisonIds.value = [...comparisonIds.value.slice(-1), recording.id]
    return true
  }

  const selectPair = (recording: RecordingArchiveItem) => {
    const pairedRecording = peer(recording)
    if (!pairedRecording) return false
    seedOffset(recording)
    seedOffset(pairedRecording)
    comparisonIds.value = [recording.id, pairedRecording.id]
    return true
  }

  const start = (recording: RecordingArchiveItem) => comparisonOffsets[recording.id]
    ?? recording.comparisonStartSeconds
    ?? 0

  const maximumLength = computed(() => {
    if (!comparisonRecordings.value.length) return 90
    const available = comparisonRecordings.value.map(recording => Math.max(
      1,
      (recording.durationSeconds || 90) - start(recording),
    ))
    return Math.max(1, Math.floor(Math.min(90, ...available)))
  })

  const playRecording = (recording: RecordingArchiveItem) => play(
    recordingLoopTrack(
      recording,
      start(recording),
      Math.min(compareLength.value, maximumLength.value),
    ),
  )

  const restore = (recordings: RecordingArchiveItem[]) => {
    const scope = recordings[0]?.comparisonGroup
    if (!scope || recordings.length !== 2) return false
    if (!recordings.every(recording => recording.comparisonGroup === scope)) return false
    recordings.forEach(seedOffset)
    comparisonIds.value = recordings.map(recording => recording.id)
    return true
  }

  const clear = () => {
    comparisonIds.value = []
    Object.keys(comparisonOffsets).forEach(key => delete comparisonOffsets[key])
  }

  return {
    comparisonIds,
    compareLength,
    comparisonOffsets,
    comparisonRecordings,
    maximumLength,
    hasPeer,
    peer,
    disabledReason,
    isDisabled,
    toggle,
    selectPair,
    start,
    playRecording,
    restore,
    clear,
  }
}
