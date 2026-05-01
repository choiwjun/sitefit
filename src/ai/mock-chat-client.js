export class MockChatClient {
  constructor({ provider = 'mock', model = 'sitefit-chat-mock-v1' } = {}) {
    this.provider = provider;
    this.model = model;
  }

  async createChatCompletion({ messages = [], metadata = {} }) {
    const userMessage = [...messages].reverse().find((message) => message.role === 'user')?.content || '';
    const parsed = parseDiagnosisPayload(userMessage);
    const issueCount = metadata.issueCount ?? parsed.issues.length;
    const score = metadata.overallScore ?? parsed.score;
    const topIssues = parsed.issues.slice(0, 3).map((issue) => issue.name).filter(Boolean);
    const focus = topIssues.length ? topIssues.join(', ') : '사이트 구조 확인';

    return {
      provider: this.provider,
      model: this.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: `사이트핏 분석 요약: 종합 준비도 점수 ${score}점입니다. 실제 진단 근거 기준으로 ${issueCount}개의 개선 가능 항목을 확인했으며, 우선 검토 항목은 ${focus}입니다.`
          },
          finishReason: 'stop'
        }
      ],
      usage: {
        promptTokens: estimateTokens(messages.map((message) => message.content).join('\n')),
        completionTokens: 36
      }
    };
  }
}

function parseDiagnosisPayload(text) {
  try {
    const parsed = JSON.parse(text);
    return {
      score: Number(parsed.score || 0),
      issues: Array.isArray(parsed.issues) ? parsed.issues : []
    };
  } catch {
    return {
      score: extractScore(text),
      issues: Array.from({ length: extractIssueCount(text) }, (_, index) => ({ name: `이슈 ${index + 1}` }))
    };
  }
}

function extractIssueCount(text) {
  const match = /(\d+)\s+issue/i.exec(text);
  return match ? Number(match[1]) : 0;
}

function extractScore(text) {
  const match = /score[:\s]+(\d+)/i.exec(text);
  return match ? Number(match[1]) : 0;
}

function estimateTokens(text) {
  return Math.max(1, Math.ceil(text.length / 4));
}
