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
    syncLeadUrl(payload.siteUrl);
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

  alert(`상담 신청이 접수되었습니다. 리드 등급: ${labelForLeadGrade(data.lead.leadScore.grade)}`);
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
    <section class="result-overview">
      <div class="score-card">
        <span>종합 준비도</span>
        <strong>${escapeHtml(run.scores.overall)}</strong>
      </div>
      <div class="summary-card">
        <p class="eyebrow">핵심 요약</p>
        <h2>전체 진단 결과</h2>
        <p>${escapeHtml(run.report?.executiveSummary || run.summary || '')}</p>
        <div class="result-actions">
          <a class="button" href="/reports/${encodeURIComponent(run.id)}?token=${encodeURIComponent(run.shareToken || '')}">공유 리포트 열기</a>
        </div>
      </div>
    </section>

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
    ${renderSalesConversion(run.salesConversion)}
    ${renderPriorityIssues(allIssues)}
    ${renderWorkScopes(workScopes)}
    ${renderIssueGroups(allIssues)}
    ${renderEvidenceSummary(run.pageResults || [])}
    ${renderAllIssuesDetails(allIssues)}
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
        <span class="section-count">SiteFit rules</span>
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
      <p class="detail-note">현재 수집된 진단 근거로 계산한 Lighthouse-style 참고 점수입니다. 실제 PageSpeed Insights 점수와 동일하다고 보장하지 않습니다.</p>
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
        ${renderMetric('발견 URL', `${coverage.discoveredUrls ?? 0}개`)}
        ${renderMetric('수집 제외', `${coverage.skippedUrls ?? 0}개`)}
        ${renderMetric('링크 점검', `${coverage.checkedLinks ?? 0}/${coverage.maxLinkChecks ?? 0}개`)}
        ${renderMetric('JS 렌더링', `${coverage.renderedPages ?? 0}개`)}
      </div>
      <p class="detail-note">최대 ${escapeHtml(coverage.maxPages ?? 0)}페이지, 깊이 ${escapeHtml(coverage.maxDepth ?? 0)}, 페이지당 ${escapeHtml(formatBytes(coverage.maxBytes ?? 0))} 범위에서 안전하게 진단했습니다.</p>
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
        <span class="section-count">${escapeHtml(trustEvidence.source || 'sitefit-rules')}</span>
      </div>
      <div class="trust-evidence-grid">
        ${(trustEvidence.items || []).map((item) => `
          <div class="trust-evidence-card">
            <span>${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(item.value)}</strong>
          </div>
        `).join('')}
      </div>
      <p class="detail-note">${escapeHtml(trustEvidence.note || '')}</p>
    </section>
  `;
}

function renderSalesConversion(plan) {
  if (!plan) return '';
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
            <small>${formatPriceRange(pkg.priceRange)}</small>
            <p>${escapeHtml(pkg.reason || '')}</p>
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

function renderScoreBreakdown(scores) {
  const items = [
    ['technical-seo', '기술 SEO'],
    ['search-understanding', '검색이해도'],
    ['aeo', 'AEO'],
    ['geo', 'GEO'],
    ['conversion', '전환 구조']
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
  const topIssues = ordered.slice(0, 6);

  return `
    <section class="panel readable-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Priority</p>
          <h3>우선 개선 항목</h3>
        </div>
        <span class="section-count">${workOrders.length}개 전체 이슈</span>
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
        <details class="more-issues">
          <summary>${hidden.length}개 더 보기</summary>
          <div class="readable-issue-list">
            ${hidden.map((issue) => renderIssueCard(issue)).join('')}
          </div>
        </details>
      ` : ''}
    </article>
  `;
}

function renderIssueCard(issue, options = {}) {
  const rank = options.rank ? `<span class="issue-rank">${options.rank}</span>` : '';
  return `
    <div class="readable-issue-card">
      <div class="issue-card-title">
        ${rank}
        <strong>${escapeHtml(issue.issueName || issue.name)}</strong>
      </div>
      <p>${escapeHtml(issue.instruction || issue.evidence || '')}</p>
      <div class="issue-meta">
        <span>${escapeHtml(labelForLayer(issue.layer))}</span>
        <span>영향도 ${escapeHtml(labelForImpact(issue.impact))}</span>
        <span>범위 ${escapeHtml(labelForScope(issue.expectedScope))}</span>
      </div>
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

function impactRank(value) {
  return { high: 3, medium: 2, low: 1 }[value] || 0;
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
    'technical-seo': '기술 SEO',
    'search-understanding': '검색이해도',
    aeo: 'AEO 준비도',
    geo: 'GEO 준비도',
    conversion: '전환 구조',
    review: '검토'
  }[value] || value;
}

function labelForImpact(value) {
  return {
    high: '높음',
    medium: '중간',
    low: '낮음'
  }[value] || value || '검토';
}

function labelForScope(value) {
  return {
    small: '소형',
    medium: '중형',
    large: '대형',
    unknown: '검토 필요'
  }[value] || value || '검토 필요';
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

function formatPriceRange(priceRange = {}) {
  const min = Number(priceRange.min || 0);
  const max = Number(priceRange.max || 0);
  if (!min && !max) return '상담 후 산정';
  return `${min.toLocaleString()}-${max.toLocaleString()}원`;
}
