import test from 'node:test';
import assert from 'node:assert/strict';

import { loadConfig } from '../src/config.js';

test('loads default runtime configuration', () => {
  const config = loadConfig({});

  assert.equal(config.port, 3000);
  assert.equal(config.crawler.maxPages, 50);
  assert.equal(config.crawler.maxDepth, 2);
  assert.equal(config.crawler.maxBytes, 512000);
  assert.equal(config.crawler.maxQueryParams, 8);
  assert.equal(config.crawler.maxLinkChecks, 100);
  assert.equal(config.crawler.renderJavaScript, 'auto');
  assert.equal(config.crawler.renderer, 'none');
  assert.equal(config.ai.provider, 'mock');
});

test('uses bounded crawler defaults in Vercel functions', () => {
  const config = loadConfig({ VERCEL: '1' });

  assert.equal(config.crawler.maxPages, 3);
  assert.equal(config.crawler.maxDepth, 1);
  assert.equal(config.crawler.maxLinkChecks, 8);
});

test('parses numeric environment overrides', () => {
  const config = loadConfig({
    PORT: '4100',
    CRAWLER_MAX_PAGES: '5',
    CRAWLER_MAX_DEPTH: '1',
    CRAWLER_MAX_BYTES: '1024',
    CRAWLER_MAX_QUERY_PARAMS: '3',
    CRAWLER_MAX_LINK_CHECKS: '7',
    CRAWLER_RENDER_JS: 'always',
    CRAWLER_RENDERER: 'playwright',
    AI_PROVIDER: 'mock'
  });

  assert.equal(config.port, 4100);
  assert.equal(config.crawler.maxPages, 5);
  assert.equal(config.crawler.maxDepth, 1);
  assert.equal(config.crawler.maxBytes, 1024);
  assert.equal(config.crawler.maxQueryParams, 3);
  assert.equal(config.crawler.maxLinkChecks, 7);
  assert.equal(config.crawler.renderJavaScript, 'always');
  assert.equal(config.crawler.renderer, 'playwright');
  assert.equal(config.ai.provider, 'mock');
});
