import { createServer as createHttpServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomBytes } from 'node:crypto';

import { loadConfig } from './config.js';
import { generateAiReportDraft } from './ai/ai-report.js';
import { MockChatClient } from './ai/mock-chat-client.js';
import { crawlSite } from './crawler/crawl-site.js';
import { createPlaywrightRenderer } from './crawler/playwright-renderer.js';
import { analyzeHtml } from './diagnosis/analyze-html.js';
import { analyzeIndustryRules } from './diagnosis/industry-rules.js';
import { analyzeSiteStructure } from './diagnosis/analyze-site.js';
import { compareDiagnosisRuns } from './diagnosis/compare-runs.js';
import { analyzeLinkStatus } from './diagnosis/link-status.js';
import { analyzeSiteAssets } from './diagnosis/site-assets.js';
import { calculateWebQualityScores } from './diagnosis/web-quality.js';
import { DEMO_SITE_FIXTURES, analyzeDemoSiteFixture } from './demo/site-fixtures.js';
import { renderReportHtml } from './reporting/render-report-html.js';
import { createMonthlyAccount } from './operations/monthly-management.js';
import { assignPartner } from './operations/partner-assignment.js';
import { createSalesConversionPlan, createTrustEvidenceSummary } from './sales/conversion-plan.js';
import { createEstimateDraft } from './sales/estimate.js';
import { transitionEstimateStatus } from './sales/estimate-status.js';
import { SI_PACKAGES } from './sales/package-recommendation.js';
import { transitionLeadStatus } from './sales/pipeline.js';
import { scoreLead } from './leads/lead-score.js';
import { JsonStore } from './storage/json-store.js';

const CONFIG = loadConfig();
const DEFAULT_PORT = CONFIG.port;
const PUBLIC_DIR = join(process.cwd(), 'public');

