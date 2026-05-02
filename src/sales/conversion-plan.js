import { recommendPackages } from './package-recommendation.js';

export function createSalesConversionPlan({ issues = [], workOrders = [], scores = {}, businessCategory } = {}) {
  const packages = recommendPackages(issues);
  const expertRequiredIssues = issues.filter(needsExpertWork);
  const selfServeIssues = issues.filter(canBeSelfServed);
  const highImpactCount = issues.filter((issue) => issue.impact === 'high').length;
  const salesTalkTrack = createSalesTalkTrack({
    issues,
    scores,
    businessCategory,
    expertRequiredIssueCount: expertRequiredIssues.length,
    selfServeIssueCount: selfServeIssues.length
  });

  return {
    ctaLabel: '진단 결과 기반 개선안 받기',
    ctaDescription: '탐지된 이슈를 바로 견적 범위와 실행 순서로 바꿔 상담합니다.',
    salesTalkTrack,
    selfServeIssueCount: selfServeIssues.length,
    expertRequiredIssueCount: expertRequiredIssues.length,
    estimatedTimeline: timelineFor({ issueCount: issues.length, highImpactCount, packageCount: packages.length }),
    recommendedPackages: packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      priceRange: pkg.priceRange,
      priorityScore: pkg.priorityScore,
      matchedIssueCount: issues.filter((issue) => pkg.workTypes.includes(issue.workType)).length,
      reason: reasonForPackage(pkg, issues),
      salesAngle: salesAngleForPackage(pkg, issues, scores)
    })),
    topWorkOrders: [...workOrders].sort(compareWorkOrders).slice(0, 5),
    nextActions: [
      '우선순위 이슈와 적용 범위를 30분 상담에서 확인',
      '추천 패키지 기준으로 1차 견적 범위 산정',
      '수정 후 재진단으로 개선 전후 리포트 비교'
    ]
  };
}

export function createTrustEvidenceSummary({
  analysisCoverage,
  webQualityScores,
  issues = []
} = {}) {
  const coverage = analysisCoverage || {};
  const scores = webQualityScores || {};

  return {
    source: scores.source || 'sitefit-rules',
    items: [
      { label: '분석률', value: `${coverage.analysisRate ?? 0}%` },
      { label: '수집 한도 사용', value: `${coverage.crawlBudgetUsageRate ?? 0}%${coverage.isSampledCrawl ? ' 표본' : ''}` },
      { label: '분석 페이지', value: `${coverage.analyzedPages ?? 0}/${coverage.discoveredUrls ?? coverage.analyzedPages ?? 0}` },
      { label: '링크 점검', value: `${coverage.checkedLinks ?? 0}/${coverage.maxLinkChecks ?? 0}` },
      { label: 'JS 렌더링', value: `${coverage.renderedPages ?? 0}개` },
      { label: '품질 점수', value: `${scores.overall ?? '-'}점` },
      { label: '탐지 이슈', value: `${issues.length}건` }
    ],
    note: 'PageSpeed 또는 AI API에 의존하지 않고 현재 수집된 페이지, 링크, HTML, 렌더링 근거로 계산한 SiteFit rule 기반 진단입니다.'
  };
}

function needsExpertWork(issue) {
  return issue.impact === 'high' ||
    ['medium', 'large'].includes(issue.expectedScope) ||
    ['planner', 'content owner'].includes(issue.owner);
}

function canBeSelfServed(issue) {
  return issue.expectedScope === 'small' &&
    issue.difficulty === 'easy' &&
    issue.impact !== 'high';
}

function timelineFor({ issueCount, highImpactCount, packageCount }) {
  if (issueCount >= 20 || highImpactCount >= 6 || packageCount >= 4) return '4주 이상';
  if (issueCount >= 8 || highImpactCount >= 2 || packageCount >= 2) return '2~4주';
  return '1~2주';
}

function reasonForPackage(pkg, issues) {
  const matched = issues.filter((issue) => pkg.workTypes.includes(issue.workType));
  const high = matched.filter((issue) => issue.impact === 'high').length;
  return high
    ? `영향도 높은 이슈 ${high}건을 포함해 ${matched.length}건과 연결됩니다.`
    : `${matched.length}건의 진단 이슈와 연결됩니다.`;
}

