import test from 'node:test';
import assert from 'node:assert/strict';

import { compareDiagnosisRuns } from '../src/diagnosis/compare-runs.js';

test('compares before and after diagnosis runs by score and resolved issues', () => {
  const result = compareDiagnosisRuns({
    before: {
      scores: { overall: 62 },
      issues: [
        { name: '메타 설명 누락', targetUrl: 'https://example.com/' },
        { name: 'FAQ 섹션 부족', targetUrl: 'https://example.com/' }
      ]
    },
    after: {
      scores: { overall: 84 },
      issues: [
        { name: 'FAQ 섹션 부족', targetUrl: 'https://example.com/' }
      ]
    }
  });

  assert.equal(result.scoreDelta, 22);
  assert.deepEqual(result.resolvedIssues, ['메타 설명 누락 @ https://example.com/']);
  assert.deepEqual(result.remainingIssues, ['FAQ 섹션 부족 @ https://example.com/']);
});
