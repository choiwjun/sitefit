import test from 'node:test';
import assert from 'node:assert/strict';

import { validateCrawlUrl } from '../src/security/url-policy.js';

test('accepts public http and https URLs and normalizes missing trailing slash', () => {
  const result = validateCrawlUrl('https://example.com');

  assert.equal(result.ok, true);
  assert.equal(result.url, 'https://example.com/');
});

test('rejects localhost and private network crawl targets', () => {
  const targets = [
    'http://localhost:3000',
    'http://127.0.0.1',
    'http://10.0.0.5',
    'http://172.16.0.1',
    'http://192.168.1.1',
    'http://169.254.169.254/latest/meta-data'
  ];

  for (const target of targets) {
    const result = validateCrawlUrl(target);
    assert.equal(result.ok, false, target);
    assert.match(result.reason, /내부망|사설|localhost/);
  }
});

test('rejects unsupported protocols', () => {
  const result = validateCrawlUrl('file:///C:/Windows/System32/drivers/etc/hosts');

  assert.equal(result.ok, false);
  assert.match(result.reason, /프로토콜/);
});
