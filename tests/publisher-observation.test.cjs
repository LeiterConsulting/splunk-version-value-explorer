const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');
const admin = 'a'.repeat(64); // Synthetic fixture only.
const seed = { manifest: { revision: 'content-' + '1'.repeat(24), engineRevision: 'engine-' + '2'.repeat(20), digest: '3'.repeat(64), schemaVersion: 1, recordCount: 2 } };
let modules, originalFetch, networkAttempts = 0;
before(async () => {
  originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { networkAttempts++; throw Error('Unexpected network request'); };
  modules = await import('data:text/javascript;base64,' + Buffer.from(['publication-core.mjs', 'content-store.mjs', 'publisher.mjs', 'index.mjs'].map(file => fs.readFileSync('worker/' + file, 'utf8').replace(/^import .*publication-core\.mjs';\n/, '')).join('\n')).toString('base64'));
});
after(() => { globalThis.fetch = originalFetch; assert.equal(networkAttempts, 0); });
function database(t, schema = true) {
  const sql = new DatabaseSync(':memory:');
  t.after(() => sql.close());
  sql.exec('PRAGMA foreign_keys = ON');
  if (schema) for (const file of fs.readdirSync('drizzle').filter(f => f.endsWith('.sql')).sort()) sql.exec(fs.readFileSync('drizzle/' + file, 'utf8'));
  const queries = [];
  return { sql, queries, prepare(query) {
    assert.match(query, /^SELECT\s/);
    assert.doesNotMatch(query, /bundle_json|manifest_json|payload_json/);
    queries.push(query);
    const statement = sql.prepare(query);
    const bound = args => ({ bind: (...next) => bound(next), async first() { return statement.get(...args) || null; } });
    return bound([]);
  } };
}
function revision(db, id = seed.manifest.revision, changes = {}) {
  const m = { ...seed.manifest, ...changes };
  db.sql.prepare('INSERT INTO content_revisions VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(id, m.engineRevision, m.schemaVersion, m.digest, 'PRIVATE MANIFEST', 'PRIVATE BUNDLE', m.recordCount, changes.completed ?? 1);
}
function records(db, count = 2, id = seed.manifest.revision) {
  for (let i = 0; i < count; i++) db.sql.prepare('INSERT INTO content_records VALUES (?, ?, ?, ?, ?)').run(id, 'synthetic-' + i, 'fixture', 'fixture', 'PRIVATE PAYLOAD');
}
function head(db, id = seed.manifest.revision) { db.sql.prepare('INSERT INTO content_publication VALUES (?, ?)').run('engine:' + seed.manifest.engineRevision, id); }
function request(db, { path = '/api/publisher/observe-seed', method = 'GET', headers = {}, active = '0', descriptor = seed } = {}) {
  return modules.createWorker(descriptor, { '/content-manifest.json': { body: 'static fixture', type: 'application/json' } }).fetch(new Request('https://versioncompass.com' + path, { method, headers: { Authorization: 'Bearer ' + admin, ...headers } }), { DB: db, VC_PUBLISHER_TOKEN: admin, VC_ACTIVE_DELIVERY: active });
}
async function observe(db, options) {
  const changes = db.sql.prepare('SELECT total_changes() AS n').get().n;
  db.sql.exec('PRAGMA query_only = ON');
  try {
    const response = await request(db, options);
    const text = await response.text();
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert(text.length < 1000);
    assert.doesNotMatch(text, /PRIVATE|SELECT|Bearer|fixture|"ready"/);
    assert.equal(db.sql.prepare('SELECT total_changes() AS n').get().n, changes);
    assert(db.queries.length <= 3);
    return { status: response.status, body: JSON.parse(text) };
  } finally { db.sql.exec('PRAGMA query_only = OFF'); }
}
test('observation authentication and existing strict guards precede all database access', async () => {
  let accesses = 0;
  const db = { prepare() { accesses++; throw Error('Unexpected database access'); } };
  for (const headers of [{ Authorization: '' }, { Authorization: 'Bearer ' + 'c'.repeat(16008) }, { Authorization: 'Bearer ' + 'c'.repeat(64) }, { Authorization: '', 'OAI-Sites-Authorization': 'Bearer platform-only' }, { Authorization: '', 'oai-authenticated-user-email': 'fixture@example.invalid' }]) {
    const response = await request(db, { headers });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'Publisher authorization required' });
  }
  for (const options of [{ method: 'HEAD' }, { method: 'POST' }, { method: 'OPTIONS' }, { method: 'DELETE' }]) {
    const response = await request(db, options); assert.equal(response.status, 405); assert.equal(response.headers.get('allow'), 'GET');
  }
  for (const options of [{ path: '/api/publisher/observe-seed?%00=%FF' }, { path: '/api/publisher/observe-seed?revision=x' }, { path: '/api/publisher/observe-seed?x=1&x=2' }, { headers: { Origin: 'https://foreign.example' } }, { headers: { Origin: 'null' } }, { headers: { Origin: 'https://versioncompass.com,https://foreign.example' } }]) assert.equal((await request(db, options)).status, 400);
  assert.equal((await request(db, { path: '/api/publisher/observe-seed/' })).status, 404);
  assert.equal(accesses, 0);
});
test('missing binding, schema and database failures are qualified and redacted', async t => {
  let response = await request(undefined);
  assert.equal(response.status, 503); assert.equal((await response.json()).reason, 'missing-database-binding');
  const db = database(t, false);
  const result = await observe(db);
  assert.equal(result.status, 503); assert.equal(result.body.database, 'select-succeeded'); assert.equal(result.body.projection, 'unavailable');
  for (const failAt of [1, 2, 3]) {
    let count = 0;
    const bad = { prepare() { if (++count === failAt) throw Error('PRIVATE SQL credentials'); return { first: async () => null, bind() { return this; } }; } };
    response = await request(bad); assert.equal(response.status, 503); assert.doesNotMatch(await response.text(), /PRIVATE|SQL|credentials/);
  }
});
test('invalid trusted descriptors stop before database access', async () => {
  const db = { prepare() { assert.fail('No database access'); } };
  for (const manifest of [null, { ...seed.manifest, recordCount: 10001 }, { ...seed.manifest, revision: 'unsafe' }]) {
    const response = await request(db, { descriptor: { manifest } });
    assert.equal(response.status, 503); assert.equal((await response.json()).reason, 'invalid-bundled-descriptor');
  }
});
test('missing seed stays missing with active delivery off or on; no seeding side effects', async t => {
  for (const active of ['0', '1']) {
    const db = database(t), result = await observe(db, { active });
    assert.equal(result.status, 200); assert.equal(result.body.status, 'observation-returned'); assert.equal(result.body.seed, 'missing'); assert.equal(result.body.head, 'absent');
    assert.equal(db.sql.prepare('SELECT count(*) AS n FROM content_revisions').get().n, 0);
    assert.equal(db.sql.prepare('SELECT count(*) AS n FROM content_publication').get().n, 0);
  }
});
test('seed completion, metadata mismatch, bounded counts and overflow are observations not readiness', async t => {
  for (const [changes, count, expected] of [[{}, 2, 'marked-complete-count-consistent'], [{ completed: 0 }, 1, 'incomplete'], [{}, 1, 'inconsistent'], [{}, 30, 'inconsistent'], [{ digest: 'PRIVATE' }, 2, 'inconsistent'], [{ completed: 7 }, 2, 'inconsistent'], [{ recordCount: 'PRIVATE' }, 2, 'inconsistent'], [{ schemaVersion: 9 }, 2, 'inconsistent'], [{ engineRevision: 'PRIVATE' }, 2, 'inconsistent']]) {
    const db = database(t); revision(db, undefined, changes); records(db, count); head(db);
    const result = await observe(db, { headers: { Origin: 'https://versioncompass.com' } });
    assert.equal(result.status, 200); assert.equal(result.body.seed, expected); assert.equal(result.body.observedRecordCount, Math.min(count, 3)); assert.equal(result.body.recordCountOverflow, count > 2);
    assert.equal(result.body.validation, 'metadata-and-count-only');
    assert.equal(result.body.readiness, 'not-assessed'); assert.equal(result.body.integrity, 'not-validated');
    assert.equal(db.queries.filter(q => q.includes('count(*)')).length, 1);
    assert.match(db.queries[2], /revision_id = \? LIMIT \?/);
  }
});
test('alternate heads are bounded metadata only, never scanned or leaked as free text', async t => {
  for (const id of ['content-' + '4'.repeat(24), 'PRIVATE'.repeat(1000), 'x'.repeat(32)]) {
    const db = database(t); revision(db); records(db); revision(db, id); head(db, id);
    const result = await observe(db);
    assert.equal(result.body.head, id.startsWith('content-') ? 'alternate-metadata-only' : 'inconsistent');
    assert.equal(result.body.headRevision, id.startsWith('content-') ? id : undefined);
    assert.doesNotMatch(db.queries[2], /revision_id = p\.revision_id/);
  }
});
test('legacy publisher head and public unknown/static routes retain their behavior', async t => {
  const db = database(t);
  const response = await request(db, { path: '/api/publisher/head' });
  assert.equal(response.status, 409); assert.equal((await response.json()).reason, 'initial-publication-required');
  const forbidden = { prepare() { assert.fail('No database access'); } };
  assert.equal((await request(forbidden, { path: '/api/content/observe-seed' })).status, 404);
  assert.equal((await request(forbidden, { path: '/api/content/manifest', method: 'POST' })).status, 405);
  const asset = await request(forbidden, { path: '/content-manifest.json' }); assert.equal(asset.status, 200); assert.equal(await asset.text(), 'static fixture');
});
test('orphan records and broken/incomplete head metadata are qualified, not repaired', async t => {
  for (const state of ['orphan', 'dangling', 'incomplete', 'wrong-engine']) {
    const db = database(t);
    db.sql.exec('PRAGMA foreign_keys = OFF');
    if (state === 'orphan') records(db, 1);
    else {
      const id = 'content-' + '5'.repeat(24);
      if (state !== 'dangling') revision(db, id, state === 'incomplete' ? { completed: 0 } : { engineRevision: 'engine-' + '6'.repeat(20) });
      head(db, id);
    }
    const result = await observe(db);
    assert.equal(result.status, 200);
    assert.equal(result.body.seed, state === 'orphan' ? 'missing-with-records' : 'missing');
    assert.equal(result.body.head, state === 'orphan' ? 'absent' : 'inconsistent');
  }
});
