import { attr, findTags } from './html-parser.js';

const ISSUE_DEFS = {
  metaDescription: {
    layer: 'technical-seo',
    name: '메타 설명 누락',
    impact: 'medium',
    difficulty: 'easy',
    confidence: 'high',
    owner: 'publisher',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  metaDescriptionQuality: {
    layer: 'technical-seo',
    name: 'meta description 길이 점검 필요',
    impact: 'low',
    difficulty: 'easy',
    confidence: 'high',
    owner: 'publisher',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  h1: {
    layer: 'technical-seo',
    name: 'H1 제목 누락',
    impact: 'high',
    difficulty: 'easy',
    confidence: 'high',
    owner: 'publisher',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  faq: {
    layer: 'aeo',
    name: 'FAQ 섹션 부족',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'content owner',
    workType: 'content',
    expectedScope: 'small'
  },
  directAnswer: {
    layer: 'aeo',
    name: '질문형 콘텐츠 직접 답변 부족',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'content owner',
    workType: 'content',
    expectedScope: 'medium'
  },
  faqSchema: {
    layer: 'aeo',
    name: 'FAQ 구조화 데이터 보강 필요',
    impact: 'low',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'developer',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  trust: {
    layer: 'geo',
    name: '신뢰 근거 페이지 부족',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'planner',
    workType: 'landing-page-improvement',
    expectedScope: 'medium'
  },
  brandEntity: {
    layer: 'geo',
    name: '브랜드 엔티티 설명 부족',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'planner',
    workType: 'landing-page-improvement',
    expectedScope: 'medium'
  },
  citationSentence: {
    layer: 'geo',
    name: '인용 가능한 핵심 문장 부족',
    impact: 'low',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'content owner',
    workType: 'content',
    expectedScope: 'small'
  },
  externalTrustLink: {
    layer: 'geo',
    name: '외부 신뢰 출처 링크 부족',
    impact: 'low',
    difficulty: 'easy',
    confidence: 'medium',
    owner: 'content owner',
    workType: 'content',
    expectedScope: 'small'
  },
  cta: {
    layer: 'conversion',
    name: '주요 상담 CTA 부족',
    impact: 'high',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'planner',
    workType: 'conversion-improvement',
    expectedScope: 'medium'
  },
  canonical: {
    layer: 'technical-seo',
    name: 'canonical 링크 누락',
    impact: 'low',
    difficulty: 'easy',
    confidence: 'high',
    owner: 'developer',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  canonicalExternal: {
    layer: 'technical-seo',
    name: 'canonical 외부 도메인 참조',
    impact: 'high',
    difficulty: 'normal',
    confidence: 'high',
    owner: 'developer',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  robotsNoindex: {
    layer: 'technical-seo',
    name: 'robots noindex 설정 확인 필요',
    impact: 'high',
    difficulty: 'normal',
    confidence: 'high',
    owner: 'developer',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  structuredData: {
    layer: 'geo',
    name: '구조화 데이터 적용 필요',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'developer',
    workType: 'technical-seo',
    expectedScope: 'medium'
  },
  genericTopic: {
    layer: 'search-understanding',
    name: '페이지 주제가 지나치게 일반적임',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'planner',
    workType: 'landing-page-improvement',
    expectedScope: 'medium'
  },
  imageAlt: {
    layer: 'technical-seo',
    name: '이미지 대체텍스트 누락',
    impact: 'low',
    difficulty: 'easy',
    confidence: 'high',
    owner: 'publisher',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  imageDimensions: {
    layer: 'technical-seo',
    name: '이미지 크기 속성 누락',
    impact: 'low',
    difficulty: 'easy',
    confidence: 'high',
    owner: 'publisher',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  pricing: {
    layer: 'aeo',
    name: '가격 또는 견적 기준 부족',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'content owner',
    workType: 'content',
    expectedScope: 'small'
  },
  process: {
    layer: 'aeo',
    name: '서비스 절차 설명 부족',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'planner',
    workType: 'content',
    expectedScope: 'small'
  },
  comparison: {
    layer: 'aeo',
    name: '비교 콘텐츠 부족',
    impact: 'low',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'content owner',
    workType: 'content',
    expectedScope: 'small'
  },
  differentiation: {
    layer: 'geo',
    name: '차별점 근거 부족',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'planner',
    workType: 'landing-page-improvement',
    expectedScope: 'medium'
  },
  titleQuality: {
    layer: 'technical-seo',
    name: 'title 태그 품질 점검 필요',
    impact: 'medium',
    difficulty: 'easy',
    confidence: 'high',
    owner: 'publisher',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  viewport: {
    layer: 'technical-seo',
    name: '모바일 viewport 누락',
    impact: 'medium',
    difficulty: 'easy',
    confidence: 'high',
    owner: 'publisher',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  lang: {
    layer: 'technical-seo',
    name: 'HTML lang 속성 누락',
    impact: 'low',
    difficulty: 'easy',
    confidence: 'high',
    owner: 'publisher',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  headingStructure: {
    layer: 'search-understanding',
    name: '제목 구조 보강 필요',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'high',
    owner: 'planner',
    workType: 'landing-page-improvement',
    expectedScope: 'small'
  },
  headingHierarchy: {
    layer: 'search-understanding',
    name: 'heading 계층 순서 점검 필요',
    impact: 'low',
    difficulty: 'easy',
    confidence: 'high',
    owner: 'publisher',
    workType: 'landing-page-improvement',
    expectedScope: 'small'
  },
  thinContent: {
    layer: 'search-understanding',
    name: '본문 정보량 부족',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'content owner',
    workType: 'content',
    expectedScope: 'medium'
  },
  openGraph: {
    layer: 'geo',
    name: 'OG 메타 정보 부족',
    impact: 'low',
    difficulty: 'easy',
    confidence: 'high',
    owner: 'publisher',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  contactChannel: {
    layer: 'conversion',
    name: '연락 수단 노출 부족',
    impact: 'medium',
    difficulty: 'easy',
    confidence: 'medium',
    owner: 'planner',
    workType: 'conversion-improvement',
    expectedScope: 'small'
  },
  emptyAnchor: {
    layer: 'technical-seo',
    name: '링크 앵커 텍스트 부족',
    impact: 'low',
    difficulty: 'easy',
    confidence: 'high',
    owner: 'publisher',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  invalidJsonLd: {
    layer: 'geo',
    name: 'JSON-LD 형식 오류',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'high',
    owner: 'developer',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  renderBlockingResources: {
    layer: 'technical-seo',
    name: '렌더 차단 리소스 점검 필요',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'developer',
    workType: 'technical-seo',
    expectedScope: 'medium'
  },
  syncScripts: {
    layer: 'technical-seo',
    name: '동기 스크립트 과다',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'developer',
    workType: 'technical-seo',
    expectedScope: 'medium'
  },
  lazyImages: {
    layer: 'technical-seo',
    name: '이미지 lazy loading 검토 필요',
    impact: 'low',
    difficulty: 'easy',
    confidence: 'medium',
    owner: 'publisher',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  lcp: {
    layer: 'technical-seo',
    name: 'LCP 개선 필요',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'developer',
    workType: 'technical-seo',
    expectedScope: 'medium'
  },
  cls: {
    layer: 'technical-seo',
    name: 'CLS 개선 필요',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'developer',
    workType: 'technical-seo',
    expectedScope: 'medium'
  },
  totalBlockingTime: {
    layer: 'technical-seo',
    name: 'Total Blocking Time 개선 필요',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'developer',
    workType: 'technical-seo',
    expectedScope: 'medium'
  },
  transferSize: {
    layer: 'technical-seo',
    name: '페이지 전송량 과다',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'developer',
    workType: 'technical-seo',
    expectedScope: 'medium'
  },
  imageTransferSize: {
    layer: 'technical-seo',
    name: '이미지 전송량 과다',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'medium',
    owner: 'publisher',
    workType: 'technical-seo',
    expectedScope: 'medium'
  },
  formLabels: {
    layer: 'technical-seo',
    name: '폼 입력 라벨 누락',
    impact: 'medium',
    difficulty: 'easy',
    confidence: 'high',
    owner: 'publisher',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  buttonName: {
    layer: 'technical-seo',
    name: '버튼 접근성 이름 누락',
    impact: 'low',
    difficulty: 'easy',
    confidence: 'high',
    owner: 'publisher',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  mixedContent: {
    layer: 'technical-seo',
    name: 'HTTPS 혼합 콘텐츠 발견',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'high',
    owner: 'developer',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  charset: {
    layer: 'technical-seo',
    name: '문자 인코딩 선언 누락',
    impact: 'low',
    difficulty: 'easy',
    confidence: 'high',
    owner: 'publisher',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  duplicateId: {
    layer: 'technical-seo',
    name: '중복 id 속성 발견',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'high',
    owner: 'developer',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  insecureFormAction: {
    layer: 'technical-seo',
    name: '안전하지 않은 폼 전송 주소',
    impact: 'high',
    difficulty: 'normal',
    confidence: 'high',
    owner: 'developer',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  iframeTitle: {
    layer: 'technical-seo',
    name: 'iframe title 누락',
    impact: 'low',
    difficulty: 'easy',
    confidence: 'high',
    owner: 'publisher',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  canonicalDuplicate: {
    layer: 'technical-seo',
    name: 'canonical 중복 선언',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'high',
    owner: 'developer',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  robotsNofollow: {
    layer: 'technical-seo',
    name: 'robots nofollow 설정 확인 필요',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'high',
    owner: 'developer',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  hreflangXDefault: {
    layer: 'technical-seo',
    name: 'hreflang x-default 누락',
    impact: 'low',
    difficulty: 'normal',
    confidence: 'high',
    owner: 'developer',
    workType: 'technical-seo',
    expectedScope: 'small'
  },
  thirdPartyScripts: {
    layer: 'technical-seo',
    name: '서드파티 스크립트 점검 필요',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'high',
    owner: 'developer',
    workType: 'technical-seo',
    expectedScope: 'medium'
  }
};

export function analyzeHtml({ url, html, industry, goal, performance }) {
  const text = stripTags(html).toLowerCase();
  const issues = [];
  const metadata = extractMetadata(url, html, text, performance);

  if (!hasTitleQuality(metadata.title)) {
    issues.push(issue(url, ISSUE_DEFS.titleQuality, `title 값이 검색 결과에서 주제를 설명하기에 부족합니다. 현재 값: "${metadata.title || '없음'}"`));
  }

  if (!hasMetaDescription(html)) {
    issues.push(issue(url, ISSUE_DEFS.metaDescription, 'meta description 태그가 확인되지 않았습니다.'));
  }

  if (metadata.metaDescription && !hasMetaDescriptionQuality(metadata.metaDescription)) {
    issues.push(issue(url, ISSUE_DEFS.metaDescriptionQuality, `meta description 길이가 ${metadata.metaDescription.length}자입니다. 일반적으로 50~160자 범위를 우선 검토합니다.`));
  }

  if (!/<h1\b/i.test(html)) {
    issues.push(issue(url, ISSUE_DEFS.h1, 'H1 제목이 확인되지 않았습니다.'));
  }

  if (!hasFaq(html, text)) {
    issues.push(issue(url, ISSUE_DEFS.faq, 'FAQ 섹션 또는 질문-답변형 구조가 확인되지 않았습니다.'));
  }

  if (metadata.answerReadiness.questionHeadingCount > 0 &&
    metadata.answerReadiness.directAnswerCount < metadata.answerReadiness.questionHeadingCount) {
    issues.push(issue(url, ISSUE_DEFS.directAnswer, `질문형 제목 ${metadata.answerReadiness.questionHeadingCount}개 중 직접 답변으로 볼 수 있는 본문은 ${metadata.answerReadiness.directAnswerCount}개입니다.`));
  }

  if ((hasFaq(html, text) || metadata.answerReadiness.questionHeadingCount >= 2) && !metadata.answerReadiness.hasFaqSchema) {
    issues.push(issue(url, ISSUE_DEFS.faqSchema, 'FAQ 또는 질문형 콘텐츠가 있으나 FAQPage 구조화 데이터가 확인되지 않았습니다.'));
  }

  if (!hasTrustSource(html, text)) {
    issues.push(issue(url, ISSUE_DEFS.trust, '회사소개, 연락처, 개인정보처리방침, 사례 등 신뢰 근거 링크가 확인되지 않았습니다.'));
  }

  if (!metadata.geoReadiness.entitySignals.hasOrganizationSchema && !metadata.geoReadiness.entitySignals.hasEntityIntro) {
    issues.push(issue(url, ISSUE_DEFS.brandEntity, '회사명, 서비스명, 대상 고객, 제공 가치를 한 문장으로 설명하는 브랜드 엔티티 신호가 부족합니다.'));
  }

  if (metadata.geoReadiness.citationLikeSentenceCount === 0) {
    issues.push(issue(url, ISSUE_DEFS.citationSentence, 'AI 답변엔진이 인용하기 쉬운 수치, 기준, 수행 이력, 정의형 문장이 확인되지 않았습니다.'));
  }

  if (metadata.geoReadiness.externalTrustLinkCount === 0) {
    issues.push(issue(url, ISSUE_DEFS.externalTrustLink, '가이드, 인증기관, 공식 문서, 협회 등 외부 신뢰 출처로 이어지는 링크가 확인되지 않았습니다.'));
  }

  if (!hasCta(text)) {
    issues.push(issue(url, ISSUE_DEFS.cta, '상담, 문의, 견적, 전화, 구매 등 주요 CTA가 확인되지 않았습니다.'));
  }

  if (!hasContactChannel(html, text)) {
    issues.push(issue(url, ISSUE_DEFS.contactChannel, '전화, 이메일, 메신저, 문의 폼 등 실제 연락 수단이 명확하게 확인되지 않았습니다.'));
  }

  if (metadata.technicalBasics.canonicalCount === 0) {
    issues.push(issue(url, ISSUE_DEFS.canonical, 'canonical link 태그가 확인되지 않았습니다.'));
  }

  if (metadata.technicalBasics.canonicalCount > 1) {
    issues.push(issue(url, ISSUE_DEFS.canonicalDuplicate, `canonical link 태그가 ${metadata.technicalBasics.canonicalCount}개 확인되었습니다.`));
  }

  if (metadata.canonical && hasExternalCanonical(url, metadata.canonical)) {
    issues.push(issue(url, ISSUE_DEFS.canonicalExternal, `canonical URL이 현재 사이트가 아닌 외부 도메인을 가리킵니다. 현재 값: ${metadata.canonical}`));
  }

  if (metadata.technicalBasics.robots && /noindex/i.test(metadata.technicalBasics.robots)) {
    issues.push(issue(url, ISSUE_DEFS.robotsNoindex, `meta robots에 noindex가 포함되어 색인 제외될 수 있습니다. 현재 값: ${metadata.technicalBasics.robots}`));
  }

  if (metadata.technicalBasics.hasRobotsNofollow) {
    issues.push(issue(url, ISSUE_DEFS.robotsNofollow, `meta robots에 nofollow가 포함되어 링크 신호 전달이 제한될 수 있습니다. 현재 값: ${metadata.technicalBasics.robots}`));
  }

  if (metadata.internationalization.hreflangCount > 0 && metadata.internationalization.missingXDefault) {
    issues.push(issue(url, ISSUE_DEFS.hreflangXDefault, `hreflang alternate가 ${metadata.internationalization.hreflangCount}개 있지만 x-default가 없습니다.`));
  }

  if (metadata.thirdPartyScripts.count >= 2) {
    issues.push(issue(url, ISSUE_DEFS.thirdPartyScripts, `외부 도메인 스크립트가 ${metadata.thirdPartyScripts.count}개 확인되었습니다. 호스트: ${metadata.thirdPartyScripts.hosts.join(', ')}`));
  }

  if (!metadata.technicalBasics.hasViewport) {
    issues.push(issue(url, ISSUE_DEFS.viewport, '모바일 화면 기준 viewport meta 태그가 확인되지 않았습니다.'));
  }

  if (!metadata.technicalBasics.hasLang) {
    issues.push(issue(url, ISSUE_DEFS.lang, 'html 태그의 lang 속성이 확인되지 않았습니다.'));
  }

  if (!metadata.technicalBasics.hasCharset) {
    issues.push(issue(url, ISSUE_DEFS.charset, 'head 영역에서 charset 선언이 확인되지 않았습니다.'));
  }

  if (!/<script\b[^>]*type=["']application\/ld\+json["']/i.test(html)) {
    issues.push(issue(url, ISSUE_DEFS.structuredData, 'JSON-LD 구조화 데이터가 확인되지 않았습니다.'));
  }

  if (metadata.technicalBasics.invalidJsonLdCount > 0) {
    issues.push(issue(url, ISSUE_DEFS.invalidJsonLd, `파싱되지 않는 JSON-LD 스크립트가 ${metadata.technicalBasics.invalidJsonLdCount}개 확인되었습니다.`));
  }

  if (hasGenericTopic(html, text)) {
    issues.push(issue(url, ISSUE_DEFS.genericTopic, 'title과 H1이 구체적인 서비스, 제품, 업종, 지역 주제보다 일반적인 표현에 가깝습니다.'));
  }

  if (hasWeakHeadingStructure(metadata)) {
    issues.push(issue(url, ISSUE_DEFS.headingStructure, `H1 ${metadata.headingStats.h1Count}개, H2 ${metadata.headingStats.h2Count}개가 확인되었습니다.`));
  }

  if (metadata.headingStats.hasSkippedLevel) {
    issues.push(issue(url, ISSUE_DEFS.headingHierarchy, 'heading이 H1 다음 H3처럼 중간 계층을 건너뛰는 구조로 확인되었습니다.'));
  }

  if (metadata.wordCount < 50) {
    issues.push(issue(url, ISSUE_DEFS.thinContent, `본문 텍스트가 약 ${metadata.wordCount}개 단어 수준으로 확인되어 핵심 서비스 설명이 부족할 수 있습니다.`));
  }

  if (hasImageWithoutAlt(html)) {
    issues.push(issue(url, ISSUE_DEFS.imageAlt, '의미 있는 이미지 중 대체텍스트가 없는 항목이 확인되었습니다.'));
  }

  if (metadata.imageStats.missingDimensions > 0) {
    issues.push(issue(url, ISSUE_DEFS.imageDimensions, `width/height 속성이 없는 이미지가 ${metadata.imageStats.missingDimensions}개 확인되었습니다.`));
  }

  if (metadata.linkStats.emptyAnchorCount > 0) {
    issues.push(issue(url, ISSUE_DEFS.emptyAnchor, `텍스트나 보조 라벨이 없는 링크가 ${metadata.linkStats.emptyAnchorCount}개 확인되었습니다.`));
  }

  if (metadata.formStats.unlabeledControls > 0) {
    issues.push(issue(url, ISSUE_DEFS.formLabels, `label, aria-label, aria-labelledby 또는 title이 없는 입력 필드가 ${metadata.formStats.unlabeledControls}개 확인되었습니다.`));
  }

  if (metadata.accessibilityStats.emptyButtonCount > 0) {
    issues.push(issue(url, ISSUE_DEFS.buttonName, `텍스트나 aria-label이 없는 버튼이 ${metadata.accessibilityStats.emptyButtonCount}개 확인되었습니다.`));
  }

  if (metadata.technicalBasics.mixedContentCount > 0) {
    issues.push(issue(url, ISSUE_DEFS.mixedContent, `HTTPS 페이지에서 http:// 리소스 또는 링크가 ${metadata.technicalBasics.mixedContentCount}개 확인되었습니다.`));
  }

  if (metadata.accessibilityStats.duplicateIdCount > 0) {
    issues.push(issue(url, ISSUE_DEFS.duplicateId, `같은 id 값을 여러 번 사용하는 항목이 ${metadata.accessibilityStats.duplicateIdCount}개 확인되었습니다.`));
  }

  if (metadata.formStats.insecureActionCount > 0) {
    issues.push(issue(url, ISSUE_DEFS.insecureFormAction, `HTTPS 페이지에서 http:// 주소로 제출되는 form이 ${metadata.formStats.insecureActionCount}개 확인되었습니다.`));
  }

  if (metadata.accessibilityStats.iframeWithoutTitleCount > 0) {
    issues.push(issue(url, ISSUE_DEFS.iframeTitle, `title 속성이 없는 iframe이 ${metadata.accessibilityStats.iframeWithoutTitleCount}개 확인되었습니다.`));
  }

  if (metadata.performanceStats.blockingStylesheets >= 3) {
    issues.push(issue(url, ISSUE_DEFS.renderBlockingResources, `일반 stylesheet 링크가 ${metadata.performanceStats.blockingStylesheets}개 확인되어 렌더 차단 가능성을 검토해야 합니다.`));
  }

  if (metadata.performanceStats.syncScripts >= 3) {
    issues.push(issue(url, ISSUE_DEFS.syncScripts, `defer/async 없이 로드되는 script가 ${metadata.performanceStats.syncScripts}개 확인되었습니다.`));
  }

  if (metadata.performanceStats.nonLazyImages >= 5) {
    issues.push(issue(url, ISSUE_DEFS.lazyImages, `loading="lazy"가 없는 이미지가 ${metadata.performanceStats.nonLazyImages}개 확인되었습니다.`));
  }

  if (metadata.runtimePerformance.lcpMs > 2500) {
    issues.push(issue(url, ISSUE_DEFS.lcp, `렌더링 측정 기준 LCP가 ${metadata.runtimePerformance.lcpMs}ms로 확인되었습니다.`));
  }

  if (metadata.runtimePerformance.cls > 0.1) {
    issues.push(issue(url, ISSUE_DEFS.cls, `렌더링 측정 기준 CLS가 ${metadata.runtimePerformance.cls}로 확인되었습니다.`));
  }

  if (metadata.runtimePerformance.totalBlockingTimeMs > 300) {
    issues.push(issue(url, ISSUE_DEFS.totalBlockingTime, `렌더링 측정 기준 Total Blocking Time이 ${metadata.runtimePerformance.totalBlockingTimeMs}ms로 확인되었습니다.`));
  }

  if (metadata.runtimePerformance.transferSizeBytes > 2000000 || metadata.runtimePerformance.resourceCount > 100) {
    issues.push(issue(url, ISSUE_DEFS.transferSize, `렌더링 리소스 ${metadata.runtimePerformance.resourceCount}개, 전송량 ${formatBytes(metadata.runtimePerformance.transferSizeBytes)}가 확인되었습니다.`));
  }

  if (metadata.runtimePerformance.imageTransferSizeBytes > 1000000) {
    issues.push(issue(url, ISSUE_DEFS.imageTransferSize, `이미지 리소스 전송량이 ${formatBytes(metadata.runtimePerformance.imageTransferSizeBytes)}로 확인되었습니다.`));
  }

  if (!metadata.social.ogTitle || !metadata.social.ogDescription) {
    issues.push(issue(url, ISSUE_DEFS.openGraph, 'og:title 또는 og:description 메타 정보가 확인되지 않았습니다.'));
  }

  if (!hasPricingInfo(text)) {
    issues.push(issue(url, ISSUE_DEFS.pricing, '가격, 비용, 예산, 견적 기준 또는 견적 안내가 확인되지 않았습니다.'));
  }

  if (!hasProcessInfo(text)) {
    issues.push(issue(url, ISSUE_DEFS.process, '상담, 구매, 납품, 서비스 진행 절차 설명이 명확하게 확인되지 않았습니다.'));
  }

  if (!hasComparisonInfo(text)) {
    issues.push(issue(url, ISSUE_DEFS.comparison, '비교, 대안, 장단점, 선택 기준 콘텐츠가 확인되지 않았습니다.'));
  }

  if (!hasDifferentiationProof(text)) {
    issues.push(issue(url, ISSUE_DEFS.differentiation, '사례, 수치, 인증, 포트폴리오, 고객 근거 등 구체적인 차별점 근거가 확인되지 않았습니다.'));
  }

  const scores = scoreIssues(issues);

  return {
    url,
    industry,
    goal,
    metadata,
    scores,
    issues,
    summary: buildSummary(scores, issues)
  };
}

function issue(url, definition, evidence) {
  return {
    ...definition,
    targetUrl: url,
    evidence,
    recommendedAction: recommendationFor(definition.name),
    consultationCta: '이 작업 범위 상담 요청'
  };
}

function recommendationFor(name) {
  const map = {
    '메타 설명 누락': '페이지 주제와 맞는 80~160자 수준의 명확한 요약 문구를 작성합니다.',
    'H1 제목 누락': '페이지 주제를 명확히 나타내는 H1 제목을 1개 추가합니다.',
    'meta description 길이 점검 필요': '검색 결과 요약으로 쓰기 쉬운 50~160자 수준의 설명으로 정리합니다.',
    'FAQ 섹션 부족': '고객이 실제로 묻는 질문 5~7개와 각 질문에 대한 2~4문장 답변을 추가합니다.',
    '질문형 콘텐츠 직접 답변 부족': '질문형 H2/H3 아래에 2~4문장의 직접 답변을 먼저 배치하고, 이후 상세 설명이나 목록을 이어붙입니다.',
    'FAQ 구조화 데이터 보강 필요': '실제 FAQ 콘텐츠가 있는 페이지에는 FAQPage schema 적용 가능성을 검토합니다.',
    '신뢰 근거 페이지 부족': '회사소개, 연락처, 개인정보처리방침, 사례, 후기, 인증 등 신뢰 근거 페이지를 추가하거나 노출합니다.',
    '브랜드 엔티티 설명 부족': '회사명, 서비스명, 업종, 대상 고객, 제공 가치를 한 문장으로 명확히 설명하고 Organization schema와 연결합니다.',
    '인용 가능한 핵심 문장 부족': 'AI가 답변 재료로 활용하기 쉬운 정의형 문장, 수치, 기준, 수행 이력, 인증 근거를 본문에 추가합니다.',
    '외부 신뢰 출처 링크 부족': '공식 문서, 협회, 인증기관, 플랫폼 가이드 등 신뢰할 수 있는 외부 출처 링크를 필요한 위치에 보강합니다.',
    '주요 상담 CTA 부족': '문의, 상담, 견적, 전화, 구매 등 주요 전환 버튼을 명확히 배치합니다.',
    'canonical 링크 누락': '대표 URL이 명확한 페이지에는 canonical 링크 적용을 검토합니다.',
    'canonical 외부 도메인 참조': '의도한 중복 정리가 아니라면 canonical이 현재 사이트의 대표 URL을 가리키도록 수정합니다.',
    'robots noindex 설정 확인 필요': '공개 검색 유입이 필요한 페이지라면 meta robots의 noindex 설정을 제거하거나 예외 의도를 확인합니다.',
    '구조화 데이터 적용 필요': 'Organization, LocalBusiness, FAQ, Product, Service schema 적용 가능성을 검토합니다.',
    '페이지 주제가 지나치게 일반적임': 'title, H1, 첫 문단을 서비스, 제품, 업종, 지역, 대상 고객 중심으로 구체화합니다.',
    '이미지 대체텍스트 누락': '의미 있는 이미지에는 설명형 alt를, 장식 이미지는 빈 alt를 적용합니다.',
    '이미지 크기 속성 누락': '레이아웃 안정성과 성능 진단을 위해 주요 이미지에 width와 height 또는 CSS 기준 크기를 지정합니다.',
    '가격 또는 견적 기준 부족': '문의 전 불확실성을 줄이기 위해 가격, 예산 범위, 견적 기준 또는 견적 안내를 추가합니다.',
    '서비스 절차 설명 부족': '상담, 구매, 납품, 서비스 진행 절차를 단계별로 설명합니다.',
    '비교 콘텐츠 부족': '비교, 대안, 선택 기준, 장단점 등 구매 의사결정에 필요한 콘텐츠를 추가합니다.',
    '차별점 근거 부족': '사례, 수치, 인증, 포트폴리오, 고객 로고, 후기 등 구체적인 신뢰 근거를 추가합니다.',
    'title 태그 품질 점검 필요': '검색 결과와 브라우저 탭에서 페이지 주제가 드러나도록 브랜드명, 서비스명, 지역 또는 대상 고객을 포함해 title을 정리합니다.',
    '모바일 viewport 누락': '모바일 진단과 기본 반응형 표시를 위해 head에 viewport meta 태그를 추가합니다.',
    'HTML lang 속성 누락': '검색엔진과 보조기기가 언어를 이해할 수 있도록 html 태그에 lang 속성을 지정합니다.',
    '제목 구조 보강 필요': 'H1은 페이지당 1개로 정리하고, 핵심 섹션은 H2/H3 제목으로 나누어 검색엔진과 사용자가 구조를 이해하기 쉽게 만듭니다.',
    'heading 계층 순서 점검 필요': 'H1 아래에는 H2, H2 아래에는 H3처럼 제목 계층을 순서대로 정리합니다.',
    '본문 정보량 부족': '첫 화면 이후에 대상 고객, 제공 서비스, 절차, 사례, FAQ 등 판단에 필요한 본문 정보를 보강합니다.',
    'OG 메타 정보 부족': '공유 미리보기와 브랜드 이해도를 위해 og:title, og:description, og:image 적용을 검토합니다.',
    '연락 수단 노출 부족': '전화, 이메일, 문의 폼, 카카오/채널톡 등 고객이 즉시 선택할 수 있는 연락 수단을 명확히 노출합니다.',
    '링크 앵커 텍스트 부족': '빈 링크나 의미 없는 링크에는 목적을 알 수 있는 텍스트, aria-label 또는 title을 추가합니다.',
    'JSON-LD 형식 오류': 'JSON-LD 문법을 검증하고 파싱 가능한 schema 구조로 수정합니다.',
    '렌더 차단 리소스 점검 필요': '초기 화면에 꼭 필요하지 않은 CSS는 분리하고 critical CSS, preload, media 속성 적용 가능성을 검토합니다.',
    '동기 스크립트 과다': '초기 렌더링에 필요하지 않은 스크립트에는 defer 또는 async 적용을 검토합니다.',
    '이미지 lazy loading 검토 필요': '첫 화면 밖 이미지에는 loading="lazy"를 적용하고 핵심 이미지는 우선순위 로딩 전략을 분리합니다.',
    'LCP 개선 필요': '첫 화면의 핵심 이미지, 웹폰트, 서버 응답, 렌더 차단 리소스를 함께 점검해 LCP 요소가 더 빨리 표시되도록 개선합니다.',
    'CLS 개선 필요': '이미지와 광고/임베드 영역의 고정 크기를 지정하고 동적 콘텐츠 삽입으로 레이아웃이 밀리지 않도록 조정합니다.',
    'Total Blocking Time 개선 필요': '초기 실행 JavaScript를 분할하고 불필요한 서드파티 스크립트와 긴 메인스레드 작업을 줄입니다.',
    '페이지 전송량 과다': '불필요한 JS/CSS, 중복 라이브러리, 대용량 리소스를 줄이고 압축/캐시 전략을 점검합니다.',
    '이미지 전송량 과다': '주요 이미지를 WebP/AVIF 등 적절한 포맷과 크기로 최적화하고 반응형 이미지 srcset 적용을 검토합니다.',
    '폼 입력 라벨 누락': '입력 필드마다 명확한 label을 연결하거나 aria-label/aria-labelledby로 목적을 제공합니다.',
    '버튼 접근성 이름 누락': '아이콘 또는 빈 버튼에는 보조기기가 읽을 수 있는 텍스트, aria-label 또는 title을 추가합니다.',
    'HTTPS 혼합 콘텐츠 발견': 'HTTPS 페이지에서 불러오는 http:// 리소스와 링크를 https:// 주소로 교체합니다.',
    '문자 인코딩 선언 누락': 'head 영역에 <meta charset="utf-8"> 선언을 추가해 문자 해석 오류 가능성을 줄입니다.',
    '중복 id 속성 발견': '동일 id를 사용하는 요소를 고유한 id로 분리하고 label, anchor, script 참조를 함께 갱신합니다.',
    '안전하지 않은 폼 전송 주소': 'HTTPS 페이지의 form action은 https:// 주소 또는 same-origin 상대 경로로 전송되도록 수정합니다.',
    'iframe title 누락': '지도, 영상, 예약 위젯 등 iframe에는 내용을 설명하는 title 속성을 추가합니다.',
    'canonical 중복 선언': '페이지당 canonical은 1개만 남기고 대표 URL 기준을 명확히 정리합니다.',
    'robots nofollow 설정 확인 필요': '공개 검색 유입이 필요한 페이지라면 nofollow 의도를 확인하고 불필요한 경우 제거합니다.',
    'hreflang x-default 누락': '다국어 alternate를 쓰는 페이지에는 기본 대체 URL을 x-default로 함께 지정합니다.',
    '서드파티 스크립트 점검 필요': '태그 매니저, 광고, 추적 스크립트의 필요성과 로딩 방식을 점검하고 초기 렌더링에 불필요한 항목은 지연합니다.'
  };

  return map[name] ?? 'Review this issue during consultation.';
}

function hasMetaDescription(html) {
  return extractMetaContent(html, 'description').length >= 20;
}

function hasFaq(html, text) {
  return /id=["']faq["']|class=["'][^"']*faq|<h[2-3][^>]*>[^<]*(how|what|why|when|where|who|which|can|does|is)\b/i.test(html) ||
    /\bfaq\b|frequently asked|자주 묻는|질문/i.test(text);
}

function hasTrustSource(html, text) {
  return /href=["'][^"']*(about|contact|privacy|terms|case|review|portfolio)/i.test(html) ||
    /\b(about|contact|privacy|terms|case study|reviews|portfolio)\b/i.test(text);
}

function hasCta(text) {
  return /\b(request consultation|consultation|inquiry|estimate|contact|call|purchase|buy|문의|상담|견적|구매|전화)\b/i.test(text);
}

function hasContactChannel(html, text) {
  return /href=["'](?:tel:|mailto:)/i.test(html) ||
    /<form\b/i.test(html) ||
    /\b(email|e-mail|phone|tel|kakao|channel talk|naver talk|이메일|메일|전화|카카오|톡상담|채널톡|문의폼|상담폼)\b/i.test(text) ||
    /\b0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}\b/.test(text);
}

function hasGenericTopic(html, text) {
  const title = firstMatch(html, /<title[^>]*>([^<]*)<\/title>/i);
  const h1 = firstMatch(html, /<h1[^>]*>([^<]*)<\/h1>/i);
  const combined = `${title} ${h1}`.trim().toLowerCase();
  const generic = /^(welcome|home|main|company|service|services|about|홈|메인|환영합니다)\b/i.test(combined);
  const lacksSpecificTerm = !/\b(seo|b2b|manufacturing|academy|hospital|clinic|law|commerce|shop|consulting|software|marketing|제조|학원|병원|법률|쇼핑몰|컨설팅|마케팅)\b/i.test(text);

  return generic && lacksSpecificTerm;
}

function hasImageWithoutAlt(html) {
  const images = findTags(html, 'img');
  return images.some((tag) => {
    const value = attr(tag, 'alt');
    return value === undefined || !String(value).trim();
  });
}

function hasTitleQuality(title) {
  const value = String(title || '').trim();
  if (value.length < 10 || value.length > 70) return false;
  return !/^(home|main|welcome|company|service|services|홈|메인|회사|서비스)$/i.test(value);
}

function hasMetaDescriptionQuality(metaDescription) {
  const value = String(metaDescription || '').trim();
  return value.length >= 50 && value.length <= 160;
}

function hasExternalCanonical(url, canonical) {
  try {
    const page = new URL(url);
    const target = new URL(canonical, page);
    return page.hostname !== target.hostname;
  } catch {
    return false;
  }
}

function hasWeakHeadingStructure(metadata) {
  if (metadata.headingStats.h1Count !== 1) return true;
  return metadata.wordCount >= 80 && metadata.headingStats.h2Count === 0;
}

function hasPricingInfo(text) {
  return /\b(price|pricing|cost|budget|estimate|quote|fee|plan|package|가격|비용|예산|견적|요금|패키지)\b/i.test(text);
}

function hasProcessInfo(text) {
  return /\b(process|step|procedure|how it works|consultation process|delivery|timeline|절차|과정|진행|단계|상담 절차|일정)\b/i.test(text);
}

function hasComparisonInfo(text) {
  return /\b(compare|comparison|alternative|versus|vs\.?|pros|cons|choose|selection|비교|대안|장점|단점|선택 기준)\b/i.test(text);
}

function hasDifferentiationProof(text) {
  return /\b(case|case study|portfolio|review|testimonial|certification|award|client|metric|years|인증|사례|후기|포트폴리오|고객사|수치|경력)\b/i.test(text);
}

function answerReadinessFor(html, schemaTypes) {
  const questionBlocks = questionHeadingBlocks(html);
  const directAnswerCount = questionBlocks.filter((block) => hasDirectAnswer(block.followingHtml)).length;
  return {
    questionHeadingCount: questionBlocks.length,
    directAnswerCount,
    hasFaqSchema: schemaTypes.includes('FAQPage')
  };
}

function questionHeadingBlocks(html) {
  const matches = [...html.matchAll(/<h([2-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi)];
  const blocks = [];
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const headingText = cleanText(match[2]);
    if (!isQuestionHeading(headingText)) continue;
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? html.length;
    blocks.push({ headingText, followingHtml: html.slice(start, end) });
  }
  return blocks;
}

function isQuestionHeading(value) {
  return /\?|how|what|why|when|where|who|which|can|does|is|비용|가격|얼마|어떻게|무엇|왜|언제|가능|절차|방법|인가요|되나요|하나요|나요/i.test(value);
}

function hasDirectAnswer(html) {
  const paragraph = firstMatch(html, /<p\b[^>]*>([\s\S]*?)<\/p>/i);
  const text = cleanText(paragraph);
  if (text.length < 45) return false;
  if (/문의\s*주세요|상담\s*후\s*안내|준비\s*중/i.test(text)) return false;
  return true;
}

function geoReadinessFor({ html, text, schemaTypes, outgoingLinks, url, title, h1, metaDescription }) {
  return {
    entitySignals: entitySignalsFor({ html, text, schemaTypes, title, h1, metaDescription }),
    citationLikeSentenceCount: citationLikeSentences(text).length,
    externalTrustLinkCount: externalTrustLinks(outgoingLinks, url).length
  };
}

function entitySignalsFor({ html, text, schemaTypes, title, h1, metaDescription }) {
  const hasOrganizationSchema = schemaTypes.some((type) => ['Organization', 'LocalBusiness', 'Corporation', 'ProfessionalService'].includes(type));
  return {
    hasOrganizationSchema,
    hasSameAs: /"sameAs"\s*:/i.test(html),
    hasEntityIntro: hasEntityIntro(`${title}. ${h1}. ${metaDescription}. ${text}`)
  };
}

function hasEntityIntro(text) {
  return /([A-Za-z가-힣0-9]+)(은|는)\s+.{6,80}(제공|지원|운영|전문|서비스|플랫폼|기업|브랜드)/i.test(text);
}

function citationLikeSentences(text) {
  const sentences = String(text || '').split(/[.!?。！？\n]/).map((item) => item.trim()).filter(Boolean);
  return sentences.filter((sentence) => {
    if (sentence.length < 25 || sentence.length > 180) return false;
    return /\d+\s*(년|개|건|%|명|회|개월|원)|이상|이하|기준|인증|수상|특허|수행|고객사|공식|협회/i.test(sentence);
  });
}

function externalTrustLinks(outgoingLinks, pageUrl) {
  const page = new URL(pageUrl);
  return outgoingLinks.filter((link) => {
    try {
      const parsed = new URL(link);
      if (parsed.hostname === page.hostname) return false;
      return /google|naver|schema\.org|w3\.org|gov|go\.kr|or\.kr|ac\.kr|association|foundation|iso|developers/i.test(parsed.hostname + parsed.pathname);
    } catch {
      return false;
    }
  });
}

function extractMetadata(url, html, text, performance) {
  const title = cleanText(firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i));
  const h1 = cleanText(firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i));
  const metaDescription = cleanText(extractMetaContent(html, 'description'));
  const canonicalLinks = canonicalLinksFor(html);
  const canonical = cleanText(canonicalLinks[0]?.href || '');
  const schemaTypes = extractSchemaTypes(html);
  const schemaValidation = validateJsonLd(html);
  const outgoingLinks = extractOutgoingLinks(html, url);
  const imageStats = imageStatsFor(html);
  const headingStats = headingStatsFor(html);
  const linkStats = linkStatsFor(html, url);
  const social = socialMetadataFor(html);
  const internationalization = internationalizationFor(html);
  const thirdPartyScripts = thirdPartyScriptsFor(html, url);
  const technicalBasics = technicalBasicsFor(url, html, schemaValidation.invalidCount, canonicalLinks);
  const answerReadiness = answerReadinessFor(html, schemaTypes);
  const geoReadiness = geoReadinessFor({ html, text, schemaTypes, outgoingLinks, url, title, h1, metaDescription });
  const performanceStats = performanceStatsFor(html);
  const runtimePerformance = runtimePerformanceFor(performance);
  const formStats = formStatsFor(html);
  const accessibilityStats = accessibilityStatsFor(html);

  return {
    title,
    metaDescription,
    h1,
    canonical,
    pageType: classifyPageType(url, `${title} ${h1} ${text}`),
    businessCategory: inferBusinessCategory(`${title} ${h1} ${metaDescription} ${text}`),
    schemaTypes,
    outgoingLinks,
    linkStats,
    imageStats,
    headingStats,
    social,
    internationalization,
    thirdPartyScripts,
    technicalBasics,
    answerReadiness,
    geoReadiness,
    performanceStats,
    runtimePerformance,
    wordCount: wordCountFor(text),
    contactSignals: contactSignalsFor(html, text),
    formStats,
    accessibilityStats
  };
}

function extractMetaContent(html, name) {
  const tags = findTags(html, 'meta');
  for (const tag of tags) {
    const tagName = attr(tag, 'name') || attr(tag, 'property');
    if (String(tagName || '').toLowerCase() === name.toLowerCase()) {
      return attr(tag, 'content') || '';
    }
  }
  return '';
}

function canonicalLinksFor(html) {
  return findTags(html, 'link')
    .filter((tag) => relTokensFor(tag).includes('canonical'))
    .map((tag) => ({
      href: attr(tag, 'href') || ''
    }))
    .filter((item) => item.href);
}

function extractCanonicalHref(html) {
  return canonicalLinksFor(html)[0]?.href || '';
}

function internationalizationFor(html) {
  const tags = findTags(html, 'link');
  const alternates = tags
    .filter((tag) => relTokensFor(tag).includes('alternate') && attr(tag, 'hreflang'))
    .map((tag) => ({
      hreflang: String(attr(tag, 'hreflang') || '').toLowerCase(),
      href: attr(tag, 'href') || ''
    }));

  return {
    hreflangCount: alternates.length,
    hreflangs: [...new Set(alternates.map((item) => item.hreflang).filter(Boolean))],
    missingXDefault: alternates.length > 0 && !alternates.some((item) => item.hreflang === 'x-default')
  };
}

function thirdPartyScriptsFor(html, baseUrl) {
  const hosts = new Set();
  const urls = [];
  let base;
  try {
    base = new URL(baseUrl);
  } catch {
    base = null;
  }

  for (const tag of findTags(html, 'script')) {
    const src = attr(tag, 'src');
    if (!src) continue;
    try {
      const parsed = new URL(src, base || undefined);
      if (!['http:', 'https:'].includes(parsed.protocol)) continue;
      if (base && parsed.hostname === base.hostname) continue;
      if (!base && !/^https?:\/\//i.test(src)) continue;
      hosts.add(parsed.hostname);
      urls.push(parsed.toString());
    } catch {
      // Ignore malformed script src values.
    }
  }

  return {
    count: urls.length,
    hosts: [...hosts].sort(),
    urls
  };
}

function relTokensFor(tag) {
  return String(attr(tag, 'rel') || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function extractSchemaTypes(html) {
  const types = new Set();
  const pattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    try {
      collectSchemaTypes(JSON.parse(match[1]), types);
    } catch {
      // Ignore invalid JSON-LD here; schema validation can be added as a deeper rule.
    }
  }
  return [...types];
}

function validateJsonLd(html) {
  const pattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let total = 0;
  let invalidCount = 0;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    total += 1;
    try {
      JSON.parse(match[1]);
    } catch {
      invalidCount += 1;
    }
  }
  return { total, invalidCount };
}

function collectSchemaTypes(value, types) {
  if (Array.isArray(value)) {
    for (const item of value) collectSchemaTypes(item, types);
    return;
  }
  if (!value || typeof value !== 'object') return;

  const type = value['@type'];
  if (Array.isArray(type)) {
    for (const item of type) types.add(String(item));
  } else if (type) {
    types.add(String(type));
  }

  for (const item of Object.values(value)) {
    if (item && typeof item === 'object') collectSchemaTypes(item, types);
  }
}

function extractOutgoingLinks(html, baseUrl) {
  const links = [];
  const pattern = /<a\b[^>]*href=["']([^"']+)["']/gi;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    try {
      const parsed = new URL(match[1], baseUrl);
      parsed.hash = '';
      if (['http:', 'https:'].includes(parsed.protocol)) {
        links.push(parsed.toString());
      }
    } catch {
      // Ignore malformed href values.
    }
  }
  return [...new Set(links)];
}

function imageStatsFor(html) {
  const images = findTags(html, 'img');
  const missingAlt = images.filter((tag) => {
    const value = attr(tag, 'alt');
    return value === undefined || !String(value).trim();
  }).length;
  const missingDimensions = images.filter((tag) => !attr(tag, 'width') || !attr(tag, 'height')).length;
  const lazyLoaded = images.filter((tag) => /^lazy$/i.test(String(attr(tag, 'loading') || ''))).length;
  return {
    total: images.length,
    missingAlt,
    missingDimensions,
    lazyLoaded
  };
}

function performanceStatsFor(html) {
  const stylesheetTags = findTags(html, 'link').filter((tag) => String(attr(tag, 'rel') || '').toLowerCase() === 'stylesheet');
  const scriptTags = findTags(html, 'script').filter((tag) => attr(tag, 'src'));
  const imageTags = findTags(html, 'img');

  const blockingStylesheets = stylesheetTags.filter((tag) => {
    const media = attr(tag, 'media');
    return !media || /^(all|screen)$/i.test(String(media).trim());
  }).length;

  const syncScripts = scriptTags.filter((tag) => (
    !/\basync\b/i.test(tag) &&
    !/\bdefer\b/i.test(tag) &&
    !/type=["']module["']/i.test(tag)
  )).length;

  const nonLazyImages = imageTags.filter((tag) => !/^lazy$/i.test(String(attr(tag, 'loading') || ''))).length;

  return {
    stylesheets: stylesheetTags.length,
    blockingStylesheets,
    scripts: scriptTags.length,
    syncScripts,
    images: imageTags.length,
    nonLazyImages
  };
}

function runtimePerformanceFor(performance = {}) {
  return {
    lcpMs: numberOrZero(performance.lcpMs),
    cls: numberOrZero(performance.cls),
    totalBlockingTimeMs: numberOrZero(performance.totalBlockingTimeMs),
    transferSizeBytes: numberOrZero(performance.transferSizeBytes),
    resourceCount: numberOrZero(performance.resourceCount),
    imageTransferSizeBytes: numberOrZero(performance.imageTransferSizeBytes)
  };
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}MB`;
  if (value >= 1000) return `${Math.round(value / 1000)}KB`;
  return `${value}B`;
}

function headingStatsFor(html) {
  const counts = {};
  for (let level = 1; level <= 6; level += 1) {
    counts[`h${level}Count`] = (html.match(new RegExp(`<h${level}\\b`, 'gi')) || []).length;
  }
  counts.hasSkippedLevel = hasSkippedHeadingLevel(html);
  return counts;
}

function hasSkippedHeadingLevel(html) {
  const headings = [...html.matchAll(/<h([1-6])\b/gi)].map((match) => Number(match[1]));
  let previous = 0;
  for (const level of headings) {
    if (previous && level > previous + 1) return true;
    previous = level;
  }
  return false;
}

function linkStatsFor(html, baseUrl) {
  const base = new URL(baseUrl);
  const stats = {
    total: 0,
    internal: 0,
    external: 0,
    emptyAnchorCount: 0
  };
  const pattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    const openTag = `<a ${match[1]}>`;
    const href = attr(openTag, 'href');
    if (!href) continue;
    try {
      const parsed = new URL(href, base);
      if (!['http:', 'https:'].includes(parsed.protocol)) continue;
      stats.total += 1;
      if (parsed.hostname === base.hostname) stats.internal += 1;
      else stats.external += 1;
      const anchorText = cleanText(match[2]);
      if (!anchorText && !attr(openTag, 'aria-label') && !attr(openTag, 'title')) {
        stats.emptyAnchorCount += 1;
      }
    } catch {
      // Ignore malformed href values.
    }
  }
  return stats;
}

function socialMetadataFor(html) {
  return {
    ogTitle: cleanText(extractMetaContent(html, 'og:title')),
    ogDescription: cleanText(extractMetaContent(html, 'og:description')),
    ogImage: cleanText(extractMetaContent(html, 'og:image')),
    twitterCard: cleanText(extractMetaContent(html, 'twitter:card'))
  };
}

function technicalBasicsFor(url, html, invalidJsonLdCount, canonicalLinks = []) {
  const htmlTag = findTags(html, 'html')[0] || '';
  const charset = charsetFor(html);
  const robots = cleanText(extractMetaContent(html, 'robots'));
  return {
    hasLang: Boolean(attr(htmlTag, 'lang')),
    hasViewport: Boolean(extractMetaContent(html, 'viewport')),
    charset,
    hasCharset: Boolean(charset),
    robots,
    hasRobotsNofollow: /(?:^|,|\s)nofollow(?:$|,|\s)/i.test(robots),
    canonicalCount: canonicalLinks.length,
    invalidJsonLdCount,
    mixedContentCount: mixedContentCountFor(url, html)
  };
}

function charsetFor(html) {
  const tags = findTags(html, 'meta');
  for (const tag of tags) {
    const value = attr(tag, 'charset');
    if (value !== undefined) return cleanText(value);
  }
  return '';
}

function wordCountFor(text) {
  const words = String(text || '').match(/[가-힣A-Za-z0-9]+/g) || [];
  return words.length;
}

function contactSignalsFor(html, text) {
  return {
    hasTelLink: /href=["']tel:/i.test(html),
    hasMailLink: /href=["']mailto:/i.test(html),
    hasPhoneText: /\b0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}\b/.test(text),
    hasMessenger: /\b(kakao|channel talk|naver talk|카카오|톡상담|채널톡)\b/i.test(text)
  };
}

function formStatsFor(html) {
  const controls = formControlsFor(html);
  return {
    forms: (html.match(/<form\b/gi) || []).length,
    inputs: (html.match(/<(input|textarea|select)\b/gi) || []).length,
    controls: controls.length,
    unlabeledControls: controls.filter((tag) => !hasAccessibleControlLabel(html, tag)).length,
    insecureActionCount: insecureFormActionCountFor(html)
  };
}

function accessibilityStatsFor(html) {
  const buttonTags = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/gi) || [];
  const inputButtons = (html.match(/<input\b[^>]*>/gi) || [])
    .filter((tag) => /type=["']?(button|submit|reset|image)\b/i.test(tag));
  return {
    duplicateIdCount: duplicateIdCountFor(html),
    iframeWithoutTitleCount: iframeWithoutTitleCountFor(html),
    emptyButtonCount: [
      ...buttonTags.filter((tag) => !hasButtonName(tag)),
      ...inputButtons.filter((tag) => !attr(tag, 'value') && !attr(tag, 'aria-label') && !attr(tag, 'title'))
    ].length
  };
}

function insecureFormActionCountFor(html) {
  const forms = html.match(/<form\b[^>]*>/gi) || [];
  return forms.filter((tag) => /^http:\/\//i.test(String(attr(tag, 'action') || ''))).length;
}

function duplicateIdCountFor(html) {
  const ids = (html.match(/\bid=["'][^"']+["']/gi) || [])
    .map((item) => item.replace(/^\s*id=["']|["']$/gi, '').trim())
    .filter(Boolean);
  const seen = new Set();
  const duplicates = new Set();
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return duplicates.size;
}

function iframeWithoutTitleCountFor(html) {
  const iframes = html.match(/<iframe\b[^>]*>/gi) || [];
  return iframes.filter((tag) => !attr(tag, 'title') && !attr(tag, 'aria-label')).length;
}

function formControlsFor(html) {
  return (html.match(/<(input|textarea|select)\b[^>]*>/gi) || [])
    .filter((tag) => {
      const type = String(attr(tag, 'type') || '').toLowerCase();
      return !['hidden', 'button', 'submit', 'reset', 'image'].includes(type);
    });
}

function hasAccessibleControlLabel(html, tag) {
  if (attr(tag, 'aria-label') || attr(tag, 'aria-labelledby') || attr(tag, 'title')) return true;
  const id = attr(tag, 'id');
  if (id && new RegExp(`<label\\b[^>]*\\bfor=["']${escapeRegExp(id)}["']`, 'i').test(html)) return true;
  return false;
}

function hasButtonName(tag) {
  const text = cleanText(tag);
  return Boolean(text || attr(tag, 'aria-label') || attr(tag, 'aria-labelledby') || attr(tag, 'title'));
}

function mixedContentCountFor(url, html) {
  try {
    if (new URL(url).protocol !== 'https:') return 0;
  } catch {
    return 0;
  }
  const tags = html.match(/<(script|link|img|iframe|source|video|audio|a)\b[^>]*(src|href)=["']http:\/\/[^"']+["'][^>]*>/gi) || [];
  return tags.length;
}

function classifyPageType(url, searchableText) {
  const parsed = new URL(url);
  const source = `${parsed.pathname} ${searchableText}`.toLowerCase();

  if (parsed.pathname === '/' || /\/index\.(html?|php)?$/i.test(parsed.pathname)) return 'home';
  if (/privacy|terms|policy|약관|개인정보/.test(source)) return 'legal';
  if (/portfolio|case|work|사례|포트폴리오/.test(source)) return 'portfolio';
  if (/blog|news|article|insight|칼럼|뉴스|블로그/.test(source)) return 'article';
  if (/product|shop|item|상품|제품/.test(source)) return 'product';
  if (/service|solution|consulting|서비스|솔루션|컨설팅/.test(source)) return 'service';
  if (/contact|inquiry|estimate|문의|상담|견적/.test(source)) return 'contact';
  return 'general';
}

function inferBusinessCategory(searchableText) {
  const source = String(searchableText || '').toLowerCase();
  const categories = [
    category('healthcare', '병원/의료', ['병원', '의원', '클리닉', '피부과', '성형외과', '치과', '한의원', '진료', '의료', 'clinic', 'hospital', 'medical']),
    category('legal', '법률/전문자문', ['법률', '변호사', '법무법인', '소송', '상담', 'law', 'legal', 'attorney']),
    category('education', '교육/학원', ['학원', '교육', '강의', '수강', '입시', '과외', 'academy', 'education', 'course']),
    category('commerce', '쇼핑몰/커머스', ['쇼핑몰', '상품', '장바구니', '구매', '배송', '리뷰', '커머스', 'shop', 'store', 'product', 'cart']),
    category('manufacturing', '제조/산업', ['제조', '공장', '설비', '부품', '소재', '납품', '산업', 'manufacturing', 'factory', 'industrial']),
    category('software', 'IT/소프트웨어', ['소프트웨어', '솔루션', '앱개발', '웹개발', '시스템', '플랫폼', 'software', 'saas', 'platform', 'development']),
    category('finance', '금융/보험', ['금융', '보험', '대출', '투자', '자산', '카드', 'finance', 'insurance', 'loan', 'investment']),
    category('real-estate', '부동산/건설', ['부동산', '분양', '임대', '건설', '인테리어', '시공', 'real estate', 'construction']),
    category('food', '식음료/외식', ['음식점', '레스토랑', '카페', '메뉴', '예약', '맛집', '식품', 'restaurant', 'cafe', 'food']),
    category('beauty', '뷰티/미용', ['미용', '뷰티', '헤어', '네일', '스파', '화장품', 'beauty', 'salon', 'cosmetic']),
    category('travel', '여행/숙박', ['호텔', '숙박', '여행', '투어', '펜션', '리조트', 'hotel', 'travel', 'tour']),
    category('media', '콘텐츠/미디어', ['콘텐츠', '미디어', '뉴스', '매거진', '방송', '영상', 'media', 'content', 'news']),
    category('public', '공공/비영리', ['공공', '기관', '협회', '재단', '비영리', 'government', 'foundation', 'association']),
    category('b2b-service', 'B2B 서비스', ['b2b', '컨설팅', '대행', '마케팅', '영업', '운영', 'consulting', 'agency', 'marketing']),
    category('general-company', '일반 기업', ['회사소개', '기업', '브랜드', '사업', 'company', 'business', 'brand'])
  ];

  const scored = categories
    .map((item) => ({
      ...item,
      confidence: item.keywords.reduce((score, keyword) => score + countOccurrences(source, keyword.toLowerCase()), 0)
    }))
    .filter((item) => item.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence);

  if (!scored.length) {
    return { id: 'unknown', label: '업종 미분류', confidence: 0 };
  }

  const best = scored[0];
  return { id: best.id, label: best.label, confidence: best.confidence };
}

function category(id, label, keywords) {
  return { id, label, keywords };
}

function countOccurrences(source, keyword) {
  if (!keyword) return 0;
  return source.split(keyword).length - 1;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanText(value) {
  return stripTags(String(value || ''))
    .replace(/\s+/g, ' ')
    .trim();
}

function firstMatch(text, pattern) {
  return pattern.exec(text)?.[1] || '';
}

function stripTags(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreIssues(issues) {
  const base = {
    'technical-seo': 100,
    'search-understanding': 100,
    aeo: 100,
    geo: 100,
    conversion: 100
  };

  for (const item of issues) {
    const penalty = item.impact === 'high' ? 22 : item.impact === 'medium' ? 12 : 6;
    base[item.layer] = Math.max(0, (base[item.layer] ?? 100) - penalty);
  }

  const overall = Math.round(Object.values(base).reduce((sum, value) => sum + value, 0) / Object.keys(base).length);
  return { ...base, overall };
}

function buildSummary(scores, issues) {
  const top = issues.slice(0, 3).map((item) => item.name).join(', ');
  if (!issues.length) {
    return '이 페이지는 검색이해도, AI 검색준비도, 전환 구조 검토에 필요한 기본 구조를 갖추고 있습니다.';
  }

  return `총 ${issues.length}개의 개선 가능 항목이 확인되었습니다. 우선 검토 영역: ${top}. 종합 준비도 점수: ${scores.overall}.`;
}
