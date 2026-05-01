import test from 'node:test';
import assert from 'node:assert/strict';

import { createMonthlyAccount } from '../src/operations/monthly-management.js';

test('creates monthly management account with next diagnosis date', () => {
  const account = createMonthlyAccount({
    leadId: 'lead_1',
    siteUrl: 'https://example.com/',
    startedAt: '2026-05-01T00:00:00.000Z',
    cadence: 'monthly'
  });

  assert.equal(account.status, 'active');
  assert.equal(account.nextDiagnosisAt, '2026-06-01T00:00:00.000Z');
});
