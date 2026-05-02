const diagnosisForm = document.querySelector('#diagnosis-form');
const leadForm = document.querySelector('#lead-form');
const resultPanel = document.querySelector('#result');
let lastRun = null;

diagnosisForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(diagnosisForm);
  const payload = {
    siteUrl: formData.get('siteUrl')
  };

  resultPanel.hidden = false;
  resultPanel.innerHTML = '<div class="loading-state">진단을 진행하고 있습니다...</div>';

  try {
    const response = await fetch('/api/diagnose', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      resultPanel.innerHTML = `<h2>진단을 진행할 수 없습니다</h2><p>${escapeHtml(data.message || 'URL을 확인해주세요.')}</p>`;
      return;
    }

    lastRun = data.run;
    renderResult(data.run);
    syncLeadUrl(data.run?.url || payload.siteUrl);
  } catch (error) {
    resultPanel.innerHTML = `<h2>진단을 진행할 수 없습니다</h2><p>${escapeHtml(error.message || '잠시 후 다시 시도해주세요.')}</p>`;
  }
});

leadForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    ...Object.fromEntries(new FormData(leadForm)),
    issueCount: lastRun?.issues?.length || 0,
    highImpactIssueCount: lastRun?.issues?.filter((issue) => issue.impact === 'high').length || 0
  };

  const response = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json();

  if (!response.ok) {
    alert(data.message || '상담 신청을 접수하지 못했습니다.');
    return;
  }

  alert(`상담 신청이 접수되었습니다. 관리자 페이지에서 문의 내용을 확인할 수 있습니다. 리드 등급: ${labelForLeadGrade(data.lead.leadScore.grade)}`);
});

function renderResult(run) {
  const allIssues = run.report?.workOrders || [];
  const workScopes = run.report?.workScopeSummary || [];
  const crawledPages = run.pagesAnalyzed || 0;
  const provider = run.report?.ai?.provider || 'mock';
  const businessCategory = run.businessCategory;
  const issueSummary = run.report?.issueSummary || {
    uniqueIssueCount: allIssues.length,
    rawIssueCount: run.issues?.length || 0
  };

  resultPanel.innerHTML = `
    <section class="result-overview report-hero">
      <div class="score-card">
        <span>종합 준비도</span>
        <strong>${escapeHtml(run.scores.overall)}</strong>
        <small>${escapeHtml(scoreBand(run.scores.overall))}</small>
      </div>
      <div class="summary-card">
        <p class="eyebrow">리포트 핵심 요약</p>
        <h2>먼저 볼 내용만 정리했습니다</h2>
        <p>${escapeHtml(run.report?.plainLanguageSummary?.scoreMeaning || run.report?.executiveSummary || run.summary || '')}</p>
        <div class="result-actions">
          <a class="button" href="/reports/${encodeURIComponent(run.id)}?token=${encodeURIComponent(run.shareToken || '')}">공유 리포트 열기</a>
        </div>
      </div>
    </section>

    <section class="report-dashboard" aria-label="리포트 핵심 지표">
      ${renderMetric('우선 개선', `${Math.min(3, allIssues.length)}개`)}
      ${renderMetric('전체 개선 유형', `${issueSummary.uniqueIssueCount}개`)}
      ${renderMetric('분석 페이지', `${crawledPages}개`)}
      ${renderMetric('예상 기간', run.salesConversion?.estimatedTimeline || '상담에서 확정')}
      ${businessCategory ? renderMetric('추정 업종', `${businessCategory.label}${businessCategory.pageCount ? ` · ${businessCategory.pageCount}개 근거` : ''}`) : ''}
    </section>

    ${renderPlainLanguageSummary(run, allIssues)}
    ${renderPriorityIssueBriefing(allIssues)}
    ${renderSalesConversion(run.salesConversion)}
    ${renderReportTechnicalDetails({ run, allIssues, workScopes, crawledPages, provider, businessCategory, issueSummary })}
  `;
}

