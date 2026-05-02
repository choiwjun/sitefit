import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeHtml } from '../src/diagnosis/analyze-html.js';
import { createSalesConversionPlan } from '../src/sales/conversion-plan.js';

const samples = [
  ['b2b-service', 'https://example.com/b2b', '<title>B2B Consulting</title><h1>B2B Consulting</h1><p>We provide consulting for companies.</p><a href="/contact">Contact</a>'],
  ['healthcare', 'https://example.com/clinic', '<title>Clinic</title><h1>Clinic</h1><p>Medical consultation, process, pricing and reservation information.</p><img src="/doctor.jpg">'],
  ['education', 'https://example.com/academy', '<title>Academy Course</title><h1>Academy Course</h1><p>Course process, tuition, instructor, curriculum and consultation.</p>'],
  ['manufacturing', 'https://example.com/products', '<title>Industrial Parts</title><h1>Industrial Parts</h1><p>Product material, certification, delivery and quote request information.</p>'],
  ['commerce', 'https://example.com/shop', '<title>Shop</title><h1>Shop</h1><p>Product price, delivery, refund, review and purchase information.</p>']
];

test('sample vertical pages produce actionable diagnosis and sales packages', () => {
  const results = samples.map(([industry, url, body]) => {
    const html = `
      <!doctype html>
      <html lang="ko">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          ${body}
        </head>
      </html>
    `;
    const diagnosis = analyzeHtml({ url, html, industry });
    const plan = createSalesConversionPlan({ issues: diagnosis.issues, workOrders: diagnosis.issues.map((issue) => ({ issueName: issue.name, ...issue })) });
    return { industry, diagnosis, plan };
  });

  assert.equal(results.length, 5);
  for (const result of results) {
    assert.equal(result.diagnosis.issues.length > 0, true, `${result.industry} should expose issues`);
    assert.equal(result.plan.recommendedPackages.length > 0, true, `${result.industry} should map issues to packages`);
    assert.match(result.plan.estimatedTimeline, /주/);
  }
});
