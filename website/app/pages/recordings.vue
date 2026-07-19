<script setup lang="ts">
import type { RecordingArchiveItem } from '~/types/archive'

const archive = useArchive()
const route = useRoute()
const router = useRouter()
const initialSong = typeof route.query.song === 'string'
  && archive.songs.some(song => song.id === route.query.song)
  ? route.query.song
  : archive.currentFocus.songId || 'all'
const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
const selectedType = ref(typeof route.query.type === 'string' ? route.query.type : 'all')
const selectedSong = ref(initialSong)
const comparisonIds = ref<string[]>([])
const compareStart = ref(0)
const compareLength = ref(20)
const { play } = useAudioPlayer()

const typeOptions = computed(() => {
  const options = new Map<string, string>()
  archive.recordings.forEach(recording => options.set(recording.type, recording.typeLabel))
  return [...options.entries()].map(([value, label]) => ({ value, label }))
})

const songOptions = archive.songs.filter(song => archive.recordings.some(recording => recording.songId === song.id))

const filteredRecordings = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase('zh-CN')
  return archive.recordings.filter((recording) => {
    const haystack = [recording.title, recording.keyLabel, recording.tempoLabel, recording.typeLabel]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('zh-CN')
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
    title: archive.songs.find(song => song.id === songId)?.title || '基础与其他训练',
    roleLabel: archive.songs.find(song => song.id === songId)?.roleLabel || '档案',
    recordings,
  }))
})

const comparisonRecordings = computed(() => comparisonIds.value
  .map(id => archive.recordings.find(recording => recording.id === id))
  .filter((recording): recording is RecordingArchiveItem => Boolean(recording)))

const comparisonScope = computed(() => comparisonRecordings.value.length
  ? comparisonRecordings.value[0]?.songId || 'other'
  : null)

const hasComparisonPeer = (recording: RecordingArchiveItem) => archive.recordings.some(other =>
  other.id !== recording.id
  && (other.songId || 'other') === (recording.songId || 'other'),
)

const comparisonPeer = (recording: RecordingArchiveItem) => {
  const peers = archive.recordings.filter(other =>
    other.id !== recording.id
    && (other.songId || 'other') === (recording.songId || 'other'),
  )
  if (!peers.length) return null
  const older = peers.find(other => other.date <= recording.date)
  return older || peers[0] || null
}

const compareDisabledReason = (recording: RecordingArchiveItem) => {
  if (!hasComparisonPeer(recording)) return '暂无版本'
  if (comparisonScope.value !== null && (recording.songId || 'other') !== comparisonScope.value) {
    return '仅限同曲'
  }
  return null
}

const compareDisabled = (recording: RecordingArchiveItem) => Boolean(compareDisabledReason(recording))

const toggleCompare = (recording: RecordingArchiveItem) => {
  if (compareDisabled(recording)) return
  if (comparisonIds.value.includes(recording.id)) {
    comparisonIds.value = comparisonIds.value.filter(id => id !== recording.id)
    return
  }
  comparisonIds.value = [...comparisonIds.value.slice(-1), recording.id]
}

const comparePair = (recording: RecordingArchiveItem) => {
  const peer = comparisonPeer(recording)
  if (!peer) return
  comparisonIds.value = [recording.id, peer.id]
}

const playComparison = (recording: RecordingArchiveItem) => play(
  recordingLoopTrack(recording, compareStart.value, compareLength.value),
)

const applyRouteState = async () => {
  const songId = route.query.song
  if (typeof songId === 'string' && archive.songs.some(song => song.id === songId)) {
    selectedSong.value = songId
    await nextTick()
  }

  if (typeof route.query.compare !== 'string') return
  const candidates = route.query.compare
    .split(',')
    .map(id => archive.recordings.find(recording => recording.id === id))
    .filter((recording): recording is RecordingArchiveItem => Boolean(recording))
  if (candidates.length !== 2) return
  const scope = candidates[0]?.songId || 'other'
  if (candidates.every(recording => (recording.songId || 'other') === scope)) {
    comparisonIds.value = candidates.map(recording => recording.id)
  }
}

const groupShouldOpen = (songId: string) => selectedSong.value !== 'all'
  || songId === archive.currentFocus.songId

watch(selectedSong, () => {
  comparisonIds.value = []
})

let syncTimer: number | undefined
watch([search, selectedSong, selectedType, comparisonIds], () => {
  if (!import.meta.client) return
  window.clearTimeout(syncTimer)
  syncTimer = window.setTimeout(() => {
    const query: Record<string, string> = {}
    if (search.value) query.q = search.value
    if (selectedSong.value !== 'all') query.song = selectedSong.value
    if (selectedType.value !== 'all') query.type = selectedType.value
    if (comparisonIds.value.length) query.compare = comparisonIds.value.join(',')
    void router.replace({ query })
  }, 180)
}, { deep: true })

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
          <span>总播放时长</span>
          <strong>{{ archive.stats.recordingDurationLabel }}</strong>
          <p>{{ archive.stats.recordingCount }} 条个人录音 · 更新于 {{ archive.recordings[0]?.date ? formatArchiveDate(archive.recordings[0].date, true) : '待确认' }}</p>
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
        <p>显示 <strong>{{ filteredRecordings.length }}</strong> / {{ archive.stats.recordingCount }} · 默认先看当前主攻</p>
        <button v-if="selectedSong !== 'all' || selectedType !== 'all' || search" class="clear-filters" type="button" @click="selectedSong = 'all'; selectedType = 'all'; search = ''">查看全部录音</button>
        <EvidenceLegend />
      </div>

      <aside v-if="comparisonRecordings.length" class="container comparison-tray" aria-label="A/B 录音对比">
        <div class="comparison-title">
          <span>A/B</span>
          <p>{{ comparisonRecordings.length === 2 ? '同一片段循环播放；切换 A / B 直接听差异。' : '再选择一条同曲录音。' }}</p>
        </div>
        <div class="comparison-loop-controls">
          <label><span>循环起点</span><input v-model.number="compareStart" type="number" min="0" step="1"><small>秒</small></label>
          <label><span>片段长度</span><input v-model.number="compareLength" type="number" min="5" max="90" step="5"><small>秒</small></label>
        </div>
        <div class="comparison-slots">
          <article v-for="(recording, index) in comparisonRecordings" :key="recording.id">
            <span>{{ index === 0 ? 'A' : 'B' }}</span>
            <div><strong>{{ recording.title }}</strong><small>{{ recording.date }} · {{ recording.keyLabel }} · {{ recording.tempoLabel }} · {{ recording.durationLabel }}</small></div>
            <button type="button" :aria-label="`播放对比版本 ${index === 0 ? 'A' : 'B'}`" @click="playComparison(recording)"><AppIcon name="play" :size="17" /></button>
          </article>
          <div v-if="comparisonRecordings.length < 2" class="comparison-empty">选择另一条版本</div>
        </div>
        <button class="comparison-clear" type="button" @click="comparisonIds = []">清除</button>
      </aside>

      <div class="container recording-groups" aria-live="polite">
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
              :compare-with-label="comparisonPeer(recording) ? '与相邻版本比较' : undefined"
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
