<script setup lang="ts">
const archive = useArchive()

const recordingsForSong = (songId: string) =>
  archive.recordings.filter((recording) => recording.songId === songId).slice(0, 3)

useSeoMeta({
  title: '曲目看板 · Tim / Blues',
  description: '三首 Blues 主线曲目的主攻、维护与退役对照状态。',
})
</script>

<template>
  <div>
    <section class="page-hero repertoire-page-hero">
      <div class="container page-hero-grid">
        <div>
          <p class="eyebrow"><span /> REPERTOIRE / 曲目看板</p>
          <h1>不追更多歌。<br><em>让三首歌真正进入身体。</em></h1>
        </div>
        <p class="page-hero-statement">
          一个主攻位、一个维护位、一个退役 / 对照位。完成的素材不消失，只是不再伪装成下一课。
        </p>
      </div>
    </section>

    <section class="archive-content repertoire-list">
      <article
        v-for="(song, index) in archive.songs"
        :key="song.id"
        class="repertoire-row"
        :class="`role-${song.role}`"
      >
        <div class="container repertoire-row-grid">
          <div class="repertoire-number">0{{ index + 1 }}</div>
          <div class="repertoire-heading">
            <span class="song-role"><i />{{ song.roleLabel }}</span>
            <p>{{ song.artist }}</p>
            <h2>{{ song.title }}</h2>
            <span>{{ song.version }}</span>
          </div>

          <div class="repertoire-facts">
            <div>
              <span>核心能力</span>
              <p>{{ song.capabilities }}</p>
            </div>
            <div>
              <span>当前能连续完成到</span>
              <p>{{ song.currentCapability }}</p>
            </div>
            <div class="repertoire-next">
              <AppIcon name="target" :size="19" />
              <p><span>下一步</span>{{ song.nextStep }}</p>
            </div>
          </div>

          <div class="song-recordings">
            <p class="mini-label">RELATED EVIDENCE / 相关录音</p>
            <template v-if="recordingsForSong(song.id).length">
              <RecordingCard
                v-for="recording in recordingsForSong(song.id)"
                :key="recording.id"
                :recording="recording"
              />
            </template>
            <p v-else class="empty-state compact">暂未匹配到录音索引。</p>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>
