const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const manifest = JSON.parse(fs.readFileSync('dist/content-manifest.json'));

function runCli(t, rejection) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-publisher-cli-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const trace = path.join(root, 'trace.json'), fixture = path.join(root, 'transport.mjs');
  fs.writeFileSync(fixture, `
    import fs from 'node:fs';
    import assert from 'node:assert/strict';
    const manifest = ${JSON.stringify(manifest)}, rejection = ${JSON.stringify(rejection)};
    const calls = []; let initialized = false;
    process.on('exit', () => fs.writeFileSync(${JSON.stringify(trace)}, JSON.stringify(calls)));
    globalThis.fetch = async (url, options) => {
      assert.equal(new URL(url).origin, 'https://versioncompass.com');
      assert.equal(options.redirect, 'error');
      assert.equal(options.headers.Authorization, 'Bearer ' + 'a'.repeat(64));
      const route = new URL(url).pathname.split('/').at(-1); calls.push(route);
      if (route === 'stage') return Response.json({revision:manifest.revision});
      if (route === 'bootstrap') {
        const body = JSON.parse(options.body);
        assert.equal(body.candidate.bundle.manifest.revision, manifest.revision);
        assert.equal(body.candidate.commit, 'b'.repeat(40));
        assert.match(body.operationId, /^pub-[a-f0-9]{32}$/);
        initialized = true; return Response.json({status:'initialized'});
      }
      if (route === 'head') return initialized ? Response.json({revision:manifest.revision,generation:1,engineRevision:manifest.engineRevision,activeDelivery:false}) : Response.json({reason:rejection.reason}, {status:rejection.status});
      throw Error('Unexpected publisher action');
    };
  `);
  const result = spawnSync(process.execPath, ['--import', fixture, 'scripts/publish-content.mjs', '--commit', 'b'.repeat(40)], { input: 'a'.repeat(64) + '\n', encoding: 'utf8', env: { ...process.env, GITHUB_ACTIONS: 'false' } });
  return { ...result, calls: JSON.parse(fs.readFileSync(trace)) };
}

test('publisher CLI explicitly initializes a fresh engine without requiring public traffic', t => {
  const result = runCli(t, {status:409, reason:'initial-publication-required'});
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.calls, ['stage', 'head', 'bootstrap', 'head']);
  assert.deepEqual(JSON.parse(result.stdout), {status:'already-current',revision:manifest.revision,engineRevision:manifest.engineRevision,activeDelivery:false});
});

test('publisher CLI never bootstraps on authentication, verification or existing-head failures', t => {
  for (const rejection of [{status:401,reason:'initial-publication-required'}, {status:409,reason:'verification-unavailable'}, {status:409,reason:'bootstrap-head-conflict'}]) {
    const result = runCli(t, rejection);
    assert.equal(result.status, 1);
    assert.deepEqual(result.calls, ['stage', 'head']);
    assert.match(result.stderr, /Publisher head rejected/);
  }
});
