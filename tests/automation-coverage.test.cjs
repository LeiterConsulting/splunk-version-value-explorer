const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { validateRegistry, validateRun, validateAmendments, reviewDigest, check } = require('../scripts/lib/automation-coverage.cjs');
// Historical fixtures resolve the immutable contract under which they ran.
const registry = JSON.parse(fs.readFileSync('content/automation-registries/1.0.0.json'));
const original = JSON.parse(fs.readFileSync('docs/audits/2026-11-02-prep11-advisor-coverage.json'));
const amendments = JSON.parse(fs.readFileSync('content/automation-amendments.json'));
amendments.amendments = amendments.amendments.filter(a => a.registryVersion === registry.registryVersion);
function copyHistoricalFixture(file, root) {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  if (file === 'content/automation-coverage.json') fs.writeFileSync(path.join(root,file),JSON.stringify(registry));
  else if (file === 'content/automation-amendments.json') fs.writeFileSync(path.join(root,file),JSON.stringify(amendments));
  else fs.copyFileSync(file,path.join(root,file));
}
const bind = run => { run.reviewDigest = reviewDigest(run); return run; };
test('current source contract retains feature-specific Agent Mode evidence and existing CSP SOC responsibility',()=>{
 const current=JSON.parse(fs.readFileSync('content/automation-coverage.json'));
 assert.equal(current.registryVersion,'1.1.0');assert.equal(current.activation,'pending-first-executions');validateRegistry(current);
 const agent=current.capabilities.find(c=>c.id==='advisor.agent-mode');
 for(const id of ['aiSaiaAgentMode','aiSaiaModelRuntime','aiSaiaCloudConnected'])assert(agent.claimFamilies[0].sourceIds.includes(id));
 const soc=current.capabilities.find(c=>c.id==='advisor.soc-workflow');assert.equal(soc.primaryOwner,'es-editions-watch');assert(soc.participatingWatches.includes('csp-fedramp-watch'));
 assert.match(soc.claimFamilies[0].scope,/customer authorization remain separate/);
 assert.deepEqual(JSON.parse(fs.readFileSync('content/automation-registries/1.1.0.json')),current);
 assert.equal(validateRun(original,current).gaps.length,5); // Historical implementation outcome is not relabeled.
});
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
test('the registry cannot silently omit an implemented Prep11 capability or Advisor decision', () => {
  for (const id of ['prep11.discovery', 'prep11.operator', 'advisor.agent-mode']) {
    const value = structuredClone(registry); value.capabilities = value.capabilities.filter(c => c.id !== id);
    assert.throws(() => validateRegistry(value), /Unregistered/);
  }
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
    write('content/automation-coverage.json',registry);write('content/automation-amendments.json',amendments);
    write('content/automation-registries/1.0.0.json', registry);
    write('content/advisor-goals.json', JSON.parse(fs.readFileSync('content/advisor-goals.json')));
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
function completeRun() {
  const run = structuredClone(original);
  run.claimedComplete = true; run.outcome = 'complete';
  run.coverage = registry.capabilities.map(c => ({ capabilityId: c.id, disposition: 'assessed-no-change', qualification: 'Synthetic validator fixture, not a source review.',
    discoveredAt: null, retrievedAt: run.recordedAt, assessedAt: run.recordedAt, publishedAt: null, liveVerifiedAt: null,
    retrievals: c.sources.map(s => ({ sourceId: s.id, outcome: 'retrieved', retrievedAt: run.recordedAt, evidence: 'Synthetic retrieved fixture.' })),
    assessments: c.claimFamilies.map(f => ({ claimId: f.id, outcome: 'assessed-no-change', sourceIds: f.sourceIds, assessedAt: run.recordedAt, evidence: 'Synthetic scoped review.', qualification: 'Fixture only.' })) }));
  return bind(run);
}
test('freshness is measured at the actual retained run, with stale and future evidence rejected', () => {
  assert.equal(validateRun(completeRun(), registry).coverageComplete, true);
  for (const mutate of [
    r => { r.coverage[0].assessments[0].assessedAt = '2026-09-01T00:00:00Z'; },
    r => { r.coverage[0].assessments[0].assessedAt = '2099-01-01T00:00:00Z'; },
    r => { r.coverage[0].retrievals[0].retrievedAt = '2026-09-01T00:00:00Z'; },
    r => { r.coverage[0].retrievals[0].retrievedAt = '2099-01-01T00:00:00Z'; },
    r => { r.recordedAt = '2099-01-01T00:00:00Z'; },
  ]) { const run = completeRun(); mutate(run); assert.throws(() => validateRun(bind(run), registry), /Stale|Future/); }
  assert.equal(validateRun(completeRun(), registry, process.cwd(), Date.parse('2026-11-03T00:00:00Z')).coverageComplete, true);
});
test('Advisor claim identity must match the pointed-to canonical record', () => {
  const r = structuredClone(registry), goals = r.capabilities.filter(c => c.id.startsWith('advisor.'));
  goals[0].claimFamilies[0].pointer = goals[1].claimFamilies[0].pointer;
  assert.throws(() => validateRegistry(r), /mismatched Advisor/);
});
test('complete no-change coverage still needs every required validation gate for delivery', () => {
  const run = completeRun(); run.publication.claimedDelivered = true;
  assert.throws(() => validateRun(bind(run), registry), /delivery is incomplete/);
});
test('retained runs resolve immutable registry versions after an active version change', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-coverage-version-')); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const file of ['content/advisor-goals.json', 'content/datasets/guidance.json', 'content/automation-registries/1.0.0.json']) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.copyFileSync(file, path.join(root, file));
  }
  const next = { ...structuredClone(registry), registryVersion: '1.1.0' };
  assert.equal(validateRun(original, next, root).runId, original.runId);
  const missing = { ...original, registryVersion: '9.0.0' }; assert.throws(() => validateRun(missing, next, root), /ENOENT/);
});
test('first execution cannot activate without delivered checks and matching scheduled task identity', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-first-execution-')); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const file of ['content/advisor-goals.json', 'content/datasets/guidance.json']) copyHistoricalFixture(file, root);
  const ledger = structuredClone(amendments); ledger.amendments[0].savedTasks = [ledger.amendments[0].savedTasks[0]];
  const task = ledger.amendments[0].savedTasks[0], file = 'docs/audits/2026-11-02-synthetic-test-coverage.json';
  task.firstExecution = { status: 'verified', runId: 'synthetic-test', runFile: file, verifiedAt: '2026-11-03T00:00:00Z', evidence: 'Synthetic native run receipt.', schedulerRunId: 'synthetic-scheduler-run' };
  const run = completeRun(); run.kind = 'saved-task-execution'; run.runId = 'synthetic-test';
  const save = () => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), JSON.stringify(bind(run))); };
  save(); assert.throws(() => validateAmendments(ledger, registry, root), /delivery/);
  run.validation = { checks: [...new Set(registry.capabilities.flatMap(c => c.requiredChecks))].map(id => ({ id, outcome: 'passed', evidence: 'Synthetic gate fixture, not CI/live evidence.' })) };
  run.publication.claimedDelivered = true; save(); assert.throws(() => validateAmendments(ledger, registry, root), /task and scheduler identity/);
  run.execution = { taskId: task.taskId, schedulerRunId: 'wrong-run' }; save(); assert.throws(() => validateAmendments(ledger, registry, root), /task and scheduler identity/);
  run.execution.schedulerRunId = task.firstExecution.schedulerRunId; save(); assert.doesNotThrow(() => validateAmendments(ledger, registry, root));
});
test('an active amendment cannot borrow an older complete run that omits its new mandatory gate', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-amendment-version-')); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const file of ['content/advisor-goals.json', 'content/datasets/guidance.json', 'content/automation-registries/1.0.0.json']) copyHistoricalFixture(file, root);
  const next = structuredClone(registry); next.registryVersion = '1.1.0'; next.activation = 'active';
  next.capabilities[0].requiredChecks.push('synthetic-new-required-gate');
  const ledger = structuredClone(amendments), amendment = ledger.amendments[0];
  amendment.registryVersion = next.registryVersion; amendment.activation = { status: 'active', activatedAt: '2026-11-03T00:00:00Z' };
  amendment.savedTasks = [amendment.savedTasks[0]];
  const task = amendment.savedTasks[0], file = 'docs/audits/2026-11-02-synthetic-version-coverage.json';
  task.firstExecution = { status: 'verified', runId: 'synthetic-version-test', runFile: file, verifiedAt: '2026-11-03T00:00:00Z', evidence: 'Synthetic scheduled execution fixture.', schedulerRunId: 'synthetic-version-run' };
  const run = completeRun(); run.kind = 'saved-task-execution'; run.runId = task.firstExecution.runId;
  run.execution = { taskId: task.taskId, schedulerRunId: task.firstExecution.schedulerRunId };
  run.validation = { checks: [...new Set(registry.capabilities.flatMap(c => c.requiredChecks))].map(id => ({ id, outcome: 'passed', evidence: 'Synthetic gate fixture.' })) };
  run.publication.claimedDelivered = true;
  const save = () => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), JSON.stringify(bind(run))); };
  save(); assert.equal(validateRun(run, next, root).deliveryComplete, true);
  assert.throws(() => validateAmendments(ledger, next, root), /exact amendment registry version/);
  run.registryVersion = next.registryVersion; save();
  assert.throws(() => validateAmendments(ledger, next, root), /delivery/);
  run.validation.checks.push({ id: 'synthetic-new-required-gate', outcome: 'passed', evidence: 'Synthetic newly required gate.' }); save();
  assert.doesNotThrow(() => validateAmendments(ledger, next, root));
  // Pending contracts retain their history; only this contract's own complete
  // execution can satisfy its activation gates.
  const pending=structuredClone(amendments.amendments[0]);pending.id='synthetic-pending-prior';
  pending.savedTasks[0].firstExecution.status='pending';ledger.amendments.push(pending);
  assert.doesNotThrow(() => validateAmendments(ledger,next,root));
  const future=structuredClone(pending);future.id='synthetic-pending-future';future.registryVersion='1.2.0';
  fs.mkdirSync(path.join(root,'content/automation-registries'),{recursive:true});
  fs.writeFileSync(path.join(root,'content/automation-registries/1.2.0.json'),JSON.stringify({...registry,registryVersion:'1.2.0'}));
  ledger.amendments.push(future);assert.doesNotThrow(() => validateAmendments(ledger,next,root));
  amendment.registryVersion = '1.0.0'; run.registryVersion = '1.0.0'; run.validation.checks.pop(); save();
  next.activation = 'pending-first-executions'; assert.doesNotThrow(() => validateAmendments(ledger, next, root));
  next.activation = 'active'; assert.throws(() => validateAmendments(ledger, next, root), /matching active amendment/);
});
test('ES participating ownership cannot omit its mandatory coverage binding', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-es-coverage-')); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = args => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  for (const file of ['content/advisor-goals.json', 'content/datasets/guidance.json', 'content/automation-coverage.json', 'content/automation-amendments.json', 'content/automation-registries/1.0.0.json']) copyHistoricalFixture(file, root);
  git(['init', '--initial-branch', 'main']); git(['add', '.']); git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'Synthetic baseline']);
  const file = 'docs/audits/2026-11-03-es-editions-watch.json'; fs.mkdirSync(path.join(root, 'docs/audits'), { recursive: true }); fs.writeFileSync(path.join(root, file), JSON.stringify({ scope: 'Synthetic new ES review' }));
  assert.throws(() => check(root), /lacks mandatory coverage/);
});
test('version snapshots cannot be rewritten or deleted even alongside a matching active registry edit', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-registry-history-')); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = args => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  for (const file of ['content/advisor-goals.json', 'content/datasets/guidance.json', 'content/automation-coverage.json', 'content/automation-amendments.json', 'content/automation-registries/1.0.0.json']) copyHistoricalFixture(file, root);
  git(['init', '--initial-branch', 'main']); git(['add', '.']); git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'Synthetic registry baseline']);
  const value = structuredClone(registry); value.capabilities[0].title += ' edited';
  for (const file of ['content/automation-coverage.json','content/automation-registries/1.0.0.json']) fs.writeFileSync(path.join(root,file),JSON.stringify(value));
  assert.throws(() => check(root), /snapshot is immutable/);
  fs.rmSync(path.join(root,'content/automation-registries/1.0.0.json')); assert.throws(() => check(root), /ENOENT|snapshot/);
});
test('ordinary deletion support does not permit staged or unstaged coverage-history removal', t => {
  for (const staged of [false, true]) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-retained-coverage-')); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const git = args => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
    for (const file of ['content/advisor-goals.json', 'content/datasets/guidance.json', 'content/automation-coverage.json', 'content/automation-amendments.json', 'content/automation-registries/1.0.0.json']) copyHistoricalFixture(file, root);
    const file = path.join(root, 'docs/audits/2026-11-02-retained-coverage.json'); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(original));
    git(['init', '--initial-branch', 'main']); git(['add', '.']); git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'Synthetic retained coverage']);
    fs.rmSync(file); if (staged) git(['add', '--update']);
    assert.throws(() => check(root), /Do not delete coverage history/);
  }
});
test('verified activation changes operational state without rewriting the versioned contract snapshot', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-activation-state-')); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = args => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  const write = (file, value) => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), JSON.stringify(value)); };
  for (const file of ['content/advisor-goals.json', 'content/datasets/guidance.json', 'content/automation-coverage.json', 'content/automation-amendments.json', 'content/automation-registries/1.0.0.json']) copyHistoricalFixture(file, root);
  git(['init', '--initial-branch', 'main']); git(['add', '.']); git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'Synthetic pending activation']);
  write('content/automation-coverage.json', { ...registry, activation: 'active' });
  assert.throws(() => check(root), /Activation requires/);
  const ledger = structuredClone(amendments), amendment = ledger.amendments[0]; amendment.savedTasks = [amendment.savedTasks[0]];
  const task = amendment.savedTasks[0], file = 'docs/audits/2026-11-02-synthetic-activation-coverage.json';
  task.firstExecution = { status: 'verified', runId: 'synthetic-activation', runFile: file, verifiedAt: '2026-11-03T00:00:00Z', evidence: 'Synthetic verified execution.', schedulerRunId: 'synthetic-activation-run' };
  const run = completeRun(); run.kind = 'saved-task-execution'; run.runId = task.firstExecution.runId; run.execution = { taskId: task.taskId, schedulerRunId: task.firstExecution.schedulerRunId };
  run.validation = { checks: [...new Set(registry.capabilities.flatMap(c => c.requiredChecks))].map(id => ({ id, outcome: 'passed', evidence: 'Synthetic complete gate fixture.' })) }; run.publication.claimedDelivered = true;
  amendment.activation = { status: 'active', activatedAt: '2026-11-03T00:00:00Z' }; write(file, bind(run)); write('content/automation-amendments.json', ledger);
  assert.equal(check(root).activation, 'active');
  assert.equal(fs.readFileSync(path.join(root,'content/automation-registries/1.0.0.json'),'utf8'), fs.readFileSync('content/automation-registries/1.0.0.json','utf8'));
});
