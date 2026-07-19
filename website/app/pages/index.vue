<script setup lang="ts">
const archive = useArchive()
const activeSong = archive.songs.find(song => song.role === 'focus')
const latestLog = archive.logs[0]
const nextTaskLog = archive.logs.find(log => log.id === archive.currentFocus.latestLogId)
  || latestLog
const latestRecording = archive.recordings.find(recording => recording.id === archive.currentFocus.latestRecordingId)
  || archive.recordings[0]
const previousVersion = archive.recordings.find(recording =>
  recording.songId
  && recording.songId === latestRecording?.songId
  && recording.id !== latestRecording.id,
)
const activeWeek = archive.stats.activeProgramWeek
const activeWeekItem = archive.weeks.find(week => week.number === activeWeek)
const taskSummary = nextTaskLog?.task.summary
  || archive.currentFocus.nextStep
  || nextTaskLog?.task.output
  || '由下一条声音证据决定训练内容'

const firstClause = (value: string | null | undefined, fallback: string) => {
  if (!value) return fallback
  const clause = value.split(/[；。]/)[0]?.trim() || value
  return clause.length > 76 ? `${clause.slice(0, 76)}…` : clause
}

const shortPassCriteria = firstClause(nextTaskLog?.task.passCriteria, '完成一次明确、可复现的音乐结果')
const capabilitySummary = computed(() => ({
  canDo: firstClause(archive.currentFocus.currentCapability, '等待下一条完成事实'),
  stability: /挺难|尚待稳定|不稳/.test(archive.currentFocus.currentCapability || '')
    ? '完成，尚待稳定'
    : '以最近一次完成事实为准',
}))
const evidenceBoundaryText = computed(() => {
  if (archive.currentFocus.evidence.performanceReview === 'reviewed') return '已实际回听，可用于演奏判断'
  if (archive.currentFocus.evidence.selfReport === 'yes') return '来自用户自评；尚不评价音准、groove 与发音'
  return '目前只有档案事实，等待演奏证据'
})

const comparisonTarget = computed(() => {
  if (!latestRecording?.songId) return '/recordings'
  const query: Record<string, string> = { song: latestRecording.songId }
  if (previousVersion) query.compare = `${latestRecording.id},${previousVersion.id}`
  return { path: '/recordings', query }
})

const { play } = useAudioPlayer()
const playLatest = () => {
  if (latestRecording) play(recordingPlayerTrack(latestRecording))
}

useSeoMeta({
  title: 'Tim 的 Blues 练习记录',
  ogTitle: 'Tim / Blues Practice Archive',
  description: '下一次训练、最近声音证据和个人 Blues 吉他练习档案。',
})
</script>

<template>
  <div>
    <section class="home-practice-section">
      <div class="container practice-section-head">
        <p class="eyebrow"><span /> 下一次训练</p>
        <div class="practice-meta">
          <span>{{ activeSong?.title || archive.currentFocus.title }}</span>
          <strong>{{ nextTaskLog?.durationText || '15–30 分钟' }}</strong>
        </div>
      </div>

      <div class="container practice-workbench">
        <article class="practice-brief">
          <p class="mini-label">今天只完成这一件事</p>
          <h1>{{ taskSummary }}</h1>
          <div class="practice-actions">
            <NuxtLink class="button button-primary" to="/practice">
              开始本次练习<AppIcon name="arrow" :size="17" />
            </NuxtLink>
            <button v-if="latestRecording" class="button button-ghost" type="button" @click="playLatest">
              <AppIcon name="play" :size="17" />听上次录音
            </button>
          </div>
          <dl class="practice-facts">
            <div>
              <dt>只盯</dt>
              <dd>{{ archive.currentFocus.focus || nextTaskLog?.focus }}</dd>
            </div>
            <div v-if="nextTaskLog?.task.passCriteria">
              <dt>过关</dt>
              <dd>{{ shortPassCriteria }}</dd>
            </div>
          </dl>
          <NuxtLink class="practice-detail-link" to="/practice#practice-details">查看完整材料、限制与参考段<AppIcon name="arrow" :size="15" /></NuxtLink>
        </article>

        <aside class="practice-capability">
          <p class="mini-label">当前能力</p>
          <dl class="capability-summary">
            <div><dt>能做到</dt><dd>{{ capabilitySummary.canDo }}</dd></div>
            <div><dt>稳定性</dt><dd>{{ capabilitySummary.stability }}</dd></div>
            <div><dt>证据边界</dt><dd>{{ evidenceBoundaryText }}</dd></div>
          </dl>
          <div class="capability-evidence">
            <span>当前能力依据</span>
            <EvidenceBadge :evidence="archive.currentFocus.evidence" />
          </div>
        </aside>
      </div>
    </section>

    <section class="section latest-evidence-section compact-section">
      <div class="container section-heading-inline compact-heading">
        <div>
          <p class="section-kicker">最近声音证据</p>
          <h2 class="section-title">上一次做到哪里。</h2>
        </div>
        <NuxtLink :to="comparisonTarget" class="text-link">
          {{ previousVersion ? '直接打开 A/B 对比' : '打开该曲录音' }}<AppIcon name="arrow" :size="17" />
        </NuxtLink>
      </div>
      <div class="container evidence-focus-grid home-evidence-grid">
        <RecordingCard v-if="latestRecording" :recording="latestRecording" featured />
        <article class="evidence-insight-card">
          <div>
            <p class="mini-label">训练决策</p>
            <h3>{{ latestRecording?.nextChange || archive.currentFocus.nextStep || '由下一条声音证据决定训练内容' }}</h3>
          </div>
          <div>
            <p class="mini-label">证据边界</p>
            <p>{{ evidenceBoundaryText }}</p>
          </div>
        </article>
      </div>
    </section>

    <section class="section home-routes-section compact-section">
      <div class="container compact-heading">
        <p class="section-kicker">练习档案</p>
        <h2 class="section-title">需要时，再进入细节。</h2>
      </div>
      <div class="container home-route-grid">
        <NuxtLink class="home-route-card" :to="activeSong ? { path: '/repertoire', query: { song: activeSong.id } } : '/repertoire'">
          <span>曲目</span>
          <strong>{{ activeSong?.title || `${archive.stats.songCount} 首曲目` }}</strong>
          <p>{{ activeSong?.roleLabel || '查看完整状态看板' }} · {{ archive.stats.songCount }} 首</p>
          <AppIcon name="arrow" :size="18" />
        </NuxtLink>
        <NuxtLink class="home-route-card" to="/logs">
          <span>练习历史</span>
          <strong>{{ latestLog ? formatArchiveDate(latestLog.date, true) : '尚无日志' }}</strong>
          <p>{{ archive.stats.sessionLogCount }} 份记录 · {{ latestLog?.title || '查看全部' }}</p>
          <AppIcon name="arrow" :size="18" />
        </NuxtLink>
        <NuxtLink class="home-route-card" to="/progress">
          <span>当前能力</span>
          <strong>{{ activeWeek ? `W${activeWeek.toString().padStart(2, '0')}` : '待确认' }}</strong>
          <p>{{ activeWeekItem?.statusLabel || '查看课程决策' }}</p>
          <AppIcon name="arrow" :size="18" />
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
