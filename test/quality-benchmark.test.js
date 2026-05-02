import test from 'node:test';
import assert from 'node:assert/strict';

import { buildAnalysisQualityBenchmark } from '../src/diagnosis/quality-benchmark.js';
import { buildSecurityStatus } from '../src/operations/security-status.js';

test('analysis quality benchmark validates every demo vertical against sales thresholds', () => {
  const benchmark = buildAnalysisQualityBenchmark();

  assert.equal(benchmark.status, 'pass');
  assert.equal(benchmark.sampleCount, 5);
  assert.equal(benchmark.passedSampleCount, 5);
  assert.equal(benchmark.averageUniqueIssueCount >= benchmark.thresholds.minUniqueIssues, true);
  assert.equal(benchmark.averageAnalysisRate >= benchmark.thresholds.minAnalysisRate, true);
  assert.equal(benchmark.samples.every((sample) => sample.recommendedPackageCount >= 1), true);
});

test('security status flags weak production operations settings without exposing secrets', () => {
  const status = buildSecurityStatus({
    nodeEnv: 'production',
    env: {
      ADMIN_TOKEN: 'change-me-sitefit-admin-2026',
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SECRET_KEY: 'sb_secret_example'
    },
    counts: { demoLeadCount: 1 }
  });

  assert.equal(status.status, 'needs_review');
  assert.equal(status.checks.supabaseConfigured, true);
  assert.equal(status.checks.adminTokenStrong, false);
  assert.equal(status.warnings.includes('admin_token_rotation_recommended'), true);
  assert.equal(status.warnings.includes('demo_data_present_in_production'), true);
  assert.equal(JSON.stringify(status).includes('sb_secret_example'), false);
});
