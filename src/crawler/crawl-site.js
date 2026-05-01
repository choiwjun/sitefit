import { validateCrawlUrl } from '../security/url-policy.js';
import { validateResolvedCrawlUrl } from '../security/resolved-url-policy.js';

const DEFAULT_MAX_PAGES = 10;

export async function crawlSite(rootUrl, options = {}) {
  const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;
  const maxBytes = options.maxBytes ?? 512_000;
  const maxDepth = options.maxDepth ?? 2;
  const maxQueryParams = options.maxQueryParams ?? 8;
  const disallowPaths = normalizeDisallowPaths(options.disallowPaths);
  const fetcher = options.fetcher ?? ((url) => defaultFetchPage(url, { maxBytes }));
  const renderer = options.renderer;
  const renderJavaScript = options.renderJavaScript ?? 'auto';
  const rootValidation = options.lookup
    ? await validateResolvedCrawlUrl(rootUrl, { lookup: options.lookup })
    : validateCrawlUrl(rootUrl);

  if (!rootValidation.ok) {
    return {
      rootUrl,
      pages: [],
      skipped: [],
      errors: [{ code: 'invalid_root_url', message: rootValidation.reason }]
    };
  }

  const root = new URL(rootValidation.url);
  const queue = [{ url: root.toString(), depth: 0 }];
  const seen = new Set();
  const pages = [];
  const skipped = [];
  const errors = [];

  for (const seedUrl of options.seedUrls || []) {
    try {
      const parsed = new URL(seedUrl, root);
      parsed.hash = '';
      if (parsed.origin !== root.origin) {
        skipped.push({ url: parsed.toString(), reason: 'external_seed' });
        continue;
      }
      if (isRobotsDisallowed(parsed, disallowPaths)) {
        skipped.push({ url: parsed.toString(), reason: 'robots_disallow' });
        continue;
      }
      if (exceedsQueryLimit(parsed, maxQueryParams)) {
        skipped.push({ url: parsed.toString(), reason: 'query_limit' });
        continue;
      }
      if (parsed.toString() !== root.toString()) {
        queue.push({ url: parsed.toString(), depth: 1 });
      }
    } catch {
      skipped.push({ url: String(seedUrl), reason: 'invalid_seed' });
    }
  }

  while (queue.length && pages.length < maxPages) {
    const next = queue.shift();
    const nextUrl = next.url;
    if (seen.has(nextUrl)) continue;
    seen.add(nextUrl);

    if (isRobotsDisallowed(new URL(nextUrl), disallowPaths)) {
      skipped.push({ url: nextUrl, reason: 'robots_disallow' });
      continue;
    }
    if (exceedsQueryLimit(new URL(nextUrl), maxQueryParams)) {
      skipped.push({ url: nextUrl, reason: 'query_limit' });
      continue;
    }

    const validation = options.lookup
      ? await validateResolvedCrawlUrl(nextUrl, { lookup: options.lookup })
      : validateCrawlUrl(nextUrl);
    if (!validation.ok) {
      skipped.push({ url: nextUrl, reason: 'blocked_url' });
      continue;
    }

    try {
      const fetchedPage = await fetcher(validation.url);
      const page = await maybeRenderPage(fetchedPage, {
        renderer,
        renderJavaScript,
        url: validation.url
      });
      if (!String(page.contentType || '').includes('text/html')) {
        skipped.push({ url: validation.url, reason: 'non_html' });
        continue;
      }

      if (page.tooLarge || Buffer.byteLength(page.html || '', 'utf8') > maxBytes) {
        skipped.push({ url: validation.url, reason: 'oversized_html' });
        continue;
      }

      pages.push({
        url: page.url || validation.url,
        depth: next.depth,
        status: page.status,
        html: page.html,
        rendered: Boolean(page.rendered),
        performance: page.performance
      });

      for (const link of extractLinks(page.html, page.url || validation.url)) {
        const parsed = new URL(link);
        if (parsed.origin !== root.origin) {
          skipped.push({ url: parsed.toString(), reason: 'external_origin' });
          continue;
        }
        if (isRobotsDisallowed(parsed, disallowPaths)) {
          skipped.push({ url: parsed.toString(), reason: 'robots_disallow' });
          continue;
        }
        if (exceedsQueryLimit(parsed, maxQueryParams)) {
          skipped.push({ url: parsed.toString(), reason: 'query_limit' });
          continue;
        }
        if (next.depth + 1 > maxDepth) {
          skipped.push({ url: parsed.toString(), reason: 'max_depth' });
          continue;
        }
        if (!seen.has(parsed.toString()) && !queue.some((item) => item.url === parsed.toString())) {
          queue.push({ url: parsed.toString(), depth: next.depth + 1 });
        }
      }
    } catch (error) {
      errors.push({ url: validation.url, code: 'fetch_failed', message: error.message });
    }
  }

  return { rootUrl: root.toString(), pages, skipped, errors };
}

