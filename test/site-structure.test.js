import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeSiteStructure } from '../src/diagnosis/analyze-site.js';

test('detects duplicate titles, meta descriptions, and h1 values across crawled pages', () => {
  const result = analyzeSiteStructure({
    rootUrl: 'https://example.com/',
    pageResults: [
      pageResult('https://example.com/', {
        title: 'Same title',
        metaDescription: 'Same description with enough length.',
        h1: 'Same H1',
        outgoingLinks: ['https://example.com/service']
      }),
      pageResult('https://example.com/service', {
        title: 'Same title',
        metaDescription: 'Same description with enough length.',
        h1: 'Same H1',
        outgoingLinks: ['https://example.com/']
      })
    ]
  });

  assert.ok(result.issues.some((issue) => issue.name === '중복 title 발견'));
  assert.ok(result.issues.some((issue) => issue.name === '중복 meta description 발견'));
  assert.ok(result.issues.some((issue) => issue.name === '중복 H1 발견'));
});

test('detects orphan pages from the internal link graph', () => {
  const result = analyzeSiteStructure({
    rootUrl: 'https://example.com/',
    pageResults: [
      pageResult('https://example.com/', {
        title: 'Home',
        outgoingLinks: ['https://example.com/service']
      }),
      pageResult('https://example.com/service', {
        title: 'Service',
        outgoingLinks: ['https://example.com/']
      }),
      pageResult('https://example.com/hidden', {
        title: 'Hidden',
        outgoingLinks: []
      })
    ]
  });

  const orphan = result.issues.find((issue) => issue.name === '내부링크 고립 페이지 발견');
  assert.ok(orphan);
  assert.match(orphan.evidence, /hidden/);
});

test('aggregates the primary business category across crawled pages', () => {
  const result = analyzeSiteStructure({
    rootUrl: 'https://example.com/',
    pageResults: [
      pageResult('https://example.com/', {
        title: '온라인 쇼핑몰',
        businessCategory: { id: 'commerce', label: '쇼핑몰/커머스', confidence: 3 }
      }),
      pageResult('https://example.com/product', {
        title: '상품 상세',
        businessCategory: { id: 'commerce', label: '쇼핑몰/커머스', confidence: 4 }
      }),
      pageResult('https://example.com/about', {
        title: '회사소개',
        businessCategory: { id: 'general-company', label: '일반 기업', confidence: 1 }
      })
    ]
  });

  assert.equal(result.businessCategory.id, 'commerce');
  assert.equal(result.businessCategory.pageCount, 2);
});

test('detects missing site-level page coverage for broad company categories', () => {
  const result = analyzeSiteStructure({
    rootUrl: 'https://example.com/',
    pageResults: [
      pageResult('https://example.com/', {
        title: 'Example',
        pageType: 'home',
        outgoingLinks: ['https://example.com/blog']
      }),
      pageResult('https://example.com/blog', {
        title: 'News',
        pageType: 'article',
        outgoingLinks: ['https://example.com/']
      })
    ]
  });

  assert.ok(result.issues.some((issue) => issue.name === '문의 페이지 구조 부족'));
  assert.ok(result.issues.some((issue) => issue.name === '신뢰/정책 페이지 구조 부족'));
  assert.ok(result.issues.some((issue) => issue.name === '핵심 상품/서비스 페이지 구조 부족'));
});

test('detects same-origin internal links that were not collected during crawl', () => {
  const result = analyzeSiteStructure({
    rootUrl: 'https://example.com/',
    pageResults: [
      pageResult('https://example.com/', {
        title: 'Home',
        pageType: 'home',
        outgoingLinks: [
          'https://example.com/service',
          'https://example.com/missing',
          'https://external.example.com/resource'
        ]
      }),
      pageResult('https://example.com/service', {
        title: 'Service',
        pageType: 'service',
        outgoingLinks: ['https://example.com/']
      })
    ]
  });

  const issue = result.issues.find((item) => item.name === '내부 링크 대상 미수집');
  assert.ok(issue);
  assert.match(issue.evidence, /missing/);
});

function pageResult(url, metadata) {
  return {
    url,
    metadata: {
      title: '',
      metaDescription: '',
      h1: '',
      outgoingLinks: [],
      ...metadata
    }
  };
}
