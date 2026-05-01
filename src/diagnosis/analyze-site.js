const ISSUE_DEFS = {
  duplicateTitle: {
    layer: 'technical-seo',
    name: '중복 title 발견',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'high',
    owner: 'publisher',
    workType: 'technical-seo',
    expectedScope: 'small',
    recommendedAction: '중복된 title을 페이지 주제와 검색 의도에 맞게 각각 다르게 작성합니다.'
  },
  duplicateMeta: {
    layer: 'technical-seo',
    name: '중복 meta description 발견',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'high',
    owner: 'publisher',
    workType: 'technical-seo',
    expectedScope: 'small',
    recommendedAction: '중복된 meta description을 페이지별 핵심 내용과 CTA 중심으로 분리합니다.'
  },
  duplicateH1: {
    layer: 'search-understanding',
    name: '중복 H1 발견',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'high',
    owner: 'planner',
    workType: 'landing-page-improvement',
    expectedScope: 'small',
    recommendedAction: '중복된 H1을 각 페이지의 서비스, 제품, 정보 목적에 맞게 구체화합니다.'
  },
  orphanPage: {
    layer: 'search-understanding',
    name: '내부링크 고립 페이지 발견',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'planner',
    workType: 'landing-page-improvement',
    expectedScope: 'medium',
    recommendedAction: '중요 페이지가 내부 링크로 발견될 수 있도록 메뉴, 본문 링크, 관련 페이지 링크를 추가합니다.'
  },
  missingContactPage: {
    layer: 'conversion',
    name: '문의 페이지 구조 부족',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'planner',
    workType: 'conversion-improvement',
    expectedScope: 'medium',
    recommendedAction: '고객이 상담, 견적, 구매 문의로 이동할 수 있는 전용 문의 페이지 또는 명확한 문의 경로를 구성합니다.'
  },
  missingTrustPage: {
    layer: 'geo',
    name: '신뢰/정책 페이지 구조 부족',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'planner',
    workType: 'landing-page-improvement',
    expectedScope: 'medium',
    recommendedAction: '회사소개, 연락처, 개인정보처리방침, 약관, 사례, 후기 등 신뢰 판단에 필요한 페이지를 사이트 구조에 포함합니다.'
  },
  missingCommercialPage: {
    layer: 'search-understanding',
    name: '핵심 상품/서비스 페이지 구조 부족',
    impact: 'high',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'planner',
    workType: 'landing-page-improvement',
    expectedScope: 'medium',
    recommendedAction: '홈과 게시글만으로 끝나지 않도록 핵심 상품, 서비스, 솔루션, 과정, 진료, 제품 페이지를 별도 구조로 만듭니다.'
  },
  uncollectedInternalLink: {
    layer: 'technical-seo',
    name: '내부 링크 대상 미수집',
    impact: 'low',
    difficulty: 'normal',
    confidence: 'low',
    owner: 'developer',
    workType: 'technical-seo',
    expectedScope: 'small',
    recommendedAction: '내부 링크 대상 URL이 실제로 접근 가능한 HTML 페이지인지, 크롤링 제한이나 깨진 링크가 아닌지 확인합니다.'
  }
};

export function analyzeSiteStructure({ rootUrl, pageResults = [] }) {
  const issues = [
    ...duplicateIssues(pageResults, 'title', ISSUE_DEFS.duplicateTitle),
    ...duplicateIssues(pageResults, 'metaDescription', ISSUE_DEFS.duplicateMeta),
    ...duplicateIssues(pageResults, 'h1', ISSUE_DEFS.duplicateH1),
    ...orphanPageIssues(rootUrl, pageResults),
    ...uncollectedInternalLinkIssues(rootUrl, pageResults),
    ...pageCoverageIssues(pageResults)
  ];

  return {
    issues,
    businessCategory: aggregateBusinessCategory(pageResults)
  };
}

function duplicateIssues(pageResults, metadataKey, definition) {
  const groups = new Map();
  for (const result of pageResults) {
    const value = normalizeValue(result.metadata?.[metadataKey]);
    if (!value) continue;
    const group = groups.get(value) || [];
    group.push(result.url);
    groups.set(value, group);
  }

  return [...groups.entries()]
    .filter(([, urls]) => urls.length > 1)
    .map(([value, urls]) => issue(urls[0], definition, `"${value}" 값이 ${urls.length}개 페이지에서 반복됩니다. 대상: ${urls.join(', ')}`));
}

