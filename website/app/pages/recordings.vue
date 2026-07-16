<script setup lang="ts">
const archive = useArchive()
const search = ref('')
const selectedType = ref('all')

const typeOptions = computed(() => {
  const options = new Map<string, string>()
  archive.recordings.forEach((recording) => options.set(recording.type, recording.typeLabel))
  return [...options.entries()].map(([value, label]) => ({ value, label }))
})

const filteredRecordings = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase('zh-CN')
  return archive.recordings.filter((recording) => {
    const matchesType = selectedType.value === 'all' || recording.type === selectedType.value
    const haystack = [recording.title, recording.keyLabel, recording.tempoLabel, recording.typeLabel]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('zh-CN')
    return matchesType && (!keyword || haystack.includes(keyword))
  })
})

useSeoMeta({
  title: '曲目录音 · Tim / Blues',
  description: `Tim 的 ${archive.stats.recordingCount} 条个人 Blues 练习录音，直接从 GitHub 资源播放。`,
})
</script>

<template>
  <div>
    <section class="page-hero recording-page-hero">
      <div class="container page-hero-grid">
        <div>
          <p class="eyebrow"><span /> RECORDING ARCHIVE / 录音档案</p>
          <h1>先留下声音。<br><em>再讨论进步。</em></h1>
        </div>
        <div class="recording-total">
          <span>总播放时长</span>
          <strong>{{ archive.stats.recordingDurationLabel }}</strong>
          <p>{{ archive.stats.recordingCount }} 条个人录音 · 媒体从 GitHub 加载</p>
        </div>
      </div>
    </section>

    <section class="archive-content">
      <div class="container archive-toolbar recording-toolbar">
        <label class="search-field">
          <AppIcon name="search" :size="18" />
          <span class="sr-only">搜索录音</span>
          <input v-model="search" type="search" placeholder="搜索曲目、调性或速度">
        </label>
        <div class="filter-pills" aria-label="按录音类型筛选">
          <button type="button" :class="{ active: selectedType === 'all' }" @click="selectedType = 'all'">全部</button>
          <button
            v-for="option in typeOptions"
            :key="option.value"
            type="button"
            :class="{ active: selectedType === option.value }"
            @click="selectedType = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <div class="container recording-count-line">
        <p>显示 <strong>{{ filteredRecordings.length }}</strong> / {{ archive.stats.recordingCount }}</p>
        <p><span class="status-dot" /> 所有演奏质量均按原档案标注证据来源</p>
      </div>

      <div class="container recording-library" aria-live="polite">
        <RecordingCard v-for="recording in filteredRecordings" :key="recording.id" :recording="recording" />
        <p v-if="!filteredRecordings.length" class="empty-state">没有匹配的录音。</p>
      </div>
    </section>
  </div>
</template>
