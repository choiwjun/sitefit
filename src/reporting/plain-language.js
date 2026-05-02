export function createPlainLanguageSummary({ scores = {}, workOrders = [], issueSummary = {} } = {}) {
  const ordered = [...workOrders].sort((a, b) => impactWeight(b.impact) - impactWeight(a.impact));
  const top = ordered[0];
  const topCopy = top ? plainIssueCopy(top) : null;
  const issueCount = issueSummary.uniqueIssueCount ?? workOrders.length;
  const score = Number(scores.overall ?? 0);

  return {
    title: '한눈에 보는 진단 결과',
    scoreMeaning: scoreMeaning(score),
    customerImpact: topCopy
      ? `${topCopy.plainWhyItMatters} 현재는 ${issueCount}개 개선 유형 중 "${topCopy.plainTitle}"부터 확인하는 것이 좋습니다.`
      : '방문자가 사이트 내용을 이해하고 문의까지 이동하는 흐름에서 큰 막힘은 적게 확인되었습니다.',
    firstAction: topCopy
      ? topCopy.plainFirstFix
      : '현재 좋은 구조를 유지하면서 새 페이지를 추가할 때 제목, 설명, 문의 버튼을 함께 점검하세요.'
  };
}

export function enrichWorkOrderPlainLanguage(workOrder = {}) {
  return {
    ...workOrder,
    ...plainIssueCopy(workOrder)
  };
}

export function plainIssueCopy(issue = {}) {
  const name = issue.issueName || issue.name || '개선 항목';
  const layer = issue.layer || 'review';
  const exact = exactPlainIssueCopy(name);
  if (exact) return exact;
  const text = `${name} ${issue.instruction || issue.evidence || ''}`;

  if (matches(text, ['CTA', '상담', '문의', '구매', '전환', '연락', '가격', '견적', '결제', '환불', '배송'])) {
    return copy({
      title: name,
      label: '문의/구매 전환',
      meaning: '방문자가 문의나 구매 같은 다음 행동을 바로 선택하기 어렵다는 뜻입니다.',
      why: '고객이 관심을 가져도 상담, 문의, 구매 버튼이나 판단 정보가 부족하면 이탈할 가능성이 높습니다.',
      fix: '먼저 버튼 문구, 연락 수단, 가격/견적 안내처럼 결정에 필요한 정보를 눈에 잘 보이는 위치에 배치하세요.'
    });
  }

  if (matches(text, ['FAQ', '질문', '답변', '절차', '비교', '사례', '본문', '정보량'])) {
    return copy({
      title: name,
      label: 'AI 답변 준비',
      meaning: '고객이 검색창이나 AI에 물어볼 법한 질문에 사이트가 충분히 답하지 못한다는 뜻입니다.',
      why: '질문과 답변이 부족하면 검색엔진과 AI가 이 사이트를 추천 근거로 이해하기 어렵고, 방문자도 빠르게 판단하기 어렵습니다.',
      fix: '먼저 자주 받는 질문 5개와 짧은 답변, 진행 절차, 선택 기준을 한 페이지 안에 추가하세요.'
    });
  }

  if (matches(text, ['신뢰', '근거', '인증', '후기', '고객', '포트폴리오', 'schema', '엔티티', '구조화', 'OG', '인용'])) {
    return copy({
      title: name,
      label: 'AI 신뢰 근거',
      meaning: '회사와 서비스가 믿을 만한지 확인할 근거가 부족하다는 뜻입니다.',
      why: '사례, 인증, 고객사, 정책, 회사 정보가 약하면 방문자와 AI 모두 신뢰 판단을 하기 어렵습니다.',
      fix: '먼저 회사소개, 고객 사례, 인증/수상, 정책 링크, 구조화 데이터를 보강해 신뢰 근거를 한곳에 모으세요.'
    });
  }

  if (matches(text, ['title', '메타', 'description', 'canonical', 'robots', 'sitemap', 'noindex', '링크', '리다이렉트', '404'])) {
    return copy({
      title: name,
      label: '검색 노출 기본',
      meaning: '검색엔진이 페이지를 찾고 요약하는 데 필요한 기본 정보가 부족하다는 뜻입니다.',
      why: '검색 결과에 설명이 약하게 보이거나 중요한 페이지가 제대로 수집되지 않으면 잠재 고객에게 발견될 기회가 줄어듭니다.',
      fix: '먼저 페이지 제목, 검색 결과 요약 문구, 사이트맵, 깨진 링크를 정리하세요.'
    });
  }

  if (matches(text, ['viewport', 'LCP', 'CLS', 'TBT', '성능', '렌더', '스크립트', '이미지', 'alt', '접근성', 'lang', 'charset', 'iframe', '폼'])) {
    return copy({
      title: name,
      label: '사용 편의성',
      meaning: '모바일, 속도, 접근성처럼 방문자가 실제로 이용할 때 불편할 수 있는 부분입니다.',
      why: '페이지가 느리거나 모바일 표시가 어색하면 방문자가 내용을 보기 전에 떠날 수 있습니다.',
      fix: '먼저 모바일 표시 설정, 이미지 설명/크기, 느린 리소스, 입력 폼 접근성을 점검하세요.'
    });
  }

  return copy({
    title: name,
    label: labelForPlainLayer(layer),
    meaning: '사이트 구조나 콘텐츠가 방문자와 검색엔진에게 충분히 명확하지 않은 부분입니다.',
    why: '설명이 모호하면 고객이 우리 서비스가 맞는지 판단하기 어렵고 상담 전환도 늦어질 수 있습니다.',
    fix: '먼저 해당 페이지에서 고객이 알아야 할 핵심 정보와 다음 행동 버튼을 분명하게 정리하세요.'
  });
}

