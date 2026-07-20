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

export const recordingsShareComparisonGroup = (
  left: RecordingArchiveItem,
  right: RecordingArchiveItem,
) => Boolean(
  left.comparisonGroup
  && right.comparisonGroup
  && left.comparisonGroup === right.comparisonGroup,
)

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
