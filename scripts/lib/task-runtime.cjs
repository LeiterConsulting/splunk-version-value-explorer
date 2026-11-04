/* Read-only reconciliation of supported native snapshots. Never schedules or mutates tasks. */
const crypto = require('node:crypto');
const digest = text => crypto.createHash('sha256').update(text).digest('hex');
const headings = new Map([
  ['version-release-watch', 'Version Release Watch'], ['version-guidance-audit', 'Version Guidance Audit'],
  ['es-editions-watch', 'ES Editions Watch'], ['csp-fedramp-watch', 'CSP FedRAMP Watch']
]);
function inspect(snapshot, { registry, ledger, runs }) {
  if (!snapshot || !Number.isFinite(Date.parse(snapshot.observedAt)) || !Array.isArray(snapshot.tasks)) throw Error('Actual observed task snapshot required');
  const ids = snapshot.tasks.map(t => t.id);
  if (new Set(ids).size !== ids.length) throw Error('Duplicate actual task identity');
  const amendment = ledger.amendments.find(a => a.registryVersion === registry.registryVersion);
  if (!amendment) throw Error('Matching amendment required');
  const outputs = new Map();
  for (const task of snapshot.tasks) {
    const last = task.run_details?.last_run, result = task.run_details?.latest_result;
    if (!task.is_enabled || !last || last.id !== result?.run_id || !result.content_text?.trim()) continue;
    const key = digest(result.content_text), matches = outputs.get(key) || [];
    matches.push(task.id); outputs.set(key, matches);
  }
  const watches = amendment.savedTasks.map(saved => {
    const task = snapshot.tasks.find(t => t.id === saved.taskId), issues = [];
    if (!task) return { watchId: saved.id, taskId: saved.taskId, accepted: false, issues: ['missing-actual-task'] };
    if (!task.is_enabled) issues.push('participating-task-disabled');
    const expected = saved.currentConfiguration?.afterDigest || saved.afterDigest;
    if (!expected || task.configurationDigest !== expected) issues.push('saved-configuration-not-matched');
    const last = task.run_details?.last_run, result = task.run_details?.latest_result;
    if (!last) issues.push('no-recorded-run');
    else {
      if (last.recorded_status !== 'completed') issues.push('recorded-run-' + last.recorded_status);
      if (!result || result.run_id !== last.id) issues.push('current-run-result-unavailable');
      else {
        const first = (result.content_text || '').split('\n').find(s => s.trim()) || '';
        if (!first.includes(saved.id) && !first.includes(headings.get(saved.id))) issues.push('result-lacks-own-watch-identity');
        const other = [...headings].find(([id, title]) => id !== saved.id && first.includes(title));
        if (other) issues.push('result-names-another-watch:' + other[0]);
        if (result.content_truncated) issues.push('result-truncated');
        if (!result.content_text?.trim() || result.is_failure_message) issues.push('result-not-success-evidence');
        const peers = outputs.get(digest(result.content_text || '')) || [];
        if (peers.some(id => id !== task.id && amendment.savedTasks.some(t => t.taskId === id && t.id !== saved.id))) issues.push('duplicate-result-across-watches');
      }
      const readback = saved.currentConfiguration?.readbackAt || saved.readbackAt;
      if (!Number.isFinite(Date.parse(last.started_at)) || !Number.isFinite(Date.parse(readback)) || Date.parse(last.started_at) < Date.parse(readback)) issues.push('run-predates-saved-amendment');
      if (Date.parse(last.started_at) > Date.parse(snapshot.observedAt) || Date.parse(last.completed_at) > Date.parse(snapshot.observedAt)) issues.push('run-clock-after-observation');
    }
    const proof = runs.find(r => r.kind === 'saved-task-execution' && r.watchId === saved.id && r.registryVersion === registry.registryVersion && r.execution?.taskId === task.id && last?.id && r.execution.schedulerRunId === last.id);
    if (!proof) issues.push('no-matching-current-coverage-receipt');
    else {
      if (!proof.coverageComplete || !proof.deliveryComplete || !proof.claimedComplete || !proof.publication?.claimedDelivered) issues.push('coverage-or-delivery-incomplete');
    }
    return { watchId: saved.id, taskId: task.id, schedulerRunId: last?.id || null, recordedStatus: last?.recorded_status || null,
      schedule: task.schedule, timingMode: task.timing_mode, isEnabled: task.is_enabled,
      accepted: issues.length === 0, issues };
  });
  return { observedAt: snapshot.observedAt, status: watches.every(w => w.accepted) ? 'evidence-matched' : 'unverified', watches,
    claimedDelivered: false, qualification: 'Read-only identity/configuration/receipt reconciliation; matching evidence does not independently establish source truth, actual permissions, future dispatch or production delivery. Null next_run_time is unknown, not proof a task is disabled. No task, timer, retry or activation is created.' };
}
module.exports = { inspect };
