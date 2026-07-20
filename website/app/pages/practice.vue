<script setup lang="ts">
const archive = useArchive()
const activeLog = archive.logs.find(log => log.id === archive.currentFocus.latestLogId) || archive.logs[0]
const activeSong = archive.songs.find(song => song.id === archive.currentFocus.songId) || null
const previousRecording = archive.recordings.find(recording => recording.id === archive.currentFocus.latestRecordingId)
  || archive.recordings.find(recording => recording.songId === activeSong?.id)
  || null
const referencePath = activeLog?.referencePaths[0] || activeSong?.referencePaths[0] || null
const { play } = useAudioPlayer()

type CompletionValue = 'completed' | 'completed_unstable' | 'blocked'

const report = reactive({
  completion: '' as '' | CompletionValue,
  factOne: '',
  factTwo: '',
  issue: '',
  passConfirmed: false,
})
const copyState = ref<'idle' | 'copied' | 'failed'>('idle')
const lastSavedAt = ref<Date | null>(null)
const storageKey = `tim-blues-practice-report:${activeLog?.id || 'current'}`
const reportHasContent = (value: Partial<typeof report>) => Boolean(
  value.completion
  || value.factOne?.trim()
  || value.factTwo?.trim()
  || value.issue?.trim()
  || value.passConfirmed,
)

const completionLabels: Record<CompletionValue, string> = {
  completed: '完成',
  completed_unstable: '完成，尚待稳定',
  blocked: '卡住，需要调整',
}

const materialWindow = computed(() => parsePracticeWindow(activeLog?.task.material))
const windowLabel = computed(() => materialWindow.value
  ? `${formatSeconds(materialWindow.value.startSeconds)}–${formatSeconds(materialWindow.value.endSeconds)}`
  : '完整参考曲目')

const canCopy = computed(() => Boolean(report.completion && report.factOne.trim()))
const reportMarkdown = computed(() => {
  const lines = [
    `完成情况：${report.completion ? completionLabels[report.completion] : '尚未选择'}`,
    `事实 1：${report.factOne.trim() || '待填写'}`,
  ]
  if (report.factTwo.trim()) lines.push(`事实 2：${report.factTwo.trim()}`)
  if (report.issue.trim()) lines.push(`唯一问题：${report.issue.trim()}`)
  lines.push(`过关标准：${report.passConfirmed ? '练完后已按标准确认' : '尚未确认'}`)
  return lines.join('\n')
})

const playReference = () => {
  if (!referencePath) return
  play(referencePlayerTrack(referencePath, activeSong?.title || activeLog?.title || '本次练习', activeLog?.task.material))
}

const playPrevious = () => {
  if (previousRecording) play(recordingPlayerTrack(previousRecording))
}

const copyReport = async () => {
  if (!import.meta.client || !canCopy.value) return
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(reportMarkdown.value)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = reportMarkdown.value
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const copied = document.execCommand('copy')
      textarea.remove()
      if (!copied) throw new Error('copy command failed')
    }
    copyState.value = 'copied'
  } catch {
    copyState.value = 'failed'
  }
  window.setTimeout(() => { copyState.value = 'idle' }, 2000)
}

const clearReport = () => {
  Object.assign(report, {
    completion: '',
    factOne: '',
    factTwo: '',
    issue: '',
    passConfirmed: false,
  })
  lastSavedAt.value = null
  if (import.meta.client) localStorage.removeItem(storageKey)
}

onMounted(() => {
  const saved = localStorage.getItem(storageKey)
  if (!saved) return
  try {
    const parsed = JSON.parse(saved)
    const restoredReport = parsed?.report || parsed
    if (!reportHasContent(restoredReport)) {
      localStorage.removeItem(storageKey)
      return
    }
    if (parsed?.report) {
      Object.assign(report, parsed.report)
      lastSavedAt.value = parsed.savedAt ? new Date(parsed.savedAt) : null
    } else {
      Object.assign(report, parsed)
    }
  } catch {
    localStorage.removeItem(storageKey)
  }
})

watch(report, (value) => {
  if (!import.meta.client) return
  if (!reportHasContent(value)) {
    lastSavedAt.value = null
    localStorage.removeItem(storageKey)
    return
  }
  const savedAt = new Date()
  lastSavedAt.value = savedAt
  localStorage.setItem(storageKey, JSON.stringify({ report: value, savedAt: savedAt.toISOString() }))
}, { deep: true })