async function maybeRenderPage(page, { renderer, renderJavaScript, url }) {
  if (!renderer || renderJavaScript === 'off') return page;
  if (renderJavaScript !== 'always' && !looksLikeSparseSpaShell(page.html || '')) return page;

  try {
    const rendered = await renderer(page.url || url, { initialHtml: page.html, status: page.status });
    return {
      ...page,
      ...rendered,
      url: rendered.url || page.url || url,
      status: rendered.status || page.status,
      contentType: rendered.contentType || page.contentType,
      html: rendered.html || page.html,
      rendered: true
    };
  } catch (error) {
    return {
      ...page,
      renderError: error.message
    };
  }
}

function looksLikeSparseSpaShell(html) {
  const text = stripTags(html);
  const hasAppRoot = /<div\b[^>]*(id|class)=["'][^"']*(root|app|__next|nuxt|svelte)[^"']*["'][^>]*>\s*<\/div>/i.test(html);
  const hasScriptApp = /<script\b[^>]*src=["'][^"']*(app|main|bundle|chunk|webpack|vite|next)[^"']*["']/i.test(html);
  const linkCount = (html.match(/<a\b[^>]*href=/gi) || []).length;
  return text.length < 180 && hasAppRoot && hasScriptApp && linkCount === 0;
}

function stripTags(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function exceedsQueryLimit(url, maxQueryParams) {
  return [...url.searchParams.keys()].length > maxQueryParams;
}

function normalizeDisallowPaths(disallowPaths = []) {
  return [...new Set(
    disallowPaths
      .map((path) => String(path || '').trim())
      .filter(Boolean)
  )];
}

function isRobotsDisallowed(url, disallowPaths) {
  if (!disallowPaths.length) return false;
  return disallowPaths.some((path) => {
    if (path === '/') return true;
    return url.pathname === path || url.pathname.startsWith(path.endsWith('/') ? path : `${path}/`);
  });
}

function extractLinks(html, baseUrl) {
  const links = [];
  const pattern = /<a\b[^>]*href=["']([^"']+)["']/gi;
  let match;

  while ((match = pattern.exec(html)) !== null) {
    try {
      const parsed = new URL(match[1], baseUrl);
      parsed.hash = '';
      links.push(parsed.toString());
    } catch {
      links.push(match[1]);
    }
  }

  return links;
}

async function defaultFetchPage(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'SiteFitBot/0.1 (+https://sitefit.local)'
      }
    });

    const body = await readResponseTextWithLimit(response, options.maxBytes ?? 512_000);

    return {
      url: response.url,
      status: response.status,
      contentType: response.headers.get('content-type') || '',
      html: body.text,
      tooLarge: body.exceeded
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function readResponseTextWithLimit(response, maxBytes) {
  if (!response.body || typeof response.body.getReader !== 'function') {
    const text = await response.text();
    return {
      text: Buffer.byteLength(text, 'utf8') > maxBytes ? '' : text,
      exceeded: Buffer.byteLength(text, 'utf8') > maxBytes
    };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      return { text, exceeded: true };
    }

    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  return { text, exceeded: false };
}
