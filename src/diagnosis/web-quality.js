export function calculateWebQualityScores({ scores = {}, issues = [], pageResults = [] } = {}) {
  const performance = averagePageScore(pageResults, performanceScoreForPage);
  const accessibility = averagePageScore(pageResults, accessibilityScoreForPage);
  const bestPractices = clampScore(averagePageScore(pageResults, bestPracticeScoreForPage) - issuePenalty(issues));
  const seo = Math.round(((scores['technical-seo'] ?? 100) + (scores['search-understanding'] ?? 100)) / 2);
  const overall = Math.round((performance + accessibility + bestPractices + seo) / 4);

  return {
    source: 'sitefit-rules',
    performance,
    accessibility,
    bestPractices,
    seo,
    overall
  };
}

function averagePageScore(pageResults, scorer) {
  if (!pageResults.length) return 100;
  const total = pageResults.reduce((sum, page) => sum + scorer(page.metadata || {}), 0);
  return Math.round(total / pageResults.length);
}

function performanceScoreForPage(metadata) {
  const stats = metadata.performanceStats || {};
  const runtime = metadata.runtimePerformance || {};
  const thirdPartyScripts = metadata.thirdPartyScripts || {};
  let score = 100;

  score -= Math.min(Number(stats.blockingStylesheets || 0) * 5, 25);
  score -= Math.min(Number(stats.syncScripts || 0) * 5, 25);
  score -= Math.min(Number(stats.nonLazyImages || 0) * 2, 15);
  score -= Math.min(Number(thirdPartyScripts.count || 0) * 3, 15);
  if (Number(runtime.lcpMs || 0) > 2500) score -= 15;
  if (Number(runtime.cls || 0) > 0.1) score -= 15;
  if (Number(runtime.totalBlockingTimeMs || 0) > 300) score -= 15;
  if (Number(runtime.transferSizeBytes || 0) > 2000000) score -= 10;
  if (Number(runtime.imageTransferSizeBytes || 0) > 1000000) score -= 10;

  return clampScore(score);
}

function accessibilityScoreForPage(metadata) {
  const basics = metadata.technicalBasics || {};
  const images = metadata.imageStats || {};
  const links = metadata.linkStats || {};
  const forms = metadata.formStats || {};
  const accessibility = metadata.accessibilityStats || {};
  let score = 100;

  score -= Math.min(Number(images.missingAlt || 0) * 5, 20);
  score -= Math.min(Number(links.emptyAnchorCount || 0) * 5, 15);
  score -= Math.min(Number(forms.unlabeledControls || 0) * 15, 30);
  score -= Math.min(Number(accessibility.emptyButtonCount || 0) * 10, 20);
  score -= Math.min(Number(accessibility.duplicateIdCount || 0) * 10, 20);
  score -= Math.min(Number(accessibility.iframeWithoutTitleCount || 0) * 10, 20);
  if (!basics.hasLang) score -= 10;

  return clampScore(score);
}

function bestPracticeScoreForPage(metadata) {
  const basics = metadata.technicalBasics || {};
  const forms = metadata.formStats || {};
  const thirdPartyScripts = metadata.thirdPartyScripts || {};
  let score = 100;

  score -= Math.min(Number(basics.invalidJsonLdCount || 0) * 10, 20);
  score -= Math.min(Number(basics.mixedContentCount || 0) * 20, 40);
  score -= Math.min(Number(forms.insecureActionCount || 0) * 25, 50);
  score -= Math.min(Number(thirdPartyScripts.count || 0) * 2, 10);
  if (!basics.hasCharset) score -= 5;

  return clampScore(score);
}

function issuePenalty(issues) {
  const names = new Set(issues.map((issue) => issue.name));
  let penalty = 0;
  if (names.has('HTTPS 혼합 콘텐츠 발견')) penalty += 5;
  if (names.has('리다이렉트 체인 과다')) penalty += 5;
  if (names.has('서드파티 스크립트 점검 필요')) penalty += 5;
  return penalty;
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}