export function createServer({ dataDir = 'data', fetcher, renderer, adminToken = CONFIG.adminToken, nodeEnv = process.env.NODE_ENV || 'development', crawler = CONFIG.crawler, chatClient = new MockChatClient() } = {}) {
  const store = new JsonStore(dataDir);

  return createHttpServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);

      if (request.method === 'GET' && url.pathname === '/health') {
        return sendJson(response, 200, {
          ok: true,
          service: 'sitefit',
          timestamp: new Date().toISOString()
        });
      }

      if (request.method === 'POST' && url.pathname === '/api/session') {
        return handleSession(request, response, adminToken, nodeEnv);
      }

      if (requiresAdminAuth(request, url) && !isAuthorized(request, adminToken, nodeEnv)) {
        return sendJson(response, 401, authRequiredPayload(adminToken, nodeEnv));
      }

      if (request.method === 'POST' && url.pathname === '/api/diagnose') {
        return handleDiagnose(request, response, store, fetcher, renderer, crawler, chatClient);
      }

      if (request.method === 'GET' && url.pathname === '/api/packages') {
        return sendJson(response, 200, { packages: SI_PACKAGES });
      }

      if (request.method === 'GET' && url.pathname === '/api/admin/demo-fixtures') {
        return sendJson(response, 200, {
          fixtures: DEMO_SITE_FIXTURES.map(({ id, label, industry, expectedTalkLabel }) => ({
            id,
            label,
            industry,
            expectedTalkLabel
          }))
        });
      }

      if (request.method === 'POST' && url.pathname === '/api/admin/demo-runs') {
        return handleAdminDemoRun(request, response, store, chatClient);
      }

      if (request.method === 'DELETE' && url.pathname === '/api/admin/demo-data') {
        return handleAdminDemoDataDelete(request, response, store);
      }

      const apiReportMatch = url.pathname.match(/^\/api\/reports\/([^/]+)$/);
      if (request.method === 'GET' && apiReportMatch) {
        return handleReportJson(request, response, store, apiReportMatch[1], url, adminToken, nodeEnv);
      }

      const aiReportMatch = url.pathname.match(/^\/api\/ai\/reports\/([^/]+)$/);
      if (request.method === 'POST' && aiReportMatch) {
        return handleAiReport(request, response, store, aiReportMatch[1], chatClient, url, adminToken, nodeEnv);
      }

      const htmlReportMatch = url.pathname.match(/^\/reports\/([^/]+)$/);
      if (request.method === 'GET' && htmlReportMatch) {
        return handleReportHtml(request, response, store, htmlReportMatch[1], url, adminToken, nodeEnv);
      }

      if (request.method === 'POST' && url.pathname === '/api/leads') {
        return handleLead(request, response, store);
      }

      const leadStatusMatch = url.pathname.match(/^\/api\/leads\/([^/]+)\/status$/);
      if (request.method === 'PATCH' && leadStatusMatch) {
        return handleLeadStatus(request, response, store, leadStatusMatch[1]);
      }

      if (request.method === 'POST' && url.pathname === '/api/estimates') {
        return handleEstimate(request, response, store);
      }

      const estimateStatusMatch = url.pathname.match(/^\/api\/estimates\/([^/]+)\/status$/);
      if (request.method === 'PATCH' && estimateStatusMatch) {
        return handleEstimateStatus(request, response, store, estimateStatusMatch[1]);
      }

      if (request.method === 'POST' && url.pathname === '/api/rediagnosis/compare') {
        return handleRediagnosisCompare(request, response, store);
      }

      if (request.method === 'POST' && url.pathname === '/api/notes') {
        return handleNote(request, response, store);
      }

      if (request.method === 'POST' && url.pathname === '/api/partners') {
        return handlePartner(request, response, store);
      }

      if (request.method === 'POST' && url.pathname === '/api/assignments') {
        return handleAssignment(request, response, store);
      }

      if (request.method === 'POST' && url.pathname === '/api/monthly-accounts') {
        return handleMonthlyAccount(request, response, store);
      }

      if (request.method === 'GET' && url.pathname === '/api/admin/summary') {
        return handleAdminSummary(response, store);
      }

      if (request.method === 'GET' && url.pathname === '/api/admin/runs') {
        return sendJson(response, 200, { runs: await store.listDiagnosisRuns() });
      }

      if (request.method === 'GET' && url.pathname === '/api/admin/leads') {
        return sendJson(response, 200, { leads: await store.listLeads() });
      }

      if (request.method === 'GET' && url.pathname === '/api/admin/estimates') {
        return sendJson(response, 200, { estimates: await store.listEstimates() });
      }

      if (request.method === 'GET' && url.pathname === '/api/admin/notes') {
        return sendJson(response, 200, { notes: await store.listNotes() });
      }

      if (request.method === 'GET' && url.pathname === '/api/admin/partners') {
        return sendJson(response, 200, { partners: await store.listPartners() });
      }

      if (request.method === 'GET' && url.pathname === '/api/admin/assignments') {
        return sendJson(response, 200, { assignments: await store.listAssignments() });
      }

      if (request.method === 'GET' && url.pathname === '/api/admin/monthly-accounts') {
        return sendJson(response, 200, { accounts: await store.listMonthlyAccounts() });
      }

      if (request.method === 'GET' && url.pathname === '/api/admin/export') {
        return sendJson(response, 200, await store.exportAll());
      }

      return serveStatic(url.pathname, response);
    } catch (error) {
      return sendJson(response, 500, { error: 'internal_error', message: error.message });
    }
  });
}

function requiresAdminAuth(request, url) {
  if (url.pathname.startsWith('/api/admin/')) return true;
  if (url.pathname.startsWith('/api/estimates')) return true;
  if (url.pathname.startsWith('/api/rediagnosis')) return true;
  if (url.pathname.startsWith('/api/notes')) return true;
  if (url.pathname.startsWith('/api/partners')) return true;
  if (url.pathname.startsWith('/api/assignments')) return true;
  if (url.pathname.startsWith('/api/monthly-accounts')) return true;
  if (request.method === 'PATCH' && /^\/api\/leads\/[^/]+\/status$/.test(url.pathname)) return true;
  return false;
}

function isAuthorized(request, adminToken, nodeEnv = process.env.NODE_ENV || 'development') {
  if (!adminToken) return nodeEnv !== 'production';
  return request.headers.authorization === `Bearer ${adminToken}` ||
    parseCookies(request.headers.cookie || '').sitefit_admin === sessionValue(adminToken);
}

