/* One bounded authenticated observation. This CLI never imports the publication CLI. */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';

const repository = 'LeiterConsulting/splunk-version-value-explorer';
const origin = 'https://versioncompass.com';
const ref = 'refs/heads/main';
const workflow = repository + '/.github/workflows/publish-content.yml@' + ref;
const shaPattern = /^[a-f0-9]{40}$(?![\s\S])/;
const revisionPattern = /^content-[a-f0-9]{24}$(?![\s\S])/;
const enginePattern = /^engine-[a-f0-9]{20}$(?![\s\S])/;
const allowedErrors = new Set(['context-rejected', 'expected-identity-invalid', 'issuer-rejected', 'credential-unavailable', 'credential-context-rejected', 'request-timeout', 'transport-unavailable', 'redirect-rejected', 'response-too-large', 'invalid-json', 'observation-http-rejected', 'observation-schema-invalid', 'observation-identity-mismatch', 'observation-unavailable']);
const fail = reason => { throw Object.assign(new Error(reason), { safeReason: reason }); };
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const exactKeys = (value, required, optional = []) => object(value) && required.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => required.includes(key) || optional.includes(key));

export function validateContext(env, manifest, checkoutSha, deployment, sourceTree, mode = 'observe-only') {
  if (env.GITHUB_ACTIONS !== 'true' || env.GITHUB_EVENT_NAME !== 'workflow_dispatch' || !['observe-only', 'head-only'].includes(mode) || env.VC_OBSERVATION_MODE !== mode ||
      env.GITHUB_REPOSITORY !== repository || env.GITHUB_REF !== ref || env.GITHUB_REF_TYPE !== 'branch' || env.GITHUB_WORKFLOW_REF !== workflow ||
      env.VC_OBSERVATION_EXPECTED_REF !== ref || !shaPattern.test(env.VC_OBSERVATION_EXPECTED_COMMIT || '') ||
      env.GITHUB_SHA !== env.VC_OBSERVATION_EXPECTED_COMMIT || env.GITHUB_WORKFLOW_SHA !== env.GITHUB_SHA || checkoutSha !== env.GITHUB_SHA) fail('context-rejected');
  // This reviewed repository record describes the deployed bundle, not current
  // main's candidate. Historical Git bytes are read locally; no target is probed.
  if (!exactKeys(deployment, ['schemaVersion', 'repository', 'sourceCommit', 'sourceTree', 'sitesVersion', 'sitesSourceCommit', 'seed']) ||
      deployment.schemaVersion !== 1 || deployment.repository !== repository || !shaPattern.test(deployment.sourceCommit || '') ||
      !shaPattern.test(deployment.sourceTree || '') || !shaPattern.test(deployment.sitesSourceCommit || '') ||
      !Number.isSafeInteger(deployment.sitesVersion) || deployment.sitesVersion < 1 ||
      sourceTree !== deployment.sourceTree || env.VC_OBSERVATION_EXPECTED_SEED_COMMIT !== deployment.sourceCommit ||
      !exactKeys(deployment.seed, ['schemaVersion', 'engineRevision', 'revision', 'digest', 'recordCount']) ||
      !object(manifest) || Object.entries(deployment.seed).some(([key, value]) => manifest[key] !== value)) fail('expected-identity-invalid');
  if (!object(manifest) || manifest.schemaVersion !== 1 || !revisionPattern.test(manifest.revision || '') || !enginePattern.test(manifest.engineRevision || '') ||
      !/^[a-f0-9]{64}$/.test(manifest.digest || '') || !Number.isSafeInteger(manifest.recordCount) || manifest.recordCount < 1 || manifest.recordCount > 10000 ||
      env.VC_OBSERVATION_EXPECTED_ENGINE !== manifest.engineRevision || env.VC_OBSERVATION_EXPECTED_REVISION !== manifest.revision) fail('expected-identity-invalid');
  return { commit: env.GITHUB_SHA, ref, seedSourceCommit: deployment.sourceCommit, seedSourceTree: deployment.sourceTree, sitesVersion: deployment.sitesVersion, seedDigestValidation: 'local-source-only', engineRevision: manifest.engineRevision, revision: manifest.revision, digest: manifest.digest, recordCount: manifest.recordCount };
}

