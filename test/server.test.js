import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { createServer, isMainModule } from '../src/server.js';

test('serves admin summary from stored diagnosis runs and leads', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-server-'));
  const app = createServer({ dataDir: dir });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;

    const leadResponse = await fetch(`${baseUrl}/api/leads`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Kim',
        company: 'Example',
        email: 'kim@example.com',
        siteUrl: 'https://example.com/',
        industry: 'b2b',
        budgetRange: '300-700',
        desiredWork: 'fix-and-monthly',
        timeline: 'urgent',
        issueCount: 12,
        highImpactIssueCount: 4
      })
    });

    assert.equal(leadResponse.status, 201);

    const summaryResponse = await fetch(`${baseUrl}/api/admin/summary`);
    const summary = await summaryResponse.json();

    assert.equal(summary.leads.total, 1);
    assert.equal(summary.leads.hot, 1);
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('admin demo run API creates a sales-ready fixture run and lead', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-demo-run-'));
  const app = createServer({ dataDir: dir, adminToken: 'secret-token' });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;
    const denied = await fetch(`${baseUrl}/api/admin/demo-runs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fixtureId: 'commerce' })
    });
    assert.equal(denied.status, 401);

    const response = await fetch(`${baseUrl}/api/admin/demo-runs`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer secret-token',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ fixtureId: 'commerce' })
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.run.demoFixtureId, 'commerce');
    assert.equal(body.run.industry, 'commerce');
    assert.equal(body.run.analysisCoverage.analysisRate, 100);
    assert.equal(body.run.trustEvidence.items.some((item) => item.label === '수집 한도 사용'), true);
    assert.equal(body.lead.siteUrl, body.run.url);
    assert.equal(body.lead.salesStatus, 'consultation_requested');
    assert.equal(body.estimate.leadId, body.lead.id);
    assert.equal(body.estimate.lineItems.length > 0, true);

    const runsResponse = await fetch(`${baseUrl}/api/admin/runs`, {
      headers: { authorization: 'Bearer secret-token' }
    });
    const runs = await runsResponse.json();
    assert.equal(runs.runs.some((run) => run.id === body.run.id), true);
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('admin demo data API requires confirmation and removes only demo records', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-demo-cleanup-'));
  const app = createServer({ dataDir: dir, adminToken: 'secret-token' });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;
    const headers = {
      authorization: 'Bearer secret-token',
      'content-type': 'application/json'
    };

    const demoResponse = await fetch(`${baseUrl}/api/admin/demo-runs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ fixtureId: 'commerce' })
    });
    assert.equal(demoResponse.status, 201);

    const realLeadResponse = await fetch(`${baseUrl}/api/leads`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Lee',
        company: 'Real Company',
        email: 'lee@example.com',
        siteUrl: 'https://real.example.com/',
        industry: 'b2b',
        budgetRange: '100-300',
        desiredWork: 'diagnosis-only',
        timeline: 'this-quarter',
        issueCount: 2,
        highImpactIssueCount: 0
      })
    });
    const { lead: realLead } = await realLeadResponse.json();
    assert.equal(realLeadResponse.status, 201);

    const rejected = await fetch(`${baseUrl}/api/admin/demo-data`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ confirm: 'wrong' })
    });
    assert.equal(rejected.status, 400);

    const response = await fetch(`${baseUrl}/api/admin/demo-data`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ confirm: 'DELETE_DEMO_DATA' })
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.removed.runs, 1);
    assert.equal(body.removed.leads, 1);
    assert.equal(body.removed.estimates, 1);

    const leadsResponse = await fetch(`${baseUrl}/api/admin/leads`, {
      headers: { authorization: 'Bearer secret-token' }
    });
    const leads = await leadsResponse.json();
    assert.equal(leads.leads.length, 1);
    assert.equal(leads.leads[0].id, realLead.id);
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('serves health check for deployment probes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-health-'));
  const app = createServer({ dataDir: dir });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.service, 'sitefit');
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('diagnose API returns actionable failure guidance for invalid public URLs', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-diagnose-failure-'));
  const app = createServer({ dataDir: dir });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;
    const response = await fetch(`${baseUrl}/api/diagnose`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ siteUrl: 'localhost:3000' })
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error, 'invalid_url');
    assert.match(body.userMessage, /주소/);
    assert.equal(Array.isArray(body.recoveryActions), true);
    assert.equal(body.recoveryActions.length >= 2, true);
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('admin exposes security status and analysis quality benchmark', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-admin-ops-'));
  const app = createServer({ dataDir: dir, adminToken: 'secret-token' });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;
    const headers = { authorization: 'Bearer secret-token' };
    const securityResponse = await fetch(`${baseUrl}/api/admin/security`, { headers });
    const qualityResponse = await fetch(`${baseUrl}/api/admin/quality-benchmark`, { headers });
    const security = await securityResponse.json();
    const quality = await qualityResponse.json();

    assert.equal(securityResponse.status, 200);
    assert.equal(security.checks.adminTokenConfigured, true);
    assert.equal(qualityResponse.status, 200);
    assert.equal(quality.status, 'pass');
    assert.equal(quality.sampleCount, 5);
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('lead API rejects consultation requests without required qualification fields', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-lead-validation-'));
  const app = createServer({ dataDir: dir });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;
    const response = await fetch(`${baseUrl}/api/leads`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Lee',
        email: 'lee@example.com',
        siteUrl: 'https://example.com/',
        desiredWork: 'fix-only',
        timeline: 'urgent'
      })
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error, 'validation_failed');
    assert.ok(body.fields.includes('budgetRange'));
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('diagnose API analyzes multiple crawled same-origin pages', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-diagnose-'));
  const app = createServer({
    dataDir: dir,
    fetcher: async (url) => {
      if (url === 'https://example.com/') {
        return {
          url,
          status: 200,
          contentType: 'text/html',
          html: '<title>Home</title><meta name="description" content="A useful homepage description."><h1>Home</h1><a href="/service">Service</a>'
        };
      }
      return {
        url,
        status: 200,
        contentType: 'text/html',
        html: '<title>Service</title><h1>Service</h1><p>No FAQ or CTA here.</p>'
      };
    }
  });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;
    const response = await fetch(`${baseUrl}/api/diagnose`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        siteUrl: 'https://example.com/',
        industry: 'b2b',
        goal: 'inquiries'
      })
    });
    const data = await response.json();

    assert.equal(response.status, 201);
    assert.equal(data.run.pagesAnalyzed, 2);
    assert.equal(data.run.pageResults.length, 2);
    assert.match(data.run.summary, /주요 개선 유형/);
    assert.match(data.run.summary, /페이지별 탐지/);
    assert.match(data.run.report.executiveSummary, /실제 진단 근거/);
    assert.doesNotMatch(data.run.report.executiveSummary, /mock/i);
    assert.equal(data.run.report.ai.provider, 'mock');
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('diagnose API returns storage guidance when the diagnosis run cannot be saved', async () => {
  const store = {
    async addDiagnosisRun() {
      throw new Error('Supabase POST sitefit_records failed: 404 relation "sitefit_records" does not exist');
    }
  };
  const app = createServer({
    store,
    fetcher: async (url) => ({
      url,
      status: 200,
      contentType: 'text/html',
      html: '<title>Home</title><meta name="description" content="A useful homepage description."><h1>Home</h1>'
    })
  });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;
    const response = await fetch(`${baseUrl}/api/diagnose`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ siteUrl: 'https://example.com/' })
    });
    const body = await response.json();

    assert.equal(response.status, 503);
    assert.equal(body.error, 'storage_unavailable');
    assert.match(body.message, /could not be saved/i);
    assert.equal(body.details.storage, 'diagnosis-runs');
    assert.equal(body.recoveryActions.some((action) => action.includes('supabase/schema.sql')), true);
  } finally {
    await new Promise((resolve) => app.close(resolve));
  }
});