function authRequiredPayload(adminToken, nodeEnv) {
  if (!adminToken && nodeEnv === 'production') {
    return { error: 'admin_token_required' };
  }
  return { error: 'unauthorized' };
}

async function handleSession(request, response, adminToken, nodeEnv) {
  if (!adminToken) {
    if (nodeEnv === 'production') {
      return sendJson(response, 503, { error: 'admin_token_required' });
    }
    return sendJson(response, 200, { ok: true, mode: 'disabled' });
  }

  const body = await readJson(request);
  if (body.token !== adminToken) {
    return sendJson(response, 401, { error: 'invalid_token' });
  }

  response.writeHead(204, {
    'set-cookie': `sitefit_admin=${sessionValue(adminToken)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`
  });
  response.end();
}

function sessionValue(adminToken) {
  return createHash('sha256').update(`sitefit:${adminToken}`).digest('hex');
}

function parseCookies(cookieHeader) {
  return Object.fromEntries(
    cookieHeader
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=');
        return index === -1 ? [part, ''] : [part.slice(0, index), part.slice(index + 1)];
      })
  );
}

async function handleDiagnose(request, response, store, fetcher, renderer, crawlerConfig, chatClient) {
  const body = await readJson(request);
  const preflightAssets = await analyzeSiteAssets(body.siteUrl, { fetcher: assetFetcherFrom(fetcher) });
  const crawl = await crawlSite(body.siteUrl, {
    maxPages: Number(body.maxPages || crawlerConfig.maxPages),
    maxDepth: Number(body.maxDepth || crawlerConfig.maxDepth),
    maxBytes: Number(body.maxBytes || crawlerConfig.maxBytes),
    maxQueryParams: Number(body.maxQueryParams || crawlerConfig.maxQueryParams),
    seedUrls: preflightAssets.sitemapUrls,
    disallowPaths: preflightAssets.robotsRules?.disallow,
    fetcher,
    renderer,
    renderJavaScript: body.renderJavaScript || crawlerConfig.renderJavaScript
  });

  if (!crawl.pages.length) {
    const message = crawl.errors[0]?.message || '진단 가능한 HTML 페이지를 찾지 못했습니다.';
    return sendJson(response, 400, { error: 'crawl_failed', message, crawl });
  }

  const pageResults = crawl.pages.map((page) => analyzeHtml({
    url: page.url,
    html: page.html,
    performance: page.performance,
    industry: body.industry || 'unknown',
    goal: body.goal || 'unknown'
  }));
  const siteAssets = preflightAssets.rootUrl === crawl.rootUrl
    ? preflightAssets
    : await analyzeSiteAssets(crawl.rootUrl, { fetcher: assetFetcherFrom(fetcher) });
  const siteStructure = analyzeSiteStructure({
    rootUrl: crawl.rootUrl,
    pageResults
  });
  const maxLinkChecks = Number(body.maxLinkChecks || crawlerConfig.maxLinkChecks || 100);
  const linkStatus = await analyzeLinkStatus({
    rootUrl: crawl.rootUrl,
    pageResults,
    fetcher: linkStatusFetcherFrom(fetcher),
    maxLinks: maxLinkChecks
  });
  const industryRules = analyzeIndustryRules({
    businessCategory: siteStructure.businessCategory,
    pageResults
  });
  const issues = [
    ...siteAssets.issues,
    ...siteStructure.issues,
    ...linkStatus.issues,
    ...industryRules.issues,
    ...pageResults.flatMap((result) => result.issues)
  ];
  const scores = calculateRunScores(pageResults, [...siteAssets.issues, ...siteStructure.issues, ...linkStatus.issues, ...industryRules.issues]);
  const webQualityScores = calculateWebQualityScores({ scores, issues, pageResults });
  const uniqueIssueCount = countUniqueIssues(issues);
  const inferredIndustry = body.industry && body.industry !== 'unknown'
    ? body.industry
    : siteStructure.businessCategory?.id || 'unknown';
  const analysisCoverage = buildAnalysisCoverage({
    crawl,
    pageResults,
    linkStatus,
    maxPages: Number(body.maxPages || crawlerConfig.maxPages),
    maxDepth: Number(body.maxDepth || crawlerConfig.maxDepth),
    maxBytes: Number(body.maxBytes || crawlerConfig.maxBytes),
    maxLinkChecks
  });
  const result = {
    url: crawl.rootUrl,
    industry: inferredIndustry,
    goal: body.goal || 'unknown',
    businessCategory: siteStructure.businessCategory,
    pagesAnalyzed: pageResults.length,
    scores,
    webQualityScores,
    issues,
    pageResults,
    siteAssets,
    siteStructure,
    linkStatus,
    industryRules,
    analysisCoverage,
    crawl,
    shareToken: randomBytes(18).toString('hex'),
    summary: `${pageResults.length}개 페이지를 분석했습니다. 분석률 ${analysisCoverage.analysisRate}% 기준으로 주요 개선 유형 ${uniqueIssueCount}개, 페이지별 탐지 ${issues.length}건을 확인했습니다. 종합 준비도 점수: ${scores.overall}.`
  };
  result.report = await generateAiReportDraft({
    chatClient,
    diagnosis: result
  });
  result.salesConversion = createSalesConversionPlan({
    issues,
    workOrders: result.report?.workOrders || [],
    scores,
    businessCategory: categoryForSalesConversation(inferredIndustry, siteStructure.businessCategory)
  });
  result.trustEvidence = createTrustEvidenceSummary({
    analysisCoverage,
    webQualityScores,
    issues
  });
  const run = await store.addDiagnosisRun(result);

  return sendJson(response, 201, { run });
}

