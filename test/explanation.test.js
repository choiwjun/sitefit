import test from 'node:test';
import assert from 'node:assert/strict';

import { generateReportDraft } from '../src/reporting/report-draft.js';

test('generates safe executive summary and work orders from structured issues', () => {
  const report = generateReportDraft({
    scores: { overall: 68 },
    issues: [
      {
        name: 'FAQ 섹션 부족',
        targetUrl: 'https://example.com/service',
        layer: 'aeo',
        evidence: 'FAQ 섹션 또는 질문-답변형 구조가 확인되지 않았습니다.',
        impact: 'medium',
        difficulty: 'normal',
        confidence: 'medium',
        owner: 'content owner',
        workType: 'content',
        expectedScope: 'small',
        recommendedAction: '고객 질문 5~7개와 직접 답변을 추가합니다.'
      }
    ]
  });

  assert.match(report.executiveSummary, /검색엔진과 AI 답변엔진/);
  assert.equal(report.workOrders.length, 1);
  assert.match(report.workOrders[0].instruction, /고객 질문 5~7개/);
  assert.doesNotMatch(JSON.stringify(report), /guarantee|top ranking|traffic will increase|ChatGPT will recommend/i);
});

test('includes every unique diagnosis issue in report work orders', () => {
  const issues = Array.from({ length: 7 }, (_, index) => ({
    name: `Issue ${index + 1}`,
    targetUrl: `https://example.com/page-${index + 1}`,
    layer: 'aeo',
    evidence: `Evidence ${index + 1}`,
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'content owner',
    workType: 'content',
    expectedScope: 'small',
    recommendedAction: `Fix issue ${index + 1}`
  }));

  const report = generateReportDraft({
    scores: { overall: 70 },
    issues
  });

  assert.equal(report.issueSummary.uniqueIssueCount, 7);
  assert.equal(report.workOrders.length, 7);
  assert.ok(report.workOrders.some((order) => order.issueName === 'Issue 7'));
});

test('groups repeated page issues into site-level report work orders', () => {
  const repeatedIssue = {
    name: 'FAQ 섹션 부족',
    layer: 'aeo',
    evidence: 'FAQ 섹션 또는 질문-답변형 구조가 확인되지 않았습니다.',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'content owner',
    workType: 'content',
    expectedScope: 'small',
    recommendedAction: '고객 질문 5~7개와 직접 답변을 추가합니다.'
  };

  const report = generateReportDraft({
    scores: { overall: 82 },
    issues: [
      { ...repeatedIssue, targetUrl: 'https://example.com/' },
      { ...repeatedIssue, targetUrl: 'https://example.com/service' },
      {
        name: 'sitemap.xml 누락',
        targetUrl: 'https://example.com/',
        layer: 'technical-seo',
        evidence: 'sitemap.xml을 찾을 수 없습니다.',
        impact: 'medium',
        difficulty: 'easy',
        confidence: 'high',
        owner: 'developer',
        workType: 'technical-seo',
        expectedScope: 'small',
        recommendedAction: '유효한 sitemap.xml을 생성합니다.'
      }
    ]
  });

  assert.equal(report.workOrders.length, 2);
  assert.equal(report.workOrders.filter((order) => order.issueName === 'FAQ 섹션 부족').length, 1);
  const faqOrder = report.workOrders.find((order) => order.issueName === 'FAQ 섹션 부족');
  assert.match(faqOrder.instruction, /영향 URL 2개/);
  assert.match(report.executiveSummary, /개선 유형 2개/);
});
