import test from 'node:test';
import assert from 'node:assert/strict';

import { assignPartner } from '../src/operations/partner-assignment.js';

test('assigns a partner when capability matches the estimate package', () => {
  const assignment = assignPartner({
    estimateId: 'estimate_1',
    packageId: 'technical-seo-cleanup',
    partners: [
      { id: 'partner_1', name: 'Content Studio', capabilities: ['content'] },
      { id: 'partner_2', name: 'SEO Dev', capabilities: ['technical-seo-cleanup', 'landing-search-structure'] }
    ]
  });

  assert.equal(assignment.ok, true);
  assert.equal(assignment.partnerId, 'partner_2');
  assert.equal(assignment.status, 'assigned');
});

test('returns manual review when no partner has the required capability', () => {
  const assignment = assignPartner({
    estimateId: 'estimate_1',
    packageId: 'commerce-seo',
    partners: [
      { id: 'partner_1', name: 'Content Studio', capabilities: ['content'] }
    ]
  });

  assert.equal(assignment.ok, false);
  assert.equal(assignment.status, 'manual_review');
});
