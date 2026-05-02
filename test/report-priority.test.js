import test from 'node:test';
import assert from 'node:assert/strict';

import { renderReportHtml } from '../src/reporting/render-report-html.js';

test('report priority briefing favors distinct diagnosis areas over repeated generic issues', () => {
  const html = renderReportHtml({
    id: 'run_test',
    url: 'https://example.com/',
    scores: { overall: 61 },
    report: {
      workOrders: [
        issue('Technical canonical missing', 'technical-seo', 'high', 4),
        issue('Duplicate title repeated', 'technical-seo', 'high', 3),
        issue('CTA missing', 'conversion', 'medium', 2),
        issue('FAQ missing', 'aeo', 'medium', 2)
      ]
    }
  });

  const priorityStart = html.indexOf('issue-briefing-section');
  const priorityEnd = html.indexOf('report-technical-details');
  const priorityHtml = html.slice(priorityStart, priorityEnd);

  assert.match(priorityHtml, /Technical canonical missing/);
  assert.match(priorityHtml, /CTA missing/);
  assert.match(priorityHtml, /FAQ missing/);
  assert.doesNotMatch(priorityHtml, /Duplicate title repeated/);
});

function issue(issueName, layer, impact, occurrenceCount) {
  return {
    issueName,
    layer,
    impact,
    confidence: 'high',
    expectedScope: 'small',
    occurrenceCount,
    instruction: `${issueName} needs a site-specific fix.`
  };
}