useSeoMeta({
  title: '今天的练习 · Tim / Blues',
  description: activeLog?.task.summary || activeLog?.focus || '当前 Blues 吉他练习任务。',
})
</script>

<template>
  <div class="practice-page">
    <header class="practice-page-header">
      <div class="container practice-page-heading">
        <div>
          <p class="eyebrow"><span /> 今天</p>
          <p class="practice-page-song">{{ activeSong?.title || activeLog?.title }}</p>
          <h1>{{ activeLog?.task.summary || activeLog?.task.output || archive.currentFocus.nextStep }}</h1>
        </div>
        <div class="practice-page-meta">
          <span>{{ activeLog?.durationText || '15–30 分钟' }}</span>
          <EvidenceBadge v-if="activeLog" :evidence="activeLog.evidence" />
        </div>
      </div>
    </header>

    <div class="container practice-session">
      <section class="practice-core" aria-labelledby="practice-focus-title">
        <div class="practice-core-copy">
          <p class="mini-label">唯一听感重点</p>
          <h2 id="practice-focus-title">{{ archive.currentFocus.focus || activeLog?.focus }}</h2>
        </div>
        <div class="practice-controls-panel">
          <p class="mini-label">听完就开始</p>
          <div class="practice-quick-actions">
            <button class="button button-primary" type="button" :disabled="!referencePath" @click="playReference">
              <AppIcon name="play" :size="17" />参考段 {{ windowLabel }}
            </button>
            <button class="button button-ghost" type="button" :disabled="!previousRecording" @click="playPrevious">
              <AppIcon name="play" :size="17" />上一版
            </button>
          </div>
          <p class="practice-audio-note">参考段自动循环；上一版用于确认本次只改的一件事。</p>
          <details class="practice-pass-disclosure">
            <summary>查看过关标准<AppIcon name="arrow" :size="15" /></summary>
            <p>{{ activeLog?.task.passCriteria }}</p>
          </details>
        </div>
      </section>

      <details id="practice-details" class="practice-details">
        <summary>查看完整材料、产出和限制<AppIcon name="arrow" :size="16" /></summary>
        <dl class="fact-list">
          <div v-if="activeLog?.task.material"><dt>材料 / 调性 / 速度</dt><dd>{{ activeLog.task.material }}</dd></div>
          <div v-if="activeLog?.task.output"><dt>完整产出</dt><dd>{{ activeLog.task.output }}</dd></div>
          <div v-if="activeLog?.task.constraints"><dt>限制条件</dt><dd>{{ activeLog.task.constraints }}</dd></div>
        </dl>
      </details>

      <section id="finish-practice" class="practice-report" aria-labelledby="practice-report-title">
        <div class="practice-section-title">
          <div>
            <p class="mini-label">结束练习</p>
            <h2 id="practice-report-title">留下 2–3 个事实</h2>
          </div>
          <p>草稿只保存在当前浏览器，不会自动写入正式档案。</p>
        </div>

        <div class="completion-options" aria-label="完成情况">
          <label v-for="(label, value) in completionLabels" :key="value">
            <input v-model="report.completion" type="radio" name="completion" :value="value">
            <span>{{ label }}</span>
          </label>
        </div>

        <div class="practice-report-grid">
          <label><span>事实 1 · 必填</span><textarea v-model="report.factOne" rows="3" placeholder="例如：第二段可以从头到尾完成" /></label>
          <label><span>事实 2 · 可选</span><textarea v-model="report.factTwo" rows="3" placeholder="例如：跨段进入没有停拍" /></label>
          <label class="report-issue"><span>唯一问题</span><textarea v-model="report.issue" rows="3" placeholder="只写下一次最值得处理的一项" /></label>
        </div>

        <label class="practice-pass-check practice-pass-check-final">
          <input v-model="report.passConfirmed" type="checkbox">
          <span>练完后，我已按本次过关标准确认</span>
        </label>

        <div class="practice-report-output">
          <pre>{{ reportMarkdown }}</pre>
          <button class="button button-primary" type="button" :disabled="!canCopy" @click="copyReport">
            {{ copyState === 'copied' ? '已复制' : copyState === 'failed' ? '复制失败，请手动选择' : '复制汇报文本' }}
          </button>
        </div>
        <div class="practice-draft-meta">
          <p>{{ lastSavedAt ? `草稿已保存于 ${lastSavedAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}` : '选择完成状态并填写事实 1 后即可复制。' }}</p>
          <button type="button" @click="clearReport">清除本次草稿</button>
        </div>
      </section>
    </div>
  </div>
</template>
