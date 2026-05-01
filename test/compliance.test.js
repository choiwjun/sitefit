import test from 'node:test';
import assert from 'node:assert/strict';

import { complianceNotesForIndustry } from '../src/compliance/industry-guardrails.js';

test('adds stricter wording notes for regulated industries', () => {
  const notes = complianceNotesForIndustry('hospital');

  assert.ok(notes.length > 0);
  assert.match(notes[0], /의료|치료|후기/);
});

test('returns general advertising note for ordinary B2B sites', () => {
  const notes = complianceNotesForIndustry('b2b');

  assert.deepEqual(notes, [
    '성과 보장 표현을 피하고, 준비도와 개선 가능성 중심의 표현을 사용해야 합니다.'
  ]);
});
