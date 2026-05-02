import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';

test('admin UI exposes a sales pipeline workspace with notes, estimates, and rediagnosis history', async () => {
  const html = await readFile('public/admin.html', 'utf8');

  assert.match(html, /영업 파이프라인/);
  assert.match(html, /상담 이력/);
  assert.match(html, /견적 상태/);
  assert.match(html, /재진단 히스토리/);
  assert.match(html, /data-pipeline-board/);
  assert.match(html, /\/api\/admin\/notes/);
  assert.match(html, /\/api\/rediagnosis\/compare/);
  assert.match(html, /renderSalesNextActions/);
  assert.match(html, /salesConversion/);
  assert.match(html, /추천 패키지/);
});
