import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeSiteAssets } from '../src/diagnosis/site-assets.js';

test('reports missing robots and sitemap assets', async () => {
  const result = await analyzeSiteAssets('https://example.com/', {
    fetcher: async () => ({ status: 404, text: '' })
  });

  assert.ok(result.issues.some((issue) => issue.name === 'robots.txt 누락'));
  assert.ok(result.issues.some((issue) => issue.name === 'sitemap.xml 누락'));
});

test('detects robots crawl block and missing sitemap reference', async () => {
  const result = await analyzeSiteAssets('https://example.com/', {
    fetcher: async (url) => {
      if (url.endsWith('/robots.txt')) {
        return {
          status: 200,
          text: 'User-agent: *\nDisallow: /'
        };
      }
      return {
        status: 200,
        text: '<urlset><url><loc>https://example.com/</loc></url></urlset>'
      };
    }
  });

  assert.ok(result.issues.some((issue) => issue.name === 'robots.txt 전체 크롤링 차단'));
  assert.ok(result.issues.some((issue) => issue.name === 'robots.txt sitemap 참조 누락'));
});

test('extracts robots disallow rules for crawl scheduling', async () => {
  const result = await analyzeSiteAssets('https://example.com/', {
    fetcher: async (url) => {
      if (url.endsWith('/robots.txt')) {
        return {
          status: 200,
          text: [
            'User-agent: Googlebot',
            'Disallow: /google-only',
            'User-agent: *',
            'Disallow: /private',
            'Disallow: /admin/',
            'Allow: /'
          ].join('\n')
        };
      }
      return {
        status: 200,
        text: '<urlset><url><loc>https://example.com/</loc></url></urlset>'
      };
    }
  });

  assert.deepEqual(result.robotsRules.disallow, ['/private', '/admin/']);
});

test('extracts same-origin sitemap URLs for crawl seeding', async () => {
  const result = await analyzeSiteAssets('https://example.com/', {
    fetcher: async (url) => {
      if (url.endsWith('/robots.txt')) {
        return {
          status: 200,
          text: 'User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml'
        };
      }
      return {
        status: 200,
        text: `
          <urlset>
            <url><loc>https://example.com/service</loc></url>
            <url><loc>https://example.com/contact#team</loc></url>
            <url><loc>https://other.example/page</loc></url>
          </urlset>
        `
      };
    }
  });

  assert.deepEqual(result.sitemapUrls, [
    'https://example.com/service',
    'https://example.com/contact'
  ]);
});

test('follows same-origin sitemap index entries for crawl seeding', async () => {
  const result = await analyzeSiteAssets('https://example.com/', {
    fetcher: async (url) => {
      if (url.endsWith('/robots.txt')) {
        return {
          status: 200,
          text: 'Sitemap: https://example.com/sitemap.xml'
        };
      }
      if (url.endsWith('/sitemap.xml')) {
        return {
          status: 200,
          text: `
            <sitemapindex>
              <sitemap><loc>https://example.com/pages.xml</loc></sitemap>
              <sitemap><loc>https://other.example/other.xml</loc></sitemap>
            </sitemapindex>
          `
        };
      }
      if (url.endsWith('/pages.xml')) {
        return {
          status: 200,
          text: `
            <urlset>
              <url><loc>https://example.com/service</loc></url>
              <url><loc>https://example.com/pricing</loc></url>
            </urlset>
          `
        };
      }
      return { status: 404, text: '' };
    }
  });

  assert.deepEqual(result.sitemapUrls, [
    'https://example.com/service',
    'https://example.com/pricing'
  ]);
  assert.deepEqual(result.sitemapIndexes, ['https://example.com/pages.xml']);
});

test('default asset fetches use an abort signal', async (t) => {
  const originalFetch = globalThis.fetch;
  const requested = [];
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async (url, options = {}) => {
    requested.push({ url, signal: options.signal });
    return new Response('', { status: 404 });
  };

  await analyzeSiteAssets('https://example.com/');

  assert.equal(requested.length, 2);
  assert.equal(requested.every((request) => request.signal instanceof AbortSignal), true);
});
