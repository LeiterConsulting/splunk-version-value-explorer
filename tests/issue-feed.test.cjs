const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { build, validateLedger, sha256, key, sync } = require('../scripts/lib/issue-feed.cjs');
const { readIssueFeed } = require('../scripts/read-issue-feed.cjs');
const real = JSON.parse(fs.readFileSync('content/issue-feed.json'));
const example = JSON.parse(fs.readFileSync('content/issue-feed-examples.json'));
const clone = value => structuredClone(value);
const commit = 'a'.repeat(40);
function transport(ledger, mutate) {
  const { files } = build(ledger);
  return async url => {
    assert.match(url, new RegExp(`^https://raw\\.githubusercontent\\.com/LeiterConsulting/splunk-version-value-explorer/${commit}/feeds/issues/v1/(?:examples/)?`));
    const file = url.split('/feeds/issues/v1/')[1].replace(/^examples\//, '');
    let bytes = files.get(file);
    if (mutate) bytes = mutate(file, bytes);
    return new Response(bytes || '', { status: bytes ? 200 : 404 });
  };
}
test('generated production and synthetic feeds are synchronized and isolated', () => {
  assert(sync(process.cwd(), true).findings >= 12);
  assert.equal(build(real).index.synthetic, false);
  assert.equal(build(example).index.synthetic, true);
  for (const { files } of [build(real), build(example)]) for (const [file, bytes] of files) if (file !== 'index.json') assert.equal(file.split('/')[1], sha256(bytes) + '.json');
});
test('expanded records preserve scoped concerns, original audit labels and revision uncertainty', () => {
  assert(real.records.filter(r => r.kind === 'assessment').length >= 23);
  assert(real.records.every(r => r.provenance.every(p => ['published-audit-normalization', 'direct-public-review'].includes(p.basis))));
  assert(real.records.some(r => r.evidence.some(e => e.documentRevision.type === 'unavailable')));
  assert(real.records.some(r => r.evidence.some(e => e.documentRevision.type === 'sha256')));
  for (const record of real.records) for (const p of record.provenance) {
    // The current mutable audit file is not the authority for an older pinned
    // observation. Its label may legitimately change in a later public review.
    assert.match(p.url, /\/blob\/[a-f0-9]{40}\/docs\//);
    assert(p.pointer.startsWith('/') && p.originalLabel.length > 0);
  }
});
test('producer rejects changed history, duplicates, missing assessed findings and silent removal', () => {
  const changed = clone(real); changed.records[0].title += ' changed';
  assert.throws(() => validateLedger(changed, real), /immutable/);
  const duplicate = clone(real); duplicate.records.push(clone(duplicate.records[0]));
  assert.throws(() => validateLedger(duplicate), /Duplicate record/);
  const missing = clone(real); missing.publications[0].recordKeys = missing.publications[0].recordKeys.filter(k => k !== key(missing.records[0]));
  assert.throws(() => validateLedger(missing), /omits assessed finding/);
  const removed = clone(real); removed.publications.at(-1).recordKeys.pop();
  assert.throws(() => validateLedger(removed), /Unpublished|retain all/);
});
test('coverage-gap producer requires a finite retrieved corpus, not retrieval failure', () => {
  const bad = clone(example), gap = bad.records.find(r => r.concernType === 'coverage-gap');
  gap.evidence[0].availability = 'unavailable';
  assert.throws(() => validateLedger(bad), /finite retrieved corpus/);
});
test('editorial withdrawal is distinct from an addressed assessment', () => {
  const next = clone(real), history = real.records.filter(r => r.kind === 'finding' && r.findingId === real.records[0].findingId).sort((a, b) => a.revision - b.revision), withdrawn = clone(history.at(-1));
  withdrawn.revision++; withdrawn.lifecycle = { disposition: 'withdrawn', reason: 'Synthetic test of editorial withdrawal; no public correction asserted.' };
  next.records.push(withdrawn); next.publications.push({ ...clone(next.publications.at(-1)), sequence: next.publications.length + 1, recordKeys: [...next.publications.at(-1).recordKeys, key(withdrawn)] });
  validateLedger(next, real);
  assert.equal(next.records.filter(r => r.outcome === 'addressed-in-reviewed-scope').length, real.records.filter(r => r.outcome === 'addressed-in-reviewed-scope').length);
});
test('producer rejects wrong finding links and unsupported outcomes', () => {
  const bad = clone(real); bad.records.find(r => r.kind === 'assessment').findingId = 'vci-absent-finding';
  assert.throws(() => validateLedger(bad), /unknown finding/);
  const status = clone(real); status.records.find(r => r.kind === 'assessment').outcome = 'closed';
  assert.throws(() => validateLedger(status), /outcome/);
});
test('reference consumer bootstraps, repeats idempotently and replays the same identities', async () => {
  const fetchImpl = transport(example);
  const first = await readIssueFeed({ commit, synthetic: true, fetchImpl });
  const repeated = await readIssueFeed({ commit, synthetic: true, fetchImpl });
  assert.equal(first.records.length, 9); assert.deepEqual(first.records, repeated.records);
  const recovery = await readIssueFeed({ commit, synthetic: true, checkpoint: first.index.publications[0].publicationId, fetchImpl });
  assert.equal(recovery.publications.length, 1);
  assert(recovery.records.some(r => r.record.outcome === 'partially-addressed'));
  const noop = await readIssueFeed({ commit, synthetic: true, checkpoint: first.checkpoint, fetchImpl });
  assert.equal(noop.records.length, 0);
  assert(first.records.filter(r => r.record.kind === 'assessment').every(r => !['closed', 'fixed'].includes(r.record.outcome)));
});
test('consumer fails on tampering, unknown checkpoints, schema majors and path traversal', async () => {
  await assert.rejects(readIssueFeed({ commit, fetchImpl: transport(real, (file, bytes) => file.startsWith('records/') ? bytes + ' ' : bytes) }), /integrity/);
  await assert.rejects(readIssueFeed({ commit, checkpoint: 'vci-' + 'b'.repeat(64), fetchImpl: transport(real) }), /Checkpoint is absent/);
  await assert.rejects(readIssueFeed({ commit, fetchImpl: transport(real, (file, bytes) => file === 'index.json' ? bytes.replace('"1.0.0"', '"2.0.0"') : bytes) }), /Unsupported schema/);
  await assert.rejects(readIssueFeed({ commit, fetchImpl: transport(real, (file, bytes) => file === 'index.json' ? bytes.replace(/snapshots\/[a-f0-9]+\.json/g, '../secrets.json') : bytes) }), /descriptor/);
});
test('additive unknown fields survive consumer readback', async () => {
  const additive = clone(real); additive.records[0].futureHint = { description: 'Preserve me without inferring meaning.' };
  const read = await readIssueFeed({ commit, fetchImpl: transport(additive) });
  assert.deepEqual(read.records.find(r => r.record.kind === 'finding').record.futureHint, additive.records[0].futureHint);
});
test('synthetic records cannot enter the production stream', async () => {
  await assert.rejects(readIssueFeed({ commit, fetchImpl: transport(example) }), /mixed synthetic/);
});
test('consumer retains an unknown outcome for review without interpreting it', async () => {
  const { files, index } = build(real);
  const snapshot = JSON.parse(files.get(index.latest.path));
  const future = clone(real.records.find(r => r.kind === 'assessment'));
  future.assessmentId = 'vcia-future-outcome'; future.outcome = 'future-unknown-result';
  future.schemaVersion = '1.1.0'; future.futureEvidence = { retained: true };
  const bytes = JSON.stringify(future, null, 2) + '\n', digest = sha256(bytes);
  const file = `records/${digest}.json`; files.set(file, bytes);
  snapshot.records.push({ kind: 'assessment', id: future.assessmentId, revision: 1, path: file, sha256: digest, byteLength: Buffer.byteLength(bytes) });
  const snapshotBytes = JSON.stringify(snapshot, null, 2) + '\n', snapshotDigest = sha256(snapshotBytes);
  const next = { ...index.latest, publicationId: 'vci-' + snapshotDigest, sha256: snapshotDigest, path: `snapshots/${snapshotDigest}.json`, byteLength: Buffer.byteLength(snapshotBytes) };
  files.set(next.path, snapshotBytes); index.latest = next; index.publications[index.publications.length - 1] = next;
  files.set('index.json', JSON.stringify(index));
  const read = await readIssueFeed({ commit, fetchImpl: async url => new Response(files.get(url.split('/feeds/issues/v1/')[1])) });
  assert.equal(read.quarantined.length, 1);
  assert.equal(read.quarantined[0].record.outcome, 'future-unknown-result');
  assert.deepEqual(read.quarantined[0].record.futureEvidence, { retained: true });
});
test('CI history check rejects an already-committed rewrite against the parent', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-issue-history-'));
  const git = args => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  const write = ledger => {
    fs.mkdirSync(path.join(root, 'content'), { recursive: true });
    fs.writeFileSync(path.join(root, 'content/issue-feed.json'), JSON.stringify(ledger));
    fs.writeFileSync(path.join(root, 'content/issue-feed-examples.json'), JSON.stringify(example));
  };
  try {
    git(['init', '--initial-branch', 'main']); write(real);
    git(['add', '.']); git(['-c', 'user.name=Feed test', '-c', 'user.email=feed@example.invalid', 'commit', '-m', 'Original ledger']);
    const changed = clone(real); changed.records[0].title += ' rewritten'; write(changed);
    git(['add', '.']); git(['-c', 'user.name=Feed test', '-c', 'user.email=feed@example.invalid', 'commit', '-m', 'Invalid rewritten ledger']);
    assert.throws(() => sync(root, true), /immutable/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
test('pilot checkpoint recovers expanded coverage without replacing prior records', async () => {
  assert.equal(real.publications[0].recordKeys.length, 4);
  assert.equal(real.publications[1].recordKeys.length, 6);
  const pilotKeys = new Set(real.publications[1].recordKeys);
  assert.equal(real.records.filter(r => pilotKeys.has(key(r))).length, 6);
  const index = build(real).index;
  assert.equal(index.publications[1].publicationId, 'vci-e1be5a90eb89a51c1af75f167631ed0beceec8f7b4dd1374b8cf1bd6d4e81a0b');
  const read = await readIssueFeed({ commit, checkpoint: index.publications[1].publicationId, fetchImpl: transport(real) });
  assert.equal(read.publications.length, index.publications.length - 2);
  assert(read.records.filter(r => r.record.kind === 'finding').length >= 12);
  assert(read.records.filter(r => r.record.kind === 'assessment').length >= 23);
  assert(read.records.filter(r => !pilotKeys.has(key(r.record))).length >= 29);
  const noop = await readIssueFeed({ commit, checkpoint: read.checkpoint, fetchImpl: transport(real) });
  assert.equal(noop.records.length, 0);
  const security = read.records.find(r => r.record.findingId === 'vci-svd-2026-1015-applicability' && r.record.kind === 'assessment').record;
  assert.equal(security.assessedAt, '2026-10-29');
  assert.equal(security.evidence[0].sourceCheckedAt, '2026-10-30');
});
