import test from 'node:test';
import assert from 'node:assert/strict';

import { generateReportDraft } from '../src/reporting/report-draft.js';

test('report draft adds plain-language explanations for non-technical readers', () => {
  const report = generateReportDraft({
    scores: { overall: 62 },
    issues: [
      {
        name: '메타 설명 누락',
        layer: 'technical-seo',
        impact: 'medium',
        expectedScope: 'small',
        owner: 'developer',
        confidence: 'high',
        targetUrl: 'https://example.com/',
        evidence: 'meta description 태그가 없습니다.',
        recommendedAction: '검색 결과 요약 문구를 작성합니다.',
        workType: 'technical-seo'
      },
      {
        name: '주요 상담 CTA 부족',
        layer: 'conversion',
        impact: 'high',
        expectedScope: 'medium',
        owner: 'planner',
        confidence: 'high',
        targetUrl: 'https://example.com/',
        evidence: '상담 버튼을 찾기 어렵습니다.',
        recommendedAction: '상담 신청 버튼과 안내 문구를 보강합니다.',
        workType: 'conversion-improvement'
      }
    ]
  });

  assert.equal(report.plainLanguageSummary.title, '한눈에 보는 진단 결과');
  assert.match(report.plainLanguageSummary.customerImpact, /방문자|고객/);
  assert.match(report.plainLanguageSummary.firstAction, /상담|검색|문의|구매|버튼|연락/);
  assert.equal(report.workOrders[0].plainLabel, '문의/구매 전환');
  assert.match(report.workOrders[0].plainMeaning, /문의|구매|상담/);
  assert.match(report.workOrders[0].plainWhyItMatters, /방문자|고객/);
  assert.match(report.workOrders[0].plainFirstFix, /먼저|버튼|안내|요약/);
});
