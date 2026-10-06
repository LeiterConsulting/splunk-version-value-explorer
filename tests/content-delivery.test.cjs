const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const seed = JSON.parse(fs.readFileSync('dist/content-bundle.json', 'utf8'));
const clone = value => JSON.parse(JSON.stringify(value));
const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
function database() {
  const sql = new DatabaseSync(':memory:'); sql.exec('PRAGMA foreign_keys = ON');
  for (const file of fs.readdirSync('drizzle').filter(f => f.endsWith('.sql')).sort()) sql.exec(fs.readFileSync('drizzle/' + file, 'utf8'));
  let failure = false;
  const db = {
    prepare(query) {
      const statement = sql.prepare(query);
      const bound = args => ({ bind: (...next) => bound(next), async first() { return statement.get(...args) || null; }, async all() { return { results: statement.all(...args) }; }, async run() { return statement.run(...args); } });
      return bound([]);
    },
    async batch(statements) {
      sql.exec('BEGIN');
      try {
        if (failure) { failure = false; throw Error('Simulated interrupted import'); }
        const result = []; for (const statement of statements) result.push(await statement.run());
        sql.exec('COMMIT'); return result;
      } catch (e) { sql.exec('ROLLBACK'); throw e; }
    },
    interruptNextBatch() { failure = true; }, sql,
  };
  return db;
}
async function modules() {
  const store = await import(pathToFileURL(path.resolve('worker/content-store.mjs')));
  const source = ['content-store.mjs','publication-core.mjs','publisher.mjs','index.mjs'].map(file => fs.readFileSync('worker/' + file, 'utf8')).join('\n');
  const worker = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  return { ...store, ...worker };
}
test('canonical datasets and generated compatibility adapters preserve identical globals', () => {
  const c = { window: {} };
  for (const f of ['data.js','product-data.js','guidance-data.js','environment-data.js','editions-data.js','forwarders-data.js','soar-data.js']) vm.runInNewContext(fs.readFileSync('dist/' + f, 'utf8'), c);
  assert.deepEqual(clone(c.window), seed.globals);
  assert.equal(hash({ schemaVersion: 1, globals: seed.globals, catalog: seed.catalog }), seed.manifest.digest);
  assert.equal(seed.manifest.revision, 'content-' + hash({ digest: seed.manifest.digest, engineRevision: seed.manifest.engineRevision }).slice(0,24));
  assert.notEqual(hash({ digest: seed.manifest.digest, engineRevision: seed.manifest.engineRevision }), hash({ digest: seed.manifest.digest, engineRevision: 'engine-new-rules' }));
  assert.equal(new Set(seed.catalog.records.map(r => r.id)).size, seed.manifest.recordCount);
  for (const r of seed.catalog.records.filter(r => r.evidence)) {
    for (const e of r.evidence) assert(seed.catalog.records.some(s => s.id === e.sourceId && s.url === e.url));
    if (r.verification.date == null) assert.equal(r.verification.outcome, 'Claim verification not recorded');
  }
});
test('D1 projection stores complete records and preserves the whole content bundle', async () => {
  const m = await modules(), db = database();
  try {
    await Promise.all([m.ensureRevision(db, seed), m.ensureRevision(db, seed)]);
    assert.deepEqual(await m.readBundle(db, seed.manifest.revision), seed);
    assert.equal(db.sql.prepare('SELECT COUNT(*) AS count FROM content_records').get().count, seed.manifest.recordCount);
    assert.equal(db.sql.prepare('SELECT revision_id FROM content_publication').get().revision_id, seed.manifest.revision);
    const sources = await m.readRecords(db, seed.manifest.revision, 'source', 'sources', 0, 200);
    assert(sources.length > 0); assert(sources.every(r => r.kind === 'source'));
  } finally { db.sql.close(); }
});
test('interrupted imports never activate partial content and can resume idempotently', async () => {
  const m = await modules(), db = database();
  try {
    await m.ensureRevision(db, seed);
    const next = clone(seed); next.manifest.revision = 'content-' + '1'.repeat(24); next.manifest.digest = '1'.repeat(64);
    db.interruptNextBatch(); await assert.rejects(m.ensureRevision(db, next));
    assert.equal(await m.readBundle(db, next.manifest.revision), null);
    assert.equal(db.sql.prepare('SELECT revision_id FROM content_publication').get().revision_id, seed.manifest.revision);
    await m.ensureRevision(db, next); assert.deepEqual(await m.readBundle(db, next.manifest.revision), next);
    const collision = clone(next); collision.manifest.digest = '2'.repeat(64);
    await assert.rejects(m.ensureRevision(db, collision), /digest mismatch/);
  } finally { db.sql.close(); }
});
test('content API is read-only, validates filters and reports database failures', async () => {
  const m = await modules(), db = database(), worker = m.createWorker(seed, { '/index.html': { body: '<h1>VersionCompass</h1>', type: 'text/html' } });
  const get = (pathname, env = { DB: db }, method = 'GET') => worker.fetch(new Request('https://versioncompass.com' + pathname, { method }), env);
  try {
    assert.equal((await get('/')).status, 200);
    assert.equal((await get('/api/content/bundle', { DB: db }, 'POST')).status, 405);
    assert.equal((await get('/api/content/bundle?revision=latest')).status, 400);
    assert.equal((await get('/api/content/records?limit=201')).status, 400);
    assert.equal((await get('/api/content/records?kind=claim&kind=source')).status, 400);
    assert.equal((await get('/api/content/records?unknown=value')).status, 400);
    const response = await get('/api/content/bundle'); assert.deepEqual(await response.json(), seed);
    assert.equal(response.headers.get('X-VersionCompass-Content'), seed.manifest.revision);
    assert.equal((await get('/api/content/bundle?revision=content-' + '0'.repeat(24))).status, 404);
    assert.equal((await get('/api/content/health', {})).status, 503);
  } finally { db.sql.close(); }
});
async function client(bundle, { fail = false, expected = seed.manifest } = {}) {
  const c = { window: {}, document: { documentElement: { dataset: {} } }, AbortController, TextEncoder, Uint8Array, crypto: crypto.webcrypto, setTimeout, clearTimeout, fetch: async url => ({ ok: !fail, json: async () => url === 'content-manifest.json' ? expected : bundle }) };
  vm.runInNewContext(fs.readFileSync('dist/content-client.js', 'utf8'), c);
  const loaded = await c.window.VersionCompassContent.load(); return { c, loaded };
}
test('HTTP preview integrity checks agree with independent SHA-256 for Unicode and full bundles', () => {
  const c = { window: {}, TextEncoder, Uint8Array, Uint32Array, DataView }; vm.runInNewContext(fs.readFileSync('dist/content-hash.js', 'utf8'), c);
  for (const text of ['', 'abc', 'Splunk → Cloud ☁', JSON.stringify(seed)]) assert.equal(c.window.VersionCompassHash(text), crypto.createHash('sha256').update(text).digest('hex'));
});
test('client only adopts a complete pinned revision and falls back without partial assignment', async () => {
  const good = await client(seed); assert.equal(good.loaded, true); assert.deepEqual(clone(good.c.window.SPLUNK_DATA), seed.globals.SPLUNK_DATA);
  for (const mutation of [b => b.manifest.engineRevision = 'wrong-engine', b => b.globals.SPLUNK_DATA.enterprise.latest = 'unsupported', b => b.catalog.records.pop(), b => b.globals.extra = JSON.parse('{"__proto__":{}}')]) {
    const tampered = clone(seed); mutation(tampered); const bad = await client(tampered);
    assert.equal(bad.loaded, false); assert.equal(bad.c.window.SPLUNK_DATA, undefined); assert.equal(bad.c.window.VersionCompassContent.status, 'bundled-fallback');
  }
  assert.equal((await client(seed, { fail: true })).loaded, false);
});
test('active client switches the complete bundle and labels the bundled revision after failure', async () => {
  const next = clone(seed); next.globals.SPLUNK_DATA.deliveryFixture = 'synthetic active revision';
  next.manifest.digest = hash({ schemaVersion: 1, globals: next.globals, catalog: next.catalog });
  next.manifest.revision = 'content-' + hash({ digest: next.manifest.digest, engineRevision: next.manifest.engineRevision }).slice(0,24);
  async function run(fail) {
    const urls = [], c = { window: {}, document: { documentElement: { dataset: {} } }, AbortController, TextEncoder, Uint8Array, crypto: crypto.webcrypto, setTimeout, clearTimeout, fetch: async url => {
      urls.push(url);
      if (url === 'content-manifest.json') return { ok: true, headers: { get: () => '1' }, json: async () => seed.manifest };
      if (url.startsWith('/api/content/manifest?engine=')) return { ok: true, json: async () => next.manifest };
      return { ok: !fail, json: async () => next };
    } };
    vm.runInNewContext(fs.readFileSync('client/content-client-active.js', 'utf8'), c);
    return { c, urls, loaded: await c.window.VersionCompassContent.load() };
  }
  const good = await run(false); assert(good.loaded);
  assert.equal(good.c.window.VersionCompassContent.revision, next.manifest.revision);
  for (const key of Object.keys(seed.globals)) assert.deepEqual(clone(good.c.window[key]), next.globals[key]);
  assert.equal(good.urls[2], '/api/content/bundle?revision=' + next.manifest.revision);
  const bad = await run(true); assert(!bad.loaded);
  assert.equal(bad.c.window.SPLUNK_DATA, undefined);
  assert.equal(bad.c.window.VersionCompassContent.revision, seed.manifest.revision);
  assert.equal(bad.c.window.VersionCompassContent.engineRevision, seed.manifest.engineRevision);
  assert.equal(bad.c.document.documentElement.dataset.contentRevision, seed.manifest.revision);
});
test('database transport preserves representative comparisons and exact scope qualifications', async () => {
  const m = await modules(), db = database();
  try {
    await m.ensureRevision(db, seed); const published = await m.readBundle(db, seed.manifest.revision);
    function engines(globals) { const c = { window: clone(globals), URLSearchParams }; for (const f of ['comparison.js','forwarders.js','soar.js']) vm.runInNewContext(fs.readFileSync('dist/' + f, 'utf8'), c); return c.window; }
    const old = engines(seed.globals), live = engines(published.globals);
    for (const deployment of ['cmp', 'cloud']) for (const compliance of ['commercial', 'fr-m', 'fr-h']) {
      const state = { ...old.VersionCompassSOAR.defaults, deployment, compliance };
      assert.deepEqual(clone(live.VersionCompassSOAR.assess(state)), clone(old.VersionCompassSOAR.assess(state)));
    }
    for (const state of [
      { product: 'platform', platform: 'enterprise', from: '9.4', to: '10.6' },
      { product: 'platform', platform: 'cloud', from: '9.2.2406', to: '10.5.2605' },
      { product: 'es', platform: 'enterprise', from: '7.3', to: '8.7', host: '9.4' },
      { product: 'itsi', platform: 'cloud', from: '4.20', to: '5.0', host: '10.5.2605' },
    ]) {
      const a = old.VersionCompassComparison.create(old.SPLUNK_DATA, state), b = live.VersionCompassComparison.create(live.SPLUNK_DATA, state);
      for (const method of ['selectedPath','selectedFeatures','selectedTechnicalChanges']) assert.deepEqual(clone(a[method]()), clone(b[method]()));
    }
  } finally { db.sql.close(); }
});
