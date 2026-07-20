import { unique } from './markdown.mjs'

export function evidenceBoundary(text, { fileFact = false } = {}) {
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

export function mergeEvidence(...items) {
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
