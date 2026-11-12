const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const seed = JSON.parse(fs.readFileSync('dist/content-bundle.json', 'utf8'));
const clone = value => JSON.parse(JSON.stringify(value));
const admin = 'a'.repeat(64); // Isolated fixture credential, never a runtime secret.
const modules = () => import('data:text/javascript;base64,' + Buffer.from(['publication-core.mjs','content-store.mjs','publisher.mjs','index.mjs'].map(file => fs.readFileSync('worker/' + file, 'utf8').replace(/^import .*publication-core\.mjs';\n/, '')).join('\n')).toString('base64'));
function database(t) {
  const sql = new DatabaseSync(':memory:'); sql.exec('PRAGMA foreign_keys = ON');
  for (const file of fs.readdirSync('drizzle').filter(file => file.endsWith('.sql')).sort()) sql.exec(fs.readFileSync('drizzle/' + file, 'utf8'));
  t.after(() => sql.close()); let fail = false;
  return { sql, fail() { fail = true; }, prepare(query) {
    const statement = sql.prepare(query);
    const bound = args => ({ bind: (...next) => bound(next), async first() { return statement.get(...args) || null; }, async all() { return { results: statement.all(...args) }; }, async run() { return statement.run(...args); } });
    return bound([]);
  }, async batch(statements) {
    sql.exec('BEGIN');
    try { const values = []; for (const statement of statements) { values.push(await statement.run()); if (fail) { fail = false; throw Error('Interrupted batch'); } } sql.exec('COMMIT'); return values; }
    catch (error) { sql.exec('ROLLBACK'); throw error; }
  } };
}
const candidate = { repository: 'LeiterConsulting/splunk-version-value-explorer', commit: 'b'.repeat(40), bundle: seed };
async function evidence(url) {
  const m = await modules(); let value;
  if (url.includes('/compare/')) value = { status: 'identical', base_commit: { sha: candidate.commit }, merge_base_commit: { sha: candidate.commit } };
  else if (url.includes('/actions/runs?')) value = { workflow_runs: [{ id: 77, head_sha: candidate.commit, head_branch: 'main', event: 'push', path: '.github/workflows/validate.yml', repository: { full_name: candidate.repository }, status: 'completed', conclusion: 'success' }] };
  else if (url.includes('/jobs?')) value = { jobs: [{ name: 'validate', status: 'completed', conclusion: 'success', steps: m.REQUIRED_STEPS.map(name => ({ name: 'Run ' + name, status: 'completed', conclusion: 'success' })) }] };
  else value = url.endsWith('/content/publication.json') ? seed.manifest : seed;
  return new Response(JSON.stringify(value));
}
test('publisher rejects absent, wrong and platform-only credentials before database access', async () => {
  const worker = (await modules()).createWorker(seed, {});
  for (const headers of [{}, { Authorization: 'Bearer ' + 'c'.repeat(64) }, { 'OAI-Sites-Authorization': 'Bearer platform-service-token' }, { 'oai-authenticated-user-email': 'chrisleiter@gmail.com' }]) {
    const response = await worker.fetch(new Request('https://versioncompass.com/api/publisher/stage', { method: 'POST', headers, body: '{}' }), { VC_PUBLISHER_TOKEN: admin });
    assert.equal(response.status, 401); assert(!JSON.stringify(await response.json()).includes(admin));
  }
  assert.equal((await worker.fetch(new Request('https://versioncompass.com/api/publisher/head', { headers: { Authorization: 'Bearer ' + admin } }), {})).status, 401);
});
test('authenticated publisher bounds method, origin, parameters, JSON and activation', async () => {
  const worker = (await modules()).createWorker(seed, {}), env = { VC_PUBLISHER_TOKEN: admin };
  const request = (route, options = {}) => worker.fetch(new Request('https://versioncompass.com/api/publisher/' + route, { ...options, headers: { Authorization: 'Bearer ' + admin, ...(options.headers || {}) } }), env);
  assert.equal((await request('unknown')).status, 404);
  assert.equal((await request('stage')).status, 405);
  assert.equal((await request('stage?revision=x', { method: 'POST', body: '{}' })).status, 400);
  assert.equal((await request('stage', { method: 'POST', headers: { Origin: 'https://untrusted.example', 'Content-Type': 'application/json' }, body: '{}' })).status, 400);
  assert.equal((await request('stage', { method: 'POST', body: '{}' })).status, 400);
  assert.equal((await request('stage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
  assert.equal((await request('stage', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': String(9 * 1024 * 1024) }, body: '{}' })).status, 400);
  assert.equal((await request('activate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 423);
});
test('managed migration and verified bootstrap are additive, idempotent and auditable', async t => {
  const m = await modules(), db = database(t), op = 'pub-' + '1'.repeat(32);
  await m.ensureRevision(db, seed);
  const before = db.sql.prepare('SELECT bundle_json FROM content_revisions').get().bundle_json;
  const result = await m.bootstrapPublication(db, candidate, op, seed, { fetcher: evidence });
  assert.equal(result.generation, 1); assert.equal(result.revision, seed.manifest.revision);
  await m.bootstrapPublication(db, candidate, op, seed, { fetcher: evidence });
  assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM content_publication_events').get().n, 1);
  assert.equal(db.sql.prepare('SELECT commit_sha FROM content_publication_provenance').get().commit_sha, candidate.commit);
  assert.equal(db.sql.prepare('SELECT bundle_json FROM content_revisions').get().bundle_json, before);
  assert.throws(() => db.sql.exec("UPDATE content_publication_events SET generation = 0"), /CHECK/);
});
test('authenticated fresh-engine head reports only the explicit initialization gate', async t => {
  const db = database(t), worker = (await modules()).createWorker(seed, {});
  const response = await worker.fetch(new Request('https://versioncompass.com/api/publisher/head', { headers: { Authorization: 'Bearer ' + admin } }), { DB: db, VC_PUBLISHER_TOKEN: admin });
  assert.equal(response.status, 409);
  assert.equal((await response.json()).reason, 'initial-publication-required');
  assert.equal(db.sql.prepare('SELECT COUNT(*) AS count FROM content_publication').get().count, 0);
});
test('bootstrap rejects a different seed and existing publisher heads without overwriting', async t => {
  const m = await modules(), db = database(t);
  await m.ensureRevision(db, seed);
  await assert.rejects(m.bootstrapPublication(db, { ...candidate, bundle: { manifest: { revision: 'content-' + '0'.repeat(24) } } }, 'pub-' + '2'.repeat(32), seed, { fetcher: evidence }), /deployment seed/);
  const other = clone(seed); other.globals.SPLUNK_DATA.publisherFixture = 'other'; other.manifest.digest = await m.sha256({schemaVersion:1,globals:other.globals,catalog:other.catalog}); other.manifest.revision = 'content-' + (await m.sha256({digest:other.manifest.digest,engineRevision:other.manifest.engineRevision,datasetHashes:other.manifest.datasetHashes})).slice(0,24);
  await m.ensureRevision(db, other);
  // A deployment seed import cannot replace even a legacy complete pointer.
  assert.equal((await m.readPublicationHead(db, seed.manifest.engineRevision)).revision, seed.manifest.revision);
  db.sql.prepare('UPDATE content_publication SET revision_id = ?').run(other.manifest.revision);
  await assert.rejects(m.bootstrapPublication(db, candidate, 'pub-' + '4'.repeat(32), seed, { fetcher: evidence }), /conflicts/);
  assert.equal((await m.readPublicationHead(db, seed.manifest.engineRevision)).revision, other.manifest.revision);
  assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM content_publication_events').get().n, 0);
});
test('public active reads stay engine-scoped and deployment-pinned reads stay exact', async t => {
  const m = await modules(), db = database(t), worker = m.createWorker(seed, { '/content-manifest.json': { body: JSON.stringify(seed.manifest), type: 'application/json' } });
  await m.ensureRevision(db, seed);
  const next = clone(seed); next.globals.SPLUNK_DATA.publisherFixture = 'next'; next.manifest.digest = await m.sha256({schemaVersion:1,globals:next.globals,catalog:next.catalog}); next.manifest.revision = 'content-' + (await m.sha256({digest:next.manifest.digest,engineRevision:next.manifest.engineRevision,datasetHashes:next.manifest.datasetHashes})).slice(0,24);
  await m.ensureRevision(db, next); db.sql.prepare('UPDATE content_publication SET revision_id = ?').run(next.manifest.revision);
  db.sql.prepare('INSERT INTO content_publication_provenance VALUES (?, ?, ?, ?, ?)').run(next.manifest.revision, candidate.repository, candidate.commit, 77, new Date().toISOString());
  db.sql.prepare('INSERT INTO content_publication_events VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run('pub-' + '5'.repeat(32), 'engine:' + seed.manifest.engineRevision, 1, seed.manifest.revision, next.manifest.revision, candidate.commit, 'publish', new Date().toISOString());
  const get = (route, enabled) => worker.fetch(new Request('https://versioncompass.com' + route), { DB: db, VC_ACTIVE_DELIVERY: enabled ? '1' : '0' });
  assert.equal((await (await get('/api/content/manifest', false)).json()).revision, seed.manifest.revision);
  assert.equal((await (await get('/api/content/manifest', true)).json()).revision, next.manifest.revision);
  assert.equal((await (await get('/api/content/bundle?revision=' + seed.manifest.revision, true)).json()).manifest.revision, seed.manifest.revision);
  assert.equal((await get('/api/content/manifest?engine=engine-' + '0'.repeat(20), true)).status, 409);
  assert.equal((await get('/content-manifest.json', false)).headers.get('X-VersionCompass-Active-Delivery'), null);
  assert.equal((await get('/content-manifest.json', true)).headers.get('X-VersionCompass-Active-Delivery'), '1');
});
let signing;
async function signedToken(changes = {}) {
  signing ||= await crypto.webcrypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1,0,1]), hash: 'SHA-256' }, true, ['sign','verify']);
  const now = Math.floor(Date.now() / 1000);
  const claims = { iss: 'https://token.actions.githubusercontent.com', aud: 'https://versioncompass.com', sub: 'repo:LeiterConsulting@152733483/splunk-version-value-explorer@1366223729:ref:refs/heads/main', repository: candidate.repository, repository_id: '1366223729', repository_owner_id: '152733483', repository_visibility: 'public', ref: 'refs/heads/main', ref_type: 'branch', workflow_ref: candidate.repository + '/.github/workflows/publish-content.yml@refs/heads/main', runner_environment: 'github-hosted', event_name: 'workflow_run', sha: candidate.commit, iat: now, nbf: now - 1, exp: now + 300, ...changes };
  const encoded = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const body = encoded({ alg: 'RS256', typ: 'JWT', kid: 'test-key' }) + '.' + encoded(claims);
  const signature = await crypto.webcrypto.subtle.sign('RSASSA-PKCS1-v1_5', signing.privateKey, Buffer.from(body));
  return { token: body + '.' + Buffer.from(signature).toString('base64url'), jwks: { keys: [{ ...await crypto.webcrypto.subtle.exportKey('jwk', signing.publicKey), kid: 'test-key', use: 'sig', alg: 'RS256' }] } };
}
test('GitHub publisher identity verifies RSA signature and exact immutable workflow scope', async () => {
  const m = await modules(), { token, jwks } = await signedToken();
  let called = 0;
  const fetcher = async (url, options) => { called++; assert.equal(url, 'https://token.actions.githubusercontent.com/.well-known/jwks'); assert.equal(options.redirect, 'manual'); assert.equal(options.headers, undefined); return new Response(JSON.stringify(jwks)); };
  assert.deepEqual(await m.verifyPublisherOIDC(token, { fetcher }), { type: 'github-oidc', commit: candidate.commit }); assert.equal(called, 1);
  for (const changed of [{ repository_id: '1' }, { repository_owner_id: '1' }, { repository: 'other/repo' }, { aud: 'https://other.example' }, { workflow_ref: 'other' }, { ref: 'refs/pull/10/merge' }, { sub: 'repo:any:environment:prod' }, { exp: 1 }, { event_name: 'pull_request' }, { runner_environment: 'self-hosted' }, { repository_visibility: 'private' }, { sha: 'main' }]) {
    const bad = await signedToken(changed); await assert.rejects(m.verifyPublisherOIDC(bad.token, { fetcher }), /identity/);
  }
  const tampered = token.split('.'); tampered[2] = Buffer.alloc(256).toString('base64url');
  await assert.rejects(m.verifyPublisherOIDC(tampered.join('.'), { fetcher }), /signature/);
});
test('GitHub publisher rejects unavailable, oversized and unknown signing-key evidence', async () => {
  const m = await modules(), { token } = await signedToken();
  await assert.rejects(m.verifyPublisherOIDC(token, { fetcher: async () => new Response('', { status: 503 }) }), /unavailable/);
  await assert.rejects(m.verifyPublisherOIDC(token, { fetcher: async () => new Response(' '.repeat(129 * 1024)) }), /limit/);
  await assert.rejects(m.verifyPublisherOIDC(token, { fetcher: async () => new Response('{"keys":[]}') }), /signing key/);
  await assert.rejects(m.verifyPublisherOIDC(token, { fetcher: async () => { throw Error('private network diagnostic'); } }), /^Error: Publisher identity unavailable$/);
  await assert.rejects(m.verifyPublisherOIDC(token, { fetcher: async () => new Response('not-json') }), /^Error: Invalid signing key document$/);
  await assert.rejects(m.verifyPublisherOIDC(token, { fetcher: async (url, options) => { assert.equal(options.redirect, 'manual'); return new Response('', { status: 302, headers: { Location: 'https://untrusted.example' } }); } }), /unavailable \(HTTP 302\)/);
  const invalid = token.split('.'); invalid[0] = Buffer.from('not-json').toString('base64url');
  await assert.rejects(m.verifyPublisherOIDC(invalid.join('.'), { fetcher: async () => { throw Error('must not fetch'); } }), /^Error: Invalid token$/);
});
test('publisher CLI rejects malformed commits before reading credentials or contacting the Site', () => {
  const result = require('node:child_process').spawnSync(process.execPath, ['scripts/publish-content.mjs','--commit','main'], { encoding: 'utf8' });
  assert.equal(result.status, 1); assert.match(result.stderr, /Usage:/); assert.equal(result.stdout, '');
});
test('default verifier fetch preserves the Worker global receiver', async () => {
  const m = await modules(), { token, jwks } = await signedToken();
  const original = globalThis.fetch;
  globalThis.fetch = async function(url) {
    assert.equal(this, globalThis);
    return url.includes('/.well-known/jwks') ? new Response(JSON.stringify(jwks)) : evidence(url);
  };
  try {
    assert.equal((await m.verifyPublisherOIDC(token)).commit, candidate.commit);
    assert.equal((await m.verifyRepositoryPublication(candidate, { engineRevision: seed.manifest.engineRevision })).provenance.commit, candidate.commit);
  } finally { globalThis.fetch = original; }
});
test('workflow evidence credential reaches only fixed repository API and never immutable data', async t => {
  const m = await modules(), db = database(t), token = 'ghs_' + 'e'.repeat(36), calls = [];
  const wrapped = m.publisherEvidenceRequest({ publication: candidate, evidenceCredential: token }, { type: 'github-oidc' }, async (url, options) => {
    calls.push(url); assert.equal(options.redirect, 'manual');
    if (new URL(url).hostname === 'api.github.com') assert.equal(options.headers.Authorization, 'Bearer ' + token);
    else assert.equal(options.headers.Authorization, undefined);
    return evidence(url);
  });
  const result = await m.stagePublication(db, wrapped.input, { engineRevision: seed.manifest.engineRevision, fetcher: wrapped.fetcher });
  assert.equal(calls.length, 5); assert(!JSON.stringify(result).includes(token));
  assert(!JSON.stringify(db.sql.prepare('SELECT * FROM content_revisions').all()).includes(token));
  assert(!JSON.stringify(db.sql.prepare('SELECT * FROM content_publication_provenance').all()).includes(token));
  for (const url of ['https://untrusted.example/repo', 'https://api.github.com/repos/other/repo/actions/runs', 'https://api.github.com/repos/' + candidate.repository + '/../../other/repo', 'https://raw.githubusercontent.com/other/repo/main/file', 'http://api.github.com/repos/' + candidate.repository + '/actions/runs']) {
    assert.throws(() => wrapped.fetcher(url, { headers: {}, redirect: 'manual' }), /Untrusted evidence origin/);
  }
  assert.equal(calls.length, 5);
  for (const bad of [{ publication: candidate, evidenceCredential: 'bad' }, { publication: candidate, evidenceCredential: token, extra: true }])
    assert.throws(() => m.publisherEvidenceRequest(bad, { type: 'github-oidc' }), /Invalid evidence credential/);
  assert.throws(() => m.publisherEvidenceRequest({ publication: candidate, evidenceCredential: token }, { type: 'maintenance-secret' }), /Invalid evidence credential/);
});
test('workflow evidence accepts long standard bearer tokens and rejects header injection or excess bytes', async () => {
  const m = await modules(), token = 'ghs_' + 'a'.repeat(300) + '.b-c_+/' + 'd'.repeat(300) + '==';
  let seen;
  const wrapped = m.publisherEvidenceRequest({ publication: candidate, evidenceCredential: token }, { type: 'github-oidc' }, async (url, options) => { seen = options.headers.Authorization; return new Response('{}'); });
  await wrapped.fetcher('https://api.github.com/repos/' + candidate.repository + '/actions/runs', { headers: {} });
  assert.equal(seen, 'Bearer ' + token);
  for (const bad of [token + '\r\nInjected: header', 'a'.repeat(8193), 'short', token + ' '])
    assert.throws(() => m.publisherEvidenceRequest({ publication: candidate, evidenceCredential: bad }, { type: 'github-oidc' }), /Invalid evidence credential/);
});

test('validated snapshot controls stay active while the database reader remains isolated', async () => {
  const m = await modules(), worker = m.createWorker(seed, {
    '/navigation.js': {type:'text/javascript',body:'validated snapshot guard'},
    '/content-client.js': {type:'text/javascript',body:'pinned reader'},
    '/content-client-active.js': {type:'text/javascript',body:'prepared reader'},
  });
  for (const [flag, reader] of [['0','pinned reader'],['1','prepared reader']]) {
    const env={VC_ACTIVE_DELIVERY:flag};
    assert.equal(await (await worker.fetch(new Request('https://versioncompass.com/navigation.js'),env)).text(),'validated snapshot guard');
    assert.equal(await (await worker.fetch(new Request('https://versioncompass.com/content-client.js'),env)).text(),reader);
  }
});

test('offline stage-only uses real immutable staging without creating a head or history, including lost response', async t => {
  const m = await modules(), { stageOnly } = await import('../scripts/lib/publication-orchestration.mjs');
  for (const outcome of ['success', 'batch-failure', 'lost-response']) {
    const db = database(t), calls = [];
    if (outcome === 'batch-failure') db.fail();
    const result = await stageOnly({ candidate, expectedCommit: candidate.commit, deployedEngine: seed.manifest.engineRevision,
      call: async (route, body) => {
        calls.push(route); assert.equal(route, 'stage');
        const value = await m.stagePublication(db, body, { engineRevision: seed.manifest.engineRevision, fetcher: evidence });
        if (outcome === 'lost-response') throw Error('Synthetic transport loss after committed stage');
        return value;
      } });
    assert.deepEqual(calls, ['stage']);
    assert.equal(result.status, outcome === 'success' ? 'staged-only' : 'failed');
    if (outcome !== 'success') assert.equal(result.mutationOutcome, 'uncertain-read-back-before-retry');
    assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM content_publication').get().n, 0);
    assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM content_publication_events').get().n, 0);
    if (outcome !== 'batch-failure') assert.equal(db.sql.prepare('SELECT completed FROM content_revisions').get().completed, 1);
  }
});
test('offline explicit bootstrap uses real seed verification and stops on rejected or lost responses without retry', async t => {
  const m = await modules(), { bootstrapOnly } = await import('../scripts/lib/publication-orchestration.mjs');
  for (const outcome of ['success', 'batch-failure', 'lost-response']) {
    const db = database(t), calls = [];
    if (outcome === 'batch-failure') db.fail();
    const result = await bootstrapOnly({ candidate, expectedCommit: candidate.commit, deployedEngine: seed.manifest.engineRevision, deployedSeedRevision: seed.manifest.revision,
      call: async (route, body) => {
        calls.push(route); assert.equal(route, 'bootstrap');
        const value = await m.bootstrapPublication(db, body.candidate, body.operationId, seed, { fetcher: evidence });
        if (outcome === 'lost-response') throw Error('Synthetic response parsing loss after committed bootstrap');
        return value;
      } });
    assert.deepEqual(calls, ['bootstrap']);
    assert.equal(result.status, outcome === 'success' ? 'bootstrap-reported' : 'failed');
    if (outcome !== 'success') assert.equal(result.mutationOutcome, 'uncertain-read-back-before-retry');
    assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM content_publication_events').get().n, outcome === 'batch-failure' ? 0 : 1);
  }
});
test('offline advance refuses real missing or generation-zero head before any stage', async t => {
  const m = await modules(), { advance } = await import('../scripts/lib/publication-orchestration.mjs');
  for (const legacy of [false, true]) {
    const db = database(t), calls = [];
    if (legacy) await m.ensureRevision(db, seed);
    const changes = db.sql.prepare('SELECT total_changes() AS n').get().n;
    const result = await advance({ candidate, expectedCommit: candidate.commit, deployedEngine: seed.manifest.engineRevision,
      call: async route => { calls.push(route); assert.equal(route, 'head'); return { ...await m.readPublicationHead(db, seed.manifest.engineRevision), engineRevision: seed.manifest.engineRevision, activeDelivery: true }; } });
    assert.equal(result.status, 'failed'); assert.deepEqual(calls, ['head']);
    assert.equal(db.sql.prepare('SELECT total_changes() AS n').get().n, changes);
  }
});
test('offline advance exercises real CAS activation failure and uncertain committed activation without retries', async t => {
  const m = await modules(), { advance } = await import('../scripts/lib/publication-orchestration.mjs');
  const next = clone(seed); next.globals.SPLUNK_DATA.publisherFixture = 'offline-advance';
  next.manifest.digest = await m.sha256({ schemaVersion: 1, globals: next.globals, catalog: next.catalog });
  next.manifest.revision = 'content-' + (await m.sha256({ digest: next.manifest.digest, engineRevision: next.manifest.engineRevision, datasetHashes: next.manifest.datasetHashes })).slice(0, 24);
  const nextEvidence = url => url.startsWith('https://raw.githubusercontent.com/') ? Promise.resolve(new Response(JSON.stringify(url.endsWith('/content/publication.json') ? next.manifest : next))) : evidence(url);
  for (const outcome of ['success', 'batch-failure', 'lost-response']) {
    const db = database(t), calls = [];
    await m.bootstrapPublication(db, candidate, 'pub-' + '7'.repeat(32), seed, { fetcher: evidence });
    const result = await advance({ candidate: { ...candidate, bundle: next }, expectedCommit: candidate.commit, deployedEngine: seed.manifest.engineRevision,
      call: async (route, body) => {
        calls.push(route);
        if (route === 'head') return { ...await m.readPublicationHead(db, seed.manifest.engineRevision), engineRevision: seed.manifest.engineRevision, activeDelivery: true };
        if (route === 'stage') return m.stagePublication(db, body, { engineRevision: seed.manifest.engineRevision, fetcher: nextEvidence });
        assert.equal(route, 'activate'); if (outcome === 'batch-failure') db.fail();
        const value = await m.activatePublication(db, body, { engineRevision: seed.manifest.engineRevision });
        if (outcome === 'lost-response') throw Error('Synthetic transport loss after committed activation');
        return value;
      } });
    assert.deepEqual(calls, ['head', 'stage', 'activate']);
    assert.equal(result.status, outcome === 'success' ? 'activation-reported' : 'failed');
    if (outcome !== 'success') assert.equal(result.mutationOutcome, 'uncertain-read-back-before-retry');
    const final = await m.readPublicationHead(db, seed.manifest.engineRevision);
    assert.equal(final.revision, outcome === 'batch-failure' ? seed.manifest.revision : next.manifest.revision);
    assert.equal(final.generation, outcome === 'batch-failure' ? 1 : 2);
  }
});

test('known conflicting complete or incomplete raw pointers reject before staging', async t => {
  const m = await modules();
  for (const complete of [0, 1]) {
    const db = database(t), other = clone(seed);
    other.globals.SPLUNK_DATA.publisherFixture = 'preflight-conflict';
    other.manifest.digest = await m.sha256({schemaVersion:1,globals:other.globals,catalog:other.catalog});
    other.manifest.revision = 'content-' + (await m.sha256({digest:other.manifest.digest,engineRevision:other.manifest.engineRevision,datasetHashes:other.manifest.datasetHashes})).slice(0,24);
    await m.ensureRevision(db, other);
    db.sql.prepare('UPDATE content_revisions SET completed = ?').run(complete);
    if (complete) {
      db.sql.prepare('INSERT INTO content_publication_provenance VALUES (?, ?, ?, ?, ?)').run(other.manifest.revision, candidate.repository, candidate.commit, 77, '2026-01-01T00:00:00Z');
      db.sql.prepare('INSERT INTO content_publication_events VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run('pub-'+'0'.repeat(32), 'engine:'+seed.manifest.engineRevision, 1, other.manifest.revision, other.manifest.revision, candidate.commit, 'publish', '2026-01-01T00:00:00Z');
    }
    const before = db.sql.prepare('SELECT * FROM content_revisions').all();
    const eventsBefore = db.sql.prepare('SELECT * FROM content_publication_events').all();
    const provenanceBefore = db.sql.prepare('SELECT * FROM content_publication_provenance').all();
    let requests = 0;
    await assert.rejects(m.bootstrapPublication(db, candidate, 'pub-'+'6'.repeat(32), seed, {fetcher:async()=>{requests++;throw Error('must not stage')}}), /Bootstrap conflicts/);
    assert.equal(requests, 0);
    assert.deepEqual(db.sql.prepare('SELECT * FROM content_revisions').all(), before);
    assert.deepEqual(db.sql.prepare('SELECT * FROM content_publication_provenance').all(), provenanceBefore);
    assert.deepEqual(db.sql.prepare('SELECT * FROM content_publication_events').all(), eventsBefore);
    assert.equal(db.sql.prepare('SELECT revision_id FROM content_publication').get().revision_id, other.manifest.revision);
  }
});
test('dangling raw pointer is not hidden by completeness joins', async t => {
  const m = await modules(), db = database(t), missing = 'content-'+'9'.repeat(24);
  db.sql.exec('PRAGMA foreign_keys = OFF');
  db.sql.prepare('INSERT INTO content_publication VALUES (?,?)').run('engine:'+seed.manifest.engineRevision, missing);
  db.sql.exec('PRAGMA foreign_keys = ON');
  await assert.rejects(m.bootstrapPublication(db,candidate,'pub-'+'7'.repeat(32),seed,{fetcher:()=>{throw Error('must not stage')}}),/Bootstrap conflicts/);
  assert.equal(db.sql.prepare('SELECT COUNT(*) n FROM content_revisions').get().n,0);
});
test('bootstrap raw-pointer read failure stops before repository or database writes',async()=>{
  const m=await modules();let reads=0;
  const db={prepare(query){assert.equal(query,'SELECT revision_id FROM content_publication WHERE channel = ?');return {bind(){return {async first(){reads++;throw Error('read unavailable')}}}}}};
  await assert.rejects(m.bootstrapPublication(db,candidate,'pub-'+'8'.repeat(32),seed,{fetcher:()=>{throw Error('must not stage')}}),/read unavailable/);
  assert.equal(reads,1);
});
test('empty engine bootstrap still verifies and initializes generation one',async t=>{
  const m=await modules(),db=database(t);
  const result=await m.bootstrapPublication(db,candidate,'pub-'+'9'.repeat(32),seed,{fetcher:evidence});
  assert.equal(result.generation,1);assert.equal(result.revision,seed.manifest.revision);
});
test('concurrent pointer after preflight is never overwritten and may retain verified staging',async t=>{
  const m=await modules(),db=database(t),other=clone(seed);
  other.globals.SPLUNK_DATA.publisherFixture='racing-head';
  other.manifest.digest=await m.sha256({schemaVersion:1,globals:other.globals,catalog:other.catalog});
  other.manifest.revision='content-'+(await m.sha256({digest:other.manifest.digest,engineRevision:other.manifest.engineRevision,datasetHashes:other.manifest.datasetHashes})).slice(0,24);
  let raced=false;
  await assert.rejects(m.bootstrapPublication(db,candidate,'pub-'+'a'.repeat(32),seed,{fetcher:async(url,opts)=>{if(!raced){raced=true;await m.ensureRevision(db,other);}return evidence(url,opts)}}),/Bootstrap conflicts/);
  assert.equal(db.sql.prepare('SELECT revision_id FROM content_publication').get().revision_id,other.manifest.revision);
  assert.equal(db.sql.prepare('SELECT COUNT(*) n FROM content_publication_events').get().n,0);
  assert.equal(db.sql.prepare('SELECT COUNT(*) n FROM content_publication_provenance WHERE revision_id = ?').get(seed.manifest.revision).n,1);
});
