const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { execFileSync } = require('node:child_process');
const { select } = require('../scripts/select-publication.cjs');
const { inputManifest, regenerate, hash } = require('../scripts/maintenance.cjs');
const { verify } = require('../scripts/verify-transfer.cjs');
const repo = 'LeiterConsulting/splunk-version-value-explorer', a = 'a'.repeat(40), b = 'b'.repeat(40);
const event = () => ({ workflow_run: { id: 1, status: 'completed', conclusion: 'success', event: 'push', head_branch: 'main', path: '.github/workflows/validate.yml', repository: { full_name: repo }, head_repository: { full_name: repo }, head_sha: a } });
test('an older validation trigger never publishes newer main under its OIDC identity', () => {
  assert.deepEqual(select('workflow_run', event(), b), { commit: a, validationRun: 1, publish: false, status: 'superseded-trigger-not-published' });
  assert.equal(select('workflow_run', event(), a).publish, true);
  assert.equal(select('workflow_dispatch', {}, b).commit, b);
  for (const change of [r => r.conclusion = 'failure', r => r.head_branch = 'other', r => r.head_repository.full_name = 'foreign/repo', r => r.event = 'pull_request', r => r.path = 'other.yml']) { const e = event(); change(e.workflow_run); assert.throws(() => select('workflow_run', e, a), /Untrusted/); }
});
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-pipeline-')); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = args => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  git(['init', '--initial-branch', 'main']); fs.writeFileSync(path.join(root, 'input.json'), '{"authority":"canonical"}\n'); fs.writeFileSync(path.join(root, 'generated.json'), '{"stale":true}\n');
  git(['add', '.']); git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'Synthetic inputs']);
  return root;
}
test('raw-byte transfer rejects truncation, transcript prefixes, wrong digests and invalid UTF-8', t => {
  const root = fixture(t), file = path.join(root, 'input.json'), bytes = fs.readFileSync(file);
  assert.equal(verify(file, hash(bytes), bytes.length).status, 'raw-json-bytes-verified');
  assert.throws(() => verify(file, '0'.repeat(64), bytes.length), /differ/);
  for (const bad of [Buffer.from('Warning: truncated output\n'+bytes), bytes.subarray(0, 8), Buffer.from([0xff])]) {
    fs.writeFileSync(file, bad); assert.throws(() => verify(file, hash(bytes), bytes.length), /differ/); assert.throws(() => inputManifest(root), /Invalid UTF-8 JSON/);
  }
});
test('generated text transfers require exact source bytes and valid UTF-8', t => {
  const root = fixture(t), file = path.join(root, 'generated.js'), bytes = Buffer.from('window.example = { label: "caf\u00e9 \u2726" };\n');
  fs.writeFileSync(file, bytes);
  assert.equal(verify(file, hash(bytes), bytes.length, 'text').status, 'raw-text-bytes-verified');
  assert.throws(() => verify(file, hash(bytes), bytes.length), SyntaxError);
  for (const bad of [Buffer.from('Warning: truncated output\n' + bytes), bytes.subarray(0, bytes.length - 1), Buffer.from(bytes.toString().replace('example', 'changed'))]) {
    fs.writeFileSync(file, bad); assert.throws(() => verify(file, hash(bytes), bytes.length, 'text'), /differ/);
  }
  const bad = Buffer.from([0xff, 0xfe, 0x61]); fs.writeFileSync(file, bad);
  assert.throws(() => verify(file, hash(bad), bad.length, 'text'), /encoded data/);
  assert.throws(() => inputManifest(root), /Invalid UTF-8 text input: generated.js/);
});
test('binary and empty transfers are explicit and never silently replace JSON validation', t => {
  const root = fixture(t), file = path.join(root, 'archive.zip');
  for (const bytes of [Buffer.from([0x50, 0x4b, 0xff, 0xfe]), Buffer.alloc(0)]) {
    fs.writeFileSync(file, bytes);
    assert.equal(verify(file, hash(bytes), bytes.length, 'bytes').status, 'raw-bytes-verified');
    assert.throws(() => verify(file, hash(bytes), bytes.length));
  }
  assert.equal(verify(file, hash(Buffer.alloc(0)), 0, 'text').status, 'raw-text-bytes-verified');
  assert.throws(() => verify(file, hash(Buffer.alloc(0)), 0, 'unknown'), /format/);
  assert.throws(() => verify(file, hash(Buffer.alloc(0)), -1, 'bytes'), /byte length/);
});
test('transfer CLI preserves strict JSON default and accepts only explicit text or bytes modes', t => {
  const root = fixture(t), file = path.join(root, 'generated.js'), bytes = Buffer.from('window.example = true;\n'); fs.writeFileSync(file, bytes);
  const script = path.resolve(__dirname, '../scripts/verify-transfer.cjs'), args = [script, file, hash(bytes), String(bytes.length)];
  const json = path.join(root, 'input.json'), jsonBytes = fs.readFileSync(json);
  assert.equal(JSON.parse(execFileSync(process.execPath, [script, json, hash(jsonBytes), String(jsonBytes.length)])).status, 'raw-json-bytes-verified');
  assert.equal(JSON.parse(execFileSync(process.execPath, [...args, '--text'])).status, 'raw-text-bytes-verified');
  assert.equal(JSON.parse(execFileSync(process.execPath, [...args, '--bytes'])).status, 'raw-bytes-verified');
  for (const suffix of [[], ['--typo'], ['--text', 'extra']]) assert.throws(() => execFileSync(process.execPath, [...args, ...suffix], { stdio: 'pipe' }));
});
test('malformed generated text is rejected before isolated generators can repair or bless it', t => {
  const root = fixture(t), file = path.join(root, 'generated.js'), bytes = Buffer.from([0xff]); fs.writeFileSync(file, bytes);
  const rewrite = [process.execPath, '-e', 'require("fs").writeFileSync("generated.js", "window.example = true;\\n")'];
  assert.throws(() => regenerate(root, [rewrite]), /Invalid UTF-8 text input/);
  assert.deepEqual(fs.readFileSync(file), bytes);
});
test('malformed generator output is rejected without applying any generated changes', t => {
  const root = fixture(t), file = path.join(root, 'generated.js'); fs.writeFileSync(file, 'window.example = true;\n');
  const before = inputManifest(root);
  const corrupt = [process.execPath, '-e', 'const fs=require("fs");fs.writeFileSync("generated.js", Buffer.from([255]));fs.writeFileSync("generated.json", "{}\\n")'];
  assert.throws(() => regenerate(root, [corrupt]), /Invalid UTF-8 text input/);
  assert.deepEqual(inputManifest(root), before);
});
test('failed generation leaves original files intact; successful generation applies validated bytes only', t => {
  const root = fixture(t), before = inputManifest(root);
  const generate = [process.execPath, '-e', 'require("fs").writeFileSync("generated.json",require("fs").readFileSync("input.json"))'];
  assert.throws(() => regenerate(root, [generate, [process.execPath, '-e', 'process.exit(1)']]), /Preparation failed/);
  assert.deepEqual(inputManifest(root), before);
  const result = regenerate(root, [generate]);
  assert.equal(result.generated.length, 1); assert.equal(fs.readFileSync(path.join(root, 'generated.json'), 'utf8'), fs.readFileSync(path.join(root, 'input.json'), 'utf8'));
});
test('source edits arriving during isolated generation cause a safe retry instead of overwriting them', t => {
  const root = fixture(t), input = path.join(root, 'input.json');
  assert.throws(() => regenerate(root, [[process.execPath, '-e', 'require("fs").writeFileSync('+JSON.stringify(input)+',"{}\\n")']]), /Source changed/);
  assert.equal(fs.readFileSync(input, 'utf8'), '{}\n'); assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'generated.json'))).stale, true);
});
for (const staged of [false, true]) test('preparation preserves an ordinary ' + (staged ? 'staged' : 'unstaged') + ' tracked deletion', t => {
  const root = fixture(t), file = path.join(root, 'obsolete.txt');
  const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: 'pipe' });
  fs.writeFileSync(file, 'Synthetic obsolete file.\n'); git(['add', 'obsolete.txt']);
  git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'Synthetic obsolete input']);
  fs.rmSync(file); if (staged) git(['add', '--update']);
  const status = git(['status', '--porcelain']);
  assert.deepEqual(inputManifest(root).find(f => f.file === 'obsolete.txt'), { file: 'obsolete.txt', deleted: true });
  const verifyDeletion = [process.execPath, '-e', 'const fs=require("fs"),cp=require("child_process");if(fs.existsSync("obsolete.txt")||cp.spawnSync("git",["ls-files","--error-unmatch","obsolete.txt"]).status===0)process.exit(1)'];
  assert.equal(regenerate(root, [verifyDeletion]).generated.length, 0);
  assert.equal(fs.existsSync(file), false); assert.equal(git(['status', '--porcelain']), status);
});
test('generated deletion is applied only after successful validation', t => {
  const root = fixture(t), file = path.join(root, 'generated.json'), before = fs.readFileSync(file);
  const remove = [process.execPath, '-e', 'require("fs").unlinkSync("generated.json")'];
  assert.throws(() => regenerate(root, [remove, [process.execPath, '-e', 'process.exit(1)']]), /Preparation failed/);
  assert.deepEqual(fs.readFileSync(file), before);
  assert.deepEqual(regenerate(root, [remove]).generated, [{ file: 'generated.json', deleted: true }]);
  assert.equal(fs.existsSync(file), false);
});
test('publication requires the full native-feed, coverage, Advisor and retained-export contract', async () => {
  const { REQUIRED_STEPS } = await import('../worker/publication-core.mjs');
  for (const step of ['node scripts/sync-advisor.cjs --check','node scripts/advisor-maintenance.cjs --check','node scripts/sync-issue-feed.cjs --check','node scripts/check-native-issue-feed.cjs','node scripts/check-automation-coverage.cjs','Bind rendered exports to release readiness','Retain candidate export evidence']) assert(REQUIRED_STEPS.includes(step));
});
test('monitoring cannot use a stale or PR success as main validation or turn a green publisher into delivery proof', async () => {
  const { summarize } = await import('../scripts/pipeline-status.mjs');
  const run = { id: 2, path: '.github/workflows/validate.yml', head_sha: a, event: 'push', head_branch: 'main', status: 'completed', conclusion: 'success' };
  assert.equal(summarize(b, [run]).validation.status, 'missing');
  assert.equal(summarize(a, [{ ...run, event: 'pull_request' }]).validation.status, 'missing');
  const value = summarize(a, [run, { ...run, id: 3, path: '.github/workflows/publish-content.yml' }]);
  assert.equal(value.validation.status, 'success'); assert.equal(value.publisher.status, 'success'); assert.equal(value.claimedDelivered, false); assert.equal(value.delivery, 'unverified');
  assert.equal(summarize(a, [run, { ...run, id: 4, conclusion: 'cancelled' }]).validation.status, 'cancelled');
});
test('operational role evidence is additive and cannot activate content coverage or change publisher semantics', async () => {
  const { operationalReadiness, watchReadiness, summarize } = await import('../scripts/pipeline-status.mjs');
  const operational = { status: 'evidence-matched', roles: [{ roleId: 'github-steward', accepted: true }], claimedDelivered: false };
  const runtime = { status: 'unverified', operational };
  assert.equal(operationalReadiness(runtime), operational);
  assert.equal(watchReadiness('1.2.0', [], runtime).status, 'unverified');
  assert.equal(watchReadiness('1.2.0', [], runtime).incompleteWatches.length, 4);
  assert.equal(summarize(a, []).publisher.outcome.status, 'unavailable');
  assert.equal(summarize(a, []).claimedDelivered, false);
});
