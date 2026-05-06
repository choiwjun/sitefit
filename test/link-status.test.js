import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeLinkStatus } from '../src/diagnosis/link-status.js';

test('detects broken links, server errors, and redirected links from extracted page links', async () => {
  const result = await analyzeLinkStatus({
    rootUrl: 'https://example.com/',
    pageResults: [
      pageResult('https://example.com/', [
        'https://example.com/about',
        'https://example.com/missing',
        'https://example.com/old',
        'https://external.example.org/down'
      ])
    ],
    fetcher: async (url) => {
      if (url.endsWith('/missing')) return { url, status: 404 };
      if (url.endsWith('/old')) return { url: 'https://example.com/new', status: 301 };
      if (url.includes('external.example.org')) return { url, status: 503 };
      return { url, status: 200 };
    }
  });

  assert.equal(result.checkedLinks.length, 4);
  assert.ok(result.issues.some((issue) => issue.name === '깨진 링크 발견'));
  assert.ok(result.issues.some((issue) => issue.name === '링크 대상 서버 오류'));
  assert.ok(result.issues.some((issue) => issue.name === '리다이렉트 링크 발견'));
});

test('skips unsafe or duplicate links before checking status', async () => {
  let callCount = 0;
  const result = await analyzeLinkStatus({
    rootUrl: 'https://example.com/',
    pageResults: [
      pageResult('https://example.com/', [
        'https://example.com/about',
        'https://example.com/about',
        'http://127.0.0.1/admin'
      ])
    ],
    fetcher: async (url) => {
      callCount += 1;
      return { url, status: 200 };
    }
  });

  assert.equal(callCount, 1);
  assert.equal(result.checkedLinks.length, 1);
  assert.equal(result.skippedLinks.length, 1);
  assert.equal(result.issues.length, 0);
});

test('detects redirect chains when status checks expose hop counts', async () => {
  const result = await analyzeLinkStatus({
    rootUrl: 'https://example.com/',
    pageResults: [
      pageResult('https://example.com/', [
        'https://example.com/old-campaign'
      ])
    ],
    fetcher: async (url) => ({
      url: 'https://example.com/final-campaign',
      status: 200,
      redirectCount: 3,
      redirectChain: [url, 'https://example.com/step-1', 'https://example.com/step-2', 'https://example.com/final-campaign']
    })
  });

  assert.equal(result.checkedLinks[0].redirectCount, 3);
  assert.ok(result.issues.some((issue) => issue.name === '리다이렉트 체인 과다'));
});

test('checks link statuses concurrently within the configured limit', async () => {
  let inFlight = 0;
  let maxInFlight = 0;
  const releases = [];

  const promise = analyzeLinkStatus({
    rootUrl: 'https://example.com/',
    maxLinks: 3,
    pageResults: [
      pageResult('https://example.com/', [
        'https://example.com/a',
        'https://example.com/b',
        'https://example.com/c',
        'https://example.com/d'
      ])
    ],
    fetcher: async (url) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => releases.push(resolve));
      inFlight -= 1;
      return { url, status: 200 };
    }
  });

  await waitFor(() => releases.length === 3);
  assert.equal(maxInFlight, 3);
  releases.splice(0).forEach((release) => release());

  const result = await promise;
  assert.equal(result.checkedLinks.length, 3);
});

function pageResult(url, outgoingLinks) {
  return {
    url,
    metadata: { outgoingLinks }
  };
}

async function waitFor(predicate) {
  const startedAt = Date.now();
  while (!predicate()) {
    if (Date.now() - startedAt > 1000) {
      throw new Error('condition was not met before timeout');
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}
