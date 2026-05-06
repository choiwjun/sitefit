export function loadConfig(env = process.env) {
  const isVercelFunction = Boolean(env.VERCEL);

  return {
    port: numberFromEnv(env.PORT, 3000),
    adminToken: env.ADMIN_TOKEN || '',
    crawler: {
      maxPages: numberFromEnv(env.CRAWLER_MAX_PAGES, isVercelFunction ? 3 : 50),
      maxDepth: numberFromEnv(env.CRAWLER_MAX_DEPTH, isVercelFunction ? 1 : 2),
      maxBytes: numberFromEnv(env.CRAWLER_MAX_BYTES, 512000),
      maxQueryParams: numberFromEnv(env.CRAWLER_MAX_QUERY_PARAMS, 8),
      maxLinkChecks: numberFromEnv(env.CRAWLER_MAX_LINK_CHECKS, isVercelFunction ? 8 : 100),
      renderJavaScript: env.CRAWLER_RENDER_JS || 'auto',
      renderer: env.CRAWLER_RENDERER || 'none'
    },
    ai: {
      provider: env.AI_PROVIDER || 'mock'
    }
  };
}

function numberFromEnv(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
