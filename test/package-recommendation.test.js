import test from 'node:test';
import assert from 'node:assert/strict';

import { recommendPackages } from '../src/sales/package-recommendation.js';

test('recommends technical SEO and landing-page packages from issue work types', () => {
  const packages = recommendPackages([
    { workType: 'technical-seo', impact: 'high', expectedScope: 'small' },
    { workType: 'technical-seo', impact: 'medium', expectedScope: 'small' },
    { workType: 'conversion-improvement', impact: 'high', expectedScope: 'medium' },
    { workType: 'content', impact: 'medium', expectedScope: 'small' }
  ]);

  assert.equal(packages[0].id, 'landing-search-structure');
  assert.ok(packages.some((item) => item.id === 'technical-seo-cleanup'));
  assert.ok(packages.some((item) => item.id === 'aeo-geo-content'));
});

test('includes monthly management when repeated monitoring is requested', () => {
  const packages = recommendPackages([], { desiredWork: 'fix-and-monthly' });

  assert.ok(packages.some((item) => item.id === 'monthly-search-content'));
});
