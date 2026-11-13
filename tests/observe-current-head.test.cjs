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
    VC_OBSERVATION_MODE: 'current-head-only', VC_OBSERVATION_EXPECTED_HEAD_REVISION: manifest.revision, VC_OBSERVATION_EXPECTED_SEED_COMMIT: deployment.sourceCommit, VC_OBSERVATION_EXPECTED_COMMIT: commit, VC_OBSERVATION_EXPECTED_REF: 'refs/heads/main', VC_OBSERVATION_EXPECTED_ENGINE: manifest.engineRevision, VC_OBSERVATION_EXPECTED_REVISION: manifest.revision,
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
  const receipt = await (await modules()).observeCurrentHead({ env: { ...environment(), ...env }, manifest, deployment, sourceTree: deployment.sourceTree, checkoutSha: commit, now: () => now, fetcher, ...options });
  return { receipt, calls };
}

test('current head reads exact revision with reader off or on, never writes',async()=>{for(const activeDelivery of [false,true]){const {receipt,calls}=await execute({response:{...complete(),activeDelivery}});assert.equal(receipt.status,'observation-returned');assert.equal(receipt.observation.activeDelivery,activeDelivery);assert.equal(receipt.mutationAttempted,false);assert.equal(calls.length,2);assert.ok(calls.every(x=>x.init.method==='GET'));}});
test('alternate head is explicit and engine remains exact',async()=>{const revision='content-'+'f'.repeat(24);const {receipt}=await execute({env:{VC_OBSERVATION_EXPECTED_HEAD_REVISION:revision},response:{...complete(),revision,activeDelivery:true}});assert.equal(receipt.status,'observation-returned');for(const delta of [{revision},{engineRevision:'engine-'+'f'.repeat(20)},{activeDelivery:'true'},{generation:-1},{extra:'secret'}]){assert.equal((await execute({response:{...complete(),...delta}})).receipt.status,'failed');}});
test('missing currenthead pin or automatic event rejects before network',async()=>{for(const env of [{VC_OBSERVATION_EXPECTED_HEAD_REVISION:''},{GITHUB_EVENT_NAME:'workflow_run'},{GITHUB_WORKFLOW_SHA:'b'.repeat(40)},{VC_OBSERVATION_MODE:'head-only'}]){const r=await execute({env});assert.equal(r.receipt.status,'failed');assert.equal(r.calls.length,0);}});
test('current head transport never follows or retries',async()=>{const r=await execute({status:302});assert.equal(r.receipt.status,'failed');assert.equal(r.calls.length,2);assert.equal(r.receipt.mutationAttempted,false);});
test('currenthead and stage modes do not open automatic publication',()=>{for(const mode of ['stage-only','current-head-only']){assert.equal(workflowMode('workflow_run',{inputs:{mode}}),'held');assert.equal(workflowMode('workflow_dispatch',{inputs:{mode}}),mode);}assert.equal(workflowMode('workflow_dispatch',{inputs:{mode:'publish'}}),'held');});
