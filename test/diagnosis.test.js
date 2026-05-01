import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeHtml } from '../src/diagnosis/analyze-html.js';

test('creates evidence-backed issue cards for missing search and conversion structure', () => {
  const html = `
    <!doctype html>
    <html lang="ko">
      <head><title>SiteFit</title></head>
      <body>
        <h1>SiteFit</h1>
        <p>We help companies understand their websites.</p>
      </body>
    </html>
  `;

  const result = analyzeHtml({
    url: 'https://example.com/',
    html,
    industry: 'b2b',
    goal: 'inquiries'
  });

  assert.equal(result.url, 'https://example.com/');
  assert.ok(result.scores.overall < 90);
  assert.ok(result.issues.some((issue) => issue.layer === 'technical-seo' && issue.name === '메타 설명 누락'));
  assert.ok(result.issues.some((issue) => issue.layer === 'aeo' && issue.name === 'FAQ 섹션 부족'));
  assert.ok(result.issues.some((issue) => issue.layer === 'geo' && issue.name === '신뢰 근거 페이지 부족'));
  assert.ok(result.issues.some((issue) => issue.layer === 'conversion' && issue.name === '주요 상담 CTA 부족'));
});

test('rewards pages with metadata, FAQ, trust sources, and CTA', () => {
  const html = `
    <!doctype html>
    <html lang="ko">
      <head>
        <title>B2B SEO Consulting | Example</title>
        <meta name="description" content="B2B companies can request a search readiness diagnosis and consultation.">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta property="og:title" content="B2B SEO Consulting | Example">
        <meta property="og:description" content="B2B companies can request a search readiness diagnosis and consultation.">
        <link rel="canonical" href="https://example.com/">
        <script type="application/ld+json">{"@type":"Organization","name":"Example"}</script>
      </head>
      <body>
        <h1>B2B SEO Consulting</h1>
        <h2>How does the diagnosis work?</h2>
        <p>The diagnosis checks searchable structure, FAQ readiness, and inquiry paths.</p>
        <p>Our team supports B2B service companies with page planning, publishing, schema review, and monthly monitoring so decision makers can understand what should be fixed first.</p>
        <section id="faq"><h2>FAQ</h2><p>How much does it cost?</p></section>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
        <a href="mailto:sales@example.com">Email sales</a>
        <button>Request consultation</button>
      </body>
    </html>
  `;

  const result = analyzeHtml({
    url: 'https://example.com/',
    html,
    industry: 'b2b',
    goal: 'consultation'
  });

  assert.ok(result.scores.overall >= 80);
  assert.equal(result.issues.some((issue) => issue.name === '메타 설명 누락'), false);
  assert.equal(result.issues.some((issue) => issue.name === 'FAQ 섹션 부족'), false);
  assert.equal(result.issues.some((issue) => issue.name === '주요 상담 CTA 부족'), false);
});

test('detects weak search understanding and image accessibility issues', () => {
  const html = `
    <!doctype html>
    <html>
      <head>
        <title>Welcome</title>
        <meta name="description" content="Welcome to our website and learn more about what we do.">
      </head>
      <body>
        <h1>Welcome</h1>
        <img src="/hero.jpg">
        <p>We provide services for customers.</p>
        <a href="/contact">Contact</a>
      </body>
    </html>
  `;

  const result = analyzeHtml({
    url: 'https://example.com/',
    html,
    industry: 'manufacturing',
    goal: 'inquiries'
  });

  assert.ok(result.issues.some((issue) => issue.layer === 'search-understanding' && issue.name === '페이지 주제가 지나치게 일반적임'));
  assert.ok(result.issues.some((issue) => issue.layer === 'technical-seo' && issue.name === '이미지 대체텍스트 누락'));
});

test('extracts page metadata for deeper site-level analysis', () => {
  const html = `
    <!doctype html>
    <html lang="ko">
      <head>
        <title>서비스 소개 | Example</title>
        <meta name="description" content="Example service page for B2B teams that need consulting and delivery.">
        <link rel="canonical" href="https://example.com/service">
        <script type="application/ld+json">{"@type":["Organization","Service"],"name":"Example"}</script>
      </head>
      <body>
        <h1>서비스 소개</h1>
        <img src="/hero.jpg">
        <img src="/diagram.jpg" alt="서비스 구조도">
        <a href="/contact">문의하기</a>
      </body>
    </html>
  `;

  const result = analyzeHtml({
    url: 'https://example.com/service',
    html
  });

  assert.equal(result.metadata.pageType, 'service');
  assert.equal(result.metadata.title, '서비스 소개 | Example');
  assert.equal(result.metadata.h1, '서비스 소개');
  assert.deepEqual(result.metadata.schemaTypes.sort(), ['Organization', 'Service']);
  assert.equal(result.metadata.imageStats.total, 2);
  assert.equal(result.metadata.imageStats.missingAlt, 1);
});

