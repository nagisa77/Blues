import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const repositoryRoot = path.resolve(scriptDirectory, '../..')
const execFileAsync = promisify(execFile)
const defaultOutputPath = path.join(
  repositoryRoot,
  'website/app/data/generated/archive.json',
)

const SOURCE_PATHS = {
  recordings: '录音/README.md',
  logs: '日志/*.md',
  songs: '曲目/曲目看板.md',
  progress: '进度/进度看板.md',
}

const KNOWN_SONGS = [
  {
    id: 'key-to-the-highway',
    artist: 'Derek and the Dominos',
    title: 'Key to the Highway',
    matches: [/Key to the Highway/i, /KeyToTheHighway/i],
  },
  {
    id: 'call-it-stormy-monday',
    artist: 'T-Bone Walker',
    title: 'Call It Stormy Monday',
    matches: [/Call It Stormy Monday/i, /CallItStormyMonday/i],
  },
  {
    id: 'he-ni-zai-yi-qi',
    artist: null,
    title: '和你在一起',
    matches: [/和你在一起/],
  },
  {
    id: 'born-under-a-bad-sign',
    artist: 'Albert King',
    title: 'Born Under a Bad Sign',
    matches: [/Born Under a Bad Sign/i, /Born_Under_A_Bad_Sign/i],
  },
  {
    id: 'the-thrill-is-gone',
    artist: 'B.B. King',
    title: 'The Thrill Is Gone',
    matches: [/The Thrill Is Gone/i, /TheThrillIsGone/i],
  },
  {
    id: 'before-you-accuse-me',
    artist: 'Eric Clapton',
    title: 'Before You Accuse Me',
    matches: [/Before You Accuse Me/i, /BeforeYouAccuseMe/i],
  },
  {
    id: 'hide-away',
    artist: 'Freddie King',
    title: 'Hide Away',
    matches: [/Hide Away/i, /HideAway/i],
  },
  {
    id: 'how-blue-can-you-get',
    artist: 'B.B. King',
    title: 'How Blue Can You Get?',
    matches: [/How Blue Can You Get/i, /HowBlueCanYouGet/i],
  },
]

const WEEK_ORDINALS = new Map([
  ['一', 1],
  ['二', 2],
  ['三', 3],
  ['四', 4],
  ['五', 5],
  ['六', 6],
  ['七', 7],
  ['八', 8],
])

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function plainText(value) {
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

function markdownField(markdown, label) {
  const match = markdown.match(
    new RegExp(`^${escapeRegExp(label)}[：:][ \\t]*(.*)$`, 'm'),
  )
  return match?.[1]?.trim() ? plainText(match[1]) : null
}

function markdownSection(markdown, heading) {
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

function bulletField(markdown, label) {
  const match = markdown.match(
    new RegExp(`^-\\s+${escapeRegExp(label)}[：:][ \\t]*(.*)$`, 'm'),
  )
  return match?.[1]?.trim() ? plainText(match[1]) : null
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(cell => cell.trim())
}

function findMarkdownTable(markdown, requiredHeaders) {
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
      headers.forEach((header, cellIndex) => {
        row[header] = cells[cellIndex] ?? ''
      })
      rows.push(row)
    }

    return rows
  }

  return []
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function normalizeRepositoryLink(href, sourcePath) {
  const cleanHref = href.trim().split('#')[0]
  if (!cleanHref || /^(?:https?:|mailto:|data:)/i.test(cleanHref)) return null

  return path.posix.normalize(
    path.posix.join(path.posix.dirname(sourcePath), safeDecode(cleanHref)),
  )
}

function extractRepositoryLinks(markdown, sourcePath) {
  const links = []
  const pattern = /\[[^\]]*\]\(([^)]+)\)/g
  let match

  while ((match = pattern.exec(markdown)) !== null) {
    const normalized = normalizeRepositoryLink(match[1], sourcePath)
    if (normalized) links.push(normalized)
  }

  return unique(links)
}

function pathId(resourcePath) {
  return path.posix.basename(resourcePath, path.posix.extname(resourcePath))
}

