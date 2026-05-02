import {
  createPlainLanguageSummary,
  enrichWorkOrderPlainLanguage,
  labelForPlainImpact,
  labelForPlainLayer,
  labelForPlainScope
} from './plain-language.js';

export function renderReportHtml(run) {
  const report = run.report || {};
  const workOrders = (report.workOrders || []).map(enrichWorkOrderPlainLanguage);
  const issueSummary = report.issueSummary || {
    uniqueIssueCount: workOrders.length,
    rawIssueCount: run.issues?.length || workOrders.length
  };
  const plainSummary = report.plainLanguageSummary || createPlainLanguageSummary({
    scores: run.scores || {},
    workOrders,
    issueSummary
  });
  const topIssues = topPriorityIssues(workOrders);

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>사이트핏 진단 리포트</title>
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    <main class="report-page">
      <section class="report-hero panel">
        <div class="report-hero-copy">
          <p class="eyebrow">사이트핏 진단 리포트</p>
          <h1>리포트 핵심 요약</h1>
          <p class="report-url">${escapeHtml(run.url)}</p>
          <p class="report-lead">${escapeHtml(plainSummary.scoreMeaning || report.executiveSummary || run.summary || '')}</p>
          ${run.businessCategory ? `<p class="detail-note">추정 업종 카테고리: ${escapeHtml(run.businessCategory.label)}${run.businessCategory.pageCount ? ` (${escapeHtml(run.businessCategory.pageCount)}개 페이지 근거)` : ''}</p>` : ''}
        </div>
        <div class="report-score-card">
          <span>종합 준비도</span>
          <strong>${escapeHtml(run.scores?.overall ?? 0)}</strong>
          <small>${scoreBand(run.scores?.overall)}</small>
        </div>
      </section>

      <section class="report-dashboard" aria-label="리포트 핵심 지표">
        ${renderMetricCard('우선 개선', `${topIssues.length}개`, '먼저 상담할 항목')}
        ${renderMetricCard('전체 개선 유형', `${issueSummary.uniqueIssueCount}개`, `${issueSummary.rawIssueCount}건 탐지`)}
        ${renderMetricCard('분석 페이지', `${run.pagesAnalyzed || 0}개`, `분석률 ${run.analysisCoverage?.analysisRate ?? 0}%`)}
        ${renderMetricCard('예상 기간', run.salesConversion?.estimatedTimeline || '상담에서 확정', '상담에서 범위 확정')}
      </section>

      ${renderPlainLanguageSummary(plainSummary)}
      ${renderPriorityIssueBriefing(topIssues)}
      ${renderSalesConversion(run.salesConversion)}
      ${renderTechnicalDetails({ run, workOrders, issueSummary })}
    </main>
  </body>
</html>`;
}

function renderMetricCard(label, value, note) {
  return `
        <article class="metric-card report-metric-card">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
          <small>${escapeHtml(note)}</small>
        </article>`;
}

function renderPlainLanguageSummary(summary) {
  return `
      <section class="panel readable-section plain-summary-panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">일반 사용자용 요약</p>
            <h2>${escapeHtml(summary.title || '한눈에 보는 진단 결과')}</h2>
          </div>
        </div>
        <div class="plain-summary-grid">
          <article>
            <span>현재 상태</span>
            <p>${escapeHtml(summary.scoreMeaning || '')}</p>
          </article>
          <article>
            <span>고객에게 보이는 문제</span>
            <p>${escapeHtml(summary.customerImpact || '')}</p>
          </article>
          <article>
            <span>먼저 할 일</span>
            <p>${escapeHtml(summary.firstAction || '')}</p>
          </article>
        </div>
      </section>`;
}

function renderPriorityIssues(issues) {
  return `
      <section class="panel readable-section report-priority-section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Priority</p>
            <h2>먼저 볼 개선 항목</h2>
          </div>
          <span class="section-count">상담 전 확인할 핵심 ${issues.length}개</span>
        </div>
        <div class="priority-list">
          ${issues.map((issue, index) => renderIssueCard(issue, index + 1)).join('') || '<p class="empty-state">우선 개선 항목이 없습니다.</p>'}
        </div>
      </section>`;
}

function renderIssueCard(issue, rank) {
  return `
          <article class="readable-issue-card report-issue-card">
            <div class="issue-card-title">
              <span class="issue-rank">${rank}</span>
              <strong>${escapeHtml(issue.plainTitle || issue.issueName)}</strong>
            </div>
            <p>${escapeHtml(issue.plainMeaning || '')}</p>
            <dl class="plain-issue-explainer">
              <div><dt>무슨 뜻인가요?</dt><dd>${escapeHtml(issue.plainMeaning || '')}</dd></div>
              <div><dt>왜 중요한가요?</dt><dd>${escapeHtml(issue.plainWhyItMatters || '')}</dd></div>
              <div><dt>먼저 이렇게 고치세요</dt><dd>${escapeHtml(issue.plainFirstFix || '')}</dd></div>
            </dl>
            <div class="issue-meta">
              <span>${escapeHtml(issue.plainLabel || labelForPlainLayer(issue.layer))}</span>
              <span>${escapeHtml(labelForPlainImpact(issue.impact))}</span>
              <span>${escapeHtml(labelForPlainScope(issue.expectedScope))}</span>
            </div>
          </article>`;
}

function renderPriorityIssueBriefing(issues) {
  return `
      <section class="panel readable-section report-priority-section issue-briefing-section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Priority</p>
            <h2>먼저 고칠 핵심 문제 3개</h2>
          </div>
          <span class="section-count">이것만 먼저 확인하세요</span>
        </div>
        <p class="section-helper">방문자와 검색엔진이 가장 먼저 헷갈릴 수 있는 문제만 추렸습니다.</p>
        <div class="priority-list issue-briefing-list">
          ${issues.map((issue, index) => renderBriefIssueCard(issue, index + 1)).join('') || '<p class="empty-state">우선 개선 항목이 없습니다.</p>'}
        </div>
      </section>`;
}

function renderBriefIssueCard(issue, rank) {
  return `
          <article class="readable-issue-card report-issue-card briefing-issue-card ${issueImpactClass(issue.impact)}">
            <div class="issue-card-title">
              <span class="issue-rank">${rank}</span>
              <strong>${escapeHtml(issue.plainTitle || issue.issueName)}</strong>
            </div>
            <p class="issue-plain-meaning">${escapeHtml(issue.plainMeaning || '')}</p>
            <div class="issue-next-action">
              <span>먼저 할 일</span>
              <p>${escapeHtml(issue.plainFirstFix || issue.instruction || '')}</p>
            </div>
            <div class="issue-meta">
              <span>${escapeHtml(issue.plainLabel || labelForPlainLayer(issue.layer))}</span>
              <span>${escapeHtml(labelForPlainImpact(issue.impact))}</span>
              <span>${escapeHtml(labelForPlainScope(issue.expectedScope))}</span>
            </div>
            ${renderIssueEvidenceDetails(issue)}
          </article>`;
}

function renderIssueEvidenceDetails(issue) {
  return `
            <details class="issue-evidence-details">
              <summary>진단 근거 보기</summary>
              <dl class="plain-issue-explainer">
                <div><dt>무슨 뜻인가요?</dt><dd>${escapeHtml(issue.plainMeaning || '')}</dd></div>
                <div><dt>왜 중요한가요?</dt><dd>${escapeHtml(issue.plainWhyItMatters || '')}</dd></div>
                <div><dt>먼저 이렇게 고치세요</dt><dd>${escapeHtml(issue.plainFirstFix || issue.instruction || '')}</dd></div>
              </dl>
              <small class="technical-note">진단 항목: ${escapeHtml(issue.issueName || issue.name)} · ${escapeHtml(issue.instruction || issue.evidence || '')}</small>
            </details>`;
}

function renderSalesConversion(plan) {
  if (!plan) return '';
  const packages = (plan.recommendedPackages || []).slice(0, 3);
  return `
      <section class="panel readable-section sales-conversion-panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Next Step</p>
            <h2>견적 전환 제안</h2>
          </div>
          <span class="section-count">금액은 상담에서 범위 확정</span>
        </div>
        ${plan.salesTalkTrack?.headline ? `
        <div class="sales-talk-track">
          <strong>상담 포인트</strong>
          <p>${escapeHtml(plan.salesTalkTrack.headline)}</p>
          <ul>
            ${(plan.salesTalkTrack.talkingPoints || []).slice(0, 3).map((point) => `<li>${escapeHtml(point)}</li>`).join('')}
          </ul>
        </div>` : ''}
        <div class="package-grid package-grid-compact">
          ${packages.map((pkg) => `
            <article class="package-card">
              <strong>${escapeHtml(pkg.name)}</strong>
              <span>${escapeHtml(pkg.matchedIssueCount || 0)}건 연결</span>
              <small>상담에서 범위 확정</small>
              <p>${escapeHtml(pkg.salesAngle || pkg.reason || '')}</p>
            </article>
          `).join('') || '<p class="empty-state">추천 작업 범위는 상담에서 확정합니다.</p>'}
        </div>
      </section>`;
}

function renderTechnicalDetails({ run, workOrders, issueSummary }) {
  return `
      <details class="report-technical-details">
        <summary>상세 진단 근거 보기</summary>
        <p class="detail-note">일반 상담에는 위 요약과 우선 개선 항목만 먼저 확인하면 됩니다. 아래는 검증용 상세 정보입니다.</p>
        ${renderTrustEvidence(run.trustEvidence)}
        ${renderScoreBreakdown(run.scores || {}, run.webQualityScores)}
        ${renderAnalysisCoverage(run.analysisCoverage)}
        ${renderIssueChecklist(workOrders, issueSummary)}
        ${renderEvidenceSummary(run.pageResults || [])}
      </details>`;
}

function renderTrustEvidence(trustEvidence) {
  if (!trustEvidence) return '';
  return `
        <section class="technical-block">
          <h3>진단 신뢰 근거</h3>
          <div class="trust-evidence-grid">
            ${(trustEvidence.items || []).map((item) => `
              <div class="trust-evidence-card">
                <span>${escapeHtml(item.label)}</span>
                <strong>${escapeHtml(item.value)}</strong>
              </div>
            `).join('')}
          </div>
        </section>`;
}

function renderScoreBreakdown(scores, webQualityScores) {
  const readiness = [
    ['technical-seo', '검색 노출 기본'],
    ['search-understanding', '검색 의도 설명'],
    ['aeo', 'AI 답변 준비'],
    ['geo', 'AI 신뢰 근거'],
    ['conversion', '문의/구매 전환']
  ];
  const quality = webQualityScores ? [
    ['performance', '성능'],
    ['accessibility', '접근성'],
    ['bestPractices', '보안 관행'],
    ['seo', 'SEO']
  ] : [];

  return `
        <section class="technical-block">
          <h3>웹 품질 점수</h3>
          <div class="score-breakdown">
            ${readiness.map(([key, label]) => renderScoreRow(label, scores[key] ?? 0)).join('')}
            ${quality.map(([key, label]) => renderScoreRow(label, webQualityScores[key] ?? 0)).join('')}
          </div>
        </section>`;
}

function renderScoreRow(label, value) {
  const score = Math.max(0, Math.min(100, Number(value || 0)));
  return `
            <div class="score-row">
              <span>${escapeHtml(label)}</span>
              <div class="score-bar"><i style="width:${score}%"></i></div>
              <strong>${score}</strong>
            </div>`;
}

function renderAnalysisCoverage(coverage) {
  if (!coverage) return '';
  return `
        <section class="technical-block">
          <h3>분석률과 수집 범위</h3>
          <div class="metric-strip">
            ${renderMetricCard('분석률', `${coverage.analysisRate ?? 0}%`, '발견 URL 대비 분석')}
            ${renderMetricCard('수집 한도 사용', `${coverage.crawlBudgetUsageRate ?? 0}%`, '진단 예산 사용')}
            ${renderMetricCard('수집 제외', `${coverage.skippedUrls ?? 0}개`, `발견 URL ${coverage.discoveredUrls ?? 0}개`)}
            ${renderMetricCard('링크 점검', `${coverage.checkedLinks ?? 0}/${coverage.maxLinkChecks ?? 0}개`, '내부/외부 링크')}
            ${renderMetricCard('JS 렌더링', `${coverage.renderedPages ?? 0}개`, '동적 페이지 확인')}
          </div>
        </section>`;
}

function renderAllIssues(workOrders, issueSummary) {
  return `
        <section class="technical-block">
          <h3>주요 개선 유형</h3>
          <p class="detail-note">전체 개선 유형 ${escapeHtml(issueSummary.uniqueIssueCount)}개, 페이지별 탐지 ${escapeHtml(issueSummary.rawIssueCount)}건입니다. 작업지시서 성격의 상세 내용입니다.</p>
          <div class="readable-issue-list">
            ${workOrders.map((order) => `
              <article class="readable-issue-card">
                <strong>${escapeHtml(order.issueName)}</strong>
                <p>${escapeHtml(order.instruction)}</p>
                <small>${escapeHtml(order.plainLabel || labelForPlainLayer(order.layer))} | ${escapeHtml(labelForPlainImpact(order.impact))}</small>
              </article>
            `).join('') || '<p class="empty-state">개선 이슈가 발견되지 않았습니다.</p>'}
          </div>
        </section>`;
}

function renderIssueChecklist(workOrders, issueSummary) {
  return `
        <section class="technical-block issue-overview-section">
          <h3>나머지 문제 한눈에 보기</h3>
          <p class="detail-note">전체 개선 유형 ${escapeHtml(issueSummary.uniqueIssueCount)}개, 페이지별 탐지 ${escapeHtml(issueSummary.rawIssueCount)}건입니다. 상세 근거는 필요한 항목만 펼쳐보세요.</p>
          <div class="issue-checklist">
            ${workOrders.map((order) => renderIssueChecklistRow(order)).join('') || '<p class="empty-state">개선 이슈가 발견되지 않았습니다.</p>'}
          </div>
        </section>`;
}

function renderIssueChecklistRow(issue) {
  return `
            <article class="issue-checklist-row">
              <div>
                <strong>${escapeHtml(issue.plainTitle || issue.issueName)}</strong>
                <span>${escapeHtml(issue.plainFirstFix || issue.instruction || '')}</span>
              </div>
              ${renderIssueEvidenceDetails(issue)}
            </article>`;
}

function renderEvidenceSummary(pageResults) {
  if (!pageResults.length) return '';
  return `
        <section class="technical-block">
          <h3>분석 근거 요약</h3>
          <div class="evidence-grid">
            ${pageResults.slice(0, 6).map((page) => {
              const metadata = page.metadata || {};
              const schemas = metadata.schemaTypes?.length ? metadata.schemaTypes.join(', ') : '없음';
              const headingStats = metadata.headingStats || {};
              const linkStats = metadata.linkStats || {};
              const answerReadiness = metadata.answerReadiness || {};
              const geoReadiness = metadata.geoReadiness || {};
              const performanceStats = metadata.performanceStats || {};
              const runtimePerformance = metadata.runtimePerformance || {};
              const entitySignals = geoReadiness.entitySignals || {};
              return `
                <article class="evidence-card">
                  <strong>${escapeHtml(metadata.title || page.url)}</strong>
                  <a href="${escapeHtml(page.url)}" target="_blank" rel="noreferrer">${escapeHtml(page.url)}</a>
                  <dl>
                    <div><dt>유형</dt><dd>${escapeHtml(labelForPageType(metadata.pageType))}</dd></div>
                    <div><dt>제목</dt><dd>H1 ${escapeHtml(headingStats.h1Count ?? 0)}개 · H2 ${escapeHtml(headingStats.h2Count ?? 0)}개</dd></div>
                    <div><dt>본문</dt><dd>${escapeHtml(metadata.wordCount ?? 0)}단어</dd></div>
                    <div><dt>AEO</dt><dd>질문형 제목 ${escapeHtml(answerReadiness.questionHeadingCount ?? 0)}개 · 직접 답변 ${escapeHtml(answerReadiness.directAnswerCount ?? 0)}개</dd></div>
                    <div><dt>GEO</dt><dd>엔티티 schema ${entitySignals.hasOrganizationSchema ? '있음' : '없음'} · 인용 문장 ${escapeHtml(geoReadiness.citationLikeSentenceCount ?? 0)}개</dd></div>
                    <div><dt>링크</dt><dd>내부 링크 ${escapeHtml(linkStats.internal ?? 0)}개 · 외부 링크 ${escapeHtml(linkStats.external ?? 0)}개</dd></div>
                    <div><dt>성능</dt><dd>LCP ${escapeHtml(runtimePerformance.lcpMs ?? 0)}ms · CLS ${escapeHtml(runtimePerformance.cls ?? 0)} · 렌더 차단 CSS ${escapeHtml(performanceStats.blockingStylesheets ?? 0)}개</dd></div>
                    <div><dt>기술</dt><dd>Schema ${escapeHtml(schemas)}</dd></div>
                  </dl>
                </article>`;
            }).join('')}
          </div>
        </section>`;
}

function topPriorityIssues(workOrders) {
  return [...workOrders]
    .sort((a, b) => impactWeight(b.impact) - impactWeight(a.impact) || String(a.issueName).localeCompare(String(b.issueName), 'ko'))
    .slice(0, 3);
}

function scoreBand(value) {
  const score = Number(value || 0);
  if (score >= 80) return '양호';
  if (score >= 60) return '개선 권장';
  if (score >= 40) return '우선 개선 필요';
  return '구조 점검 필요';
}

function labelForPageType(value) {
  return {
    home: '홈',
    legal: '정책/약관',
    portfolio: '사례/포트폴리오',
    article: '콘텐츠',
    product: '상품',
    service: '서비스',
    contact: '문의',
    general: '일반'
  }[value] || value || '미분류';
}

function impactWeight(value) {
  return { high: 3, medium: 2, low: 1 }[value] || 0;
}

function issueImpactClass(value) {
  return value === 'high' ? 'issue-impact-high' : value === 'medium' ? 'issue-impact-medium' : 'issue-impact-low';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
