import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { JsonStore } from '../src/storage/json-store.js';

test('exports and imports all store collections', async () => {
  const sourceDir = await mkdtemp(join(tmpdir(), 'sitefit-backup-source-'));
  const targetDir = await mkdtemp(join(tmpdir(), 'sitefit-backup-target-'));

  try {
    const source = new JsonStore(sourceDir);
    await source.addLead({ name: 'Kim' });
    await source.addPartner({ name: 'SEO Dev', capabilities: ['technical-seo-cleanup'] });

    const backup = await source.exportAll();
    const target = new JsonStore(targetDir);
    await target.importAll(backup);

    assert.equal((await target.listLeads()).length, 1);
    assert.equal((await target.listPartners()).length, 1);
  } finally {
    await rm(sourceDir, { recursive: true, force: true });
    await rm(targetDir, { recursive: true, force: true });
  }
});