function buildAnalysisCoverage({ crawl, pageResults, linkStatus, maxPages, maxDepth, maxBytes, maxLinkChecks }) {
  const sameOriginSkipped = (crawl.skipped || [])
    .filter((item) => !['external_origin', 'external_seed'].includes(item.reason));
  const skippedUrls = sameOriginSkipped.length;
  const analyzedPages = pageResults.length;
  const discoveredUrls = analyzedPages + skippedUrls;
  const renderedPages = crawl.pages?.filter((page) => page.rendered).length || 0;
  const crawlBudgetUsageRate = maxPages
    ? Math.min(100, Math.round((analyzedPages / maxPages) * 100))
    : 100;
  const analysisRate = discoveredUrls
    ? Math.round((analyzedPages / discoveredUrls) * 100)
    : 100;
  const skippedReasonCounts = sameOriginSkipped.reduce((counts, item) => {
    const reason = item.reason || 'unknown';
    counts[reason] = (counts[reason] || 0) + 1;
    return counts;
  }, {});
  const isSampledCrawl = skippedUrls > 0 || (maxPages ? analyzedPages >= maxPages : false);

  return {
    analyzedPages,
    discoveredUrls,
    skippedUrls,
    analysisRate,
    crawlBudgetUsageRate,
    isSampledCrawl,
    skippedReasonCounts,
    maxPages,
    maxDepth,
    maxBytes,
    maxLinkChecks,
    checkedLinks: linkStatus.checkedLinks?.length || 0,
    skippedLinks: linkStatus.skippedLinks?.length || 0,
    renderedPages
  };
}

function categoryForSalesConversation(industry, detectedCategory) {
  if (!industry || industry === 'unknown') return detectedCategory;
  if (detectedCategory?.id === industry) return detectedCategory;

  const labels = {
    'b2b': 'B2B 서비스',
    'b2b-service': 'B2B 서비스',
    commerce: '쇼핑몰/커머스',
    healthcare: '병원/의료',
    education: '교육/학원',
    manufacturing: '제조/산업',
    legal: '법률',
    finance: '금융'
  };

  return {
    id: industry,
    label: labels[industry] || detectedCategory?.label || '현재 사이트',
    confidence: detectedCategory?.confidence || 0,
    source: 'request'
  };
}

function assetFetcherFrom(fetcher) {
  if (!fetcher) return undefined;
  return async (url) => {
    const result = await fetcher(url);
    return {
      status: result.status,
      text: result.text ?? result.html ?? ''
    };
  };
}

