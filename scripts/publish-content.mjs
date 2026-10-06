/* Fixed-origin publisher. Administrative credentials arrive only through hidden stdin;
 * GitHub Actions obtains a short-lived, commit-scoped OIDC credential in memory. */
import fs from 'node:fs';
import crypto from 'node:crypto';
const args = process.argv.slice(2);
if (!['--commit', '--bootstrap'].includes(args[0]) || (args[0] === '--commit' && (args.length !== 2 || !/^[a-f0-9]{40}$/.test(args[1]))) || (args[0] === '--bootstrap' && (args.length !== 2 || !/^[a-f0-9]{40}$/.test(args[1])))) {
  console.error('Usage: node scripts/publish-content.mjs --commit <main-SHA> | --bootstrap <main-SHA>'); process.exit(1);
}
const commit = args[1], base = 'https://versioncompass.com';
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
  const token = await credential();
  if (!token || /\s/.test(token)) throw Error('Invalid credential');
  const evidenceCredential = process.env.GITHUB_ACTIONS === 'true' ? process.env.VC_GITHUB_EVIDENCE_TOKEN : null;
  if (process.env.GITHUB_ACTIONS === 'true' && !/^[A-Za-z0-9._~+\/-]{20,8190}={0,2}$/.test(evidenceCredential || '')) throw Error('Workflow evidence credential unavailable');
  const candidate = { repository: 'LeiterConsulting/splunk-version-value-explorer', commit, bundle: JSON.parse(fs.readFileSync('dist/content-bundle.json', 'utf8')) };
  const operation = action => 'pub-' + crypto.createHash('sha256').update(commit + ':' + action).digest('hex').slice(0, 32);
  async function call(route, body) {
    const response = await fetch(base + '/api/publisher/' + route, {
      method: body ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(120000),
      headers: { Authorization: 'Bearer ' + token, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(evidenceCredential ? { publication: body, evidenceCredential } : body) } : {}),
    });
    // Do not print upstream bodies, headers, tokens or submitted content.
    if (!response.ok) {
      let reason; try { reason = (await response.json()).reason; } catch {}
      // The service returns only an enumerated non-sensitive rejection category.
      throw Error('Publisher ' + route + ' rejected with HTTP ' + response.status + (/^[a-z0-9-]{1,60}$/.test(reason || '') ? ' (' + reason + ')' : ''));
    }
    return response.json();
  }
  if (args[0] === '--bootstrap') {
    console.log(JSON.stringify(await call('bootstrap', { candidate, operationId: operation('bootstrap') })));
  } else {
    const staged = await call('stage', candidate), head = await call('head');
    if (head.revision === staged.revision) {
      if (head.generation === 0) await call('bootstrap', { candidate, operationId: operation('bootstrap') });
      console.log(JSON.stringify({ status: 'already-current', revision: staged.revision, engineRevision: head.engineRevision, activeDelivery: head.activeDelivery }));
    } else if (!head.activeDelivery) {
      console.log(JSON.stringify({ status: 'staged-awaiting-delivery-verification', revision: staged.revision, current: head }));
    } else {
      console.log(JSON.stringify(await call('activate', { operationId: operation('publish'), revision: staged.revision, expectedRevision: head.revision, expectedGeneration: head.generation, intent: 'publish' })));
    }
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
