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
  resultPanel.textContent = '진단을 진행하고 있습니다...';

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
    <h2>전체 진단 결과</h2>
    <div class="score">${escapeHtml(run.scores.overall)}</div>
    <p>${escapeHtml(run.summary)}</p>
    <p>${escapeHtml(run.report?.executiveSummary || '')}</p>
    ${businessCategory ? `<p><small>추정 업종 카테고리: ${escapeHtml(businessCategory.label)}${businessCategory.pageCount ? ` (${escapeHtml(businessCategory.pageCount)}개 페이지 근거)` : ''}</small></p>` : ''}
    <p><small>분석 페이지: ${escapeHtml(crawledPages)}개 | 주요 개선 유형: ${escapeHtml(issueSummary.uniqueIssueCount)}개 | 페이지별 탐지: ${escapeHtml(issueSummary.rawIssueCount)}건 | AI 제공 방식: ${escapeHtml(provider)}</small></p>
    <p><a class="button" href="/reports/${encodeURIComponent(run.id)}?token=${encodeURIComponent(run.shareToken || '')}">공유 리포트 열기</a></p>
    ${renderEvidenceSummary(run.pageResults || [])}
    ${workScopes.length ? `
      <h3>예상 작업 범위</h3>
      <ul class="issues">
        ${workScopes.map((scope) => `
          <li>
            <strong>${escapeHtml(labelForWorkType(scope.workType))}</strong>
            <p>${escapeHtml(scope.count)}개 항목 | 범위 ${escapeHtml(labelForScope(scope.scope))}</p>
          </li>
        `).join('')}
      </ul>
    ` : ''}
    <h3>전체 실제 분석 이슈</h3>
    ${allIssues.length ? `
      <ul class="issues">
        ${allIssues.map((order) => `
          <li>
            <strong>${escapeHtml(order.issueName)}</strong>
            <p>${escapeHtml(order.instruction)}</p>
            <small>${escapeHtml(labelForLayer(order.layer))} | 영향도 ${escapeHtml(labelForImpact(order.impact))} | 범위 ${escapeHtml(labelForScope(order.expectedScope))}</small>
          </li>
        `).join('')}
      </ul>
    ` : '<p>진단 범위에서 개선 이슈가 발견되지 않았습니다.</p>'}
  `;
}

function renderEvidenceSummary(pageResults) {
  if (!pageResults.length) return '';
  return `
    <h3>분석 근거 요약</h3>
    <ul class="issues">
      ${pageResults.slice(0, 5).map((page) => {
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
          <li>
            <strong>${escapeHtml(metadata.title || page.url)}</strong>
            <p>${escapeHtml(page.url)}</p>
            <small>유형 ${escapeHtml(labelForPageType(metadata.pageType))} | H1 ${escapeHtml(headingStats.h1Count ?? 0)}개 | H2 ${escapeHtml(headingStats.h2Count ?? 0)}개 | 본문 ${escapeHtml(metadata.wordCount ?? 0)}단어 | 질문형 제목 ${escapeHtml(answerReadiness.questionHeadingCount ?? 0)}개 | 직접 답변 ${escapeHtml(answerReadiness.directAnswerCount ?? 0)}개 | FAQ schema ${answerReadiness.hasFaqSchema ? '있음' : '없음'} | 엔티티 schema ${entitySignals.hasOrganizationSchema ? '있음' : '없음'} | 인용 문장 ${escapeHtml(geoReadiness.citationLikeSentenceCount ?? 0)}개 | 외부 신뢰 링크 ${escapeHtml(geoReadiness.externalTrustLinkCount ?? 0)}개 | 내부 링크 ${escapeHtml(linkStats.internal ?? 0)}개 | 외부 링크 ${escapeHtml(linkStats.external ?? 0)}개 | 빈 앵커 ${escapeHtml(linkStats.emptyAnchorCount ?? 0)}개 | 이미지 alt 누락 ${escapeHtml(imageStats.missingAlt ?? 0)}/${escapeHtml(imageStats.total ?? 0)} | 이미지 크기 누락 ${escapeHtml(imageStats.missingDimensions ?? 0)}개 | 렌더 차단 CSS ${escapeHtml(performanceStats.blockingStylesheets ?? 0)}개 | 동기 script ${escapeHtml(performanceStats.syncScripts ?? 0)}개 | lazy 미적용 이미지 ${escapeHtml(performanceStats.nonLazyImages ?? 0)}개 | LCP ${escapeHtml(runtimePerformance.lcpMs ?? 0)}ms | CLS ${escapeHtml(runtimePerformance.cls ?? 0)} | TBT ${escapeHtml(runtimePerformance.totalBlockingTimeMs ?? 0)}ms | 전송량 ${escapeHtml(runtimePerformance.transferSizeBytes ?? 0)}B | Schema ${escapeHtml(schemas)} | viewport ${technicalBasics.hasViewport ? '있음' : '없음'} | robots ${escapeHtml(technicalBasics.robots || '기본')}</small>
          </li>
        `;
      }).join('')}
    </ul>
  `;
}

function syncLeadUrl(siteUrl) {
  const leadUrlInput = leadForm?.querySelector('input[name="siteUrl"]');
  if (leadUrlInput && siteUrl) {
    leadUrlInput.value = siteUrl;
  }
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
    conversion: '전환 구조'
  }[value] || value;
}

function labelForImpact(value) {
  return {
    high: '높음',
    medium: '중간',
    low: '낮음'
  }[value] || value;
}

function labelForScope(value) {
  return {
    small: '소형',
    medium: '중형',
    large: '대형',
    unknown: '검토 필요'
  }[value] || value;
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
