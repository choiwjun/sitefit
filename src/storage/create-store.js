import { JsonStore } from './json-store.js';
import { SupabaseStore } from './supabase-store.js';

export function createStore({ dataDir = 'data', env = process.env, forceJson = false } = {}) {
  const supabaseUrl = env.SUPABASE_URL || '';
  const supabaseKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!forceJson && supabaseUrl && supabaseKey) {
    return new SupabaseStore({
      url: supabaseUrl,
      key: supabaseKey,
      table: env.SUPABASE_RECORDS_TABLE || 'sitefit_records'
    });
  }

  return new JsonStore(dataDir);
}
