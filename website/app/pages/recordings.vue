<script setup lang="ts">
import type { RecordingArchiveItem } from '~/types/archive'

const archive = useArchive()
const catalog = useArchiveCatalog()
const route = useRoute()
const initialSong = typeof route.query.song === 'string'
  && archive.songs.some(song => song.id === route.query.song)
  ? route.query.song
  : archive.currentFocus.songId || 'all'
const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
const selectedType = ref(typeof route.query.type === 'string' ? route.query.type : 'all')
const selectedSong = ref(initialSong)
const {
  comparisonIds,
  compareLength,
  comparisonOffsets,
  comparisonRecordings,
  maximumLength: comparisonMaximumLength,
  hasPeer: hasComparisonPeer,
  peer: comparisonPeer,
  disabledReason: compareDisabledReason,
  isDisabled: compareDisabled,
  toggle: toggleComparison,
  selectPair,
  start: comparisonStart,
  playRecording: playComparison,
  restore: restoreComparison,
  clear: clearComparison,
} = useRecordingComparison()

const typeOptions = computed(() => {
  const options = new Map<string, string>()
  archive.recordings.forEach(recording => options.set(recording.type, recording.typeLabel))
  return [...options.entries()].map(([value, label]) => ({ value, label }))
})

const songOptions = archive.songs.filter(song => archive.recordings.some(recording => recording.songId === song.id))

const filteredRecordings = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase('zh-CN')
  return archive.recordings.filter((recording) => {
    const haystack = searchableText([
      recording.title,
      recording.keyLabel,
      recording.tempoLabel,
      recording.typeLabel,
    ])
    return (selectedType.value === 'all' || recording.type === selectedType.value)
      && (selectedSong.value === 'all' || recording.songId === selectedSong.value)
      && (!keyword || haystack.includes(keyword))
  })
})

const groupedRecordings = computed(() => {
  const groups = new Map<string, RecordingArchiveItem[]>()
  filteredRecordings.value.forEach((recording) => {
    const key = recording.songId || 'other'
    groups.set(key, [...(groups.get(key) || []), recording])
  })
  return [...groups.entries()].map(([songId, recordings]) => ({
    songId,
    title: catalog.song(songId)?.title || '基础与其他训练',
    roleLabel: catalog.song(songId)?.roleLabel || '档案',
    recordings,
  }))
})

const revealComparison = async () => {
  await nextTick()
  if (import.meta.client) {
    document.querySelector('.comparison-tray')?.scrollIntoView({ block: 'nearest' })
  }
}

const toggleCompare = (recording: RecordingArchiveItem) => {
  if (toggleComparison(recording)) void revealComparison()
}

const comparePair = (recording: RecordingArchiveItem) => {
  if (selectPair(recording)) void revealComparison()
}

const comparableSongCount = computed(() => new Set(
  archive.recordings
    .filter(recording => hasComparisonPeer(recording) && recording.songId)
    .map(recording => recording.songId),
).size)
const pendingReviewCount = computed(() => archive.recordings.filter(
  recording => recording.evidence.performanceReview !== 'reviewed',
).length)
const selectedSongName = computed(() => catalog.song(selectedSong.value)?.title || null)
const resultContext = computed(() => selectedSongName.value
  ? `已筛选：${selectedSongName.value}`
  : selectedType.value !== 'all' || search.value
    ? '已按当前条件筛选'
    : '默认先看当前主攻')
const resultAnnouncement = computed(() => `显示 ${filteredRecordings.value.length} / ${archive.stats.recordingCount} 条录音。${resultContext.value}`)

const applyRouteState = async () => {
  const songId = route.query.song
  if (typeof songId === 'string' && archive.songs.some(song => song.id === songId)) {
    selectedSong.value = songId
    await nextTick()
  }

  if (typeof route.query.compare !== 'string') return
  const candidates = route.query.compare
    .split(',')
    .map(id => catalog.recording(id))
    .filter((recording): recording is RecordingArchiveItem => Boolean(recording))
  if (candidates.length !== 2) return
  restoreComparison(candidates)
}

const groupShouldOpen = (songId: string) => selectedSong.value !== 'all'
  || songId === archive.currentFocus.songId

watch(selectedSong, () => {
  clearComparison()
})

useRouteQuerySync([search, selectedSong, selectedType, comparisonIds], () => {
  const query: Record<string, string> = {}
  if (search.value) query.q = search.value
  if (selectedSong.value !== 'all') query.song = selectedSong.value
  if (selectedType.value !== 'all') query.type = selectedType.value
  if (comparisonIds.value.length) query.compare = comparisonIds.value.join(',')
  return query
})

watch(() => [route.query.song, route.query.compare], applyRouteState)

onMounted(applyRouteState)

useSeoMeta({
  title: '曲目录音 · Tim / Blues',
  description: `按曲目整理 Tim 的 ${archive.stats.recordingCount} 条个人 Blues 练习录音，并支持前后版本 A/B 对比。`,
})
</script>

