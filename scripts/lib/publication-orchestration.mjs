/* Transport-free orchestration for offline verification, NOT a production caller.
 * No credentials, URLs, fetch, CLI or workflow imports. Production entry points
 * remain unconditionally held. Runtime authentication, exact-commit provenance,
 * seed bootstrap and compare-and-swap guards remain mandatory and unchanged. */
import crypto from 'node:crypto';
const repository = 'LeiterConsulting/splunk-version-value-explorer';
const sha = /^[a-f0-9]{40}$(?![\s\S])/;
const revision = /^content-[a-f0-9]{24}$(?![\s\S])/;
const engine = /^engine-[a-f0-9]{20}$(?![\s\S])/;
const reject = reason => { throw Object.assign(Error(reason), { reason }); };
export function operationId(commit, action) {
  if (typeof commit !== 'string' || !sha.test(commit) || !['bootstrap', 'publish'].includes(action)) reject('invalid-operation');
  return 'pub-' + crypto.createHash('sha256').update(commit + ':' + action).digest('hex').slice(0, 32);
}
function prepare(candidate, expectedCommit, deployedEngine) {
  // Snapshot before awaiting any dependency. This is structural preflight only;
  // the authenticated runtime independently verifies every exact bundle byte.
  const value = structuredClone(candidate), m = value?.bundle?.manifest;
  if (typeof expectedCommit !== 'string' || !sha.test(expectedCommit) || value?.repository !== repository || value?.commit !== expectedCommit ||
      typeof deployedEngine !== 'string' || !engine.test(deployedEngine) || m?.engineRevision !== deployedEngine || typeof m?.revision !== 'string' || !revision.test(m.revision)) reject('candidate-context-rejected');
  return value;
}
function headValid(value, m) {
  if (!value || Object.keys(value).sort().join(',') !== 'activeDelivery,engineRevision,generation,revision' ||
      typeof value.revision !== 'string' || !revision.test(value.revision) || value.engineRevision !== m.engineRevision ||
      !Number.isSafeInteger(value.generation) || value.generation < 1 || value.generation >= Number.MAX_SAFE_INTEGER || typeof value.activeDelivery !== 'boolean') reject('head-unverified');
}
async function orchestrate(mode, { candidate, expectedCommit, deployedEngine, call, deployedSeedRevision } = {}) {
  let action = 'candidate-input', attempted = false;
  const completedActions = [];
  const base = { mode, claimedDelivered: false, qualification: 'Offline orchestration result only; no production authority, provenance, activation eligibility or delivery proof.' };
  async function invoke(route, body) {
    action = route; attempted = body !== undefined;
    // No retries, including rejected or unparseable responses. The supplied
    // adapter must reject unsuccessful HTTP, parsing and schema validation.
    const result = await call(route, body);
    return result;
  }
  try {
    const c = prepare(candidate, expectedCommit, deployedEngine), m = c.bundle.manifest;
    if (typeof call !== 'function') reject('adapter-required');
    if (mode === 'bootstrap') {
      if (typeof deployedSeedRevision !== 'string' || !revision.test(deployedSeedRevision) || m.revision !== deployedSeedRevision) reject('bootstrap-seed-mismatch');
      const result = await invoke('bootstrap', { candidate: c, operationId: operationId(c.commit, 'bootstrap') });
      if (!result || result.status !== 'initialized' || result.revision !== m.revision || result.engineRevision !== m.engineRevision || !Number.isSafeInteger(result.generation) || result.generation < 1) reject('mutation-response-invalid');
      completedActions.push('bootstrap'); attempted = false;
      return { ...base, status: 'bootstrap-reported', completedActions };
    }
    let head;
    if (mode === 'advance') {
      head = structuredClone(await invoke('head')); headValid(head, m);
      completedActions.push('head');
      if (!head.activeDelivery) reject('delivery-disabled');
      if (head.revision === m.revision) return { ...base, status: 'already-current', completedActions };
    }
    const staged = await invoke('stage', c);
    if (staged?.status !== 'staged' || staged.revision !== m.revision || staged.engineRevision !== m.engineRevision) reject('mutation-response-invalid');
    completedActions.push('stage'); attempted = false;
    if (mode === 'stage-only') return { ...base, status: 'staged-only', revision: m.revision, completedActions };
    const result = await invoke('activate', { operationId: operationId(c.commit, 'publish'), revision: m.revision,
      expectedRevision: head.revision, expectedGeneration: head.generation, intent: 'publish' });
    const validEvent = event => event && typeof event === 'object' && !Array.isArray(event) &&
      Object.keys(event).sort().join(',') === 'generation,revision' && event.revision === m.revision &&
      Number.isSafeInteger(event.generation) && event.generation === head.generation + 1;
    if (!result || !['applied', 'already-applied'].includes(result.status) || !validEvent(result.applied) ||
        !validEvent(result.current)) reject('mutation-response-invalid');
    completedActions.push('activate'); attempted = false;
    return { ...base, status: 'activation-reported', revision: m.revision, completedActions };
  } catch (error) {
    const reasons = ['candidate-context-rejected', 'adapter-required', 'bootstrap-seed-mismatch', 'head-unverified', 'delivery-disabled', 'mutation-response-invalid'];
    return { ...base, status: 'failed', action, completedActions, reason: reasons.includes(error?.reason) ? error.reason : 'operation-failed',
      mutationOutcome: attempted ? 'uncertain-read-back-before-retry' : 'no-write-at-failed-action' };
  }
}
export const stageOnly = options => orchestrate('stage-only', options);
export const bootstrapOnly = options => orchestrate('bootstrap', options);
export const advance = options => orchestrate('advance', options);
