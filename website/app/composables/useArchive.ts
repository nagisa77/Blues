import archiveJson from '~/data/generated/archive.json'
import type {
  ArchiveData,
  PracticeLogItem,
  RecordingArchiveItem,
  SongArchiveItem,
} from '~/types/archive'

const archive = archiveJson as ArchiveData

const songsById = indexBy(archive.songs, song => song.id)
const recordingsById = indexBy(archive.recordings, recording => recording.id)
const logsById = indexBy(archive.logs, log => log.id)
const recordingsBySongId = groupBy(
  archive.recordings.filter(recording => recording.songId),
  recording => recording.songId as string,
)
const recordingsByComparisonGroup = groupBy(
  archive.recordings.filter(recording => recording.comparisonGroup),
  recording => recording.comparisonGroup as string,
)

const titleIncludesSong = (title: string, song: SongArchiveItem) =>
  title.toLocaleLowerCase('zh-CN').includes(song.title.toLocaleLowerCase('zh-CN'))

const songIdByLogId = new Map(archive.logs.map((log) => {
  const recordingSongId = log.recordingIds
    .map(id => recordingsById.get(id)?.songId)
    .find(Boolean)
  const titleSongId = archive.songs.find(song => titleIncludesSong(log.title, song))?.id
  return [log.id, recordingSongId || titleSongId || null]
}))

export const archiveCatalog = {
  data: archive,
  song: (id: string | null | undefined) => id ? songsById.get(id) ?? null : null,
  recording: (id: string | null | undefined) => id ? recordingsById.get(id) ?? null : null,
  log: (id: string | null | undefined) => id ? logsById.get(id) ?? null : null,
  songForLog: (log: PracticeLogItem) => songsById.get(songIdByLogId.get(log.id) || '') ?? null,
  recordingsForSong: (songId: string, limit?: number) => {
    const recordings = recordingsBySongId.get(songId) ?? []
    return typeof limit === 'number' ? recordings.slice(0, limit) : recordings
  },
  comparisonGroup: (recording: RecordingArchiveItem) =>
    recording.comparisonGroup
      ? recordingsByComparisonGroup.get(recording.comparisonGroup) ?? []
      : [],
}

export const useArchive = () => archive

export const useArchiveCatalog = () => archiveCatalog

export const recordingPlayerTrack = (recording: RecordingArchiveItem) => ({
  id: recording.id,
  title: recording.title,
  subtitle: [recording.keyLabel, recording.tempoLabel, recording.typeLabel]
    .filter(Boolean)
    .join(' · '),
  duration: recording.durationLabel || '—:—',
  durationSeconds: recording.durationSeconds || undefined,
  source: githubRawUrl(recording.resourcePath),
})

export const parsePracticeWindow = (value: string | null | undefined) => {
  if (!value) return null
  const match = value.match(/(?:约\s*)?(\d+):(\d{2}(?:\.\d+)?)\s*[–—-]\s*(\d+):(\d{2}(?:\.\d+)?)/)
  if (!match) return null

  const startSeconds = Number(match[1]) * 60 + Number(match[2])
  const endSeconds = Number(match[3]) * 60 + Number(match[4])
  if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds) || endSeconds <= startSeconds) return null
  return { startSeconds, endSeconds }
}

export const referencePlayerTrack = (
  path: string,
  title: string,
  material?: string | null,
) => {
  const window = parsePracticeWindow(material)
  return {
    id: `reference:${path}`,
    title: `参考原曲 · ${title}`,
    subtitle: window
      ? `循环 ${formatSeconds(window.startSeconds)}–${formatSeconds(window.endSeconds)}`
      : '参考原曲',
    duration: window
      ? `${formatSeconds(window.startSeconds)}–${formatSeconds(window.endSeconds)}`
      : '完整曲目',
    source: githubRawUrl(path),
    ...(window ? { ...window, loop: true } : {}),
  }
}

export const recordingLoopTrack = (
  recording: RecordingArchiveItem,
  startSeconds: number,
  lengthSeconds: number,
) => {
  const duration = recording.durationSeconds || 0
  const start = Math.max(0, Math.min(startSeconds, Math.max(0, duration - 1)))
  const end = duration > 0
    ? Math.min(duration, start + Math.max(1, lengthSeconds))
    : start + Math.max(1, lengthSeconds)
  return {
    ...recordingPlayerTrack(recording),
    startSeconds: start,
    endSeconds: end,
    loop: true,
    subtitle: `${recording.keyLabel || '调性待确认'} · 循环 ${formatSeconds(start)}–${formatSeconds(end)}`,
  }
}

export const formatArchiveDate = (date: string, withYear = false) => {
  const parsed = new Date(`${date}T00:00:00+08:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  }).format(parsed)
}

export const formatSeconds = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.floor(seconds % 60)
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}
