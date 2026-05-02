import { recommendPackages } from './package-recommendation.js';

export function createSalesConversionPlan({ issues = [], workOrders = [] } = {}) {
  const packages = recommendPackages(issues);
  const expertRequiredIssues = issues.filter(needsExpertWork);
  const selfServeIssues = issues.filter(canBeSelfServed);
  const highImpactCount = issues.filter((issue) => issue.impact === 'high').length;

  return {
    ctaLabel: '진단 결과 기반 개선안 받기',
    ctaDescription: '탐지된 이슈를 바로 견적 범위와 실행 순서로 바꿔 상담합니다.',
    selfServeIssueCount: selfServeIssues.length,
    expertRequiredIssueCount: expertRequiredIssues.length,
    estimatedTimeline: timelineFor({ issueCount: issues.length, highImpactCount, packageCount: packages.length }),
    recommendedPackages: packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      priceRange: pkg.priceRange,
      priorityScore: pkg.priorityScore,
      matchedIssueCount: issues.filter((issue) => pkg.workTypes.includes(issue.workType)).length,
      reason: reasonForPackage(pkg, issues)
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
