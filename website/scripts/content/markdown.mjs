import path from 'node:path'
import { KNOWN_SONGS } from './config.mjs'

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const unique = values => [...new Set(values.filter(Boolean))]

export function plainText(value) {
  if (!value) return ''
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function markdownField(markdown, label) {
  const match = markdown.match(
    new RegExp(`^${escapeRegExp(label)}[：:][ \\t]*(.*)$`, 'm'),
  )
  return match?.[1]?.trim() ? plainText(match[1]) : null
}

export function markdownSection(markdown, heading) {
  const lines = markdown.split(/\r?\n/)
  const start = lines.findIndex(line => line.trim() === `## ${heading}`)
  if (start < 0) return ''

  const sectionLines = []
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index])) break
    sectionLines.push(lines[index])
  }
  return sectionLines.join('\n').trim()
}

export function bulletField(markdown, label) {
  const match = markdown.match(
    new RegExp(`^-\\s+${escapeRegExp(label)}[：:][ \\t]*(.*)$`, 'm'),
  )
  return match?.[1]?.trim() ? plainText(match[1]) : null
}

const splitTableRow = line => line
  .trim()
  .replace(/^\|/, '')
  .replace(/\|$/, '')
  .split('|')
  .map(cell => cell.trim())

export function findMarkdownTable(markdown, requiredHeaders) {
  const lines = markdown.split(/\r?\n/)

  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!lines[index].trim().startsWith('|')) continue

    const headers = splitTableRow(lines[index]).map(plainText)
    if (!requiredHeaders.every(header => headers.includes(header))) continue

    const separator = splitTableRow(lines[index + 1])
    if (!separator.every(cell => /^:?-{3,}:?$/.test(cell))) continue

    const rows = []
    for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex += 1) {
      const line = lines[rowIndex]
      if (!line.trim().startsWith('|')) break

      const cells = splitTableRow(line)
      const row = {}
      headers.forEach((header, cellIndex) => { row[header] = cells[cellIndex] ?? '' })
      rows.push(row)
    }
    return rows
  }

  return []
}

const safeDecode = (value) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function normalizeRepositoryLink(href, sourcePath) {
  const cleanHref = href.trim().split('#')[0]
  if (!cleanHref || /^(?:https?:|mailto:|data:)/i.test(cleanHref)) return null
  return path.posix.normalize(
    path.posix.join(path.posix.dirname(sourcePath), safeDecode(cleanHref)),
  )
}

export function extractRepositoryLinks(markdown, sourcePath) {
  const links = []
  const pattern = /\[[^\]]*\]\(([^)]+)\)/g
  let match

  while ((match = pattern.exec(markdown)) !== null) {
    const normalized = normalizeRepositoryLink(match[1], sourcePath)
    if (normalized) links.push(normalized)
  }
  return unique(links)
}

export const pathId = resourcePath =>
  path.posix.basename(resourcePath, path.posix.extname(resourcePath))

export const identifySong = (value) => value
  ? KNOWN_SONGS.find(song => song.matches.some(pattern => pattern.test(value))) ?? null
  : null

export function parseDuration(value) {
  if (!value) return null
  const match = plainText(value).match(/^(?:(\d+):)?(\d+)(?:\.(\d+))?$/)
  if (!match) return null

  const minutes = Number(match[1] ?? 0)
  const seconds = Number(match[2])
  const fraction = match[3] ? Number(`0.${match[3]}`) : 0
  return Number((minutes * 60 + seconds + fraction).toFixed(2))
}

export function formatDuration(totalSeconds) {
  const rounded = Math.round(totalSeconds)
  const hours = Math.floor(rounded / 3600)
  const minutes = Math.floor((rounded % 3600) / 60)
  const seconds = rounded % 60
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`
}
