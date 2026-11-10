'use strict';
// Pure, offline proposals only. No service adapters, ownership or authorization.
const schema = require('../../schemas/coordination-v1.json');
const { isDeepStrictEqual: same } = require('node:util');
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const plain = x => x !== null && typeof x === 'object' && !Array.isArray(x) && Object.getPrototypeOf(x) === Object.prototype;
function instant(x) {
  if (typeof x !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(x)) return NaN;
  const ms = Date.parse(x);
  if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0,19) !== x.slice(0,19)) return NaN;
  return ms;
}
function matches(s, v) {
  if (s.$ref) return matches(schema.$defs[s.$ref.split('/').pop()], v);
  if (s.oneOf && s.oneOf.filter(x => matches(x,v)).length !== 1) return false;
  if (s.anyOf && !s.anyOf.some(x => matches(x,v))) return false;
  if (own(s,'const') && !same(s.const,v)) return false;
  if (s.enum && !s.enum.some(x => same(x,v))) return false;
  if (s.type === 'null' && v !== null) return false;
  if (s.type === 'boolean' && typeof v !== 'boolean') return false;
  if (s.type === 'integer' && (!Number.isSafeInteger(v) || v < (s.minimum ?? -Infinity))) return false;
  if (s.type === 'string') {
    if (typeof v !== 'string' || v.length < (s.minLength ?? 0) || v.length > (s.maxLength ?? Infinity)) return false;
    if (s.pattern && !new RegExp(s.pattern).test(v)) return false;
    if (s.format === 'date-time' && !Number.isFinite(instant(v))) return false;
  }
  if (s.type === 'array') {
    if (!Array.isArray(v) || v.length < (s.minItems ?? 0) || !Array.from(v).every(x => matches(s.items,x))) return false;
    if (s.uniqueItems && v.some((x,i) => v.slice(0,i).some(y => same(x,y)))) return false;
  }
  if (s.type === 'object') {
    if (!plain(v) || (s.required || []).some(k => !own(v,k))) return false;
    if (s.additionalProperties === false && Object.keys(v).some(k => !own(s.properties,k))) return false;
    if (Object.entries(s.properties || {}).some(([k,rule]) => own(v,k) && !matches(rule,v[k]))) return false;
  }
  return true;
}
function clock(context) {
  return plain(context) && Object.keys(context).every(k => ['now','maxAgeMs'].includes(k)) &&
    Number.isFinite(instant(context.now)) && Number.isSafeInteger(context.maxAgeMs) && context.maxAgeMs > 0;
}
function fresh(t, context) {
  const age = instant(context.now) - instant(t);
  return Number.isFinite(age) && age >= 0 && age <= context.maxAgeMs;
}
function validateRecord(record, context) {
  const issues = [];
  if (!clock(context)) return {...qualification,valid:false,issues:['invalid-freshness-policy']};
  if (!matches(schema,record)) return {...qualification,valid:false,issues:['schema-invalid']};
  const observed = record.recordKind === 'observer-work' ? record.observedAt : record.lastObservedAt;
  if (!fresh(observed,context)) issues.push('observation-stale-or-future');
  if (record.recordKind === 'observer-work') {
    // This first slice deliberately cannot authenticate native identity.
    if (record.trigger.nativeRunId !== null || record.trigger.nativeStartedAt !== null) issues.push('native-identity-adapter-unavailable');
    if (record.configurationBaselineStatus === 'matched-approved-baseline') issues.push('baseline-authentication-unavailable');
  } else {
    if (record.lastOutcome === 'delivered') issues.push('delivery-authentication-unavailable');
    const active = !['idle','settled'].includes(record.status);
    if (active && ['claimId','ownerRole','invocationBindingDigest','authorizationEvidenceDigest','candidate'].some(k => record[k] === null)) issues.push('active-claim-binding-missing');
    if (record.attentionAfter !== null && instant(record.attentionAfter) <= instant(context.now)) issues.push('attention-deadline-expired');
    if (record.pendingAction && (!fresh(record.pendingAction.intentAt,context) || instant(record.pendingAction.intentAt) > instant(observed))) issues.push('intent-stale-or-future');
    if (['intent','executing','uncertain'].includes(record.status) && record.pendingAction === null) issues.push('action-binding-missing');
    if (['idle','settled'].includes(record.status) && record.pendingAction !== null) issues.push('unresolved-action-cannot-settle');
  }
  return {...qualification,valid:issues.length === 0,issues};
}
const qualification = {mode:'offline-proposal',authority:'unverified',claimOwnership:'unverified',nativeCompletion:'unverified',claimedDelivered:false};
function result(issues, detail={}) { return {...qualification,...detail,eligible:issues.length === 0,issues}; }
const edges = {idle:['claimed'],settled:['claimed'],claimed:['intent','verifying','settled'],intent:['executing','uncertain'],executing:['uncertain'],observing:['verifying','settled'],verifying:['settled','uncertain'],uncertain:[]};
function planTransition(previous, next, context, ref) {
  let issues = [...validateRecord(previous,context).issues,...validateRecord(next,context).issues];
  if (issues.length) return result(issues);
  if (previous.recordKind !== 'public-claim-state' || next.recordKind !== 'public-claim-state') return result(['claim-records-required']);
  if (typeof ref !== 'string' || !/^[a-f0-9]{40}$/.test(ref) || next.previousCommit !== ref) issues.push('expected-ref-mismatch');
  if (!edges[previous.status]?.includes(next.status)) issues.push('unsupported-transition');
  if (next.sequence !== previous.sequence + 1) issues.push('sequence-not-monotonic');
  if (instant(next.lastObservedAt) < instant(previous.lastObservedAt)) issues.push('observation-regressed');
  const acquisition = ['idle','settled'].includes(previous.status);
  if (acquisition && next.claimId === previous.claimId) issues.push('new-claim-identity-required');
  if (next.epoch !== previous.epoch + (acquisition ? 1 : 0)) issues.push('epoch-mismatch');
  if (!acquisition) for (const key of ['claimId','ownerRole','invocationBindingDigest','authorizationEvidenceDigest','resourceSet','candidate']) {
    if (!same(previous[key],next[key])) issues.push('binding-changed:'+key);
  }
  if (previous.pendingAction !== null) {
    // Recovery adapter not implemented: even a plausible outcome cannot clear or rebind.
    if (!same(previous.pendingAction,next.pendingAction)) issues.push('action-reconciliation-required');
  } else if (next.pendingAction !== null && (previous.status !== 'claimed' || next.status !== 'intent' || next.pendingAction.outcome !== 'intent-recorded' || next.pendingAction.outcomeEvidenceDigest !== null)) issues.push('invalid-new-intent');
  if (previous.status === 'uncertain' || previous.pendingAction?.outcome === 'unknown') issues.push('uncertainty-reconciliation-required');
  if (next.lastOutcome !== previous.lastOutcome) issues.push('outcome-adapter-unavailable');
  return result(issues,{proposalOnly:true});
}
const positive = ['configurationMatched','exactAttemptMatched','requiredScopeAssessed','preReleaseChecksPassed','mainAndIntegrationCurrent','artifactEvidenceMatched','siteBaselineMatched','budgetReservationValid'];
const negative = ['wrongOrDuplicateReport','nativeFailed','pendingOrUncertainWrite','claimBusy'];
function planPublication(facts, context) {
  if (!clock(context) || !plain(facts)) return result(['invalid-input']);
  const keys = [...positive,...negative,'observedAt','mode','ownTerminalReportMatched','actualProducerStillRunning','invocationOwnerVerified'];
  if (Object.keys(facts).some(k => !keys.includes(k)) || keys.some(k => !own(facts,k))) return result(['invalid-input-fields']);
  if ([...positive,...negative,'ownTerminalReportMatched','actualProducerStillRunning','invocationOwnerVerified'].some(k => typeof facts[k] !== 'boolean')) return result(['non-boolean-evidence']);
  const issues = [];
  if (!fresh(facts.observedAt,context)) issues.push('evidence-stale-or-future');
  for (const key of positive) if (!facts[key]) issues.push('unverified:'+key);
  for (const key of negative) if (facts[key]) issues.push('hold:'+key);
  if (!['handoff','in-run'].includes(facts.mode)) issues.push('unsupported-mode');
  if (facts.mode === 'handoff' && !facts.ownTerminalReportMatched) issues.push('own-terminal-report-required');
  if (facts.mode === 'in-run' && (!facts.actualProducerStillRunning || !facts.invocationOwnerVerified)) issues.push('actual-producer-required');
  return result(issues,{decision:issues.length ? 'hold' : 'eligible-for-independent-review'});
}
module.exports = {validateRecord,planTransition,planPublication};