test('detects advanced technical content and conversion weaknesses from real HTML', () => {
  const html = `
    <!doctype html>
    <html>
      <head>
        <title>Home</title>
        <meta name="description" content="Short company introduction for customers.">
        <script type="application/ld+json">{"@type":"Organization"</script>
      </head>
      <body>
        <h1>Home</h1>
        <h1>Welcome</h1>
        <p>We make excellent solutions.</p>
      </body>
    </html>
  `;

  const result = analyzeHtml({
    url: 'https://example.com/',
    html
  });

  assert.equal(result.metadata.technicalBasics.hasLang, false);
  assert.equal(result.metadata.technicalBasics.hasViewport, false);
  assert.equal(result.metadata.technicalBasics.invalidJsonLdCount, 1);
  assert.equal(result.metadata.headingStats.h1Count, 2);
  assert.equal(result.metadata.social.ogTitle, '');
  assert.ok(result.metadata.wordCount > 0);
  assert.ok(result.issues.some((issue) => issue.name === 'title 태그 품질 점검 필요'));
  assert.ok(result.issues.some((issue) => issue.name === '모바일 viewport 누락'));
  assert.ok(result.issues.some((issue) => issue.name === 'HTML lang 속성 누락'));
  assert.ok(result.issues.some((issue) => issue.name === 'JSON-LD 형식 오류'));
  assert.ok(result.issues.some((issue) => issue.name === '제목 구조 보강 필요'));
  assert.ok(result.issues.some((issue) => issue.name === '본문 정보량 부족'));
  assert.ok(result.issues.some((issue) => issue.name === 'OG 메타 정보 부족'));
  assert.ok(result.issues.some((issue) => issue.name === '연락 수단 노출 부족'));
});

test('detects baseline SEO platform checks from page markup', () => {
  const html = `
    <!doctype html>
    <html lang="ko">
      <head>
        <title>전국 기업 고객을 위한 통합 디지털 전환 컨설팅 서비스와 장기 운영 관리 프로그램 전체 안내 페이지</title>
        <meta name="description" content="${'너무 긴 설명입니다. '.repeat(20)}">
        <meta name="robots" content="noindex,nofollow">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="canonical" href="https://other.example.com/service">
        <meta property="og:title" content="디지털 전환 컨설팅">
        <meta property="og:description" content="기업 고객을 위한 컨설팅 안내입니다.">
      </head>
      <body>
        <h1>디지털 전환 컨설팅</h1>
        <h3>도입 효과</h3>
        <p>기업 고객을 대상으로 컨설팅, 구축, 운영, 교육, 유지관리, 월간 리포트, 성과 점검, 문의 상담, 견적 안내, 서비스 절차를 제공합니다.</p>
        <p>비교 자료, 사례, 고객사, 인증, 포트폴리오와 프로젝트 진행 과정을 함께 제공합니다.</p>
        <a href="/contact"></a>
        <a href="/about">회사소개</a>
        <a href="https://external.example.com/reference">외부 자료</a>
        <img src="/hero.jpg" alt="컨설팅 소개">
      </body>
    </html>
  `;

  const result = analyzeHtml({
    url: 'https://example.com/service',
    html
  });

  assert.equal(result.metadata.technicalBasics.robots, 'noindex,nofollow');
  assert.equal(result.metadata.linkStats.internal, 2);
  assert.equal(result.metadata.linkStats.external, 1);
  assert.equal(result.metadata.linkStats.emptyAnchorCount, 1);
  assert.equal(result.metadata.imageStats.missingDimensions, 1);
  assert.ok(result.issues.some((issue) => issue.name === 'robots noindex 설정 확인 필요'));
  assert.ok(result.issues.some((issue) => issue.name === 'meta description 길이 점검 필요'));
  assert.ok(result.issues.some((issue) => issue.name === 'canonical 외부 도메인 참조'));
  assert.ok(result.issues.some((issue) => issue.name === 'heading 계층 순서 점검 필요'));
  assert.ok(result.issues.some((issue) => issue.name === '이미지 크기 속성 누락'));
  assert.ok(result.issues.some((issue) => issue.name === '링크 앵커 텍스트 부족'));
});