function exactPlainIssueCopy(name) {
  if (matches(name, ['리다이렉트 링크 발견', '리다이렉트 체인 과다', '깨진 링크', '서버 오류 링크', '내부 링크 대상 미수집'])) {
    return copy({
      title: name,
      label: '검색 노출 기본',
      meaning: '사이트 안의 링크가 돌아가거나 끊겨 검색엔진과 방문자가 목적지에 바로 도착하기 어렵다는 뜻입니다.',
      why: '중요한 링크가 불안정하면 검색엔진 수집이 비효율적이고, 방문자는 이동 중 신뢰를 잃을 수 있습니다.',
      fix: '먼저 깨진 링크는 정상 주소로 바꾸고, 리다이렉트 링크는 최종 도착 URL로 직접 연결하세요.'
    });
  }

  if (matches(name, ['canonical', '메타 설명', 'meta description', 'title', 'H1', 'robots.txt', 'sitemap.xml', 'noindex'])) {
    return copy({
      title: name,
      label: '검색 노출 기본',
      meaning: '검색엔진이 이 페이지를 어떤 주소와 설명으로 이해해야 하는지 불명확하다는 뜻입니다.',
      why: '검색 결과의 제목과 설명이 약하거나 대표 주소가 흔들리면 중요한 페이지가 제대로 노출되기 어렵습니다.',
      fix: '먼저 페이지 제목, 검색 설명, 대표 URL, robots.txt, sitemap.xml 같은 기본 검색 정보를 정리하세요.'
    });
  }

  if (matches(name, ['문자 인코딩', 'viewport', '이미지', 'alt', 'LCP', 'CLS', 'TBT', '접근성', 'iframe', '폼'])) {
    return copy({
      title: name,
      label: '사용 편의성',
      meaning: '방문자가 모바일, 속도, 화면 표시, 입력 과정에서 불편을 겪을 수 있다는 뜻입니다.',
      why: '페이지가 느리거나 화면 요소가 불안정하면 내용을 보기 전에 이탈할 수 있고, 일부 사용자는 기능을 제대로 쓰기 어렵습니다.',
      fix: '먼저 모바일 표시, 이미지 설명과 크기, 느린 리소스, 입력 폼과 접근성 기본값을 점검하세요.'
    });
  }

  if (matches(name, ['신뢰 근거', '브랜드 엔티티', '구조화 데이터', 'OG 메타', '차별점 근거', '인용 가능한', '외부 신뢰'])) {
    return copy({
      title: name,
      label: 'AI 신뢰 근거',
      meaning: '회사와 서비스가 믿을 만한지 판단할 근거가 부족하다는 뜻입니다.',
      why: '회사 정보, 사례, 인증, 정책, 구조화 데이터가 약하면 방문자와 AI 모두 신뢰 판단을 하기 어렵습니다.',
      fix: '먼저 회사소개, 고객 사례, 인증/수상, 정책 링크, 구조화 데이터를 보강해 신뢰 근거를 한곳에 모으세요.'
    });
  }

  if (matches(name, ['CTA', '상담', '문의', '연락 수단', '구매 버튼', '결제', '환불', '배송'])) {
    return copy({
      title: name,
      label: '문의/구매 전환',
      meaning: '방문자가 문의나 구매 같은 다음 행동을 바로 선택하기 어렵다는 뜻입니다.',
      why: '고객이 관심을 가져도 상담, 문의, 구매 버튼이나 판단 정보가 부족하면 이탈할 가능성이 높습니다.',
      fix: '먼저 버튼 문구, 연락 수단, 신청 폼, 구매 안내처럼 결정에 필요한 정보를 눈에 잘 보이는 위치에 배치하세요.'
    });
  }

  if (matches(name, ['FAQ', '가격 또는 견적 기준', '서비스 절차', '비교 콘텐츠', '본문 정보량', '질문'])) {
    return copy({
      title: name,
      label: 'AI 답변 준비',
      meaning: '고객이 검색창이나 AI에 물어볼 법한 질문에 사이트가 충분히 답하지 못한다는 뜻입니다.',
      why: '질문과 답변, 절차, 선택 기준이 부족하면 검색엔진과 AI가 이 사이트를 추천 근거로 이해하기 어렵습니다.',
      fix: '먼저 자주 받는 질문, 진행 절차, 비교 기준, 판단에 필요한 본문 설명을 추가하세요.'
    });
  }

  return null;
}

