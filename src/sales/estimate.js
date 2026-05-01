import { recommendPackages } from './package-recommendation.js';

export function createEstimateDraft({ leadId, issues = [], desiredWork }) {
  const packageRecommendations = recommendPackages(issues, { desiredWork });
  const totalRange = packageRecommendations.reduce(
    (range, pkg) => ({
      min: range.min + pkg.priceRange.min,
      max: range.max + pkg.priceRange.max
    }),
    { min: 0, max: 0 }
  );

  return {
    leadId,
    status: 'draft',
    packageRecommendations,
    totalRange,
    lineItems: packageRecommendations.map((pkg) => ({
      packageId: pkg.id,
      name: pkg.name,
      priceRange: pkg.priceRange
    })),
    notes: '견적 범위는 상담용 초안이며 검색 순위, 트래픽, AI 답변 노출을 보장하지 않습니다.'
  };
}
