import test from 'node:test';
import assert from 'node:assert/strict';

import { MockChatClient } from '../src/ai/mock-chat-client.js';
import { generateAiReportDraft } from '../src/ai/ai-report.js';

test('mock chat client summarizes actual structured diagnosis evidence', async () => {
  const client = new MockChatClient();
  const result = await client.createChatCompletion({
    messages: [
      { role: 'system', content: 'You are SiteFit.' },
      {
        role: 'user',
        content: JSON.stringify({
          score: 64,
          issues: [
            { name: 'FAQ 섹션 부족' },
            { name: '가격 또는 견적 기준 부족' }
          ]
        })
      }
    ],
    metadata: { issueCount: 2, overallScore: 64 }
  });

  assert.equal(result.provider, 'mock');
  assert.equal(result.choices[0].message.role, 'assistant');
  assert.match(result.choices[0].message.content, /FAQ 섹션 부족/);
  assert.match(result.choices[0].message.content, /가격 또는 견적 기준 부족/);
  assert.doesNotMatch(result.choices[0].message.content, /mock/i);
});

test('AI report generation uses real diagnosis issue names and safe wording', async () => {
  const client = new MockChatClient();
  const report = await generateAiReportDraft({
    chatClient: client,
    diagnosis: {
      scores: { overall: 64 },
      industry: 'hospital',
      issues: [
        {
          name: 'FAQ 섹션 부족',
          layer: 'aeo',
          impact: 'medium',
          confidence: 'medium',
          targetUrl: 'https://example.com/service',
          evidence: 'FAQ 섹션이 확인되지 않았습니다.',
          recommendedAction: 'FAQ 콘텐츠를 추가합니다.'
        }
      ]
    }
  });

  assert.equal(report.ai.provider, 'mock');
  assert.match(report.executiveSummary, /FAQ 섹션 부족/);
  assert.doesNotMatch(report.executiveSummary, /mock/i);
  assert.doesNotMatch(JSON.stringify(report), /guarantee|top ranking|traffic will increase|ChatGPT will recommend/i);
  assert.ok(report.complianceNotes.length > 0);
});
