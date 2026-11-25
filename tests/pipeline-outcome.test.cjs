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

test('daily coverage preserves earlier work and refuses cross-owner, stale and mismatched attempt credit', async () => {
  const { dailyReview } = await import('../scripts/pipeline-status.mjs');
  const release = 'version-release-watch', es = 'es-editions-watch';
  const day = '2026-11-21', today = day + 'T09:00:00Z', priorEasternDay = day + 'T04:55:00Z';
  const registry = { registryVersion: '1.4.0', capabilities: [
    { id: 'release', title: 'Release', mandatory: true, primaryOwner: release },
    { id: 'editions', title: 'Editions', mandatory: true, primaryOwner: es }
  ] };
  const receipt = (id, watchId, capabilityId, startedAt, assessedAt, disposition) => ({
    result: { file: id + '.json' }, run: {
      runId: id, watchId, registryVersion: registry.registryVersion, kind: 'saved-task-execution',
      execution: { startedAt }, recordedAt: today, coverage: [{ capabilityId, disposition, assessedAt,
        assessments: [{ assessedAt }], followUp: null }]
    }
  });
  const receipts = [
    receipt('prior', es, 'editions', priorEasternDay, priorEasternDay, 'changed'),
    receipt('wrong-owner', release, 'editions', today, today, 'changed'),
    receipt('first', release, 'release', today, today, 'changed'),
    receipt('retry', release, 'release', day + 'T10:00:00Z', null, 'deferred')
  ];
  let summary = dailyReview(registry, receipts, day, { watches: [{ watchId: release, matchingReceiptIds: ['retry'] }] });
  assert.equal(summary.registered, 2); assert.equal(summary.reviewed, 1); assert.equal(summary.nativeReviewMatched, 0);
  assert.equal(summary.sections[0].latestDisposition, 'deferred');
  assert.equal(summary.sections[0].history[1].receipt, 'first.json');
  assert.equal(summary.sections[1].latestDisposition, 'missing-receipt');
  const carried = receipt('carry', es, 'editions', today, today, 'assessed-no-change');
  carried.run.coverage[0].assessments[0].assessedAt = priorEasternDay;
  summary = dailyReview(registry, [...receipts, carried], day, null);
  assert.equal(summary.reviewed, 1); assert.equal(summary.nativeReviewMatched, null);
  assert.equal(summary.sections[1].reviewedToday, false);
  summary = dailyReview(registry, receipts, day, { watches: [{ watchId: release, matchingReceiptIds: ['first'] }] });
  assert.equal(summary.nativeReviewMatched, 1);
});

test('scheduled source credit ends at the native completion even if an owner receipt was written later', async () => {
  const { dailyReview } = await import('../scripts/pipeline-status.mjs');
  const watchId = 'csp-fedramp-watch', day = '2026-11-24';
  const startedAt = day + 'T21:09:03.621045Z', completedAt = day + 'T21:18:00.511387Z';
  const registry = { registryVersion:'1.5.2', capabilities:[{id:'csp',title:'CSP',primaryOwner:watchId,mandatory:true}] };
  const row = { capabilityId:'csp',disposition:'assessed-no-change',assessedAt:completedAt,
    assessments:[{assessedAt:completedAt,sourceIds:['official']}],
    retrievals:[{sourceId:'official',outcome:'retrieved',retrievedAt:startedAt}] };
  const run = {runId:'csp-own',watchId,kind:'saved-task-execution',registryVersion:registry.registryVersion,
    execution:{startedAt,completedAt:day+'T21:45:00Z'},coverage:[row]};
  const watch = {watchId,matchingReceiptIds:[run.runId],attempt:{startedAt,completedAt}};
  const fresh = () => dailyReview(registry,[{run,result:{boundAttempt:true,file:'csp.json'}}],day,{watches:[watch]}).sections[0].history[0].freshSources;
  assert.equal(fresh(),true);
  row.readerReview = {claimIds:['scope'],checkedAt:completedAt};
  const checkedInRun = () => dailyReview(registry,[{run,result:{boundAttempt:true,file:'csp.json',ownerReaderTimes:{csp:[startedAt,completedAt]}}}],day,{watches:[watch]}).sections[0].history[0].readerCheckedDuringAttempt;
  assert.equal(checkedInRun(),true);
  row.readerReview.checkedAt = day + 'T21:18:00.511388Z';
  assert.equal(checkedInRun(),false);
  row.assessedAt = day + 'T21:18:00.511388Z';
  assert.equal(fresh(),false);
  row.assessedAt = completedAt;
  row.retrievals[0].retrievedAt = day + 'T21:09:03.621044Z';
  assert.equal(fresh(),false);
  row.retrievals[0].retrievedAt = completedAt;
  row.assessments[0].assessedAt = day + 'T21:18:00.511386Z';
  assert.equal(fresh(),false);
  row.assessments[0].assessedAt = completedAt;
  delete watch.attempt.completedAt;
  assert.equal(fresh(),false);
});

test('same-day owner recovery accepts the new registry alongside valid earlier receipts', async () => {
  const { dailyReview } = await import('../scripts/pipeline-status.mjs');
  const owner = 'version-release-watch';
  const registry = {registryVersion:'1.5.0', readerReview:{previousRegistryVersion:'1.4.0', effectiveOn:'2026-11-25'},
    capabilities:['first','second'].map(id => ({id, title:id, mandatory:true, primaryOwner:owner}))};
  function run(day, version, id) {
    const time = day + 'T16:00:00Z';
    return {result:{file:id}, run:{kind:'saved-task-execution', runId:id, watchId:owner,
      recordedAt:time, execution:{startedAt:time}, registryVersion:version, coverage:[{capabilityId:id, disposition:'assessed-no-change',
        assessedAt:time, assessments:[{assessedAt:time}]}]}};
  }
  for (const [day, count] of [['2026-11-23',1], ['2026-11-24',2], ['2026-11-25',1]]) {
    const reports = [run(day, '1.4.0', 'first'), run(day, '1.5.0', 'second')];
    assert.equal(dailyReview(registry, reports, day).reviewed, count);
    const corrected = {...registry,registryVersion:'1.5.1',readerReview:{...registry.readerReview,recoveryVersions:['1.5.0']}};
    assert.equal(dailyReview(corrected,reports,day).reviewed,day === '2026-11-25' ? 0 : count);
    assert.equal(dailyReview(corrected,[run(day,'1.5.1','second')],day).reviewed,day === '2026-11-23' ? 0 : 1);
    const replay = structuredClone(reports[1]);
    replay.run.execution = {startedAt:null, workStartedAt:replay.run.recordedAt};
    assert.equal(dailyReview(registry, [replay], day).reviewed, 0);
  }
});
