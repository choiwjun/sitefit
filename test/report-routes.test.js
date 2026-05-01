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
    assert.match(html, /사이트핏 진단 리포트/);
    assert.match(html, /주요 개선 유형/);
    assert.match(html, /분석 근거 요약/);
    assert.match(html, /내부 링크/);
    assert.match(html, /질문형 제목/);
    assert.match(html, /엔티티/);
    assert.match(html, /작업지시서/);
    assert.match(html, /추정 업종 카테고리/);
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});