function linkStatusFetcherFrom(fetcher) {
  if (!fetcher) return undefined;
  return async (url) => {
    const result = await fetcher(url);
    return {
      url: result.url || url,
      status: result.status
    };
  };
}

function calculateRunScores(pageResults, siteAssetIssues = []) {
  const scoreKeys = ['technical-seo', 'search-understanding', 'aeo', 'geo', 'conversion'];
  const scores = {};

  for (const key of scoreKeys) {
    const pageAverage = pageResults.length
      ? pageResults.reduce((sum, result) => sum + (result.scores[key] ?? 100), 0) / pageResults.length
      : 100;
    scores[key] = Math.round(pageAverage);
  }

  for (const issue of siteAssetIssues) {
    const layer = issue.layer || 'technical-seo';
    if (!(layer in scores)) continue;
    scores[layer] = Math.max(0, scores[layer] - scorePenalty(issue.impact));
  }

  scores.overall = Math.round(scoreKeys.reduce((sum, key) => sum + scores[key], 0) / scoreKeys.length);
  return scores;
}

function scorePenalty(impact) {
  return { high: 12, medium: 6, low: 3 }[impact] || 0;
}

function countUniqueIssues(issues) {
  return new Set(issues.map((issue) => `${issue.layer || 'unknown'}:${issue.name}`)).size;
}

async function handleLead(request, response, store) {
  const body = await readJson(request);
  const validation = validateLeadPayload(body);
  if (!validation.ok) {
    return sendJson(response, 400, {
      error: 'validation_failed',
      fields: validation.fields
    });
  }

  const leadScore = scoreLead({
    budgetRange: body.budgetRange,
    desiredWork: body.desiredWork,
    timeline: body.timeline,
    issueCount: body.issueCount,
    highImpactIssueCount: body.highImpactIssueCount
  });
  const lead = await store.addLead({
    salesStatus: 'consultation_requested',
    ...body,
    leadScore
  });

  return sendJson(response, 201, { lead });
}

async function handleAdminDemoRun(request, response, store, chatClient) {
  const body = await readJson(request);
  const fixture = DEMO_SITE_FIXTURES.find((item) => item.id === body.fixtureId) || DEMO_SITE_FIXTURES[0];
  const demoRun = {
    ...analyzeDemoSiteFixture(fixture),
    demoFixtureId: fixture.id,
    shareToken: randomBytes(18).toString('hex')
  };
  demoRun.summary = `${demoRun.pagesAnalyzed}개 데모 페이지를 분석했습니다. 분석률 ${demoRun.analysisCoverage.analysisRate}% 기준으로 영업 시연용 개선 유형 ${countUniqueIssues(demoRun.issues)}개를 확인했습니다. 종합 준비도 점수: ${demoRun.scores.overall}.`;
  demoRun.report = await generateAiReportDraft({
    chatClient,
    diagnosis: demoRun
  });

  const run = await store.addDiagnosisRun(demoRun);
  const lead = await store.addLead({
    demoFixtureId: fixture.id,
    salesStatus: 'consultation_requested',
    name: `${fixture.label} 담당자`,
    company: fixture.label,
    email: `${fixture.id}@demo.sitefit.local`,
    siteUrl: run.url,
    industry: fixture.industry,
    budgetRange: '300-700',
    desiredWork: 'fix-and-monthly',
    timeline: 'urgent',
    issueCount: run.issues.length,
    highImpactIssueCount: run.issues.filter((issue) => issue.impact === 'high').length,
    leadScore: scoreLead({
      budgetRange: '300-700',
      desiredWork: 'fix-and-monthly',
      timeline: 'urgent',
      issueCount: run.issues.length,
      highImpactIssueCount: run.issues.filter((issue) => issue.impact === 'high').length
    })
  });
  const estimate = await store.addEstimate(createEstimateDraft({
    leadId: lead.id,
    issues: run.issues,
    desiredWork: lead.desiredWork
  }));

  return sendJson(response, 201, { fixture: { id: fixture.id, label: fixture.label }, run, lead, estimate });
}

