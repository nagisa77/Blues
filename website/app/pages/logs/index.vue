<script setup lang="ts">
const archive = useArchive()
const search = ref('')
const selectedWeek = ref('all')

const weeks = computed(() =>
  [...new Set(archive.logs.map((log) => log.calendarWeekId).filter(Boolean))] as string[],
)

const filteredLogs = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase('zh-CN')
  return archive.logs.filter((log) => {
    const matchesWeek = selectedWeek.value === 'all' || log.calendarWeekId === selectedWeek.value
    const haystack = [log.title, log.focus, log.task.material, log.task.output]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('zh-CN')
    return matchesWeek && (!keyword || haystack.includes(keyword))
  })
})

useSeoMeta({
  title: '练习日志 · Tim / Blues',
  description: 'Tim 的 Blues 吉他练习日志，记录每次产出、唯一重点、事实证据和下一步。',
})
</script>

<template>
  <div>
    <section class="page-hero logs-page-hero">
      <div class="container page-hero-grid">
        <div>
          <p class="eyebrow"><span /> PRACTICE LOGS / 练习日志</p>
          <h1>不是打卡。<br><em>是演奏发生过的证据。</em></h1>
        </div>
        <div class="page-hero-aside">
          <strong>{{ archive.stats.sessionLogCount }}</strong>
          <p>份练习日志</p>
          <span>{{ archive.stats.practiceDateCount }} 个实际练习日 · {{ archive.stats.dateRange.start }} — {{ archive.stats.dateRange.end }}</span>
        </div>
      </div>
    </section>

    <section class="archive-content">
      <div class="container archive-toolbar">
        <label class="search-field">
          <AppIcon name="search" :size="18" />
          <span class="sr-only">搜索练习日志</span>
          <input v-model="search" type="search" placeholder="搜索曲目、调性或训练重点">
        </label>
        <div class="filter-pills" aria-label="按周筛选">
          <button type="button" :class="{ active: selectedWeek === 'all' }" @click="selectedWeek = 'all'">全部</button>
          <button
            v-for="week in weeks"
            :key="week"
            type="button"
            :class="{ active: selectedWeek === week }"
            @click="selectedWeek = week"
          >
            {{ week }}
          </button>
        </div>
      </div>

      <div class="container full-log-layout">
        <aside class="timeline-legend">
          <span>2026</span>
          <strong>{{ filteredLogs.length.toString().padStart(2, '0') }}</strong>
          <p>SESSIONS<br>VISIBLE</p>
          <i />
        </aside>
        <div class="full-log-list" aria-live="polite">
          <PracticeLogCard v-for="(log, index) in filteredLogs" :key="log.id" :log="log" :index="index" />
          <p v-if="!filteredLogs.length" class="empty-state">没有匹配的日志。换一个关键词或周次试试。</p>
        </div>
      </div>
    </section>
  </div>
</template>
