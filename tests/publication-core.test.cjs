const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const clone = value => JSON.parse(JSON.stringify(value));
const engine = 'engine-' + 'a'.repeat(20), commit = 'b'.repeat(40);
const core = () => import('../worker/publication-core.mjs');
async function bundle(number = 1, engineRevision = engine) {
  const m = await core(), url = 'https://example.org/official-test-source';
  const sourceId = 'source-' + (await m.sha256(url)).slice(0, 20);
  const globals = { SPLUNK_DATA: { test: number }, VersionCompassEnvironmentData: {}, VersionCompassEditions: {}, VersionCompassForwarderData: {}, VersionCompassSOARData: {} };
  const catalog = { schemaVersion: 1, records: [
    { id: sourceId, kind: 'source', dataset: 'sources', url },
    { id: 'vc-' + 'c'.repeat(20), kind: 'claim', dataset: 'platform', scope: { platform: 'enterprise' },
      evidence: [{ sourceId, url, section: null, sectionScope: 'Section not recorded', sourceVerified: null, sourceChecked: null }],
      verification: { date: null, outcome: 'Claim verification not recorded' }, payload: { title: 'Synthetic fixture', number } },
  ] };
  const digest = await m.sha256({ schemaVersion: 1, globals, catalog });
  const datasetHashes = Object.fromEntries(m.DATASETS.map(id => [id, 'd'.repeat(64)]));
  return { manifest: { schemaVersion: 1, revision: 'content-' + (await m.sha256({ digest, engineRevision, datasetHashes })).slice(0, 24), digest, engineRevision,
    datasetHashes, recordCount: catalog.records.length,
    provenance: 'Test fixture, not verified product data', verificationPolicy: 'No invented dates', phase: 'test' }, globals, catalog };
}
async function candidate(value = null) {
  const m = await core(); return { repository: m.REPOSITORY, commit, bundle: value || await bundle() };
}
async function evidenceFetch(c, change = () => {}) {
  const m = await core(), requests = [];
  const run = { id: 7, head_sha: c.commit, head_branch: 'main', event: 'push', path: '.github/workflows/validate.yml', repository: { full_name: m.REPOSITORY }, status: 'completed', conclusion: 'success' };
  const job = { name: 'validate', status: 'completed', conclusion: 'success', steps: m.REQUIRED_STEPS.map(name => ({ name, status: 'completed', conclusion: 'success' })) };
  const fetcher = async (url, options) => {
    requests.push(url); assert.equal(options.redirect, 'manual');
    assert(!options.headers.Authorization, 'No credential sent to public evidence endpoints');
    let value;
    if (url.includes('/compare/')) value = { status: 'ahead', base_commit: { sha: c.commit }, merge_base_commit: { sha: c.commit } };
    else if (url.includes('/actions/runs?')) value = { workflow_runs: [clone(run)] };
    else if (url.includes('/jobs?')) value = { jobs: [clone(job)] };
    else if (url.endsWith('/content/publication.json')) value = clone(c.bundle.manifest);
    else if (url.endsWith('/dist/content-bundle.json')) value = clone(c.bundle);
    else throw Error('Unexpected external URL: ' + url);
    change(url, value);
    return new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });
  };
  return { fetcher, requests };
}
async function database(t) {
  const m = await core(), sql = new DatabaseSync(':memory:');
  sql.exec(`PRAGMA foreign_keys = ON;
    CREATE TABLE content_revisions(id TEXT PRIMARY KEY, engine TEXT NOT NULL, schema_version INTEGER NOT NULL, digest TEXT NOT NULL, manifest_json TEXT NOT NULL, bundle_json TEXT NOT NULL, record_count INTEGER NOT NULL, completed INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE content_records(revision_id TEXT NOT NULL REFERENCES content_revisions(id), record_id TEXT NOT NULL, kind TEXT NOT NULL, dataset TEXT NOT NULL, payload_json TEXT NOT NULL, PRIMARY KEY(revision_id, record_id));
    CREATE TABLE content_publication(channel TEXT PRIMARY KEY, revision_id TEXT NOT NULL REFERENCES content_revisions(id));`);
  sql.exec(m.PUBLICATION_SCHEMA); t.after(() => sql.close());
  let failBatch = null, batchCount = 0, batchHook = null;
  const db = {
    prepare(query) {
      const statement = sql.prepare(query);
      const bound = args => ({ bind: (...next) => bound(next), async first() { return statement.get(...args) || null; }, async all() { return { results: statement.all(...args) }; }, async run() { return statement.run(...args); } });
      return bound([]);
    },
    async batch(statements) {
      if (batchHook) { const fn = batchHook; batchHook = null; await fn(); }
      sql.exec('BEGIN'); batchCount++;
      try {
        const result = [];
        for (let i = 0; i < statements.length; i++) {
          if (failBatch?.batch === batchCount && failBatch.index === i) { failBatch = null; throw Error('Injected transaction failure'); }
          result.push(await statements[i].run());
        }
        sql.exec('COMMIT'); return result;
      } catch (error) { sql.exec('ROLLBACK'); throw error; }
    },
    failNext(index = 0) { failBatch = { batch: batchCount + 1, index }; },
    beforeNextBatch(fn) { batchHook = fn; }, sql,
  };
  return db;
}
async function stage(db, value, change) {
  const m = await core(), c = await candidate(value), { fetcher } = await evidenceFetch(c, change);
  return m.stagePublication(db, c, { engineRevision: value.manifest.engineRevision, fetcher });
}
async function prepared(t) {
  const m = await core(), db = await database(t), a = await bundle(1), b = await bundle(2), c = await bundle(3);
  for (const value of [a, b, c]) await stage(db, value);
  db.sql.prepare('INSERT INTO content_publication(channel,revision_id) VALUES (?,?)').run('engine:' + engine, a.manifest.revision);
  return { m, db, a, b, c };
}
const action = (id, from, to, generation = 0, intent = 'publish') => ({ operationId: 'pub-' + id.toString(16).padStart(32, '0'), expectedRevision: from.manifest.revision, revision: to.manifest.revision, expectedGeneration: generation, intent });

