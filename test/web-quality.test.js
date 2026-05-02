import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateWebQualityScores } from '../src/diagnosis/web-quality.js';

test('calculates lighthouse-style quality scores from diagnosis evidence', () => {
  const result = calculateWebQualityScores({
    scores: {
      'technical-seo': 64,
      'search-understanding': 70
    },
    issues: [
      { name: 'HTTPS 혼합 콘텐츠 발견' },
      { name: '리다이렉트 체인 과다' }
    ],
    pageResults: [
      {
        metadata: {
          technicalBasics: {
            hasLang: false,
            hasCharset: false,
            invalidJsonLdCount: 1,
            mixedContentCount: 1
          },
          performanceStats: {
            blockingStylesheets: 4,
            syncScripts: 4,
            nonLazyImages: 8
          },
          runtimePerformance: {
            lcpMs: 3600,
            cls: 0.18,
            totalBlockingTimeMs: 420,
            transferSizeBytes: 2400000,
            imageTransferSizeBytes: 1300000
          },
          imageStats: {
            missingAlt: 3
          },
          linkStats: {
            emptyAnchorCount: 2
          },
          formStats: {
            unlabeledControls: 2,
            insecureActionCount: 1
          },
          accessibilityStats: {
            emptyButtonCount: 1,
            duplicateIdCount: 1,
            iframeWithoutTitleCount: 1
          }
        }
      }
    ]
  });

  assert.equal(result.source, 'sitefit-rules');
  assert.ok(result.performance < 70);
  assert.ok(result.accessibility < 70);
  assert.ok(result.bestPractices < 80);
  assert.equal(result.seo, 67);
  assert.ok(result.overall < 75);
});

test('keeps quality scores high when evidence is clean', () => {
  const result = calculateWebQualityScores({
    scores: {
      'technical-seo': 96,
      'search-understanding': 94
    },
    issues: [],
    pageResults: [
      {
        metadata: {
          technicalBasics: {
            hasLang: true,
            hasCharset: true,
            invalidJsonLdCount: 0,
            mixedContentCount: 0
          },
          performanceStats: {
            blockingStylesheets: 1,
            syncScripts: 0,
            nonLazyImages: 1
          },
          runtimePerformance: {
            lcpMs: 1800,
            cls: 0.02,
            totalBlockingTimeMs: 80,
            transferSizeBytes: 700000,
            imageTransferSizeBytes: 300000
          },
          imageStats: {
            missingAlt: 0
          },
          linkStats: {
            emptyAnchorCount: 0
          },
          formStats: {
            unlabeledControls: 0,
            insecureActionCount: 0
          },
          accessibilityStats: {
            emptyButtonCount: 0,
            duplicateIdCount: 0,
            iframeWithoutTitleCount: 0
          }
        }
      }
    ]
  });

  assert.ok(result.performance >= 90);
  assert.ok(result.accessibility >= 90);
  assert.ok(result.bestPractices >= 90);
  assert.equal(result.seo, 95);
});

test('penalizes third-party scripts in local quality scoring', () => {
  const result = calculateWebQualityScores({
    scores: {
      'technical-seo': 90,
      'search-understanding': 90
    },
    issues: [
      { name: '서드파티 스크립트 점검 필요' }
    ],
    pageResults: [
      {
        metadata: {
          technicalBasics: {
            hasLang: true,
            hasCharset: true,
            invalidJsonLdCount: 0,
            mixedContentCount: 0
          },
          performanceStats: {
            blockingStylesheets: 0,
            syncScripts: 0,
            nonLazyImages: 0
          },
          thirdPartyScripts: {
            count: 5
          }
        }
      }
    ]
  });

  assert.ok(result.performance < 90);
  assert.ok(result.bestPractices < 100);
});
