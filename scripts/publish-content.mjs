/* Fixed-origin publisher. Administrative credentials arrive only through hidden stdin;
 * GitHub Actions obtains a short-lived, commit-scoped OIDC credential in memory. */
import fs from 'node:fs';
import crypto from 'node:crypto';
const args = process.argv.slice(2);
if (!['--commit', '--bootstrap'].includes(args[0]) || (args[0] === '--commit' && (args.length !== 2 || !/^[a-f0-9]{40}$/.test(args[1]))) || (args[0] === '--bootstrap' && (args.length !== 2 || !/^[a-f0-9]{40}$/.test(args[1])))) {
  console.error('Usage: node scripts/publish-content.mjs --commit <main-SHA> | --bootstrap <main-SHA>'); process.exit(1);
}
// An unconditional repository hold, not an environment flag or active-reader gate.
// Removing it requires a separately reviewed publication decision. No input,
// credential, production read or mutation below this point is currently reached.
const held = { commit: args[1], recordedAt: new Date().toISOString(),
  status: 'held-publication-disabled', action: 'pre-write-hold', target: 'local-policy',
  completedActions: [], requests: 0, credentialAcquired: false, mutationAttempted: false,
  mutationOutcome: 'not-attempted', claimedDelivered: false,
  qualification: 'Publication is held before candidate reads, credentials and production requests. No runtime, D1, head, activation or delivery state was observed.' };
if (process.env.GITHUB_ACTIONS === 'true') {
  fs.writeFileSync('publication-outcome.json', JSON.stringify(held, null, 2) + '\n');
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    '\nPublisher outcome: **held-publication-disabled**\n\n' + held.qualification + '\n');
}
console.log(JSON.stringify(held));
process.exit(1);

