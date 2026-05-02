import test from 'node:test';
import assert from 'node:assert/strict';

import { DEMO_SITE_FIXTURES, analyzeDemoSiteFixture } from '../src/demo/site-fixtures.js';

test('demo site fixtures produce stable sales-ready diagnosis runs', () => {
  assert.equal(DEMO_SITE_FIXTURES.length, 5);

  for (const fixture of DEMO_SITE_FIXTURES) {
    const run = analyzeDemoSiteFixture(fixture);

    assert.equal(fixture.pages.length >= 2, true, `${fixture.id} should include multiple pages`);
    assert.equal(run.industry, fixture.industry);
    assert.equal(run.pagesAnalyzed, fixture.pages.length);
    assert.equal(run.analysisCoverage.analysisRate, 100);
    assert.equal(run.analysisCoverage.crawlBudgetUsageRate, 100);
    assert.equal(run.analysisCoverage.isSampledCrawl, false);
    assert.equal(run.pageResults.length, fixture.pages.length);
    assert.equal(run.issues.length > 0, true, `${fixture.id} should expose diagnosis issues`);
    assert.equal(run.salesConversion.recommendedPackages.length > 0, true, `${fixture.id} should map to packages`);
    assert.equal(run.trustEvidence.items.some((item) => item.label === '수집 한도 사용'), true);
    assert.match(run.salesConversion.salesTalkTrack.headline, new RegExp(fixture.expectedTalkLabel));
  }
});