async function handleAdminDemoDataDelete(request, response, store) {
  const body = await readJson(request);
  if (body.confirm !== 'DELETE_DEMO_DATA') {
    return sendJson(response, 400, {
      error: 'confirmation_required',
      message: '데모 데이터 삭제 확인 문구가 필요합니다.'
    });
  }

  return sendJson(response, 200, await store.deleteDemoData());
}

function validateLeadPayload(body) {
  const requiredFields = ['name', 'email', 'siteUrl', 'budgetRange', 'desiredWork', 'timeline'];
  const fields = requiredFields.filter((field) => !String(body[field] || '').trim());
  return {
    ok: fields.length === 0,
    fields
  };
}

async function handleLeadStatus(request, response, store, leadId) {
  const body = await readJson(request);
  const leads = await store.listLeads();
  const lead = leads.find((item) => item.id === leadId);

  if (!lead) {
    return sendJson(response, 404, { error: 'lead_not_found' });
  }

  const transition = transitionLeadStatus(lead.salesStatus || 'consultation_requested', body.nextStatus);
  if (!transition.ok) {
    return sendJson(response, 400, { error: 'invalid_transition', message: transition.reason });
  }

  const updated = await store.updateLead(leadId, { salesStatus: transition.status });
  return sendJson(response, 200, { lead: updated });
}

async function handleEstimate(request, response, store) {
  const body = await readJson(request);
  const draft = createEstimateDraft({
    leadId: body.leadId,
    issues: body.issues || [],
    desiredWork: body.desiredWork
  });
  const estimate = await store.addEstimate(draft);

  return sendJson(response, 201, { estimate });
}

async function handleEstimateStatus(request, response, store, estimateId) {
  const body = await readJson(request);
  const estimates = await store.listEstimates();
  const estimate = estimates.find((item) => item.id === estimateId);

  if (!estimate) {
    return sendJson(response, 404, { error: 'estimate_not_found' });
  }

  const transition = transitionEstimateStatus(estimate.status || 'draft', body.nextStatus);
  if (!transition.ok) {
    return sendJson(response, 400, { error: 'invalid_transition', message: transition.reason });
  }

  const updated = await store.updateEstimate(estimateId, { status: transition.status });
  return sendJson(response, 200, { estimate: updated });
}

async function handleRediagnosisCompare(request, response, store) {
  const body = await readJson(request);
  const runs = await store.listDiagnosisRuns();
  const before = runs.find((run) => run.id === body.beforeRunId);
  const after = runs.find((run) => run.id === body.afterRunId);

  if (!before || !after) {
    return sendJson(response, 404, { error: 'diagnosis_run_not_found' });
  }

  return sendJson(response, 200, compareDiagnosisRuns({ before, after }));
}

async function handleReportJson(request, response, store, runId, url, adminToken, nodeEnv) {
  const runs = await store.listDiagnosisRuns();
  const run = runs.find((item) => item.id === runId);
  if (!run) return sendJson(response, 404, { error: 'report_not_found' });
  if (!canAccessReport(request, url, run, adminToken, nodeEnv)) return sendJson(response, 403, { error: 'report_forbidden' });
  return sendJson(response, 200, { run });
}

async function handleReportHtml(request, response, store, runId, url, adminToken, nodeEnv) {
  const runs = await store.listDiagnosisRuns();
  const run = runs.find((item) => item.id === runId);
  if (!run) return sendText(response, 404, '리포트를 찾을 수 없습니다.');
  if (!canAccessReport(request, url, run, adminToken, nodeEnv)) return sendText(response, 403, '리포트 접근 권한이 없습니다.');

  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(renderReportHtml(run));
}

async function handleAiReport(request, response, store, runId, chatClient, url, adminToken, nodeEnv) {
  const runs = await store.listDiagnosisRuns();
  const run = runs.find((item) => item.id === runId);
  if (!run) return sendJson(response, 404, { error: 'diagnosis_run_not_found' });
  if (!canAccessReport(request, url, run, adminToken, nodeEnv)) return sendJson(response, 403, { error: 'report_forbidden' });

  const report = await generateAiReportDraft({
    chatClient,
    diagnosis: run
  });
  return sendJson(response, 200, { report });
}

