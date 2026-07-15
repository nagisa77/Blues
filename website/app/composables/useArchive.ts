import archiveJson from '~/data/generated/archive.json'
import type { ArchiveData, RecordingArchiveItem } from '~/types/archive'

const archive = archiveJson as ArchiveData

export const useArchive = () => archive

export const recordingPlayerTrack = (recording: RecordingArchiveItem) => ({
  id: recording.id,
  title: recording.title,
  subtitle: [recording.keyLabel, recording.tempoLabel, recording.typeLabel]
    .filter(Boolean)
    .join(' · '),
  duration: recording.durationLabel || '—:—',
  source: githubRawUrl(recording.resourcePath),
})

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
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.floor(seconds % 60)
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}