// The production issuer and Worker authenticate the token. This local sanity check
// prevents forwarding a minted token for a different expected workflow context.
function validateCredential(token, expected, now) {
  if (typeof token !== 'string' || token.length > 16000 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) fail('credential-unavailable');
  let c;
  try { c = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')); } catch { fail('credential-context-rejected'); }
  const seconds = Math.floor(now / 1000);
  if (!object(c) || c.iss !== 'https://token.actions.githubusercontent.com' || c.aud !== origin || c.repository !== repository ||
      c.repository_id !== '1366223729' || c.repository_owner_id !== '152733483' || c.repository_visibility !== 'public' ||
      c.ref !== ref || c.ref_type !== 'branch' || c.workflow_ref !== workflow || c.sha !== expected.commit ||
      c.runner_environment !== 'github-hosted' || c.event_name !== 'workflow_dispatch' ||
      !['repo:' + repository + ':ref:' + ref, 'repo:LeiterConsulting@152733483/splunk-version-value-explorer@1366223729:ref:' + ref].includes(c.sub) ||
      !Number.isSafeInteger(c.exp) || !Number.isSafeInteger(c.nbf) || !Number.isSafeInteger(c.iat) || c.exp <= seconds || c.nbf > seconds + 30 ||
      c.iat > seconds + 30 || c.iat < seconds - 600 || c.exp - c.iat > 600) fail('credential-context-rejected');
  return token;
}

// A single deadline spans headers and all body bytes, including non-cooperative
// test transports. Aborting/cancelling the client does not cancel server work.
async function requestJSON(url, headers, maxBytes, fetcher, timeoutMs, monotonic, totalDeadline, onRequest) {
  const deadlineAt = Math.min(monotonic() + timeoutMs, totalDeadline);
  const controller = new AbortController();
  let reader, timer;
  const checkDeadline = () => { if (controller.signal.aborted || monotonic() >= deadlineAt) fail('request-timeout'); };
  checkDeadline();
  const operation = (async () => {
    checkDeadline(); onRequest();
    const response = await fetcher(url, { method: 'GET', headers, redirect: 'manual', signal: controller.signal });
    if (controller.signal.aborted || monotonic() >= deadlineAt) { try { Promise.resolve(response.body?.cancel()).catch(() => {}); } catch {} fail('request-timeout'); }
    if (response.redirected || response.status >= 300 && response.status < 400 || response.url && response.url !== String(url)) fail('redirect-rejected');
    const declaredLength = response.headers.get('content-length');
    if (declaredLength !== null && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > maxBytes)) fail('response-too-large');
    if (!response.body) fail('invalid-json');
    reader = response.body.getReader();
    const chunks = []; let size = 0;
    while (true) {
      checkDeadline();
      const { value, done } = await reader.read();
      checkDeadline();
      if (done) break;
      size += value.byteLength; if (size > maxBytes) fail('response-too-large');
      if (value.byteLength) chunks.push(value);
    }
    let data;
    try { data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks))); } catch { fail('invalid-json'); }
    checkDeadline();
    return { status: response.status, data };
  })();
  const deadline = new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(Object.assign(Error('request-timeout'), { safeReason: 'request-timeout' })); }, Math.max(0, deadlineAt - monotonic())); });
  try { return await Promise.race([operation, deadline]); }
  catch (error) { if (allowedErrors.has(error?.safeReason)) throw error; fail('transport-unavailable'); }
  finally {
    clearTimeout(timer); controller.abort();
    // Do not wait for a stuck transport to acknowledge cancellation.
    try { if (reader) Promise.resolve(reader.cancel()).catch(() => {}); } catch {}
  }
}