test('serves AI report draft API for stored diagnosis run', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-ai-report-'));
  const app = createServer({
    dataDir: dir,
    fetcher: async (url) => ({
      url,
      status: 200,
      contentType: 'text/html',
      html: '<title>Home</title><h1>Home</h1>'
    })
  });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;
    const diagnoseResponse = await fetch(`${baseUrl}/api/diagnose`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ siteUrl: 'https://example.com/' })
    });
    const { run } = await diagnoseResponse.json();

    const aiResponse = await fetch(`${baseUrl}/api/ai/reports/${run.id}`, { method: 'POST' });
    const body = await aiResponse.json();

    assert.equal(aiResponse.status, 200);
    assert.equal(body.report.ai.provider, 'mock');
    assert.match(body.report.executiveSummary, /실제 진단 근거/);
    assert.doesNotMatch(body.report.executiveSummary, /mock/i);
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('report routes require a share token when admin auth is configured', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-report-token-'));
  const app = createServer({
    dataDir: dir,
    adminToken: 'secret-token',
    fetcher: async (url) => ({
      url,
      status: 200,
      contentType: 'text/html',
      html: '<title>Home</title><h1>Home</h1>'
    })
  });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;
    const diagnoseResponse = await fetch(`${baseUrl}/api/diagnose`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ siteUrl: 'https://example.com/' })
    });
    const { run } = await diagnoseResponse.json();

    const deniedHtml = await fetch(`${baseUrl}/reports/${run.id}`);
    assert.equal(deniedHtml.status, 403);

    const sharedHtml = await fetch(`${baseUrl}/reports/${run.id}?token=${run.shareToken}`);
    assert.equal(sharedHtml.status, 200);

    const adminJson = await fetch(`${baseUrl}/api/reports/${run.id}`, {
      headers: { authorization: 'Bearer secret-token' }
    });
    assert.equal(adminJson.status, 200);
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('report share tokens still work when production admin auth is not configured', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-prod-report-token-'));
  const app = createServer({
    dataDir: dir,
    adminToken: '',
    nodeEnv: 'production',
    fetcher: async (url) => ({
      url,
      status: 200,
      contentType: 'text/html',
      html: '<title>Home</title><h1>Home</h1>'
    })
  });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;
    const diagnoseResponse = await fetch(`${baseUrl}/api/diagnose`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ siteUrl: 'https://example.com/' })
    });
    const { run } = await diagnoseResponse.json();

    const deniedHtml = await fetch(`${baseUrl}/reports/${run.id}`);
    assert.equal(deniedHtml.status, 403);

    const sharedHtml = await fetch(`${baseUrl}/reports/${run.id}?token=${run.shareToken}`);
    assert.equal(sharedHtml.status, 200);
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('diagnose API uses sitemap URLs as crawl seeds', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-sitemap-diagnose-'));
  const app = createServer({
    dataDir: dir,
    fetcher: async (url) => {
      if (url.endsWith('/robots.txt')) {
        return { url, status: 200, contentType: 'text/plain', text: 'Sitemap: https://example.com/sitemap.xml' };
      }
      if (url.endsWith('/sitemap.xml')) {
        return {
          url,
          status: 200,
          contentType: 'application/xml',
          text: '<urlset><url><loc>https://example.com/service</loc></url></urlset>'
        };
      }
      return {
        url,
        status: 200,
        contentType: 'text/html',
        html: '<title>Page</title><h1>Page</h1>'
      };
    }
  });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;
    const response = await fetch(`${baseUrl}/api/diagnose`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ siteUrl: 'https://example.com/' })
    });
    const data = await response.json();

    assert.equal(response.status, 201);
    assert.equal(data.run.pagesAnalyzed, 2);
    assert.ok(data.run.siteAssets.sitemapUrls.includes('https://example.com/service'));
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('diagnose API includes link status issues in the diagnosis run', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-link-status-'));
  const app = createServer({
    dataDir: dir,
    fetcher: async (url) => {
      if (url.endsWith('/robots.txt')) return { url, status: 404, contentType: 'text/plain', text: '' };
      if (url.endsWith('/sitemap.xml')) return { url, status: 404, contentType: 'text/plain', text: '' };
      if (url.endsWith('/missing')) return { url, status: 404, contentType: 'text/html', html: '<title>Missing</title>' };
      if (url.endsWith('/old')) return { url: 'https://example.com/new', status: 301, contentType: 'text/html', html: '<title>Moved</title>' };
      return {
        url,
        status: 200,
        contentType: 'text/html',
        html: '<title>Home</title><h1>Home</h1><a href="/missing">Missing</a><a href="/old">Old</a>'
      };
    }
  });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;
    const response = await fetch(`${baseUrl}/api/diagnose`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ siteUrl: 'https://example.com/' })
    });
    const data = await response.json();

    assert.equal(response.status, 201);
    assert.ok(data.run.linkStatus.checkedLinks.length >= 2);
    assert.ok(data.run.issues.some((issue) => issue.name === '깨진 링크 발견'));
    assert.ok(data.run.issues.some((issue) => issue.name === '리다이렉트 링크 발견'));
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('diagnose API exposes analysis coverage for trust evidence', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-analysis-coverage-'));
  const app = createServer({
    dataDir: dir,
    crawler: {
      maxPages: 2,
      maxDepth: 1,
      maxBytes: 512000,
      maxQueryParams: 8,
      maxLinkChecks: 3,
      renderJavaScript: 'auto'
    },
    fetcher: async (url) => {
      if (url.endsWith('/robots.txt')) return { url, status: 404, contentType: 'text/plain', text: '' };
      if (url.endsWith('/sitemap.xml')) return { url, status: 404, contentType: 'text/plain', text: '' };
      if (url.endsWith('/service')) {
        return {
          url,
          status: 200,
          contentType: 'text/html',
          html: '<title>Service</title><h1>Service</h1><a href="/deep">Deep</a>'
        };
      }
      return {
        url,
        status: 200,
        contentType: 'text/html',
        html: '<title>Home</title><h1>Home</h1><a href="/service">Service</a><a href="/contact">Contact</a>'
      };
    }
  });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;
    const response = await fetch(`${baseUrl}/api/diagnose`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ siteUrl: 'https://example.com/', industry: 'manufacturing' })
    });
    const data = await response.json();

    assert.equal(response.status, 201);
    assert.equal(data.run.analysisCoverage.maxPages, 2);
    assert.equal(data.run.analysisCoverage.analyzedPages, 2);
    assert.equal(data.run.analysisCoverage.skippedUrls >= 1, true);
    assert.equal(data.run.analysisCoverage.crawlBudgetUsageRate, 100);
    assert.equal(data.run.analysisCoverage.isSampledCrawl, true);
    assert.equal(Object.values(data.run.analysisCoverage.skippedReasonCounts).reduce((sum, count) => sum + count, 0) >= 1, true);
    assert.equal(data.run.analysisCoverage.checkedLinks, data.run.linkStatus.checkedLinks.length);
    assert.equal(data.run.analysisCoverage.renderedPages, 0);
    assert.equal(data.run.webQualityScores.source, 'sitefit-rules');
    assert.equal(typeof data.run.webQualityScores.performance, 'number');
    assert.equal(typeof data.run.webQualityScores.accessibility, 'number');
    assert.equal(typeof data.run.webQualityScores.bestPractices, 'number');
    assert.equal(typeof data.run.webQualityScores.seo, 'number');
    assert.equal(data.run.salesConversion.ctaLabel, '진단 결과 기반 개선안 받기');
    assert.equal(data.run.salesConversion.recommendedPackages.length > 0, true);
    assert.equal(typeof data.run.salesConversion.expertRequiredIssueCount, 'number');
    assert.match(data.run.salesConversion.salesTalkTrack.headline, /제조\/산업/);
    assert.equal(data.run.trustEvidence.source, 'sitefit-rules');
    assert.ok(data.run.trustEvidence.items.some((item) => item.label === '수집 한도 사용'));
    assert.ok(data.run.trustEvidence.items.some((item) => item.label === '분석률'));
    assert.match(data.run.summary, /분석률/);
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('diagnose API applies inferred industry-specific rules', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-industry-rules-'));
  const app = createServer({
    dataDir: dir,
    fetcher: async (url) => {
      if (url.endsWith('/robots.txt')) return { url, status: 404, contentType: 'text/plain', text: '' };
      if (url.endsWith('/sitemap.xml')) return { url, status: 404, contentType: 'text/plain', text: '' };
      return {
        url,
        status: 200,
        contentType: 'text/html',
        html: '<title>온라인 쇼핑몰</title><h1>프리미엄 상품 구매</h1><p>상품 소개와 장바구니 구매 안내입니다.</p>'
      };
    }
  });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;
    const response = await fetch(`${baseUrl}/api/diagnose`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ siteUrl: 'https://shop.example.com/' })
    });
    const data = await response.json();

    assert.equal(response.status, 201);
    assert.equal(data.run.businessCategory.id, 'commerce');
    assert.ok(data.run.industryRules.issues.some((issue) => issue.name === '쇼핑몰 구매 정보 부족'));
    assert.ok(data.run.issues.some((issue) => issue.name === '쇼핑몰 구매 정보 부족'));
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('diagnose score includes site asset issues such as missing sitemap', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-asset-score-'));
  const app = createServer({
    dataDir: dir,
    fetcher: async (url) => {
      if (url.endsWith('/robots.txt')) {
        return { url, status: 200, contentType: 'text/plain', text: 'User-agent: *\nAllow: /' };
      }
      if (url.endsWith('/sitemap.xml')) {
        return { url, status: 404, contentType: 'text/plain', text: 'not found' };
      }
      return {
        url,
        status: 200,
        contentType: 'text/html',
        html: `
          <title>B2B SEO Consulting</title>
          <meta name="description" content="B2B SEO consulting with clear pricing, process, comparison, and consultation.">
          <link rel="canonical" href="https://example.com/">
          <script type="application/ld+json">{"@type":"Organization","name":"Example"}</script>
          <h1>B2B SEO Consulting</h1>
          <h2>FAQ</h2><p>How much does it cost?</p>
          <p>Pricing starts from a fixed estimate package.</p>
          <p>Process: consultation, diagnosis, delivery, monthly monitoring.</p>
          <p>Comparison and alternatives help customers choose.</p>
          <p>Portfolio, client reviews, certification, and years of experience.</p>
          <a href="/about">About</a><a href="/contact">Contact</a>
          <button>Request consultation</button>
        `
      };
    }
  });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;
    const response = await fetch(`${baseUrl}/api/diagnose`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ siteUrl: 'https://example.com/' })
    });
    const data = await response.json();

    assert.equal(response.status, 201);
    assert.ok(data.run.issues.some((issue) => issue.name === 'sitemap.xml 누락'));
    assert.ok(data.run.scores.overall < 100);
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('sales APIs update lead status and create estimate drafts', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-sales-'));
  const app = createServer({ dataDir: dir });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;
    const leadResponse = await fetch(`${baseUrl}/api/leads`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Park',
        email: 'park@example.com',
        siteUrl: 'https://example.com/',
        budgetRange: '300-700',
        desiredWork: 'fix-and-monthly',
        timeline: 'urgent',
        issueCount: 6,
        highImpactIssueCount: 2
      })
    });
    const { lead } = await leadResponse.json();

    const statusResponse = await fetch(`${baseUrl}/api/leads/${lead.id}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nextStatus: 'consultation_scheduled' })
    });
    const statusBody = await statusResponse.json();

    assert.equal(statusResponse.status, 200);
    assert.equal(statusBody.lead.salesStatus, 'consultation_scheduled');

    const estimateResponse = await fetch(`${baseUrl}/api/estimates`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        leadId: lead.id,
        desiredWork: 'fix-and-monthly',
        issues: [
          { workType: 'technical-seo', impact: 'high', expectedScope: 'small' },
          { workType: 'conversion-improvement', impact: 'high', expectedScope: 'medium' }
        ]
      })
    });
    const estimateBody = await estimateResponse.json();

    assert.equal(estimateResponse.status, 201);
    assert.equal(estimateBody.estimate.leadId, lead.id);
    assert.equal(estimateBody.estimate.status, 'draft');

    const estimateStatusResponse = await fetch(`${baseUrl}/api/estimates/${estimateBody.estimate.id}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nextStatus: 'sent' })
    });
    const estimateStatusBody = await estimateStatusResponse.json();

    assert.equal(estimateStatusResponse.status, 200);
    assert.equal(estimateStatusBody.estimate.status, 'sent');
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('estimate status API rejects unknown estimates and invalid states', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-estimate-status-'));
  const app = createServer({ dataDir: dir });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;
    const missingResponse = await fetch(`${baseUrl}/api/estimates/missing/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nextStatus: 'sent' })
    });
    assert.equal(missingResponse.status, 404);

    const estimateResponse = await fetch(`${baseUrl}/api/estimates`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        leadId: 'lead_1',
        issues: [{ workType: 'technical-seo', impact: 'high', expectedScope: 'small' }]
      })
    });
    const { estimate } = await estimateResponse.json();

    const invalidResponse = await fetch(`${baseUrl}/api/estimates/${estimate.id}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nextStatus: 'contracted' })
    });
    assert.equal(invalidResponse.status, 400);
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('rediagnosis API compares two stored diagnosis runs', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-rediagnosis-'));
  const app = createServer({
    dataDir: dir,
    fetcher: async (url) => ({
      url,
      status: 200,
      contentType: 'text/html',
      html: url.includes('after')
        ? `<!doctype html>
          <html lang="ko">
            <head>
              <title>After SEO Consulting Service | Example</title>
              <meta name="description" content="Improved search-ready page description for consulting customers who need clear service, process, price and contact information.">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <meta property="og:title" content="After SEO Consulting Service">
              <meta property="og:description" content="Improved search-ready page description for consulting customers.">
              <link rel="canonical" href="https://example.com/after">
              <script type="application/ld+json">{"@type":"Organization","name":"Example"}</script>
            </head>
            <body>
              <h1>After SEO Consulting Service</h1>
              <h2>How does the service work?</h2>
              <p>This page explains consulting, process, pricing, comparison criteria, certification, portfolio, client cases, review evidence, estimate request, and monthly management for B2B customers.</p>
              <section id="faq"><h2>FAQ</h2><p>How much does it cost? The price depends on scope and schedule.</p></section>
              <a href="/contact">Contact</a>
              <a href="mailto:sales@example.com">Email</a>
              <button>Request consultation</button>
            </body>
          </html>`
        : '<title>Before</title><h1>Before</h1>'
    })
  });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;
    const beforeResponse = await fetch(`${baseUrl}/api/diagnose`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ siteUrl: 'https://example.com/before' })
    });
    const afterResponse = await fetch(`${baseUrl}/api/diagnose`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ siteUrl: 'https://example.com/after' })
    });
    const before = await beforeResponse.json();
    const after = await afterResponse.json();

    const compareResponse = await fetch(`${baseUrl}/api/rediagnosis/compare`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ beforeRunId: before.run.id, afterRunId: after.run.id })
    });
    const comparison = await compareResponse.json();

    assert.equal(compareResponse.status, 200);
    assert.ok(comparison.scoreDelta > 0);
    assert.ok(Array.isArray(comparison.resolvedIssues));
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('protects admin and sales APIs when an admin token is configured', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-auth-'));
  const app = createServer({ dataDir: dir, adminToken: 'secret-token' });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;
    const denied = await fetch(`${baseUrl}/api/admin/summary`);
    assert.equal(denied.status, 401);

    const allowed = await fetch(`${baseUrl}/api/admin/summary`, {
      headers: { authorization: 'Bearer secret-token' }
    });
    assert.equal(allowed.status, 200);
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('requires an admin token for protected APIs in production', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-prod-auth-'));
  const app = createServer({ dataDir: dir, adminToken: '', nodeEnv: 'production' });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;
    const health = await fetch(`${baseUrl}/health`);
    assert.equal(health.status, 200);

    const denied = await fetch(`${baseUrl}/api/admin/summary`);
    const deniedBody = await denied.json();
    assert.equal(denied.status, 401);
    assert.equal(deniedBody.error, 'admin_token_required');

    const sessionResponse = await fetch(`${baseUrl}/api/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: '' })
    });
    const sessionBody = await sessionResponse.json();
    assert.equal(sessionResponse.status, 503);
    assert.equal(sessionBody.error, 'admin_token_required');
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('creates admin session cookie from valid token', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-session-'));
  const app = createServer({ dataDir: dir, adminToken: 'secret-token' });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;
    const loginResponse = await fetch(`${baseUrl}/api/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'secret-token' })
    });
    const cookie = loginResponse.headers.get('set-cookie');

    assert.equal(loginResponse.status, 204);
    assert.match(cookie, /sitefit_admin=/);

    const summaryResponse = await fetch(`${baseUrl}/api/admin/summary`, {
      headers: { cookie }
    });
    assert.equal(summaryResponse.status, 200);
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('rejects invalid admin session token', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-session-denied-'));
  const app = createServer({ dataDir: dir, adminToken: 'secret-token' });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;
    const loginResponse = await fetch(`${baseUrl}/api/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'wrong-token' })
    });

    assert.equal(loginResponse.status, 401);
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('exposes SI package catalog', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-packages-'));
  const app = createServer({ dataDir: dir });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;
    const response = await fetch(`${baseUrl}/api/packages`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.ok(body.packages.some((pkg) => pkg.id === 'technical-seo-cleanup'));
    assert.ok(body.packages.some((pkg) => pkg.id === 'monthly-search-content'));
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});

test('recognizes Windows and POSIX script paths as the main module', () => {
  assert.equal(isMainModule('file:///C:/project/src/server.js', 'C:\\project\\src\\server.js'), true);
  assert.equal(isMainModule('file:///home/me/project/src/server.js', '/home/me/project/src/server.js'), true);
});
