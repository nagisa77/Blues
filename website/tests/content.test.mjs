import test from 'node:test'
import assert from 'node:assert/strict'
import {
  extractRepositoryLinks,
  findMarkdownTable,
  formatDuration,
  markdownField,
  markdownSection,
  parseDuration,
  plainText,
} from '../scripts/content/markdown.mjs'
import { evidenceBoundary, mergeEvidence } from '../scripts/content/evidence.mjs'
import {
  comparisonMetadata,
  metricValues,
  normalizeSessionCompletion,
  recordingFilenameMetadata,
} from '../scripts/content/domain.mjs'

test('markdown helpers preserve archive text while removing presentation syntax', () => {
  assert.equal(plainText('**完成** [一轮](target.md)<br>继续'), '完成 一轮 继续')
  assert.equal(markdownField('材料 / 调性 / 速度：A 调', '材料 / 调性 / 速度'), 'A 调')
  assert.equal(markdownSection('## 今日任务\n产出：一轮\n## 结果\n完成', '今日任务'), '产出：一轮')
})

test('markdown table parsing is header-driven and ignores unrelated tables', () => {
  const markdown = [
    '| 其他 | 值 |',
    '| --- | --- |',
    '| x | y |',
    '',
    '| 日期 | 内容 |',
    '| --- | --- |',
    '| 2026-07-20 | **录音** |',
  ].join('\n')
  assert.deepEqual(findMarkdownTable(markdown, ['日期', '内容']), [
    { 日期: '2026-07-20', 内容: '**录音**' },
  ])
})

test('repository links normalize relative paths and exclude external resources', () => {
  const links = extractRepositoryLinks(
    '[录音](../录音/a%20b.mp3) [外链](https://example.com) [日志](../日志/a.md#结果)',
    '曲目/曲目看板.md',
  )
  assert.deepEqual(links, ['录音/a b.mp3', '日志/a.md'])
})

test('duration helpers handle archive precision and display rounding', () => {
  assert.equal(parseDuration('1:02.25'), 62.25)
  assert.equal(parseDuration('bad'), null)
  assert.equal(formatDuration(3661.6), '1:01:02')
})

test('evidence rules keep file facts, self-report and review boundaries distinct', () => {
  const file = evidenceBoundary('用户自评：已完成；尚未实际回听', { fileFact: true })
  assert.deepEqual(file.sources, ['file_fact', 'self_report'])
  assert.equal(file.selfReport, 'yes')
  assert.equal(file.performanceReview, 'unreviewed')

  const reviewed = evidenceBoundary('老师实际回听：已实际回听')
  const merged = mergeEvidence(file, reviewed)
  assert.equal(merged.performanceReview, 'unreviewed')
  assert.ok(merged.sources.includes('teacher_review'))
})

test('domain rules turn filename and status conventions into stable metadata', () => {
  assert.deepEqual(
    recordingFilenameMetadata('录音/2026-07-20_W5_D2_Take_A_90bpm.mp3'),
    {
      archiveWeekToken: 'W5',
      dayToken: 'D2',
      keyToken: 'A',
      keyLabel: 'A 调',
      bpm: 90,
      tempoLabel: '90 BPM',
    },
  )
  assert.equal(normalizeSessionCompletion('是否中断待确认'), 'unknown')
  assert.equal(normalizeSessionCompletion('已完成'), 'completed')
  assert.deepEqual(metricValues('不剪辑连续演奏').targetRange, { min: 20, max: 25 })
})

test('comparison metadata only groups recordings that share a defined segment', () => {
  const song = { id: 'hide-away' }
  assert.equal(comparisonMetadata(song, '前 1 chorus 主题').comparisonGroup, 'hide-away:theme-first-chorus')
  assert.equal(comparisonMetadata(song, '完整练习').comparisonGroup, null)
})
