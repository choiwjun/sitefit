import test from 'node:test';
import assert from 'node:assert/strict';

import { validateResolvedCrawlUrl } from '../src/security/resolved-url-policy.js';

test('rejects public hostname when DNS resolves to private IP', async () => {
  const result = await validateResolvedCrawlUrl('https://example.com/', {
    lookup: async () => [{ address: '10.0.0.2', family: 4 }]
  });

  assert.equal(result.ok, false);
  assert.match(result.reason, /내부망|차단/);
});

test('accepts public hostname when DNS resolves to public IP', async () => {
  const result = await validateResolvedCrawlUrl('https://example.com/', {
    lookup: async () => [{ address: '93.184.216.34', family: 4 }]
  });

  assert.equal(result.ok, true);
  assert.equal(result.url, 'https://example.com/');
});
