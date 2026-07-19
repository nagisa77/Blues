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
            <NuxtLink class="button button-primary" :to="nextTaskLog ? `/logs/${nextTaskLog.id}` : '/logs'">
              打开本次任务<AppIcon name="arrow" :size="17" />
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
            <div v-if="nextTaskLog?.task.constraints">
              <dt>限制</dt>
              <dd>{{ nextTaskLog.task.constraints }}</dd>
            </div>
            <div v-if="nextTaskLog?.task.passCriteria">
              <dt>过关</dt>
              <dd>{{ nextTaskLog.task.passCriteria }}</dd>
            </div>
          </dl>
        </article>

        <aside class="practice-capability">
          <p class="mini-label">当前能力</p>
          <h2>{{ archive.currentFocus.currentCapability || '等待下一条完成事实' }}</h2>
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
            <p class="mini-label">有效事实</p>
            <h3>{{ latestRecording?.evidenceSummary || archive.currentFocus.currentCapability || '尚无声音证据结论' }}</h3>
          </div>
          <div>
            <p class="mini-label">下一遍只改</p>
            <p>{{ latestRecording?.nextChange || '先完成当前任务，再根据录音决定。' }}</p>
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
          <span>练习日志</span>
          <strong>{{ latestLog ? formatArchiveDate(latestLog.date, true) : '尚无日志' }}</strong>
          <p>{{ archive.stats.sessionLogCount }} 份记录 · {{ latestLog?.title || '查看全部' }}</p>
          <AppIcon name="arrow" :size="18" />
        </NuxtLink>
        <NuxtLink class="home-route-card" to="/progress">
          <span>当前阶段</span>
          <strong>{{ activeWeek ? `W${activeWeek.toString().padStart(2, '0')}` : '待确认' }}</strong>
          <p>{{ activeWeekItem?.statusLabel || '查看课程决策' }}</p>
          <AppIcon name="arrow" :size="18" />
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
