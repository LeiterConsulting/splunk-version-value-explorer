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
function validateRegistry(registry, root = process.cwd(), historical = false) {
  assert(registry.schemaVersion === 1 && /^\d+\.\d+\.\d+$/.test(registry.registryVersion), 'Invalid coverage registry version');
  assert(registry.activation === 'pending-first-executions' || registry.activation === 'active', 'Invalid activation state');
  assert(Array.isArray(registry.owners) && strings(registry.owners.map(o => o.id)), 'Invalid owner identities');
  const owners = new Set(registry.owners.map(o => o.id));
  assert(Array.isArray(registry.capabilities) && strings(registry.capabilities.map(c => c.id)), 'Duplicate/missing capability identities');
  const guidance = read(root, 'content/datasets/guidance.json');
  assert(registry.capabilities.some(c => c.id === 'prep11.discovery' && c.claimFamilies?.some(f => f.id === 'prep11.release-scope' && f.dataset === 'guidance' && f.pointer === '/preparation11/questions')), 'Unregistered Prep11 announcement discovery');
  for (const record of historical ? [] : [...guidance.preparation11.baseline, ...guidance.preparation11.contextUpdates]) {
    assert(registry.capabilities.some(c => c.claimFamilies?.some(f => f.id === record.id && pointer(guidance, f.pointer)?.id === record.id)), 'Unregistered Prep11 claim family: ' + record.id);
  }
  const advisorGoals = read(root, 'content/advisor-goals.json').goals;
  for (const goal of historical ? [] : advisorGoals) assert(registry.capabilities.some(c => c.id === 'advisor.' + goal.id && c.claimFamilies?.some(f => f.id === goal.record && f.dataset === 'guidance' && pointer(guidance, f.pointer)?.id === goal.record)), 'Unregistered/mismatched Advisor decision: ' + goal.id);
  for (const c of registry.capabilities) {
    assert(c.mandatory === true && c.requiredDisposition === 'every-participating-run', 'Pilot scope cannot silently become optional: ' + c.id);
    assert(owners.has(c.primaryOwner), 'Missing primary owner: ' + c.id);
    assert(strings(c.independentVerification) && c.independentVerification.every(o => owners.has(o) && o !== c.primaryOwner), 'Missing independent owner: ' + c.id);
    assert(strings(c.participatingWatches) && c.participatingWatches.every(o => owners.has(o)), 'Unknown participating watch: ' + c.id);
    assert(c.participatingWatches.includes(c.primaryOwner) && c.independentVerification.every(o => c.participatingWatches.includes(o)), 'Owner omitted from run coverage: ' + c.id);
    assert(strings(c.interfaces) && strings(c.exports) && strings(c.requiredChecks), 'Missing interfaces/exports/checks: ' + c.id);
    assert([c.freshness.sourceCheckDays, c.freshness.claimAssessmentDays].every(n => Number.isSafeInteger(n) && n > 0) && c.freshness.onDependencyChange === 'reassess-affected-scope', 'Missing freshness rules: ' + c.id);
    assert(owners.has(c.escalation.owner) && text(c.escalation.trigger) && text(c.escalation.action), 'Missing escalation: ' + c.id);
    assert(Array.isArray(c.sources) && strings(c.sources.map(s => s.id)), 'Missing source ownership: ' + c.id);
    for (const s of c.sources) {
      const canonical = read(root, 'content/datasets/' + s.dataset + '.json').sources?.[s.id];
      assert((historical || canonical && canonical.url === s.url) && text(s.section), 'Missing/stale canonical public source: ' + s.id);
      const url = new URL(s.url);
      assert(url.protocol === 'https:' && !url.username && !url.password && registry.publicSourceHosts.includes(url.hostname), 'Non-public source: ' + s.id);
    }
    assert(Array.isArray(c.claimFamilies) && strings(c.claimFamilies.map(f => f.id)), 'Missing assessed claim families: ' + c.id);
    for (const f of c.claimFamilies) {
      assert(text(f.scope) && (historical || pointer(read(root, 'content/datasets/' + f.dataset + '.json'), f.pointer) !== undefined), 'Unresolved claim scope: ' + f.id);
      assert(strings(f.sourceIds) && f.sourceIds.every(id => c.sources.some(s => s.id === id)), 'Claim without mapped sources: ' + f.id);
    }
  }
  return registry;
}
function resolveRegistry(version, registry, root) {
  assert(/^\d+\.\d+\.\d+$/.test(version || ''), 'Invalid retained registry version');
  return version === registry.registryVersion ? registry : read(root, 'content/automation-registries/' + version + '.json');
}
function validateRun(run, registry, root = process.cwd(), now = Date.now()) {
  const activeVersion = registry.registryVersion;
  registry = resolveRegistry(run.registryVersion, registry, root);
  validateRegistry(registry, root, registry.registryVersion !== activeVersion);
  assert(run.schemaVersion === 1 && run.registryVersion === registry.registryVersion && text(run.runId), 'Run needs the exact registry version and identity');
  assert(registry.owners.some(o => o.id === run.watchId) && timestamp(run.recordedAt), 'Invalid run owner/time');
  const observations = run.execution?.observations || [];
  assert(Array.isArray(observations) && observations.every(o => timestamp(o.observedAt) && Date.parse(o.observedAt) <= now), 'Invalid/future execution observation');
  const cutoff = Math.max(Date.parse(run.recordedAt), ...observations.map(o => Date.parse(o.observedAt)));
  assert(cutoff <= now, 'Future run time');
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
    assert(clocks.slice(0, 3).every(k => o[k] === null || Date.parse(o[k]) <= cutoff) && clocks.slice(3).every(k => o[k] === null || Date.parse(o[k]) <= now), 'Future capability clock: ' + c.id);
    assert(Array.isArray(o.retrievals) && Array.isArray(o.assessments), 'Separate retrievals and assessed claims: ' + c.id);
    assert(new Set(o.retrievals.map(r => r.sourceId)).size === o.retrievals.length, 'Duplicate source retrieval');
    for (const r of o.retrievals) {
      assert(c.sources.some(s => s.id === r.sourceId) && ['retrieved', 'blocked', 'failed'].includes(r.outcome) && text(r.evidence), 'Invalid retrieval evidence');
      assert(r.retrievedAt === null || timestamp(r.retrievedAt), 'Invalid retrieval time');
      assert(timestamp(r.retrievedAt) || /^\d{4}-\d{2}-\d{2}$/.test(r.observedOn || ''), 'Retrieval needs actual time or qualified observation date');
      assert(Date.parse(r.retrievedAt || r.observedOn) <= cutoff, 'Future source retrieval: ' + c.id);
    }
    assert(new Set(o.assessments.map(a => a.claimId)).size === o.assessments.length, 'Duplicate assessed claim family');
    for (const a of o.assessments) {
      const family = c.claimFamilies.find(f => f.id === a.claimId);
      assert(family && ['changed', 'assessed-no-change', 'unable-to-verify'].includes(a.outcome) && timestamp(a.assessedAt) && text(a.evidence) && text(a.qualification), 'Invalid scoped assessment');
      assert(Date.parse(a.assessedAt) <= cutoff, 'Future claim assessment: ' + c.id);
      assert(strings(a.sourceIds) && family.sourceIds.every(id => a.sourceIds.includes(id)) && a.sourceIds.every(id => family.sourceIds.includes(id)), 'Assessment needs exact mapped claim sources');
      if (a.outcome !== 'unable-to-verify') assert(a.sourceIds.every(id => o.retrievals.some(r => r.sourceId === id && r.outcome === 'retrieved')), 'Assessed claim lacks retrieved supporting source');
    }
    if (successful.has(o.disposition)) {
      assert(timestamp(o.assessedAt) && c.claimFamilies.every(f => o.assessments.some(a => a.claimId === f.id && a.outcome !== 'unable-to-verify')), 'Fetched sources are not assessed claim coverage: ' + c.id);
      assert(o.disposition === 'changed' ? o.assessments.some(a => a.outcome === 'changed') : o.assessments.every(a => a.outcome === 'assessed-no-change'), 'Disposition disagrees with claim assessments');
      assert(Date.parse(o.assessedAt) <= cutoff && cutoff - Date.parse(o.assessedAt) <= c.freshness.claimAssessmentDays * 86400000 && o.assessments.every(a => cutoff - Date.parse(a.assessedAt) <= c.freshness.claimAssessmentDays * 86400000), 'Stale claim assessment: ' + c.id);
      for (const a of o.assessments) for (const id of a.sourceIds) {
        const r = o.retrievals.find(r => r.sourceId === id && r.outcome === 'retrieved');
        const retrieved = Date.parse(r.retrievedAt || r.observedOn);
        assert(retrieved <= Date.parse(a.assessedAt) && cutoff - retrieved <= c.freshness.sourceCheckDays * 86400000, 'Stale or later-than-assessment source retrieval: ' + c.id);
      }
    } else {
      assert(registry.owners.some(w => w.id === o.followUp?.owner) && text(o.followUp?.action) && /^\d{4}-\d{2}-\d{2}$/.test(o.followUp?.reviewBy || ''), 'Incomplete coverage needs accountable finite follow-up: ' + c.id);
    }
  }
  const gaps = run.coverage.filter(o => !successful.has(o.disposition)).map(o => ({ capabilityId: o.capabilityId, disposition: o.disposition }));
  assert(!run.claimedComplete || gaps.length === 0, 'Broad success hides incomplete mandatory coverage');
  assert(!['success', 'succeeded', 'passed', 'complete', 'completed'].includes(run.outcome) || gaps.length === 0, 'Broad success hides incomplete mandatory coverage');
  const changed = run.coverage.filter(o => o.disposition === 'changed');
  const checkIds = [...new Set(required.flatMap(c => c.requiredChecks))];
  const deliveryComplete = gaps.length === 0 && checkIds.every(id => run.validation?.checks?.some(c => c.id === id && c.outcome === 'passed' && text(c.evidence))) && changed.every(o => timestamp(o.publishedAt) && timestamp(o.liveVerifiedAt) && Date.parse(o.publishedAt) >= Date.parse(o.assessedAt) && Date.parse(o.liveVerifiedAt) >= Date.parse(o.publishedAt));
  assert(!run.publication?.claimedDelivered || deliveryComplete, 'Publication/live delivery is incomplete');
  return { runId: run.runId, watchId: run.watchId, coverageComplete: gaps.length === 0, deliveryComplete, gaps, qualification: 'Structural coverage accounting only; source truth and independent judgment require actual review.' };
}
function validateAmendments(ledger, registry, root = process.cwd()) {
  assert(ledger.schemaVersion === 1 && Array.isArray(ledger.amendments), 'Invalid amendment ledger');
  for (const a of ledger.amendments) {
    const amendmentRegistry = resolveRegistry(a.registryVersion, registry, root);
    assert(text(a.id) && a.registryVersion === amendmentRegistry.registryVersion && text(a.authorization?.evidence), 'Amendment needs version and authorization');
    for (const field of ['claims', 'interfaces', 'exports', 'owners', 'privacy', 'authority', 'budgets', 'schedules']) assert(text(a.impact?.[field]), 'Missing amendment impact: ' + field);
    assert(strings(a.implementation?.files) && Array.isArray(a.savedTasks) && a.savedTasks.length > 0, 'Missing implementation/task reconciliation');
    const reconciled = a.savedTasks.every(t => t.status === 'read-back-verified' && /^sha256:[a-f0-9]{64}$/.test(t.beforeDigest || '') && /^sha256:[a-f0-9]{64}$/.test(t.afterDigest || '') && text(t.readbackEvidence) && t.cadencePreserved === true && t.permissionsPreserved === true);
    const executed = a.savedTasks.every(t => {
      const first = t.firstExecution;
      if (first?.status !== 'verified') return false;
      assert(text(first.runId) && timestamp(first.verifiedAt) && Date.parse(first.verifiedAt) <= Date.now() && text(first.evidence) && /^docs\/audits\/\d{4}-\d{2}-\d{2}-[a-z0-9-]+-coverage\.json$/.test(first.runFile || ''), 'Verified first execution needs a retained coverage run');
      const run = read(root, first.runFile), result = validateRun(run, registry, root);
      assert(run.kind === 'saved-task-execution' && run.runId === first.runId && run.watchId === t.id && result.coverageComplete && result.deliveryComplete && run.claimedComplete && run.publication.claimedDelivered, 'Manual/incomplete review or delivery cannot verify first saved-task execution');
      assert(text(t.taskId) && run.execution?.taskId === t.taskId && text(run.execution.schedulerRunId) && first.schedulerRunId === run.execution.schedulerRunId && Date.parse(first.verifiedAt) >= Date.parse(run.recordedAt), 'First execution needs matching task and scheduler identity');
      return true;
    });
    assert(a.activation?.status === 'pending' || a.activation?.status === 'active', 'Invalid amendment activation');
    if (a.activation.status === 'active' || registry.activation === 'active') assert(reconciled && executed && timestamp(a.activation.activatedAt) && Date.parse(a.activation.activatedAt) <= Date.now(), 'Activation requires saved readback and real verified first executions');
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
  const snapshots = new Set([...git(['ls-files', 'content/automation-registries/*.json']), ...git(['ls-files', '--others', '--exclude-standard', 'content/automation-registries/*.json'])]);
  assert(snapshots.has('content/automation-registries/' + registry.registryVersion + '.json'), 'Current registry needs an immutable version snapshot');
  for (const file of snapshots) {
    const snapshot = read(root, file);
    assert(file === 'content/automation-registries/' + snapshot.registryVersion + '.json', 'Registry snapshot identity mismatch');
    validateRegistry(snapshot, root, snapshot.registryVersion !== registry.registryVersion);
    if (snapshot.registryVersion === registry.registryVersion) assert(JSON.stringify(snapshot) === JSON.stringify(registry), 'Registry changes require a new version and snapshot');
    for (const revision of ['HEAD', ...parents]) {
      let previous;
      try { previous = execFileSync('git', ['show', revision + ':' + file], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { continue; }
      assert(previous === fs.readFileSync(path.join(root, file), 'utf8'), 'Registry snapshot is immutable: ' + file);
    }
  }
  for (const revision of ['HEAD', ...parents]) for (const file of git(['ls-tree', '-r', '--name-only', revision, 'content/automation-registries'])) assert(snapshots.has(file), 'Do not delete registry history: ' + file);
  const changed = new Set([...git(['diff', '--name-only', 'HEAD']), ...git(['ls-files', '--others', '--exclude-standard'])]);
  for (const parent of parents) git(['diff', '--name-only', parent, 'HEAD']).forEach(f => changed.add(f));
  for (const file of [...changed].filter(f => registry.capabilities.some(c => c.participatingWatches.includes(native.watchFor(f))))) {
    assert(fs.existsSync(path.join(root, file)), 'Do not delete watch history: ' + file);
    const audit = read(root, file);
    const reviewChanged = ['HEAD', ...parents].some(rev => {
      try { return native.reviewDigest(JSON.parse(execFileSync('git', ['show', rev + ':' + file], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }))) !== native.reviewDigest(audit); }
      catch { return true; }
    });
    if (!reviewChanged) continue;
    // The expanded ES/CSP binding rule applies to new reviews. Preserve their
    // pre-repair audit inputs without inventing a retrospective task execution.
    if (!['version-release-watch', 'version-guidance-audit'].includes(native.watchFor(file))) {
      try {
        const baseline = JSON.parse(execFileSync('git', ['show', '52375081184ae679779fbce57969e20fc588af88:' + file], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
        if (native.reviewDigest(baseline) === native.reviewDigest(audit)) continue;
      } catch {}
    }
    const binding = audit.automationCoverage;
    assert(binding && candidates.has(binding.runFile), 'Changed watch review lacks mandatory coverage: ' + file);
    const run = read(root, binding.runFile);
    assert(run.kind === 'saved-task-execution' && run.watchId === native.watchFor(file) && run.auditBindings?.some(b => b.file === file && b.reviewDigest === native.reviewDigest(audit)), 'Watch coverage is not bound to the actual review: ' + file);
  }
  return { registryVersion: registry.registryVersion, activation: registry.activation, runs: results };
}
module.exports = { statuses, clocks, pointer, reviewDigest, resolveRegistry, validateRegistry, validateRun, validateAmendments, check };
