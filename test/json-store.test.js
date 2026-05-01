import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { JsonStore } from '../src/storage/json-store.js';

test('persists diagnosis runs and leads as append-only records with IDs', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sitefit-store-'));
  try {
    const store = new JsonStore(dir);

    const run = await store.addDiagnosisRun({ url: 'https://example.com/', scores: { overall: 75 } });
    const lead = await store.addLead({ name: 'Kim', budgetRange: '300-700' });
    const estimate = await store.addEstimate({ leadId: lead.id, status: 'draft' });

    assert.match(run.id, /^run_/);
    assert.match(lead.id, /^lead_/);
    assert.match(estimate.id, /^estimate_/);
    assert.equal((await store.listDiagnosisRuns()).length, 1);
    assert.equal((await store.listLeads()).length, 1);
    assert.equal((await store.listEstimates()).length, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
