import test from 'node:test';
import assert from 'node:assert/strict';

import { createEstimateDraft } from '../src/sales/estimate.js';

test('creates estimate draft from diagnosis issues and package recommendations', () => {
  const estimate = createEstimateDraft({
    leadId: 'lead_1',
    issues: [
      { workType: 'technical-seo', impact: 'high', expectedScope: 'small' },
      { workType: 'content', impact: 'medium', expectedScope: 'medium' },
      { workType: 'conversion-improvement', impact: 'high', expectedScope: 'medium' }
    ],
    desiredWork: 'fix-and-monthly'
  });

  assert.equal(estimate.leadId, 'lead_1');
  assert.equal(estimate.status, 'draft');
  assert.ok(estimate.packageRecommendations.length >= 3);
  assert.ok(estimate.totalRange.min >= 1500000);
  assert.ok(estimate.totalRange.max > estimate.totalRange.min);
});
