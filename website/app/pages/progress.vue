<script setup lang="ts">
const archive = useArchive()
const activeWeek = archive.stats.activeProgramWeek || 5
const activeWeekItem = archive.weeks.find(week => week.number === activeWeek)
const nextWeekItem = archive.weeks.find(week => week.number === activeWeek + 1)
const latestEvidence = archive.recordings[0]
const archiveUpdatedAt = archive.logs[0]?.date || archive.stats.dateRange.end

useSeoMeta({
  title: '进度看板 · Tim / Blues',
  description: 'Tim 当前所在的 Blues 能力阶段、最近声音证据、下一阶段条件与核心事实。',
})
</script>

<template>
  <div>
    <section class="page-hero progress-page-hero compact-page-hero">
      <div class="container progress-stage-grid">
        <div>
          <p class="eyebrow"><span /> PROGRESS / 当前阶段</p>
          <h1>阶段说明位置。<br><em>证据决定前进。</em></h1>
        </div>
        <div class="progress-stage-card">
          <div class="stage-number"><span>当前能力阶段</span><strong>W{{ activeWeek.toString().padStart(2, '0') }}</strong></div>
          <div class="stage-evidence">
            <span>最近声音证据</span>
            <strong>{{ latestEvidence?.title || '待补录' }}</strong>
            <small>{{ latestEvidence ? formatArchiveDate(latestEvidence.date, true) : '日期待确认' }}</small>
          </div>
          <div class="stage-next">
            <span>{{ nextWeekItem ? `进入 W${nextWeekItem.number.toString().padStart(2, '0')} 前` : '下一阶段' }}</span>
            <p>{{ activeWeekItem?.nextStep || archive.currentFocus.nextStep || '由下一条声音证据决定。' }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section week-section compact-section">
      <div class="container section-heading-inline">
        <div>
          <p class="section-kicker">ABILITY ROUTE / 能力路线</p>
          <h2 class="section-title">交付轨道</h2>
        </div>
        <p class="section-summary compact">课程周不是倒计时。一次明确、可复现的达标证据即可前进，空项不会制造补作业债务。</p>
      </div>

      <div class="container week-rail">
        <article
          v-for="week in archive.weeks"
          :key="week.number"
          class="week-card"
          :class="[`status-${week.status}`, { active: week.number === activeWeek }]"
        >
          <div class="week-number"><span>W</span>{{ week.number.toString().padStart(2, '0') }}</div>
          <div class="week-status"><i />{{ week.statusLabel }}</div>
          <h3>{{ week.deliverable }}</h3>
          <p>{{ week.evidenceSummary || '尚无交付证据。' }}</p>
          <div v-if="week.nextStep" class="week-next"><span>下一步</span>{{ week.nextStep }}</div>
        </article>
      </div>
    </section>

    <section class="section metrics-section compact-section">
      <div class="container split-heading compact-heading">
        <div>
          <p class="section-kicker">CORE FACTS / 核心事实</p>
          <h2 class="section-title">不用百分比包装<br>音乐能力。</h2>
        </div>
        <p class="section-summary">每项只显示当前事实、目标和证据状态。没有录音验证的内容明确标记，不换算成看似精确的完成率。</p>
      </div>
      <div class="container metric-grid">
        <ProgressMetricCard
          v-for="(metric, index) in archive.metrics"
          :key="metric.id"
          :metric="metric"
          :index="index"
          :updated-at="archiveUpdatedAt"
        />
      </div>
    </section>

    <section class="section evidence-rules-section compact-section">
      <div class="container evidence-rules-grid">
        <div>
          <p class="section-kicker">EVIDENCE RULES / 证据规则</p>
          <h2 class="section-title">三种状态，<br>不互相冒充。</h2>
          <p class="archive-updated">档案更新于 {{ archiveUpdatedAt ? formatArchiveDate(archiveUpdatedAt, true) : '待确认' }}</p>
        </div>
        <div>
          <EvidenceLegend />
          <ol class="evidence-rule-list">
            <li><span>01</span><div><strong>文件事实</strong><p>文件存在、时长、格式与索引关系可以直接确认。</p></div></li>
            <li><span>02</span><div><strong>用户自评</strong><p>演奏者对结构与听感的判断，真实记录但明确标注。</p></div></li>
            <li><span>03</span><div><strong>实际回听</strong><p>只有真正听过录音后，才评价 groove、音准、留白和发音。</p></div></li>
          </ol>
        </div>
      </div>
    </section>
  </div>
</template>
