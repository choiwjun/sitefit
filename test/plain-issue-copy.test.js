import test from 'node:test';
import assert from 'node:assert/strict';

import { plainIssueCopy } from '../src/reporting/plain-language.js';

test('plain issue copy uses issue-specific categories before broad keyword matching', () => {
  assertPlainCopy({
    issueName: '리다이렉트 링크 발견',
    layer: 'technical-seo',
    instruction: '리다이렉트를 거치는 링크는 가능하면 최종 도착 URL로 직접 연결합니다.',
    label: '검색 노출 기본',
    meaning: /링크가 돌아가거나 끊겨/
  });

  assertPlainCopy({
    issueName: '신뢰 근거 페이지 부족',
    layer: 'geo',
    instruction: '회사소개, 연락처, 개인정보처리방침, 사례, 후기, 인증 등 신뢰 근거 페이지를 추가하거나 노출합니다.',
    label: 'AI 신뢰 근거',
    meaning: /믿을 만한지 판단할 근거/
  });

  assertPlainCopy({
    issueName: 'canonical 링크 누락',
    layer: 'technical-seo',
    instruction: '대표 URL이 명확한 페이지에는 canonical 링크 적용을 검토합니다.',
    label: '검색 노출 기본',
    meaning: /어떤 주소와 설명/
  });

  assertPlainCopy({
    issueName: '문자 인코딩 선언 누락',
    layer: 'technical-seo',
    instruction: 'head 영역에 <meta charset="utf-8"> 선언을 추가합니다.',
    label: '사용 편의성',
    meaning: /모바일, 속도, 화면 표시/
  });

  assertPlainCopy({
    issueName: '주요 상담 CTA 부족',
    layer: 'conversion',
    instruction: '문의, 상담, 견적, 전화, 구매 등 주요 전환 버튼을 명확히 배치합니다.',
    label: '문의/구매 전환',
    meaning: /다음 행동/
  });
});

function assertPlainCopy({ issueName, layer, instruction, label, meaning }) {
  const copy = plainIssueCopy({ issueName, layer, instruction });

  assert.equal(copy.plainTitle, issueName);
  assert.equal(copy.plainLabel, label);
  assert.match(copy.plainMeaning, meaning);
}
