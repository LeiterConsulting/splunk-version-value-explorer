/* Offline immutable release binding. NOT a publisher, lock or authority adapter.
 * No I/O, URL, credential, service callback or automatic caller. PR123/124 retain
 * ownership/transition work; this module only binds a supplied review snapshot. */
'use strict';
const crypto = require('node:crypto');
const REPOSITORY = 'LeiterConsulting/splunk-version-value-explorer';
const fail = reason => { throw new Error(reason); };
const plain = value => value && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
function keys(value, expected, label) {
  if (!plain(value)) fail('invalid-' + label);
  const own = Reflect.ownKeys(value);
  if (own.some(key => typeof key !== 'string') || own.sort().join(',') !== [...expected].sort().join(',')) fail('invalid-' + label);
  if (own.some(key => { const d = Object.getOwnPropertyDescriptor(value, key); return !d.enumerable || !Object.hasOwn(d, 'value'); })) fail('invalid-' + label);
}
function hex(value, size, label) {
  if (typeof value !== 'string' || value.length !== size || !/^[a-f0-9]+$/.test(value)) fail('invalid-' + label);
}
function integer(value, label, min = 1) {
  if (!Number.isSafeInteger(value) || value < min || value >= Number.MAX_SAFE_INTEGER) fail('invalid-' + label);
}
function token(value, prefix, size, label) {
  if (typeof value !== 'string' || !value.startsWith(prefix)) fail('invalid-' + label);
  hex(value.slice(prefix.length), size, label);
}
function identity(value) {
  keys(value, ['engineRevision','contentRevision','contentDigest','bundleSha256','recordCount'], 'identity');
  token(value.engineRevision, 'engine-', 20, 'engine');
  token(value.contentRevision, 'content-', 24, 'revision');
  hex(value.contentDigest, 64, 'content-digest');
  hex(value.bundleSha256, 64, 'bundle-hash');
  integer(value.recordCount, 'record-count');
}
function artifact(value) {
  keys(value, ['sourceCommit','sourceTree','archiveSha256','archiveBytes','reportInputsSha256','identity'], 'artifact');
  hex(value.sourceCommit, 40, 'commit'); hex(value.sourceTree, 40, 'tree');
  hex(value.archiveSha256, 64, 'archive-hash'); integer(value.archiveBytes, 'archive-bytes');
  hex(value.reportInputsSha256, 64, 'report-inputs'); identity(value.identity);
}
function live(value) {
  keys(value, ['artifactSha256','identity','generation','readerEnabled','publisherEnabled'], 'live');
  hex(value.artifactSha256, 64, 'live-artifact'); identity(value.identity);
  integer(value.generation, 'generation');
  for (const key of ['readerEnabled','publisherEnabled']) if (typeof value[key] !== 'boolean') fail('invalid-controls');
}
function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (plain(value)) return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
const digest = value => crypto.createHash('sha256').update(canonical(value)).digest('hex');
function frozen(value) {
  for (const child of Object.values(value)) if (child && typeof child === 'object') frozen(child);
  return Object.freeze(value);
}
function validate(input) {
  keys(input, ['schemaVersion','repository','candidate','validation','expectedLive','rollback'], 'release-input');
  if (input.schemaVersion !== 1 || input.repository !== REPOSITORY) fail('invalid-repository-or-version');
  artifact(input.candidate); artifact(input.rollback); live(input.expectedLive);
  const v = input.validation;
  keys(v, ['commit','tree','runId','runAttempt','exportSha256','reportInputsSha256'], 'validation');
  hex(v.commit, 40, 'validation-commit'); hex(v.tree, 40, 'validation-tree');
  if (typeof v.runId !== 'string' || !/^[1-9][0-9]{0,19}$/.test(v.runId)) fail('invalid-run');
  integer(v.runAttempt, 'attempt'); hex(v.exportSha256,64,'export-hash'); hex(v.reportInputsSha256,64,'validated-inputs');
  if (v.commit !== input.candidate.sourceCommit || v.tree !== input.candidate.sourceTree ||
      v.reportInputsSha256 !== input.candidate.reportInputsSha256) fail('validation-binding-mismatch');
  // Identity collisions are not an alternate delivery mode.
  const a=input.candidate.identity, b=input.expectedLive.identity;
  if (a.contentRevision === b.contentRevision && canonical(a) !== canonical(b)) fail('revision-identity-conflict');
}
function createBinding(input) {
  validate(input);
  const snapshot = structuredClone(input);
  // Same engine alone cannot establish a data-only release: static assets outside
  // the current engine hash exist. Until a reviewed impact adapter is supplied,
  // any changed complete runtime archive conservatively needs runtime review.
  const sameArtifact = snapshot.candidate.archiveSha256 === snapshot.expectedLive.artifactSha256;
  const sameIdentity = canonical(snapshot.candidate.identity) === canonical(snapshot.expectedLive.identity);
  if (sameArtifact && !sameIdentity) fail('artifact-identity-conflict');
  return frozen({
    schemaVersion: 1,
    releaseId: 'release-' + digest(snapshot.candidate),
    bindingId: 'binding-' + digest(snapshot),
    route: sameArtifact ? 'no-runtime-change-review' : 'runtime-transition-review',
    input: snapshot,
    authority: 'unverified', ownership: 'unverified', provenance: 'unverified',
    claimedDelivered: false,
    qualification: 'Offline structural binding only. Supplied evidence is not authenticated; no permission, source-byte verification, CI pass, lease or delivery is established.'
  });
}
function compareLive(binding, observedLive) {
  // Recreate rather than trust a caller-supplied ID/route; reject altered output.
  keys(binding,['schemaVersion','releaseId','bindingId','route','input','authority','ownership','provenance','claimedDelivered','qualification'],'binding');
  const rebuilt=createBinding(binding.input);
  if(canonical(rebuilt)!==canonical(binding)) fail('binding-tampered');
  live(observedLive);
  const matches=canonical(observedLive)===canonical(binding.input.expectedLive);
  return frozen({status: matches ? 'snapshot-matches-review-required' : 'held-live-drift',
    bindingId:binding.bindingId, claimedDelivered:false, authority:'unverified', ownership:'unverified'});
}
module.exports={REPOSITORY,createBinding,compareLive};
