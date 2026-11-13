/* Synthetic-only seed regressions. This serialized SQLite adapter is not hosted D1. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

function syntheticSeed(count = 101, tag = 'A') {
  const globals = Object.fromEntries([
    'SPLUNK_DATA', 'VersionCompassEnvironmentData', 'VersionCompassEditions',
    'VersionCompassForwarderData', 'VersionCompassSOARData',
  ].map(key => [key, {}]));
  const catalog = {
    schemaVersion: 1,
    records: Array.from({ length: count }, (_, i) => ({
      id: 'vc-' + i.toString(16).padStart(20, '0'), kind: 'fixture', dataset: 'platform',
      scope: { synthetic: true }, evidence: [],
      verification: { date: null, outcome: 'Synthetic, not factual evidence' },
      payload: { i, tag },
    })),
  };
  const datasetHashes = Object.fromEntries([
    'platform', 'products', 'guidance', 'environment', 'editions', 'forwarders', 'soar',
  ].map(key => [key, hash({ synthetic: key })]));
  const digest = hash({ schemaVersion: 1, globals, catalog });
  const engineRevision = 'engine-' + 'a'.repeat(20);
  return {
    manifest: {
      schemaVersion: 1,
      revision: 'content-' + hash({ digest, engineRevision, datasetHashes }).slice(0, 24),
      digest, engineRevision, datasetHashes, recordCount: count,
      provenance: 'Synthetic fixture', verificationPolicy: 'No factual claims', phase: 'synthetic',
    },
    globals, catalog,
  };
}

let moduleID = 0;
async function modules() {
  // Same source assembly as build-worker.cjs; no generated bundle or remote imports.
  const source = ['publication-core.mjs', 'content-store.mjs', 'publisher.mjs', 'index.mjs']
    .map(file => fs.readFileSync(path.join(root, 'worker', file), 'utf8')
      .replace(/^import .*publication-core\.mjs';\n/, ''))
    .join('\n') + '\n// isolated instance ' + moduleID++;
  return import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
}

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

function database(t) {
  const sql = new DatabaseSync(':memory:');
  t.after(() => sql.close());
  sql.exec('PRAGMA foreign_keys = ON');
  for (const file of fs.readdirSync(path.join(root, 'drizzle')).filter(f => f.endsWith('.sql')).sort()) {
    sql.exec(fs.readFileSync(path.join(root, 'drizzle', file), 'utf8'));
  }
  const state = { sql, batches: 0, revisionInserts: 0, fault: null, gate: null, readBarrier: null };
  let queue = Promise.resolve();
  state.count = () => sql.prepare('SELECT COUNT(*) AS n FROM content_records').get().n;
  state.head = () => sql.prepare('SELECT revision_id FROM content_publication').get()?.revision_id;
  state.completed = revision => sql.prepare('SELECT completed FROM content_revisions WHERE id = ?').get(revision)?.completed;
  state.wrapper = () => ({
    prepare(query) {
      const statement = sql.prepare(query);
      const bound = args => ({
        bind: (...values) => bound(values),
        async first() {
          const value = statement.get(...args) || null;
          if (state.readBarrier && query.startsWith('SELECT digest, engine, record_count, manifest_json, bundle_json, completed')) {
            // Force both callers to observe the missing revision before either imports.
            const barrier = state.readBarrier;
            if (++barrier.arrived === 2) { state.readBarrier = null; barrier.resolve(); }
            await barrier.promise;
          }
          return value;
        },
        async all() { return { results: statement.all(...args) }; },
        async run() {
          const event = query.startsWith('INSERT INTO content_revisions') ? 'revision-insert'
            : query.startsWith('UPDATE content_revisions SET completed') ? 'complete'
            : query.startsWith('INSERT INTO content_publication ') ? 'head' : null;
          if (event === 'revision-insert') state.revisionInserts++;
          if (state.fault?.event === event && state.fault.when === 'before') {
            state.fault = null;
            throw Error('Injected before ' + event);
          }
          const result = statement.run(...args);
          if (state.fault?.event === event && state.fault.when === 'after') {
            state.fault = null;
            throw Error('Injected committed statement response loss: ' + event);
          }
          return result;
        },
      });
      return bound([]);
    },
    async batch(statements) {
      // One atomic SQLite transaction per batch, serialized across all wrappers.
      // This avoids mock nested-BEGIN errors; it does not certify D1 scheduling.
      const work = queue.then(async () => {
        const batch = ++state.batches;
        if (state.gate) {
          const gate = state.gate;
          state.gate = null;
          gate.entered.resolve();
          await gate.release.promise;
        }
        const fault = state.fault?.batch === batch ? state.fault : null;
        if (fault) state.fault = null;
        sql.exec('BEGIN');
        let transactionOpen = true;
        try {
          if (fault?.when === 'before') throw Error('Injected before batch');
          const result = [];
          for (let i = 0; i < statements.length; i++) {
            result.push(await statements[i].run());
            if (fault?.when === 'during' && i === 2) throw Error('Injected mid-batch');
          }
          sql.exec('COMMIT');
          transactionOpen = false;
          // Deliberately lose the response AFTER commit, not a cancellation model.
          if (fault?.when === 'after') throw Error('Injected committed batch response loss');
          return result;
        } catch (error) {
          if (transactionOpen) sql.exec('ROLLBACK');
          throw error;
        }
      });
      queue = work.catch(() => {});
      return work;
    },
  });
  state.db = state.wrapper();
  return state;
}

test('synthetic bundled seed initialization (local SQLite, not hosted D1)', { timeout: 15000 }, async t => {
  let networkAttempts = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { networkAttempts++; throw Error('Network forbidden in synthetic seed tests'); };
  t.after(() => {
    globalThis.fetch = originalFetch;
    assert.equal(networkAttempts, 0, 'Even swallowed network errors must fail this suite');
  });
  const m = await modules();
  // Await subtests serially: fetch stubbing and fault injection are file-local.
  for (const method of ['GET', 'HEAD']) await t.test(method + ' reports cold storage without initializing', async t => {
    const d = database(t), seed = syntheticSeed();
    const worker = m.createWorker(seed, {}, { rippleFetch: globalThis.fetch });
    const response = await worker.fetch(new Request('https://fixture.invalid/api/content/health', { method }), { DB: d.db, VC_ACTIVE_DELIVERY: '0' });
    assert.equal(response.status,503);
    assert.equal(d.count(),0);assert.equal(d.batches,0);
    assert.equal(d.completed(seed.manifest.revision),undefined);assert.equal(d.head(),undefined);
  });

  const interruptions = [
    ['first batch', 101, { batch: 1, when: 'before' }, 0],
    ['nineteenth batch', 901, { batch: 19, when: 'before' }, 900],
    ['mid-batch rollback', 101, { batch: 2, when: 'during' }, 50],
    ['committed batch response loss', 101, { batch: 2, when: 'after' }, 100],
  ];
  for (const [name, count, fault, retained] of interruptions) await t.test(name + ' retries safely', async t => {
    const d = database(t), seed = syntheticSeed(count);
    d.fault = fault;
    await assert.rejects(m.ensureRevision(d.db, seed), /Injected/);
    assert.equal(d.count(), retained);
    assert.equal(d.completed(seed.manifest.revision), 0);
    assert.equal(await m.readBundle(d.db, seed.manifest.revision), null);
    assert.equal(d.head(), undefined);
    const batchesBeforeRetry = d.batches;
    await m.ensureRevision(d.db, seed);
    assert.equal(d.count(), count);
    assert.equal(d.batches - batchesBeforeRetry, Math.ceil(count / 50), 'Retry replays all batches');
    assert.deepEqual(await m.readBundle(d.db, seed.manifest.revision), seed);
    assert.equal(d.head(), seed.manifest.revision);
  });

  for (const fault of [
    { event: 'complete', when: 'after' }, { event: 'head', when: 'before' }, { event: 'head', when: 'after' },
  ]) await t.test(fault.when + ' ' + fault.event + ' failure recovers without reimport', async t => {
    const d = database(t), seed = syntheticSeed();
    d.fault = fault;
    await assert.rejects(m.ensureRevision(d.db, seed), /Injected/);
    assert.deepEqual(await m.readBundle(d.db, seed.manifest.revision), seed);
    assert.equal(d.head(), fault.event === 'head' && fault.when === 'after' ? seed.manifest.revision : undefined);
    await m.ensureRevision(d.db, seed);
    assert.equal(d.head(), seed.manifest.revision);
    assert.equal(d.batches, 3);
  });

  for (const mode of ['same wrapper', 'distinct wrappers', 'distinct modules']) await t.test(mode + ' concurrent imports remain idempotent', async t => {
    const d = database(t), seed = syntheticSeed();
    d.readBarrier = { arrived: 0, ...deferred() };
    const other = mode === 'distinct modules' ? await modules() : m;
    await Promise.all([
      m.ensureRevision(d.db, seed),
      other.ensureRevision(mode === 'distinct wrappers' ? d.wrapper() : d.db, seed),
    ]);
    assert.equal(d.count(), 101);
    assert.deepEqual(await m.readBundle(d.db, seed.manifest.revision), seed);
    assert.equal(d.head(), seed.manifest.revision);
    assert.equal(d.batches, mode === 'same wrapper' ? 3 : 6);
    assert.equal(d.revisionInserts, mode === 'same wrapper' ? 1 : 2);
  });

  await t.test('different seed race and subsequent initialization preserve the first head', async t => {
    const d = database(t), a = syntheticSeed(101, 'A'), b = syntheticSeed(101, 'B');
    d.readBarrier = { arrived: 0, ...deferred() };
    await Promise.all([m.ensureRevision(d.db, a), m.ensureRevision(d.wrapper(), b)]);
    const head = d.head();
    assert([a.manifest.revision, b.manifest.revision].includes(head));
    await m.ensureRevision(d.db, head === a.manifest.revision ? b : a);
    assert.equal(d.head(), head);
    assert.equal(d.count(), 202);
    assert.deepEqual(await m.readBundle(d.db, a.manifest.revision), a);
    assert.deepEqual(await m.readBundle(d.db, b.manifest.revision), b);
  });

  await t.test('same-count stored corruption fails closed on repeated retry', async t => {
    const d = database(t), seed = syntheticSeed();
    d.fault = { batch: 2, when: 'before' };
    await assert.rejects(m.ensureRevision(d.db, seed), /Injected/);
    d.sql.prepare('UPDATE content_records SET payload_json = ? WHERE record_id = ?').run('{}', seed.catalog.records[0].id);
    for (let retry = 0; retry < 2; retry++) {
      await assert.rejects(m.ensureRevision(d.db, seed), /Incomplete or corrupt/);
      assert.equal(d.count(), 101);
      assert.equal(d.completed(seed.manifest.revision), 0);
      assert.equal(await m.readBundle(d.db, seed.manifest.revision), null);
      assert.equal(d.head(), undefined);
    }
  });

  for (const complete of [false, true]) await t.test((complete ? 'complete' : 'incomplete') + ' stored identity collision rejects', async t => {
    const d = database(t), seed = syntheticSeed();
    if (complete) await m.ensureRevision(d.db, seed);
    else {
      d.fault = { batch: 1, when: 'before' };
      await assert.rejects(m.ensureRevision(d.db, seed), /Injected/);
    }
    const head = d.head();
    d.sql.prepare('UPDATE content_revisions SET manifest_json = ?').run('{}');
    await assert.rejects(m.ensureRevision(d.db, seed), complete ? /Immutable bundled revision mismatch/ : /Bundled revision collision/);
    assert.equal(d.head(), head);
  });

  await t.test('aborted public readiness does not initiate writes',async t=>{
    const d=database(t),seed=syntheticSeed(),controller=new AbortController();controller.abort();
    const response=await m.createWorker(seed,{}).fetch(new Request('https://fixture.invalid/api/content/health',{signal:controller.signal}),{DB:d.db,VC_ACTIVE_DELIVERY:'0'});
    assert.equal(response.status,503);assert.equal(d.batches,0);assert.equal(d.count(),0);
  });
});
