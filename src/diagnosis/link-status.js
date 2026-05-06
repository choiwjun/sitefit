import { validateCrawlUrl } from '../security/url-policy.js';

const ISSUE_DEFS = {
  brokenLink: {
    layer: 'technical-seo',
    name: '깨진 링크 발견',
    impact: 'high',
    difficulty: 'normal',
    confidence: 'high',
    owner: 'developer',
    workType: 'technical-seo',
    expectedScope: 'small',
    recommendedAction: '404 또는 접근 불가 링크를 실제 존재하는 URL로 교체하거나 내부 링크에서 제거합니다.'
  },
  serverError: {
    layer: 'technical-seo',
    name: '링크 대상 서버 오류',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'high',
    owner: 'developer',
    workType: 'technical-seo',
    expectedScope: 'small',
    recommendedAction: '5xx 응답이 발생하는 링크 대상 서버나 페이지 상태를 확인하고 정상 응답으로 복구합니다.'
  },
  redirectedLink: {
    layer: 'technical-seo',
    name: '리다이렉트 링크 발견',
    impact: 'low',
    difficulty: 'easy',
    confidence: 'high',
    owner: 'publisher',
    workType: 'technical-seo',
    expectedScope: 'small',
    recommendedAction: '리다이렉트를 거치는 링크는 가능하면 최종 도착 URL로 직접 연결합니다.'
  },
  redirectChain: {
    layer: 'technical-seo',
    name: '리다이렉트 체인 과다',
    impact: 'medium',
    difficulty: 'normal',
    confidence: 'high',
    owner: 'developer',
    workType: 'technical-seo',
    expectedScope: 'small',
    recommendedAction: '여러 단계를 거치는 리다이렉트 링크를 최종 URL로 바로 연결하거나 중간 리다이렉트를 정리합니다.'
  }
};

export async function analyzeLinkStatus({ rootUrl, pageResults = [], fetcher, maxLinks = 50 } = {}) {
  const links = uniqueLinks(pageResults).slice(0, maxLinks);
  const checkedLinks = [];
  const skippedLinks = [];
  const broken = [];
  const serverErrors = [];
  const redirects = [];
  const redirectChains = [];

  const results = await Promise.all(links.map(async (link) => {
    const validation = validateCrawlUrl(link);
    if (!validation.ok) {
      return { type: 'skipped', item: { url: link, reason: validation.reason } };
    }

    try {
      const result = await checkLink(validation.url, fetcher);
      return { type: 'checked', item: result };
    } catch (error) {
      return { type: 'checked', item: { url: validation.url, status: 0, error: error.message } };
    }
  }));

  for (const result of results) {
    if (result.type === 'skipped') {
      skippedLinks.push(result.item);
      continue;
    }

    const item = result.item;
    checkedLinks.push(item);
    if (item.status === 0 || (item.status >= 400 && item.status < 500)) {
      broken.push(item);
    } else if (item.status >= 500) {
      serverErrors.push(item);
    } else if (isRedirect(item)) {
      redirects.push(item);
    }
    if (hasRedirectChain(item)) {
      redirectChains.push(item);
    }
  }

  return {
    rootUrl,
    checkedLinks,
    skippedLinks,
    issues: [
      ...groupIssue(broken, ISSUE_DEFS.brokenLink, '4xx 또는 접근 실패 링크'),
      ...groupIssue(serverErrors, ISSUE_DEFS.serverError, '5xx 서버 오류 링크'),
      ...groupIssue(redirectChains, ISSUE_DEFS.redirectChain, '2회 이상 리다이렉트되는 링크'),
      ...groupIssue(redirects, ISSUE_DEFS.redirectedLink, '리다이렉트되는 링크')
    ]
  };
}

function uniqueLinks(pageResults) {
  const links = new Set();
  for (const result of pageResults) {
    for (const link of result.metadata?.outgoingLinks || []) {
      links.add(link);
    }
  }
  return [...links];
}

async function checkLink(url, fetcher) {
  const result = fetcher ? await fetcher(url) : await defaultStatusFetch(url);
  return {
    url,
    finalUrl: result.url || url,
    status: Number(result.status || 0),
    redirectCount: Number(result.redirectCount || 0),
    redirectChain: Array.isArray(result.redirectChain) ? result.redirectChain : []
  };
}

function isRedirect(result) {
  if ([301, 302, 303, 307, 308].includes(result.status)) return true;
  return Boolean(result.finalUrl && normalizeUrl(result.finalUrl) !== normalizeUrl(result.url));
}

function hasRedirectChain(result) {
  return Number(result.redirectCount || 0) > 1 || (Array.isArray(result.redirectChain) && result.redirectChain.length > 2);
}

function groupIssue(items, definition, label) {
  if (!items.length) return [];
  const samples = items.slice(0, 10);
  return [
    {
      ...definition,
      targetUrl: samples[0].url,
      evidence: `${label}가 ${items.length}개 확인되었습니다. 대상: ${samples.map((item) => `${item.url} (${item.status || '실패'})`).join(', ')}`,
      consultationCta: '이 작업 범위 상담 요청'
    }
  ];
}

async function defaultStatusFetch(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    let response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'SiteFitBot/0.1 (+https://sitefit.local)'
      }
    });

    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'user-agent': 'SiteFitBot/0.1 (+https://sitefit.local)'
        }
      });
    }

    return { url: response.url, status: response.status };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeUrl(value) {
  try {
    const parsed = new URL(value);
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return String(value || '');
  }
}
