const ISSUE_DEFS = {
  commerceBuyingInfo: {
    layer: 'conversion',
    name: '쇼핑몰 구매 정보 부족',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'planner',
    workType: 'commerce-seo',
    expectedScope: 'medium',
    recommendedAction: '상품 구매 전 필요한 배송, 교환, 반품, 환불, 결제, 리뷰 정보를 상품/카테고리 페이지에 명확히 보강합니다.'
  },
  regulatedWording: {
    layer: 'geo',
    name: '규제 업종 표현 검토 필요',
    impact: 'high',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'planner',
    workType: 'content',
    expectedScope: 'medium',
    recommendedAction: '성과 보장, 최고 표현, 후기, 수익·치료·결과 단정 표현을 업종별 광고 규정에 맞게 검토합니다.'
  },
  manufacturingDetail: {
    layer: 'search-understanding',
    name: '제조 제품 상세 정보 부족',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'content owner',
    workType: 'content',
    expectedScope: 'medium',
    recommendedAction: '제품 사양, 규격, 소재, 인증, 적용 산업, 납기, 도면/자료 요청 같은 제조 구매 판단 정보를 보강합니다.'
  },
  educationDetail: {
    layer: 'aeo',
    name: '교육 과정 정보 부족',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'content owner',
    workType: 'content',
    expectedScope: 'medium',
    recommendedAction: '커리큘럼, 강사, 수강 대상, 일정, 수강료, 결과물, 수강 후기 등 교육 선택 정보를 보강합니다.'
  },
  b2bDecisionInfo: {
    layer: 'geo',
    name: 'B2B 의사결정 자료 부족',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'planner',
    workType: 'landing-page-improvement',
    expectedScope: 'medium',
    recommendedAction: '고객사, 사례, 도입 절차, 견적 기준, 비교표, 보안/운영 근거 등 B2B 의사결정 자료를 보강합니다.'
  }
};

export function analyzeIndustryRules({ businessCategory, pageResults = [] } = {}) {
  const categoryId = businessCategory?.id || 'unknown';
  const text = searchableText(pageResults);
  const issues = [];

  if (categoryId === 'commerce' && countMatches(text, ['배송', '교환', '반품', '환불', '결제', '리뷰', 'shipping', 'return', 'refund', 'payment', 'review']) < 2) {
    issues.push(issue(pageResults[0]?.url, ISSUE_DEFS.commerceBuyingInfo, '쇼핑몰/커머스 사이트에서 배송, 교환, 반품, 환불, 결제, 리뷰 정보가 충분히 확인되지 않았습니다.'));
  }

  if (['healthcare', 'legal', 'finance'].includes(categoryId) && hasRegulatedRisk(text, categoryId)) {
    issues.push(issue(pageResults[0]?.url, ISSUE_DEFS.regulatedWording, `${businessCategory?.label || categoryId} 업종에서 보장성 또는 과장 가능성이 있는 표현이 확인되어 검토가 필요합니다.`));
  }

  if (categoryId === 'manufacturing' && countMatches(text, ['사양', '규격', '소재', '인증', '적용', '산업', '납기', '도면', 'spec', 'certification']) < 2) {
    issues.push(issue(pageResults[0]?.url, ISSUE_DEFS.manufacturingDetail, '제조/산업 사이트에서 제품 사양, 규격, 인증, 적용 산업, 납기 같은 구매 판단 정보가 충분히 확인되지 않았습니다.'));
  }

  if (categoryId === 'education' && countMatches(text, ['커리큘럼', '강사', '수강', '일정', '수강료', '과정', '후기', 'curriculum', 'course']) < 2) {
    issues.push(issue(pageResults[0]?.url, ISSUE_DEFS.educationDetail, '교육/학원 사이트에서 커리큘럼, 강사, 일정, 수강료, 후기 등 과정 선택 정보가 충분히 확인되지 않았습니다.'));
  }

  if (categoryId === 'b2b-service' && countMatches(text, ['사례', '고객사', '프로세스', '절차', '견적', '비교', '보안', '운영', 'case', 'client']) < 2) {
    issues.push(issue(pageResults[0]?.url, ISSUE_DEFS.b2bDecisionInfo, 'B2B 서비스 사이트에서 사례, 고객사, 도입 절차, 견적 기준, 비교 자료 등 의사결정 정보가 충분히 확인되지 않았습니다.'));
  }

  return {
    businessCategory,
    issues
  };
}

function searchableText(pageResults) {
  return pageResults.map((result) => [
    result.url,
    result.summary,
    result.metadata?.title,
    result.metadata?.h1,
    result.metadata?.metaDescription,
    result.metadata?.businessCategory?.label
  ].filter(Boolean).join(' ')).join(' ').toLowerCase();
}

function countMatches(text, keywords) {
  return keywords.reduce((count, keyword) => (
    text.includes(String(keyword).toLowerCase()) ? count + 1 : count
  ), 0);
}

function hasRegulatedRisk(text, categoryId) {
  const common = /100%|보장|최고|유일|무조건|확실|1위/.test(text);
  if (categoryId === 'healthcare') return common || /완치|치료\s*효과|부작용\s*없|환자\s*후기/.test(text);
  if (categoryId === 'legal') return common || /승소율|승소\s*보장|전문\s*변호사|반드시\s*승소/.test(text);
  if (categoryId === 'finance') return common || /수익\s*보장|원금\s*보장|고수익|무위험/.test(text);
  return common;
}

function issue(targetUrl, definition, evidence) {
  return {
    ...definition,
    targetUrl: targetUrl || '확인 필요',
    evidence,
    consultationCta: '이 작업 범위 상담 요청'
  };
}
