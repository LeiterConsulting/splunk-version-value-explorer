const test = require('node:test'), assert = require('node:assert/strict');
const { inspect } = require('../scripts/lib/task-runtime.cjs');
function fixture() {
  const ids = ['version-release-watch', 'version-guidance-audit', 'es-editions-watch', 'csp-fedramp-watch'];
  const tasks = ids.map((id, i) => ({ id: 'task-' + i, is_enabled: true, configurationDigest: 'matched', schedule: 'retained', next_run_time: null,
    run_details: { last_run: { id: 'run-' + i, recorded_status: 'completed', started_at: '2026-11-05T13:00:00Z' },
      latest_result: { run_id: 'run-' + i, content_text: id + ' reviewed separately', content_truncated: false } } }));
  const ledger = { amendments: [{ registryVersion: '1.2.0', savedTasks: ids.map((id, i) => ({ id, taskId: 'task-' + i, afterDigest: 'matched', readbackAt: '2026-11-04T15:00:00Z' })) }] };
  const runs = ids.map((id, i) => ({ kind: 'saved-task-execution', watchId: id, registryVersion: '1.2.0', execution: { taskId: 'task-' + i, schedulerRunId: 'run-' + i }, coverageComplete: true, deliveryComplete: true, claimedComplete: true, publication: { claimedDelivered: true } }));
  return { snapshot: { observedAt: '2026-11-05T14:00:00Z', tasks }, context: { registry: { registryVersion: '1.2.0' }, ledger, runs } };
}
test('matching actual task/run/registry/configuration evidence is necessary; null next-run is not disabled', () => {
  const f = fixture(); assert.equal(inspect(f.snapshot, f.context).status, 'evidence-matched');
  f.context.runs[0].execution.schedulerRunId = 'wrong';
  assert(inspect(f.snapshot, f.context).watches[0].issues.includes('no-matching-current-coverage-receipt'));
  f.context.runs[0].execution.schedulerRunId = 'run-0'; f.context.runs[0].registryVersion = '1.0.0';
  assert.equal(inspect(f.snapshot, f.context).status, 'unverified');
});
test('completed duplicate reports naming another watch are rejected despite full coverage flags', () => {
  const f = fixture(); for (const i of [0, 2]) f.snapshot.tasks[i].run_details.latest_result.content_text = '## ES Editions Watch — published';
  const r = inspect(f.snapshot, f.context); assert.equal(r.status, 'unverified');
  assert(r.watches[0].issues.includes('result-names-another-watch:es-editions-watch'));
  assert(r.watches[2].issues.includes('duplicate-result-across-watches'));
});
test('older latest-result text is not evidence for the newest failed run', () => {
  const f = fixture(); f.snapshot.tasks[0].run_details.last_run = { id: 'new-failed-run', recorded_status: 'failed', started_at: '2026-11-05T13:00:00Z' };
  const r = inspect(f.snapshot, f.context).watches[0];
  assert(r.issues.includes('recorded-run-failed')); assert(r.issues.includes('current-run-result-unavailable'));
});
test('pending delivery, changed saved configuration and runs before amendment do not activate', () => {
  const f = fixture(); f.snapshot.tasks[0].configurationDigest = 'drifted'; f.snapshot.tasks[1].run_details.last_run.started_at = '2026-11-03T13:00:00Z'; f.context.runs[2].deliveryComplete = false;
  const r = inspect(f.snapshot, f.context); assert.equal(r.status, 'unverified');
  assert(r.watches[0].issues.includes('saved-configuration-not-matched')); assert(r.watches[1].issues.includes('run-predates-saved-amendment')); assert(r.watches[2].issues.includes('coverage-or-delivery-incomplete'));
});
test('disabled extra checkpoint is retained without making a new timer; missing participating task is incomplete', () => {
  const f = fixture(); f.snapshot.tasks.push({ id: 'disabled-checkpoint', is_enabled: false, run_details: { last_run: { recorded_status: 'failed' } } });
  assert.equal(inspect(f.snapshot, f.context).status, 'evidence-matched');
  f.snapshot.tasks.shift(); assert(inspect(f.snapshot, f.context).watches[0].issues.includes('missing-actual-task'));
});
test('green CI cannot make missing watch/receipt/native evidence ready', async () => {
  const { watchReadiness } = await import('../scripts/pipeline-status.mjs');
  const f = fixture(); assert.equal(watchReadiness('1.2.0', f.context.runs, null).status, 'unverified');
  assert.equal(watchReadiness('1.2.0', f.context.runs, inspect(f.snapshot, f.context)).status, 'evidence-matched');
  f.context.runs[0].coverageComplete = false;
  assert.deepEqual(watchReadiness('1.2.0', f.context.runs, { status: 'evidence-matched' }).incompleteWatches, ['version-release-watch']);
});
