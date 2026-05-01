import test from 'node:test';
import assert from 'node:assert/strict';

import { transitionLeadStatus } from '../src/sales/pipeline.js';

test('allows valid sales pipeline transitions', () => {
  const result = transitionLeadStatus('consultation_requested', 'consultation_scheduled');

  assert.equal(result.ok, true);
  assert.equal(result.status, 'consultation_scheduled');
});

test('rejects skipping directly from diagnosis complete to contracted', () => {
  const result = transitionLeadStatus('diagnosis_complete', 'contracted');

  assert.equal(result.ok, false);
  assert.match(result.reason, /바로 변경할 수 없습니다/);
});
