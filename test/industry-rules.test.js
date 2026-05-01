import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeIndustryRules } from '../src/diagnosis/industry-rules.js';

test('detects commerce required buying information gaps', () => {
  const result = analyzeIndustryRules({
    businessCategory: { id: 'commerce', label: '쇼핑몰/커머스' },
    pageResults: [
      pageResult('https://shop.example.com/', '프리미엄 상품 소개 구매 장바구니')
    ]
  });

  assert.ok(result.issues.some((issue) => issue.name === '쇼핑몰 구매 정보 부족'));
});

test('detects regulated wording risk for healthcare pages', () => {
  const result = analyzeIndustryRules({
    businessCategory: { id: 'healthcare', label: '병원/의료' },
    pageResults: [
      pageResult('https://clinic.example.com/', '피부과 여드름 완치 100% 효과 최고 진료 후기')
    ]
  });

  assert.ok(result.issues.some((issue) => issue.name === '규제 업종 표현 검토 필요'));
});

test('detects manufacturing product detail gaps', () => {
  const result = analyzeIndustryRules({
    businessCategory: { id: 'manufacturing', label: '제조/산업' },
    pageResults: [
      pageResult('https://factory.example.com/', '산업 부품 제조 납품 회사소개')
    ]
  });

  assert.ok(result.issues.some((issue) => issue.name === '제조 제품 상세 정보 부족'));
});

function pageResult(url, text) {
  return {
    url,
    metadata: { title: text, h1: text, metaDescription: text },
    summary: text
  };
}
