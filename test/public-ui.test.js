import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';

test('public diagnosis form only asks for the site URL before analysis', async () => {
  const html = await readFile('public/index.html', 'utf8');

  assert.match(html, /name="siteUrl"/);
  assert.match(html, /URL 진단 시작/);
  assert.doesNotMatch(html, /name="industry"/);
  assert.doesNotMatch(html, /name="goal"/);
});

test('public result does not cap work orders at five items', async () => {
  const script = await readFile('public/app.js', 'utf8');

  assert.doesNotMatch(script, /workOrders\s*\|\|\s*\[\]\)\.slice\(0,\s*5\)/);
});

test('public result copy is Korean and presents actual analyzed issues', async () => {
  const script = await readFile('public/app.js', 'utf8');

  assert.match(script, /전체 실제 분석 이슈/);
  assert.match(script, /분석 근거 요약/);
  assert.match(script, /robots/);
  assert.match(script, /내부 링크/);
  assert.match(script, /질문형 제목/);
  assert.match(script, /직접 답변/);
  assert.match(script, /엔티티/);
  assert.match(script, /추정 업종 카테고리/);
  assert.match(script, /주요 개선 유형/);
  assert.match(script, /진단을 진행하고 있습니다/);
  assert.doesNotMatch(script, /mock 분석/);
});

test('public diagnosis result is grouped into readable summary sections', async () => {
  const script = await readFile('public/app.js', 'utf8');
  const css = await readFile('public/styles.css', 'utf8');

  assert.match(script, /핵심 요약/);
  assert.match(script, /우선 개선 항목/);
  assert.match(script, /진단 영역별 결과/);
  assert.match(script, /페이지별 분석 근거/);
  assert.match(script, /전체 이슈 펼쳐보기/);
  assert.match(script, /renderIssueGroup/);
  assert.match(script, /renderPriorityIssues/);
  assert.match(css, /\.result-overview/);
  assert.match(css, /\.issue-group-grid/);
  assert.match(css, /\.readable-issue-card/);
});
