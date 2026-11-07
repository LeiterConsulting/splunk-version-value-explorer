const test = require('node:test'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const { inspect, savedConfigurationDigest, nativeTasks } = require('../scripts/lib/task-runtime.cjs');
const contract = require('../scripts/lib/operational-roles.cjs');
const ids = ['version-release-watch', 'version-guidance-audit', 'es-editions-watch', 'csp-fedramp-watch'];
function task(id, identity, i) {
  return { id, title: identity, prompt: 'PRIVATE PROMPT ' + i, schedule: 'BEGIN:VEVENT\nRRULE:FREQ=DAILY\nEND:VEVENT', timing_mode: 'exact_schedule', is_enabled: true,
    default_timezone: 'America/New_York', environment_selection: 'inherited', environments: null,
    conversation_id: 'PRIVATE CONVERSATION', updated_at: '2026-11-04T15:00:00Z', next_run_time: null,
    run_details: { delivery_status: 'unknown', last_run: { id: 'run-' + i, recorded_status: 'completed', scheduled_for: '2026-11-05T13:00:00Z', started_at: '2026-11-05T13:01:00Z', completed_at: '2026-11-05T13:05:00Z' },
      latest_result: { run_id: 'run-' + i, created_at: '2026-11-05T13:05:01Z', completed_at: '2026-11-05T13:05:00Z', scheduled_for: '2026-11-05T13:00:00Z', content_text: identity + ' reviewed separately', content_truncated: false, is_failure_message: false, chat_ref: 'PRIVATE CHAT' } } };
}
const baseline = task => ({ afterDigest: savedConfigurationDigest(task), readbackAt: '2026-11-04T15:00:00Z' });
function fixture() {
  const tasks = ids.map((id, i) => task('task-' + i, id, i));
  const ledger = { amendments: [{ registryVersion: '1.2.0', savedTasks: ids.map((id, i) => ({ id, taskId: tasks[i].id, ...baseline(tasks[i]) })) }] };
  const operational = structuredClone(contract);
  for (const [i, role] of operational.roles.entries()) {
    const native = task(role.taskId, role.reportAliases[0], i + 4); tasks.push(native); role.configuration = baseline(native);
  }
  const runs = ids.map((id, i) => ({ kind: 'saved-task-execution', watchId: id, registryVersion: '1.2.0', execution: { taskId: 'task-' + i, schedulerRunId: 'run-' + i }, coverageComplete: true, deliveryComplete: true, claimedComplete: true, publication: { claimedDelivered: true } }));
  return { snapshot: { observedAt: '2026-11-05T14:00:00Z', tasks }, context: { registry: { registryVersion: '1.2.0' }, ledger, runs, operational } };
}
const result = f => inspect(f.snapshot, f.context);
const first = f => result(f).watches[0];
test('matching task/run/registry/configuration evidence; operations and unknown delivery remain separate', () => {
  const f = fixture(), r = result(f);
  assert.equal(r.status, 'evidence-matched'); assert.equal(r.operational.status, 'evidence-matched'); assert.equal(r.claimedDelivered, false);
  for (const row of [...r.watches, ...r.operational.roles]) assert.deepEqual(row.delivery, { status: 'unknown', claimedDelivered: false });
  f.context.runs[0].execution.schedulerRunId = 'wrong'; assert(first(f).issues.includes('no-matching-current-coverage-receipt'));
  f.context.runs[0].execution.schedulerRunId = 'run-0'; f.context.runs[0].registryVersion = '1.0.0'; assert.equal(result(f).status, 'unverified');
});
test('legacy configuration hash excludes only four runtime fields and sorts only top-level keys', () => {
  const t = task('a', 'title', 0), raw = { ...t, environments: [{ z: 1, a: 2 }], optional: null };
  const saved = Object.fromEntries(Object.keys(raw).filter(k => !['run_details','last_run_time','next_run_time','updated_at'].includes(k)).sort().map(k => [k, raw[k]]));
  const expected = 'sha256:' + crypto.createHash('sha256').update(JSON.stringify(saved)).digest('hex');
  assert.equal(savedConfigurationDigest(raw), expected);
  assert.equal(savedConfigurationDigest(Object.fromEntries(Object.entries(raw).reverse())), expected);
  for (const key of ['run_details','last_run_time','next_run_time','updated_at']) assert.equal(savedConfigurationDigest({ ...raw, [key]: 'runtime-only' }), expected);
  for (const changed of [{ ...raw, optional: undefined }, { ...raw, environments: [{ a: 2, z: 1 }] }, { ...raw, environments: [{ z: 2, a: 2 }] }]) assert.notEqual(savedConfigurationDigest(changed), expected);
  assert.throws(() => savedConfigurationDigest({ ...raw, configurationDigest: expected }), /before derived digest/);
});
test('saved prompt, schedule, timezone, timing, enabled and unknown saved fields are recomputed, never trusted', () => {
  for (const [key, changed] of Object.entries({ prompt: 'changed', schedule: 'changed', default_timezone: 'UTC', timing_mode: 'flexible_schedule', is_enabled: false, environments: [], extra: null })) {
    const f = fixture(), t = f.snapshot.tasks[0]; t.configurationDigest = baseline(t).afterDigest; t[key] = changed;
    assert(first(f).issues.includes('saved-configuration-not-matched'), key);
    assert(first(f).issues.includes('supplied-configuration-digest-mismatch'), key);
  }
  const f = fixture(); f.snapshot.tasks[0].configurationDigest = 'sha256:' + '0'.repeat(64);
  assert(first(f).issues.includes('supplied-configuration-digest-mismatch'));
  f.snapshot.tasks[0].configurationDigest = f.context.ledger.amendments[0].savedTasks[0].afterDigest;
  assert.equal(first(f).accepted, true);
  delete f.snapshot.tasks[0].environments; assert(first(f).issues.includes('native-saved-configuration-incomplete'));
});
test('get/peek wrappers and nested structuredContent normalize before hashing; contextVersion is not evidence', () => {
  const f = fixture(), raw = structuredClone(f.snapshot.tasks);
  f.snapshot.tasks = [{ structuredContent: { structuredContent: { automations: raw } } }];
  assert.equal(result(f).status, 'evidence-matched'); assert.equal(result(f).inventory.checked.length, 7);
  f.snapshot.tasks = raw.map(automation => ({ structuredContent: { automation, contextVersion: 'not-a-configuration-digest' } }));
  assert.equal(result(f).status, 'evidence-matched');
  assert.deepEqual(nativeTasks(f.snapshot.tasks[0]), [raw[0]]);
  for (const wrapper of [{ automation: raw[0] }, { automations: raw }, { structuredContent: { automations: raw } }]) assert.throws(() => savedConfigurationDigest(wrapper), /Raw native/);
  assert.throws(() => nativeTasks({ ...raw[0], automation: raw[0] }), /Ambiguous/);
});
test('missing independently reviewed operational baselines stay unverified and do not poison watches', () => {
  const f = fixture(); delete f.context.operational;
  const r = result(f); assert.equal(r.status, 'evidence-matched'); assert.equal(r.operational.status, 'unverified');
  for (const role of r.operational.roles) assert(role.issues.includes('saved-configuration-baseline-unavailable'));
  assert.equal(r.operational.contractVersion, '1.0.0');
});
test('same-run stale result from a prior retry is rejected even with completed status and coverage', () => {
  const f = fixture(), t = f.snapshot.tasks[0];
  t.run_details.last_run.started_at = '2026-11-05T13:10:00Z'; t.run_details.last_run.completed_at = '2026-11-05T13:15:00Z';
  assert(first(f).issues.includes('result-predates-current-attempt'));
  t.run_details.last_run.started_at = '2026-11-05T13:01:00Z';
  assert(first(f).issues.includes('result-predates-current-attempt-completion'));
  t.run_details.latest_result.run_id = 'older-run'; assert(first(f).issues.includes('current-run-result-unavailable'));
});
test('failed/incomplete attempts cannot accept older or otherwise matching results', () => {
  for (const status of ['failed', 'running', 'pending', 'cancelled', undefined, 'PRIVATE STATUS']) {
    const f = fixture(); f.snapshot.tasks[0].run_details.last_run.recorded_status = status;
    assert.equal(first(f).accepted, false); assert.equal(first(f).attempt.status, 'unverified');
    assert(!JSON.stringify(result(f)).includes('PRIVATE STATUS'));
  }
  const f = fixture(); delete f.snapshot.tasks[0].run_details.last_run; assert(first(f).issues.includes('no-recorded-run'));
});
test('duplicate-output scan retains missing and malformed attempt/result evidence without throwing', () => {
  for (const last of [{}, null, undefined, [], 'not-an-object', { id: '' }, { id: 'run-0' }]) {
    for (const output of [undefined, null, {}, [], 'not-an-object', { content_text: 'unbound report' }]) {
      const f = fixture();
      f.snapshot.tasks[0].run_details = { last_run: last, latest_result: output };
      const row = first(f);
      assert.equal(row.accepted, false);
      assert(row.issues.includes('current-run-result-unavailable'));
    }
  }
  const f = fixture();
  f.snapshot.tasks[0] = { id: 'task-0', is_enabled: true, run_details: { last_run: {} } };
  assert(first(f).issues.includes('current-run-result-unavailable'));
});
test('timestamps must parse, actual events stay within observation and scheduled identities match', () => {
  for (const [part, keys] of [['last_run', ['started_at','completed_at','scheduled_for']], ['latest_result', ['created_at','completed_at','scheduled_for']]]) {
    for (const key of keys) for (const bad of [undefined, null, 'not a date', '2026-02-30T13:00:00Z', '2026-11-05', '2026-11-05T15:00:00Z']) {
      const f = fixture(); f.snapshot.tasks[0].run_details[part][key] = bad;
      assert.equal(first(f).accepted, false, part + '.' + key + '=' + bad);
    }
  }
  for (const bad of [undefined, null, 'not a date', '2026-02-30T13:00:00Z', '2099-11-05T14:00:00Z']) { const f = fixture(); f.snapshot.observedAt = bad; assert.throws(() => result(f), /Actual observed/); }
  const f = fixture(); f.snapshot.tasks[0].run_details.latest_result.scheduled_for = '2026-11-05T12:00:00Z';
  assert(first(f).issues.includes('result-schedule-does-not-match-attempt'));
});
test('native flexible Ripple timing permits early starts and result creation before run finalization', () => {
  const f = fixture(), t = f.snapshot.tasks[6], nativeRunId = '85509dfe-35fc-8322-bb95-66e4066a6237';
  f.snapshot.observedAt = '2026-11-07T14:05:00Z';
  t.timing_mode = 'flexible_schedule';
  f.context.operational.roles[2].configuration = baseline(t);
  t.run_details.last_run = { id: nativeRunId, recorded_status: 'completed', scheduled_for: '2026-11-07T14:00:00Z', started_at: '2026-11-07T13:57:39.869216Z', completed_at: '2026-11-07T14:04:56.874643Z' };
  Object.assign(t.run_details.latest_result, { run_id: nativeRunId, scheduled_for: '2026-11-07T14:00:00Z', created_at: '2026-11-07T14:04:56.636887Z', completed_at: '2026-11-07T14:04:56.874643Z', content_text: 'Ripple’s November 7 refresh checked the existing scope.' });
  assert.equal(result(f).operational.roles[2].accepted, true);
  // Scheduled time is a nominal slot, not an execution timestamp or observation bound.
  t.run_details.last_run.scheduled_for = t.run_details.latest_result.scheduled_for = '2026-11-07T14:10:00Z';
  assert.equal(result(f).operational.roles[2].accepted, true);
  // Completion still binds the result to the latest attempt when its run ID/start persist.
  t.run_details.last_run.completed_at = '2026-11-07T14:04:59Z';
  assert(result(f).operational.roles[2].issues.includes('result-predates-current-attempt-completion'));
});
test('malformed or empty operational contracts fail intentionally instead of claiming vacuous success', () => {
  for (const mutate of [c => c.roles = [], c => delete c.roles, c => c.roles = {}, c => c.roles[0] = null,
    c => c.roles[0].taskId = '', c => c.roles[0].reportAliases = null, c => c.roles[0].reportAliases = [], c => c.roles[0].reportAliases = [null],
    c => c.roles[0].configuration = 'not-a-receipt', c => c.optionalTasks = null, c => c.optionalTasks[0] = {}, c => c.contractVersion = 'invalid']) {
    const f = fixture(); mutate(f.context.operational);
    assert.throws(() => result(f), /Invalid operational role contract/);
  }
  const f = fixture(); f.context.operational.optionalTasks[0].taskId = f.context.operational.roles[0].taskId;
  assert.throws(() => result(f), /Duplicate operational role\/task identity/);
});
test('empty, missing, truncated, failed and suppressed outputs never count as successful evidence', () => {
  for (const mutate of [r => r.content_text = '', r => delete r.content_text, r => r.content_text = 42, r => r.content_truncated = true, r => delete r.content_truncated, r => r.is_failure_message = true, r => r.requires_user_action = true, r => delete r.is_failure_message, r => r.content_text = 'NO_UPDATE']) {
    const f = fixture(); mutate(f.snapshot.tasks[0].run_details.latest_result); assert.equal(first(f).accepted, false);
  }
  const f = fixture(); f.snapshot.tasks[0].run_details.last_run.recorded_status = 'no_update'; assert(first(f).issues.includes('result-output-suppressed'));
  delete f.snapshot.tasks[0].run_details.latest_result; assert(first(f).issues.includes('current-run-result-unavailable'));
});
test('duplicates and headings claiming another watch fail; mentioning another watch does not claim its identity', () => {
  const f = fixture(); for (const i of [0, 2]) f.snapshot.tasks[i].run_details.latest_result.content_text = '## ES Editions Watch — published';
  assert(first(f).issues.includes('result-names-another-watch:es-editions-watch'));
  assert(result(f).watches[2].issues.includes('duplicate-result-across-watches'));
  f.snapshot.tasks[0].run_details.latest_result.content_text = '## Version Release Watch: checking ES Editions Watch references'; assert.equal(first(f).accepted, true);
  f.snapshot.tasks[0].run_details.latest_result.content_text = 'Referenced Version Release Watch, not my report'; assert(first(f).issues.includes('result-lacks-own-watch-identity'));
});
test('conservative Ripple alias accepts the real report form without relying on the saved title', () => {
  const f = fixture(), r = f.snapshot.tasks[6].run_details.latest_result;
  r.content_text = 'Ripple’s November 7 refresh kept the existing scope.'; assert.equal(result(f).operational.roles[2].accepted, true);
  r.content_text = "Ripple's November 7 refresh: references Audit VersionCompass and Ripple"; assert.equal(result(f).operational.roles[2].accepted, true);
  for (const wrong of ['A note about Ripple’s November 7 refresh', 'Ripple unrelated success', 'Audit VersionCompass and Ripple: references Ripple']) { r.content_text = wrong; assert.equal(result(f).operational.roles[2].accepted, false); }
  f.snapshot.tasks[4].run_details.latest_result.content_text = r.content_text;
  assert(result(f).operational.roles[2].issues.includes('duplicate-result-across-roles'));
});
test('missing/duplicate/unregistered identities are explicit; optional nonrecurring tasks cannot poison watches', () => {
  const f = fixture(); f.snapshot.tasks.push({ id: contract.optionalTasks[0].taskId, is_enabled: false, run_details: { last_run: { recorded_status: 'failed' } } }, { id: contract.optionalTasks[1].taskId, is_enabled: true }, { id: 'new-controller', is_enabled: true }, { prompt: 'PRIVATE MISSING ID' });
  const r = result(f); assert.equal(r.status, 'evidence-matched'); assert.equal(r.inventory.optional.length, 2); assert.equal(r.inventory.unregistered.length, 2); assert.deepEqual(r.inventory.missingTaskIdentities, [10]);
  f.snapshot.tasks.push(structuredClone(f.snapshot.tasks[0])); assert(first(f).issues.includes('duplicate-actual-task')); assert.deepEqual(result(f).inventory.duplicateTaskIds, ['task-0']);
  f.snapshot.tasks = f.snapshot.tasks.filter(t => t.id !== 'task-0'); assert(first(f).issues.includes('missing-actual-task')); assert(result(f).inventory.missingRoles.includes('version-release-watch'));
  f.snapshot.tasks = f.snapshot.tasks.filter(t => t.id !== contract.roles[0].taskId); assert(result(f).inventory.missingRoles.includes('github-steward'));
});
test('private prompts, conversations, environments, output and arbitrary runtime fields are never emitted', () => {
  const f = fixture(); f.snapshot.tasks[0].environments = [{ name: 'PRIVATE ENVIRONMENT', state: 'PRIVATE STATE' }];
  f.snapshot.tasks[0].run_details.latest_result.content_text += '\nPRIVATE OUTPUT'; f.snapshot.tasks[0].run_details.latest_result.chat_ref = 'PRIVATE CHAT';
  const text = JSON.stringify(result(f)); assert(!text.includes('PRIVATE')); assert(!text.includes('BEGIN:VEVENT')); assert(text.includes('sha256:'));
});
test('pending delivery, changed saved configuration and runs before amendment do not activate', () => {
  const f = fixture(); f.snapshot.tasks[0].prompt = 'drifted'; f.snapshot.tasks[1].run_details.last_run.started_at = '2026-11-03T13:00:00Z'; f.context.runs[2].deliveryComplete = false;
  const r = result(f); assert.equal(r.status, 'unverified');
  assert(r.watches[0].issues.includes('saved-configuration-not-matched')); assert(r.watches[1].issues.includes('run-predates-saved-amendment')); assert(r.watches[2].issues.includes('coverage-or-delivery-incomplete'));
});
test('green CI or successful controllers cannot substitute for any of the four watch gates', async () => {
  const { watchReadiness, operationalReadiness } = await import('../scripts/pipeline-status.mjs');
  const f = fixture(); assert.equal(watchReadiness('1.2.0', f.context.runs, null).status, 'unverified');
  assert.equal(operationalReadiness(null).status, 'unavailable');
  assert.equal(watchReadiness('1.2.0', f.context.runs, result(f)).status, 'evidence-matched');
  f.context.runs[0].coverageComplete = false; assert.equal(result(f).operational.status, 'evidence-matched');
  assert.deepEqual(watchReadiness('1.2.0', f.context.runs, result(f)).incompleteWatches, ['version-release-watch']);
  assert.equal(watchReadiness('1.2.0', f.context.runs, result(f)).status, 'unverified');
});
