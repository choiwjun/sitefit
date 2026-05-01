import test from 'node:test';
import assert from 'node:assert/strict';

import { crawlSite, readResponseTextWithLimit } from '../src/crawler/crawl-site.js';

test('crawls same-origin HTML pages up to the configured page limit', async () => {
  const pages = new Map([
    ['https://example.com/', '<a href="/service">Service</a><a href="https://other.test/">Other</a>'],
    ['https://example.com/service', '<a href="/contact">Contact</a>'],
    ['https://example.com/contact', '<p>Contact us</p>']
  ]);

  const result = await crawlSite('https://example.com/', {
    maxPages: 2,
    fetcher: async (url) => ({
      url,
      status: 200,
      contentType: 'text/html',
      html: pages.get(url)
    })
  });

  assert.deepEqual(result.pages.map((page) => page.url), [
    'https://example.com/',
    'https://example.com/service'
  ]);
  assert.equal(result.skipped.some((item) => item.reason === 'external_origin'), true);
});

test('rejects blocked crawl roots before fetching', async () => {
  const result = await crawlSite('http://127.0.0.1/admin', {
    fetcher: async () => {
      throw new Error('fetcher should not be called');
    }
  });

  assert.equal(result.pages.length, 0);
  assert.equal(result.errors[0].code, 'invalid_root_url');
});

test('skips oversized pages and strips URL hashes while preserving query limits', async () => {
  const result = await crawlSite('https://example.com/', {
    maxBytes: 20,
    fetcher: async (url) => ({
      url,
      status: 200,
      contentType: 'text/html',
      html: '<p>This page is intentionally too large for the configured limit.</p>'
    })
  });

  assert.equal(result.pages.length, 0);
  assert.equal(result.skipped[0].reason, 'oversized_html');
});

test('uses resolved DNS policy before fetching pages when lookup is provided', async () => {
  const result = await crawlSite('https://example.com/', {
    lookup: async () => [{ address: '192.168.1.5', family: 4 }],
    fetcher: async () => {
      throw new Error('fetcher should not be called');
    }
  });

  assert.equal(result.pages.length, 0);
  assert.equal(result.errors[0].code, 'invalid_root_url');
});

test('respects maxDepth while crawling same-origin links', async () => {
  const pages = new Map([
    ['https://example.com/', '<a href="/level-1">Level 1</a>'],
    ['https://example.com/level-1', '<a href="/level-2">Level 2</a>'],
    ['https://example.com/level-2', '<p>Too deep</p>']
  ]);

  const result = await crawlSite('https://example.com/', {
    maxPages: 10,
    maxDepth: 1,
    fetcher: async (url) => ({
      url,
      status: 200,
      contentType: 'text/html',
      html: pages.get(url)
    })
  });

  assert.deepEqual(result.pages.map((page) => page.url), [
    'https://example.com/',
    'https://example.com/level-1'
  ]);
  assert.equal(result.skipped.some((item) => item.reason === 'max_depth'), true);
});

test('uses same-origin seed URLs when the root page has no links', async () => {
  const pages = new Map([
    ['https://example.com/', '<p>Home</p>'],
    ['https://example.com/service', '<p>Service</p>']
  ]);

  const result = await crawlSite('https://example.com/', {
    maxPages: 5,
    seedUrls: ['https://example.com/service', 'https://other.example/page'],
    fetcher: async (url) => ({
      url,
      status: 200,
      contentType: 'text/html',
      html: pages.get(url)
    })
  });

  assert.deepEqual(result.pages.map((page) => page.url), [
    'https://example.com/',
    'https://example.com/service'
  ]);
  assert.equal(result.skipped.some((item) => item.reason === 'external_seed'), true);
});

test('skips robots-disallowed seed URLs and same-origin links', async () => {
  const pages = new Map([
    ['https://example.com/', '<a href="/private/page">Private</a><a href="/public">Public</a>'],
    ['https://example.com/public', '<p>Public page</p>']
  ]);

  const result = await crawlSite('https://example.com/', {
    maxPages: 10,
    disallowPaths: ['/private'],
    seedUrls: ['https://example.com/private/from-sitemap'],
    fetcher: async (url) => {
      assert.notEqual(url.startsWith('https://example.com/private'), true);
      return {
        url,
        status: 200,
        contentType: 'text/html',
        html: pages.get(url)
      };
    }
  });

  assert.deepEqual(result.pages.map((page) => page.url), [
    'https://example.com/',
    'https://example.com/public'
  ]);
  assert.equal(result.skipped.filter((item) => item.reason === 'robots_disallow').length, 2);
});

test('stops reading streamed responses after the configured byte limit', async () => {
  const encoder = new TextEncoder();
  let cancelled = false;
  const response = {
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('12345'));
        controller.enqueue(encoder.encode('67890'));
      },
      cancel() {
        cancelled = true;
      }
    }),
    text: async () => {
      throw new Error('response.text should not be used for streaming bodies');
    }
  };

  const result = await readResponseTextWithLimit(response, 6);

  assert.equal(result.exceeded, true);
  assert.equal(cancelled, true);
  assert.equal(Buffer.byteLength(result.text, 'utf8') <= 6, true);
});

test('skips URLs with too many query parameters', async () => {
  const pages = new Map([
    ['https://example.com/', '<a href="/search?a=1&b=2&c=3">Noisy search</a><a href="/service?ref=home">Service</a>'],
    ['https://example.com/service?ref=home', '<p>Service</p>']
  ]);

  const result = await crawlSite('https://example.com/', {
    maxPages: 10,
    maxQueryParams: 2,
    fetcher: async (url) => ({
      url,
      status: 200,
      contentType: 'text/html',
      html: pages.get(url)
    })
  });

  assert.deepEqual(result.pages.map((page) => page.url), [
    'https://example.com/',
    'https://example.com/service?ref=home'
  ]);
  assert.equal(result.skipped.some((item) => item.reason === 'query_limit'), true);
});

test('uses a JavaScript renderer for sparse SPA shells and crawls rendered links', async () => {
  const fetched = new Map([
    ['https://spa.example.com/', '<!doctype html><html><head><title>App</title></head><body><div id="root"></div><script src="/app.js"></script></body></html>'],
    ['https://spa.example.com/service', '<title>Service</title><h1>Service</h1><p>Rendered route.</p>']
  ]);

  const result = await crawlSite('https://spa.example.com/', {
    maxPages: 2,
    fetcher: async (url) => ({
      url,
      status: 200,
      contentType: 'text/html',
      html: fetched.get(url)
    }),
    renderer: async (url) => ({
      url,
      status: 200,
      contentType: 'text/html',
      html: '<title>SPA Home</title><h1>SPA Home</h1><p>React rendered service content with consultation CTA.</p><a href="/service">Service</a>',
      performance: {
        lcpMs: 3200,
        cls: 0.18,
        totalBlockingTimeMs: 420,
        transferSizeBytes: 1_800_000,
        resourceCount: 95
      }
    })
  });

  assert.equal(result.pages[0].rendered, true);
  assert.equal(result.pages[0].html.includes('SPA Home'), true);
  assert.equal(result.pages[0].performance.lcpMs, 3200);
  assert.deepEqual(result.pages.map((page) => page.url), [
    'https://spa.example.com/',
    'https://spa.example.com/service'
  ]);
});
