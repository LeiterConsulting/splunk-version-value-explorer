const test = require('node:test');
const assert = require('node:assert/strict');
const commit = 'a'.repeat(40);
const required = 'engine-' + '1'.repeat(20), deployed = 'engine-' + '2'.repeat(20);
const run = () => ({ id: 42, run_attempt: 2, path: '.github/workflows/publish-content.yml', head_sha: commit,
  status: 'completed', conclusion: 'failure' });
const evidence = () => ({ runId: 42, runAttempt: 2, receipt: {
  commit, recordedAt: '2026-11-07T13:32:04.624Z', status: 'held-runtime-deployment-required', reason: 'engine-mismatch',
  action: 'runtime-inspection', completedActions: [], mutationOutcome: 'no-write-at-failed-action', claimedDelivered: false,
  requiredEngineRevision: required, deployedEngineRevision: deployed
} });
test('a verified Sites deployment survives a later no-change check and a held legacy workflow', async () => {
  const { summarize, summarizeSiteDelivery } = await import('../scripts/pipeline-status.mjs');
  const projectId = 'project-synthetic', sourceCommit = commit, validationRunId = 43;
  const publishedAt = '2026-11-20T15:42:35.303Z', reconciledAt = '2026-11-20T15:48:46Z';
  const publication = { revision: 'content-synthetic', engineRevision: required, recordCount: 969, digest: '0'.repeat(64) };
  const selected = { id: validationRunId, head_sha: sourceCommit, path: '.github/workflows/validate.yml',
    event: 'push', head_branch: 'main', run_attempt: 1, status: 'completed', conclusion: 'success' };
  const publicChecks = ['https://versioncompass.com', 'https://www.versioncompass.com'].map(target => ({
    target, status: 'delivery-checks-passed', expectedRevision: publication.revision, evaluatedAt: '2026-11-20T18:00:00Z',
    checks: Object.fromEntries(['database-health', 'live-manifest', 'bundle-integrity', 'bounded-record-query', 'read-only-api', 'bundled-fallback-assets']
      .map(key => [key, { outcome: 'passed', evidence: { ...publication, storage: 'bundled' } }])),
  }));
  const site = {
    steward: { taskId: require('../scripts/lib/operational-roles.cjs').roles[0].taskId, sourceCommit,
      validationRunId, deploymentId: 'deployment', versionId: 'version', publishedAt, reconciledAt },
    deployment: { project_id: projectId, type: 'publish', status: 'succeeded', id: 'deployment', version_id: 'version', updated_at: publishedAt },
    publicChecks,
  };
  const runs = [run(), selected], options = { projectId, publication, now: Date.parse('2026-11-21T02:00:00Z') };
  assert.equal(summarize(sourceCommit, runs, evidence()).publisher.status, 'failure');
  const outcome = summarizeSiteDelivery(site, runs, options);
  assert.equal(outcome.status, 'readback-matched');
  assert.equal(outcome.publishedAt, publishedAt);
  assert.equal(outcome.reconciledAt, reconciledAt);
  for (const change of [
    e => e.steward.taskId = '6aef2ecb4e148191b0650b1c8111b041',
    e => e.deployment.status = 'failed',
    e => e.deployment.version_id = 'other-version',
    e => e.publicChecks.pop(),
    e => e.publicChecks[1].checks['live-manifest'].evidence.digest = '1'.repeat(64),
    e => e.publicChecks[1].evaluatedAt = '2026-11-20T15:42:36Z',
    e => e.steward.reconciledAt = '2026-11-20T15:00:00Z',
  ]) {
    const bad = structuredClone(site);
    change(bad);
    assert.equal(summarizeSiteDelivery(bad, runs, options).status, 'unverified');
  }
  assert.equal(summarizeSiteDelivery(site, [run(), { ...selected, run_attempt: 2 }], options).status, 'unverified');
  assert.equal(summarizeSiteDelivery(site, runs, { ...options, now: Date.parse('2026-11-21T18:00:00Z') }).status, 'unverified');
});
test('a matching runtime hold remains a failed job with an explicit no-write recovery path', async () => {
  const { summarize } = await import('../scripts/pipeline-status.mjs');
  const value = summarize(commit, [run()], evidence());
  assert.equal(value.publisher.status, 'failure');
  assert.equal(value.publisher.outcome.status, 'held-runtime-deployment-required');
  assert.equal(value.publisher.outcome.requiredEngineRevision, required);
  assert.equal(value.publisher.outcome.deployedEngineRevision, deployed);
  assert.equal(value.publisher.outcome.mutationOutcome, 'no-write-at-failed-action');
  assert.equal(value.claimedDelivered, false); assert.equal(value.delivery, 'unverified');
});
test('a failed job without its receipt cannot be called a runtime hold', async () => {
  const { summarize } = await import('../scripts/pipeline-status.mjs');
  assert.equal(summarize(commit, [run()]).publisher.outcome.status, 'unavailable');
});
test('a late provenance append to the earlier attempt does not make it the latest review', async () => {
  const { latestWatchReceipts } = await import('../scripts/pipeline-status.mjs');
  const receipt = (runId, startedAt, recordedAt) => ({
    result: { watchId: 'es-editions-watch', runId },
    run: { kind: 'saved-task-execution', registryVersion: '1.4.0', recordedAt, execution: { startedAt }, coverage: [] },
  });
  const prior = receipt('prior', '2026-11-20T11:00:00Z', '2026-11-20T22:00:00Z');
  const retry = receipt('retry', '2026-11-20T12:00:00Z', '2026-11-20T12:30:00Z');
  assert.equal(latestWatchReceipts('1.4.0', [retry, prior], '2026-11-20')[0].runId, 'retry');
});
test('old preflight receipts can establish a hold without inventing engine revisions', async () => {
  const { publisherOutcome } = await import('../scripts/pipeline-status.mjs');
  const e = evidence(); delete e.receipt.requiredEngineRevision; delete e.receipt.deployedEngineRevision;
  const value = publisherOutcome(commit, run(), e);
  assert.equal(value.status, 'held-runtime-deployment-required');
  assert.equal(value.requiredEngineRevision, null); assert.equal(value.deployedEngineRevision, null);
});
test('receipt binding rejects other commits, runs, attempts and absent identity fields', async () => {
  const { publisherOutcome } = await import('../scripts/pipeline-status.mjs');
  for (const change of [e => e.runId++, e => e.runAttempt--, e => e.runAttempt = 0,
    e => e.receipt.commit = 'b'.repeat(40), e => delete e.receipt.claimedDelivered,
    e => e.receipt.claimedDelivered = true, e => e.receipt.recordedAt = 'invalid', e => delete e.receipt]) {
    const e = evidence(); change(e);
    assert.equal(publisherOutcome(commit, run(), e).status, 'mismatched-evidence');
  }
  assert.equal(publisherOutcome(commit, undefined, evidence()).status, 'mismatched-evidence');
  assert.equal(publisherOutcome(commit, { ...run(), head_sha: 'b'.repeat(40) }, evidence()).status, 'mismatched-evidence');
  assert.equal(publisherOutcome(commit, { ...run(), path: '.github/workflows/validate.yml' }, evidence()).status, 'mismatched-evidence');
});
test('stale run evidence never explains the latest publisher run', async () => {
  const { summarize } = await import('../scripts/pipeline-status.mjs');
  assert.equal(summarize(commit, [run(), { ...run(), id: 43 }], evidence()).publisher.outcome.status, 'mismatched-evidence');
});
test('partial writes, inconsistent engines and green jobs cannot masquerade as preflight holds', async () => {
  const { publisherOutcome } = await import('../scripts/pipeline-status.mjs');
  for (const change of [e => e.receipt.action = 'head', e => e.receipt.completedActions = ['stage'],
    e => e.receipt.mutationOutcome = 'uncertain-read-back-before-retry', e => e.receipt.deployedEngineRevision = required,
    e => delete e.receipt.requiredEngineRevision, e => e.receipt.requiredEngineRevision = '<unsafe>']) {
    const e = evidence(); change(e);
    assert.equal(publisherOutcome(commit, run(), e).status, 'inconsistent-evidence');
  }
  const e = evidence(); e.receipt.requiredEngineRevision = [required]; e.receipt.deployedEngineRevision = [required];
  assert.equal(publisherOutcome(commit, run(), e).status, 'inconsistent-evidence');
  assert.equal(publisherOutcome(commit, { ...run(), conclusion: 'success' }, evidence()).status, 'inconsistent-evidence');
});
test('a post-stage engine rejection is a failure, not a no-write runtime hold', async () => {
  const { publisherOutcome } = await import('../scripts/pipeline-status.mjs');
  const e = evidence(); Object.assign(e.receipt, { status: 'failed', action: 'head', completedActions: ['runtime-inspection', 'stage'] });
  const value = publisherOutcome(commit, run(), e);
  assert.equal(value.status, 'failed'); assert.equal(value.action, 'head'); assert.equal(value.reason, 'engine-mismatch');
  assert.equal(value.claimedDelivered, false);
});
test('green staging stays unverified delivery and arbitrary receipt fields are not echoed', async () => {
  const { summarize } = await import('../scripts/pipeline-status.mjs');
  const e = evidence(); Object.assign(e.receipt, { status: 'already-current', action: 'head', activeDelivery: false,
    secret: 'PRIVATE', reason: '<PRIVATE>', mutationOutcome: 'PRIVATE\nDETAIL' });
  const value = summarize(commit, [{ ...run(), conclusion: 'success' }], e);
  assert.equal(value.publisher.status, 'success'); assert.equal(value.publisher.outcome.status, 'receipt-present');
  assert.equal(value.publisher.outcome.recordedStatus, 'already-current');
  assert.equal(value.publisher.outcome.reason, null); assert.equal(value.publisher.outcome.mutationOutcome, null);
  assert.equal(value.delivery, 'unverified'); assert.equal(JSON.stringify(value).includes('PRIVATE'), false);
});
test('a matching receipt cannot complete a still-running attempt', async () => {
  const { publisherOutcome } = await import('../scripts/pipeline-status.mjs');
  assert.equal(publisherOutcome(commit, { ...run(), status: 'in_progress', conclusion: null }, evidence()).status, 'pending');
});
test('a newer green observation cannot certify publication or resolve an earlier failed publisher receipt', async () => {
  const { summarize } = await import('../scripts/pipeline-status.mjs');
  const observationRun = { ...run(), id: 43, run_attempt: 1, conclusion: 'success', event: 'workflow_dispatch', display_title: 'Observe bundled seed' };
  const value = summarize(commit, [run(), observationRun]);
  assert.equal(value.publisher.runId, 43);
  assert.equal(value.publisher.status, 'success'); // GitHub job conclusion only.
  assert.equal(value.publisher.outcome.status, 'unavailable');
  assert.equal(value.claimedDelivered, false); assert.equal(value.delivery, 'unverified');
  assert.match(value.publisher.interpretation, /observe-only run performs no publication/);
  assert.match(value.publisher.interpretation, /Earlier publication failures remain unresolved/);
  assert.equal(summarize(commit, [run(), observationRun], evidence()).publisher.outcome.status, 'mismatched-evidence');
  // A label is not evidence and never changes receipt matching.
  assert.equal(summarize(commit, [{ ...observationRun, display_title: 'Publish verified content' }]).publisher.outcome.status, 'unavailable');
});
