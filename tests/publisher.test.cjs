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
