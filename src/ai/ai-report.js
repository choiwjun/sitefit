import { complianceNotesForIndustry } from '../compliance/industry-guardrails.js';
import { generateReportDraft } from '../reporting/report-draft.js';
import { MockChatClient } from './mock-chat-client.js';

const FORBIDDEN_PATTERNS = [
  /guarantee/gi,
  /top ranking/gi,
  /traffic will increase/gi,
  /ChatGPT will recommend/gi,
  /상위\s*노출\s*보장/g
];

export async function generateAiReportDraft({ diagnosis, chatClient = new MockChatClient() }) {
  const baseReport = generateReportDraft({
    scores: diagnosis.scores,
    issues: diagnosis.issues,
    industry: diagnosis.industry
  });
  const messages = [
    {
      role: 'system',
      content: '당신은 사이트핏입니다. 구조화된 실제 진단 근거에 기반해 한국어로 설명하고, 검색 순위나 성과를 보장하지 마세요.'
    },
    {
      role: 'user',
      content: JSON.stringify({
        score: diagnosis.scores?.overall || 0,
        industry: diagnosis.industry || 'unknown',
        pagesAnalyzed: diagnosis.pagesAnalyzed || diagnosis.pageResults?.length || 0,
        uniqueIssueCount: baseReport.issueSummary?.uniqueIssueCount || 0,
        rawIssueCount: baseReport.issueSummary?.rawIssueCount || 0,
        issues: (baseReport.workOrders || []).slice(0, 10).map((order) => ({
          name: order.issueName,
          impact: order.impact,
          confidence: order.confidence,
          occurrenceCount: order.occurrenceCount,
          affectedUrlCount: order.affectedUrls?.length || 0,
          instruction: order.instruction
        }))
      })
    }
  ];
  const completion = await chatClient.createChatCompletion({
    messages,
    metadata: {
      issueCount: baseReport.issueSummary?.uniqueIssueCount || diagnosis.issues?.length || 0,
      overallScore: diagnosis.scores?.overall || 0
    }
  });

  return sanitizeReport({
    ...baseReport,
    aiSummary: sanitize(completion.choices[0]?.message?.content || ''),
    complianceNotes: complianceNotesForIndustry(diagnosis.industry),
    ai: {
      provider: completion.provider,
      model: completion.model,
      usage: completion.usage
    }
  });
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