function identifySong(value) {
  if (!value) return null
  return KNOWN_SONGS.find(song => song.matches.some(pattern => pattern.test(value))) ?? null
}

function parseDuration(value) {
  if (!value) return null
  const clean = plainText(value)
  const match = clean.match(/^(?:(\d+):)?(\d+)(?:\.(\d+))?$/)
  if (!match) return null

  const minutes = Number(match[1] ?? 0)
  const seconds = Number(match[2])
  const fraction = match[3] ? Number(`0.${match[3]}`) : 0
  return Number((minutes * 60 + seconds + fraction).toFixed(2))
}

function formatDuration(totalSeconds) {
  const rounded = Math.round(totalSeconds)
  const hours = Math.floor(rounded / 3600)
  const minutes = Math.floor((rounded % 3600) / 60)
  const seconds = rounded % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function evidenceBoundary(text, { fileFact = false } = {}) {
  const value = text ?? ''
  const sources = []
  const notes = []
  const hasConfirmedSelfReport = value.split(/\r?\n/).some(line => {
    if (!/用户自评|自评/.test(line)) return false
    return !/待(?:用户)?自评|结果待[^。；\n]*自评|用户自评达标即可|自评或(?:录音)?回听/.test(
      line,
    )
  })

  if (fileFact || /文件事实|文件已归档|已归档一条|时长\s*[`\d]/.test(value)) {
    sources.push('file_fact')
  }
  if (hasConfirmedSelfReport) sources.push('self_report')
  if (/老师实际回听|已实际回听/.test(value)) sources.push('teacher_review')
  if (sources.length === 0) sources.push('unknown')

  const selfReport = hasConfirmedSelfReport ? 'yes' : 'unknown'
  let performanceReview = 'unknown'
  if (/(?:尚未|未|待)(?:实际)?回听|待回听|未收到录音/.test(value)) {
    performanceReview = 'unreviewed'
  } else if (/老师实际回听|已实际回听/.test(value)) {
    performanceReview = 'reviewed'
  }

  let unedited = 'unknown'
  if (/(?:从头到尾)?一次录完[^。\n]*(?:未剪辑|不剪辑)|未经剪辑/.test(value)) {
    unedited = 'yes'
  } else if (/已剪辑|经过剪辑/.test(value)) {
    unedited = 'no'
  }

  const containsReferenceAudio =
    /原曲与用户演奏(?:同时存在|混合)|背景为原曲|原版音轨/.test(value)
      ? 'yes'
      : 'unknown'

  if (fileFact) notes.push('文件存在及索引元数据属于文件事实')
  if (selfReport === 'yes') notes.push('演奏质量描述包含用户自评')
  if (performanceReview === 'unreviewed') notes.push('尚无老师实际回听结论')
  if (unedited === 'unknown' && /一次录完待确认|是否一次录完待确认/.test(value)) {
    notes.push('是否一次录完或剪辑状态待确认')
  }
  if (containsReferenceAudio === 'yes') notes.push('录音包含原曲音轨或以原曲为背景')

  return {
    sources,
    selfReport,
    performanceReview,
    unedited,
    containsReferenceAudio,
    notes,
  }
}

function mergeEvidence(...items) {
  const evidence = items.filter(Boolean)
  const sources = unique(evidence.flatMap(item => item.sources)).filter(
    source => source !== 'unknown',
  )

  return {
    sources: sources.length > 0 ? sources : ['unknown'],
    selfReport: evidence.some(item => item.selfReport === 'yes') ? 'yes' : 'unknown',
    performanceReview: evidence.some(item => item.performanceReview === 'unreviewed')
      ? 'unreviewed'
      : evidence.some(item => item.performanceReview === 'reviewed')
        ? 'reviewed'
        : 'unknown',
    unedited: evidence.some(item => item.unedited === 'yes')
      ? 'yes'
      : evidence.some(item => item.unedited === 'no')
        ? 'no'
        : 'unknown',
    containsReferenceAudio: evidence.some(item => item.containsReferenceAudio === 'yes')
      ? 'yes'
      : evidence.some(item => item.containsReferenceAudio === 'no')
        ? 'no'
        : 'unknown',
    notes: unique(evidence.flatMap(item => item.notes)),
  }
}

function normalizeRecordingType(label) {
  if (label === '基线') return 'baseline'
  if (label === '练习记录') return 'practice_record'
  if (label === '练习成品') return 'practice_result'
  if (label === '考试录音') return 'exam'
  return 'unknown'
}

function recordingFilenameMetadata(resourcePath) {
  const filename = path.posix.basename(resourcePath, '.mp3')
  const prefix = filename.match(/^\d{4}-\d{2}-\d{2}_W([^_]+)_D([^_]+)_/)
  const segments = filename.split('_')
  const finalToken = segments.at(-1) ?? ''
  const hasTempoToken = /^\d+bpm$/i.test(finalToken) || finalToken === '原速'
  const keyToken = hasTempoToken ? segments.at(-2) ?? null : finalToken || null
  const bpmMatch = finalToken.match(/^(\d+)bpm$/i)
  const keyLabels = {
    A: 'A 调',
    E: 'E 调',
    Bm: 'B 小调',
    CSharp: 'C# 调',
    原调: '原调',
  }

  return {
    archiveWeekToken: prefix ? `W${prefix[1]}` : null,
    dayToken: prefix ? `D${prefix[2]}` : null,
    keyToken: Object.hasOwn(keyLabels, keyToken) ? keyToken : null,
    keyLabel: Object.hasOwn(keyLabels, keyToken) ? keyLabels[keyToken] : null,
    bpm: bpmMatch ? Number(bpmMatch[1]) : null,
    tempoLabel: bpmMatch ? `${Number(bpmMatch[1])} BPM` : finalToken === '原速' ? '原速' : null,
  }
}

function comparisonMetadata(song, title) {
  if (!song) {
    return {
      comparisonGroup: null,
      comparisonLabel: null,
      comparisonStartSeconds: null,
    }
  }

  if (
    song.id === 'before-you-accuse-me'
    && /90\s*BPM/i.test(title)
    && /语气修正版|伴奏\s*3\s*chorus.*2\s*chorus\s*solo/i.test(title)
  ) {
    return {
      comparisonGroup: 'before-you-accuse-me:solo-90bpm',
      comparisonLabel: '90 BPM solo',
      comparisonStartSeconds: 0,
    }
  }

  if (
    song.id === 'hide-away'
    && /前\s*1\s*chorus|伴奏\s*3\s*chorus/i.test(title)
  ) {
    return {
      comparisonGroup: 'hide-away:theme-first-chorus',
      comparisonLabel: '主题第一轮',
      comparisonStartSeconds: 0,
    }
  }

  return {
    comparisonGroup: null,
    comparisonLabel: null,
    comparisonStartSeconds: null,
  }
}

function normalizeSessionCompletion(value) {
  if (!value) return 'unknown'
  if (/取消/.test(value)) return 'cancelled'
  if (/未完成/.test(value)) return 'incomplete'
  if (/已完成|已学习|已学会|已归档/.test(value)) return 'completed'
  if (/中断/.test(value) && !/(?:是否)?中断待确认|中断状态待确认/.test(value)) {
    return 'interrupted'
  }
  return 'unknown'
}

function normalizeSongRole(label) {
  if (label === '主攻') return 'focus'
  if (/暂停/.test(label)) return 'paused'
  if (label === '维护') return 'maintenance'
  if (/退役|对照/.test(label)) return 'retired_reference'
  if (/基线/.test(label)) return 'baseline'
  return 'unknown'
}

function normalizeWeekStatus(label) {
  if (/未开始/.test(label)) return 'not_started'
  if (/已交付/.test(label) && /待.*回听|复核/.test(label)) {
    return 'delivered_needs_review'
  }
  if (/已交付/.test(label)) return 'delivered'
  if (/进行中/.test(label)) return 'in_progress'
  if (/需要.*复核|待.*复核/.test(label)) return 'needs_review'
  return 'unknown'
}

function songVersion(text, song) {
  if (!song) return null
  const marker = `《${song.title}》`
  const markerIndex = text.indexOf(marker)
  if (markerIndex < 0) return null

  const remainder = text.slice(markerIndex + marker.length).split('；')[0].trim()
  return remainder || null
}

function weeklyLogContext(filename, markdown) {
  const id = filename.replace(/\.md$/, '')
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1] ?? id
  const ordinal = heading.match(/第([一二三四五六七八])周/)
  const dateText = markdownField(markdown, '日期')
  const dateRange = dateText?.match(/(\d{4}-\d{2}-\d{2})\s*至\s*(\d{4}-\d{2}-\d{2})/)

  return {
    id,
    sourcePath: `日志/${filename}`,
    programWeek: ordinal ? WEEK_ORDINALS.get(ordinal[1]) ?? null : null,
    dateRange: dateRange ? { start: dateRange[1], end: dateRange[2] } : null,
  }
}

function calendarWeekForDate(date, weeklyContexts) {
  return (
    weeklyContexts.find(
      context =>
        context.dateRange && date >= context.dateRange.start && date <= context.dateRange.end,
    )?.id ?? null
  )
}

function parsePracticeLog(filename, markdown, weeklyContexts) {
  const id = filename.replace(/\.md$/, '')
  const filenameMatch = id.match(/^(\d{4}-\d{2}-\d{2})_(D.+)$/)
  const date = markdownField(markdown, '日期') ?? filenameMatch?.[1] ?? ''
  const taskSection =
    markdownSection(markdown, '今日任务') || markdownSection(markdown, '开练')
  const resultSection = markdownSection(markdown, '结果')
  const nextSection = markdownSection(markdown, '下一次')
  const focus =
    markdownField(markdown, '唯一重点') ??
    markdownField(markdown, '本周 / 本次唯一重点')
  const material =
    markdownField(taskSection, '材料 / 调性 / 速度') ??
    bulletField(taskSection, '时间 / 速度 / 调性')
  const completionText = bulletField(resultSection, '是否完成 / 是否中断')
  const sourcePath = `日志/${filename}`
  const links = extractRepositoryLinks(markdown, sourcePath)
  const song = identifySong(`${focus ?? ''} ${material ?? ''}`)
  const evidenceSourceText = markdownField(markdown, '证据来源')
  const explicitEvidenceLines = markdown
    .split(/\r?\n/)
    .filter(line =>
      /用户自评|老师实际回听|已实际回听|尚未.*回听|未收到录音|文件事实|原曲与用户演奏|背景为原曲|原版音轨/.test(
        line,
      ),
    )
    .join('\n')
  const recordingEvidenceSection =
    markdownSection(markdown, '录音') || markdownSection(markdown, '今日录音')

  return {
    id,
    date,
    dayToken: filenameMatch?.[2] ?? null,
    calendarWeekId: calendarWeekForDate(date, weeklyContexts),
    title: song?.title ?? focus ?? `练习记录 ${date}`,
    durationText:
      markdownField(markdown, '本次时长') ?? markdownField(markdown, '总时长'),
    focus,
    evidenceSourceText,
    bodyStatus: markdownField(markdown, '身体状态'),
    task: {
      summary:
        markdownField(taskSection, '任务摘要') ?? bulletField(taskSection, '任务摘要'),
      material,
      output: markdownField(taskSection, '产出') ?? bulletField(taskSection, '产出'),
      constraints:
        markdownField(taskSection, '限制条件') ?? bulletField(taskSection, '只听 / 只盯'),
      passCriteria:
        markdownField(taskSection, '过关标准') ??
        bulletField(taskSection, '本步完成标准'),
    },
    result: {
      completion: normalizeSessionCompletion(completionText),
      completionText,
      attempts: bulletField(resultSection, '尝试或重录次数'),
      effectiveEvidence: bulletField(resultSection, '一项有效证据'),
      priorityIssue: bulletField(resultSection, '一项最影响听感的问题'),
    },
    next: {
      singleChange: markdownField(nextSection, '只改什么'),
      output: markdownField(nextSection, '下一条音乐产出'),
    },
    recordingIds: links.filter(link => link.startsWith('录音/') && link.endsWith('.mp3')).map(pathId),
    projectPaths: links.filter(link => link.startsWith('工程/') && link.endsWith('.band')),
    referencePaths: links.filter(
      link => link.startsWith('曲目/参考素材/') && link.endsWith('.mp3'),
    ),
    sourcePath,
    evidence: evidenceBoundary(
      `${evidenceSourceText ?? ''}\n${resultSection}\n${recordingEvidenceSection}\n${explicitEvidenceLines}`,
    ),
  }
}

function parseProgressRecordingRows(markdown) {
  const rows = findMarkdownTable(markdown, [
    '日期',
    '内容',
    '文件或链接',
    '证据类型',
    '下一遍只改什么',
  ])
  const byPath = new Map()

  for (const row of rows) {
    const links = extractRepositoryLinks(row['文件或链接'], SOURCE_PATHS.progress)
    const recordingPath = links.find(link => link.startsWith('录音/') && link.endsWith('.mp3'))
    if (!recordingPath) continue

    byPath.set(recordingPath, {
      evidenceSummary: plainText(row['证据类型']) || null,
      nextChange: plainText(row['下一遍只改什么']) || null,
      projectPaths: links.filter(link => link.startsWith('工程/') && link.endsWith('.band')),
    })
  }

  return byPath
}

function parseRecordings(markdown, progressMarkdown) {
  const progressRows = parseProgressRecordingRows(progressMarkdown)
  const rows = findMarkdownTable(markdown, ['日期', '内容', '类型', '时长', '文件', '事实记录'])

  return rows
    .map(row => {
      const fileLinks = extractRepositoryLinks(row['文件'], SOURCE_PATHS.recordings)
      const resourcePath = fileLinks.find(link => link.startsWith('录音/') && link.endsWith('.mp3'))
      if (!resourcePath) return null

      const factLinks = extractRepositoryLinks(row['事实记录'], SOURCE_PATHS.recordings)
      const progress = progressRows.get(resourcePath)
      const title = plainText(row['内容'])
      const typeLabel = plainText(row['类型']) || '未知'
      const durationLabel = plainText(row['时长']) || null
      const song = identifySong(`${title} ${resourcePath}`)
      const evidenceText = `${progress?.evidenceSummary ?? ''}\n${progress?.nextChange ?? ''}`

      return {
        id: pathId(resourcePath),
        date: plainText(row['日期']),
        title,
        type: normalizeRecordingType(typeLabel),
        typeLabel,
        durationSeconds: parseDuration(durationLabel),
        durationLabel,
        resourcePath,
        sourcePath: SOURCE_PATHS.recordings,
        logIds: factLinks.filter(link => link.startsWith('日志/') && link.endsWith('.md')).map(pathId),
        projectPaths: progress?.projectPaths ?? [],
        songId: song?.id ?? null,
        ...recordingFilenameMetadata(resourcePath),
        evidenceSummary: progress?.evidenceSummary ?? null,
        nextChange: progress?.nextChange ?? null,
        ...comparisonMetadata(song, title),
        waveform: null,
        evidence: evidenceBoundary(evidenceText, { fileFact: true }),
      }
    })
    .filter(Boolean)
    .sort((left, right) => right.date.localeCompare(left.date) || right.id.localeCompare(left.id))
}

async function extractWaveform(resourcePath, barCount = 48) {
  const absolutePath = path.join(repositoryRoot, resourcePath)

  try {
    const { stdout } = await execFileAsync(
      'ffmpeg',
      [
        '-v', 'error',
        '-i', absolutePath,
        '-ac', '1',
        '-ar', '400',
        '-f', 's16le',
        'pipe:1',
      ],
      { encoding: 'buffer', maxBuffer: 24 * 1024 * 1024 },
    )

    const samples = new Int16Array(
      stdout.buffer,
      stdout.byteOffset,
      Math.floor(stdout.byteLength / Int16Array.BYTES_PER_ELEMENT),
    )
    if (samples.length === 0) return null

    const peaks = Array.from({ length: barCount }, (_, index) => {
      const start = Math.floor((index / barCount) * samples.length)
      const end = Math.max(start + 1, Math.floor(((index + 1) / barCount) * samples.length))
      let peak = 0
      for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
        peak = Math.max(peak, Math.abs(samples[sampleIndex]))
      }
      return peak
    })
    const maximum = Math.max(...peaks, 1)

    return peaks.map(peak => Math.round(18 + Math.sqrt(peak / maximum) * 82))
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    process.stderr.write(`Waveform unavailable for ${resourcePath}: ${reason}\n`)
    return null
  }
}

function parseSongs(markdown, recordingsByPath) {
  const rows = findMarkdownTable(markdown, [
    '角色',
    '曲名与具体版本',
    '核心能力',
    '当前可连续完成到哪里',
    '最近录音',
    '下一步',
  ])

  return rows.map(row => {
    const titleText = plainText(row['曲名与具体版本'])
    const knownSong = identifySong(titleText)
    const latestLinks = extractRepositoryLinks(row['最近录音'], SOURCE_PATHS.songs)
    const latestPath = latestLinks.find(link => link.startsWith('录音/') && link.endsWith('.mp3'))
    const currentCapability = plainText(row['当前可连续完成到哪里'])
    const roleLabel = plainText(row['角色'])
    const evidenceText = `${currentCapability}\n${plainText(row['下一步'])}`

    return {
      id: knownSong?.id ?? `song-${roleLabel}`,
      artist: knownSong?.artist ?? null,
      title: knownSong?.title ?? titleText,
      version: songVersion(titleText, knownSong),
      role: normalizeSongRole(roleLabel),
      roleLabel,
      capabilities: plainText(row['核心能力']),
      currentCapability,
      latestRecordingId: latestPath
        ? recordingsByPath.get(latestPath)?.id ?? pathId(latestPath)
        : null,
      referencePaths: extractRepositoryLinks(row['曲名与具体版本'], SOURCE_PATHS.songs).filter(
        link => link.startsWith('曲目/参考素材/'),
      ),
      nextStep: plainText(row['下一步']),
      sourcePath: SOURCE_PATHS.songs,
      evidence: evidenceBoundary(evidenceText),
    }
  })
}

function parseProgramWeeks(markdown, weeklyContexts) {
  const rows = findMarkdownTable(markdown, ['周', '核心交付', '状态', '最重要证据', '下一步'])

  return rows.map(row => {
    const number = Number(plainText(row['周']))
    const statusLabel = plainText(row['状态'])
    const evidenceSummary = plainText(row['最重要证据']) || null
    const nextStep = plainText(row['下一步']) || null
    const calendarLog = weeklyContexts.find(context => context.programWeek === number) ?? null

    return {
      number,
      deliverable: plainText(row['核心交付']),
      status: normalizeWeekStatus(statusLabel),
      statusLabel,
      evidenceSummary,
      nextStep,
      calendarLogId: calendarLog?.id ?? null,
      calendarWeekToken: calendarLog?.id ?? null,
      dateRange: calendarLog?.dateRange ?? null,
      sourcePaths: unique([SOURCE_PATHS.progress, calendarLog?.sourcePath]),
      evidence: evidenceBoundary(`${evidenceSummary ?? ''}\n${nextStep ?? ''}`),
    }
  })
}

function metricValues(label) {
  const known = {
    '不丢位置的连续 chorus': {
      currentValue: 5,
      targetValue: 8,
      targetMaximum: null,
      targetRange: null,
      unit: 'chorus',
    },
    全音推弦命中: {
      currentValue: null,
      targetValue: 9,
      targetMaximum: 10,
      targetRange: null,
      unit: '次',
    },
    可用于新语境的句子: {
      currentValue: 3,
      targetValue: 8,
      targetMaximum: null,
      targetRange: null,
      unit: '句',
    },
    '完整扒谱 chorus': {
      currentValue: 2,
      targetValue: 2,
      targetMaximum: null,
      targetRange: null,
      unit: 'chorus',
    },
    '可演出的 Blues 曲目': {
      currentValue: 0,
      targetValue: 3,
      targetMaximum: null,
      targetRange: null,
      unit: '首',
    },
    可随机开始的调性: {
      currentValue: 1,
      targetValue: 3,
      targetMaximum: null,
      targetRange: null,
      unit: '个调性',
    },
    不剪辑连续演奏: {
      currentValue: null,
      targetValue: null,
      targetMaximum: null,
      targetRange: { min: 20, max: 25 },
      unit: '分钟',
    },
  }

  return (
    known[label] ?? {
      currentValue: null,
      targetValue: null,
      targetMaximum: null,
      targetRange: null,
      unit: null,
    }
  )
}

function metricId(label) {
  const known = {
    '不丢位置的连续 chorus': 'continuous-choruses',
    全音推弦命中: 'whole-tone-bends',
    可用于新语境的句子: 'usable-phrases',
    '完整扒谱 chorus': 'transcribed-choruses',
    '可演出的 Blues 曲目': 'performance-ready-songs',
    可随机开始的调性: 'random-start-keys',
    不剪辑连续演奏: 'unedited-performance',
  }
  return known[label] ?? `metric-${label}`
}

function parseMetrics(markdown) {
  const rows = findMarkdownTable(markdown, ['指标', '当前事实', '8 周目标'])

  return rows.map(row => {
    const label = plainText(row['指标'])
    const currentFact = plainText(row['当前事实'])
    const target = plainText(row['8 周目标'])

    return {
      id: metricId(label),
      label,
      currentFact,
      target,
      ...metricValues(label),
      sourcePath: SOURCE_PATHS.progress,
      evidence: evidenceBoundary(currentFact),
    }
  })
}

async function readRepositoryFile(sourcePath) {
  return readFile(path.join(repositoryRoot, sourcePath), 'utf8')
}

function outputPathFromArguments() {
  const outputFlag = process.argv.indexOf('--output')
  if (outputFlag === -1) return defaultOutputPath
  if (!process.argv[outputFlag + 1]) throw new Error('--output requires a file path')
  return path.resolve(process.cwd(), process.argv[outputFlag + 1])
}

async function main() {
  const [recordingsMarkdown, songsMarkdown, progressMarkdown, logEntries] = await Promise.all([
    readRepositoryFile(SOURCE_PATHS.recordings),
    readRepositoryFile(SOURCE_PATHS.songs),
    readRepositoryFile(SOURCE_PATHS.progress),
    readdir(path.join(repositoryRoot, '日志'), { withFileTypes: true }),
  ])

  const weeklyFilenames = logEntries
    .filter(entry => entry.isFile() && /^\d{4}-W\d{2}\.md$/.test(entry.name))
    .map(entry => entry.name)
    .sort()
  const dailyFilenames = logEntries
    .filter(entry => entry.isFile() && /^\d{4}-\d{2}-\d{2}_D.+\.md$/.test(entry.name))
    .map(entry => entry.name)
    .sort()

  const weeklyDocuments = await Promise.all(
    weeklyFilenames.map(async filename => ({
      filename,
      markdown: await readRepositoryFile(`日志/${filename}`),
    })),
  )
  const weeklyContexts = weeklyDocuments.map(document =>
    weeklyLogContext(document.filename, document.markdown),
  )

  const dailyDocuments = await Promise.all(
    dailyFilenames.map(async filename => ({
      filename,
      markdown: await readRepositoryFile(`日志/${filename}`),
    })),
  )
  const logs = dailyDocuments
    .map(document => parsePracticeLog(document.filename, document.markdown, weeklyContexts))
    .sort((left, right) => right.date.localeCompare(left.date) || right.id.localeCompare(left.id))

  const recordings = parseRecordings(recordingsMarkdown, progressMarkdown)
  await Promise.all(
    recordings.map(async recording => {
      recording.waveform = await extractWaveform(recording.resourcePath)
    }),
  )
  const recordingsByPath = new Map(recordings.map(recording => [recording.resourcePath, recording]))
  const songs = parseSongs(songsMarkdown, recordingsByPath)
  const weeks = parseProgramWeeks(progressMarkdown, weeklyContexts)
  const metrics = parseMetrics(progressMarkdown)
  const activeProgramWeek = Math.max(
    0,
    ...weeks.filter(week => week.status === 'in_progress').map(week => week.number),
  )
  const latestLog = logs[0] ?? null
  const focusSong = songs.find(song => song.role === 'focus') ?? null
  const latestRecording =
    recordings.find(recording => latestLog?.recordingIds.includes(recording.id)) ??
    recordings.find(recording => recording.songId === focusSong?.id) ??
    null

  const allMarkdownSources = [
    { markdown: recordingsMarkdown, sourcePath: SOURCE_PATHS.recordings },
    { markdown: songsMarkdown, sourcePath: SOURCE_PATHS.songs },
    { markdown: progressMarkdown, sourcePath: SOURCE_PATHS.progress },
    ...weeklyDocuments.map(document => ({
      markdown: document.markdown,
      sourcePath: `日志/${document.filename}`,
    })),
    ...dailyDocuments.map(document => ({
      markdown: document.markdown,
      sourcePath: `日志/${document.filename}`,
    })),
  ]
  const allRepositoryLinks = unique(
    allMarkdownSources.flatMap(source =>
      extractRepositoryLinks(source.markdown, source.sourcePath),
    ),
  )

  const dates = logs.map(log => log.date).filter(Boolean).sort()
  const recordingsByType = {
    baseline: 0,
    practice_record: 0,
    practice_result: 0,
    exam: 0,
    unknown: 0,
  }
  for (const recording of recordings) recordingsByType[recording.type] += 1

  const recordingDurationSeconds = Number(
    recordings
      .reduce((total, recording) => total + (recording.durationSeconds ?? 0), 0)
      .toFixed(2),
  )

  const archive = {
    schemaVersion: 2,
    sources: SOURCE_PATHS,
    recordings,
    logs,
    songs,
    weeks,
    metrics,
    stats: {
      recordingCount: recordings.length,
      recordingDurationSeconds,
      recordingDurationLabel: formatDuration(recordingDurationSeconds),
      recordingsByType,
      sessionLogCount: logs.length,
      practiceDateCount: new Set(logs.map(log => log.date)).size,
      weeklyLogCount: weeklyContexts.length,
      songCount: songs.length,
      projectCount: allRepositoryLinks.filter(link => link.startsWith('工程/') && link.endsWith('.band')).length,
      referenceTrackCount: allRepositoryLinks.filter(
        link => link.startsWith('曲目/参考素材/') && link.endsWith('.mp3'),
      ).length,
      deliveredProgramWeekCount: weeks.filter(week =>
        ['delivered', 'delivered_needs_review'].includes(week.status),
      ).length,
      activeProgramWeek: activeProgramWeek || null,
      dateRange: {
        start: dates.at(0) ?? null,
        end: dates.at(-1) ?? null,
      },
    },
    currentFocus: {
      programWeek: activeProgramWeek || null,
      calendarWeekId: latestLog?.calendarWeekId ?? null,
      songId: focusSong?.id ?? null,
      title: focusSong
        ? `${focusSong.artist ? `${focusSong.artist} · ` : ''}${focusSong.title}`
        : latestLog?.title ?? '当前练习',
      focus: latestLog?.focus ?? null,
      currentCapability: focusSong?.currentCapability ?? null,
      nextStep: latestLog?.next.output ?? focusSong?.nextStep ?? null,
      latestLogId: latestLog?.id ?? null,
      latestRecordingId: latestRecording?.id ?? null,
      evidence: mergeEvidence(latestLog?.evidence, focusSong?.evidence, latestRecording?.evidence),
    },
  }

  const outputPath = outputPathFromArguments()
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(archive, null, 2)}\n`, 'utf8')
  process.stdout.write(
    `Generated ${path.relative(repositoryRoot, outputPath)} (${recordings.length} recordings, ${logs.length} logs).\n`,
  )
}

await main()
