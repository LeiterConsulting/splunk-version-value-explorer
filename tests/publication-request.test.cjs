const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createPublicationRequest, parseArgs, REPOSITORY } = require('../scripts/publication-request.cjs');

const valid = {
  repository: REPOSITORY,
  commit: '1'.repeat(40),
  tree: '2'.repeat(40),
  ref: 'refs/heads/main',
  expectedCurrentRevision: JSON.parse(fs.readFileSync('content/publication.json')).revision,
};

test('publication request binds an exact main commit and tree to the generated authority', async () => {
  const request = await createPublicationRequest(valid);
  assert.equal(request.provenance.repository, REPOSITORY);
  assert.equal(request.provenance.commit, valid.commit);
  assert.equal(request.expectedCurrentRevision, valid.expectedCurrentRevision);
  assert.deepEqual(request.manifest, request.bundle.manifest);
  assert.equal(Object.keys(request.manifest.datasetHashes).length, 7);
});

test('publication request fails closed for unauthorized provenance and stale generated data', async () => {
  await assert.rejects(createPublicationRequest({ ...valid, repository: 'other/repo' }), /not authorized/);
  await assert.rejects(createPublicationRequest({ ...valid, ref: 'refs/heads/feature' }), /main branch/);
  await assert.rejects(createPublicationRequest({ ...valid, commit: 'short' }), /full Git object IDs/);
  await assert.rejects(createPublicationRequest({ ...valid, expectedCurrentRevision: 'latest' }), /expected current revision/);

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-publication-'));
  try {
    fs.cpSync('content', path.join(root, 'content'), { recursive: true });
    fs.cpSync('dist', path.join(root, 'dist'), { recursive: true });
    fs.mkdirSync(path.join(root, 'worker'));
    fs.copyFileSync('worker/publication-core.mjs', path.join(root, 'worker/publication-core.mjs'));
    const manifestPath = path.join(root, 'content/publication.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath));
    manifest.recordCount += 1;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    await assert.rejects(createPublicationRequest(valid, root), /manifest does not match/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('publication argument parser rejects ambiguous or valueless input', () => {
  assert.deepEqual(parseArgs(['--repository', REPOSITORY, '--ref', 'refs/heads/main']), { repository: REPOSITORY, ref: 'refs/heads/main' });
  assert.throws(() => parseArgs(['repository', REPOSITORY]), /--name value/);
  assert.throws(() => parseArgs(['--repository']), /--name value/);
});
