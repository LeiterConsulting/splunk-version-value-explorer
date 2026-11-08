const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { workflowMode } = require('../scripts/publisher-workflow-mode.cjs');
const deployment = JSON.parse(fs.readFileSync('docs/deployed-seed-observation.json', 'utf8'));
const manifest = deployment.seed;
const commit = 'a'.repeat(40), repo = 'LeiterConsulting/splunk-version-value-explorer';
const origin = 'https://versioncompass.com', endpoint = origin + '/api/publisher/observe-seed';
const workflow = repo + '/.github/workflows/publish-content.yml@refs/heads/main';
const now = 1794092400000;
const modules = () => import('../scripts/observe-seed.mjs');
function environment() {
  return { GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_REPOSITORY: repo, GITHUB_REF: 'refs/heads/main', GITHUB_REF_TYPE: 'branch', GITHUB_WORKFLOW_REF: workflow, GITHUB_WORKFLOW_SHA: commit, GITHUB_SHA: commit,
    VC_OBSERVATION_MODE: 'observe-only', VC_OBSERVATION_EXPECTED_SEED_COMMIT: deployment.sourceCommit, VC_OBSERVATION_EXPECTED_COMMIT: commit, VC_OBSERVATION_EXPECTED_REF: 'refs/heads/main', VC_OBSERVATION_EXPECTED_ENGINE: manifest.engineRevision, VC_OBSERVATION_EXPECTED_REVISION: manifest.revision,
    ACTIONS_ID_TOKEN_REQUEST_URL: 'https://test.actions.githubusercontent.com/token?test=fixture', ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'issuer-request-fixture-token' };
}
function token(changes = {}) {
  const claims = { iss: 'https://token.actions.githubusercontent.com', aud: origin, repository: repo, repository_id: '1366223729', repository_owner_id: '152733483', repository_visibility: 'public', ref: 'refs/heads/main', ref_type: 'branch', workflow_ref: workflow, sha: commit, runner_environment: 'github-hosted', event_name: 'workflow_dispatch', sub: 'repo:' + repo + ':ref:refs/heads/main', iat: now / 1000, nbf: now / 1000 - 1, exp: now / 1000 + 300, ...changes };
  return Buffer.from('{"alg":"RS256"}').toString('base64url') + '.' + Buffer.from(JSON.stringify(claims)).toString('base64url') + '.fixture';
}
const complete = () => ({ status: 'observation-returned', database: 'select-succeeded', projection: 'available', seed: 'marked-complete-count-consistent', head: 'bundled-metadata-only', validation: 'metadata-and-count-only', readiness: 'not-assessed', integrity: 'not-validated', revision: manifest.revision, engineRevision: manifest.engineRevision, expectedRecordCount: manifest.recordCount, observedRecordCount: manifest.recordCount, recordCountOverflow: false, headRevision: manifest.revision });
const json = (data, status = 200, headers) => new Response(JSON.stringify(data), { status, headers });
async function execute({ env = {}, response = complete(), credential = { value: token() }, status = 200, handler, ...options } = {}) {
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url: String(url), init });
    if (handler) return handler(url, init, calls.length);
    return calls.length === 1 ? json(credential) : json(response, status);
  };
  const receipt = await (await modules()).observeSeed({ env: { ...environment(), ...env }, manifest, deployment, sourceTree: deployment.sourceTree, checkoutSha: commit, now: () => now, fetcher, ...options });
  return { receipt, calls };
}

test('workflow mode is explicit, automatic publisher is held, observe cannot select or publish', () => {
  assert.equal(workflowMode('workflow_run', {}), 'held');
  assert.equal(workflowMode('workflow_dispatch', { inputs: { mode: 'publish' } }), 'held');
  assert.equal(workflowMode('workflow_dispatch', { inputs: { mode: 'observe-only' } }), 'observe-only');
  for (const mode of [undefined, '', 'observe', 'publish; echo private']) assert.throws(() => workflowMode('workflow_dispatch', { inputs: { mode } }));
  assert.throws(() => workflowMode('pull_request', {}));
  const workflowText = fs.readFileSync('.github/workflows/publish-content.yml', 'utf8');
  assert.match(workflowText, /Select the validated candidate without broadening OIDC scope\n        if: steps.mode.outputs.mode == 'publish'/);
  assert.match(workflowText, /if: steps.mode.outputs.mode == 'publish' && steps.candidate.outputs.publish == 'true'/);
  assert.match(workflowText, /if: always\(\) && steps.mode.outputs.mode == 'observe-only'/);
  assert.doesNotMatch(workflowText, /run:.*inputs\./);
  assert.match(workflowText, /permissions:\n  actions: read\n  contents: read\n  id-token: write/);
  assert.match(workflowText, /group: versioncompass-content-publisher\n  cancel-in-progress: false/);
});

