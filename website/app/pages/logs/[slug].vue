<script setup lang="ts">
const route = useRoute()
const archive = useArchive()
const log = computed(() => archive.logs.find((item) => item.id === route.params.slug))

if (!log.value) {
  throw createError({ statusCode: 404, statusMessage: '这份练习日志不存在' })
}

const relatedRecordings = computed(() =>
  archive.recordings.filter((recording) => log.value?.recordingIds.includes(recording.id)),
)
const relatedSong = computed(() => {
  const songId = relatedRecordings.value.find(recording => recording.songId)?.songId
  if (songId) return archive.songs.find(song => song.id === songId) || null
  return archive.songs.find(song => log.value?.title.toLocaleLowerCase('zh-CN').includes(song.title.toLocaleLowerCase('zh-CN'))) || null
})
const currentIndex = computed(() => archive.logs.findIndex((item) => item.id === log.value?.id))
const newerLog = computed(() => archive.logs[currentIndex.value - 1] || null)
const olderLog = computed(() => archive.logs[currentIndex.value + 1] || null)

useSeoMeta({
  title: () => `${log.value?.date} 练习日志 · Tim / Blues`,
  description: () => log.value?.focus || 'Tim 的 Blues 吉他练习日志。',
})
</script>

<template>
  <article v-if="log" class="log-detail">
    <header class="log-detail-hero">
      <div class="container log-detail-hero-grid">
        <div class="log-detail-date">
          <span>{{ log.calendarWeekId || 'SESSION' }}</span>
          <strong>{{ formatArchiveDate(log.date, true) }}</strong>
          <p>{{ log.dayToken || 'PRACTICE LOG' }}</p>
        </div>
        <div class="log-detail-title">
          <NuxtLink to="/logs" class="back-link"><AppIcon name="arrow" :size="16" /> 返回全部日志</NuxtLink>
          <p class="eyebrow"><span /> SESSION NOTE / 练习记录</p>
          <h1>{{ log.title }}</h1>
          <p>{{ log.focus }}</p>
          <div class="log-detail-meta">
            <EvidenceBadge :evidence="log.evidence" />
            <span v-if="log.durationText"><AppIcon name="clock" :size="15" />{{ log.durationText }}</span>
            <NuxtLink v-if="relatedSong" :to="{ path: '/repertoire', query: { song: relatedSong.id } }">曲目：{{ relatedSong.title }}</NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <div class="container log-detail-body">
      <aside class="log-detail-index">
        <p>本次练习</p>
        <a href="#task">01 / 今日任务</a>
        <a href="#result">02 / 结果</a>
        <a href="#recording">03 / 录音</a>
        <a href="#next">04 / 下一次</a>
        <NuxtLink v-if="relatedSong" :to="{ path: '/recordings', query: { song: relatedSong.id } }">该曲全部录音</NuxtLink>
        <a :href="githubFileUrl(log.sourcePath)" target="_blank" rel="noreferrer">
          GitHub 原始日志 <AppIcon name="external" :size="13" />
        </a>
      </aside>

      <div class="log-detail-sections">
        <section id="task" class="detail-section">
          <div class="detail-section-number">01</div>
          <div class="detail-section-content">
            <p class="mini-label">今日任务</p>
            <h2>把完整音乐结果说清楚。</h2>
            <dl class="fact-list">
              <div v-if="log.task.material"><dt>材料 / 调性 / 速度</dt><dd>{{ log.task.material }}</dd></div>
              <div v-if="log.task.output"><dt>产出</dt><dd>{{ log.task.output }}</dd></div>
              <div v-if="log.task.constraints"><dt>限制条件</dt><dd>{{ log.task.constraints }}</dd></div>
              <div v-if="log.task.passCriteria"><dt>过关标准</dt><dd>{{ log.task.passCriteria }}</dd></div>
            </dl>
          </div>
        </section>

        <section id="result" class="detail-section">
          <div class="detail-section-number">02</div>
          <div class="detail-section-content">
            <p class="mini-label">结果</p>
            <h2>{{ log.result.completionText || '结果待记录' }}</h2>
            <EvidenceBreakdown :evidence="log.evidence" />
            <dl class="fact-list">
              <div v-if="log.result.effectiveEvidence"><dt>有效证据</dt><dd>{{ log.result.effectiveEvidence }}</dd></div>
              <div v-if="log.result.priorityIssue"><dt>最影响听感的问题</dt><dd>{{ log.result.priorityIssue }}</dd></div>
              <div v-if="log.result.attempts"><dt>尝试 / 重录</dt><dd>{{ log.result.attempts }}</dd></div>
            </dl>
          </div>
        </section>

        <section id="recording" class="detail-section">
          <div class="detail-section-number">03</div>
          <div class="detail-section-content full-width">
            <p class="mini-label">录音</p>
            <h2>{{ relatedRecordings.length ? `${relatedRecordings.length} 条声音证据` : '本次未关联导出录音' }}</h2>
            <div v-if="relatedRecordings.length" class="recording-grid detail-recordings">
              <RecordingCard v-for="recording in relatedRecordings" :key="recording.id" :recording="recording" />
            </div>
            <p v-else class="empty-state compact">日志可能只包含训练事实或工程记录。</p>
          </div>
        </section>

        <section id="next" class="detail-section next-detail-section">
          <div class="detail-section-number">04</div>
          <div class="detail-section-content">
            <p class="mini-label">下一次</p>
            <h2>{{ log.next.singleChange || '下一项尚未记录' }}</h2>
            <p v-if="log.next.output">{{ log.next.output }}</p>
          </div>
        </section>
      </div>
    </div>

    <nav class="container adjacent-logs" aria-label="相邻练习日志">
      <NuxtLink v-if="olderLog" :to="`/logs/${olderLog.id}`">
        <span>较早一篇</span>
        <strong>{{ olderLog.date }}</strong>
      </NuxtLink>
      <span v-else />
      <NuxtLink v-if="newerLog" :to="`/logs/${newerLog.id}`">
        <span>更新一篇</span>
        <strong>{{ newerLog.date }}</strong>
      </NuxtLink>
    </nav>
  </article>
</template>