export function validateObservation(value, expected, status) {
  const required = ['status', 'database', 'projection', 'seed', 'head', 'validation', 'readiness', 'integrity', 'revision', 'engineRevision', 'expectedRecordCount'];
  const optional = ['reason', 'observedRecordCount', 'recordCountOverflow', 'headRevision'];
  if (!exactKeys(value, required, optional) || value.validation !== 'metadata-and-count-only' || value.readiness !== 'not-assessed' || value.integrity !== 'not-validated') fail('observation-schema-invalid');
  if (value.revision !== expected.revision || value.engineRevision !== expected.engineRevision || value.expectedRecordCount !== expected.recordCount) fail('observation-identity-mismatch');
  if (status === 503 && value.status === 'observation-unavailable') {
    const phases = {
      'missing-database-binding': ['unknown', 'unknown'],
      'database-select-failed': ['select-failed', 'unknown'],
      'projection-unavailable': ['select-succeeded', 'unavailable'],
      'observation-select-failed': ['select-succeeded', 'available'],
    };
    const phase = phases[value.reason];
    if (!phase || value.database !== phase[0] || value.projection !== phase[1] || value.seed !== 'unknown' || value.head !== 'unknown' ||
        ['observedRecordCount', 'recordCountOverflow', 'headRevision'].some(key => Object.hasOwn(value, key))) fail('observation-schema-invalid');
  } else if (status === 200 && value.status === 'observation-returned') {
    if (value.database !== 'select-succeeded' || value.projection !== 'available' || Object.hasOwn(value, 'reason') ||
        !['missing', 'missing-with-records', 'incomplete', 'inconsistent', 'marked-complete-count-consistent'].includes(value.seed) ||
        !['absent', 'inconsistent', 'bundled-metadata-only', 'alternate-metadata-only'].includes(value.head) ||
        !Number.isSafeInteger(value.observedRecordCount) || value.observedRecordCount < 0 || value.observedRecordCount > expected.recordCount + 1 ||
        value.recordCountOverflow !== (value.observedRecordCount > expected.recordCount) ||
        value.seed === 'missing' && value.observedRecordCount !== 0 || value.seed === 'missing-with-records' && value.observedRecordCount === 0 ||
        value.seed === 'incomplete' && value.recordCountOverflow || value.seed === 'marked-complete-count-consistent' && value.observedRecordCount !== expected.recordCount ||
        Object.hasOwn(value, 'headRevision') && (typeof value.headRevision !== 'string' || !revisionPattern.test(value.headRevision)) ||
        value.head === 'absent' && Object.hasOwn(value, 'headRevision') ||
        value.head === 'bundled-metadata-only' && (value.headRevision !== expected.revision || ['missing', 'missing-with-records', 'incomplete'].includes(value.seed)) ||
        value.seed === 'marked-complete-count-consistent' && value.head === 'inconsistent' && value.headRevision === expected.revision ||
        value.head === 'alternate-metadata-only' && (!value.headRevision || value.headRevision === expected.revision)) fail('observation-schema-invalid');
  } else fail('observation-schema-invalid');
  // Copy only explicitly validated fields; never retain raw responses.
  return Object.fromEntries([...required, ...optional].filter(key => Object.hasOwn(value, key)).map(key => [key, value[key]]));
}

async function observe({ env = process.env, manifest, checkoutSha, deployment, sourceTree, fetcher = (...args) => globalThis.fetch(...args), now = Date.now, monotonic = () => performance.now(), timeoutMs = 10000 } = {}, mode) {
  // Injection can only shorten the fixed request deadline, never expand it.
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 10000) timeoutMs = 10000;
  const headMode = ['head-only','current-head-only'].includes(mode);
  const endpoint = origin + (headMode ? '/api/publisher/head' : '/api/publisher/observe-seed');
  const start = monotonic();
  let expected, observation, action = 'context-validation', requests = 0;
  const base = { mode, target: endpoint, readiness: 'not-assessed', integrity: 'not-validated', claimedDelivered: false, mutationAttempted: false,
    qualification: headMode ? 'Head metadata only. Seed source/tree/digest/count and Sites version are local reviewed expectations, not observed head provenance or digest. Generation is the maximum event generation, not complete history or provenance verification. No seed, stage, bootstrap, activation or content API request. No readiness, integrity, delivery or activation-eligibility claim.' : 'Metadata/count observation only. No seed, stage, bootstrap, activation or content API request. No readiness, integrity, provenance or factual-currency claim; other traffic may still initialize D1.' };
  try {
    expected = validateContext(mode==='current-head-only'?{...env,VC_OBSERVATION_MODE:'head-only'}:env, manifest, checkoutSha, deployment, sourceTree, mode==='current-head-only'?'head-only':mode);
    if(mode==='current-head-only'){if(env.VC_OBSERVATION_MODE!==mode||!revisionPattern.test(env.VC_OBSERVATION_EXPECTED_HEAD_REVISION||''))fail('expected-identity-invalid');expected={...expected,expectedHeadRevision:env.VC_OBSERVATION_EXPECTED_HEAD_REVISION};}
    action = 'credential-acquisition';
    let url;
    try { url = new URL(env.ACTIONS_ID_TOKEN_REQUEST_URL); } catch { fail('issuer-rejected'); }
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.actions.githubusercontent.com') || url.port || url.username || url.password || url.hash ||
        !/^[A-Za-z0-9._~+\/-]{20,16000}={0,2}$/.test(env.ACTIONS_ID_TOKEN_REQUEST_TOKEN || '')) fail('issuer-rejected');
    url.searchParams.set('audience', origin);
    const credential = await requestJSON(url, { Authorization: 'Bearer ' + env.ACTIONS_ID_TOKEN_REQUEST_TOKEN }, 32768, fetcher, timeoutMs, monotonic, start + 20000, () => requests++);
    if (credential.status !== 200) fail('credential-unavailable');
    const token = validateCredential(credential.data?.value, expected, now());
    action = headMode ? 'head' : 'observe-seed';
    const response = await requestJSON(endpoint, { Authorization: 'Bearer ' + token, Accept: 'application/json' }, 16384, fetcher, timeoutMs, monotonic, start + 20000, () => requests++);
    if (!(headMode ? [200] : [200, 503]).includes(response.status)) fail('observation-http-rejected');
    observation = headMode ? validateHeadObservation(response.data, expected, mode==='current-head-only') : validateObservation(response.data, expected, response.status);
    if (monotonic() - start >= 20000) fail('request-timeout');
    if (response.status === 503) fail('observation-unavailable');
    return { ...base, ...expected, status: 'observation-returned', observation, recordedAt: new Date(now()).toISOString(), elapsedMs: Math.round(monotonic() - start), requests };
  } catch (error) {
    return { ...base, ...(expected || {}), status: 'failed', action, reason: allowedErrors.has(error?.safeReason) ? error.safeReason : 'context-rejected', ...(observation ? { observation } : {}), recordedAt: new Date(now()).toISOString(), elapsedMs: Math.round(monotonic() - start), requests };
  }
}

