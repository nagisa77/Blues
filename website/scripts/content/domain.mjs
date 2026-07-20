import path from 'node:path'

export function normalizeRecordingType(label) {
  if (label === '基线') return 'baseline'
  if (label === '练习记录') return 'practice_record'
  if (label === '练习成品') return 'practice_result'
  if (label === '考试录音') return 'exam'
  return 'unknown'
}

export function recordingFilenameMetadata(resourcePath) {
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

export function comparisonMetadata(song, title) {
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

export function normalizeSessionCompletion(value) {
  if (!value) return 'unknown'
  if (/取消/.test(value)) return 'cancelled'
  if (/未完成/.test(value)) return 'incomplete'
  if (/已完成|已学习|已学会|已归档/.test(value)) return 'completed'
  if (/中断/.test(value) && !/(?:是否)?中断待确认|中断状态待确认/.test(value)) {
    return 'interrupted'
  }
  return 'unknown'
}

export function normalizeSongRole(label) {
  if (label === '主攻') return 'focus'
  if (/暂停/.test(label)) return 'paused'
  if (label === '维护') return 'maintenance'
  if (/退役|对照/.test(label)) return 'retired_reference'
  if (/基线/.test(label)) return 'baseline'
  return 'unknown'
}

export function normalizeWeekStatus(label) {
  if (/未开始/.test(label)) return 'not_started'
  if (/已交付/.test(label) && /待.*回听|复核/.test(label)) {
    return 'delivered_needs_review'
  }
  if (/已交付/.test(label)) return 'delivered'
  if (/进行中/.test(label)) return 'in_progress'
  if (/需要.*复核|待.*复核/.test(label)) return 'needs_review'
  return 'unknown'
}

export function songVersion(text, song) {
  if (!song) return null
  const marker = `《${song.title}》`
  const markerIndex = text.indexOf(marker)
  if (markerIndex < 0) return null
  const remainder = text.slice(markerIndex + marker.length).split('；')[0].trim()
  return remainder || null
}

const METRIC_VALUES = {
  '不丢位置的连续 chorus': [5, 8, null, null, 'chorus'],
  全音推弦命中: [null, 9, 10, null, '次'],
  可用于新语境的句子: [3, 8, null, null, '句'],
  '完整扒谱 chorus': [2, 2, null, null, 'chorus'],
  '可演出的 Blues 曲目': [0, 3, null, null, '首'],
  可随机开始的调性: [1, 3, null, null, '个调性'],
  不剪辑连续演奏: [null, null, null, { min: 20, max: 25 }, '分钟'],
}

const METRIC_IDS = {
  '不丢位置的连续 chorus': 'continuous-choruses',
  全音推弦命中: 'whole-tone-bends',
  可用于新语境的句子: 'usable-phrases',
  '完整扒谱 chorus': 'transcribed-choruses',
  '可演出的 Blues 曲目': 'performance-ready-songs',
  可随机开始的调性: 'random-start-keys',
  不剪辑连续演奏: 'unedited-performance',
}

export function metricValues(label) {
  const [currentValue, targetValue, targetMaximum, targetRange, unit] =
    METRIC_VALUES[label] ?? [null, null, null, null, null]
  return { currentValue, targetValue, targetMaximum, targetRange, unit }
}

export const metricId = label => METRIC_IDS[label] ?? `metric-${label}`
