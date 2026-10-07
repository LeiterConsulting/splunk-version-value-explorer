const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { spawnSync } = require('node:child_process');

function diagnose(t, failure) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-delivery-diagnostic-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const fixture = path.join(root, 'transport.mjs');
  fs.writeFileSync(fixture, `
    import fs from 'node:fs';
    import assert from 'node:assert/strict';
    const failure = ${JSON.stringify(failure)};
    const manifest = JSON.parse(fs.readFileSync('dist/content-manifest.json'));
    const bundle = JSON.parse(fs.readFileSync('dist/content-bundle.json'));
    globalThis.fetch = async (input, options) => {
      const url = new URL(input), method = options.method || 'GET';
      assert.equal(url.origin, 'https://versioncompass.com');
      assert.equal(options.redirect, 'error');
      assert(options.signal instanceof AbortSignal);
      if (failure && failure.request === method + ' ' + url.pathname) {
        if (failure.type === 'timeout') throw new DOMException('Transport timed out', 'TimeoutError');
        if (failure.type === 'body') return {ok:true,text:async()=>{throw new DOMException('Body timed out', 'TimeoutError')}};
        if (failure.type === 'invalid-json') return new Response('{', {status:200});
        if (failure.type === 'status') return Response.json({}, {status:failure.status});
      }
      if (method === 'POST') return Response.json({}, {status:405});
      if (url.pathname === '/api/content/health') return Response.json({status:'ready',storage:'d1',revision:manifest.revision,recordCount:manifest.recordCount});
      if (url.pathname === '/api/content/manifest') return Response.json(manifest);
      if (url.pathname === '/api/content/bundle') return Response.json(bundle);
      if (url.pathname === '/api/content/records') return url.searchParams.get('limit') === '201' ? Response.json({}, {status:400}) : Response.json({revision:manifest.revision,records:bundle.catalog.records.filter(x=>x.dataset==='soar').slice(0,2)});
      return new Response('/* Generated from content/datasets/platform.json */', {status:200});
    };
  `);
  const run = spawnSync(process.execPath, ['--import', fixture, 'scripts/diagnose-content.cjs', 'https://versioncompass.com/'], { encoding: 'utf8', timeout: 10000 });
  return { ...run, report: JSON.parse(run.stdout), progress: run.stderr.trim().split('\n').map(line => JSON.parse(line)) };
}

test('delivery diagnostic reports success only after every check, with separate progress output', t => {
  const result = diagnose(t, null);
  assert.equal(result.status, 0);
  assert.equal(result.report.status, 'delivery-checks-passed');
  assert.equal(Object.keys(result.report.checks).length, 6);
  assert(result.progress.some(x => x.check === 'read-only-api' && x.outcome === 'running'));
  assert(result.progress.every(x => x.outcome === 'running' || x.outcome === 'passed'));
});

test('response and body timeouts block certification without recommending an application repair', t => {
  for (const failure of [{request:'GET /api/content/health',type:'timeout'}, {request:'GET /data.js',type:'body'}]) {
    const result = diagnose(t, failure);
    assert.equal(result.status, 2);
    assert.equal(result.report.status, 'issues-detected');
    const name = failure.type === 'body' ? 'bundled-fallback-assets' : 'database-health';
    const check = result.report.checks[name];
    assert.equal(check.outcome, 'blocked');
    assert.equal(check.failureType, 'transport-unavailable');
    assert.equal(check.errorName, 'TimeoutError');
    assert.equal(check.request.phase, failure.type === 'body' ? 'body' : 'response');
    assert.match(result.report.findings[0].recommendedChange, /Retry this exact check/);
    assert.equal(result.report.findings[0].checksPassed, false);
    assert.equal(result.report.checks['bounded-record-query'].outcome, 'passed');
  }
});

test('malformed returned JSON is a failed verification rather than transport unavailability', t => {
  const result = diagnose(t, {request:'GET /api/content/manifest',type:'invalid-json'});
  assert.equal(result.status, 2);
  assert.equal(result.report.checks['live-manifest'].outcome, 'failed');
  assert.equal(result.report.checks['live-manifest'].failureType, 'verification-failed');
});

test('public write acceptance fails; unavailable method-guard responses remain blocked', t => {
  const accepted = diagnose(t, {request:'POST /api/content/manifest',type:'status',status:200});
  assert.equal(accepted.status, 2);
  assert.equal(accepted.report.checks['read-only-api'].outcome, 'failed');
  assert.match(accepted.report.findings[0].recommendedChange, /Restore the read-only method guard/);
  const unavailable = diagnose(t, {request:'POST /api/content/manifest',type:'timeout'});
  assert.equal(unavailable.status, 2);
  assert.equal(unavailable.report.checks['read-only-api'].outcome, 'blocked');
  assert.equal(unavailable.report.checks['read-only-api'].request.method, 'POST');
  assert.equal(unavailable.report.checks['read-only-api'].request.path, '/api/content/manifest');
  assert.doesNotMatch(unavailable.report.findings[0].recommendedChange, /Restore/);
});
