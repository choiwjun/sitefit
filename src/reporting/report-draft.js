import { complianceNotesForIndustry } from '../compliance/industry-guardrails.js';
import { createPlainLanguageSummary, enrichWorkOrderPlainLanguage } from './plain-language.js';

const FORBIDDEN_PATTERNS = [
  /guarantee/gi,
  /top ranking/gi,
  /traffic will increase/gi,
  /ChatGPT will recommend/gi,
  /상위\s*노출\s*보장/g,
  /트래픽\s*증가/g,
  /AI\s*답변.*노출/g
];

export function generateReportDraft({ scores = {}, issues = [], industry = '' }) {
  const groupedIssues = groupIssuesByType(issues);
  const highImpact = groupedIssues.filter((issue) => issue.impact === 'high');
  const topNames = groupedIssues.slice(0, 5).map((issue) => issue.name).join(', ') || '사이트 구조 확인';
  const rawIssueCount = issues.length;
  const uniqueIssueCount = groupedIssues.length;
  const issueSummary = {
    uniqueIssueCount,
    rawIssueCount
  };
  const workOrders = groupedIssues.map(toWorkOrder).map(enrichWorkOrderPlainLanguage);

  const report = {
    executiveSummary: sanitize(
      `이 사이트의 종합 준비도 점수는 ${scores.overall ?? 0}점입니다. ` +
      `검색엔진과 AI 답변엔진이 이해하기 쉬운지 실제 진단 근거인 페이지 구조와 사이트 자산을 기준으로 ` +
      `개선 유형 ${uniqueIssueCount}개를 확인했습니다. 페이지별 탐지 건수는 ${rawIssueCount}건입니다. ` +
      `첫 상담에서는 ${topNames}을 우선 검토하는 것이 적합합니다.`
    ),
    issueSummary,
    plainLanguageSummary: createPlainLanguageSummary({ scores, workOrders, issueSummary }),
    workScopeSummary: summarizeWorkScopes(groupedIssues),
    workOrders,
    complianceNotes: complianceNotesForIndustry(industry),
    riskNotice: '이 리포트는 준비도와 작업 범위를 점검합니다. 검색 순위나 방문자 수, AI 답변 포함 여부를 보장하지 않습니다.',
    consultationCta: highImpact.length
      ? '영향도가 높은 작업 범위에 대한 상담을 신청하세요.'
      : '권장 작업 범위를 검토하기 위한 상담을 신청하세요.'
  };

  return sanitizeReport(report);
}

function groupIssuesByType(issues) {
  const groups = new Map();

  for (const issue of issues) {
    const key = `${issue.layer || 'unknown'}:${issue.name}`;
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        ...issue,
        affectedUrls: uniqueValues([issue.targetUrl].filter(Boolean)),
        evidenceSamples: uniqueValues([issue.evidence].filter(Boolean)),
        occurrenceCount: 1
      });
      continue;
    }

    existing.occurrenceCount += 1;
    existing.affectedUrls = uniqueValues([...existing.affectedUrls, issue.targetUrl].filter(Boolean));
    existing.evidenceSamples = uniqueValues([...existing.evidenceSamples, issue.evidence].filter(Boolean));
    existing.impact = higherImpact(existing.impact, issue.impact);
    existing.confidence = lowerConfidence(existing.confidence, issue.confidence);
  }

  return [...groups.values()].sort(compareIssues);
}

function compareIssues(a, b) {
  return impactWeight(b.impact) - impactWeight(a.impact) ||
    confidenceWeight(b.confidence) - confidenceWeight(a.confidence) ||
    b.occurrenceCount - a.occurrenceCount ||
    String(a.name).localeCompare(String(b.name), 'ko');
}

function summarizeWorkScopes(issues) {
  const counts = new Map();
  for (const issue of issues) {
    const key = `${issue.workType || 'review'}:${issue.expectedScope || 'unknown'}`;
    const current = counts.get(key) || { count: 0, affectedUrlCount: 0 };
    current.count += 1;
    current.affectedUrlCount += issue.affectedUrls?.length || 0;
    counts.set(key, current);
  }

  return [...counts.entries()].map(([key, value]) => {
    const [workType, scope] = key.split(':');
    return { workType, scope, count: value.count, affectedUrlCount: value.affectedUrlCount };
  });
}

function toWorkOrder(issue) {
  const affectedUrlCount = issue.affectedUrls?.length || 0;
  const urlSummary = affectedUrlCount > 1
    ? `영향 URL ${affectedUrlCount}개`
    : `대상 URL: ${issue.affectedUrls?.[0] || issue.targetUrl || '확인 필요'}`;
  const evidence = issue.evidenceSamples?.[0] || issue.evidence || '진단 근거 확인 필요';

  return {
    targetUrl: issue.affectedUrls?.[0] || issue.targetUrl,
    affectedUrls: issue.affectedUrls || [],
    occurrenceCount: issue.occurrenceCount || 1,
    issueName: issue.name,
    layer: issue.layer,
    impact: issue.impact,
    expectedScope: issue.expectedScope,
    owner: issue.owner,
    confidence: issue.confidence,
    instruction: sanitize(`${issue.recommendedAction} ${urlSummary}. 근거: ${evidence}`)
  };
}

function sanitizeReport(value) {
  if (Array.isArray(value)) return value.map(sanitizeReport);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeReport(item)]));
  }
  if (typeof value === 'string') return sanitize(value);
  return value;
}

function sanitize(text) {
  return FORBIDDEN_PATTERNS.reduce(
    (current, pattern) => current.replace(pattern, '성과를 보장하지 않습니다'),
    text
  );
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function higherImpact(a, b) {
  return impactWeight(b) > impactWeight(a) ? b : a;
}

function lowerConfidence(a, b) {
  return confidenceWeight(b) < confidenceWeight(a) ? b : a;
}

function impactWeight(value) {
  return { high: 3, medium: 2, low: 1 }[value] || 0;
}

function confidenceWeight(value) {
  return { high: 3, medium: 2, low: 1 }[value] || 0;
}
