<script setup lang="ts">
const archive = useArchive()
const activeSong = archive.songs.find(song => song.role === 'focus')
const latestRecording = archive.recordings.find(recording => recording.id === archive.currentFocus.latestRecordingId)
  || archive.recordings[0]
const nextTaskLog = archive.logs.find(log => log.id === archive.currentFocus.latestLogId)
  || archive.logs[0]
const recentLogs = archive.logs.slice(0, 3)
const archiveUpdatedAt = archive.logs[0]?.date || archive.stats.dateRange.end
const previewSongs = [
  activeSong,
  archive.songs.find(song => song.role === 'maintenance'),
  archive.songs.find(song => song.role === 'retired_reference'),
].filter((song): song is (typeof archive.songs)[number] => Boolean(song))

const { play } = useAudioPlayer()

const playLatest = () => {
  if (latestRecording) play(recordingPlayerTrack(latestRecording))
}

useSeoMeta({
  title: 'Tim 的 Blues 练习记录',
  ogTitle: 'Tim / Blues Practice Archive',
  description: '下一次训练、个人录音、练习日志和曲目状态组成的 Blues 吉他成长档案。',
})
</script>

<template>
  <div>
    <section class="home-hero home-workbench">
      <div class="container workbench-grid">
        <div class="hero-copy workbench-copy">
          <p class="eyebrow"><span /> NEXT SESSION / 下一次训练</p>
          <h1>从一条可听见的<br><em>结果开始。</em></h1>
          <p class="hero-intro">
            当前只处理最影响听感的一项。完成一段真实演奏，再用录音决定下一步。
          </p>
          <div class="hero-actions">
            <button v-if="latestRecording" class="button button-primary" type="button" @click="playLatest">
              <span class="button-icon"><AppIcon name="play" :size="18" /></span>
              听最近证据
            </button>
            <NuxtLink class="button button-ghost" :to="nextTaskLog ? `/logs/${nextTaskLog.id}` : '/logs'">
              查看任务详情<AppIcon name="arrow" :size="17" />
            </NuxtLink>
          </div>
        </div>

        <aside class="next-practice-panel">
          <div class="next-practice-head">
            <span>{{ activeSong?.title || archive.currentFocus.title }}</span>
            <strong>{{ nextTaskLog?.durationText || '15–30 分钟' }}</strong>
          </div>
          <div class="next-practice-primary">
            <span>产出</span>
            <h2>{{ nextTaskLog?.task.output || archive.currentFocus.nextStep }}</h2>
          </div>
          <dl class="next-practice-facts">
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
          <EvidenceBadge :evidence="archive.currentFocus.evidence" />
        </aside>
      </div>
    </section>

    <section class="section latest-evidence-section">
      <div class="container split-heading compact-heading">
        <div>
          <p class="section-kicker">LATEST EVIDENCE / 最近证据</p>
          <h2 class="section-title">先听事实，<br>再决定练什么。</h2>
        </div>
        <p class="section-summary">
          {{ archive.currentFocus.currentCapability || archive.logs[0]?.result.effectiveEvidence }}
        </p>
      </div>
      <div class="container evidence-focus-grid">
        <RecordingCard v-if="latestRecording" :recording="latestRecording" featured />
        <article class="evidence-decision-card">
          <p class="mini-label">DECISION / 课程决定</p>
          <h3>{{ latestRecording?.nextChange || archive.currentFocus.nextStep }}</h3>
          <div class="evidence-decision-links">
            <NuxtLink v-if="latestRecording?.logIds[0]" :to="`/logs/${latestRecording.logIds[0]}`">查看对应日志</NuxtLink>
            <NuxtLink v-if="latestRecording?.songId" :to="{ path: '/recordings', query: { song: latestRecording.songId } }">与上一版 A/B 对比</NuxtLink>
          </div>
        </article>
      </div>
    </section>

    <section class="section repertoire-preview compact-section">
      <div class="container section-heading-inline">
        <div>
          <p class="section-kicker">REPERTOIRE / 曲目状态</p>
          <h2 class="section-title">主攻、维护与退役分开。</h2>
        </div>
        <NuxtLink to="/repertoire" class="text-link">打开完整看板<AppIcon name="arrow" :size="17" /></NuxtLink>
      </div>
      <div class="container song-grid home-song-grid">
        <SongRoleCard v-for="(song, index) in previewSongs" :key="song.id" :song="song" :index="index" />
      </div>
    </section>

    <section class="section log-preview compact-section">
      <div class="container logs-layout">
        <div class="logs-intro">
          <p class="section-kicker">RECENT SESSIONS / 最近练习</p>
          <h2 class="section-title">只保留会影响<br>下一次的事实。</h2>
          <p>按曲目、证据来源和产出类型查找，不再依赖记住日历周。</p>
          <NuxtLink class="button button-ghost" to="/logs">打开日志档案<AppIcon name="arrow" :size="17" /></NuxtLink>
        </div>
        <div class="log-list">
          <PracticeLogCard v-for="(log, index) in recentLogs" :key="log.id" :log="log" :index="index" />
        </div>
      </div>
    </section>

    <section class="archive-summary-section">
      <div class="container archive-summary-grid">
        <div>
          <p class="section-kicker">ARCHIVE STATUS / 档案状态</p>
          <strong>更新于 {{ archiveUpdatedAt ? formatArchiveDate(archiveUpdatedAt, true) : '待确认' }}</strong>
        </div>
        <dl>
          <div><dt>录音</dt><dd>{{ archive.stats.recordingCount }}</dd></div>
          <div><dt>日志</dt><dd>{{ archive.stats.sessionLogCount }}</dd></div>
          <div><dt>曲目</dt><dd>{{ archive.stats.songCount }}</dd></div>
          <div><dt>工程</dt><dd>{{ archive.stats.projectCount }}</dd></div>
        </dl>
        <NuxtLink to="/progress" class="text-link">查看课程决策<AppIcon name="arrow" :size="17" /></NuxtLink>
      </div>
    </section>
  </div>
</template>