test('valid bundle preserves original qualifications and null verification dates', async () => {
  const m = await core(), b = await bundle(); assert.deepEqual(await m.validateBundle(b, engine), b);
  assert.equal(b.catalog.records[1].verification.date, null);
});
test('bundle validation rejects unknown fields, wrong engine, unsafe JSON and forged identities', async () => {
  const m = await core();
  for (const mutate of [
    b => b.extra = true, b => b.manifest.extra = true, b => b.globals.extra = {}, b => b.catalog.extra = true,
    b => b.manifest.engineRevision = 'engine-' + '0'.repeat(20), b => b.globals.SPLUNK_DATA.test = 99,
    b => b.manifest.revision = 'content-' + '0'.repeat(24), b => b.manifest.recordCount++,
    b => b.catalog.records.push(clone(b.catalog.records[0])), b => b.catalog.records[1].id = 'bad',
    b => b.catalog.records[1].evidence[0].sourceId = 'source-' + '0'.repeat(20),
    b => b.catalog.records[0].url = 'javascript:alert(1)', b => delete b.manifest.datasetHashes.soar,
    b => b.globals.SPLUNK_DATA = JSON.parse('{"__proto__":{}}'), b => b.catalog.records[1].verification.extra = true,
  ]) { const b = await bundle(); mutate(b); await assert.rejects(m.validateBundle(b, engine)); }
});
test('provenance requires main ancestry, exact commit and every successful CI/build step', async () => {
  const m = await core(), c = await candidate();
  const mutations = [
    (url, v) => { if (url.includes('/compare/')) v.status = 'diverged'; },
    (url, v) => { if (url.includes('/compare/')) v.merge_base_commit.sha = '0'.repeat(40); },
    (url, v) => { if (v.workflow_runs) v.workflow_runs[0].head_branch = 'feature'; },
    (url, v) => { if (v.workflow_runs) v.workflow_runs[0].head_sha = '0'.repeat(40); },
    (url, v) => { if (v.workflow_runs) v.workflow_runs[0].repository.full_name = 'other/repo'; },
    (url, v) => { if (v.workflow_runs) v.workflow_runs[0].conclusion = 'failure'; },
    (url, v) => { if (v.workflow_runs) v.workflow_runs.push({ ...v.workflow_runs[0], id: 8, status: 'in_progress', conclusion: null }); },
    (url, v) => { if (v.jobs) v.jobs[0].steps.pop(); },
    (url, v) => { if (v.jobs) v.jobs[0].steps[0].conclusion = 'skipped'; },
    (url, v) => { if (url.endsWith('/content/publication.json')) v.recordCount++; },
    (url, v) => { if (url.endsWith('/dist/content-bundle.json')) v.globals.SPLUNK_DATA.test = 77; },
  ];
  for (const mutation of mutations) {
    const { fetcher } = await evidenceFetch(c, mutation); await assert.rejects(m.verifyRepositoryPublication(c, { engineRevision: engine, fetcher }));
  }
  const { fetcher, requests } = await evidenceFetch(c);
  const verified = await m.verifyRepositoryPublication(c, { engineRevision: engine, fetcher });
  assert.equal(verified.provenance.commit, commit); assert.equal(verified.provenance.workflowRun, 7); assert.equal(requests.length, 5);
});
test('untrusted repository and malformed commit are rejected without outbound requests', async () => {
  const m = await core();
  for (const patch of [{ repository: 'attacker/repo' }, { commit: 'main' }, { commit: '../../main' }, { extra: true }]) {
    let requests = 0;
    await assert.rejects(m.verifyRepositoryPublication({ ...await candidate(), ...patch }, { engineRevision: engine, fetcher: async () => { requests++; } }));
    assert.equal(requests, 0);
  }
});
test('provenance failures never write a revision or change the active pointer', async t => {
  const { m, db, a } = await prepared(t), b = await bundle(8), c = await candidate(b);
  const options = { engineRevision: engine, fetcher: async () => new Response('unavailable', { status: 503 }) };
  await assert.rejects(m.stagePublication(db, c, options), /evidence unavailable/);
  await assert.rejects(m.stagePublication(db, c, { engineRevision: engine, fetcher: async (url, options) => {
    assert.equal(options.redirect, 'manual');
    return new Response('', { status: 302, headers: { Location: 'https://untrusted.example' } });
  } }), /evidence unavailable \(HTTP 302\)/);
  assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM content_revisions WHERE id=?').get(b.manifest.revision).n, 0);
  assert.equal((await m.readPublicationHead(db, engine)).revision, a.manifest.revision);
});
test('bounded artifact responses fail closed', async () => {
  const m = await core(), c = await candidate();
  await assert.rejects(m.verifyRepositoryPublication(c, { engineRevision: engine, fetcher: async () => new Response(' '.repeat(8 * 1024 * 1024 + 1)) }), /byte limit/);
  await assert.rejects(m.verifyRepositoryPublication(c, { engineRevision: engine, fetcher: async () => new Response('{bad-json') }));
});
test('candidate is snapshotted before asynchronous provenance checks', async () => {
  const m = await core(), c = await candidate(), original = clone(c), good = await evidenceFetch(original);
  let changed = false;
  const fetcher = async (...args) => { if (!changed) { c.bundle.globals.SPLUNK_DATA.test = 1000; changed = true; } return good.fetcher(...args); };
  const result = await m.verifyRepositoryPublication(c, { engineRevision: engine, fetcher }); assert.deepEqual(result.bundle, original.bundle);
});
test('staging is idempotent and never activates a new revision', async t => {
  const { m, db, a, b } = await prepared(t); const before = db.sql.prepare('SELECT COUNT(*) AS n FROM content_records').get().n;
  await stage(db, b); await stage(db, b);
  assert.equal((await m.readPublicationHead(db, engine)).revision, a.manifest.revision);
  assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM content_records').get().n, before);
  assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM content_publication_provenance').get().n, 3);
});
test('interrupted import leaves the previous complete revision active and retry resumes', async t => {
  const { m, db, a } = await prepared(t), b = await bundle(7); db.failNext();
  await assert.rejects(stage(db, b), /Injected/);
  assert.equal(db.sql.prepare('SELECT completed FROM content_revisions WHERE id=?').get(b.manifest.revision).completed, 0);
  assert.equal((await m.readPublicationHead(db, engine)).revision, a.manifest.revision);
  await stage(db, b); assert.equal(db.sql.prepare('SELECT completed FROM content_revisions WHERE id=?').get(b.manifest.revision).completed, 1);
});
test('immutable bundle collisions and same-count record corruption are rejected', async t => {
  const { db, b } = await prepared(t);
  db.sql.prepare('UPDATE content_records SET payload_json=? WHERE revision_id=? AND kind=?').run('{}', b.manifest.revision, 'claim');
  await assert.rejects(stage(db, b), /corrupt/);
  db.sql.prepare('UPDATE content_revisions SET bundle_json=? WHERE id=?').run('{}', b.manifest.revision);
  await assert.rejects(stage(db, b), /collision/);
});
test('activation atomically records an event and advances the exact expected head', async t => {
  const { m, db, a, b } = await prepared(t);
  const out = await m.activatePublication(db, action(1, a, b), { engineRevision: engine });
  assert.equal(out.status, 'applied'); assert.deepEqual(out.current, { revision: b.manifest.revision, generation: 1 });
  const event = db.sql.prepare('SELECT * FROM content_publication_events').get();
  assert.equal(event.provenance_commit, commit); assert.equal(event.from_revision, a.manifest.revision);
  assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM content_revisions WHERE completed=1').get().n, 3);
});
test('activation cannot accept incomplete, unverified or corrupt targets', async t => {
  const { m, db, a, b } = await prepared(t);
  db.sql.prepare('UPDATE content_revisions SET completed=0 WHERE id=?').run(b.manifest.revision);
  await assert.rejects(m.activatePublication(db, action(1, a, b), { engineRevision: engine }), /Complete target/);
  db.sql.prepare('UPDATE content_revisions SET completed=1 WHERE id=?').run(b.manifest.revision);
  db.sql.prepare('DELETE FROM content_publication_provenance WHERE revision_id=?').run(b.manifest.revision);
  await assert.rejects(m.activatePublication(db, action(1, a, b), { engineRevision: engine }), /Complete target/);
  await stage(db, b);
  db.sql.prepare('UPDATE content_records SET kind=? WHERE revision_id=? AND kind=?').run('wrong', b.manifest.revision, 'claim');
  await assert.rejects(m.activatePublication(db, action(1, a, b), { engineRevision: engine }), /corrupt/);
  assert.deepEqual(await m.readPublicationHead(db, engine), { revision: a.manifest.revision, generation: 0 });
});
test('same-operation retries are harmless and conflicting reuse fails', async t => {
  const { m, db, a, b, c } = await prepared(t); const first = action(1, a, b);
  await m.activatePublication(db, first, { engineRevision: engine });
  assert.equal((await m.activatePublication(db, first, { engineRevision: engine })).status, 'already-applied');
  await assert.rejects(m.activatePublication(db, action(1, a, c), { engineRevision: engine }), /collision/);
  assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM content_publication_events').get().n, 1);
});
test('SQL compare-and-swap rejects a racing publisher after preflight', async t => {
  const { m, db, a, b, c } = await prepared(t);
  db.beforeNextBatch(async () => { await m.activatePublication(db, action(2, a, c), { engineRevision: engine }); });
  await assert.rejects(m.activatePublication(db, action(1, a, b), { engineRevision: engine }), /Concurrent/);
  assert.deepEqual(await m.readPublicationHead(db, engine), { revision: c.manifest.revision, generation: 1 });
  assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM content_publication_events').get().n, 1);
});
test('failure between event creation and pointer update rolls back both', async t => {
  const { m, db, a, b } = await prepared(t); db.failNext(1);
  await assert.rejects(m.activatePublication(db, action(1, a, b), { engineRevision: engine }), /Injected/);
  assert.deepEqual(await m.readPublicationHead(db, engine), { revision: a.manifest.revision, generation: 0 });
  assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM content_publication_events').get().n, 0);
  await m.activatePublication(db, action(1, a, b), { engineRevision: engine });
});
test('rollback retains immutable payloads and generation prevents ABA stale activation', async t => {
  const { m, db, a, b, c } = await prepared(t);
  await m.activatePublication(db, action(1, a, b), { engineRevision: engine });
  await m.activatePublication(db, action(2, b, a, 1, 'rollback'), { engineRevision: engine });
  assert.deepEqual(await m.readPublicationHead(db, engine), { revision: a.manifest.revision, generation: 2 });
  await assert.rejects(m.activatePublication(db, action(3, a, c, 0), { engineRevision: engine }), /Stale/);
  const retry = await m.activatePublication(db, action(1, a, b), { engineRevision: engine });
  assert.equal(retry.status, 'already-applied'); assert.equal(retry.current.revision, a.manifest.revision);
  assert.equal(retry.applied.revision, b.manifest.revision);
  assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM content_revisions WHERE completed=1').get().n, 3);
});
test('rollback cannot be used to activate content never previously published', async t => {
  const { m, db, a, b, c } = await prepared(t);
  await m.activatePublication(db, action(1, a, b), { engineRevision: engine });
  await assert.rejects(m.activatePublication(db, action(2, b, c, 1, 'rollback'), { engineRevision: engine }), /never active/);
});
test('unknown activation fields, wrong engine, no-op and invalid generations are rejected', async t => {
  const { m, db, a, b } = await prepared(t);
  for (const patch of [{ extra: true }, { expectedGeneration: -1 }, { expectedGeneration: Number.MAX_SAFE_INTEGER }, { expectedGeneration: 0.5 }, { operationId: '../bad' }, { intent: 'delete' }, { revision: a.manifest.revision }])
    await assert.rejects(m.activatePublication(db, { ...action(1, a, b), ...patch }, { engineRevision: engine }));
  await assert.rejects(m.activatePublication(db, action(1, a, b), { engineRevision: 'engine-' + 'f'.repeat(20) }), /Engine mismatch/);
});

