import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { SOURCE_PATHS, WEEK_ORDINALS } from './content/config.mjs'
import {
  comparisonMetadata,
  metricId,
  metricValues,
  normalizeRecordingType,
  normalizeSessionCompletion,
  normalizeSongRole,
  normalizeWeekStatus,
  recordingFilenameMetadata,
  songVersion,
} from './content/domain.mjs'
import { evidenceBoundary, mergeEvidence } from './content/evidence.mjs'
import {
  bulletField,
  extractRepositoryLinks,
  findMarkdownTable,
  formatDuration,
  identifySong,
  markdownField,
  markdownSection,
  parseDuration,
  pathId,
  plainText,
  unique,
} from './content/markdown.mjs'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const repositoryRoot = path.resolve(scriptDirectory, '../..')
const execFileAsync = promisify(execFile)
const defaultOutputPath = path.join(
  repositoryRoot,
  'website/app/data/generated/archive.json',
)

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