export function labelForPlainLayer(value) {
  return {
    'technical-seo': '검색 노출 기본',
    'search-understanding': '검색 의도 설명',
    aeo: 'AI 답변 준비',
    geo: 'AI 신뢰 근거',
    conversion: '문의/구매 전환',
    review: '검토 필요'
  }[value] || '검토 필요';
}

export function labelForPlainImpact(value) {
  return {
    high: '바로 확인',
    medium: '개선 권장',
    low: '여유 있을 때'
  }[value] || '검토 필요';
}

export function labelForPlainScope(value) {
  return {
    small: '짧은 수정',
    medium: '기획 포함 수정',
    large: '구조 개편',
    unknown: '범위 확인'
  }[value] || '범위 확인';
}

function scoreMeaning(score) {
  if (score >= 80) return '기본 구조는 양호하지만 더 많은 문의와 신뢰 확보를 위해 다듬을 부분이 있습니다.';
  if (score >= 60) return '사이트가 작동은 하지만 검색 노출, 신뢰 근거, 문의 전환에서 손실이 생길 수 있습니다.';
  if (score >= 40) return '방문자가 이해하고 문의하기까지 여러 장애물이 있어 우선순위 개선이 필요합니다.';
  return '검색엔진과 방문자 모두 사이트를 이해하기 어려운 상태라 핵심 구조부터 정리해야 합니다.';
}

function copy({ title, label, meaning, why, fix }) {
  return {
    plainTitle: title,
    plainLabel: label,
    plainMeaning: meaning,
    plainWhyItMatters: why,
    plainFirstFix: fix
  };
}

function matches(text, terms) {
  return terms.some((term) => text.toLowerCase().includes(term.toLowerCase()));
}

function impactWeight(value) {
  return { high: 3, medium: 2, low: 1 }[value] || 0;
}
