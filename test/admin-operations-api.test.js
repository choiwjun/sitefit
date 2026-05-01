import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { createServer } from '../src/server.js';

test('admin operation APIs create notes, partners, assignments, and monthly accounts', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-ops-'));
  const app = createServer({ dataDir: dir });

  await new Promise((resolve) => app.listen(0, resolve));
  try {
    const baseUrl = `http://127.0.0.1:${app.address().port}`;

    const noteResponse = await fetch(`${baseUrl}/api/notes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ leadId: 'lead_1', body: 'Decision maker prefers monthly management.' })
    });
    assert.equal(noteResponse.status, 201);

    const partnerResponse = await fetch(`${baseUrl}/api/partners`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'SEO Dev', capabilities: ['technical-seo-cleanup'] })
    });
    const { partner } = await partnerResponse.json();
    assert.equal(partner.name, 'SEO Dev');

    const assignmentResponse = await fetch(`${baseUrl}/api/assignments`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ estimateId: 'estimate_1', packageId: 'technical-seo-cleanup' })
    });
    const { assignment } = await assignmentResponse.json();
    assert.equal(assignment.partnerId, partner.id);

    const monthlyResponse = await fetch(`${baseUrl}/api/monthly-accounts`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ leadId: 'lead_1', siteUrl: 'https://example.com/', cadence: 'monthly' })
    });
    const monthly = await monthlyResponse.json();
    assert.equal(monthly.account.status, 'active');

    const backupResponse = await fetch(`${baseUrl}/api/admin/export`);
    const backup = await backupResponse.json();
    assert.equal(backupResponse.status, 200);
    assert.ok(Array.isArray(backup.collections['partners.json']));
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});