function renderWebQualityScores(scores) {
  if (!scores) return '';
  const items = [
    ['performance', '성능'],
    ['accessibility', '접근성'],
    ['bestPractices', '보안 관행'],
    ['seo', 'SEO']
  ];

  return `
    <section class="panel readable-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Quality</p>
          <h3>웹 품질 점수</h3>
        </div>
        <span class="section-count">참고 지표</span>
      </div>
      <div class="score-breakdown">
        ${items.map(([key, label]) => {
          const value = Number(scores[key] ?? 0);
          return `
            <div class="score-row">
              <span>${label}</span>
              <div class="score-bar"><i style="width:${Math.max(0, Math.min(100, value))}%"></i></div>
              <strong>${value}</strong>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function renderAnalysisCoverage(coverage) {
  if (!coverage) return '';
  return `
    <section class="panel readable-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Coverage</p>
          <h3>분석률과 수집 범위</h3>
        </div>
      </div>
      <div class="metric-strip">
        ${renderMetric('분석률', `${coverage.analysisRate ?? 0}%`)}
        ${renderMetric('수집 한도 사용', `${coverage.crawlBudgetUsageRate ?? 0}%`)}
        ${renderMetric('발견 URL', `${coverage.discoveredUrls ?? 0}개`)}
        ${renderMetric('수집 제외', `${coverage.skippedUrls ?? 0}개`)}
        ${renderMetric('링크 점검', `${coverage.checkedLinks ?? 0}/${coverage.maxLinkChecks ?? 0}개`)}
        ${renderMetric('JS 렌더링', `${coverage.renderedPages ?? 0}개`)}
      </div>
      <p class="detail-note">최대 ${escapeHtml(coverage.maxPages ?? 0)}페이지, 깊이 ${escapeHtml(coverage.maxDepth ?? 0)}, 페이지당 ${escapeHtml(formatBytes(coverage.maxBytes ?? 0))} 범위에서 안전하게 진단했습니다.${coverage.isSampledCrawl ? ' 분석률은 발견 URL 대비 표본 비율이고, 수집 한도 사용률은 실제 진단 예산 소진 정도입니다.' : ''}</p>
    </section>
  `;
}

function renderTrustEvidence(trustEvidence) {
  if (!trustEvidence) return '';
  return `
    <section class="panel readable-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Trust Evidence</p>
          <h3>진단 신뢰 근거</h3>
        </div>
        <span class="section-count">진단 기준</span>
      </div>
      <div class="trust-evidence-grid">
        ${(trustEvidence.items || []).map((item) => `
          <div class="trust-evidence-card">
            <span>${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(item.value)}</strong>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function renderSalesConversion(plan) {
  if (!plan) return '';
  const salesTalkTrack = plan.salesTalkTrack || {};
  return `
    <section class="panel readable-section sales-conversion-panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Next Step</p>
          <h3>견적 전환 제안</h3>
        </div>
        <a class="button" href="#lead-form">${escapeHtml(plan.ctaLabel || '진단 결과 기반 개선안 받기')}</a>
      </div>
      <p>${escapeHtml(plan.ctaDescription || '')}</p>
      ${salesTalkTrack.headline ? `
        <div class="sales-talk-track">
          <strong>상담 포인트</strong>
          <p>${escapeHtml(salesTalkTrack.headline)}</p>
          <ul>
            ${(salesTalkTrack.talkingPoints || []).slice(0, 4).map((point) => `<li>${escapeHtml(point)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      <div class="metric-strip">
        ${renderMetric('전문가 의뢰 필요', `${plan.expertRequiredIssueCount ?? 0}건`)}
        ${renderMetric('직접 수정 가능', `${plan.selfServeIssueCount ?? 0}건`)}
        ${renderMetric('예상 기간', plan.estimatedTimeline || '검토 필요')}
      </div>
      <div class="package-grid">
        ${(plan.recommendedPackages || []).slice(0, 4).map((pkg) => `
          <article class="package-card">
            <strong>${escapeHtml(pkg.name)}</strong>
            <span>${escapeHtml(pkg.matchedIssueCount || 0)}건 연결</span>
            <small>상담에서 범위 확정</small>
            <p>${escapeHtml(pkg.reason || '')}</p>
            <p>${escapeHtml(pkg.salesAngle || '')}</p>
          </article>
        `).join('') || '<p class="empty-state">추천 패키지는 상담에서 확정합니다.</p>'}
      </div>
      <ol class="next-action-list">
        ${(plan.nextActions || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ol>
    </section>
  `;
}

function renderMetric(label, value) {
  return `
    <div class="metric-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function renderReportTechnicalDetails({ run, allIssues, workScopes, crawledPages, provider, businessCategory, issueSummary }) {
  return `
    <details class="report-technical-details">
      <summary>상세 진단 근거 보기</summary>
      <p class="detail-note">일반 상담에는 위 요약과 먼저 볼 개선 항목만 확인하면 됩니다. 아래는 검증용 상세 정보입니다.</p>
      <section class="metric-strip" aria-label="진단 요약 지표">
        ${renderMetric('분석 페이지', `${crawledPages}개`)}
        ${renderMetric('주요 개선 유형', `${issueSummary.uniqueIssueCount}개`)}
        ${renderMetric('페이지별 탐지', `${issueSummary.rawIssueCount}건`)}
        ${renderMetric('AI 제공 방식', provider)}
        ${businessCategory ? renderMetric('추정 업종 카테고리', `${businessCategory.label}${businessCategory.pageCount ? ` · ${businessCategory.pageCount}개 근거` : ''}`) : ''}
      </section>
      ${renderScoreBreakdown(run.scores || {})}
      ${renderWebQualityScores(run.webQualityScores)}
      ${renderAnalysisCoverage(run.analysisCoverage)}
      ${renderTrustEvidence(run.trustEvidence)}
      ${renderWorkScopes(workScopes)}
      ${renderIssueOverviewGroups(allIssues)}
      ${renderEvidenceSummary(run.pageResults || [])}
      ${renderAllIssuesChecklist(allIssues)}
    </details>
  `;
}

function renderPlainLanguageSummary(run, workOrders) {
  const summary = run.report?.plainLanguageSummary || createFallbackPlainSummary(run, workOrders);
  return `
    <section class="panel readable-section plain-summary-panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">일반 사용자용 요약</p>
          <h3>${escapeHtml(summary.title || '한눈에 보는 진단 결과')}</h3>
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
    </section>
  `;
}

function renderScoreBreakdown(scores) {
  const items = [
    ['technical-seo', '검색 노출 기본'],
    ['search-understanding', '검색 의도 설명'],
    ['aeo', 'AI 답변 준비'],
    ['geo', 'AI 신뢰 근거'],
    ['conversion', '문의/구매 전환']
  ];

  return `
    <section class="panel readable-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Scores</p>
          <h3>영역별 준비도</h3>
        </div>
      </div>
      <div class="score-breakdown">
        ${items.map(([key, label]) => {
          const value = Number(scores[key] ?? 0);
          return `
            <div class="score-row">
              <span>${label}</span>
              <div class="score-bar"><i style="width:${Math.max(0, Math.min(100, value))}%"></i></div>
              <strong>${value}</strong>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function renderPriorityIssues(workOrders) {
  const ordered = [...workOrders].sort((a, b) => impactRank(b.impact) - impactRank(a.impact));
  const topIssues = ordered.slice(0, 3);

  return `
    <section class="panel readable-section report-priority-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Priority</p>
          <h3>먼저 볼 개선 항목</h3>
        </div>
        <span class="section-count">상담 전 확인할 핵심 ${topIssues.length}개</span>
      </div>
      ${topIssues.length ? `
        <div class="priority-list">
          ${topIssues.map((issue, index) => renderIssueCard(issue, { rank: index + 1 })).join('')}
        </div>
      ` : '<p class="empty-state">우선 개선 항목이 없습니다.</p>'}
    </section>
  `;
}

function renderWorkScopes(workScopes) {
  if (!workScopes.length) return '';

  return `
    <section class="panel readable-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Scope</p>
          <h3>예상 작업 범위</h3>
        </div>
      </div>
      <div class="scope-grid">
        ${workScopes.map((scope) => `
          <div class="scope-card">
            <strong>${escapeHtml(labelForWorkType(scope.workType))}</strong>
            <span>${escapeHtml(scope.count)}개 항목</span>
            <small>범위 ${escapeHtml(labelForScope(scope.scope))}</small>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function renderIssueGroups(workOrders) {
  const groups = groupBy(workOrders, (issue) => issue.layer || 'review');
  const order = ['technical-seo', 'search-understanding', 'aeo', 'geo', 'conversion', 'review'];
  const entries = order
    .filter((key) => groups.has(key))
    .map((key) => [key, groups.get(key)]);

  if (!entries.length) return '';

  return `
    <section class="panel readable-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Grouped Results</p>
          <h3>진단 영역별 결과</h3>
        </div>
      </div>
      <div class="issue-group-grid">
        ${entries.map(([layer, issues]) => renderIssueGroup(layer, issues)).join('')}
      </div>
    </section>
  `;
}

function renderIssueGroup(layer, issues) {
  const visible = issues.slice(0, 4);
  const hidden = issues.slice(4);

  return `
    <article class="issue-group-card">
      <div class="issue-group-header">
        <strong>${escapeHtml(labelForLayer(layer))}</strong>
        <span>${issues.length}개</span>
      </div>
      <div class="readable-issue-list">
        ${visible.map((issue) => renderIssueCard(issue)).join('')}
      </div>
      ${hidden.length ? `
        <details class="more-issues issue-group-expanded">
          <summary>${hidden.length}개 더 보기</summary>
          <div class="readable-issue-list issue-group-expanded-list">
            ${hidden.map((issue) => renderIssueCard(issue)).join('')}
          </div>
        </details>
      ` : ''}
    </article>
  `;
}

function renderIssueCard(issue, options = {}) {
  const rank = options.rank ? `<span class="issue-rank">${options.rank}</span>` : '';
  const plain = plainIssueCopy(issue);
  return `
    <div class="readable-issue-card">
      <div class="issue-card-title">
        ${rank}
        <strong>${escapeHtml(plain.plainTitle)}</strong>
      </div>
      <p>${escapeHtml(plain.plainMeaning)}</p>
      <dl class="plain-issue-explainer">
        <div>
          <dt>무슨 뜻인가요?</dt>
          <dd>${escapeHtml(plain.plainMeaning)}</dd>
        </div>
        <div>
          <dt>왜 중요한가요?</dt>
          <dd>${escapeHtml(plain.plainWhyItMatters)}</dd>
        </div>
        <div>
          <dt>먼저 이렇게 고치세요</dt>
          <dd>${escapeHtml(plain.plainFirstFix)}</dd>
        </div>
      </dl>
      <div class="issue-meta">
        <span>${escapeHtml(plain.plainLabel)}</span>
        <span>${escapeHtml(labelForImpact(issue.impact))}</span>
        <span>${escapeHtml(labelForScope(issue.expectedScope))}</span>
      </div>
      <small class="technical-note">진단 항목: ${escapeHtml(issue.issueName || issue.name)} · ${escapeHtml(issue.instruction || issue.evidence || '')}</small>
    </div>
  `;
}

function renderEvidenceSummary(pageResults) {
  if (!pageResults.length) return '';
  return `
    <section class="panel readable-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Evidence</p>
          <h3>페이지별 분석 근거 요약</h3>
        </div>
      </div>
      <div class="evidence-grid">
        ${pageResults.slice(0, 6).map((page) => {
          const metadata = page.metadata || {};
          const schemas = metadata.schemaTypes?.length ? metadata.schemaTypes.join(', ') : '없음';
          const imageStats = metadata.imageStats || {};
          const headingStats = metadata.headingStats || {};
          const technicalBasics = metadata.technicalBasics || {};
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
                <div><dt>이미지</dt><dd>alt 누락 ${escapeHtml(imageStats.missingAlt ?? 0)}/${escapeHtml(imageStats.total ?? 0)} · 크기 누락 ${escapeHtml(imageStats.missingDimensions ?? 0)}개</dd></div>
                <div><dt>성능</dt><dd>LCP ${escapeHtml(runtimePerformance.lcpMs ?? 0)}ms · CLS ${escapeHtml(runtimePerformance.cls ?? 0)} · 렌더 차단 CSS ${escapeHtml(performanceStats.blockingStylesheets ?? 0)}개</dd></div>
                <div><dt>기술</dt><dd>Schema ${escapeHtml(schemas)} · viewport ${technicalBasics.hasViewport ? '있음' : '없음'} · robots ${escapeHtml(technicalBasics.robots || '기본')}</dd></div>
              </dl>
            </article>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function renderAllIssuesDetails(workOrders) {
  return `
    <details class="panel all-issues-details">
      <summary>전체 이슈 펼쳐보기</summary>
      <p class="detail-note">전체 실제 분석 이슈 ${workOrders.length}개를 모두 표시합니다. 상담 전에는 우선 개선 항목과 진단 영역별 결과부터 확인하는 것이 좋습니다.</p>
      <div class="readable-issue-list">
        ${workOrders.map((order) => renderIssueCard(order)).join('') || '<p class="empty-state">진단 범위에서 개선 이슈가 발견되지 않았습니다.</p>'}
      </div>
    </details>
  `;
}

function renderPriorityIssueBriefing(workOrders) {
  const topIssues = selectPriorityIssues(workOrders, 3);

  return `
    <section class="panel readable-section report-priority-section issue-briefing-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Priority</p>
          <h3>먼저 고칠 핵심 문제 3개</h3>
        </div>
        <span class="section-count">이것만 먼저 확인하세요</span>
      </div>
      <p class="section-helper">방문자와 검색엔진이 가장 먼저 헷갈릴 수 있는 문제만 추렸습니다.</p>
      ${topIssues.length ? `
        <div class="priority-list issue-briefing-list">
          ${topIssues.map((issue, index) => renderBriefIssueCard(issue, { rank: index + 1 })).join('')}
        </div>
      ` : '<p class="empty-state">우선 개선 항목이 없습니다.</p>'}
    </section>
  `;
}

function renderBriefIssueCard(issue, options = {}) {
  const rank = options.rank ? `<span class="issue-rank">${options.rank}</span>` : '';
  const plain = plainIssueCopy(issue);
  return `
    <article class="readable-issue-card briefing-issue-card ${issueImpactClass(issue.impact)}">
      <div class="issue-card-title">
        ${rank}
        <strong>${escapeHtml(plain.plainTitle)}</strong>
      </div>
      <p class="issue-plain-meaning">${escapeHtml(plain.plainMeaning)}</p>
      <p class="issue-specific-signal"><strong>이번 사이트에서 확인:</strong> ${escapeHtml(shortIssueEvidence(issue))}</p>
      <div class="issue-next-action">
        <span>먼저 할 일</span>
        <p>${escapeHtml(plain.plainFirstFix)}</p>
      </div>
      <div class="issue-meta">
        <span>${escapeHtml(plain.plainLabel)}</span>
        <span>${escapeHtml(labelForImpact(issue.impact))}</span>
        <span>${escapeHtml(labelForScope(issue.expectedScope))}</span>
      </div>
      ${renderIssueEvidenceDetails(issue, plain)}
    </article>
  `;
}

function renderIssueEvidenceDetails(issue, plain) {
  return `
    <details class="issue-evidence-details">
      <summary>진단 근거 보기</summary>
      <dl class="plain-issue-explainer">
        <div>
          <dt>무슨 뜻인가요?</dt>
          <dd>${escapeHtml(plain.plainMeaning)}</dd>
        </div>
        <div>
          <dt>왜 중요한가요?</dt>
          <dd>${escapeHtml(plain.plainWhyItMatters)}</dd>
        </div>
        <div>
          <dt>먼저 이렇게 고치세요</dt>
          <dd>${escapeHtml(plain.plainFirstFix)}</dd>
        </div>
      </dl>
      <small class="technical-note">진단 항목: ${escapeHtml(issue.issueName || issue.name)} · ${escapeHtml(issue.instruction || issue.evidence || '')}</small>
    </details>
  `;
}

function renderIssueOverviewGroups(workOrders) {
  const groups = groupBy(workOrders, (issue) => issue.layer || 'review');
  const order = ['technical-seo', 'search-understanding', 'aeo', 'geo', 'conversion', 'review'];
  const entries = order
    .filter((key) => groups.has(key))
    .map((key) => [key, groups.get(key)]);

  if (!entries.length) return '';

  return `
    <section class="panel readable-section issue-overview-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Issue Map</p>
          <h3>나머지 문제 한눈에 보기</h3>
        </div>
        <span class="section-count">${workOrders.length}개 전체</span>
      </div>
      <div class="issue-overview-grid">
        ${entries.map(([layer, issues]) => renderIssueOverviewGroup(layer, issues)).join('')}
      </div>
    </section>
  `;
}

function renderIssueOverviewGroup(layer, issues) {
  return `
    <article class="issue-summary-card">
      <div class="issue-group-header">
        <strong>${escapeHtml(labelForLayer(layer))}</strong>
        <span>${issues.length}개</span>
      </div>
      <ul class="issue-summary-list">
        ${issues.map((issue) => renderIssueSummaryRow(issue)).join('')}
      </ul>
    </article>
  `;
}

function renderIssueSummaryRow(issue) {
  const plain = plainIssueCopy(issue);
  return `
    <li class="issue-summary-row">
      <div>
        <strong>${escapeHtml(plain.plainTitle)}</strong>
        <span>${escapeHtml(plain.plainMeaning)}</span>
      </div>
      <p>${escapeHtml(plain.plainFirstFix)}</p>
      <div class="issue-meta issue-summary-meta">
        <span>${escapeHtml(plain.plainLabel)}</span>
        <span>${escapeHtml(labelForImpact(issue.impact))}</span>
      </div>
    </li>
  `;
}

function renderAllIssuesChecklist(workOrders) {
  return `
    <details class="panel all-issues-details">
      <summary>전체 진단 근거 펼쳐보기</summary>
      <p class="detail-note">상담이나 내부 작업 검토가 필요할 때만 확인하는 상세 목록입니다.</p>
      <div class="issue-checklist">
        ${workOrders.map((order) => renderIssueChecklistRow(order)).join('') || '<p class="empty-state">진단 범위에서 개선 이슈가 발견되지 않았습니다.</p>'}
      </div>
    </details>
  `;
}

function renderIssueChecklistRow(issue) {
  const plain = plainIssueCopy(issue);
  return `
    <article class="issue-checklist-row">
      <div>
        <strong>${escapeHtml(plain.plainTitle)}</strong>
        <span>${escapeHtml(plain.plainFirstFix)}</span>
      </div>
      ${renderIssueEvidenceDetails(issue, plain)}
    </article>
  `;
}

function issueImpactClass(value) {
  return value === 'high' ? 'issue-impact-high' : value === 'medium' ? 'issue-impact-medium' : 'issue-impact-low';
}

function syncLeadUrl(siteUrl) {
  const leadUrlInput = leadForm?.querySelector('input[name="siteUrl"]');
  if (leadUrlInput && siteUrl) {
    leadUrlInput.value = siteUrl;
  }
}

function groupBy(items, keyFn) {
  const groups = new Map();
  for (const item of items) {
    const key = keyFn(item);
    const group = groups.get(key) || [];
    group.push(item);
    groups.set(key, group);
  }
  return groups;
}

function scoreBand(value) {
  const score = Number(value || 0);
  if (score >= 80) return '양호';
  if (score >= 60) return '개선 권장';
  if (score >= 40) return '우선 개선 필요';
  return '구조 점검 필요';
}

function impactRank(value) {
  return { high: 3, medium: 2, low: 1 }[value] || 0;
}

function selectPriorityIssues(workOrders, limit = 3) {
  const ranked = [...workOrders].sort(comparePriorityIssues);
  const selected = [];
  const usedLayers = new Set();

  for (const issue of ranked) {
    const layer = issue.layer || 'review';
    if (selected.length < limit && !usedLayers.has(layer)) {
      selected.push(issue);
      usedLayers.add(layer);
    }
  }

  for (const issue of ranked) {
    if (selected.length >= limit) break;
    if (!selected.includes(issue)) selected.push(issue);
  }

  return selected;
}

function comparePriorityIssues(a, b) {
  return priorityScore(b) - priorityScore(a) ||
    String(a.issueName || a.name || '').localeCompare(String(b.issueName || b.name || ''), 'ko');
}

function priorityScore(issue = {}) {
  const occurrence = Number(issue.occurrenceCount || issue.affectedUrls?.length || 1);
  return impactRank(issue.impact) * 100 +
    confidenceRank(issue.confidence) * 12 +
    Math.min(occurrence, 10) * 8 +
    scopeRank(issue.expectedScope) * 6 +
    layerRank(issue.layer) * 3;
}

function confidenceRank(value) {
  return { high: 3, medium: 2, low: 1 }[value] || 0;
}

function scopeRank(value) {
  return { large: 3, medium: 2, small: 1, unknown: 0 }[value] || 0;
}

function layerRank(value) {
  return {
    conversion: 6,
    'technical-seo': 5,
    geo: 4,
    aeo: 3,
    'search-understanding': 2,
    review: 1
  }[value] || 0;
}

function shortIssueEvidence(issue = {}) {
  const count = Number(issue.occurrenceCount || issue.affectedUrls?.length || 0);
  const prefix = count > 1 ? `${count}곳에서 반복 확인. ` : '';
  const raw = issue.evidence || issue.instruction || issue.issueName || issue.name || '';
  const compact = String(raw)
    .replace(/\s+/g, ' ')
    .replace(/https?:\/\/[^\s,]+/g, (url) => url.length > 52 ? `${url.slice(0, 49)}...` : url)
    .trim();
  const text = `${prefix}${compact}`.trim();
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

function createFallbackPlainSummary(run, workOrders) {
  const topIssue = selectPriorityIssues(workOrders, 1)[0];
  const top = topIssue ? plainIssueCopy(topIssue) : null;
  const score = Number(run.scores?.overall ?? 0);
  return {
    title: '한눈에 보는 진단 결과',
    scoreMeaning: score >= 80
      ? '기본 구조는 양호하지만 더 많은 문의와 신뢰 확보를 위해 다듬을 부분이 있습니다.'
      : score >= 60
        ? '사이트가 작동은 하지만 검색 노출, 신뢰 근거, 문의 전환에서 손실이 생길 수 있습니다.'
        : '방문자가 이해하고 문의하기까지 여러 장애물이 있어 우선순위 개선이 필요합니다.',
    customerImpact: top
      ? `${top.plainWhyItMatters} "${top.plainTitle}"부터 확인하는 것이 좋습니다.`
      : '방문자가 사이트 내용을 이해하고 문의까지 이동하는 흐름에서 큰 막힘은 적게 확인되었습니다.',
    firstAction: top?.plainFirstFix || '새 페이지를 추가할 때 제목, 설명, 문의 버튼을 함께 점검하세요.'
  };
}

function plainIssueCopy(issue = {}) {
  if (issue.plainTitle) return issue;
  const name = issue.issueName || issue.name || '개선 항목';
  const text = `${name} ${issue.instruction || issue.evidence || ''}`;

  if (plainMatches(text, ['CTA', '상담', '문의', '구매', '전환', '연락', '가격', '견적', '결제', '환불', '배송'])) {
    return plainCopy(name, '문의/구매 전환', '방문자가 문의나 구매 같은 다음 행동을 바로 선택하기 어렵다는 뜻입니다.', '고객이 관심을 가져도 상담, 문의, 구매 버튼이나 판단 정보가 부족하면 이탈할 가능성이 높습니다.', '먼저 버튼 문구, 연락 수단, 가격/견적 안내처럼 결정에 필요한 정보를 눈에 잘 보이는 위치에 배치하세요.');
  }

  if (plainMatches(text, ['FAQ', '질문', '답변', '절차', '비교', '사례', '본문', '정보량'])) {
    return plainCopy(name, 'AI 답변 준비', '고객이 검색창이나 AI에 물어볼 법한 질문에 사이트가 충분히 답하지 못한다는 뜻입니다.', '질문과 답변이 부족하면 검색엔진과 AI가 이 사이트를 추천 근거로 이해하기 어렵고, 방문자도 빠르게 판단하기 어렵습니다.', '먼저 자주 받는 질문 5개와 짧은 답변, 진행 절차, 선택 기준을 한 페이지 안에 추가하세요.');
  }

  if (plainMatches(text, ['신뢰', '근거', '인증', '후기', '고객', '포트폴리오', 'schema', '엔티티', '구조화', 'OG', '인용'])) {
    return plainCopy(name, 'AI 신뢰 근거', '회사와 서비스가 믿을 만한지 확인할 근거가 부족하다는 뜻입니다.', '사례, 인증, 고객사, 정책, 회사 정보가 약하면 방문자와 AI 모두 신뢰 판단을 하기 어렵습니다.', '먼저 회사소개, 고객 사례, 인증/수상, 정책 링크, 구조화 데이터를 보강해 신뢰 근거를 한곳에 모으세요.');
  }

  if (plainMatches(text, ['title', '메타', 'description', 'canonical', 'robots', 'sitemap', 'noindex', '링크', '리다이렉트', '404'])) {
    return plainCopy(name, '검색 노출 기본', '검색엔진이 페이지를 찾고 요약하는 데 필요한 기본 정보가 부족하다는 뜻입니다.', '검색 결과에 설명이 약하게 보이거나 중요한 페이지가 제대로 수집되지 않으면 잠재 고객에게 발견될 기회가 줄어듭니다.', '먼저 페이지 제목, 검색 결과 요약 문구, 사이트맵, 깨진 링크를 정리하세요.');
  }

  if (plainMatches(text, ['viewport', 'LCP', 'CLS', 'TBT', '성능', '렌더', '스크립트', '이미지', 'alt', '접근성', 'lang', 'charset', 'iframe', '폼'])) {
    return plainCopy(name, '사용 편의성', '모바일, 속도, 접근성처럼 방문자가 실제로 이용할 때 불편할 수 있는 부분입니다.', '페이지가 느리거나 모바일 표시가 어색하면 방문자가 내용을 보기 전에 떠날 수 있습니다.', '먼저 모바일 표시 설정, 이미지 설명/크기, 느린 리소스, 입력 폼 접근성을 점검하세요.');
  }

  return plainCopy(name, labelForLayer(issue.layer), '사이트 구조나 콘텐츠가 방문자와 검색엔진에게 충분히 명확하지 않은 부분입니다.', '설명이 모호하면 고객이 우리 서비스가 맞는지 판단하기 어렵고 상담 전환도 늦어질 수 있습니다.', '먼저 해당 페이지에서 고객이 알아야 할 핵심 정보와 다음 행동 버튼을 분명하게 정리하세요.');
}

function plainCopy(title, label, meaning, why, fix) {
  return {
    plainTitle: title,
    plainLabel: label,
    plainMeaning: meaning,
    plainWhyItMatters: why,
    plainFirstFix: fix
  };
}

function plainMatches(text, terms) {
  return terms.some((term) => text.toLowerCase().includes(term.toLowerCase()));
}

function labelForLeadGrade(value) {
  return {
    hot: '우선 상담',
    warm: '검토 필요',
    nurture: '장기 관리'
  }[value] || value;
}

function labelForLayer(value) {
  return {
    'technical-seo': '검색 노출 기본',
    'search-understanding': '검색 의도 설명',
    aeo: 'AI 답변 준비',
    geo: 'AI 신뢰 근거',
    conversion: '문의/구매 전환',
    review: '검토 필요'
  }[value] || value;
}

function labelForImpact(value) {
  return {
    high: '바로 확인',
    medium: '개선 권장',
    low: '여유 있을 때'
  }[value] || value || '검토 필요';
}

function labelForScope(value) {
  return {
    small: '짧은 수정',
    medium: '기획 포함 수정',
    large: '구조 개편',
    unknown: '범위 확인'
  }[value] || value || '범위 확인';
}

function labelForWorkType(value) {
  return {
    'technical-seo': '기술 SEO',
    content: '콘텐츠 보강',
    'landing-page-improvement': '랜딩페이지 개선',
    'conversion-improvement': '전환 구조 개선',
    'commerce-seo': '쇼핑몰 SEO',
    'monthly-management': '월간 관리',
    review: '검토'
  }[value] || value;
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

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}MB`;
  if (value >= 1000) return `${Math.round(value / 1000)}KB`;
  return `${value}B`;
}