test('observe obtains existing-audience OIDC and issues exactly one fixed GET without mutation or evidence token', async () => {
  const { receipt, calls } = await execute();
  assert.equal(receipt.status, 'observation-returned');
  assert.equal(receipt.readiness, 'not-assessed'); assert.equal(receipt.integrity, 'not-validated'); assert.equal(receipt.claimedDelivered, false); assert.equal(receipt.mutationAttempted, false);
  assert.equal(calls.length, 2); assert.equal(receipt.requests, 2);
  assert.equal(new URL(calls[0].url).searchParams.get('audience'), origin);
  assert.equal(calls[1].url, endpoint);
  for (const call of calls) { assert.equal(call.init.method, 'GET'); assert.equal(call.init.redirect, 'manual'); assert.equal(call.init.body, undefined); }
  assert.equal(calls[1].init.headers.Authorization, 'Bearer ' + token());
  assert.equal(JSON.stringify(receipt).includes(token()), false);
  assert.equal(receipt.revision, manifest.revision); assert.equal(receipt.engineRevision, manifest.engineRevision);
});

test('auth context, mode, SHA, checkout, ref and explicit expected identities fail before network', async () => {
  const cases = [
    { GITHUB_ACTIONS: 'false' }, { GITHUB_EVENT_NAME: 'workflow_run' }, { GITHUB_REPOSITORY: 'other/repo' }, { GITHUB_REF: 'refs/heads/other' }, { GITHUB_REF_TYPE: 'tag' },
    { GITHUB_WORKFLOW_REF: repo + '/.github/workflows/other.yml@refs/heads/main' }, { GITHUB_WORKFLOW_SHA: 'b'.repeat(40) }, { GITHUB_SHA: 'b'.repeat(40) },
    { VC_OBSERVATION_MODE: 'publish' }, { VC_OBSERVATION_EXPECTED_COMMIT: '' }, { VC_OBSERVATION_EXPECTED_COMMIT: 'a'.repeat(40) + '\n' }, { VC_OBSERVATION_EXPECTED_REF: 'main' },
    { VC_OBSERVATION_EXPECTED_SEED_COMMIT: 'c'.repeat(40) }, { VC_OBSERVATION_EXPECTED_ENGINE: '' }, { VC_OBSERVATION_EXPECTED_REVISION: 'content-' + 'b'.repeat(24) },
  ];
  for (const env of cases) { const { receipt, calls } = await execute({ env }); assert.equal(receipt.status, 'failed', JSON.stringify(env)); assert.equal(calls.length, 0); }
  for (const options of [{ checkoutSha: 'b'.repeat(40) }, { manifest: { ...manifest, recordCount: 10001 } }, { manifest: {} }, { deployment: {} }, { sourceTree: 'c'.repeat(40) }, { manifest: { ...manifest, digest: 'a'.repeat(64) } }, { deployment: { ...deployment, probe: 'https://other.test' } }]) {
    const result = await execute(options); assert.equal(result.receipt.status, 'failed'); assert.equal(result.calls.length, 0);
  }
});

test('issuer restrictions and token claims reject credentials without an observation request', async () => {
  for (const url of ['http://test.actions.githubusercontent.com/token', 'https://actions.githubusercontent.com.attacker.test/token', 'https://x:secret@test.actions.githubusercontent.com/token', 'https://test.actions.githubusercontent.com:8443/token', 'https://test.actions.githubusercontent.com/token#fragment']) {
    const result = await execute({ env: { ACTIONS_ID_TOKEN_REQUEST_URL: url } }); assert.equal(result.receipt.reason, 'issuer-rejected'); assert.equal(result.calls.length, 0);
  }
  for (const changes of [{ sha: 'b'.repeat(40) }, { aud: 'https://attacker.test' }, { ref: 'refs/heads/other' }, { event_name: 'workflow_run' }, { workflow_ref: 'other' }, { exp: now / 1000 }, { repository_id: '1' }]) {
    const result = await execute({ credential: { value: token(changes) } }); assert.equal(result.receipt.reason, 'credential-context-rejected'); assert.equal(result.calls.length, 1);
  }
});

