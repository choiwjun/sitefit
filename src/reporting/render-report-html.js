export function renderReportHtml(run) {
  const report = run.report || {};
  const workOrders = report.workOrders || [];
  const issueCards = workOrders.map(workOrderToIssueCard);
  const issueSummary = report.issueSummary || {
    uniqueIssueCount: issueCards.length,
    rawIssueCount: run.issues?.length || issueCards.length
  };

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>사이트핏 진단 리포트</title>
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    <main>
      <section class="panel">
        <p class="eyebrow">사이트핏 진단 리포트</p>
        <h1>${escapeHtml(run.url)}</h1>
        <div class="score">${escapeHtml(run.scores?.overall ?? 0)}</div>
        <p>${escapeHtml(report.executiveSummary || run.summary || '')}</p>
        ${run.businessCategory ? `<p><small>추정 업종 카테고리: ${escapeHtml(run.businessCategory.label)}${run.businessCategory.pageCount ? ` (${escapeHtml(run.businessCategory.pageCount)}개 페이지 근거)` : ''}</small></p>` : ''}
        <p><small>주요 개선 유형 ${escapeHtml(issueSummary.uniqueIssueCount)}개 | 페이지별 탐지 ${escapeHtml(issueSummary.rawIssueCount)}건 | 분석 페이지 ${escapeHtml(run.pagesAnalyzed || 0)}개</small></p>
        ${renderWebQualityScores(run.webQualityScores)}
        ${renderAnalysisCoverage(run.analysisCoverage)}
        <p>${escapeHtml(report.riskNotice || '')}</p>
      </section>
      ${renderEvidenceSummary(run.pageResults || [])}
      <section class="panel">
        <h2>주요 개선 유형</h2>
        <ul class="issues">
          ${issueCards.map((issue) => `
            <li>
              <strong>${escapeHtml(issue.name)}</strong>
              <p>${escapeHtml(issue.evidence)}</p>
              <small>${escapeHtml(labelForLayer(issue.layer))} | 영향도 ${escapeHtml(labelForImpact(issue.impact))} | 범위 ${escapeHtml(labelForScope(issue.expectedScope))} | ${escapeHtml(issue.urlSummary)}</small>
            </li>
          `).join('')}
        </ul>
      </section>
      <section class="panel">
        <h2>작업지시서</h2>
        <ul class="issues">
          ${workOrders.map((order) => `
            <li>
              <strong>${escapeHtml(order.issueName)}</strong>
              <p>${escapeHtml(order.instruction)}</p>
              <small>${escapeHtml(labelForOwner(order.owner))} | 신뢰도 ${escapeHtml(labelForConfidence(order.confidence))}</small>
            </li>
          `).join('')}
        </ul>
      </section>
    </main>
  </body>
</html>`;
}

function renderWebQualityScores(scores) {
  if (!scores) return '';
  return `
        <h2>웹 품질 점수</h2>
        <p><small>성능 ${escapeHtml(scores.performance ?? 0)} | 접근성 ${escapeHtml(scores.accessibility ?? 0)} | 보안 관행 ${escapeHtml(scores.bestPractices ?? 0)} | SEO ${escapeHtml(scores.seo ?? 0)} | 종합 ${escapeHtml(scores.overall ?? 0)}</small></p>
        <p><small>현재 수집된 진단 근거로 계산한 Lighthouse-style 참고 점수이며 실제 PageSpeed Insights 점수와 동일하다고 보장하지 않습니다.</small></p>
  `;
}

function renderAnalysisCoverage(coverage) {
  if (!coverage) return '';
  return `
        <p><small>분석률 ${escapeHtml(coverage.analysisRate ?? 0)}% | 발견 URL ${escapeHtml(coverage.discoveredUrls ?? 0)}개 | 수집 제외 ${escapeHtml(coverage.skippedUrls ?? 0)}개 | 링크 점검 ${escapeHtml(coverage.checkedLinks ?? 0)}/${escapeHtml(coverage.maxLinkChecks ?? 0)}개 | JS 렌더링 ${escapeHtml(coverage.renderedPages ?? 0)}개</small></p>
        <p><small>수집 범위: 최대 ${escapeHtml(coverage.maxPages ?? 0)}페이지, 깊이 ${escapeHtml(coverage.maxDepth ?? 0)}, 페이지당 ${escapeHtml(formatBytes(coverage.maxBytes ?? 0))}</small></p>
  `;
}

function renderEvidenceSummary(pageResults) {
  if (!pageResults.length) return '';
  return `
      <section class="panel">
        <h2>분석 근거 요약</h2>
        <ul class="issues">
          ${pageResults.slice(0, 8).map((page) => {
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
      </section>`;
}

function workOrderToIssueCard(order) {
  const urlCount = order.affectedUrls?.length || 0;
  return {
    name: order.issueName,
    layer: order.layer || inferLayerFromOwner(order.owner),
    impact: order.impact || 'medium',
    expectedScope: order.expectedScope || 'small',
    evidence: order.instruction,
    urlSummary: urlCount > 1 ? `영향 URL ${urlCount}개` : `대상 URL ${order.targetUrl || '확인 필요'}`
  };
}

function inferLayerFromOwner(owner) {
  return {
    developer: 'technical-seo',
    publisher: 'technical-seo',
    planner: 'conversion',
    marketer: 'aeo',
    'content owner': 'aeo'
  }[owner] || 'review';
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
  return { high: '높음', medium: '중간', low: '낮음' }[value] || value;
}

function labelForScope(value) {
  return { small: '소형', medium: '중형', large: '대형', unknown: '검토 필요' }[value] || value;
}

function labelForConfidence(value) {
  return { high: '높음', medium: '중간', low: '낮음' }[value] || value;
}

function labelForOwner(value) {
  return {
    developer: '개발자',
    publisher: '퍼블리셔',
    planner: '기획자',
    marketer: '마케터',
    'content owner': '콘텐츠 담당자'
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
