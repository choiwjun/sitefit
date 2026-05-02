import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';

test('public diagnosis form only asks for the site URL before analysis', async () => {
  const html = await readFile('public/index.html', 'utf8');

  assert.match(html, /name="siteUrl"/);
  assert.match(html, /inputmode="url"/);
  assert.match(html, /example\.com/);
  assert.match(html, /URL 진단 시작/);
  assert.doesNotMatch(html, /href="\/admin\.html"/);
  assert.doesNotMatch(html, /name="industry"/);
  assert.doesNotMatch(html, /name="goal"/);
});

test('public landing page exposes SEO GEO AEO discovery signals', async () => {
  const html = await readFile('public/index.html', 'utf8');
  const robots = await readFile('public/robots.txt', 'utf8');
  const sitemap = await readFile('public/sitemap.xml', 'utf8');
  const adminHtml = await readFile('public/admin.html', 'utf8');
  const loginHtml = await readFile('public/admin-login.html', 'utf8');

  assert.match(html, /rel="canonical"/);
  assert.match(html, /property="og:title"/);
  assert.match(html, /name="twitter:card"/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /"@type": "Organization"/);
  assert.match(html, /"@type": "Service"/);
  assert.match(html, /"@type": "FAQPage"/);
  assert.match(html, /자주 묻는 질문/);
  assert.match(html, /진단은 이렇게 진행됩니다/);
  assert.match(html, /schema\.org/);
  assert.match(robots, /Sitemap: https:\/\/sitefit\.dicore-lab\.com\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/sitefit\.dicore-lab\.com\/<\/loc>/);
  assert.match(adminHtml, /noindex,nofollow/);
  assert.match(loginHtml, /noindex,nofollow/);
});

test('public report UI hides technical scoring disclaimer copy', async () => {
  const script = await readFile('public/app.js', 'utf8');

  assert.doesNotMatch(script, /Lighthouse-style/);
  assert.doesNotMatch(script, /PageSpeed/);
  assert.doesNotMatch(script, /AI API/);
  assert.doesNotMatch(script, /SiteFit rule/);
  assert.doesNotMatch(script, /보장하지 않습니다/);
});

test('public result does not cap work orders at five items', async () => {
  const script = await readFile('public/app.js', 'utf8');

  assert.doesNotMatch(script, /workOrders\s*\|\|\s*\[\]\)\.slice\(0,\s*5\)/);
});

test('public result copy is Korean and presents actual analyzed issues', async () => {
  const script = await readFile('public/app.js', 'utf8');

  assert.match(script, /전체 실제 분석 이슈/);
  assert.match(script, /분석 근거 요약/);
  assert.match(script, /robots/);
  assert.match(script, /내부 링크/);
  assert.match(script, /질문형 제목/);
  assert.match(script, /직접 답변/);
  assert.match(script, /엔티티/);
  assert.match(script, /추정 업종 카테고리/);
  assert.match(script, /주요 개선 유형/);
  assert.match(script, /진단을 진행하고 있습니다/);
  assert.doesNotMatch(script, /mock 분석/);
});

test('public diagnosis result is grouped into readable summary sections', async () => {
  const script = await readFile('public/app.js', 'utf8');
  const css = await readFile('public/styles.css', 'utf8');

  assert.match(script, /한눈에 보는 진단 결과/);
  assert.match(script, /리포트 핵심 요약/);
  assert.match(script, /먼저 볼 개선 항목/);
  assert.match(script, /상세 진단 근거 보기/);
  assert.match(script, /검증용 상세 정보/);
  assert.match(script, /일반 사용자용 요약/);
  assert.match(script, /무슨 뜻인가요\?/);
  assert.match(script, /왜 중요한가요\?/);
  assert.match(script, /먼저 이렇게 고치세요/);
  assert.match(script, /검색 노출 기본/);
  assert.match(script, /AI 답변 준비/);
  assert.match(script, /문의\/구매 전환/);
  assert.match(css, /\.plain-summary-grid/);
  assert.match(css, /\.plain-issue-explainer/);
  assert.match(css, /\.issue-checklist-row:has\(\.issue-evidence-details\[open\]\)/);
  assert.match(css, /grid-column: 1 \/ -1/);
  assert.match(css, /overflow-wrap: anywhere/);

  assert.match(script, /핵심 요약/);
  assert.doesNotMatch(script, /<h3>우선 개선 항목<\/h3>/);
  assert.match(script, /진단 영역별 결과/);
  assert.match(script, /페이지별 분석 근거/);
  assert.match(script, /전체 이슈 펼쳐보기/);
  assert.match(script, /분석률/);
  assert.match(script, /수집 제외/);
  assert.match(script, /링크 점검/);
  assert.match(script, /JS 렌더링/);
  assert.match(script, /웹 품질 점수/);
  assert.match(script, /접근성/);
  assert.match(script, /보안 관행/);
  assert.match(script, /renderIssueGroup/);
  assert.match(script, /renderAnalysisCoverage/);
  assert.match(script, /renderWebQualityScores/);
  assert.match(script, /renderPriorityIssues/);
  assert.match(script, /renderSalesConversion/);
  assert.match(script, /renderTrustEvidence/);
  assert.match(script, /renderDiagnosisFailure/);
  assert.match(script, /failure-action-grid/);
  assert.match(script, /진단 서버와 연결하지 못했습니다/);
  assert.match(script, /selectPriorityIssues/);
  assert.match(script, /shortIssueEvidence/);
  assert.match(script, /이번 사이트에서 확인/);
  assert.match(script, /exactPlainIssueCopy/);
  assert.match(script, /리다이렉트 링크는 최종 도착 URL로 직접 연결/);
  assert.match(script, /진단 결과 기반 개선안 받기/);
  assert.match(script, /견적 전환 제안/);
  assert.match(script, /진단 신뢰 근거/);
  assert.match(script, /salesTalkTrack/);
  assert.match(script, /talkingPoints/);
  assert.match(script, /salesAngle/);
  assert.match(css, /\.result-overview/);
  assert.match(css, /\.issue-group-grid/);
  assert.match(css, /\.readable-issue-card/);
  assert.match(css, /\.issue-specific-signal/);
  assert.match(css, /\.package-grid/);
  assert.match(css, /\.trust-evidence-grid/);
});

test('public report UI does not expose package price ranges before consultation', async () => {
  const script = await readFile('public/app.js', 'utf8');

  assert.doesNotMatch(script, /formatPriceRange/);
  assert.doesNotMatch(script, /priceRange/);
  assert.match(script, /상담에서 범위 확정/);
});
