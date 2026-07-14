<script setup lang="ts">
const archive = useArchive()
const activeWeek = archive.stats.activeProgramWeek || 5

useSeoMeta({
  title: '进度看板 · Tim / Blues',
  description: 'Tim 的 8 周 Blues 路线、核心能力指标与证据状态。',
})
</script>

<template>
  <div>
    <section class="page-hero progress-page-hero">
      <div class="container page-hero-grid">
        <div>
          <p class="eyebrow"><span /> PROGRESS / 进度看板</p>
          <h1>数字给方向。<br><em>录音负责证明。</em></h1>
        </div>
        <div class="progress-hero-ring">
          <div>
            <strong>{{ activeWeek }}</strong>
            <span>/ 08</span>
          </div>
          <p>当前能力层级</p>
        </div>
      </div>
    </section>

    <section class="section week-section">
      <div class="container section-heading-inline">
        <div>
          <p class="section-kicker">8-WEEK ROUTE / 八周路线</p>
          <h2 class="section-title">交付轨道</h2>
        </div>
        <p class="section-summary compact">课程周与日历周分开：当前进入第 {{ activeWeek }} 周能力层级，不用表格空项把已会内容拉回去。</p>
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
          <div v-if="week.nextStep" class="week-next">
            <span>下一步</span>
            {{ week.nextStep }}
          </div>
        </article>
      </div>
    </section>

    <section class="section metrics-section">
      <div class="container split-heading">
        <div>
          <p class="section-kicker">CORE METRICS / 核心指标</p>
          <h2 class="section-title">只统计会影响<br>课程决策的事实。</h2>
        </div>
        <p class="section-summary">没有数字就显示“待验证”。用户自评不是空白，但也不会被包装成老师已经听过。</p>
      </div>
      <div class="container metric-grid">
        <ProgressMetricCard
          v-for="(metric, index) in archive.metrics"
          :key="metric.id"
          :metric="metric"
          :index="index"
        />
      </div>
    </section>

    <section class="section evidence-rules-section">
      <div class="container evidence-rules-grid">
        <div>
          <p class="section-kicker">EVIDENCE RULES / 证据规则</p>
          <h2 class="section-title">三种状态，<br>不互相冒充。</h2>
        </div>
        <ol class="evidence-rule-list">
          <li><span>01</span><div><strong>文件事实</strong><p>文件存在、时长、格式与索引关系可以直接确认。</p></div></li>
          <li><span>02</span><div><strong>用户自评</strong><p>演奏者对结构与听感的判断，真实记录但明确标注。</p></div></li>
          <li><span>03</span><div><strong>实际回听</strong><p>只有真正听过录音后，才评价 groove、音准、留白和发音。</p></div></li>
        </ol>
      </div>
    </section>
  </div>
</template>
