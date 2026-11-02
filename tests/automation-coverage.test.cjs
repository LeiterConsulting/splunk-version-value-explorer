const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { validateRegistry, validateRun, validateAmendments, reviewDigest, check } = require('../scripts/lib/automation-coverage.cjs');
const registry = JSON.parse(fs.readFileSync('content/automation-coverage.json'));
const original = JSON.parse(fs.readFileSync('docs/audits/2026-11-02-prep11-advisor-coverage.json'));
const amendments = JSON.parse(fs.readFileSync('content/automation-amendments.json'));
const bind = run => { run.reviewDigest = reviewDigest(run); return run; };
test('pilot covers Prep11 and all three Advisor decisions with separate primary and independent ownership', () => {
  assert.equal(validateRegistry(registry).capabilities.length, 11);
  assert.equal(check().activation, 'pending-first-executions');
});
test('missing owners, independent ownership and canonical sources are rejected', () => {
  for (const edit of [r => delete r.capabilities[0].primaryOwner, r => r.capabilities[0].independentVerification = [], r => r.capabilities[0].sources[0].id = 'missing']) {
    const r = structuredClone(registry); edit(r); assert.throws(() => validateRegistry(r), /owner|source/i);
  }
});
test('sources fetched without assessed claims cannot report assessed-no-change', () => {
  const run = structuredClone(original), entry = run.coverage[0];
  entry.disposition = 'assessed-no-change'; entry.assessments = [];
  assert.throws(() => validateRun(bind(run), registry), /Fetched sources are not assessed/);
});
test('omitted mandatory capabilities and broad success over explicit gaps fail closed', () => {
  const missing = structuredClone(original); missing.coverage.pop();
  assert.throws(() => validateRun(bind(missing), registry), /Missing mandatory/);
  const success = structuredClone(original); success.claimedComplete = true;
  assert.throws(() => validateRun(bind(success), registry), /Broad success/);
  success.claimedComplete = false; success.outcome = 'success';
  assert.throws(() => validateRun(bind(success), registry), /Broad success/);
});
test('the real manual review retains blocked and deferred coverage without claiming saved-task execution or delivery', () => {
  const result = validateRun(original, registry);
  assert.equal(original.kind, 'implementation-review');
  assert.equal(result.coverageComplete, false); assert.equal(result.deliveryComplete, false);
  assert.equal(result.gaps.length, 5);
  assert.equal(original.coverage.find(c => c.capabilityId === 'prep11.workload').assessedAt, null);
});
test('changed source scope invalidates review digest while later delivery receipts do not invent assessments', () => {
  const run = structuredClone(original); run.coverage[0].qualification += ' changed';
  assert.throws(() => validateRun(run, registry), /Stale coverage/);
  const receipt = structuredClone(original); receipt.publication.repository = 'later verified receipt';
  receipt.coverage[0].publishedAt = '2026-11-02T17:00:00Z';
  assert.equal(reviewDigest(receipt), original.reviewDigest);
});
test('activation cannot be inferred from implemented files or a manual audit', () => {
  validateAmendments(amendments, registry);
  const a = structuredClone(amendments); a.amendments[0].activation.status = 'active';
  assert.throws(() => validateAmendments(a, registry), /Activation requires/);
});
test('incomplete coverage requires a finite accountable follow-up', () => {
  const run = structuredClone(original); delete run.coverage.find(o => o.disposition === 'blocked').followUp;
  assert.throws(() => validateRun(bind(run), registry), /finite follow-up/);
});
test('future changed watch reviews cannot omit coverage or substitute a manual implementation review', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-coverage-'));
  const git = args => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  const write = (file, value) => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), JSON.stringify(value)); };
  try {
    git(['init', '--initial-branch', 'main']);
    for (const file of ['automation-coverage.json', 'automation-amendments.json']) write('content/' + file, JSON.parse(fs.readFileSync('content/' + file)));
    write('content/datasets/guidance.json', JSON.parse(fs.readFileSync('content/datasets/guidance.json')));
    const file = 'docs/audits/2026-11-02-version-release-watch.json';
    write(file, { scope: 'prior' });
    git(['add', '.']); git(['-c', 'user.name=Coverage test', '-c', 'user.email=coverage@example.invalid', 'commit', '-m', 'Prior review']);
    const audit = { scope: 'new scoped review' }; write(file, audit);
    assert.throws(() => check(root), /lacks mandatory coverage/);
    const runFile = 'docs/audits/2026-11-02-test-coverage.json', run = structuredClone(original);
    write(runFile, bind(run)); audit.automationCoverage = { runFile }; write(file, audit);
    assert.throws(() => check(root), /not bound to the actual review/);
    run.kind = 'saved-task-execution';
    run.auditBindings = [{ file, reviewDigest: require('../scripts/lib/native-issue-feed.cjs').reviewDigest(audit) }];
    write(runFile, bind(run)); assert.equal(check(root).runs[0].coverageComplete, false);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
