<script setup lang="ts">
const archive = useArchive()
const latestRecording = archive.recordings[0]
const recentLogs = archive.logs.slice(0, 4)
const latestRecordings = archive.recordings.slice(0, 3)
const currentSong = archive.songs.find(song => song.id === archive.currentFocus.songId)
const currentSongDetail = [currentSong?.version, currentSong?.capabilities]
  .filter(Boolean)
  .join(' · ')
const { play } = useAudioPlayer()

const heroStats = [
  {
    value: archive.stats.recordingCount.toString().padStart(2, '0'),
    label: '个人录音',
    detail: archive.stats.recordingDurationLabel,
  },
  {
    value: archive.stats.sessionLogCount.toString().padStart(2, '0'),
    label: '练习日志',
    detail: `${archive.stats.practiceDateCount} 个练习日`,
  },
  {
    value: archive.stats.songCount.toString().padStart(2, '0'),
    label: '主线曲目',
    detail: '主攻 / 维护 / 对照',
  },
  {
    value: archive.stats.projectCount.toString().padStart(2, '0'),
    label: '可编辑工程',
    detail: 'GarageBand',
  },
]

const playLatest = () => {
  if (latestRecording) play(recordingPlayerTrack(latestRecording))
}

useSeoMeta({
  title: 'Tim 的 Blues 练习记录',
  ogTitle: 'Tim / Blues Practice Archive',
  description: '练习日志、个人录音、主线曲目和 8 周进度组成的 Blues 吉他成长档案。',
})
</script>

<template>
  <div>
    <section class="home-hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <p class="eyebrow"><span /> TIM'S BLUES PRACTICE ARCHIVE</p>
          <h1>让每一次进步<br><em>留下声音。</em></h1>
          <p class="hero-intro">
            这里不收藏练习时长，收藏能听见的改变。日志、曲目、录音与下一步，组成 Tim 的 Blues 训练证据链。
          </p>
          <div class="hero-actions">
            <button v-if="latestRecording" class="button button-primary" type="button" @click="playLatest">
              <span class="button-icon"><AppIcon name="play" :size="18" /></span>
              听最新录音
            </button>
            <NuxtLink class="button button-ghost" to="/logs">
              浏览练习日志
              <AppIcon name="arrow" :size="17" />
            </NuxtLink>
          </div>
        </div>

        <aside class="focus-panel">
          <div class="focus-panel-head">
            <span>NOW / 当前主攻</span>
            <span class="live-pill"><i /> {{ archive.currentFocus.calendarWeekId || '2026-W28' }}</span>
          </div>

          <div class="focus-record" aria-hidden="true">
            <div class="record-label">
              <span>W{{ archive.currentFocus.programWeek?.toString().padStart(2, '0') || '—' }}</span>
              <i />
              <small>CURRENT<br>FOCUS</small>
            </div>
          </div>

          <div class="focus-panel-copy">
            <p>{{ currentSong?.artist || 'CURRENT SONG' }}</p>
            <h2>{{ currentSong?.title || archive.currentFocus.title }}</h2>
            <span>{{ currentSongDetail || '当前训练素材' }}</span>
          </div>

          <div class="focus-next">
            <span>下一条音乐产出</span>
            <p>{{ archive.currentFocus.nextStep }}</p>
          </div>
        </aside>
      </div>

      <div class="container hero-stat-grid">
        <article v-for="item in heroStats" :key="item.label" class="hero-stat">
          <strong>{{ item.value }}</strong>
          <p>{{ item.label }}</p>
          <span>{{ item.detail }}</span>
        </article>
      </div>
    </section>

    <section class="section current-section">
      <div class="container split-heading">
        <div>
          <p class="section-kicker">CURRENT FOCUS / 当前重点</p>
          <h2 class="section-title">一次只改变<br>最影响听感的事。</h2>
        </div>
        <p class="section-summary">{{ archive.currentFocus.currentCapability }}</p>
      </div>

      <div class="container current-grid">
        <article class="current-task-card">
          <div class="task-card-index">01</div>
          <div class="task-card-copy">
            <p>ONLY LISTEN FOR / 只盯</p>
            <h3>{{ archive.currentFocus.focus }}</h3>
          </div>
          <div class="task-card-next">
            <AppIcon name="target" :size="23" />
            <div>
              <span>过关方向</span>
              <p>{{ archive.currentFocus.nextStep }}</p>
            </div>
          </div>
          <EvidenceBadge :evidence="archive.currentFocus.evidence" />
        </article>

        <RecordingCard v-if="latestRecording" :recording="latestRecording" featured />
      </div>
    </section>

    <section class="section repertoire-preview">
      <div class="container section-heading-inline">
        <div>
          <p class="section-kicker">REPERTOIRE / 曲目路线</p>
          <h2 class="section-title">三首歌，三个角色。</h2>
        </div>
        <NuxtLink to="/repertoire" class="text-link">查看完整曲目看板 <AppIcon name="arrow" :size="17" /></NuxtLink>
      </div>
      <div class="container song-grid">
        <SongRoleCard v-for="(song, index) in archive.songs" :key="song.id" :song="song" :index="index" />
      </div>
    </section>

    <section class="section evidence-section">
      <div class="container section-heading-inline">
        <div>
          <p class="section-kicker">RECENT EVIDENCE / 最近证据</p>
          <h2 class="section-title">声音比勾选更诚实。</h2>
        </div>
        <NuxtLink to="/recordings" class="text-link">全部 {{ archive.stats.recordingCount }} 条录音 <AppIcon name="arrow" :size="17" /></NuxtLink>
      </div>
      <div class="container recording-grid">
        <RecordingCard v-for="recording in latestRecordings" :key="recording.id" :recording="recording" />
      </div>
    </section>

    <section class="section log-preview">
      <div class="container logs-layout">
        <div class="logs-intro">
          <p class="section-kicker">SESSION NOTES / 练习日志</p>
          <h2 class="section-title">每一次练习，<br>只留必要事实。</h2>
          <p>记录产出、唯一听感重点和下一次只改什么。没有听过的录音，不伪装成老师评价。</p>
          <NuxtLink class="button button-ghost" to="/logs">打开日志档案 <AppIcon name="arrow" :size="17" /></NuxtLink>
        </div>
        <div class="log-list">
          <PracticeLogCard v-for="(log, index) in recentLogs" :key="log.id" :log="log" :index="index" />
        </div>
      </div>
    </section>

    <section class="archive-principle">
      <div class="container principle-grid">
        <p class="principle-number">12</p>
        <blockquote>
          <span>训练原则 / 01</span>
          “名句提供语法，手法改变语气，<em>录音才是证据。</em>”
        </blockquote>
        <div class="principle-bars" aria-hidden="true">
          <i v-for="n in 12" :key="n" :style="{ height: `${20 + ((n * 37) % 76)}%` }" />
        </div>
      </div>
    </section>
  </div>
</template>
