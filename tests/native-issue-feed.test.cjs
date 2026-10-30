const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { check, validatePolicy, reviewDigest, checkDeclaration } = require('../scripts/lib/native-issue-feed.cjs');
const { key, build, encode, sha256 } = require('../scripts/lib/issue-feed.cjs');
const policy = JSON.parse(fs.readFileSync('content/issue-feed-policy.json'));
const ledger = JSON.parse(fs.readFileSync('content/issue-feed.json'));
const file = 'docs/audits/2026-10-30-es-editions-watch.json';
const original = JSON.parse(fs.readFileSync(file));
delete original.issueFeed;
function audit(status = 'no-new-observations') {
  const value = structuredClone(original);
  value.issueFeed = { schemaVersion: 1, watchId: 'es-editions-watch', status, recordedAt: '2026-10-30T22:00:00Z', reviewDigest: reviewDigest(value), publicationId: build(ledger).index.latest.publicationId, recordKeys: [], notReassessedFindingIds: ['vci-soar-cloud-880-release-stage'], deferredConcerns: [], qualification: 'Scoped test declaration; no new claim review is implied.' };
  return value;
}
test('native policy is publicly declared without changing historical snapshots or contract', () => {
  validatePolicy(policy);
  const before = build(ledger), after = build(ledger, policy);
  assert.deepEqual(after.index.publications, before.index.publications);
  assert.equal(after.index.schemaVersion, '1.0.0');
  assert.equal(after.index.producer.mode, 'native');
  assert.equal(after.index.producer.policy.sha256, sha256(encode(policy)));
  assert.equal(check().enabled, true);
  const bad = structuredClone(policy); bad.automaticWorkClosure = true;
  assert.throws(() => validatePolicy(bad), /independence/);
});
test('review changes require a current declaration while publication receipts do not invent reviews', () => {
  assert.throws(() => checkDeclaration(original, file, ledger), /Missing native/);
  const value = audit(); value.claimChecks[0].qualification += ' Changed scope.';
  assert.throws(() => checkDeclaration(value, file, ledger), /Stale/);
  const published = audit(); published.publication = { receipt: 'later-deployment-receipt' };
  assert.equal(checkDeclaration(published, file, ledger).status, 'no-new-observations');
});
test('published outcomes require record identity, retained checkpoint and exact audit provenance', () => {
  const value = audit('published');
  assert.throws(() => checkDeclaration(value, file, ledger), /actual records/);
  const record = ledger.records.find(r => r.assessmentId === 'vcia-soar-stage-20261030');
  value.issueFeed.recordKeys = [key(record)]; value.issueFeed.notReassessedFindingIds = [];
  assert.equal(checkDeclaration(value, file, ledger).status, 'published');
  value.issueFeed.publicationId = 'vci-' + '0'.repeat(64);
  assert.throws(() => checkDeclaration(value, file, ledger), /checkpoint/);
});
test('pending provenance and blockers stay explicit and cannot masquerade as published observations', () => {
  const value = audit('pending-public-provenance');
  assert.throws(() => checkDeclaration(value, file, ledger), /finite deferral/);
  value.issueFeed.deferredConcerns = ['Publish the audit, pin its public commit, then finish the feed follow-up.'];
  assert.equal(checkDeclaration(value, file, ledger).status, 'pending-public-provenance');
  value.issueFeed.recordKeys = [key(ledger.records[0])];
  assert.throws(() => checkDeclaration(value, file, ledger), /cannot claim/);
});
test('CI rejects a changed watch audit without a feed outcome', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-native-feed-'));
  const git = args => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  const write = (file, value) => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), encode(value)); };
  try {
    git(['init', '--initial-branch', 'main']);
    write('content/issue-feed-policy.json', policy); write('content/issue-feed.json', ledger);
    const generated = build(ledger, policy); write('feeds/issues/v1/index.json', generated.index);
    fs.writeFileSync(path.join(root, 'feeds/issues/v1/producer-policy.json'), generated.files.get('producer-policy.json'));
    write(file, original);
    git(['add', '.']); git(['-c', 'user.name=Feed test', '-c', 'user.email=feed@example.invalid', 'commit', '-m', 'Prior audit']);
    const changed = structuredClone(original); changed.claimChecks[0].qualification += ' New review.'; write(file, changed);
    assert.throws(() => check(root), /Missing native/);
    const declared = audit(); declared.claimChecks = changed.claimChecks; declared.issueFeed.reviewDigest = reviewDigest(declared); write(file, declared);
    assert.equal(check(root).checkedAuditOutcomes.length, 1);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