// Retained publication safeguards for review; unreachable while the hold above exists.
const commit = args[1], base = 'https://versioncompass.com';
let action = 'candidate-input', mutation = false;
let runtimeMismatch;
const enginePattern = /^engine-[a-f0-9]{20}$/;
const completedActions = [];
function actionTarget() {
  return ['stage','head','bootstrap','activate'].includes(action) ? base + '/api/publisher/' + action : action === 'candidate-input' ? 'dist/content-bundle.json' : action === 'credential-acquisition' ? (process.env.GITHUB_ACTIONS === 'true' ? 'GitHub Actions OIDC issuer' : 'hidden stdin') : base + '/content-manifest.json';
}
function receipt(result) {
  const value = { commit, recordedAt: new Date().toISOString(), action, target: actionTarget(), completedActions, ...result, claimedDelivered: false,
    qualification: 'D1 publisher result only. Sites runtime deployment and live visitor verification require separate evidence.' };
  if (process.env.GITHUB_ACTIONS === 'true') {
    fs.writeFileSync('publication-outcome.json', JSON.stringify(value, null, 2) + '\n');
    if (process.env.GITHUB_STEP_SUMMARY) {
      const details = runtimeMismatch ? [
        'Deployed engine: `' + runtimeMismatch.deployedEngineRevision + '`',
        'Required engine: `' + runtimeMismatch.requiredEngineRevision + '`',
        'Use the authorized Sites deployment process for the validated current main runtime before retrying publication.'
      ] : [];
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, ['\nPublisher outcome: **' + value.status + '**', '`' + commit + '`', ...details, value.qualification, ''].join('\n\n'));
    }
  }
  console.log(JSON.stringify(value));
}
async function credential() {
  if (process.env.GITHUB_ACTIONS === 'true') {
    const url = new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.actions.githubusercontent.com') || url.username || url.password) throw Error('Unsupported OIDC issuer endpoint');
    url.searchParams.set('audience', base);
    const response = await fetch(url, { headers: { Authorization: 'Bearer ' + process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN }, redirect: 'error', signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw Error('OIDC credential unavailable');
    const result = await response.json(); if (!result.value) throw Error('OIDC credential unavailable'); return result.value;
  }
  return new Promise((resolve, reject) => {
    let input = '';
    const terminal = process.stdin.isTTY;
    if (terminal) { process.stdin.setRawMode(true); process.stderr.write('Ready for publisher credential on stdin (input is hidden).\n'); }
    const finish = () => { if (terminal) process.stdin.setRawMode(false); process.stdin.pause(); };
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => {
      if (chunk.includes('\u0003')) { finish(); reject(Error('Cancelled')); return; }
      input += chunk;
      if (input.length > 16000) { finish(); reject(Error('Invalid credential')); return; }
      if (input.includes('\n') || input.includes('\r')) { finish(); resolve(input.trim()); }
    });
    process.stdin.on('end', () => { finish(); resolve(input.trim()); });
    process.stdin.resume();
  });
}
try {
  if (process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_SHA !== commit) throw Error('Selected commit differs from the workflow OIDC commit; no publication attempted');
  const candidate = { repository: 'LeiterConsulting/splunk-version-value-explorer', commit, bundle: JSON.parse(fs.readFileSync('dist/content-bundle.json', 'utf8')) };
  const requiredEngineRevision = candidate.bundle.manifest?.engineRevision;
  if (!enginePattern.test(requiredEngineRevision || '')) throw Error('Candidate engine revision invalid; no publication attempted');
  action = 'runtime-inspection';
  const runtime = await fetch(base + '/content-manifest.json', { redirect: 'error', signal: AbortSignal.timeout(15000) });
  if (!runtime.ok) throw Error('Deployed engine inspection unavailable; no publication attempted');
  const deployed = await runtime.json();
  const deployedEngineRevision = deployed.engineRevision;
  if (!enginePattern.test(deployedEngineRevision || '')) throw Error('Deployed engine inspection invalid; no publication attempted');
  if (deployedEngineRevision !== requiredEngineRevision) {
    runtimeMismatch = { deployedEngineRevision, requiredEngineRevision };
    throw Error('Engine mismatch: candidate requires a separately authorized Sites runtime deployment; no publisher write attempted');
  }
  completedActions.push(action); action = 'credential-acquisition';
  const token = await credential();
  if (!token || /\s/.test(token)) throw Error('Invalid credential');
  const evidenceCredential = process.env.GITHUB_ACTIONS === 'true' ? process.env.VC_GITHUB_EVIDENCE_TOKEN : null;
  if (process.env.GITHUB_ACTIONS === 'true' && !/^[A-Za-z0-9._~+\/-]{20,8190}={0,2}$/.test(evidenceCredential || '')) throw Error('Workflow evidence credential unavailable');
  const operation = action => 'pub-' + crypto.createHash('sha256').update(commit + ':' + action).digest('hex').slice(0, 32);
  async function call(route, body) {
    action = route; mutation = !!body;
    const response = await fetch(base + '/api/publisher/' + route, {
      method: body ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(120000),
      headers: { Authorization: 'Bearer ' + token, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(evidenceCredential ? { publication: body, evidenceCredential } : body) } : {}),
    });
    // Do not print upstream bodies, headers, tokens or submitted content.
    if (!response.ok) {
      let reason; try { reason = (await response.json()).reason; } catch {}
      // The service returns only an enumerated non-sensitive rejection category.
      const error = Error('Publisher ' + route + ' rejected with HTTP ' + response.status + (/^[a-z0-9-]{1,60}$/.test(reason || '') ? ' (' + reason + ')' : ''));
      error.status = response.status; error.reason = reason;
      throw error;
    }
    const result = await response.json(); completedActions.push(route); mutation = false; return result;
  }
  if (args[0] === '--bootstrap') {
    receipt(await call('bootstrap', { candidate, operationId: operation('bootstrap') }));
  } else {
    const staged = await call('stage', candidate);
    let head;
    try { head = await call('head'); }
    catch (error) {
      if (error.status !== 409 || error.reason !== 'initial-publication-required') throw error;
      await call('bootstrap', { candidate, operationId: operation('bootstrap') });
      head = await call('head');
    }
    if (head.revision === staged.revision) {
      if (head.generation === 0) await call('bootstrap', { candidate, operationId: operation('bootstrap') });
      receipt({ status: 'already-current', revision: staged.revision, engineRevision: head.engineRevision, activeDelivery: head.activeDelivery });
    } else if (!head.activeDelivery) {
      receipt({ status: 'staged-awaiting-delivery-verification', revision: staged.revision, activeDelivery: false, current: head });
    } else {
      receipt(await call('activate', { operationId: operation('publish'), revision: staged.revision, expectedRevision: head.revision, expectedGeneration: head.generation, intent: 'publish' }));
    }
  }
} catch (error) {
  receipt({ status: runtimeMismatch ? 'held-runtime-deployment-required' : 'failed',
    reason: runtimeMismatch ? 'engine-mismatch' : /^[a-z0-9-]{1,60}$/.test(error.reason || '') ? error.reason : 'publisher-verification-failed',
    ...runtimeMismatch,
    mutationOutcome: mutation ? ([401,403].includes(error.status) ? 'denied' : error.status ? 'rejected-completion-unverified' : 'uncertain-read-back-before-retry') : 'no-write-at-failed-action' });
  console.error(error.message); process.exitCode = 1;
}