function createSalesTalkTrack({ issues, scores, businessCategory, expertRequiredIssueCount, selfServeIssueCount }) {
  const categoryLabel = businessCategory?.label || '현재 사이트';
  const weakestArea = weakestScoreArea(scores);
  const highImpactCount = issues.filter((issue) => issue.impact === 'high').length;
  const topIssueNames = [...new Set(issues.slice(0, 3).map((issue) => issue.name).filter(Boolean))];

  return {
    headline: `${categoryLabel} 기준으로 ${labelForScoreArea(weakestArea.key)} 보강이 상담 전환에 가장 먼저 영향을 줍니다.`,
    talkingPoints: [
      `종합 점수 ${scores.overall ?? '-'}점, ${labelForScoreArea(weakestArea.key)} ${weakestArea.value}점 구간부터 우선 정리합니다.`,
      `전문가가 잡아야 할 항목 ${expertRequiredIssueCount}건과 직접 수정 가능한 항목 ${selfServeIssueCount}건을 분리했습니다.`,
      highImpactCount
        ? `영향도 높은 이슈 ${highImpactCount}건은 견적 상담에서 범위와 적용 순서를 먼저 확정하는 것이 좋습니다.`
        : '치명 이슈보다 구조 개선 중심이라 짧은 개선 사이클로 시작할 수 있습니다.',
      topIssueNames.length ? `첫 상담에서는 ${topIssueNames.join(', ')}를 먼저 확인합니다.` : '첫 상담에서는 분석 근거와 개선 우선순위를 함께 확인합니다.'
    ]
  };
}

function salesAngleForPackage(pkg, issues, scores) {
  const matched = issues.filter((issue) => pkg.workTypes.includes(issue.workType));
  const high = matched.filter((issue) => issue.impact === 'high').length;
  const area = packagePrimaryArea(pkg.id);
  const areaScore = scores[area.key];
  const scoreText = Number.isFinite(Number(areaScore)) ? `${area.label} ${areaScore}점` : area.label;
  if (high > 0) {
    return `${scoreText}에서 영향도 높은 항목 ${high}건이 확인되어 문의와 상담 전환 손실을 먼저 줄이는 제안입니다.`;
  }
  return `${scoreText} 관련 이슈 ${matched.length}건을 묶어 검색 노출, 신뢰 근거, 상담 전환 흐름을 정리하는 제안입니다.`;
}

function weakestScoreArea(scores = {}) {
  const candidates = [
    ['conversion', scores.conversion],
    ['technical-seo', scores['technical-seo']],
    ['search-understanding', scores['search-understanding']],
    ['aeo', scores.aeo],
    ['geo', scores.geo]
  ].filter(([, value]) => Number.isFinite(Number(value)));

  if (!candidates.length) return { key: 'conversion', value: '-' };
  const [key, value] = candidates.sort((a, b) => Number(a[1]) - Number(b[1]))[0];
  return { key, value };
}

function labelForScoreArea(key) {
  return {
    'technical-seo': '기술 SEO',
    'search-understanding': '검색 이해도',
    aeo: 'AEO 콘텐츠',
    geo: '신뢰 근거',
    conversion: '문의 전환 구조'
  }[key] || '전환 구조';
}

function packagePrimaryArea(packageId) {
  return {
    'technical-seo-cleanup': { key: 'technical-seo', label: '기술 SEO' },
    'landing-search-structure': { key: 'conversion', label: '전환 구조' },
    'aeo-geo-content': { key: 'aeo', label: 'AEO/GEO 콘텐츠' },
    'commerce-seo': { key: 'conversion', label: '구매 전환 구조' },
    'monthly-search-content': { key: 'search-understanding', label: '검색 콘텐츠 운영' }
  }[packageId] || { key: 'conversion', label: '전환 구조' };
}

function compareWorkOrders(a, b) {
  return impactWeight(b.impact) - impactWeight(a.impact) ||
    scopeWeight(b.expectedScope) - scopeWeight(a.expectedScope) ||
    String(a.issueName || '').localeCompare(String(b.issueName || ''), 'ko');
}

function impactWeight(value) {
  return { high: 3, medium: 2, low: 1 }[value] || 0;
}

function scopeWeight(value) {
  return { large: 3, medium: 2, small: 1 }[value] || 0;
}
