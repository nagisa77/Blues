import type { EvidenceBoundary } from '~/types/archive'

export type EvidenceKind = 'reviewed' | 'self_report' | 'file_fact' | 'unknown'

const EVIDENCE_PRESENTATION = {
  reviewed: {
    label: '已实际回听',
    compactLabel: '已回听',
    tone: 'reviewed',
    mark: '✓',
  },
  self_report: {
    label: '用户自评 · 待回听',
    compactLabel: '用户自评',
    tone: 'self-report',
    mark: '•',
  },
  file_fact: {
    label: '文件事实 · 待回听',
    compactLabel: '文件事实',
    tone: 'neutral',
    mark: '○',
  },
  unknown: {
    label: '证据待确认',
    compactLabel: '待确认',
    tone: 'neutral',
    mark: '○',
  },
} as const

export const evidenceKind = (evidence: EvidenceBoundary): EvidenceKind => {
  if (evidence.performanceReview === 'reviewed') return 'reviewed'
  if (evidence.selfReport === 'yes') return 'self_report'
  if (evidence.sources.includes('file_fact')) return 'file_fact'
  return 'unknown'
}

export const evidencePresentation = (evidence: EvidenceBoundary) =>
  EVIDENCE_PRESENTATION[evidenceKind(evidence)]
