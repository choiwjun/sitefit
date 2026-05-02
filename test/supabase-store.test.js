import test from 'node:test';
import assert from 'node:assert/strict';

import { createStore } from '../src/storage/create-store.js';
import { JsonStore } from '../src/storage/json-store.js';
import { SupabaseStore } from '../src/storage/supabase-store.js';

test('createStore uses Supabase when URL and service key are configured', () => {
  const store = createStore({
    env: {
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SECRET_KEY: 'sb_secret_example',
      SUPABASE_RECORDS_TABLE: 'sitefit_records'
    }
  });

  assert.equal(store instanceof SupabaseStore, true);
});

test('createStore supports legacy service role keys', () => {
  const store = createStore({
    env: {
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role'
    }
  });

  assert.equal(store instanceof SupabaseStore, true);
});

test('createStore can force local JSON storage even when Supabase is configured', () => {
  const store = createStore({
    forceJson: true,
    env: {
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role'
    }
  });

  assert.equal(store instanceof JsonStore, true);
});

test('SupabaseStore persists and updates records through PostgREST', async () => {
  const rows = [];
  const requests = [];
  const store = new SupabaseStore({
    url: 'https://project.supabase.co',
    key: 'service-role',
    table: 'sitefit_records',
    fetcher: async (url, options = {}) => {
      requests.push({ url, options });
      const method = options.method || 'GET';
      const parsed = new URL(url);
      const collection = parsed.searchParams.get('collection')?.replace(/^eq\./, '');
      const id = parsed.searchParams.get('id')?.replace(/^eq\./, '');

      if (method === 'POST') {
        const body = JSON.parse(options.body);
        const nextRows = Array.isArray(body) ? body : [body];
        rows.push(...nextRows);
        return jsonResponse(nextRows);
      }

      if (method === 'GET') {
        return jsonResponse(rows
          .filter((row) => !collection || row.collection === collection)
          .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))));
      }

      if (method === 'PATCH') {
        const body = JSON.parse(options.body);
        const matched = rows.filter((row) => row.collection === collection && row.id === id);
        for (const row of matched) {
          row.data = body.data;
          row.updated_at = body.updated_at;
        }
        return jsonResponse(matched);
      }

      if (method === 'DELETE') {
        for (let index = rows.length - 1; index >= 0; index -= 1) {
          if (rows[index].collection === collection) rows.splice(index, 1);
        }
        return textResponse('');
      }

      return textResponse('', 405);
    }
  });

  const lead = await store.addLead({ name: 'Kim', email: 'kim@example.com' });
  assert.match(lead.id, /^lead_/);
  assert.equal(lead.name, 'Kim');

  const leads = await store.listLeads();
  assert.equal(leads.length, 1);
  assert.equal(leads[0].email, 'kim@example.com');

  const updated = await store.updateLead(lead.id, { salesStatus: 'consultation_scheduled' });
  assert.equal(updated.salesStatus, 'consultation_scheduled');

  assert.equal(requests.some((request) => request.options.headers.apikey === 'service-role'), true);
  assert.equal(requests.some((request) => request.options.headers.authorization === 'Bearer service-role'), true);
  assert.equal(requests.some((request) => request.options.headers['user-agent'] === 'sitefit-server/1.0'), true);
  assert.equal(rows[0].collection, 'leads');
});

test('SupabaseStore does not send opaque sb keys as bearer tokens', async () => {
  const requests = [];
  const store = new SupabaseStore({
    url: 'https://project.supabase.co',
    key: 'sb_secret_example',
    table: 'sitefit_records',
    fetcher: async (url, options = {}) => {
      requests.push({ url, options });
      return jsonResponse([]);
    }
  });

  await store.listLeads();

  assert.equal(requests[0].options.headers.apikey, 'sb_secret_example');
  assert.equal('authorization' in requests[0].options.headers, false);
});

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body)
  };
}

function textResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body
  };
}
