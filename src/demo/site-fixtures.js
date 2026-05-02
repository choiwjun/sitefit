import { analyzeHtml } from '../diagnosis/analyze-html.js';
import { analyzeSiteStructure } from '../diagnosis/analyze-site.js';
import { analyzeIndustryRules } from '../diagnosis/industry-rules.js';
import { calculateWebQualityScores } from '../diagnosis/web-quality.js';
import { createSalesConversionPlan, createTrustEvidenceSummary } from '../sales/conversion-plan.js';

export const DEMO_SITE_FIXTURES = [
  {
    id: 'b2b-service',
    label: 'B2B SaaS demo',
    industry: 'b2b-service',
    expectedTalkLabel: 'B2B 서비스',
    businessCategory: { id: 'b2b-service', label: 'B2B 서비스', confidence: 5, source: 'demo-fixture' },
    rootUrl: 'https://demo.sitefit.local/b2b/',
    pages: [
      page('/b2b/', 'OpsFlow B2B Platform', 'B2B operations software for teams that need faster client onboarding.', `
        <h1>OpsFlow B2B Platform</h1>
        <p>B2B software for consulting, onboarding and account operations. Teams can request a quote and review customer outcomes.</p>
        <a href="/b2b/solution">Solution</a>
        <a href="/b2b/contact">Contact</a>
      `),
      page('/b2b/solution', 'B2B Workflow Solution', '', `
        <h1>B2B Workflow Solution</h1>
        <p>Service overview for client onboarding, workflow automation and reporting.</p>
        <img src="/assets/workflow.png">
      `)
    ]
  },
  {
    id: 'healthcare',
    label: 'Healthcare clinic demo',
    industry: 'healthcare',
    expectedTalkLabel: '병원/의료',
    businessCategory: { id: 'healthcare', label: '병원/의료', confidence: 5, source: 'demo-fixture' },
    rootUrl: 'https://demo.sitefit.local/clinic/',
    pages: [
      page('/clinic/', 'Clear Clinic Reservation', 'Clinic medical reservation and consultation page for patients.', `
        <h1>Clear Clinic Reservation</h1>
        <p>Medical clinic consultation, reservation and treatment information for patients. We explain process and pricing before booking.</p>
        <a href="/clinic/treatment">Treatment</a>
      `),
      page('/clinic/treatment', 'Skin Treatment Guide', '', `
        <h1>Skin Treatment Guide</h1>
        <p>Best treatment with 100% result satisfaction for every patient. Reservation is available online.</p>
        <button></button>
      `)
    ]
  },
  {
    id: 'education',
    label: 'Education academy demo',
    industry: 'education',
    expectedTalkLabel: '교육/학원',
    businessCategory: { id: 'education', label: '교육/학원', confidence: 5, source: 'demo-fixture' },
    rootUrl: 'https://demo.sitefit.local/academy/',
    pages: [
      page('/academy/', 'Data Academy Course', 'Education course for students with curriculum, instructor and consultation.', `
        <h1>Data Academy Course</h1>
        <p>Education course with curriculum, instructor profile, schedule and consultation for students.</p>
        <a href="/academy/course">Course</a>
      `),
      page('/academy/course', 'Python Course', '', `
        <h1>Python Course</h1>
        <p>Course introduction for beginners. Students can ask questions before enrollment.</p>
        <script src="https://cdn.example.com/widget.js"></script>
      `)
    ]
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing supplier demo',
    industry: 'manufacturing',
    expectedTalkLabel: '제조/산업',
    businessCategory: { id: 'manufacturing', label: '제조/산업', confidence: 5, source: 'demo-fixture' },
    rootUrl: 'https://demo.sitefit.local/factory/',
    pages: [
      page('/factory/', 'Industrial Parts Manufacturer', 'Manufacturing supplier for industrial parts, materials and delivery consultation.', `
        <h1>Industrial Parts Manufacturer</h1>
        <p>Manufacturing company for industrial parts, factory supply and quote request.</p>
        <a href="/factory/products">Products</a>
      `),
      page('/factory/products', 'Industrial Parts', '', `
        <h1>Industrial Parts</h1>
        <p>Product overview with material and delivery information. Specification files can be requested by sales inquiry.</p>
        <link rel="stylesheet" href="/assets/heavy.css">
      `)
    ]
  },
  {
    id: 'commerce',
    label: 'Commerce store demo',
    industry: 'commerce',
    expectedTalkLabel: '쇼핑몰/커머스',
    businessCategory: { id: 'commerce', label: '쇼핑몰/커머스', confidence: 5, source: 'demo-fixture' },
    rootUrl: 'https://demo.sitefit.local/shop/',
    pages: [
      page('/shop/', 'Seasonal Shop', 'Shop seasonal product collections, store best sellers, cart benefits and delivery highlights.', `
        <h1>Seasonal Shop</h1>
        <p>Shop seasonal product collections, store best sellers, cart benefits, delivery information and customer reviews.</p>
        <a href="/shop/products">Products</a>
      `),
      page('/shop/products', 'Runner Shoes', '', `
        <h1>Runner Shoes</h1>
        <p>Product detail with purchase option, delivery guide and review highlights.</p>
        <img src="/assets/shoe.jpg">
      `)
    ]
  }
];

