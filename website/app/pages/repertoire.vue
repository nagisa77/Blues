<script setup lang="ts">
import type { SongRole } from '~/types/archive'

const archive = useArchive()
const route = useRoute()
const selectedRole = ref<'all' | SongRole>('all')
const expandedId = ref<string | null>(null)

const roleOptions: Array<{ value: 'all' | SongRole, label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'focus', label: '当前主攻' },
  { value: 'maintenance', label: '维护' },
  { value: 'paused', label: '暂停' },
  { value: 'retired_reference', label: '退役 / 对照' },
  { value: 'baseline', label: '基线' },
]

const filteredSongs = computed(() => selectedRole.value === 'all'
  ? archive.songs
  : archive.songs.filter(song => song.role === selectedRole.value))

const recordingsForSong = (songId: string) =>
  archive.recordings.filter(recording => recording.songId === songId).slice(0, 3)

const latestRecordingForSong = (songId: string) =>
  archive.recordings.find(recording => recording.songId === songId)

const toggleSong = (songId: string) => {
  expandedId.value = expandedId.value === songId ? null : songId
}

const openSongFromQuery = async (songId: unknown) => {
  if (typeof songId !== 'string' || !archive.songs.some(song => song.id === songId)) return
  selectedRole.value = 'all'
  expandedId.value = songId
  await nextTick()
  if (import.meta.client) document.getElementById(`song-${songId}`)?.scrollIntoView({ block: 'center' })
}

watch(() => route.query.song, openSongFromQuery)
onMounted(() => openSongFromQuery(route.query.song))

useSeoMeta({
  title: '曲目看板 · Tim / Blues',
  description: '按主攻、维护、暂停、退役和基线查看 Tim 已学曲目的当前能力与声音证据。',
})
</script>

<template>
  <div>
    <section class="page-hero repertoire-page-hero compact-page-hero">
      <div class="container page-hero-grid">
        <div>
          <p class="eyebrow"><span /> 曲目看板</p>
          <h1>曲目状态，<br><em>一眼分清。</em></h1>
        </div>
        <p class="page-hero-statement">
          当前主攻、维护、暂停、退役与基线各自归位。只有仍会影响下一课的素材，才占据训练注意力。
        </p>
      </div>
    </section>

    <section class="archive-content repertoire-board-section">
      <div class="container archive-toolbar repertoire-toolbar">
        <div class="filter-pills" aria-label="按曲目状态筛选">
          <button
            v-for="option in roleOptions"
            :key="option.value"
            type="button"
            :class="{ active: selectedRole === option.value }"
            @click="selectedRole = option.value"
          >
            {{ option.label }}
          </button>
        </div>
        <p class="toolbar-summary">{{ filteredSongs.length }} 首曲目 · 点击一行查看能力、下一步与录音</p>
      </div>

      <div class="container repertoire-board">
        <article
          v-for="(song, index) in filteredSongs"
          :id="`song-${song.id}`"
          :key="song.id"
          class="repertoire-board-row"
          :class="[`role-${song.role}`, { expanded: expandedId === song.id }]"
        >
          <button
            class="repertoire-row-trigger"
            type="button"
            :aria-expanded="expandedId === song.id"
            :aria-controls="`song-detail-${song.id}`"
            @click="toggleSong(song.id)"
          >
            <span class="repertoire-index">{{ (index + 1).toString().padStart(2, '0') }}</span>
            <span class="song-role"><i />{{ song.roleLabel }}</span>
            <span class="repertoire-title">
              <small>{{ song.artist || '曲目档案' }}</small>
              <strong>{{ song.title }}</strong>
            </span>
            <span class="repertoire-capability">{{ song.currentCapability }}</span>
            <span class="repertoire-last">
              <small>最后证据</small>
              {{ latestRecordingForSong(song.id)?.date ? formatArchiveDate(latestRecordingForSong(song.id)!.date) : '尚无录音' }}
            </span>
            <AppIcon name="arrow" :size="18" />
          </button>

          <div v-if="expandedId === song.id" :id="`song-detail-${song.id}`" class="repertoire-row-detail">
            <div class="repertoire-detail-facts">
              <div><span>核心能力</span><p>{{ song.capabilities }}</p></div>
              <div><span>当前能连续完成到</span><p>{{ song.currentCapability }}</p></div>
              <div class="repertoire-next"><span>下一步</span><p>{{ song.nextStep }}</p></div>
              <EvidenceBadge :evidence="song.evidence" />
            </div>
            <div class="song-recordings compact-recordings">
              <div class="compact-recordings-head">
                <p class="mini-label">RELATED EVIDENCE / 相关录音</p>
                <NuxtLink :to="{ path: '/recordings', query: { song: song.id } }">查看全部与 A/B 对比</NuxtLink>
              </div>
              <div v-if="recordingsForSong(song.id).length" class="recording-grid">
                <RecordingCard
                  v-for="recording in recordingsForSong(song.id)"
                  :key="recording.id"
                  :recording="recording"
                />
              </div>
              <p v-else class="empty-state compact">暂未匹配到录音索引。</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