test('missing, incomplete and inconsistent are successful observations, never readiness', async () => {
  for (const [seed, count, head] of [['missing', 0, 'absent'], ['missing-with-records', 2, 'absent'], ['incomplete', 25, 'absent'], ['inconsistent', manifest.recordCount + 1, 'inconsistent']]) {
    const response = { ...complete(), seed, head, observedRecordCount: count, recordCountOverflow: count > manifest.recordCount }; delete response.headRevision;
    const { receipt } = await execute({ response });
    assert.equal(receipt.status, 'observation-returned'); assert.equal(receipt.observation.seed, seed); assert.equal(receipt.readiness, 'not-assessed'); assert.equal(receipt.integrity, 'not-validated');
  }
});

test('valid 503 unavailable phases retain sanitized observation on failing receipt', async () => {
  for (const [reason, database, projection] of [['missing-database-binding', 'unknown', 'unknown'], ['database-select-failed', 'select-failed', 'unknown'], ['projection-unavailable', 'select-succeeded', 'unavailable'], ['observation-select-failed', 'select-succeeded', 'available']]) {
    const response = { ...complete(), status: 'observation-unavailable', reason, database, projection, seed: 'unknown', head: 'unknown' };
    for (const key of ['observedRecordCount', 'recordCountOverflow', 'headRevision']) delete response[key];
    const { receipt, calls } = await execute({ response, status: 503 });
    assert.equal(receipt.status, 'failed'); assert.equal(receipt.reason, 'observation-unavailable'); assert.equal(receipt.observation.reason, reason); assert.equal(calls.length, 2);
  }
});

test('observation identity and strict schema reject malformed, contradictory and injected fields', async () => {
  const changes = [ { revision: 'content-' + 'b'.repeat(24) }, { engineRevision: 'engine-' + 'c'.repeat(20) }, { expectedRecordCount: 1 }, { readiness: 'ready' }, { integrity: 'validated' },
    { validation: 'complete' }, { observedRecordCount: -1 }, { observedRecordCount: manifest.recordCount + 2 }, { recordCountOverflow: true }, { seed: 'missing' },
    { head: 'absent' }, { head: 'inconsistent', headRevision: [manifest.revision] }, { head: 'inconsistent', headRevision: manifest.revision + '\n' }, { headRevision: 'secret-token-injection' }, { rawError: 'secret-token-injection' }, { reason: 'secret-token-injection' }, { status: 'ready' } ];
  for (const change of changes) {
    const { receipt } = await execute({ response: { ...complete(), ...change } });
    assert.equal(receipt.status, 'failed', JSON.stringify(change)); assert.equal(receipt.observation, undefined); assert.equal(JSON.stringify(receipt).includes('secret-token-injection'), false);
  }
});

test('redirects and HTTP rejection never retry or follow another origin', async () => {
  for (const at of [1, 2]) {
    const { receipt, calls } = await execute({ handler: (url, init, n) => n === at ? new Response('', { status: 302, headers: { location: 'https://attacker.test/private' } }) : json({ value: token() }) });
    assert.equal(receipt.reason, 'redirect-rejected'); assert.equal(calls.length, at);
  }
  const { receipt, calls } = await execute({ response: { error: 'secret-token-injection', reason: 'secret-token-injection' }, status: 401 });
  assert.equal(receipt.reason, 'observation-http-rejected'); assert.equal(calls.length, 2); assert.equal(JSON.stringify(receipt).includes('secret-token-injection'), false);
});

test('per-request deadline covers stalled fetch and body, cancels client and never retries', async () => {
  for (const phase of ['headers', 'body']) for (const at of [1, 2]) {
    let signal, cancelled = false;
    const { receipt, calls } = await execute({ timeoutMs: 15, handler: (url, init, n) => {
      if (n !== at) return json({ value: token() });
      signal = init.signal;
      return phase === 'headers' ? new Promise(() => {}) : new Response(new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('{')); }, cancel() { cancelled = true; return new Promise(() => {}); } }));
    } });
    assert.equal(receipt.reason, 'request-timeout'); assert.equal(calls.length, at); assert.equal(signal.aborted, true);
    if (phase === 'body') assert.equal(cancelled, true);
  }
});

