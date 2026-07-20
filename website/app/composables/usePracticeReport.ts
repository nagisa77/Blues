export type PracticeCompletion = 'completed' | 'completed_unstable' | 'blocked'
export type PracticeCopyState = 'idle' | 'copied' | 'failed'

export interface PracticeReportDraft {
  completion: '' | PracticeCompletion
  factOne: string
  factTwo: string
  issue: string
  passConfirmed: boolean
}

export const PRACTICE_COMPLETION_LABELS: Record<PracticeCompletion, string> = {
  completed: '完成',
  completed_unstable: '完成，尚待稳定',
  blocked: '卡住，需要调整',
}

const emptyReport = (): PracticeReportDraft => ({
  completion: '',
  factOne: '',
  factTwo: '',
  issue: '',
  passConfirmed: false,
})

export const practiceReportHasContent = (value: Partial<PracticeReportDraft>) => Boolean(
  value.completion
  || value.factOne?.trim()
  || value.factTwo?.trim()
  || value.issue?.trim()
  || value.passConfirmed,
)

export const formatPracticeReport = (report: PracticeReportDraft) => {
  const lines = [
    `完成情况：${report.completion ? PRACTICE_COMPLETION_LABELS[report.completion] : '尚未选择'}`,
    `事实 1：${report.factOne.trim() || '待填写'}`,
  ]
  if (report.factTwo.trim()) lines.push(`事实 2：${report.factTwo.trim()}`)
  if (report.issue.trim()) lines.push(`唯一问题：${report.issue.trim()}`)
  lines.push(`过关标准：${report.passConfirmed ? '练完后已按标准确认' : '尚未确认'}`)
  return lines.join('\n')
}

export const usePracticeReport = (practiceId: string) => {
  const report = reactive<PracticeReportDraft>(emptyReport())
  const copyState = ref<PracticeCopyState>('idle')
  const lastSavedAt = ref<Date | null>(null)
  const storageKey = `tim-blues-practice-report:${practiceId}`
  const canCopy = computed(() => Boolean(report.completion && report.factOne.trim()))
  const markdown = computed(() => formatPracticeReport(report))
  let copyResetTimer: number | undefined

  const copy = async () => {
    if (!canCopy.value) return
    copyState.value = await copyText(markdown.value) ? 'copied' : 'failed'
    if (copyResetTimer) window.clearTimeout(copyResetTimer)
    copyResetTimer = window.setTimeout(() => { copyState.value = 'idle' }, 2000)
  }

  const clear = () => {
    Object.assign(report, emptyReport())
    lastSavedAt.value = null
    if (import.meta.client) localStorage.removeItem(storageKey)
  }

  onMounted(() => {
    const saved = localStorage.getItem(storageKey)
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      const restoredReport = parsed?.report || parsed
      if (!practiceReportHasContent(restoredReport)) {
        localStorage.removeItem(storageKey)
        return
      }
      Object.assign(report, restoredReport)
      lastSavedAt.value = parsed?.report && parsed.savedAt
        ? new Date(parsed.savedAt)
        : null
    } catch {
      localStorage.removeItem(storageKey)
    }
  })

  watch(report, (value) => {
    if (!import.meta.client) return
    if (!practiceReportHasContent(value)) {
      lastSavedAt.value = null
      localStorage.removeItem(storageKey)
      return
    }
    const savedAt = new Date()
    lastSavedAt.value = savedAt
    localStorage.setItem(storageKey, JSON.stringify({
      report: value,
      savedAt: savedAt.toISOString(),
    }))
  }, { deep: true })

  onBeforeUnmount(() => {
    if (copyResetTimer) window.clearTimeout(copyResetTimer)
  })

  return {
    report,
    completionLabels: PRACTICE_COMPLETION_LABELS,
    copyState: readonly(copyState),
    lastSavedAt: readonly(lastSavedAt),
    canCopy,
    markdown,
    copy,
    clear,
  }
}
