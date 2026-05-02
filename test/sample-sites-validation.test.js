import test from 'node:test';
import assert from 'node:assert/strict';

import { DEMO_SITE_FIXTURES, analyzeDemoSiteFixture } from '../src/demo/site-fixtures.js';

test('sample vertical pages produce actionable diagnosis and sales packages', () => {
  const results = DEMO_SITE_FIXTURES.map((fixture) => ({
    fixture,
    run: analyzeDemoSiteFixture(fixture)
  }));

  assert.equal(results.length, 5);
  for (const { fixture, run } of results) {
    assert.equal(run.issues.length > 0, true, `${fixture.id} should expose issues`);
    assert.equal(run.salesConversion.recommendedPackages.length > 0, true, `${fixture.id} should map issues to packages`);
    assert.match(run.salesConversion.estimatedTimeline, /주/);
  }
});
