<script setup lang="ts">
const archive = useArchive()
const activeLog = archive.logs.find(log => log.id === archive.currentFocus.latestLogId) || archive.logs[0]
const activeSong = archive.songs.find(song => song.id === archive.currentFocus.songId) || null
const previousRecording = archive.recordings.find(recording => recording.id === archive.currentFocus.latestRecordingId)
  || archive.recordings.find(recording => recording.songId === activeSong?.id)
  || null
const referencePath = activeLog?.referencePaths[0] || activeSong?.referencePaths[0] || null
const { play } = useAudioPlayer()

const report = reactive({
  completion: 'completed',
  factOne: '',
  factTwo: '',
  issue: '',
  passConfirmed: false,
})
const copyState = ref<'idle' | 'copied' | 'failed'>('idle')
const storageKey = `tim-blues-practice-report:${activeLog?.id || 'current'}`

const completionLabels: Record<string, string> = {
  completed: '完成',
  completed_unstable: '完成，尚待稳定',
  blocked: '卡住，需要调整',
}

const materialWindow = computed(() => parsePracticeWindow(activeLog?.task.material))
const windowLabel = computed(() => materialWindow.value
  ? `${formatSeconds(materialWindow.value.startSeconds)}–${formatSeconds(materialWindow.value.endSeconds)}`
  : '完整参考曲目')

const reportMarkdown = computed(() => [
  `完成情况：${completionLabels[report.completion]}`,
  `事实 1：${report.factOne.trim() || '待填写'}`,
  `事实 2：${report.factTwo.trim() || '待填写'}`,
  `唯一问题：${report.issue.trim() || '无 / 待填写'}`,
  `过关标准：${report.passConfirmed ? '已按标准确认' : '尚未确认'}`,
].join('\n'))

const playReference = () => {
  if (!referencePath) return
  play(referencePlayerTrack(referencePath, activeSong?.title || activeLog?.title || '本次练习', activeLog?.task.material))
}

const playPrevious = () => {
  if (previousRecording) play(recordingPlayerTrack(previousRecording))
}

const copyReport = async () => {
  if (!import.meta.client) return
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

onMounted(() => {
  const saved = localStorage.getItem(storageKey)
  if (!saved) return
  try {
    Object.assign(report, JSON.parse(saved))
  } catch {
    localStorage.removeItem(storageKey)
  }
})

watch(report, (value) => {
  if (import.meta.client) localStorage.setItem(storageKey, JSON.stringify(value))
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
        <div class="practice-pass">
          <p class="mini-label">这一遍怎样算完成</p>
          <p>{{ activeLog?.task.passCriteria }}</p>
          <label class="practice-pass-check">
            <input v-model="report.passConfirmed" type="checkbox">
            <span>我已按这条标准确认</span>
          </label>
        </div>
      </section>

      <section class="practice-audio" aria-labelledby="practice-audio-title">
        <div class="practice-section-title">
          <div>
            <p class="mini-label">听完就开始</p>
            <h2 id="practice-audio-title">参考与上一版</h2>
          </div>
          <p>两个入口共用底部播放器，切换时立即开始，不增加页面转场。</p>
        </div>
        <div class="practice-audio-grid">
          <article class="practice-audio-card reference-card">
            <span>REFERENCE / 参考原曲</span>
            <h3>{{ activeSong?.artist }} · {{ activeSong?.title || activeLog?.title }}</h3>
            <p>{{ windowLabel }} 自动循环；只听本次需要进入的位置。</p>
            <button class="button button-primary" type="button" :disabled="!referencePath" @click="playReference">
              <AppIcon name="play" :size="17" />播放参考段
            </button>
          </article>
          <article class="practice-audio-card previous-card">
            <span>PREVIOUS TAKE / 上一版</span>
            <h3>{{ previousRecording?.title || '尚无上一版录音' }}</h3>
            <p>{{ previousRecording?.nextChange || '完成本次练习后，再生成可比较的下一版。' }}</p>
            <button class="button button-ghost" type="button" :disabled="!previousRecording" @click="playPrevious">
              <AppIcon name="play" :size="17" />播放上一版
            </button>
          </article>
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
          <p>草稿自动保存在当前浏览器；复制后可直接发给老师或写入日志。</p>
        </div>

        <div class="completion-options" aria-label="完成情况">
          <label v-for="(label, value) in completionLabels" :key="value">
            <input v-model="report.completion" type="radio" name="completion" :value="value">
            <span>{{ label }}</span>
          </label>
        </div>

        <div class="practice-report-grid">
          <label><span>事实 1</span><textarea v-model="report.factOne" rows="3" placeholder="例如：第二段可以从头到尾完成" /></label>
          <label><span>事实 2</span><textarea v-model="report.factTwo" rows="3" placeholder="例如：跨段进入没有停拍" /></label>
          <label class="report-issue"><span>唯一问题</span><textarea v-model="report.issue" rows="3" placeholder="只写下一次最值得处理的一项" /></label>
        </div>

        <div class="practice-report-output">
          <pre>{{ reportMarkdown }}</pre>
          <button class="button button-primary" type="button" @click="copyReport">
            {{ copyState === 'copied' ? '已复制' : copyState === 'failed' ? '复制失败，请手动选择' : '复制汇报文本' }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
