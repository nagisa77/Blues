<script setup lang="ts">
import type { SongArchiveItem } from '~/types/archive'

defineProps<{
  song: SongArchiveItem
  index?: number
}>()

const roleShort: Record<SongArchiveItem['role'], string> = {
  focus: 'NOW',
  paused: 'PAUSE',
  maintenance: 'KEEP',
  retired_reference: 'REF',
  baseline: 'BASE',
  unknown: '—',
}
</script>

<template>
  <article class="song-role-card" :class="`role-${song.role}`">
    <div class="song-card-head">
      <span class="song-index">0{{ (index || 0) + 1 }}</span>
      <span class="song-role"><i />{{ song.roleLabel }}</span>
      <span class="song-role-en">{{ roleShort[song.role] }}</span>
    </div>

    <div class="song-card-body">
      <p class="song-artist">{{ song.artist || '曲目档案' }}</p>
      <h3>{{ song.title }}</h3>
      <p v-if="song.version" class="song-version">{{ song.version }}</p>
      <p class="song-capability">{{ song.capabilities }}</p>
    </div>

    <div class="song-current">
      <span>当前能完成到</span>
      <p>{{ song.currentCapability }}</p>
    </div>

    <div class="song-next">
      <AppIcon name="target" :size="18" />
      <p><span>下一步</span>{{ song.nextStep }}</p>
    </div>
  </article>
</template>
