const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { key, build } = require('./issue-feed.cjs');
const watches = ['version-release-watch', 'es-editions-watch', 'csp-fedramp-watch', 'version-guidance-audit'];
const statuses = ['published', 'no-new-observations', 'pending-public-provenance', 'blocked'];
const assert = (value, message) => { if (!value) throw Error(message); };
const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const strings = value => Array.isArray(value) && value.every(x => typeof x === 'string' && x.trim());
function watchFor(file) {
  return watches.find(watch => new RegExp(`^docs/audits/\\d{4}-\\d{2}-\\d{2}-${watch}(?:-sources)?\\.json$`).test(file)) || null;
}
function reviewDigest(audit) {
  // Publication receipts can advance after the review without manufacturing a
  // new claim assessment. Every other field remains bound to the declaration.
  const review = Object.fromEntries(Object.entries(audit).filter(([name]) => !['issueFeed', 'publication', 'validation', 'validationOutcomes', 'baseline'].includes(name)));
  return hash(review);
}
function validatePolicy(policy) {
  assert(policy?.schemaVersion === 1 && policy.enabled === true && policy.mode === 'native' && policy.contractVersion === '1.0.0', 'Native issue-feed policy is not enabled');
  assert(Number.isFinite(Date.parse(policy.activatedAt)) && policy.transport === 'commit-pinned-static-json', 'Invalid native feed activation/transport');
  assert(Array.isArray(policy.watches) && policy.watches.length === 4 && watches.every(watch => policy.watches.some(w => w.id === watch && w.required === true)), 'All four watch families must require feed outcomes');
  assert(policy.privacy === 'public-evidence-only' && policy.consumerWriteBack === false && policy.automaticWorkClosure === false, 'Native feed must preserve independence and read-only boundaries');
  return policy;
}
function checkDeclaration(audit, file, ledger) {
  const watch = watchFor(file), outcome = audit.issueFeed;
  assert(watch && outcome?.schemaVersion === 1 && outcome.watchId === watch, 'Missing native issue-feed outcome: ' + file);
  assert(statuses.includes(outcome.status) && outcome.reviewDigest === reviewDigest(audit), 'Stale or invalid feed outcome: ' + file);
  assert(Number.isFinite(Date.parse(outcome.recordedAt)) && typeof outcome.qualification === 'string' && outcome.qualification.trim(), 'Feed outcome needs actual time and qualification');
  assert(strings(outcome.recordKeys) && strings(outcome.notReassessedFindingIds) && strings(outcome.deferredConcerns), 'Feed outcome must declare records, unreassessed findings and deferrals');
  assert(new Set(outcome.recordKeys).size === outcome.recordKeys.length && new Set(outcome.notReassessedFindingIds).size === outcome.notReassessedFindingIds.length, 'Duplicate feed outcome identities');
  const findingIds = new Set(ledger.records.filter(r => r.kind === 'finding').map(r => r.findingId));
  assert(outcome.notReassessedFindingIds.every(id => findingIds.has(id)), 'Unknown unreassessed finding identity');
  const publication = build(ledger).index.publications.find(p => p.publicationId === outcome.publicationId);
  assert(publication, 'Feed outcome checkpoint is not retained');
  const available = new Set(ledger.publications[publication.sequence - 1].recordKeys);
  assert(outcome.recordKeys.every(k => available.has(k)), 'Feed outcome references unpublished record revisions');
  if (outcome.status === 'published') {
    assert(outcome.recordKeys.length > 0, 'Published feed outcome needs actual records');
    for (const k of outcome.recordKeys) {
      const record = ledger.records.find(r => key(r) === k);
      assert(!outcome.notReassessedFindingIds.includes(record.findingId) || record.kind === 'finding', 'An assessed finding cannot also be declared not reassessed');
      assert(record.provenance.some(p => p.url.endsWith('/' + file)), 'Published observation must pin this audit as provenance');
    }
  } else {
    assert(outcome.recordKeys.length === 0, 'Non-publication outcome cannot claim published records');
    if (['pending-public-provenance', 'blocked'].includes(outcome.status)) assert(outcome.deferredConcerns.length > 0, 'Incomplete feed publication needs a finite deferral');
  }
  return { file, watchId: watch, status: outcome.status, reviewDigest: outcome.reviewDigest };
}
function check(root = process.cwd()) {
  const policy = validatePolicy(JSON.parse(fs.readFileSync(path.join(root, 'content/issue-feed-policy.json'))));
  const ledger = JSON.parse(fs.readFileSync(path.join(root, 'content/issue-feed.json')));
  const index = JSON.parse(fs.readFileSync(path.join(root, 'feeds/issues/v1/index.json')));
  assert(index.producer?.mode === 'native' && index.producer.policy?.sha256 === crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'feeds/issues/v1/producer-policy.json'))).digest('hex'), 'Public index does not declare the exact native policy');
  const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  const parents = git(['rev-list', '--parents', '-n', '1', 'HEAD']).split(/\s+/).slice(1);
  const candidates = new Set(git(['diff', '--name-only', 'HEAD']).split('\n').concat(git(['ls-files', '--others', '--exclude-standard']).split('\n')));
  for (const parent of parents) git(['diff', '--name-only', parent, 'HEAD']).split('\n').forEach(file => candidates.add(file));
  const results = [];
  for (const file of [...candidates].filter(watchFor)) {
    assert(fs.existsSync(path.join(root, file)), 'Do not delete public watch audit history: ' + file);
    const audit = JSON.parse(fs.readFileSync(path.join(root, file)));
    let changed = false;
    for (const revision of ['HEAD', ...parents]) {
      let prior;
      try { prior = JSON.parse(git(['show', `${revision}:${file}`])); } catch { changed = true; continue; }
      if (reviewDigest(prior) !== reviewDigest(audit)) changed = true;
    }
    if (changed || audit.issueFeed) results.push(checkDeclaration(audit, file, ledger));
  }
  return { enabled: policy.enabled, mode: policy.mode, checkedAuditOutcomes: results, qualification: 'Checks publication declarations and structural consistency, not the truth of public claims or successful downstream action.' };
}
function record(file, input, root = process.cwd()) {
  assert(watchFor(file), 'Select an exact supported watch audit path');
  validatePolicy(JSON.parse(fs.readFileSync(path.join(root, 'content/issue-feed-policy.json'))));
  const audit = JSON.parse(fs.readFileSync(path.join(root, file)));
  audit.issueFeed = { schemaVersion: 1, watchId: watchFor(file), status: input.status, recordedAt: new Date().toISOString(), reviewDigest: reviewDigest(audit), publicationId: input.publicationId, recordKeys: input.recordKeys, notReassessedFindingIds: input.notReassessedFindingIds, deferredConcerns: input.deferredConcerns, qualification: input.qualification };
  checkDeclaration(audit, file, JSON.parse(fs.readFileSync(path.join(root, 'content/issue-feed.json'))));
  fs.writeFileSync(path.join(root, file), JSON.stringify(audit, null, 2) + '\n');
  return audit.issueFeed;
}
module.exports = { watches, statuses, watchFor, reviewDigest, validatePolicy, checkDeclaration, check, record };
