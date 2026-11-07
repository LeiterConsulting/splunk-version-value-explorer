/* Sequential, bounded delivery checks. Public content GETs can initialize/write D1. */
const fs = require('node:fs'), crypto = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const { performance } = require('node:perf_hooks');
const LIMITS = Object.freeze({ requestMs: 10000, totalMs: 120000, maxRequests: 64, maxRecords: 10000, maxBodyBytes: 16777216 });
const ADAPTERS = ['data.js','product-data.js','guidance-data.js','environment-data.js','editions-data.js','forwarders-data.js','soar-data.js'];
class DiagnosticError extends Error {}
function fault(message, failureType = 'verification-failed', extra = {}) { return Object.assign(new DiagnosticError(message), { failureType, ...extra }); }
function assert(condition, message) { if (!condition) throw fault(message); }
function bounded(value, maximum) { assert(Number.isInteger(value) && value > 0 && value <= maximum, 'Invalid diagnostic budget'); return value; }

async function diagnoseContent({ baseUrl = 'http://127.0.0.1:4173/', expected, fetchImpl = globalThis.fetch, now = () => performance.now(), progress = () => {}, requestMs = LIMITS.requestMs, totalMs = LIMITS.totalMs, maxRequests = LIMITS.maxRequests, expectedAdapters = Object.fromEntries(ADAPTERS.map(file => [file, fs.readFileSync('dist/' + file)])) } = {}) {
  const base = new URL(baseUrl);
  assert(['http:', 'https:'].includes(base.protocol) && !base.username && !base.password, 'Use an HTTP(S) site URL without credentials');
  bounded(requestMs, LIMITS.requestMs); bounded(totalMs, LIMITS.totalMs); bounded(maxRequests, LIMITS.maxRequests);
  assert(expected?.schemaVersion === 1 && /^content-[a-f0-9]{24}$/.test(expected.revision) && /^engine-[a-f0-9]{20}$/.test(expected.engineRevision) && /^[a-f0-9]{64}$/.test(expected.digest) && Number.isSafeInteger(expected.recordCount) && expected.recordCount > 0 && expected.recordCount <= LIMITS.maxRecords, 'Invalid expected publication identity');
  const checks = {}, findings = [], started = now();
  let requests = 0, halted = false, bundle;
  const selection = 'revision=' + expected.revision + '&engine=' + expected.engineRevision;
  async function request(path, { method = 'GET', status = 200, format = 'json' } = {}) {
    const url = new URL(path, base.origin);
    assert(path.length <= 512 && url.origin === base.origin && /^\/(?:api\/content\/(?:health|manifest|bundle|records)|(?:data|product-data|guidance-data|environment-data|editions-data|forwarders-data|soar-data)\.js|content-manifest\.json)$/.test(url.pathname), 'Request outside bounded delivery paths');
    assert(method === 'GET' || (method === 'POST' && path === '/api/content/manifest'), 'Request method outside diagnostic scope');
    if (requests >= maxRequests || now() - started >= totalMs) throw fault('Diagnostic request/time budget exhausted', 'budget-exhausted');
    requests++;
    const controller = new AbortController(), requestStarted = now();
    let phase = 'response', timer, reader, responseBody, cancellationRequested = false;
    function cleanupBody() {
      if (cancellationRequested || (!reader && !responseBody)) return;
      cancellationRequested = true;
      // Cancellation is best effort: never let an uncooperative stream extend the deadline.
      try { Promise.resolve(reader ? reader.cancel() : responseBody.cancel()).catch(() => {}); } catch {}
      try { reader?.releaseLock(); } catch {}
    }
    const remaining = Math.min(requestMs, totalMs - (now() - started));
    const timeout = () => fault('Request deadline exceeded; server outcome unknown', 'transport-unavailable', { errorName: 'TimeoutError' });
    function checkDeadline() {
      if (controller.signal.aborted) throw timeout();
      const time = now();
      if (time - started >= totalMs) throw fault('Diagnostic time budget exhausted', 'budget-exhausted');
      if (time - requestStarted >= requestMs) throw timeout();
    }
    try {
      const work = (async () => {
        const response = await fetchImpl(url, { method, signal: controller.signal, redirect: 'manual' });
        responseBody = response.body;
        if (controller.signal.aborted) { cleanupBody(); throw timeout(); }
        checkDeadline();
        assert(!response.redirected && !(response.status >= 300 && response.status < 400), 'Redirect rejected');
        if (response.url) assert(new URL(response.url).href === url.href, 'Response URL mismatch');
        if (response.status !== status) throw fault('Unexpected HTTP status ' + (Number.isInteger(response.status) ? response.status : 'unknown'), response.status === 503 ? 'service-unavailable' : 'verification-failed');
        phase = 'body';
        const declaredLength = response.headers?.get('content-length');
        if (declaredLength !== null && declaredLength !== undefined) assert(/^\d+$/.test(declaredLength) && Number(declaredLength) <= LIMITS.maxBodyBytes, 'Declared response body exceeds diagnostic cap');
        // Consume within the same deadline, including guard responses. Bound memory too.
        const chunks = []; let bytes = 0;
        if (responseBody?.getReader) {
          reader = responseBody.getReader();
          for (;;) {
            checkDeadline();
            const part = await reader.read();
            checkDeadline();
            if (part.done) break;
            bytes += part.value.byteLength;
            assert(bytes <= LIMITS.maxBodyBytes, 'Response body exceeds diagnostic cap');
            if (part.value.byteLength) chunks.push(Buffer.from(part.value));
          }
        } else {
          assert(responseBody == null && format === 'none', 'Streaming response body required');
        }
        checkDeadline();
        if (format === 'none') return null;
        const bodyBytes = Buffer.concat(chunks);
        checkDeadline();
        if (format === 'bytes') return bodyBytes;
        let text;
        try { text = new TextDecoder('utf-8', { fatal: true }).decode(bodyBytes); }
        catch { throw fault('Invalid UTF-8 response'); }
        checkDeadline();
        let parsed;
        try { parsed = JSON.parse(text); } catch { throw fault('Invalid JSON response'); }
        checkDeadline();
        return parsed;
      })();
      const result = await Promise.race([work, new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(timeout()); }, remaining); })]);
      checkDeadline();
      return result;
    } catch (error) {
      controller.abort();
      if (!(error instanceof DiagnosticError)) error = fault('Response transport unavailable; server outcome unknown', 'transport-unavailable', { errorName: ['TimeoutError','AbortError'].includes(error.name) ? error.name : 'TransportError' });
      error.request = { path, method, phase };
      throw error;
    } finally { clearTimeout(timer); cleanupBody(); }
  }
  async function check(name, action, recommendation) {
    if (halted) { checks[name] = { outcome: 'skipped', evidence: 'Stopped after first unsuccessful check' }; return; }
    const time = now(); progress({ check: name, outcome: 'running', checkedAt: new Date().toISOString() });
    try { checks[name] = { outcome: 'passed', evidence: await action() }; }
    catch (error) {
      halted = true;
      const blocked = ['transport-unavailable','service-unavailable','budget-exhausted'].includes(error.failureType);
      checks[name] = { outcome: blocked ? 'blocked' : 'failed', failureType: error.failureType || 'verification-failed', evidence: error instanceof DiagnosticError ? error.message : 'Invalid response structure', ...(error.request ? { request: error.request } : {}), ...(error.errorName ? { errorName: error.errorName } : {}) };
      findings.push({ observed: name + ': ' + checks[name].evidence, impact: 'Delivery verification stopped; subsequent requests were not sent', recommendedChange: blocked ? 'Hold further public checks and inspect matching Worker evidence. Client abort does not cancel server initialization; do not automatically retry.' : recommendation, reversible: true, checksPassed: false, resolved: false });
    }
    checks[name].checkedAt = new Date().toISOString(); checks[name].elapsedMs = Math.max(0, now() - time);
    progress({ check: name, outcome: checks[name].outcome, elapsedMs: checks[name].elapsedMs });
  }
  await check('database-health', async () => {
    assert(isDeepStrictEqual(await request('/content-manifest.json'), expected), 'Static manifest differs from repo publication; public initialization not attempted');
    const h = await request('/api/content/health');
    assert(h.status === 'ready' && h.storage === 'd1' && h.revision === expected.revision && h.engineRevision === expected.engineRevision && h.recordCount === expected.recordCount, 'Storage, revision, engine or count mismatch');
    return { status: 'ready', storage: 'd1', revision: expected.revision, engineRevision: expected.engineRevision, recordCount: expected.recordCount };
  }, 'Check D1 binding and schema without triggering another public initialization.');
  await check('live-manifest', async () => {
    assert(isDeepStrictEqual(await request('/api/content/manifest'), expected), 'Live manifest differs from repo publication');
    return expected;
  }, 'Reconcile the exact published source/build and cache.');
  await check('bundle-integrity', async () => {
    bundle = await request('/api/content/bundle?' + selection);
    assert(bundle && isDeepStrictEqual(Object.keys(bundle).sort(), ['catalog', 'globals', 'manifest']), 'Bundle envelope mismatch');
    assert(isDeepStrictEqual(bundle.manifest, expected), 'Bundle manifest identity mismatch');
    const digest = crypto.createHash('sha256').update(JSON.stringify({ schemaVersion: 1, globals: bundle.globals, catalog: bundle.catalog })).digest('hex');
    assert(digest === expected.digest && bundle.catalog.schemaVersion === 1 && bundle.catalog.records.length === expected.recordCount, 'Bundle digest or record count mismatch');
    assert(bundle.catalog.records.every(r => typeof r.id === 'string') && new Set(bundle.catalog.records.map(r => r.id)).size === expected.recordCount, 'Bundle record identities invalid');
    return { digest, recordCount: expected.recordCount, engineRevision: expected.engineRevision };
  }, 'Investigate the immutable seed and payload integrity before further requests.');
  await check('bounded-record-query', async () => {
    const records = new Map(bundle.catalog.records.map(r => [r.id, r])), seen = new Set();
    // Exact count, each full record, unique IDs and a terminal empty page, not a sample.
    let pages = 0;
    for (let offset = 0; ; offset = Math.min(offset + 200, expected.recordCount)) {
      const page = await request('/api/content/records?' + selection + '&offset=' + offset + '&limit=200'); pages++;
      const count = Math.min(200, Math.max(0, expected.recordCount - offset));
      assert(page.revision === expected.revision && page.offset === offset && page.limit === 200 && Array.isArray(page.records) && page.records.length === count, 'Record pagination metadata/count mismatch');
      for (const record of page.records) {
        assert(record && !seen.has(record.id) && records.has(record.id) && isDeepStrictEqual(record, records.get(record.id)), 'Duplicate, unexpected or corrupt paginated record');
        seen.add(record.id);
      }
      if (count === 0) break;
    }
    assert(seen.size === expected.recordCount, 'Missing paginated records');
    const r = await request('/api/content/records?' + selection + '&dataset=soar&limit=2');
    const soar = bundle.catalog.records.filter(x => x.dataset === 'soar').sort((a,b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0).slice(0,2);
    assert(r.revision === expected.revision && r.offset === 0 && r.limit === 2 && isDeepStrictEqual(r.records, soar), 'Query filtering mismatch');
    for (const query of ['limit=201', 'offset=-1', 'dataset=unknown', 'revision=invalid', 'engine=invalid', 'limit=2&limit=2', 'unknown=1']) {
      await request('/api/content/records?' + query, { status: query === 'engine=invalid' ? 409 : 400, format: 'none' });
    }
    return { recordCount: seen.size, pages, pageSize: 200, terminalEmptyPage: true, filterAndLimitGuard: 'passed' };
  }, 'Repair record parity or query validation before continuing delivery.');
  await check('read-only-api', async () => {
    await request('/api/content/manifest', { method: 'POST', status: 405, format: 'none' });
    return 'POST rejected with 405; GET/HEAD can still initialize/write D1';
  }, 'Restore the read-only method guard before exposing the content service.');
  await check('bundled-fallback-assets', async () => {
    for (const file of ADAPTERS) {
      const delivered = await request('/' + file, { format: 'bytes' });
      assert(crypto.createHash('sha256').update(delivered).digest('hex') === crypto.createHash('sha256').update(expectedAdapters[file]).digest('hex'), 'Fallback adapter byte digest mismatch');
    }
    return 'All seven fallback adapters match local generated byte digests';
  }, 'Rebuild the seven adapters from canonical datasets and package them with the client.');
  return { evaluatedAt: new Date().toISOString(), target: base.origin, expectedRevision: expected.revision, status: halted ? 'issues-detected' : 'delivery-checks-passed', checks, findings, budget: { requests, maxRequests, requestMs, totalMs, elapsedMs: Math.max(0, now() - started) }, limitations: ['Public content GET/HEAD requests can initialize/write D1; client abort does not cancel server work.', 'No automatic retry, warm-up, deployment or activation is performed.', 'Sequential observations are not an atomic database snapshot.', 'Browser journeys, actual HTML reopening and native PDF rendering require separate evidence.'] };
}
module.exports = { diagnoseContent, LIMITS };
if (require.main === module) (async () => {
  assert(process.argv.length <= 3 && !(process.argv[2] || '').startsWith('--'), 'Usage: node scripts/diagnose-content.cjs [HTTP(S)-site-URL]');
  const report = await diagnoseContent({ baseUrl: process.argv[2], expected: JSON.parse(fs.readFileSync('content/publication.json', 'utf8')), progress: value => console.error(JSON.stringify(value)) });
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== 'delivery-checks-passed') process.exitCode = 2;
})().catch(() => { console.error('Diagnostic could not start: check local publication, URL and arguments'); process.exitCode = 1; });