test('detects lightweight performance readiness issues from static resources', () => {
  const html = `
    <!doctype html>
    <html lang="ko">
      <head>
        <title>Performance Test Page</title>
        <meta name="description" content="Performance readiness test page with many blocking resources and images.">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="canonical" href="https://example.com/performance">
        <link rel="stylesheet" href="/a.css">
        <link rel="stylesheet" href="/b.css">
        <link rel="stylesheet" href="/c.css">
        <script src="/a.js"></script>
        <script src="/b.js"></script>
        <script src="/c.js"></script>
        <script src="/d.js"></script>
      </head>
      <body>
        <h1>Performance Test Page</h1>
        <p>This page has enough text for diagnosis and includes pricing, process, comparison, certification, portfolio and contact information for customers.</p>
        <img src="/1.jpg" alt="one" width="100" height="100">
        <img src="/2.jpg" alt="two" width="100" height="100">
        <img src="/3.jpg" alt="three" width="100" height="100">
        <img src="/4.jpg" alt="four" width="100" height="100">
        <img src="/5.jpg" alt="five" width="100" height="100">
        <img src="/6.jpg" alt="six" width="100" height="100">
      </body>
    </html>
  `;

  const result = analyzeHtml({
    url: 'https://example.com/performance',
    html
  });

  assert.equal(result.metadata.performanceStats.blockingStylesheets, 3);
  assert.equal(result.metadata.performanceStats.syncScripts, 4);
  assert.equal(result.metadata.performanceStats.nonLazyImages, 6);
  assert.ok(result.issues.some((issue) => issue.name === '렌더 차단 리소스 점검 필요'));
  assert.ok(result.issues.some((issue) => issue.name === '동기 스크립트 과다'));
  assert.ok(result.issues.some((issue) => issue.name === '이미지 lazy loading 검토 필요'));
});

test('detects runtime Core Web Vitals and resource performance issues from rendered pages', () => {
  const result = analyzeHtml({
    url: 'https://example.com/rendered',
    html: `
      <!doctype html>
      <html lang="ko">
        <head>
          <title>Rendered Performance Page</title>
          <meta name="description" content="Rendered performance page for runtime performance diagnosis.">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link rel="canonical" href="https://example.com/rendered">
        </head>
        <body>
          <h1>Rendered Performance Page</h1>
          <p>This page has enough text with price, process, comparison, certification, portfolio, contact and consultation information for diagnosis.</p>
        </body>
      </html>
    `,
    performance: {
      lcpMs: 3400,
      cls: 0.18,
      totalBlockingTimeMs: 390,
      transferSizeBytes: 2400000,
      resourceCount: 105,
      imageTransferSizeBytes: 1400000
    }
  });

  assert.equal(result.metadata.runtimePerformance.lcpMs, 3400);
  assert.equal(result.metadata.runtimePerformance.cls, 0.18);
  assert.ok(result.issues.some((issue) => issue.name === 'LCP 개선 필요'));
  assert.ok(result.issues.some((issue) => issue.name === 'CLS 개선 필요'));
  assert.ok(result.issues.some((issue) => issue.name === 'Total Blocking Time 개선 필요'));
  assert.ok(result.issues.some((issue) => issue.name === '페이지 전송량 과다'));
  assert.ok(result.issues.some((issue) => issue.name === '이미지 전송량 과다'));
});

test('detects deeper AEO and GEO readiness gaps from page content', () => {
  const html = `
    <!doctype html>
    <html lang="ko">
      <head>
        <title>서비스 소개 | Example</title>
        <meta name="description" content="기업 고객을 위한 서비스 소개와 상담 안내 페이지입니다.">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="canonical" href="https://example.com/service">
      </head>
      <body>
        <h1>서비스 소개</h1>
        <h2>서비스 비용은 얼마인가요?</h2>
        <ul><li>상담 후 안내</li></ul>
        <h2>도입 절차는 어떻게 되나요?</h2>
        <p>문의해주세요.</p>
        <a href="/contact">문의</a>
      </body>
    </html>
  `;

  const result = analyzeHtml({
    url: 'https://example.com/service',
    html
  });

  assert.equal(result.metadata.answerReadiness.questionHeadingCount, 2);
  assert.equal(result.metadata.answerReadiness.directAnswerCount, 0);
  assert.equal(result.metadata.answerReadiness.hasFaqSchema, false);
  assert.equal(result.metadata.geoReadiness.entitySignals.hasOrganizationSchema, false);
  assert.equal(result.metadata.geoReadiness.citationLikeSentenceCount, 0);
  assert.ok(result.issues.some((issue) => issue.name === '질문형 콘텐츠 직접 답변 부족'));
  assert.ok(result.issues.some((issue) => issue.name === 'FAQ 구조화 데이터 보강 필요'));
  assert.ok(result.issues.some((issue) => issue.name === '브랜드 엔티티 설명 부족'));
  assert.ok(result.issues.some((issue) => issue.name === '인용 가능한 핵심 문장 부족'));
  assert.ok(result.issues.some((issue) => issue.name === '외부 신뢰 출처 링크 부족'));
});

