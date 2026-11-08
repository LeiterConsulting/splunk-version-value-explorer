const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const modules = () => import('../scripts/lib/publication-orchestration.mjs');
const commit = 'a'.repeat(40), engine = 'engine-' + 'b'.repeat(20), rev = 'content-' + 'c'.repeat(24), previous = 'content-' + 'd'.repeat(24);
const candidate = () => ({ repository: 'LeiterConsulting/splunk-version-value-explorer', commit, bundle: { manifest: { revision: rev, engineRevision: engine } } });
const head = () => ({ revision: previous, engineRevision: engine, generation: 4, activeDelivery: true });
async function run(mode, options = {}) {
  const calls = [], { failAt, response = {}, ...rest } = options;
  const result = await (await modules())[mode]({ candidate: candidate(), expectedCommit: commit, deployedEngine: engine, deployedSeedRevision: rev,
    call: async (route, body) => {
      calls.push({ route, body });
      if (route === failAt) throw Error('PRIVATE credential or response');
      return Object.hasOwn(response, route) ? response[route] : route === 'head' ? head() : route === 'stage' ? { status: 'staged', revision: rev, engineRevision: engine } : route === 'bootstrap' ? { status: 'initialized', revision: rev, engineRevision: engine, generation: 1 } : { status: 'applied', applied: { revision: rev, generation: 5 }, current: { revision: rev, generation: 5 } };
    }, ...rest });
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE/);
  return { result, calls };
}
test('stage-only is separate: exactly stage, never head/bootstrap/activation even if delivery could be on', async () => {
  const { result, calls } = await run('stageOnly');
  assert.equal(result.status, 'staged-only'); assert.equal(result.claimedDelivered, false);
  assert.deepEqual(calls.map(x => x.route), ['stage']);
});
test('advance validates head before stage and uses exact CAS and stable operation identity', async () => {
  const a = await run('advance'), b = await run('advance');
  assert.deepEqual(a.calls.map(x => x.route), ['head', 'stage', 'activate']);
  assert.deepEqual(a.calls[2].body, { operationId: b.calls[2].body.operationId, revision: rev, expectedRevision: previous, expectedGeneration: 4, intent: 'publish' });
  assert.equal(a.result.status, 'activation-reported');
  const { operationId } = await modules();
  assert.notEqual(operationId(commit, 'publish'), operationId(commit, 'bootstrap'));
});
test('absent, generation-zero, mismatched and disabled heads stop before any mutation, never bootstrap', async () => {
  for (const value of [null, { ...head(), revision: [previous] }, { ...head(), generation: 0 }, { ...head(), generation: -1 }, { ...head(), generation: Number.MAX_SAFE_INTEGER }, { ...head(), generation: 1.5 }, { ...head(), engineRevision: 'engine-' + 'e'.repeat(20) }, { ...head(), activeDelivery: false }, { ...head(), extra: true }]) {
    const { result, calls } = await run('advance', { response: { head: value } });
    assert.equal(result.status, 'failed'); assert.deepEqual(calls.map(x => x.route), ['head']);
  }
  const same = await run('advance', { response: { head: { ...head(), revision: rev } } });
  assert.equal(same.result.status, 'already-current'); assert.equal(same.calls.length, 1);
});
test('all head/stage/bootstrap/activation errors and uncertain responses fail stop without retry', async () => {
  for (const [mode, routes] of [['stageOnly', ['stage']], ['bootstrapOnly', ['bootstrap']], ['advance', ['head', 'stage', 'activate']]]) {
    for (const [index, route] of routes.entries()) for (const malformed of [false, true]) {
      const { result, calls } = await run(mode, malformed ? { response: { [route]: { raw: 'PRIVATE' } } } : { failAt: route });
      assert.equal(result.status, 'failed'); assert.deepEqual(calls.map(x => x.route), routes.slice(0, index + 1));
      assert.equal(result.mutationOutcome, route === 'head' ? 'no-write-at-failed-action' : 'uncertain-read-back-before-retry');
    }
  }
});
test('bootstrap is explicit, seed-bound and stable, and never stages or activates', async () => {
  const a = await run('bootstrapOnly'), b = await run('bootstrapOnly');
  assert.equal(a.result.status, 'bootstrap-reported'); assert.deepEqual(a.calls.map(x => x.route), ['bootstrap']);
  assert.equal(a.calls[0].body.operationId, b.calls[0].body.operationId);
  const mismatch = await run('bootstrapOnly', { deployedSeedRevision: previous });
  assert.equal(mismatch.result.status, 'failed'); assert.deepEqual(mismatch.calls, []);
});
test('commit/engine/candidate preflight fails before adapter and input snapshots survive asynchronous mutation', async () => {
  for (const options of [{ expectedCommit: 'f'.repeat(40) }, { deployedEngine: 'engine-' + 'f'.repeat(20) }, { candidate: { ...candidate(), repository: 'other/repo' } }]) {
    const { result, calls } = await run('advance', options); assert.equal(result.status, 'failed'); assert.deepEqual(calls, []);
  }
  const c = candidate();
  await (await modules()).advance({ candidate: c, expectedCommit: commit, deployedEngine: engine, call: async (route, body) => {
    if (route === 'head') { c.bundle.manifest.revision = previous; return head(); }
    assert.equal(route, 'stage'); assert.equal(body.bundle.manifest.revision, rev); throw Error('stop');
  } });
});
test('offline orchestration has no live transport and no production caller imports it', () => {
  const source = fs.readFileSync('scripts/lib/publication-orchestration.mjs', 'utf8');
  assert.doesNotMatch(source, /\bfetch\s*\(|https:\/\/|process\.(env|argv)|node:(http|https|child_process)/);
  for (const file of ['scripts/publish-content.mjs', '.github/workflows/publish-content.yml']) assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /publication-orchestration/);
});

test('activation rejects missing or contradictory applied/current event evidence', async () => {
  const valid = { revision: rev, generation: 5 };
  for (const response of [
    { status: 'applied', current: valid },
    { status: 'applied', applied: valid },
    { status: 'applied', applied: { revision: previous, generation: 5 }, current: valid },
    { status: 'applied', applied: { revision: rev, generation: 6 }, current: valid },
    { status: 'already-applied', applied: valid, current: { revision: rev, generation: 6 } },
    { status: 'applied', applied: { ...valid, extra: true }, current: valid },
  ]) {
    const { result, calls } = await run('advance', { response: { activate: response } });
    assert.equal(result.status, 'failed'); assert.equal(result.reason, 'mutation-response-invalid');
    assert.equal(result.mutationOutcome, 'uncertain-read-back-before-retry');
    assert.deepEqual(calls.map(x => x.route), ['head', 'stage', 'activate']);
  }
  const { operationId } = await modules(); assert.throws(() => operationId([commit], 'publish'));
  for (const options of [{ expectedCommit: [commit] }, { candidate: { ...candidate(), bundle: { manifest: { revision: [rev], engineRevision: engine } } } }]) {
    const { result, calls } = await run('stageOnly', options); assert.equal(result.status, 'failed'); assert.deepEqual(calls, []);
  }
});