test('actual repository bundle validates and public build integrates validation without a write route', { skip: !fs.existsSync(path.join(__dirname, '../dist/content-bundle.json')) }, async () => {
  const m = await core(), root = path.join(__dirname, '..');
  const real = JSON.parse(fs.readFileSync(path.join(root, 'dist/content-bundle.json'), 'utf8'));
  assert.deepEqual(await m.validateBundle(real, real.manifest.engineRevision), real);
  const script = fs.readFileSync(path.join(root, 'scripts/build-worker.cjs'), 'utf8');
  const worker = fs.readFileSync(path.join(root, 'worker/index.mjs'), 'utf8');
  assert(script.includes('publication-core.mjs')); assert(!worker.includes('activatePublication'));
  assert.match(worker, /Read-only content service/);
});

test('publishing a previously active revision requires the explicit rollback intent', async t => {
  const { m, db, a, b } = await prepared(t);
  await m.activatePublication(db, action(1, a, b), { engineRevision: engine });
  await assert.rejects(m.activatePublication(db, action(2, b, a, 1, 'publish'), { engineRevision: engine }), /explicit rollback/);
});
test('read-only preflight CLI rejects malformed arguments before accessing artifacts or network', () => {
  const result = require('node:child_process').spawnSync(process.execPath, [path.join(__dirname, '../scripts/verify-publication.mjs'), '--commit', 'main'], { encoding: 'utf8' });
  assert.equal(result.status, 1); assert.match(result.stderr, /Usage:/); assert.equal(result.stdout, '');
});