<template>
  <div>
    <section class="page-hero recording-page-hero compact-page-hero">
      <div class="container page-hero-grid">
        <div>
          <p class="eyebrow"><span /> 录音档案</p>
          <h1>录音版本，<br><em>直接比较。</em></h1>
        </div>
        <div class="recording-total">
          <span>可直接 A/B</span>
          <strong>{{ comparableSongCount }} 首</strong>
          <p>{{ pendingReviewCount }} 条待实际回听 · 更新于 {{ archive.recordings[0]?.date ? formatArchiveDate(archive.recordings[0].date, true) : '待确认' }}</p>
        </div>
      </div>
    </section>

    <section class="archive-content recording-archive-content">
      <div class="container archive-toolbar advanced-toolbar recording-toolbar">
        <label class="search-field">
          <AppIcon name="search" :size="18" />
          <span class="sr-only">搜索录音</span>
          <input v-model="search" type="search" placeholder="搜索曲目、调性或速度">
        </label>
        <label class="filter-select"><span>曲目</span><select v-model="selectedSong"><option value="all">全部曲目</option><option v-for="song in songOptions" :key="song.id" :value="song.id">{{ song.title }}</option></select></label>
        <label class="filter-select"><span>类型</span><select v-model="selectedType"><option value="all">全部类型</option><option v-for="option in typeOptions" :key="option.value" :value="option.value">{{ option.label }}</option></select></label>
      </div>

      <div class="container archive-context-line">
        <p>显示 <strong>{{ filteredRecordings.length }}</strong> / {{ archive.stats.recordingCount }} · {{ resultContext }}</p>
        <button v-if="selectedSong !== 'all' || selectedType !== 'all' || search" class="clear-filters" type="button" @click="selectedSong = 'all'; selectedType = 'all'; search = ''">查看全部录音</button>
        <EvidenceLegend />
      </div>
      <p class="sr-only" role="status" aria-live="polite">{{ resultAnnouncement }}</p>

      <aside v-if="comparisonRecordings.length" class="container comparison-tray" aria-label="A/B 录音对比">
        <div class="comparison-title">
          <span>A/B</span>
          <p>{{ comparisonRecordings.length === 2 ? '同一片段循环播放；切换 A / B 直接听差异。' : '再选择一条同曲录音。' }}</p>
        </div>
        <div class="comparison-loop-controls">
          <label><span>片段长度</span><input v-model.number="compareLength" type="number" min="1" :max="comparisonMaximumLength" step="1"><small>秒</small></label>
        </div>
        <div class="comparison-slots">
          <article v-for="(recording, index) in comparisonRecordings" :key="recording.id">
            <span>{{ index === 0 ? 'A' : 'B' }}</span>
            <div>
              <strong>{{ recording.title }}</strong>
              <small>{{ recording.comparisonLabel }} · {{ recording.date }} · {{ recording.tempoLabel }} · {{ recording.durationLabel }}</small>
              <label class="comparison-offset"><span>起点</span><input v-model.number="comparisonOffsets[recording.id]" type="number" min="0" :max="Math.max(0, (recording.durationSeconds || 1) - 1)" step="0.5"><small>秒</small></label>
            </div>
            <button type="button" :aria-label="`播放对比版本 ${index === 0 ? 'A' : 'B'}`" @click="playComparison(recording)"><AppIcon name="play" :size="17" /></button>
          </article>
          <div v-if="comparisonRecordings.length < 2" class="comparison-empty">选择另一条版本</div>
        </div>
        <button class="comparison-clear" type="button" @click="clearComparison">清除</button>
      </aside>

      <div class="container recording-groups">
        <details v-for="group in groupedRecordings" :key="group.songId" class="recording-group" :open="groupShouldOpen(group.songId)">
          <summary class="recording-group-head">
            <div><span>{{ group.roleLabel }}</span><h2>{{ group.title }}</h2></div>
            <p>{{ group.recordings.length }} 条<AppIcon name="arrow" :size="17" /></p>
          </summary>
          <div class="recording-library" :class="`count-${Math.min(group.recordings.length, 3)}`">
            <RecordingCard
              v-for="recording in group.recordings"
              :key="recording.id"
              :recording="recording"
              compare-mode
              :compare-selected="comparisonIds.includes(recording.id)"
              :compare-disabled="compareDisabled(recording)"
              :compare-disabled-label="compareDisabledReason(recording) || undefined"
              :compare-with-label="comparisonPeer(recording) ? '与上一版比较' : undefined"
              :wide="group.recordings.length === 1"
              show-decision
              hide-song-link
              @toggle-compare="toggleCompare"
              @compare-pair="comparePair"
            />
          </div>
        </details>
        <p v-if="!filteredRecordings.length" class="empty-state">没有匹配的录音。</p>
      </div>
    </section>
  </div>
</template>
