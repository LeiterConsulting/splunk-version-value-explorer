/* Actual read-only delivery checks. Output can be attached to the soak evidence. */
const fs = require('node:fs'), crypto = require('node:crypto');
const expected = JSON.parse(fs.readFileSync('content/publication.json', 'utf8'));
const base = new URL(process.argv[2] || 'http://127.0.0.1:4173/');
if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) throw Error('Use an HTTP(S) site URL without credentials');
const checks = {}, findings = [];
function transportError(error, path, method, phase) {
  return Object.assign(new Error(error.message), { failureType: 'transport-unavailable', request: { path, method, phase }, errorName: error.name });
}
async function check(name, action, recommendation) {
  const started = Date.now();
  console.error(JSON.stringify({ check: name, outcome: 'running', checkedAt: new Date().toISOString() }));
  try { checks[name] = { outcome: 'passed', evidence: await action(), checkedAt: new Date().toISOString() }; }
  catch (error) {
    const blocked = error.failureType === 'transport-unavailable';
    checks[name] = { outcome: blocked ? 'blocked' : 'failed', failureType: blocked ? error.failureType : 'verification-failed', evidence: String(error.message), checkedAt: new Date().toISOString(), ...(blocked ? { request: error.request, errorName: error.errorName } : {}) };
    findings.push({ observed: name + ': ' + error.message, impact: 'Delivery check incomplete; the cause is not established', recommendedChange: blocked ? 'Retry this exact check after transport recovery and inspect matching Worker request logs; do not infer an application defect from an unavailable response.' : recommendation, reversible: true, checksPassed: false, resolved: false });
  }
  checks[name].elapsedMs = Date.now() - started;
  console.error(JSON.stringify({ check: name, outcome: checks[name].outcome, elapsedMs: checks[name].elapsedMs }));
}
async function response(path, options) {
  try { return await fetch(new URL(path, base), { ...options, signal: AbortSignal.timeout(10000), redirect: 'error' }); }
  catch (error) { throw transportError(error, path, options?.method || 'GET', 'response'); }
}
async function body(r, path, format) {
  try { return await r[format](); }
  catch (error) { if (error instanceof SyntaxError) throw error; throw transportError(error, path, 'GET', 'body'); }
}
async function json(path) { const r = await response(path); if (!r.ok) throw Error('HTTP ' + r.status + ' at ' + path); return body(r, path, 'json'); }
function assert(condition, message) { if (!condition) throw Error(message); }
(async () => {
  await check('database-health', async () => { const h = await json('/api/content/health'); assert(h.status === 'ready' && h.storage === 'd1' && h.revision === expected.revision && h.recordCount === expected.recordCount, 'Storage, revision or count mismatch'); return h; }, 'Check D1 binding and applied schema; preserve complete bundled fallback while repairing delivery.');
  await check('live-manifest', async () => { const m = await json('/api/content/manifest'); assert(JSON.stringify(m) === JSON.stringify(expected), 'Live manifest differs from repo publication'); return m; }, 'Reconcile the published source/build and cache before publishing the exact validated revision.');
  await check('bundle-integrity', async () => { const b = await json('/api/content/bundle?revision=' + expected.revision); const digest = crypto.createHash('sha256').update(JSON.stringify({ schemaVersion: 1, globals: b.globals, catalog: b.catalog })).digest('hex'); assert(b.manifest.digest === expected.digest && digest === expected.digest && b.catalog.records.length === expected.recordCount, 'Bundle digest or record count mismatch'); return { digest, recordCount: b.catalog.records.length }; }, 'Restore the exact immutable repo seed and investigate interrupted imports or changed payloads.');
  await check('bounded-record-query', async () => { const r = await json('/api/content/records?revision=' + expected.revision + '&dataset=soar&limit=2'); assert(r.revision === expected.revision && r.records.length === 2 && r.records.every(x => x.dataset === 'soar'), 'Query filtering mismatch'); assert((await response('/api/content/records?limit=201')).status === 400, 'Unbounded query accepted'); return 'SOAR filter, revision and maximum page size verified'; }, 'Repair query validation and bound parameter handling, then rerun API tests.');
  await check('read-only-api', async () => { assert((await response('/api/content/manifest', { method: 'POST' })).status === 405, 'Public write method accepted'); return 'POST rejected with 405'; }, 'Restore the read-only method guard before exposing the content service.');
  await check('bundled-fallback-assets', async () => { for (const file of ['data.js','product-data.js','guidance-data.js','environment-data.js','editions-data.js','forwarders-data.js','soar-data.js']) { const r = await response('/' + file); assert(r.ok && /Generated from content\/datasets\//.test(await body(r, '/' + file, 'text')), 'Missing generated adapter ' + file); } return 'All seven complete fallback adapters served'; }, 'Rebuild the seven adapters from canonical datasets and package them with the client.');
  const failed = Object.values(checks).some(x => x.outcome !== 'passed');
  console.log(JSON.stringify({ evaluatedAt: new Date().toISOString(), target: base.origin, expectedRevision: expected.revision, status: failed ? 'issues-detected' : 'delivery-checks-passed', checks, findings, limitations: ['Browser journeys, actual HTML reopening and native PDF rendering require separate evidence.'] }, null, 2));
  if (failed) process.exitCode = 2;
})().catch(error => { console.error(error.message); process.exitCode = 1; });