test('recognizes stronger AEO and GEO readiness signals', () => {
  const html = `
    <!doctype html>
    <html lang="ko">
      <head>
        <title>Example B2B 운영관리 서비스</title>
        <meta name="description" content="Example은 B2B 기업의 웹사이트 운영관리, 검색 진단, 콘텐츠 개선을 지원하는 전문 서비스입니다.">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta property="og:title" content="Example B2B 운영관리 서비스">
        <meta property="og:description" content="B2B 기업을 위한 운영관리와 검색 진단 서비스입니다.">
        <link rel="canonical" href="https://example.com/service">
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Example",
            "url": "https://example.com",
            "sameAs": ["https://www.linkedin.com/company/example"]
          }
        </script>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [{
              "@type": "Question",
              "name": "서비스 비용은 얼마인가요?",
              "acceptedAnswer": {"@type": "Answer", "text": "서비스 비용은 진단 범위와 월 운영 범위에 따라 산정됩니다."}
            }]
          }
        </script>
      </head>
      <body>
        <h1>Example B2B 운영관리 서비스</h1>
        <p>Example은 B2B 기업의 웹사이트 운영관리, 검색 진단, 콘텐츠 개선을 지원하는 전문 서비스입니다.</p>
        <h2>서비스 비용은 얼마인가요?</h2>
        <p>서비스 비용은 진단 범위와 월 운영 범위에 따라 산정됩니다. 초기 상담에서 사이트 규모, 페이지 수, 콘텐츠 보강 범위를 기준으로 견적을 안내합니다.</p>
        <h2>도입 절차는 어떻게 되나요?</h2>
        <p>도입 절차는 URL 진단, 개선 범위 산정, 작업 일정 확정, 수정 후 재진단 순서로 진행됩니다.</p>
        <p>2026년 기준 Example은 120개 이상의 B2B 웹사이트 진단과 운영관리 프로젝트를 수행했습니다.</p>
        <a href="/about">회사소개</a>
        <a href="/privacy">개인정보처리방침</a>
        <a href="mailto:sales@example.com">이메일 상담</a>
        <a href="https://developers.google.com/search/docs/appearance/structured-data/faqpage">FAQ 구조화 데이터 참고</a>
      </body>
    </html>
  `;

  const result = analyzeHtml({
    url: 'https://example.com/service',
    html
  });

  assert.equal(result.metadata.answerReadiness.questionHeadingCount, 2);
  assert.equal(result.metadata.answerReadiness.directAnswerCount, 2);
  assert.equal(result.metadata.answerReadiness.hasFaqSchema, true);
  assert.equal(result.metadata.geoReadiness.entitySignals.hasOrganizationSchema, true);
  assert.equal(result.metadata.geoReadiness.entitySignals.hasSameAs, true);
  assert.ok(result.metadata.geoReadiness.citationLikeSentenceCount > 0);
  assert.equal(result.issues.some((issue) => issue.name === '질문형 콘텐츠 직접 답변 부족'), false);
  assert.equal(result.issues.some((issue) => issue.name === 'FAQ 구조화 데이터 보강 필요'), false);
  assert.equal(result.issues.some((issue) => issue.name === '브랜드 엔티티 설명 부족'), false);
  assert.equal(result.issues.some((issue) => issue.name === '인용 가능한 핵심 문장 부족'), false);
  assert.equal(result.issues.some((issue) => issue.name === '외부 신뢰 출처 링크 부족'), false);
});

test('infers broad business category from page content without asking the user', () => {
  const html = `
    <!doctype html>
    <html lang="ko">
      <head>
        <title>피부과 진료 예약 | Example Clinic</title>
        <meta name="description" content="피부과, 성형외과, 진료 예약과 상담을 제공하는 의료기관입니다.">
      </head>
      <body>
        <h1>피부과 진료 예약</h1>
        <p>여드름, 리프팅, 피부 진료, 상담 예약을 안내합니다.</p>
      </body>
    </html>
  `;

  const result = analyzeHtml({
    url: 'https://example.com/clinic',
    html
  });

  assert.equal(result.metadata.businessCategory.id, 'healthcare');
  assert.equal(result.metadata.businessCategory.label, '병원/의료');
  assert.ok(result.metadata.businessCategory.confidence > 0);
});
