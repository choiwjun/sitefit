export async function analyzeSiteAssets(rootUrl, options = {}) {
  const root = new URL(rootUrl);
  const fetcher = options.fetcher ?? defaultFetchText;
  const robotsUrl = new URL('/robots.txt', root).toString();
  const sitemapUrl = new URL('/sitemap.xml', root).toString();
  const issues = [];
  let sitemapUrls = [];
  let sitemapIndexes = [];
  let robotsRules = { disallow: [] };

  const [robots, sitemap] = await Promise.all([
    safeFetch(fetcher, robotsUrl),
    safeFetch(fetcher, sitemapUrl)
  ]);

  if (robots.status >= 400) {
    issues.push(assetIssue(root.toString(), 'robots.txt 누락', '사이트 루트에서 robots.txt를 찾을 수 없습니다.', 'medium'));
  } else {
    robotsRules = parseRobotsRules(robots.text);
    if (robotsRules.disallow.includes('/')) {
      issues.push(assetIssue(root.toString(), 'robots.txt 전체 크롤링 차단', 'robots.txt에 Disallow: / 규칙이 포함되어 공개 페이지 수집이 막힐 수 있습니다.', 'high'));
    }
    if (!/^\s*sitemap:\s*\S+/im.test(robots.text)) {
      issues.push(assetIssue(root.toString(), 'robots.txt sitemap 참조 누락', 'robots.txt에 Sitemap 지시문이 포함되어 있지 않습니다.', 'low'));
    }
  }

  if (sitemap.status >= 400 || !/<(urlset|sitemapindex)\b/i.test(sitemap.text)) {
    issues.push(assetIssue(root.toString(), 'sitemap.xml 누락', 'sitemap.xml을 찾을 수 없거나 sitemap 문서 형식으로 보이지 않습니다.', 'medium'));
  } else if (/<sitemapindex\b/i.test(sitemap.text)) {
    sitemapIndexes = extractSameOriginLocs(sitemap.text, root);
    sitemapUrls = await collectUrlsFromSitemapIndex(fetcher, sitemapIndexes, root);
  } else {
    sitemapUrls = extractSameOriginLocs(sitemap.text, root);
  }

  return {
    rootUrl: root.toString(),
    checkedUrls: [robotsUrl, sitemapUrl],
    sitemapUrls,
    sitemapIndexes,
    robotsRules,
    issues
  };
}

export function parseRobotsRules(text) {
  const groups = [];
  let current = null;

  for (const rawLine of String(text || '').split(/\r?\n/)) {
    const line = rawLine.split('#')[0].trim();
    if (!line) continue;

    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();

    if (key === 'user-agent') {
      if (!current || current.hasRules) {
        current = { agents: [], disallow: [], hasRules: false };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      continue;
    }

    if (!current) continue;
    if (key === 'disallow') {
      current.hasRules = true;
      if (value) {
        current.disallow.push(value);
      }
    } else if (key === 'allow') {
      current.hasRules = true;
    }
  }

  const wildcardGroups = groups.filter((group) => group.agents.includes('*'));
  const disallow = wildcardGroups.flatMap((group) => group.disallow);
  return { disallow: [...new Set(disallow)] };
}

async function collectUrlsFromSitemapIndex(fetcher, sitemapIndexes, root) {
  const urls = [];
  for (const sitemapUrl of sitemapIndexes) {
    const child = await safeFetch(fetcher, sitemapUrl);
    if (child.status < 400 && /<urlset\b/i.test(child.text)) {
      urls.push(...extractSameOriginLocs(child.text, root));
    }
  }
  return [...new Set(urls)];
}

function extractSameOriginLocs(xml, root) {
  const urls = [];
  const pattern = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let match;

  while ((match = pattern.exec(xml)) !== null) {
    try {
      const parsed = new URL(match[1]);
      parsed.hash = '';
      if (parsed.origin === root.origin) {
        urls.push(parsed.toString());
      }
    } catch {
      // Ignore malformed sitemap entries.
    }
  }

  return [...new Set(urls)];
}

function assetIssue(targetUrl, name, evidence, impact) {
  return {
    layer: 'technical-seo',
    name,
    targetUrl,
    problemExplanation: evidence,
    evidence,
    impact,
    difficulty: 'easy',
    confidence: 'high',
    recommendedAction: recommendationFor(name),
    owner: 'developer',
    workType: 'technical-seo',
    expectedScope: 'small',
    consultationCta: '기술 SEO 작업 범위 상담 요청'
  };
}

function recommendationFor(name) {
  const map = {
    'robots.txt 누락': '사이트 루트에 robots.txt를 추가하고 크롤러 접근 규칙을 점검합니다.',
    'robots.txt 전체 크롤링 차단': '공개 페이지 수집이 막히지 않도록 robots.txt의 광범위한 차단 규칙을 검토합니다.',
    'robots.txt sitemap 참조 누락': '크롤러가 sitemap 위치를 발견할 수 있도록 robots.txt에 Sitemap 지시문을 추가합니다.',
    'sitemap.xml 누락': '중요 공개 페이지를 포함한 유효한 sitemap.xml 또는 sitemap index를 생성하거나 노출합니다.'
  };
  return map[name] || '이 기술 SEO 자산을 검토합니다.';
}

async function safeFetch(fetcher, url) {
  try {
    return await fetcher(url);
  } catch (error) {
    return { status: 599, text: '', error: error.message };
  }
}

async function defaultFetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'SiteFitBot/0.1 (+https://sitefit.local)'
    }
  });
  return {
    status: response.status,
    text: await response.text()
  };
}
