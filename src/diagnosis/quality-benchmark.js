import { DEMO_SITE_FIXTURES, analyzeDemoSiteFixture } from '../demo/site-fixtures.js';

const DEFAULT_MIN_UNIQUE_ISSUES = 8;
const DEFAULT_MIN_RECOMMENDED_PACKAGES = 1;
const DEFAULT_MIN_ANALYSIS_RATE = 90;

export function buildAnalysisQualityBenchmark(fixtures = DEMO_SITE_FIXTURES, options = {}) {
  const thresholds = {
    minUniqueIssues: options.minUniqueIssues ?? DEFAULT_MIN_UNIQUE_ISSUES,
    minRecommendedPackages: options.minRecommendedPackages ?? DEFAULT_MIN_RECOMMENDED_PACKAGES,
    minAnalysisRate: options.minAnalysisRate ?? DEFAULT_MIN_ANALYSIS_RATE
  };
  const samples = fixtures.map((fixture) => sampleBenchmark(fixture, thresholds));
  const failedSamples = samples.filter((sample) => sample.status !== 'pass');

  return {
    status: failedSamples.length ? 'needs_review' : 'pass',
    thresholds,
    sampleCount: samples.length,
    passedSampleCount: samples.length - failedSamples.length,
    averageUniqueIssueCount: average(samples.map((sample) => sample.uniqueIssueCount)),
    averageAnalysisRate: average(samples.map((sample) => sample.analysisRate)),
    samples
  };
}

function sampleBenchmark(fixture, thresholds) {
  const run = analyzeDemoSiteFixture(fixture);
  const uniqueIssueCount = new Set(run.issues.map((issue) => `${issue.layer || 'unknown'}:${issue.name}`)).size;
  const recommendedPackageCount = run.salesConversion?.recommendedPackages?.length || 0;
  const analysisRate = Number(run.analysisCoverage?.analysisRate || 0);
  const blockers = [];

  if (uniqueIssueCount < thresholds.minUniqueIssues) blockers.push('unique_issue_depth');
  if (recommendedPackageCount < thresholds.minRecommendedPackages) blockers.push('sales_package_mapping');
  if (analysisRate < thresholds.minAnalysisRate) blockers.push('analysis_coverage');

  return {
    id: fixture.id,
    label: fixture.label,
    industry: fixture.industry,
    status: blockers.length ? 'needs_review' : 'pass',
    blockers,
    pagesAnalyzed: run.pagesAnalyzed,
    uniqueIssueCount,
    rawIssueCount: run.issues.length,
    analysisRate,
    recommendedPackageCount,
    topIssueNames: run.issues.slice(0, 5).map((issue) => issue.name)
  };
}

function average(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length);
}
