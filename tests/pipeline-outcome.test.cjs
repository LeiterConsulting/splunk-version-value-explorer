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
