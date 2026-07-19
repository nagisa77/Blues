<script setup lang="ts">
import type { PracticeLogItem } from '~/types/archive'

const archive = useArchive()
const search = ref('')
const selectedSong = ref('all')
const selectedEvidence = ref('all')
const selectedOutput = ref('all')
const selectedWeek = ref('all')

const weeks = [...new Set(archive.logs.map(log => log.calendarWeekId).filter(Boolean))] as string[]

const songIdForLog = (log: PracticeLogItem) => {
  const recording = archive.recordings.find(item => log.recordingIds.includes(item.id) && item.songId)
  if (recording?.songId) return recording.songId
  return archive.songs.find(song => log.title.toLocaleLowerCase('zh-CN').includes(song.title.toLocaleLowerCase('zh-CN')))?.id || 'other'
}

const evidenceTypeForLog = (log: PracticeLogItem) => {
  if (log.evidence.performanceReview === 'reviewed') return 'reviewed'
  if (log.evidence.selfReport === 'yes') return 'self_report'
  if (log.evidence.sources.includes('file_fact')) return 'file_fact'
  return 'unknown'
}

const outputTypeForLog = (log: PracticeLogItem) => {
  if (log.recordingIds.length) return 'recording'
  if (log.result.completion === 'completed') return 'completed'
  return 'task'
}

const songOptions = archive.songs.filter(song => archive.logs.some(log => songIdForLog(log) === song.id))

const filteredLogs = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase('zh-CN')
  return archive.logs.filter((log) => {
    const haystack = [log.title, log.focus, log.task.material, log.task.output]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('zh-CN')
    return (selectedSong.value === 'all' || songIdForLog(log) === selectedSong.value)
      && (selectedEvidence.value === 'all' || evidenceTypeForLog(log) === selectedEvidence.value)
      && (selectedOutput.value === 'all' || outputTypeForLog(log) === selectedOutput.value)
      && (selectedWeek.value === 'all' || log.calendarWeekId === selectedWeek.value)
      && (!keyword || haystack.includes(keyword))
  })
})

const resetFilters = () => {
  search.value = ''
  selectedSong.value = 'all'
  selectedEvidence.value = 'all'
  selectedOutput.value = 'all'
  selectedWeek.value = 'all'
}

const hasFilters = computed(() => Boolean(search.value)
  || [selectedSong.value, selectedEvidence.value, selectedOutput.value, selectedWeek.value].some(value => value !== 'all'))

useSeoMeta({
  title: '练习日志 · Tim / Blues',
  description: '按曲目、证据来源和音乐产出查看 Tim 的 Blues 吉他练习日志。',
})
</script>

<template>
  <div>
    <section class="page-hero logs-page-hero compact-page-hero">
      <div class="container page-hero-grid">
        <div>
          <p class="eyebrow"><span /> 练习日志</p>
          <h1>按事实找到<br><em>一次练习。</em></h1>
        </div>
        <div class="page-hero-aside">
          <strong>{{ archive.stats.sessionLogCount }}</strong>
          <p>份练习日志</p>
          <span>{{ archive.stats.practiceDateCount }} 个实际练习日 · 更新于 {{ archive.logs[0]?.date ? formatArchiveDate(archive.logs[0].date, true) : '待确认' }}</span>
        </div>
      </div>
    </section>

    <section class="archive-content">
      <div class="container archive-toolbar advanced-toolbar logs-primary-toolbar">
        <label class="search-field">
          <AppIcon name="search" :size="18" />
          <span class="sr-only">搜索练习日志</span>
          <input v-model="search" type="search" placeholder="搜索曲目、调性或训练重点">
        </label>
        <label class="filter-select"><span>曲目</span><select v-model="selectedSong"><option value="all">全部曲目</option><option v-for="song in songOptions" :key="song.id" :value="song.id">{{ song.title }}</option><option value="other">其他训练</option></select></label>
        <label class="filter-select"><span>证据</span><select v-model="selectedEvidence"><option value="all">全部证据</option><option value="file_fact">文件事实</option><option value="self_report">用户自评</option><option value="reviewed">已实际回听</option><option value="unknown">待确认</option></select></label>
      </div>

      <div class="container logs-secondary-toolbar">
        <details class="advanced-filters">
          <summary>更多筛选<AppIcon name="arrow" :size="15" /></summary>
          <div>
            <label class="filter-select"><span>产出</span><select v-model="selectedOutput"><option value="all">全部产出</option><option value="recording">有导出录音</option><option value="completed">已完成，无录音</option><option value="task">任务记录</option></select></label>
            <label class="filter-select compact-filter"><span>周次</span><select v-model="selectedWeek"><option value="all">全部周次</option><option v-for="week in weeks" :key="week" :value="week">{{ week }}</option></select></label>
          </div>
        </details>
        <button v-if="hasFilters" class="clear-filters" type="button" @click="resetFilters">清除筛选</button>
      </div>

      <div class="container archive-context-line">
        <p>显示 <strong>{{ filteredLogs.length }}</strong> / {{ archive.stats.sessionLogCount }}</p>
        <EvidenceLegend />
      </div>

      <div class="container full-log-layout compact-log-layout">
        <aside class="timeline-legend">
          <span>2026</span>
          <strong>{{ filteredLogs.length.toString().padStart(2, '0') }}</strong>
          <p>SESSIONS<br>VISIBLE</p>
          <i />
        </aside>
        <div class="full-log-list" aria-live="polite">
          <PracticeLogCard v-for="(log, index) in filteredLogs" :key="log.id" :log="log" :index="index" />
          <p v-if="!filteredLogs.length" class="empty-state">没有匹配的日志。清除筛选后再试。</p>
        </div>
      </div>
    </section>
  </div>
</template>
