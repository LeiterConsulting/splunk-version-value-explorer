const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');

function runHeld(t, mode, actions) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'publisher-hold-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const fixture = path.join(dir, 'guard.mjs'), trace = path.join(dir, 'trace.json');
  fs.writeFileSync(fixture, `
    import fs from 'node:fs';
    const calls = [];
    globalThis.fetch = async () => { calls.push('network'); throw Error('Unexpected network'); };
    process.stdin.on = () => { calls.push('stdin'); throw Error('Unexpected credential read'); };
    const read = fs.readFileSync;
    fs.readFileSync = (...args) => {
      if (String(args[0]).includes('content-bundle.json')) { calls.push('candidate'); throw Error('Unexpected candidate read'); }
      return read(...args);
    };
    process.on('exit', () => fs.writeFileSync(${JSON.stringify(trace)}, JSON.stringify(calls)));
  `);
  const result = spawnSync(process.execPath, ['--import', pathToFileURL(fixture).href, path.resolve('scripts/publish-content.mjs'), mode, 'b'.repeat(40)], {
    cwd: dir, encoding: 'utf8', timeout: 5000,
    env: { ...process.env, GITHUB_ACTIONS: actions, GITHUB_SHA: 'c'.repeat(40), GITHUB_STEP_SUMMARY: path.join(dir, 'summary.md'),
      VC_ACTIVE_DELIVERY: '1', VC_PUBLISHER_HOLD: '0', ACTIONS_ID_TOKEN_REQUEST_URL: 'https://test.actions.githubusercontent.com/token', ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'fixture' },
  });
  return { ...result, dir, calls: JSON.parse(fs.readFileSync(trace)) };
}

test('both publication entry points hold before candidate, production or credential access in Actions and locally', t => {
  for (const mode of ['--commit', '--bootstrap']) for (const actions of ['true', 'false']) {
    const result = runHeld(t, mode, actions);
    assert.equal(result.status, 1, result.stderr); assert.deepEqual(result.calls, []);
    const receipt = JSON.parse(result.stdout);
    assert.equal(receipt.status, 'held-publication-disabled'); assert.equal(receipt.action, 'pre-write-hold');
    assert.deepEqual(receipt.completedActions, []); assert.equal(receipt.requests, 0);
    assert.equal(receipt.mutationAttempted, false); assert.equal(receipt.credentialAcquired, false);
    assert.equal(receipt.claimedDelivered, false); assert.equal(receipt.mutationOutcome, 'not-attempted');
    assert.equal(receipt.activeDelivery, undefined); assert.equal(receipt.revision, undefined);
    assert.equal(fs.existsSync(path.join(result.dir, 'publication-outcome.json')), actions === 'true');
  }
});

test('workflow hold is before checkout and cannot select a historical triggering writer', t => {
  const workflow = fs.readFileSync('.github/workflows/publish-content.yml', 'utf8');
  assert.ok(workflow.indexOf('Hold publication before checkout or credentials') < workflow.indexOf('uses: actions/checkout'));
  assert.match(workflow, /if: github.event_name != 'workflow_dispatch' \|\| \(inputs.mode != 'observe-only' && inputs.mode != 'head-only' && inputs.mode != 'bootstrap-only' && inputs.mode != 'resume-only'\)/);
  assert.match(workflow, /ref: \$\{\{ github.sha \}\}/); assert.doesNotMatch(workflow, /ref:.*workflow_run.head_sha/);
  assert.match(workflow, /if: always\(\) && hashFiles\('publication-outcome.json'\)/);
  const inline = workflow.match(/node <<'NODE'\n([\s\S]*?)          NODE/)[1].replace(/^          /gm, '');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'workflow-hold-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const result = spawnSync(process.execPath, ['-e', inline], { cwd: dir, encoding: 'utf8', env: { ...process.env, GITHUB_SHA: 'b'.repeat(40), GITHUB_STEP_SUMMARY: path.join(dir, 'summary.md') } });
  assert.equal(result.status, 1, result.stderr);
  const receipt = JSON.parse(fs.readFileSync(path.join(dir, 'publication-outcome.json')));
  assert.equal(receipt.status, 'held-publication-disabled'); assert.equal(receipt.requests, 0); assert.equal(receipt.mutationAttempted, false);
});
