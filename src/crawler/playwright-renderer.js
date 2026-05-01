export async function createPlaywrightRenderer(options = {}) {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    throw new Error('Playwright renderer requires the optional "playwright" package.');
  }

  return async function renderWithPlaywright(url) {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({
        userAgent: options.userAgent || 'SiteFitBot/0.1 (+https://sitefit.local)'
      });
      const resourceStats = {
        transferSizeBytes: 0,
        imageTransferSizeBytes: 0,
        resourceCount: 0
      };

      page.on('response', async (response) => {
        try {
          const request = response.request();
          const headers = response.headers();
          const length = Number(headers['content-length'] || 0);
          resourceStats.resourceCount += 1;
          resourceStats.transferSizeBytes += Number.isFinite(length) ? length : 0;
          if (request.resourceType() === 'image') {
            resourceStats.imageTransferSizeBytes += Number.isFinite(length) ? length : 0;
          }
        } catch {
          // Ignore per-resource metric failures; rendered HTML is still useful.
        }
      });

      const response = await page.goto(url, {
        waitUntil: options.waitUntil || 'networkidle',
        timeout: options.timeoutMs || 15000
      });
      const performance = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paintEntries = performance.getEntriesByType('paint');
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        const layoutShifts = performance.getEntriesByType('layout-shift') || [];
        const longTasks = performance.getEntriesByType('longtask') || [];
        const lcp = lcpEntries.at(-1)?.startTime || paintEntries.find((entry) => entry.name === 'first-contentful-paint')?.startTime || 0;
        const cls = layoutShifts
          .filter((entry) => !entry.hadRecentInput)
          .reduce((sum, entry) => sum + entry.value, 0);
        const totalBlockingTime = longTasks.reduce((sum, entry) => sum + Math.max(0, entry.duration - 50), 0);
        return {
          lcpMs: Math.round(lcp),
          cls: Number(cls.toFixed(3)),
          totalBlockingTimeMs: Math.round(totalBlockingTime),
          domContentLoadedMs: Math.round(navigation?.domContentLoadedEventEnd || 0),
          loadEventMs: Math.round(navigation?.loadEventEnd || 0)
        };
      });

      return {
        url: page.url(),
        status: response?.status() || 200,
        contentType: response?.headers()['content-type'] || 'text/html',
        html: await page.content(),
        performance: {
          ...performance,
          ...resourceStats
        }
      };
    } finally {
      await browser.close();
    }
  };
}
