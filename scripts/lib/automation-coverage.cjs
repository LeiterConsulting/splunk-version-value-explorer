const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const native = require('./native-issue-feed.cjs');
const statuses = ['changed', 'assessed-no-change', 'deferred', 'blocked', 'failed', 'out-of-scope'];
const successful = new Set(statuses.slice(0, 2));
const clocks = ['discoveredAt', 'retrievedAt', 'assessedAt', 'publishedAt', 'liveVerifiedAt'];
const assert = (value, message) => { if (!value) throw Error(message); };
const text = value => typeof value === 'string' && value.trim().length > 0;
const strings = value => Array.isArray(value) && value.length > 0 && value.every(text) && new Set(value).size === value.length;
const timestamp = value => typeof value === 'string' && /T.*(?:Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value));
const read = (root, file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const reviewDigest = run => native.reviewDigest({ ...Object.fromEntries(Object.entries(run).filter(([key]) => key !== 'reviewDigest')), coverage: run.coverage?.map(o => Object.fromEntries(Object.entries(o).filter(([key]) => !['publishedAt', 'liveVerifiedAt'].includes(key)))) });
function pointer(value, location) {
  assert(typeof location === 'string' && location.startsWith('/'), 'Claim needs a JSON pointer');
  return location.slice(1).split('/').reduce((v, part) => v?.[part.replace(/~1/g, '/').replace(/~0/g, '~')], value);
}
function validateRegistry(registry, root = process.cwd()) {
  assert(registry.schemaVersion === 1 && /^\d+\.\d+\.\d+$/.test(registry.registryVersion), 'Invalid coverage registry version');
  assert(registry.activation === 'pending-first-executions' || registry.activation === 'active', 'Invalid activation state');
  assert(Array.isArray(registry.owners) && strings(registry.owners.map(o => o.id)), 'Invalid owner identities');
  const owners = new Set(registry.owners.map(o => o.id));
  assert(Array.isArray(registry.capabilities) && strings(registry.capabilities.map(c => c.id)), 'Duplicate/missing capability identities');
  const guidance = read(root, 'content/datasets/guidance.json');
  for (const record of [...guidance.preparation11.baseline, ...guidance.preparation11.contextUpdates]) {
    assert(registry.capabilities.some(c => c.claimFamilies?.some(f => f.id === record.id && pointer(guidance, f.pointer)?.id === record.id)), 'Unregistered Prep11 claim family: ' + record.id);
  }
  const advisorGoals = read(root, 'content/advisor-goals.json').goals;
  for (const goal of advisorGoals) assert(registry.capabilities.some(c => c.id === 'advisor.' + goal.id && c.claimFamilies?.some(f => f.id === goal.record)), 'Unregistered Advisor decision: ' + goal.id);
  for (const c of registry.capabilities) {
    assert(c.mandatory === true && c.requiredDisposition === 'every-participating-run', 'Pilot scope cannot silently become optional: ' + c.id);
    assert(owners.has(c.primaryOwner), 'Missing primary owner: ' + c.id);
    assert(strings(c.independentVerification) && c.independentVerification.every(o => owners.has(o) && o !== c.primaryOwner), 'Missing independent owner: ' + c.id);
    assert(strings(c.participatingWatches) && c.participatingWatches.every(o => owners.has(o)), 'Unknown participating watch: ' + c.id);
    assert(c.participatingWatches.includes(c.primaryOwner) && c.independentVerification.every(o => c.participatingWatches.includes(o)), 'Owner omitted from run coverage: ' + c.id);
    assert(strings(c.interfaces) && strings(c.exports) && strings(c.requiredChecks), 'Missing interfaces/exports/checks: ' + c.id);
    assert(c.freshness.sourceCheckDays > 0 && c.freshness.claimAssessmentDays > 0 && c.freshness.onDependencyChange === 'reassess-affected-scope', 'Missing freshness rules: ' + c.id);
    assert(owners.has(c.escalation.owner) && text(c.escalation.trigger) && text(c.escalation.action), 'Missing escalation: ' + c.id);
    assert(Array.isArray(c.sources) && strings(c.sources.map(s => s.id)), 'Missing source ownership: ' + c.id);
    for (const s of c.sources) {
      const canonical = read(root, 'content/datasets/' + s.dataset + '.json').sources?.[s.id];
      assert(canonical && canonical.url === s.url && text(s.section), 'Missing/stale canonical public source: ' + s.id);
      const url = new URL(s.url);
      assert(url.protocol === 'https:' && !url.username && !url.password && registry.publicSourceHosts.includes(url.hostname), 'Non-public source: ' + s.id);
    }
    assert(Array.isArray(c.claimFamilies) && strings(c.claimFamilies.map(f => f.id)), 'Missing assessed claim families: ' + c.id);
    for (const f of c.claimFamilies) {
      assert(text(f.scope) && pointer(read(root, 'content/datasets/' + f.dataset + '.json'), f.pointer) !== undefined, 'Unresolved claim scope: ' + f.id);
      assert(strings(f.sourceIds) && f.sourceIds.every(id => c.sources.some(s => s.id === id)), 'Claim without mapped sources: ' + f.id);
    }
  }
  return registry;
}
function validateRun(run, registry, root = process.cwd()) {
  validateRegistry(registry, root);
  assert(run.schemaVersion === 1 && run.registryVersion === registry.registryVersion && text(run.runId), 'Run needs the exact registry version and identity');
  assert(registry.owners.some(o => o.id === run.watchId) && timestamp(run.recordedAt), 'Invalid run owner/time');
  assert(run.kind === 'saved-task-execution' || run.kind === 'implementation-review', 'Invalid run kind');
  assert(typeof run.claimedComplete === 'boolean' && typeof run.publication?.claimedDelivered === 'boolean', 'Run must explicitly declare coverage and delivery completeness');
  assert(run.reviewDigest === reviewDigest(run), 'Stale coverage review-input digest');
  const required = registry.capabilities.filter(c => c.participatingWatches.includes(run.watchId));
  assert(required.length > 0 && Array.isArray(run.coverage), 'No mandatory coverage declared');
  assert(new Set(run.coverage.map(o => o.capabilityId)).size === run.coverage.length, 'Duplicate capability disposition');
  assert(run.coverage.length === required.length && required.every(c => run.coverage.some(o => o.capabilityId === c.id)), 'Missing mandatory capability disposition');
  for (const o of run.coverage) {
    const c = required.find(c => c.id === o.capabilityId);
    assert(c && statuses.includes(o.disposition) && text(o.qualification), 'Invalid capability disposition');
    assert(clocks.every(k => Object.hasOwn(o, k) && (o[k] === null || timestamp(o[k]))), 'Keep all five clocks explicit: ' + c.id);
    assert(Array.isArray(o.retrievals) && Array.isArray(o.assessments), 'Separate retrievals and assessed claims: ' + c.id);
    assert(new Set(o.retrievals.map(r => r.sourceId)).size === o.retrievals.length, 'Duplicate source retrieval');
    for (const r of o.retrievals) {
      assert(c.sources.some(s => s.id === r.sourceId) && ['retrieved', 'blocked', 'failed'].includes(r.outcome) && text(r.evidence), 'Invalid retrieval evidence');
      assert(r.retrievedAt === null || timestamp(r.retrievedAt), 'Invalid retrieval time');
      assert(timestamp(r.retrievedAt) || /^\d{4}-\d{2}-\d{2}$/.test(r.observedOn || ''), 'Retrieval needs actual time or qualified observation date');
    }
    assert(new Set(o.assessments.map(a => a.claimId)).size === o.assessments.length, 'Duplicate assessed claim family');
    for (const a of o.assessments) {
      const family = c.claimFamilies.find(f => f.id === a.claimId);
      assert(family && ['changed', 'assessed-no-change', 'unable-to-verify'].includes(a.outcome) && timestamp(a.assessedAt) && text(a.evidence) && text(a.qualification), 'Invalid scoped assessment');
      assert(strings(a.sourceIds) && family.sourceIds.every(id => a.sourceIds.includes(id)) && a.sourceIds.every(id => family.sourceIds.includes(id)), 'Assessment needs exact mapped claim sources');
      if (a.outcome !== 'unable-to-verify') assert(a.sourceIds.every(id => o.retrievals.some(r => r.sourceId === id && r.outcome === 'retrieved')), 'Assessed claim lacks retrieved supporting source');
    }
    if (successful.has(o.disposition)) {
      assert(timestamp(o.assessedAt) && c.claimFamilies.every(f => o.assessments.some(a => a.claimId === f.id && a.outcome !== 'unable-to-verify')), 'Fetched sources are not assessed claim coverage: ' + c.id);
      assert(o.disposition === 'changed' ? o.assessments.some(a => a.outcome === 'changed') : o.assessments.every(a => a.outcome === 'assessed-no-change'), 'Disposition disagrees with claim assessments');
    } else {
      assert(registry.owners.some(w => w.id === o.followUp?.owner) && text(o.followUp?.action) && /^\d{4}-\d{2}-\d{2}$/.test(o.followUp?.reviewBy || ''), 'Incomplete coverage needs accountable finite follow-up: ' + c.id);
    }
  }
  const gaps = run.coverage.filter(o => !successful.has(o.disposition)).map(o => ({ capabilityId: o.capabilityId, disposition: o.disposition }));
  assert(!run.claimedComplete || gaps.length === 0, 'Broad success hides incomplete mandatory coverage');
  assert(!['success', 'succeeded', 'passed', 'complete', 'completed'].includes(run.outcome) || gaps.length === 0, 'Broad success hides incomplete mandatory coverage');
  const changed = run.coverage.filter(o => o.disposition === 'changed');
  const checkIds = [...new Set(changed.flatMap(o => required.find(c => c.id === o.capabilityId).requiredChecks))];
  const deliveryComplete = gaps.length === 0 && checkIds.every(id => run.validation?.checks?.some(c => c.id === id && c.outcome === 'passed' && text(c.evidence))) && changed.every(o => timestamp(o.publishedAt) && timestamp(o.liveVerifiedAt));
  assert(!run.publication?.claimedDelivered || deliveryComplete, 'Publication/live delivery is incomplete');
  return { runId: run.runId, watchId: run.watchId, coverageComplete: gaps.length === 0, deliveryComplete, gaps, qualification: 'Structural coverage accounting only; source truth and independent judgment require actual review.' };
}
function validateAmendments(ledger, registry, root = process.cwd()) {
  assert(ledger.schemaVersion === 1 && Array.isArray(ledger.amendments), 'Invalid amendment ledger');
  for (const a of ledger.amendments) {
    assert(text(a.id) && a.registryVersion === registry.registryVersion && text(a.authorization?.evidence), 'Amendment needs version and authorization');
    for (const field of ['claims', 'interfaces', 'exports', 'owners', 'privacy', 'authority', 'budgets', 'schedules']) assert(text(a.impact?.[field]), 'Missing amendment impact: ' + field);
    assert(strings(a.implementation?.files) && Array.isArray(a.savedTasks) && a.savedTasks.length > 0, 'Missing implementation/task reconciliation');
    const reconciled = a.savedTasks.every(t => t.status === 'read-back-verified' && text(t.beforeDigest) && text(t.afterDigest) && text(t.readbackEvidence) && t.cadencePreserved === true && t.permissionsPreserved === true);
    const executed = a.savedTasks.every(t => {
      const first = t.firstExecution;
      if (first?.status !== 'verified') return false;
      assert(text(first.runId) && timestamp(first.verifiedAt) && text(first.evidence) && /^docs\/audits\/\d{4}-\d{2}-\d{2}-[a-z0-9-]+-coverage\.json$/.test(first.runFile || ''), 'Verified first execution needs a retained coverage run');
      const run = read(root, first.runFile), result = validateRun(run, registry, root);
      assert(run.kind === 'saved-task-execution' && run.runId === first.runId && run.watchId === t.id && result.coverageComplete, 'Manual/incomplete review cannot verify first saved-task execution');
      return true;
    });
    assert(a.activation?.status === 'pending' || a.activation?.status === 'active', 'Invalid amendment activation');
    if (a.activation.status === 'active' || registry.activation === 'active') assert(reconciled && executed && timestamp(a.activation.activatedAt), 'Activation requires saved readback and real verified first executions');
    if (!reconciled || !executed) assert(a.activation.status === 'pending' && a.activation.activatedAt === null, 'Unverified amendment must stay pending');
  }
  return ledger;
}
function check(root = process.cwd()) {
  const registry = validateRegistry(read(root, 'content/automation-coverage.json'), root);
  validateAmendments(read(root, 'content/automation-amendments.json'), registry, root);
  const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().split('\n').filter(Boolean);
  const candidates = new Set([...git(['ls-files', 'docs/audits/*-coverage.json']), ...git(['ls-files', '--others', '--exclude-standard', 'docs/audits/*-coverage.json'])]);
  const results = [...candidates].map(file => ({ file, ...validateRun(read(root, file), registry, root) }));
  // Match the native-feed changed-review gate; historical unchanged runs do not
  // acquire a retrospective assessment or an invented task execution.
  const parents = git(['rev-list', '--parents', '-n', '1', 'HEAD'])[0].split(/\s+/).slice(1);
  const changed = new Set([...git(['diff', '--name-only', 'HEAD']), ...git(['ls-files', '--others', '--exclude-standard'])]);
  for (const parent of parents) git(['diff', '--name-only', parent, 'HEAD']).forEach(f => changed.add(f));
  for (const file of [...changed].filter(f => ['version-release-watch', 'version-guidance-audit'].includes(native.watchFor(f)))) {
    assert(fs.existsSync(path.join(root, file)), 'Do not delete watch history: ' + file);
    const audit = read(root, file);
    const reviewChanged = ['HEAD', ...parents].some(rev => {
      try { return native.reviewDigest(JSON.parse(execFileSync('git', ['show', rev + ':' + file], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }))) !== native.reviewDigest(audit); }
      catch { return true; }
    });
    if (!reviewChanged) continue;
    const binding = audit.automationCoverage;
    assert(binding && candidates.has(binding.runFile), 'Changed watch review lacks mandatory coverage: ' + file);
    const run = read(root, binding.runFile);
    assert(run.kind === 'saved-task-execution' && run.watchId === native.watchFor(file) && run.auditBindings?.some(b => b.file === file && b.reviewDigest === native.reviewDigest(audit)), 'Watch coverage is not bound to the actual review: ' + file);
  }
  return { registryVersion: registry.registryVersion, activation: registry.activation, runs: results };
}
module.exports = { statuses, clocks, pointer, reviewDigest, validateRegistry, validateRun, validateAmendments, check };
