const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const sourceCommit = 'b3790ee3a5709f0ee1ccd286271aa3898c7b44e3';
const expectedSeed = { sourceCommit, sourceTree: 'd649c43aaa67406945a45108419605d4b4c4af9b', revision: 'content-4b1fd403042725ca0530e870', engineRevision: 'engine-f7cb050e2600baf63082', digest: 'bda9a3c4f2a1b228a47e6483e1d7ce6ee9c6156e540375bef5c72c1f995a9c21', recordCount: 922 };
const callerCommit = '2aef73e4c2540bda315a306c291fbd780e3c88b5';
const head = { revision: expectedSeed.revision, engineRevision: expectedSeed.engineRevision, generation: 0, activeDelivery: false };
async function run(options = {}) { return (await import('../scripts/lib/bootstrap-preparation.mjs')).prepareSeedBootstrap({ repositoryPath: process.cwd(), callerCommit, mechanism: 'administrative', expectedSeed, head, ...options }); }
test('historical exact seed preparation separates source, caller and candidate without executing historical code', async () => {
  const a = await run(), b = await run();
  assert.equal(a.status, 'prepared-not-authorized'); assert.equal(a.productionAuthorized, false); assert.equal(a.claimedDelivered, false);
  assert.equal(a.request.candidate.commit, sourceCommit); assert.equal(a.callerCommit, callerCommit);
  assert.equal(a.request.candidate.bundle.catalog.records.length, 922); assert.deepEqual(a.request, b.request);
  assert.notEqual(JSON.parse(execFileSync('git', ['show', `${callerCommit}:content/publication.json`])).revision, a.revision);
  const oidc = await run({ mechanism: 'github-oidc' });
  assert.equal(oidc.reason, 'oidc-candidate-commit-mismatch'); assert.equal(oidc.requiredMechanism, 'administrative'); assert.equal(oidc.request, undefined);
  assert.equal((await run({ mechanism: 'github-oidc', callerCommit: sourceCommit })).status, 'prepared-not-authorized');
});
test('wrong source/tree/engine/count/digest/revision never produces a write request', async () => {
  for (const [key, value] of Object.entries({ sourceCommit: callerCommit, sourceTree: 'a'.repeat(40), engineRevision: 'engine-' + 'a'.repeat(20), recordCount: 921, digest: 'a'.repeat(64), revision: 'content-' + 'a'.repeat(24) })) {
    const result = await run({ expectedSeed: { ...expectedSeed, [key]: value } });
    assert.equal(result.status, 'blocked', key); assert.equal(result.request, undefined, key);
  }
});
test('absent, alternate, positive, unsafe and enabled heads stop before request preparation', async () => {
  for (const observed of [null, {}, { ...head, generation: 1 }, { ...head, generation: -1 }, { ...head, generation: 0.5 }, { ...head, activeDelivery: true }, { ...head, extra: true }, ...[0, 1].map(generation => ({ ...head, generation, revision: 'content-' + 'a'.repeat(24) }))]) {
    const result = await run({ head: observed }); assert.equal(result.status, 'blocked'); assert.equal(result.request, undefined);
  }
});

test('local Git reads ignore replacement refs and inherited repository selection', async t => {
  const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-seed-local-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  execFileSync('git', ['clone', '--shared', '--no-checkout', process.cwd(), directory], { stdio: 'pipe' });
  const git = (...args) => execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8' }).trim();
  const current = JSON.parse(git('show', callerCommit + ':content/publication.json'));
  for (const file of ['content/publication.json', 'dist/content-bundle.json']) {
    git('replace', git('rev-parse', sourceCommit + ':' + file), git('rev-parse', callerCommit + ':' + file));
  }
  const inherited = process.env.GIT_DIR;
  process.env.GIT_DIR = '/missing-private-repository';
  try {
    assert.equal((await run({ repositoryPath: directory })).status, 'prepared-not-authorized');
    assert.equal((await run({ repositoryPath: directory, expectedSeed: { ...expectedSeed, ...Object.fromEntries(['revision', 'digest', 'recordCount'].map(key => [key, current[key]])) } })).status, 'blocked');
  } finally { if (inherited === undefined) delete process.env.GIT_DIR; else process.env.GIT_DIR = inherited; }
});

test('offline Git subprocess explicitly prohibits network and credential interaction', () => {
  const source = require('node:fs').readFileSync('scripts/lib/bootstrap-preparation.mjs', 'utf8');
  for (const guard of ["'protocol.allow=never'", "GIT_NO_LAZY_FETCH: '1'", "GIT_TERMINAL_PROMPT: '0'", "'--no-replace-objects'"]) assert(source.includes(guard));
  assert.doesNotMatch(source, /\bfetch\s*\(|https:\/\/|\.\.\.process\.env/);
  for (const file of ['scripts/publish-content.mjs', '.github/workflows/publish-content.yml']) assert.doesNotMatch(require('node:fs').readFileSync(file, 'utf8'), /bootstrap-preparation|prepare-seed-bootstrap/);
});

test('typed malformed pins/heads and newline SHAs reject; caller does not alter operation identity', async () => {
  for (const options of [{ expectedSeed: null }, { expectedSeed: [] }, { expectedSeed: { ...expectedSeed, extra: true } }, { expectedSeed: { ...expectedSeed, recordCount: '922' } }, { callerCommit: callerCommit + '\n' }, { expectedSeed: { ...expectedSeed, sourceCommit: sourceCommit + '\n' } }, { head: [] }, { head: { ...head, generation: '0' } }]) {
    const result = await run(options); assert.equal(result.status, 'blocked'); assert.equal(result.request, undefined);
  }
  assert.equal((await run()).request.operationId, (await run({ callerCommit: sourceCommit })).request.operationId);
});

test('missing promisor objects fail without invoking a remote helper', async t => {
  const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-seed-missing-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const marker = path.join(directory, 'remote-invoked');
  const git = (...args) => execFileSync('git', ['-C', directory, ...args], { stdio: 'pipe' });
  git('init'); git('config', 'remote.origin.url', 'ext::touch ' + marker);
  git('config', 'remote.origin.promisor', 'true'); git('config', 'extensions.partialClone', 'origin');
  git('config', 'protocol.ext.allow', 'always');
  const result = await run({ repositoryPath: directory });
  assert.equal(result.status, 'blocked'); assert.equal(result.request, undefined); assert.equal(fs.existsSync(marker), false);
});