function canAccessReport(request, url, run, adminToken, nodeEnv) {
  if (isAuthorized(request, adminToken, nodeEnv)) return true;
  const token = url.searchParams.get('token');
  return Boolean(run.shareToken && token && token === run.shareToken);
}

async function handleNote(request, response, store) {
  const body = await readJson(request);
  const note = await store.addNote({
    leadId: body.leadId,
    body: body.body,
    author: body.author || '운영자'
  });
  return sendJson(response, 201, { note });
}

async function handlePartner(request, response, store) {
  const body = await readJson(request);
  const partner = await store.addPartner({
    name: body.name,
    capabilities: Array.isArray(body.capabilities) ? body.capabilities : []
  });
  return sendJson(response, 201, { partner });
}

async function handleAssignment(request, response, store) {
  const body = await readJson(request);
  const partners = await store.listPartners();
  const assignmentDraft = assignPartner({
    estimateId: body.estimateId,
    packageId: body.packageId,
    partners
  });
  const assignment = await store.addAssignment(assignmentDraft);
  return sendJson(response, assignment.ok ? 201 : 202, { assignment });
}

async function handleMonthlyAccount(request, response, store) {
  const body = await readJson(request);
  const account = await store.addMonthlyAccount(createMonthlyAccount({
    leadId: body.leadId,
    siteUrl: body.siteUrl,
    cadence: body.cadence,
    startedAt: body.startedAt
  }));
  return sendJson(response, 201, { account });
}

async function handleAdminSummary(response, store) {
  const [runs, leads] = await Promise.all([
    store.listDiagnosisRuns(),
    store.listLeads()
  ]);
  const hot = leads.filter((lead) => lead.leadScore?.grade === 'hot').length;
  const estimates = await store.listEstimates();
  const averageScore = runs.length
    ? Math.round(runs.reduce((sum, run) => sum + Number(run.scores?.overall || 0), 0) / runs.length)
    : 0;

  return sendJson(response, 200, {
    diagnosisRuns: {
      total: runs.length,
      averageScore
    },
    leads: {
      total: leads.length,
      hot
    },
    estimates: {
      total: estimates.length,
      draft: estimates.filter((estimate) => estimate.status === 'draft').length
    }
  });
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8') || '{}';
  return JSON.parse(raw);
}

async function serveStatic(pathname, response) {
  const route = pathname === '/' ? '/index.html' : pathname;
  const filePath = normalize(join(PUBLIC_DIR, route));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    return sendText(response, 403, '접근할 수 없습니다.');
  }

  try {
    const content = await readFile(filePath);
    response.writeHead(200, {
      'content-type': contentTypeFor(filePath),
      'cache-control': 'no-store'
    });
    response.end(content);
  } catch (error) {
    if (error.code === 'ENOENT') return sendText(response, 404, '찾을 수 없습니다.');
    throw error;
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function sendText(response, status, text) {
  response.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
  response.end(text);
}

function contentTypeFor(filePath) {
  const extension = extname(filePath);
  return {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8'
  }[extension] || 'application/octet-stream';
}

export function isMainModule(metaUrl, argvPath) {
  return normalizeComparablePath(fileUrlToPathSafe(metaUrl)) === normalizeComparablePath(argvPath);
}

function fileUrlToPathSafe(metaUrl) {
  try {
    return fileURLToPath(metaUrl);
  } catch {
    const pathname = decodeURIComponent(new URL(metaUrl).pathname);
    return pathname.replace(/^\/([A-Za-z]:\/)/, '$1');
  }
}

function normalizeComparablePath(filePath) {
  return normalize(filePath).replaceAll('\\', '/').toLowerCase();
}

if (isMainModule(import.meta.url, process.argv[1])) {
  startServer().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

async function startServer() {
  const renderer = CONFIG.crawler.renderer === 'playwright'
    ? await createPlaywrightRenderer()
    : undefined;
  createServer({ renderer }).listen(DEFAULT_PORT, () => {
    console.log(`SiteFit running at http://localhost:${DEFAULT_PORT}`);
  });
}
