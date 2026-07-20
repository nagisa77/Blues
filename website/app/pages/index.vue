<script setup lang="ts">
const archive = useArchive()
const catalog = useArchiveCatalog()
const activeSong = archive.songs.find(song => song.role === 'focus')
const latestLog = archive.logs[0]
const nextTaskLog = catalog.log(archive.currentFocus.latestLogId) || latestLog
const latestRecording = catalog.recording(archive.currentFocus.latestRecordingId) || archive.recordings[0]
const previousVersion = latestRecording
  ? catalog.comparisonGroup(latestRecording).find(recording => recording.id !== latestRecording.id)
  : undefined
const activeWeek = archive.stats.activeProgramWeek
const activeWeekItem = archive.weeks.find(week => week.number === activeWeek)
const taskSummary = nextTaskLog?.task.summary
  || archive.currentFocus.nextStep
  || nextTaskLog?.task.output
  || '由下一条声音证据决定训练内容'

const shortPassCriteria = firstClause(nextTaskLog?.task.passCriteria, '完成一次明确、可复现的音乐结果')
const capabilitySummary = computed(() => firstClause(
  archive.currentFocus.currentCapability,
  '等待下一条完成事实',
))
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
          <div>
            <p class="mini-label">当前能力</p>
            <p class="capability-compact-copy">{{ capabilitySummary }}</p>
          </div>
          <div class="capability-evidence capability-evidence-compact">
            <EvidenceBadge :evidence="archive.currentFocus.evidence" />
            <NuxtLink to="/progress">查看能力阶段<AppIcon name="arrow" :size="15" /></NuxtLink>
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
      <div class="container home-evidence-single">
        <RecordingCard v-if="latestRecording" :recording="latestRecording" featured wide show-decision />
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
          <strong>{{ activeWeek ? `阶段 ${activeWeek} / ${archive.weeks.length}` : '待确认' }}</strong>
          <p>{{ activeWeekItem?.statusLabel || '查看课程决策' }}</p>
          <AppIcon name="arrow" :size="18" />
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
