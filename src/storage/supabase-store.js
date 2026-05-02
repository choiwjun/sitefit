const COLLECTIONS = [
  'diagnosis-runs',
  'leads',
  'estimates',
  'notes',
  'partners',
  'assignments',
  'monthly-accounts'
];

export class SupabaseStore {
  constructor({ url, key, table = 'sitefit_records', fetcher = fetch } = {}) {
    if (!url) throw new Error('SUPABASE_URL is required for SupabaseStore');
    if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for SupabaseStore');
    this.url = String(url).replace(/\/$/, '');
    this.key = key;
    this.table = table;
    this.fetcher = fetcher;
  }

  async addDiagnosisRun(record) {
    return this.#addRecord('diagnosis-runs', 'run', record);
  }

  async listDiagnosisRuns() {
    return this.#listRecords('diagnosis-runs');
  }

  async addLead(record) {
    return this.#addRecord('leads', 'lead', record);
  }

  async listLeads() {
    return this.#listRecords('leads');
  }

  async updateLead(id, changes) {
    return this.#updateRecord('leads', id, changes);
  }

  async addEstimate(record) {
    return this.#addRecord('estimates', 'estimate', record);
  }

  async listEstimates() {
    return this.#listRecords('estimates');
  }

  async updateEstimate(id, changes) {
    return this.#updateRecord('estimates', id, changes);
  }

  async addNote(record) {
    return this.#addRecord('notes', 'note', record);
  }

  async listNotes() {
    return this.#listRecords('notes');
  }

  async addPartner(record) {
    return this.#addRecord('partners', 'partner', record);
  }

  async listPartners() {
    return this.#listRecords('partners');
  }

  async addAssignment(record) {
    return this.#addRecord('assignments', 'assignment', record);
  }

  async listAssignments() {
    return this.#listRecords('assignments');
  }

  async addMonthlyAccount(record) {
    return this.#addRecord('monthly-accounts', 'monthly', record);
  }

  async listMonthlyAccounts() {
    return this.#listRecords('monthly-accounts');
  }

  async exportAll() {
    const entries = await Promise.all(
      COLLECTIONS.map(async (collection) => [`${collection}.json`, await this.#listRecords(collection)])
    );
    return {
      exportedAt: new Date().toISOString(),
      collections: Object.fromEntries(entries)
    };
  }

  async importAll(backup) {
    for (const collection of COLLECTIONS) {
      const records = backup.collections?.[`${collection}.json`] || backup.collections?.[collection] || [];
      await this.#replaceCollection(collection, records);
    }
  }

  async deleteDemoData() {
    const [
      runs,
      leads,
      estimates,
      notes,
      partners,
      assignments,
      monthlyAccounts
    ] = await Promise.all(COLLECTIONS.map((collection) => this.#listRecords(collection)));

    const demoLeadIds = new Set(leads.filter(isDemoRecord).map((lead) => lead.id));
    const demoEstimateIds = new Set(
      estimates
        .filter((estimate) => isDemoRecord(estimate) || demoLeadIds.has(estimate.leadId))
        .map((estimate) => estimate.id)
    );

    const next = {
      'diagnosis-runs': runs.filter((run) => !isDemoRecord(run)),
      leads: leads.filter((lead) => !isDemoRecord(lead)),
      estimates: estimates.filter((estimate) => !demoEstimateIds.has(estimate.id)),
      notes: notes.filter((note) => !isDemoRecord(note) && !demoLeadIds.has(note.leadId)),
      partners,
      assignments: assignments.filter((assignment) => !isDemoRecord(assignment) && !demoEstimateIds.has(assignment.estimateId)),
      'monthly-accounts': monthlyAccounts.filter((account) => !isDemoRecord(account) && !demoLeadIds.has(account.leadId))
    };

    await Promise.all(Object.entries(next).map(([collection, records]) => this.#replaceCollection(collection, records)));

    return {
      removed: {
        runs: runs.length - next['diagnosis-runs'].length,
        leads: leads.length - next.leads.length,
        estimates: estimates.length - next.estimates.length,
        notes: notes.length - next.notes.length,
        assignments: assignments.length - next.assignments.length,
        monthlyAccounts: monthlyAccounts.length - next['monthly-accounts'].length
      }
    };
  }

  async #addRecord(collection, prefix, record) {
    const next = withRecordMeta(prefix, record);
    const row = await this.#request('', {
      method: 'POST',
      body: [rowFor(collection, next)],
      prefer: 'return=representation'
    });
    return row?.[0]?.data || next;
  }

  async #listRecords(collection) {
    const query = new URLSearchParams({
      collection: `eq.${collection}`,
      select: 'data,created_at',
      order: 'created_at.desc'
    });
    const rows = await this.#request(`?${query.toString()}`);
    return (rows || []).map((row) => row.data).filter(Boolean);
  }

  async #updateRecord(collection, id, changes) {
    const records = await this.#listRecords(collection);
    const current = records.find((record) => record.id === id);
    if (!current) return null;

    const updated = {
      ...current,
      ...changes,
      updatedAt: new Date().toISOString()
    };
    const query = new URLSearchParams({
      collection: `eq.${collection}`,
      id: `eq.${id}`
    });
    const rows = await this.#request(`?${query.toString()}`, {
      method: 'PATCH',
      body: {
        data: updated,
        updated_at: updated.updatedAt
      },
      prefer: 'return=representation'
    });
    return rows?.[0]?.data || updated;
  }

  async #replaceCollection(collection, records) {
    const query = new URLSearchParams({ collection: `eq.${collection}` });
    await this.#request(`?${query.toString()}`, {
      method: 'DELETE',
      prefer: 'return=minimal'
    });

    if (!records.length) return;
    await this.#request('', {
      method: 'POST',
      body: records.map((record) => rowFor(collection, record)),
      prefer: 'return=minimal'
    });
  }

  async #request(path, { method = 'GET', body, prefer = 'return=representation' } = {}) {
    const headers = {
      apikey: this.key,
      'content-type': 'application/json',
      prefer,
      'user-agent': 'sitefit-server/1.0'
    };
    if (!this.key.startsWith('sb_')) {
      headers.authorization = `Bearer ${this.key}`;
    }

    const response = await this.fetcher(`${this.url}/rest/v1/${this.table}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Supabase ${method} ${this.table} failed: ${response.status} ${text}`);
    }
    return text ? JSON.parse(text) : null;
  }
}

function rowFor(collection, record) {
  return {
    id: record.id,
    collection,
    data: record,
    created_at: record.createdAt || new Date().toISOString(),
    updated_at: record.updatedAt || record.createdAt || new Date().toISOString()
  };
}

function isDemoRecord(record) {
  return Boolean(record?.demoFixtureId);
}

function withRecordMeta(prefix, record) {
  return {
    id: `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...record
  };
}