function orphanPageIssues(rootUrl, pageResults) {
  const root = normalizeUrl(rootUrl);
  const crawledUrls = new Set(pageResults.map((result) => normalizeUrl(result.url)).filter(Boolean));
  const incomingCounts = new Map([...crawledUrls].map((url) => [url, 0]));

  for (const result of pageResults) {
    for (const link of result.metadata?.outgoingLinks || []) {
      const normalized = normalizeUrl(link);
      if (incomingCounts.has(normalized) && normalized !== normalizeUrl(result.url)) {
        incomingCounts.set(normalized, incomingCounts.get(normalized) + 1);
      }
    }
  }

  const orphanUrls = [...incomingCounts.entries()]
    .filter(([url, count]) => url !== root && count === 0)
    .map(([url]) => url);

  if (!orphanUrls.length) return [];
  return [
    issue(
      orphanUrls[0],
      ISSUE_DEFS.orphanPage,
      `크롤링된 페이지 중 내부 링크로 연결되지 않은 페이지가 ${orphanUrls.length}개 확인되었습니다. 대상: ${orphanUrls.join(', ')}`
    )
  ];
}

function uncollectedInternalLinkIssues(rootUrl, pageResults) {
  const root = new URL(rootUrl);
  const crawledUrls = new Set(pageResults.map((result) => normalizeUrl(result.url)).filter(Boolean));
  const missing = new Set();

  for (const result of pageResults) {
    for (const link of result.metadata?.outgoingLinks || []) {
      const normalized = normalizeUrl(link);
      if (!normalized) continue;
      const parsed = new URL(normalized);
      if (parsed.hostname === root.hostname && !crawledUrls.has(normalized)) {
        missing.add(normalized);
      }
    }
  }

  if (!missing.size) return [];
  const samples = [...missing].slice(0, 10);
  return [
    issue(
      samples[0],
      ISSUE_DEFS.uncollectedInternalLink,
      `크롤링된 페이지에서 링크는 발견됐지만 수집 결과에 포함되지 않은 내부 URL이 ${missing.size}개 확인되었습니다. 대상: ${samples.join(', ')}`
    )
  ];
}

function pageCoverageIssues(pageResults) {
  if (pageResults.length < 2) return [];

  const types = new Set(pageResults.map((result) => result.metadata?.pageType).filter(Boolean));
  const urlAndTitle = pageResults
    .map((result) => `${result.url} ${result.metadata?.title || ''} ${result.metadata?.h1 || ''}`.toLowerCase())
    .join(' ');
  const issues = [];

  if (!types.has('contact') && !/contact|inquiry|estimate|문의|상담|견적|예약/.test(urlAndTitle)) {
    issues.push(issue(pageResults[0].url, ISSUE_DEFS.missingContactPage, '크롤링된 페이지 집합에서 전용 문의/상담/견적 페이지가 확인되지 않았습니다.'));
  }

  if (!types.has('legal') && !/about|company|privacy|terms|case|review|portfolio|회사소개|개인정보|약관|사례|후기|포트폴리오/.test(urlAndTitle)) {
    issues.push(issue(pageResults[0].url, ISSUE_DEFS.missingTrustPage, '크롤링된 페이지 집합에서 회사소개, 정책, 사례 등 신뢰 근거 페이지가 확인되지 않았습니다.'));
  }

  if (!types.has('service') && !types.has('product') && !/service|solution|product|shop|course|clinic|서비스|솔루션|상품|제품|과정|진료/.test(urlAndTitle)) {
    issues.push(issue(pageResults[0].url, ISSUE_DEFS.missingCommercialPage, '크롤링된 페이지 집합에서 핵심 상품/서비스를 설명하는 전용 페이지가 확인되지 않았습니다.'));
  }

  return issues;
}

function issue(targetUrl, definition, evidence) {
  return {
    ...definition,
    targetUrl,
    evidence,
    consultationCta: '이 작업 범위 상담 요청'
  };
}

function aggregateBusinessCategory(pageResults) {
  const counts = new Map();
  for (const result of pageResults) {
    const category = result.metadata?.businessCategory;
    if (!category || category.id === 'unknown') continue;
    const current = counts.get(category.id) || {
      id: category.id,
      label: category.label,
      pageCount: 0,
      confidenceTotal: 0
    };
    current.pageCount += 1;
    current.confidenceTotal += Number(category.confidence || 0);
    counts.set(category.id, current);
  }

  const ranked = [...counts.values()].sort((a, b) => b.pageCount - a.pageCount || b.confidenceTotal - a.confidenceTotal);
  if (!ranked.length) {
    return { id: 'unknown', label: '업종 미분류', pageCount: 0, confidenceTotal: 0 };
  }
  return ranked[0];
}

function normalizeValue(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return '';
  }
}
