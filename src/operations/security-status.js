const WEAK_ADMIN_TOKEN_PATTERNS = [
  /^change[-_]?me/i,
  /^admin$/i,
  /^password$/i,
  /^secret$/i,
  /^test/i
];

export function buildSecurityStatus({ env = process.env, nodeEnv = process.env.NODE_ENV || 'development', counts = {}, adminToken: configuredAdminToken } = {}) {
  const adminToken = configuredAdminToken ?? env.ADMIN_TOKEN ?? '';
  const supabaseSecret = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '';
  const warnings = [];

  if (nodeEnv === 'production' && !adminToken) {
    warnings.push('production_admin_token_missing');
  }
  if (adminToken && isWeakAdminToken(adminToken)) {
    warnings.push('admin_token_rotation_recommended');
  }
  if (!env.SUPABASE_URL || !supabaseSecret) {
    warnings.push('supabase_not_configured');
  }
  if (supabaseSecret && !String(supabaseSecret).startsWith('sb_secret_') && !String(supabaseSecret).startsWith('sb_')) {
    warnings.push('legacy_supabase_key_format');
  }
  if (Number(counts.demoLeadCount || 0) > 0 && nodeEnv === 'production') {
    warnings.push('demo_data_present_in_production');
  }

  return {
    status: warnings.length ? 'needs_review' : 'ready',
    nodeEnv,
    checks: {
      adminTokenConfigured: Boolean(adminToken),
      adminTokenStrong: Boolean(adminToken) && !isWeakAdminToken(adminToken),
      supabaseConfigured: Boolean(env.SUPABASE_URL && supabaseSecret),
      supabaseSecretServerOnly: Boolean(supabaseSecret),
      demoDataCount: Number(counts.demoLeadCount || 0)
    },
    warnings
  };
}

function isWeakAdminToken(value) {
  const token = String(value || '');
  return token.length < 24 || WEAK_ADMIN_TOKEN_PATTERNS.some((pattern) => pattern.test(token));
}
