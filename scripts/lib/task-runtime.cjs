/* Read-only reconciliation of supported native snapshots. Never schedules or mutates tasks. */
const crypto = require('node:crypto');
const operationalContract = require('./operational-roles.cjs');
const digest = text => crypto.createHash('sha256').update(text).digest('hex');
const headings = new Map([
  ['version-release-watch', 'Version Release Watch'], ['version-guidance-audit', 'Version Guidance Audit'],
  ['es-editions-watch', 'ES Editions Watch'], ['csp-fedramp-watch', 'CSP FedRAMP Watch']
]);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const safeId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value) ? value : null;
const validDigest = value => typeof value === 'string' && /^sha256:[a-f0-9]{64}$/.test(value);
function time(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,9})?(?:Z|[+-]\d\d:\d\d)$/.test(value)) return NaN;
  const [year, month, day, hour, minute, second] = value.slice(0, 19).split(/[-T:]/).map(Number);
  if (month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate() || hour > 23 || minute > 59 || second > 59) return NaN;
  return Date.parse(value);
}
// Unwrap supported native get/peek transports BEFORE inspecting/hashing saved objects.
// No rendered text parsing, runtime merge, field projection or recursive key sorting.
function nativeTasks(value, depth = 0) {
  if (depth > 8 || !object(value)) throw Error('Unsupported native task transport');
  if (Object.hasOwn(value, 'id')) {
    if (['structuredContent', 'automation', 'automations'].some(key => Object.hasOwn(value, key))) throw Error('Ambiguous native task transport');
    return [value];
  }
  if (object(value.structuredContent)) return nativeTasks(value.structuredContent, depth + 1);
  if (object(value.automation)) return nativeTasks(value.automation, depth + 1);
  if (Array.isArray(value.automations)) return value.automations.flatMap(task => nativeTasks(task, depth + 1));
  // Retain malformed raw entries for explicit missing-identity diagnostics.
  if (!['structuredContent', 'automation', 'automations'].some(key => Object.hasOwn(value, key))) return [value];
  throw Error('Unsupported native task transport');
}
function savedConfigurationDigest(native) {
  if (!object(native) || ['structuredContent', 'automation', 'automations', 'configurationDigest'].some(key => Object.hasOwn(native, key))) throw Error('Raw native saved object required before derived digest');
  const excluded = new Set(['run_details', 'last_run_time', 'next_run_time', 'updated_at']);
  const saved = Object.fromEntries(Object.keys(native).filter(key => !excluded.has(key)).sort().map(key => [key, native[key]]));
  return 'sha256:' + digest(JSON.stringify(saved));
}
function configuration(task, baseline, observedAt) {
  const { configurationDigest: asserted, ...native } = task;
  const actual = savedConfigurationDigest(native), issues = [];
  const required = ['id', 'title', 'prompt', 'schedule', 'timing_mode', 'is_enabled', 'default_timezone', 'environment_selection', 'environments'];
  if (required.some(key => !Object.hasOwn(native, key)) || ['id', 'title', 'prompt', 'schedule', 'timing_mode', 'default_timezone'].some(key => typeof native[key] !== 'string') || typeof native.is_enabled !== 'boolean') issues.push('native-saved-configuration-incomplete');
  if (asserted !== undefined && asserted !== actual) issues.push('supplied-configuration-digest-mismatch');
  if (!validDigest(baseline?.afterDigest)) issues.push('saved-configuration-baseline-unavailable');
  else if (actual !== baseline.afterDigest) issues.push('saved-configuration-not-matched');
  if (!Number.isFinite(time(baseline?.readbackAt))) issues.push('saved-configuration-readback-unavailable');
  else if (time(baseline.readbackAt) > time(observedAt)) issues.push('saved-configuration-readback-after-observation');
  return { status: issues.length ? 'unverified' : 'matched', digest: actual, issues };
}
function claimIdentity(content, identities) {
  const first = (typeof content === 'string' ? content : '').split('\n').find(line => line.trim()) || '';
  const heading = first.trim().replace(/^#{1,6}\s*/, '').replace(/^\*\*/, '');
  return identities.find(identity => identity.aliases.some(alias => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('^' + escaped + '(?=$|[\\s:*—–-])', 'i').test(heading);
  }) || (identity.id === 'ripple-refresh' && /^Ripple[’']s (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2} refresh\b/i.test(heading)))?.id || null;
}
function attemptResult(task, observedAt, readbackAt, identity, identities, duplicates) {
  const last = task.run_details?.last_run, result = task.run_details?.latest_result;
  const attemptIssues = [], resultIssues = [];
  const observed = time(observedAt), readback = time(readbackAt);
  const checkTime = (value, key, issues, actualEvent = true) => {
    const parsed = time(value);
    if (!Number.isFinite(parsed)) issues.push(key + '-time-unavailable');
    else if (actualEvent && parsed > observed) issues.push(key + '-clock-after-observation');
    return parsed;
  };
  let started, completed, scheduled;
  if (!object(last)) attemptIssues.push('no-recorded-run');
  else {
    if (!safeId(last.id)) attemptIssues.push('recorded-run-identity-unavailable');
    if (last.recorded_status !== 'completed') attemptIssues.push(last.recorded_status === 'no_update' ? 'recorded-run-output-suppressed' : ['failed', 'running', 'pending', 'cancelled'].includes(last.recorded_status) ? 'recorded-run-' + last.recorded_status : 'recorded-run-not-completed');
    started = checkTime(last.started_at, 'run-start', attemptIssues);
    completed = checkTime(last.completed_at, 'run-completion', attemptIssues);
    scheduled = checkTime(last.scheduled_for, 'run-scheduled', attemptIssues, false);
    if (completed < started) attemptIssues.push('run-time-order-invalid');
    if (!Number.isFinite(readback)) attemptIssues.push('run-configuration-readback-unavailable');
    else if (started < readback) attemptIssues.push('run-predates-saved-amendment');
  }
  if (!object(result) || !safeId(last?.id) || result.run_id !== last.id) resultIssues.push('current-run-result-unavailable');
  else {
    const created = checkTime(result.created_at, 'result-created', resultIssues);
    const ended = checkTime(result.completed_at, 'result-completion', resultIssues);
    const due = checkTime(result.scheduled_for, 'result-scheduled', resultIssues, false);
    if (created < started || ended < started) resultIssues.push('result-predates-current-attempt');
    if (ended < completed) resultIssues.push('result-predates-current-attempt-completion');
    if (Number.isFinite(due) && Number.isFinite(scheduled) && due !== scheduled) resultIssues.push('result-schedule-does-not-match-attempt');
    const content = typeof result.content_text === 'string' ? result.content_text : '';
    const claimed = claimIdentity(content, identities);
    if (claimed !== identity.id) resultIssues.push('result-lacks-own-' + identity.kind + '-identity');
    if (claimed && claimed !== identity.id) resultIssues.push('result-names-another-' + identity.kind + ':' + claimed);
    if (result.content_truncated !== false) resultIssues.push('result-truncated-or-unconfirmed');
    if (!content.trim() || result.is_failure_message !== false) resultIssues.push('result-not-success-evidence');
    if (result.requires_user_action === true) resultIssues.push('result-requires-user-action');
    if (/^\s*(?:no_update|\[no_update\])\s*$/i.test(content) || last.recorded_status === 'no_update') resultIssues.push('result-output-suppressed');
    const peers = duplicates.get(digest(content)) || [];
    if (peers.some(peer => peer.taskId !== task.id)) resultIssues.push(identity.kind === 'watch' && peers.some(peer => peer.taskId !== task.id && peer.kind === 'watch') ? 'duplicate-result-across-watches' : 'duplicate-result-across-roles');
  }
  return {
    attempt: { status: attemptIssues.length ? 'unverified' : 'completed', schedulerRunId: safeId(last?.id), recordedStatus: ['completed', 'failed', 'running', 'pending', 'cancelled', 'no_update'].includes(last?.recorded_status) ? last.recorded_status : null, issues: attemptIssues },
    result: { status: resultIssues.length ? 'unverified' : 'matched', issues: resultIssues },
    // The native transport currently exposes no independent delivery receipt.
    delivery: { status: 'unknown', claimedDelivered: false }
  };
}
function validateOperationalContract(contract) {
  const validRole = role => object(role) && safeId(role.roleId) && safeId(role.taskId);
  if (!object(contract) || typeof contract.contractVersion !== 'string' || !/^\d+\.\d+\.\d+$/.test(contract.contractVersion) ||
      !Array.isArray(contract.roles) || !contract.roles.length || !Array.isArray(contract.optionalTasks) ||
      contract.roles.some(role => !validRole(role) || !Array.isArray(role.reportAliases) || !role.reportAliases.length || role.reportAliases.some(alias => typeof alias !== 'string' || !alias.trim() || /[\r\n]/.test(alias)) || (role.configuration !== null && !object(role.configuration))) ||
      contract.optionalTasks.some(role => !validRole(role))) throw Error('Invalid operational role contract');
  const entries = [...contract.roles, ...contract.optionalTasks];
  if (new Set(entries.map(role => role.roleId)).size !== entries.length || new Set(entries.map(role => role.taskId)).size !== entries.length) throw Error('Duplicate operational role/task identity');
}
function inspect(snapshot, { registry, ledger, runs, operational = operationalContract }) {
  validateOperationalContract(operational);
  if (!snapshot || !Number.isFinite(time(snapshot.observedAt)) || time(snapshot.observedAt) > Date.now() || !Array.isArray(snapshot.tasks)) throw Error('Actual observed task snapshot required');
  const tasks = snapshot.tasks.flatMap(task => nativeTasks(task));
  const amendment = ledger.amendments.find(a => a.registryVersion === registry.registryVersion);
  if (!amendment) throw Error('Matching amendment required');
  const identities = [
    ...amendment.savedTasks.map(saved => ({ id: saved.id, taskId: saved.taskId, kind: 'watch', aliases: [saved.id, headings.get(saved.id)].filter(Boolean), baseline: saved.currentConfiguration || saved })),
    ...operational.roles.map(role => ({ id: role.roleId, taskId: role.taskId, kind: 'role', aliases: [role.roleId, ...role.reportAliases], baseline: role.configuration }))
  ];
  if (new Set(identities.map(i => i.taskId)).size !== identities.length || new Set(identities.map(i => i.id)).size !== identities.length) throw Error('Duplicate declared role/task identity');
  const outputs = new Map(), byId = new Map();
  for (const task of tasks) {
    const matches = byId.get(task.id) || []; matches.push(task); byId.set(task.id, matches);
    const identity = identities.find(i => i.taskId === task.id), last = task.run_details?.last_run, result = task.run_details?.latest_result;
    if (!identity || task.is_enabled !== true || !object(last) || !object(result) || !safeId(last.id) || last.id !== result.run_id || typeof result.content_text !== 'string' || !result.content_text.trim()) continue;
    const key = digest(result.content_text), peers = outputs.get(key) || [];
    peers.push(identity); outputs.set(key, peers);
  }
  const reconcile = identity => {
    const matches = byId.get(identity.taskId) || [], task = matches[0];
    const label = identity.kind === 'watch' ? { watchId: identity.id } : { roleId: identity.id };
    if (matches.length !== 1) return { ...label, taskId: identity.taskId, accepted: false, configuration: { status: 'unverified' }, attempt: { status: 'unverified' }, result: { status: 'unverified' }, delivery: { status: 'unknown', claimedDelivered: false }, issues: [matches.length ? 'duplicate-actual-task' : 'missing-actual-task'] };
    const config = configuration(task, identity.baseline, snapshot.observedAt), evidence = attemptResult(task, snapshot.observedAt, identity.baseline?.readbackAt, identity, identities, outputs);
    const issues = [...config.issues, ...evidence.attempt.issues, ...evidence.result.issues];
    if (task.is_enabled !== true) issues.push('participating-task-disabled');
    if (identity.kind === 'watch') {
      const proof = runs.find(r => r.kind === 'saved-task-execution' && r.watchId === identity.id && r.registryVersion === registry.registryVersion && r.execution?.taskId === task.id && evidence.attempt.schedulerRunId && r.execution.schedulerRunId === evidence.attempt.schedulerRunId);
      if (!proof) issues.push('no-matching-current-coverage-receipt');
      else if (!proof.coverageComplete || !proof.deliveryComplete || !proof.claimedComplete || !proof.publication?.claimedDelivered) issues.push('coverage-or-delivery-incomplete');
    }
    return { ...label, taskId: identity.taskId, schedulerRunId: evidence.attempt.schedulerRunId, recordedStatus: evidence.attempt.recordedStatus,
      isEnabled: typeof task.is_enabled === 'boolean' ? task.is_enabled : null, configuration: config, ...evidence, accepted: issues.length === 0, issues };
  };
  const watches = identities.filter(i => i.kind === 'watch').map(reconcile), roles = identities.filter(i => i.kind === 'role').map(reconcile);
  const inventory = {
    checked: identities.filter(i => byId.has(i.taskId)).map(i => ({ roleId: i.id, taskId: i.taskId })),
    missingRoles: identities.filter(i => !byId.has(i.taskId)).map(i => i.id),
    duplicateTaskIds: [...byId].filter(([, matches]) => matches.length > 1).map(([id]) => safeId(id)),
    missingTaskIdentities: tasks.flatMap((task, index) => safeId(task.id) ? [] : [index]),
    optional: tasks.filter(task => operational.optionalTasks.some(optional => optional.taskId === task.id)).map(task => ({ taskId: task.id, isEnabled: typeof task.is_enabled === 'boolean' ? task.is_enabled : null, status: 'not-recurring-participant' })),
    unregistered: tasks.filter(task => !identities.some(i => i.taskId === task.id) && !operational.optionalTasks.some(optional => optional.taskId === task.id)).map(task => ({ taskId: safeId(task.id), status: 'unregistered' }))
  };
  return { observedAt: snapshot.observedAt, status: watches.every(w => w.accepted) ? 'evidence-matched' : 'unverified', watches, inventory,
    operational: { contractVersion: operational.contractVersion, status: roles.every(role => role.accepted) ? 'evidence-matched' : 'unverified', roles, claimedDelivered: false,
      qualification: 'Operational configuration/attempt/result reconciliation only. No content coverage, pilot activation, scheduler repair or notification delivery is established.' },
    claimedDelivered: false, qualification: 'Read-only identity/configuration/receipt reconciliation; matching evidence does not independently establish source truth, actual permissions, future dispatch or production delivery. Null next_run_time is unknown, not proof a task is disabled. No task, timer, retry or activation is created.' };
}
module.exports = { inspect, savedConfigurationDigest, nativeTasks };
