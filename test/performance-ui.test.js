import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';

test('public and shared reports expose lightweight performance evidence', async () => {
  const publicScript = await readFile('public/app.js', 'utf8');
  const reportRenderer = await readFile('src/reporting/render-report-html.js', 'utf8');

  assert.match(publicScript, /performanceStats/);
  assert.match(publicScript, /렌더 차단 CSS/);
  assert.match(publicScript, /LCP/);
  assert.match(publicScript, /CLS/);
  assert.match(reportRenderer, /performanceStats/);
  assert.match(reportRenderer, /렌더 차단 CSS/);
  assert.match(reportRenderer, /LCP/);
  assert.match(reportRenderer, /CLS/);
});
