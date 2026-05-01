export const SI_PACKAGES = [
  {
    id: 'technical-seo-cleanup',
    name: '기술 SEO 기본 정리 패키지',
    workTypes: ['technical-seo'],
    priceRange: { min: 800000, max: 2500000 }
  },
  {
    id: 'landing-search-structure',
    name: '랜딩페이지 검색 구조 개선 패키지',
    workTypes: ['conversion-improvement', 'landing-page-improvement'],
    priceRange: { min: 1500000, max: 5000000 }
  },
  {
    id: 'aeo-geo-content',
    name: 'AEO/GEO 콘텐츠 보강 패키지',
    workTypes: ['content'],
    priceRange: { min: 1000000, max: 5000000 }
  },
  {
    id: 'commerce-seo',
    name: '쇼핑몰 SEO 개선 패키지',
    workTypes: ['commerce-seo'],
    priceRange: { min: 1500000, max: 7000000 }
  },
  {
    id: 'monthly-search-content',
    name: '월간 검색/콘텐츠 관리 패키지',
    workTypes: ['monthly-management'],
    priceRange: { min: 500000, max: 3000000 }
  }
];

export function recommendPackages(issues = [], context = {}) {
  const scores = new Map();

  for (const item of issues) {
    for (const pkg of SI_PACKAGES) {
      if (!pkg.workTypes.includes(item.workType)) continue;
      const impactScore = item.impact === 'high' ? 30 : item.impact === 'medium' ? 18 : 8;
      const scopeScore = item.expectedScope === 'large' ? 12 : item.expectedScope === 'medium' ? 8 : 4;
      const businessWeight = pkg.id === 'landing-search-structure' ? 1.6 : 1;
      scores.set(pkg.id, (scores.get(pkg.id) || 0) + Math.round((impactScore + scopeScore) * businessWeight));
    }
  }

  if (context.desiredWork === 'fix-and-monthly' || context.desiredWork === 'monthly-management') {
    scores.set('monthly-search-content', Math.max(scores.get('monthly-search-content') || 0, 35));
  }

  return SI_PACKAGES
    .filter((pkg) => scores.has(pkg.id))
    .map((pkg) => ({ ...pkg, priorityScore: scores.get(pkg.id) }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}
