import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { createServer } from '../src/server.js';

test('serves diagnosis report JSON and grouped HTML for stored runs', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-report-'));
  const app = createServer({
    dataDir: dir,
    fetcher: async (url) => ({
      url,
      status: 200,
      contentType: 'text/html',
      html: '<title>Home</title><h1>Home</h1><p>No CTA here.</p>'
    })
  });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;
    const diagnoseResponse = await fetch(`${baseUrl}/api/diagnose`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ siteUrl: 'https://example.com/' })
    });
    const { run } = await diagnoseResponse.json();

    const jsonResponse = await fetch(`${baseUrl}/api/reports/${run.id}`);
    const json = await jsonResponse.json();
    assert.equal(jsonResponse.status, 200);
    assert.equal(json.run.id, run.id);

    const htmlResponse = await fetch(`${baseUrl}/reports/${run.id}`);
    const html = await htmlResponse.text();
    assert.equal(htmlResponse.status, 200);
    assert.match(html, /report-hero/);
    assert.match(html, /report-dashboard/);
    assert.match(html, /리포트 핵심 요약/);
    assert.match(html, /먼저 고칠 핵심 문제 3개/);
    assert.match(html, /상세 진단 근거 보기/);
    assert.match(html, /검증용 상세 정보/);
    assert.match(html, /한눈에 보는 진단 결과/);
    assert.match(html, /무슨 뜻인가요\?/);
    assert.match(html, /왜 중요한가요\?/);
    assert.match(html, /먼저 이렇게 고치세요/);
    assert.match(html, /검색 노출 기본|문의\/구매 전환|AI 답변 준비/);
    assert.match(html, /사이트핏 진단 리포트/);
    assert.match(html, /나머지 문제 한눈에 보기/);
    assert.match(html, /분석 근거 요약/);
    assert.match(html, /내부 링크/);
    assert.match(html, /질문형 제목/);
    assert.match(html, /엔티티/);
    assert.match(html, /상세 근거는 필요한 항목만 펼쳐보세요/);
    assert.match(html, /추정 업종 카테고리/);
    assert.match(html, /분석률/);
    assert.match(html, /수집 제외/);
    assert.match(html, /링크 점검/);
    assert.match(html, /JS 렌더링/);
    assert.match(html, /웹 품질 점수/);
    assert.match(html, /접근성/);
    assert.match(html, /보안 관행/);
    assert.match(html, /견적 전환 제안/);
    assert.match(html, /진단 신뢰 근거/);
    assert.match(html, /상담 포인트/);
    assert.doesNotMatch(html, /[0-9,]+-[0-9,]+원/);
    assert.match(html, /상담에서 범위 확정/);
    assert.doesNotMatch(html, /Lighthouse-style/);
    assert.doesNotMatch(html, /PageSpeed/);
    assert.doesNotMatch(html, /AI API/);
    assert.doesNotMatch(html, /SiteFit rule/);
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});