export function validateHeadObservation(value, expected, current = false) {
  if (!exactKeys(value, ['revision', 'generation', 'engineRevision', 'activeDelivery']) ||
      !revisionPattern.test(value.revision || '') || !enginePattern.test(value.engineRevision || '') ||
      !Number.isSafeInteger(value.generation) || value.generation < 0 || typeof value.activeDelivery !== 'boolean') fail('observation-schema-invalid');
  // The reviewed deployment is held. Changed state stops here without probing
  // content, bootstrapping or interpreting a MAX(generation) as trusted history.
  if (value.revision !== (current?expected.expectedHeadRevision:expected.revision) || value.engineRevision !== expected.engineRevision || (!current && value.activeDelivery !== false)) fail('observation-identity-mismatch');
  return { revision: value.revision, generation: value.generation, engineRevision: value.engineRevision, activeDelivery: value.activeDelivery };
}
export const observeSeed = options => observe(options, 'observe-only');
export const observeHead = options => observe(options, 'head-only');
export const observeCurrentHead = options => observe(options, 'current-head-only');

export function writeObservationReceipt(receipt, { output = 'seed-observation-outcome.json', summary = process.env.GITHUB_STEP_SUMMARY } = {}) {
  fs.writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n');
  if (summary) fs.appendFileSync(summary, '\nSeed observation: **' + receipt.status + '**\n\n' +
    (receipt.commit ? 'Expected commit: `' + receipt.commit + '`\n\n' : '') +
    (receipt.observation ? 'Seed: `' + receipt.observation.seed + '`; head: `' + receipt.observation.head + '`\n\n' : '') +
    (receipt.reason ? 'Reason: `' + receipt.reason + '`\n\n' : '') +
    'Readiness: **not-assessed**. Integrity: **not-validated**.\n\n' + receipt.qualification + '\n');
}

export function loadObservationInputs() {
  let manifest, checkoutSha, deployment, sourceTree;
  try {
    deployment = JSON.parse(fs.readFileSync('docs/deployed-seed-observation.json', 'utf8'));
    // Validate before using a repository record in fixed local Git arguments.
    if (!shaPattern.test(deployment.sourceCommit || '')) fail('expected-identity-invalid');
    const git = args => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 65536 }).trim();
    manifest = JSON.parse(git(['show', deployment.sourceCommit + ':content/publication.json']));
    sourceTree = git(['rev-parse', deployment.sourceCommit + '^{tree}']);
    checkoutSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { /* Invalid local input is captured by context-validation below. */ }
  return { manifest, checkoutSha, deployment, sourceTree };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { manifest, checkoutSha, deployment, sourceTree } = loadObservationInputs();
  const receipt = await observeSeed({ manifest, checkoutSha, deployment, sourceTree });
  try { writeObservationReceipt(receipt); } catch { console.error('Observation receipt retention failed.'); process.exitCode = 1; }
  console.log(JSON.stringify(receipt));
  if (receipt.status !== 'observation-returned') process.exitCode = 1;
}
