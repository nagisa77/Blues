export type EvidenceSource =
  | 'file_fact'
  | 'self_report'
  | 'teacher_review'
  | 'unknown'

export type ReviewState = 'reviewed' | 'unreviewed' | 'unknown'

export type TriState = 'yes' | 'no' | 'unknown'

/**
 * Keeps artifact facts separate from judgements about playing quality.
 * A recording can, for example, be a confirmed file while its performance
 * remains a self-report that has not been reviewed.
 */
export interface EvidenceBoundary {
  sources: EvidenceSource[]
  selfReport: TriState
  performanceReview: ReviewState
  unedited: TriState
  containsReferenceAudio: TriState
  notes: string[]
}

export type RecordingType =
  | 'baseline'
  | 'practice_record'
  | 'practice_result'
  | 'exam'
  | 'unknown'

export interface RecordingArchiveItem {
  id: string
  date: string
  title: string
  type: RecordingType
  typeLabel: string
  durationSeconds: number | null
  durationLabel: string | null
  resourcePath: string
  sourcePath: string
  logIds: string[]
  projectPaths: string[]
  songId: string | null
  archiveWeekToken: string | null
  dayToken: string | null
  keyToken: string | null
  keyLabel: string | null
  bpm: number | null
  tempoLabel: string | null
  evidenceSummary: string | null
  nextChange: string | null
  evidence: EvidenceBoundary
}

export type SessionCompletion =
  | 'completed'
  | 'incomplete'
  | 'interrupted'
  | 'cancelled'
  | 'unknown'

export interface PracticeTask {
  material: string | null
  output: string | null
  constraints: string | null
  passCriteria: string | null
}

export interface PracticeResult {
  completion: SessionCompletion
  completionText: string | null
  attempts: string | null
  effectiveEvidence: string | null
  priorityIssue: string | null
}

export interface PracticeNextStep {
  singleChange: string | null
  output: string | null
}

export interface PracticeLogItem {
  id: string
  date: string
  dayToken: string | null
  calendarWeekId: string | null
  title: string
  durationText: string | null
  focus: string | null
  evidenceSourceText: string | null
  bodyStatus: string | null
  task: PracticeTask
  result: PracticeResult
  next: PracticeNextStep
  recordingIds: string[]
  projectPaths: string[]
  referencePaths: string[]
  sourcePath: string
  evidence: EvidenceBoundary
}

export type SongRole =
  | 'focus'
  | 'paused'
  | 'maintenance'
  | 'retired_reference'
  | 'baseline'
  | 'unknown'

export interface SongArchiveItem {
  id: string
  artist: string | null
  title: string
  version: string | null
  role: SongRole
  roleLabel: string
  capabilities: string
  currentCapability: string
  latestRecordingId: string | null
  referencePaths: string[]
  nextStep: string
  sourcePath: string
  evidence: EvidenceBoundary
}

export type ProgramWeekStatus =
  | 'not_started'
  | 'in_progress'
  | 'delivered'
  | 'delivered_needs_review'
  | 'needs_review'
  | 'unknown'

export interface ProgramWeekItem {
  number: number
  deliverable: string
  status: ProgramWeekStatus
  statusLabel: string
  evidenceSummary: string | null
  nextStep: string | null
  calendarLogId: string | null
  calendarWeekToken: string | null
  dateRange: {
    start: string
    end: string
  } | null
  sourcePaths: string[]
  evidence: EvidenceBoundary
}

export interface MetricTargetRange {
  min: number
  max: number
}

export interface ProgressMetricItem {
  id: string
  label: string
  currentFact: string
  target: string
  currentValue: number | null
  targetValue: number | null
  targetMaximum: number | null
  targetRange: MetricTargetRange | null
  unit: string | null
  sourcePath: string
  evidence: EvidenceBoundary
}

export interface ArchiveStats {
  recordingCount: number
  recordingDurationSeconds: number
  recordingDurationLabel: string
  recordingsByType: Record<RecordingType, number>
  sessionLogCount: number
  practiceDateCount: number
  weeklyLogCount: number
  songCount: number
  projectCount: number
  referenceTrackCount: number
  deliveredProgramWeekCount: number
  activeProgramWeek: number | null
  dateRange: {
    start: string | null
    end: string | null
  }
}

export interface CurrentFocus {
  programWeek: number | null
  calendarWeekId: string | null
  songId: string | null
  title: string
  focus: string | null
  currentCapability: string | null
  nextStep: string | null
  latestLogId: string | null
  latestRecordingId: string | null
  evidence: EvidenceBoundary
}

export interface ArchiveData {
  schemaVersion: 1
  sources: {
    recordings: string
    logs: string
    songs: string
    progress: string
  }
  recordings: RecordingArchiveItem[]
  logs: PracticeLogItem[]
  songs: SongArchiveItem[]
  weeks: ProgramWeekItem[]
  metrics: ProgressMetricItem[]
  stats: ArchiveStats
  currentFocus: CurrentFocus
}