test('bounded body bytes, malformed JSON and transport errors never expose raw data', async () => {
  for (const at of [1, 2]) for (const kind of ['length', 'stream', 'json', 'transport']) {
    const { receipt, calls } = await execute({ handler: (url, init, n) => {
      if (n !== at) return json({ value: token() });
      if (kind === 'transport') throw Error('secret-token-injection');
      if (kind === 'length') return json({}, 200, { 'Content-Length': '100000' });
      if (kind === 'stream') return new Response('secret-token-injection'.repeat(3000));
      return new Response('secret-token-injection');
    } });
    assert.equal(receipt.status, 'failed'); assert.equal(calls.length, at); assert.equal(JSON.stringify(receipt).includes('secret-token-injection'), false);
  }
});

test('separate receipt and summary persist safely on failure and CLI fails before network outside Actions', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'observe-seed-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const output = path.join(dir, 'seed-observation-outcome.json'), summary = path.join(dir, 'summary.md');
  const { receipt } = await execute({ env: { GITHUB_SHA: 'secret-token-injection' } });
  (await modules()).writeObservationReceipt(receipt, { output, summary });
  assert.equal(JSON.parse(fs.readFileSync(output, 'utf8')).reason, 'context-rejected');
  assert.match(fs.readFileSync(summary, 'utf8'), /not-assessed/); assert.doesNotMatch(fs.readFileSync(summary, 'utf8'), /secret-token-injection/);
  const result = spawnSync(process.execPath, [path.resolve('scripts/observe-seed.mjs')], { cwd: dir, encoding: 'utf8', env: { ...process.env, GITHUB_ACTIONS: 'false', GITHUB_STEP_SUMMARY: summary } });
  assert.equal(result.status, 1); assert.equal(JSON.parse(result.stdout).requests, 0); assert.equal(fs.existsSync(path.join(dir, 'publication-outcome.json')), false);
});
test('monotonic deadlines catch synchronous overruns and timer-starving empty chunks', async () => {
  for (const phase of ['fetch', 'empty-chunks']) {
    let elapsed = 0, cancelled = false;
    const { receipt, calls } = await execute({ timeoutMs: 10, monotonic: () => elapsed, handler: () => {
      if (phase === 'fetch') { elapsed = 11; return json({ value: token() }); }
      return { status: 200, headers: new Headers(), body: { getReader() { return {
        async read() { elapsed++; return { done: false, value: new Uint8Array(0) }; },
        cancel() { cancelled = true; return new Promise(() => {}); },
      }; } } };
    } });
    assert.equal(receipt.reason, 'request-timeout'); assert.equal(calls.length, 1);
    if (phase === 'empty-chunks') assert.equal(cancelled, true);
  }
});
test('observation rejects contradictory seed/head metadata combinations', async () => {
  for (const [seed, count, head] of [['missing', 0, 'bundled-metadata-only'], ['missing-with-records', 1, 'bundled-metadata-only'], ['incomplete', 25, 'bundled-metadata-only'], ['marked-complete-count-consistent', manifest.recordCount, 'inconsistent']]) {
    const { receipt } = await execute({ response: { ...complete(), seed, observedRecordCount: count, head } });
    assert.equal(receipt.reason, 'observation-schema-invalid'); assert.equal(receipt.observation, undefined);
  }
});

test('reviewed deployed seed is distinct from current main content and bound to exact historical source', async () => {
  const { execFileSync } = require('node:child_process');
  const historical = JSON.parse(execFileSync('git', ['show', deployment.sourceCommit + ':content/publication.json'], { encoding: 'utf8' }));
  const tree = execFileSync('git', ['rev-parse', deployment.sourceCommit + '^{tree}'], { encoding: 'utf8' }).trim();
  assert.equal(tree, deployment.sourceTree);
  for (const [key, value] of Object.entries(deployment.seed)) assert.equal(historical[key], value);
  const current = JSON.parse(fs.readFileSync('content/publication.json', 'utf8'));
  const success = await execute({ manifest: historical, sourceTree: tree });
  assert.equal(success.receipt.status, 'observation-returned');
  assert.equal(success.receipt.commit, commit); assert.equal(success.receipt.seedSourceCommit, deployment.sourceCommit);
  assert.equal(success.receipt.seedDigestValidation, 'local-source-only'); assert.equal(success.receipt.integrity, 'not-validated');
  if (current.revision !== historical.revision) {
    const stale = await execute({ manifest: current }); assert.equal(stale.calls.length, 0); assert.equal(stale.receipt.reason, 'expected-identity-invalid');
    const changedRuntime = await execute({ response: { ...complete(), revision: current.revision } });
    assert.equal(changedRuntime.receipt.status, 'failed'); assert.equal(changedRuntime.calls.length, 2);
  }
});
