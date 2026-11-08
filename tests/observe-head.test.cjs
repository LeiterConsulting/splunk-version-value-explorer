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
const origin = 'https://versioncompass.com', endpoint = origin + '/api/publisher/head';
const workflow = repo + '/.github/workflows/publish-content.yml@refs/heads/main';
const now = 1794092400000;
const modules = () => import('../scripts/observe-seed.mjs');
function environment() {
  return { GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_REPOSITORY: repo, GITHUB_REF: 'refs/heads/main', GITHUB_REF_TYPE: 'branch', GITHUB_WORKFLOW_REF: workflow, GITHUB_WORKFLOW_SHA: commit, GITHUB_SHA: commit,
    VC_OBSERVATION_MODE: 'head-only', VC_OBSERVATION_EXPECTED_SEED_COMMIT: deployment.sourceCommit, VC_OBSERVATION_EXPECTED_COMMIT: commit, VC_OBSERVATION_EXPECTED_REF: 'refs/heads/main', VC_OBSERVATION_EXPECTED_ENGINE: manifest.engineRevision, VC_OBSERVATION_EXPECTED_REVISION: manifest.revision,
    ACTIONS_ID_TOKEN_REQUEST_URL: 'https://test.actions.githubusercontent.com/token?test=fixture', ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'issuer-request-fixture-token' };
}
function token(changes = {}) {
  const claims = { iss: 'https://token.actions.githubusercontent.com', aud: origin, repository: repo, repository_id: '1366223729', repository_owner_id: '152733483', repository_visibility: 'public', ref: 'refs/heads/main', ref_type: 'branch', workflow_ref: workflow, sha: commit, runner_environment: 'github-hosted', event_name: 'workflow_dispatch', sub: 'repo:' + repo + ':ref:refs/heads/main', iat: now / 1000, nbf: now / 1000 - 1, exp: now / 1000 + 300, ...changes };
  return Buffer.from('{"alg":"RS256"}').toString('base64url') + '.' + Buffer.from(JSON.stringify(claims)).toString('base64url') + '.fixture';
}
const complete = () => ({ revision: manifest.revision, engineRevision: manifest.engineRevision, generation: 0, activeDelivery: false });
const json = (data, status = 200, headers) => new Response(JSON.stringify(data), { status, headers });
async function execute({ env = {}, response = complete(), credential = { value: token() }, status = 200, handler, ...options } = {}) {
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url: String(url), init });
    if (handler) return handler(url, init, calls.length);
    return calls.length === 1 ? json(credential) : json(response, status);
  };
  const receipt = await (await modules()).observeHead({ env: { ...environment(), ...env }, manifest, deployment, sourceTree: deployment.sourceTree, checkoutSha: commit, now: () => now, fetcher, ...options });
  return { receipt, calls };
}

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
test('head-only returns only bounded head metadata through one fixed GET and keeps zero generation unverified', async () => {
  assert.equal(workflowMode('workflow_dispatch', { inputs: { mode: 'head-only' } }), 'head-only');
  for (const generation of [0, 1, Number.MAX_SAFE_INTEGER]) {
    const { receipt, calls } = await execute({ response: { ...complete(), generation } });
    assert.equal(receipt.status, 'observation-returned'); assert.equal(receipt.mode, 'head-only');
    assert.equal(receipt.readiness, 'not-assessed'); assert.equal(receipt.integrity, 'not-validated');
    assert.equal(receipt.claimedDelivered, false); assert.equal(receipt.mutationAttempted, false);
    assert.deepEqual(receipt.observation, { ...complete(), generation }); assert.equal(calls.length, 2);
    assert.equal(calls[1].url, endpoint); assert.equal(new URL(calls[0].url).searchParams.get('audience'), origin);
    for (const call of calls) { assert.equal(call.init.method, 'GET'); assert.equal(call.init.redirect, 'manual'); assert.equal(call.init.body, undefined); }
    assert.doesNotMatch(JSON.stringify(receipt), /Bearer|fixture-token/);
    assert.match(receipt.qualification, /not complete history or provenance/);
    assert.match(receipt.qualification, /local reviewed expectations, not observed head provenance or digest/);
  }
});
test('head-only rejects unknown keys, bad types, mismatched identity and changed delivery state without fallback', async () => {
  for (const change of [{ generation: -1 }, { generation: 1.5 }, { generation: Number.MAX_SAFE_INTEGER + 1 }, { generation: '0' }, { generation: null },
    { revision: manifest.revision + '\n' }, { revision: [manifest.revision] }, { engineRevision: [manifest.engineRevision] },
    { revision: 'content-' + 'f'.repeat(24) }, { engineRevision: 'engine-' + 'f'.repeat(20) },
    { activeDelivery: true }, { activeDelivery: 0 }, { raw: 'PRIVATE' }]) {
    const { receipt, calls } = await execute({ response: { ...complete(), ...change } });
    assert.equal(receipt.status, 'failed'); assert.equal(receipt.observation, undefined); assert.equal(calls.length, 2);
    assert.doesNotMatch(JSON.stringify(receipt), /PRIVATE/);
  }
  for (const key of Object.keys(complete())) {
    const response = complete(); delete response[key]; const { receipt } = await execute({ response }); assert.equal(receipt.status, 'failed');
  }
  for (const status of [401, 403, 409, 423, 500, 503]) {
    const { receipt, calls } = await execute({ status, response: { reason: 'initial-publication-required', error: 'PRIVATE' } });
    assert.equal(receipt.reason, 'observation-http-rejected'); assert.equal(calls.length, 2); assert.equal(receipt.observation, undefined);
  }
});
test('head-only cannot be selected through seed mode and token identity/lifetime checks remain exact', async () => {
  const badMode = await execute({ env: { VC_OBSERVATION_MODE: 'observe-only' } }); assert.equal(badMode.calls.length, 0);
  for (const changes of [{ iss: 'https://other.invalid' }, { repository: 'other/repo' }, { repository_owner_id: '1' }, { repository_visibility: 'private' }, { ref_type: 'tag' }, { runner_environment: 'self-hosted' }, { sub: 'other' }, { nbf: now / 1000 + 31 }, { iat: now / 1000 - 601 }, { iat: now / 1000 + 31 }, { exp: now / 1000 + 601 }]) {
    const { receipt, calls } = await execute({ credential: { value: token(changes) } }); assert.equal(receipt.reason, 'credential-context-rejected'); assert.equal(calls.length, 1);
  }
});
test('head CLI retains its own sanitized failed artifact outside Actions with no request', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'observe-head-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const result = spawnSync(process.execPath, [path.resolve('scripts/observe-head.mjs')], { cwd: dir, encoding: 'utf8', env: { ...process.env, GITHUB_ACTIONS: 'false', GITHUB_STEP_SUMMARY: path.join(dir, 'summary.md') } });
  assert.equal(result.status, 1); assert.equal(JSON.parse(result.stdout).requests, 0);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'head-observation-outcome.json'))).mode, 'head-only');
  assert.equal(fs.existsSync(path.join(dir, 'seed-observation-outcome.json')), false); assert.equal(fs.existsSync(path.join(dir, 'publication-outcome.json')), false);
  const workflowText = fs.readFileSync('.github/workflows/publish-content.yml', 'utf8');
  assert.match(workflowText, /if: steps.mode.outputs.mode == 'head-only'/); assert.match(workflowText, /name: head-observation-\$/);
});
