import test from 'node:test';
import assert from 'node:assert/strict';

import { scoreLead } from '../src/leads/lead-score.js';

test('grades high-budget leads with urgent SI work as hot', () => {
  const result = scoreLead({
    budgetRange: '300-700',
    desiredWork: 'fix-and-monthly',
    timeline: 'urgent',
    issueCount: 18,
    highImpactIssueCount: 7
  });

  assert.equal(result.grade, 'hot');
  assert.ok(result.score >= 80);
  assert.ok(result.reasons.includes('예산 확인됨'));
});

test('grades unknown-budget diagnosis-only leads as nurture', () => {
  const result = scoreLead({
    budgetRange: 'unknown',
    desiredWork: 'diagnosis-only',
    timeline: 'flexible',
    issueCount: 3,
    highImpactIssueCount: 0
  });

  assert.equal(result.grade, 'nurture');
  assert.ok(result.score < 50);
});
