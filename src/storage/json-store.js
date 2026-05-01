import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const COLLECTIONS = [
  'diagnosis-runs.json',
  'leads.json',
  'estimates.json',
  'notes.json',
  'partners.json',
  'assignments.json',
  'monthly-accounts.json'
];

export class JsonStore {
  constructor(dataDir = 'data') {
    this.dataDir = dataDir;
  }

  async addDiagnosisRun(record) {
    const run = withRecordMeta('run', record);
    const runs = await this.#readCollection('diagnosis-runs.json');
    runs.unshift(run);
    await this.#writeCollection('diagnosis-runs.json', runs);
    return run;
  }

  async listDiagnosisRuns() {
    return this.#readCollection('diagnosis-runs.json');
  }

  async addLead(record) {
    const lead = withRecordMeta('lead', record);
    const leads = await this.#readCollection('leads.json');
    leads.unshift(lead);
    await this.#writeCollection('leads.json', leads);
    return lead;
  }

  async listLeads() {
    return this.#readCollection('leads.json');
  }

  async updateLead(id, changes) {
    const leads = await this.#readCollection('leads.json');
    const index = leads.findIndex((lead) => lead.id === id);
    if (index === -1) return null;

    leads[index] = {
      ...leads[index],
      ...changes,
      updatedAt: new Date().toISOString()
    };
    await this.#writeCollection('leads.json', leads);
    return leads[index];
  }

  async addEstimate(record) {
    const estimate = withRecordMeta('estimate', record);
    const estimates = await this.#readCollection('estimates.json');
    estimates.unshift(estimate);
    await this.#writeCollection('estimates.json', estimates);
    return estimate;
  }

  async listEstimates() {
    return this.#readCollection('estimates.json');
  }

  async updateEstimate(id, changes) {
    const estimates = await this.#readCollection('estimates.json');
    const index = estimates.findIndex((estimate) => estimate.id === id);
    if (index === -1) return null;

    estimates[index] = {
      ...estimates[index],
      ...changes,
      updatedAt: new Date().toISOString()
    };
    await this.#writeCollection('estimates.json', estimates);
    return estimates[index];
  }

  async addNote(record) {
    const note = withRecordMeta('note', record);
    const notes = await this.#readCollection('notes.json');
    notes.unshift(note);
    await this.#writeCollection('notes.json', notes);
    return note;
  }

  async listNotes() {
    return this.#readCollection('notes.json');
  }

  async addPartner(record) {
    const partner = withRecordMeta('partner', record);
    const partners = await this.#readCollection('partners.json');
    partners.unshift(partner);
    await this.#writeCollection('partners.json', partners);
    return partner;
  }

  async listPartners() {
    return this.#readCollection('partners.json');
  }

  async addAssignment(record) {
    const assignment = withRecordMeta('assignment', record);
    const assignments = await this.#readCollection('assignments.json');
    assignments.unshift(assignment);
    await this.#writeCollection('assignments.json', assignments);
    return assignment;
  }

  async listAssignments() {
    return this.#readCollection('assignments.json');
  }

  async addMonthlyAccount(record) {
    const account = withRecordMeta('monthly', record);
    const accounts = await this.#readCollection('monthly-accounts.json');
    accounts.unshift(account);
    await this.#writeCollection('monthly-accounts.json', accounts);
    return account;
  }

  async listMonthlyAccounts() {
    return this.#readCollection('monthly-accounts.json');
  }

  async exportAll() {
    const entries = await Promise.all(
      COLLECTIONS.map(async (name) => [name, await this.#readCollection(name)])
    );
    return {
      exportedAt: new Date().toISOString(),
      collections: Object.fromEntries(entries)
    };
  }

  async importAll(backup) {
    for (const name of COLLECTIONS) {
      const records = backup.collections?.[name] || [];
      await this.#writeCollection(name, records);
    }
  }

  async #readCollection(name) {
    await mkdir(this.dataDir, { recursive: true });
    try {
      const raw = await readFile(join(this.dataDir, name), 'utf8');
      return JSON.parse(raw);
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }

  async #writeCollection(name, records) {
    await mkdir(this.dataDir, { recursive: true });
    await writeFile(join(this.dataDir, name), `${JSON.stringify(records, null, 2)}\n`, 'utf8');
  }
}

function withRecordMeta(prefix, record) {
  return {
    id: `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...record
  };
}
