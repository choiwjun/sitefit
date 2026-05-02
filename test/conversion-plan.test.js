import test from 'node:test';
import assert from 'node:assert/strict';

import { createSalesConversionPlan, createTrustEvidenceSummary } from '../src/sales/conversion-plan.js';

test('creates a sales conversion plan from diagnosis issues', () => {
  const plan = createSalesConversionPlan({
    scores: {
      overall: 62,
      conversion: 48,
      'technical-seo': 71
    },
    businessCategory: {
      label: 'B2B 서비스',
      confidence: 3
    },
    issues: [
      { name: 'canonical 링크 누락', workType: 'technical-seo', impact: 'medium', expectedScope: 'small', difficulty: 'easy', owner: 'developer' },
      { name: '주요 상담 CTA 부족', workType: 'conversion-improvement', impact: 'high', expectedScope: 'medium', difficulty: 'normal', owner: 'planner' },
      { name: 'FAQ 섹션 부족', workType: 'content', impact: 'medium', expectedScope: 'medium', difficulty: 'normal', owner: 'content owner' }
    ],
    workOrders: [
      { issueName: 'canonical 링크 누락', expectedScope: 'small', impact: 'medium' },
      { issueName: '주요 상담 CTA 부족', expectedScope: 'medium', impact: 'high' },
      { issueName: 'FAQ 섹션 부족', expectedScope: 'medium', impact: 'medium' }
    ]
  });

  assert.equal(plan.ctaLabel, '진단 결과 기반 개선안 받기');
  assert.equal(plan.selfServeIssueCount, 1);
  assert.equal(plan.expertRequiredIssueCount, 2);
  assert.equal(plan.recommendedPackages.length >= 2, true);
  assert.equal(plan.recommendedPackages[0].matchedIssueCount > 0, true);
  assert.equal(typeof plan.salesTalkTrack.headline, 'string');
  assert.match(plan.salesTalkTrack.headline, /B2B 서비스|전환|기술|상담/);
  assert.ok(plan.salesTalkTrack.talkingPoints.length >= 3);
  assert.equal(typeof plan.recommendedPackages[0].salesAngle, 'string');
  assert.match(plan.recommendedPackages[0].salesAngle, /영향|문의|검색|상담|전환/);
  assert.match(plan.estimatedTimeline, /주/);
  assert.ok(plan.nextActions.some((item) => item.includes('견적')));
});

test('summarizes trust evidence from coverage and rule scoring', () => {
  const summary = createTrustEvidenceSummary({
    analysisCoverage: {
      analyzedPages: 8,
      discoveredUrls: 10,
      analysisRate: 80,
      checkedLinks: 42,
      maxLinkChecks: 100,
      renderedPages: 2
    },
    webQualityScores: {
      source: 'sitefit-rules',
      performance: 72,
      accessibility: 81,
      bestPractices: 76,
      seo: 69
    },
    issues: [{ name: 'A' }, { name: 'B' }]
  });

  assert.equal(summary.source, 'sitefit-rules');
  assert.equal(summary.items.length >= 4, true);
  assert.ok(summary.items.some((item) => item.label === '분석률' && item.value === '80%'));
  assert.ok(summary.items.some((item) => item.label === '링크 점검' && item.value === '42/100'));
});