export function analyzeDemoSiteFixture(fixture) {
  const pageResults = fixture.pages.map((samplePage) => analyzeHtml({
    url: new URL(samplePage.path, fixture.rootUrl).toString(),
    html: samplePage.html,
    industry: fixture.industry,
    goal: 'demo-sales'
  }));
  const siteStructure = analyzeSiteStructure({
    rootUrl: fixture.rootUrl,
    pageResults
  });
  const industryRules = analyzeIndustryRules({
    businessCategory: fixture.businessCategory,
    pageResults
  });
  const issues = [
    ...siteStructure.issues,
    ...industryRules.issues,
    ...pageResults.flatMap((result) => result.issues)
  ];
  const scores = averageScores(pageResults);
  const webQualityScores = calculateWebQualityScores({ scores, issues, pageResults });
  const analysisCoverage = {
    analyzedPages: pageResults.length,
    discoveredUrls: pageResults.length,
    skippedUrls: 0,
    analysisRate: 100,
    crawlBudgetUsageRate: 100,
    isSampledCrawl: false,
    skippedReasonCounts: {},
    maxPages: pageResults.length,
    maxDepth: 1,
    maxBytes: 512000,
    maxLinkChecks: 0,
    checkedLinks: 0,
    skippedLinks: 0,
    renderedPages: 0
  };
  const workOrders = issues.map((issue) => ({
    issueName: issue.name,
    instruction: issue.recommendedAction,
    ...issue
  }));

  return {
    url: fixture.rootUrl,
    industry: fixture.industry,
    goal: 'demo-sales',
    businessCategory: fixture.businessCategory,
    pagesAnalyzed: pageResults.length,
    scores,
    webQualityScores,
    pageResults,
    siteStructure,
    industryRules,
    issues,
    analysisCoverage,
    salesConversion: createSalesConversionPlan({
      issues,
      workOrders,
      scores,
      businessCategory: fixture.businessCategory
    }),
    trustEvidence: createTrustEvidenceSummary({
      analysisCoverage,
      webQualityScores,
      issues
    })
  };
}

function page(path, title, description, body) {
  const metaDescription = description
    ? `<meta name="description" content="${escapeAttribute(description)}">`
    : '';
  return {
    path,
    html: `
      <!doctype html>
      <html lang="ko">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${escapeHtml(title)}</title>
          ${metaDescription}
        </head>
        <body>${body}</body>
      </html>
    `
  };
}

function averageScores(pageResults) {
  const keys = ['technical-seo', 'search-understanding', 'aeo', 'geo', 'conversion', 'overall'];
  return Object.fromEntries(keys.map((key) => [
    key,
    Math.round(pageResults.reduce((sum, result) => sum + Number(result.scores?.[key] || 0), 0) / pageResults.length)
  ]));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/"/g, '&quot;');
}
