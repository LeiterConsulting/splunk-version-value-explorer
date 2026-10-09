/* Verify downloaded CI artifacts against the current report inputs, not the date. */
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const gates = ['html-reopen', 'pdf-rendering', 'themes-and-narrow-screens'];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function target(root = process.cwd()) {
  const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).trim().split('\n')
    .filter(f => /^(dist\/[^/]+\.(?:html|js|css|json|svg)|client\/.*\.js|worker\/.*\.mjs|content\/(?:datasets\/.*\.json|publication\.json)|tools\/export-verification\/[^/]+\.(?:mjs|py|json)|scripts\/export-evidence\.cjs)$/.test(f)).sort();
  const inputs = [...new Set(files)].map(file => ({ file, sha256: hash(fs.readFileSync(path.join(root, file))) }));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'content/publication.json')));
  return { fingerprint: hash(JSON.stringify(inputs)), contentRevision: manifest.revision, engineRevision: manifest.engineRevision, inputs };
}
function verify(directory, root = process.cwd()) {
  const receipt = JSON.parse(fs.readFileSync(path.join(directory, 'evidence.json')));
  const expected = target(root);
  if (receipt.schemaVersion !== 1 || receipt.outcome !== 'passed' || receipt.target?.fingerprint !== expected.fingerprint
    || receipt.target?.contentRevision !== expected.contentRevision || receipt.target?.engineRevision !== expected.engineRevision) throw Error('Export evidence does not cover these report inputs');
  if (!/^[a-f0-9]{40}$/.test(receipt.commit || '') || !/^[a-f0-9]{40}$/.test(receipt.tree || '')
    || !Number.isFinite(Date.parse(receipt.completedAt)) || Date.parse(receipt.completedAt) > Date.now()) throw Error('Invalid export evidence provenance');
  const routes = JSON.parse(fs.readFileSync(path.join(root, 'tools/export-verification/routes.json')));
  const cases = routes.flatMap(r => ['default', 'cisco'].map(theme => r.id + '-' + theme));
  if (!Array.isArray(receipt.cases) || receipt.cases.length !== cases.length || new Set(receipt.cases.map(c => c.id)).size !== cases.length
    || !cases.every(id => receipt.cases.some(c => c.id === id && c.outcome === 'passed'))) throw Error('Missing or failed export route');
  const verifiedArtifacts = new Set();
  for (const artifact of receipt.artifacts || []) {
    if (typeof artifact.file !== 'string' || path.isAbsolute(artifact.file) || artifact.file.split(/[\\/]/).includes('..') || verifiedArtifacts.has(artifact.file)) throw Error('Invalid artifact path');
    const full = path.resolve(directory, artifact.file), real = fs.realpathSync(full), base = fs.realpathSync(directory) + path.sep;
    if (!real.startsWith(base) || hash(fs.readFileSync(full)) !== artifact.sha256) throw Error('Export artifact digest mismatch');
    verifiedArtifacts.add(artifact.file);
  }
  for (const c of receipt.cases) {
    const invalid = routes.find(r => c.id.startsWith(r.id + '-'))?.invalid;
    if (!c.narrow?.passed || !verifiedArtifacts.has(c.screen) || !verifiedArtifacts.has(c.narrow.file)) throw Error('Missing rendered viewport evidence');
    if (invalid) { if (c.exportsBlocked !== true) throw Error('Invalid route exports were not blocked'); continue; }
    if (!c.html?.offlineReopened || !c.html.complete || !c.html.networkRequestsBlocked || !verifiedArtifacts.has(c.html.file)) throw Error('Saved HTML was not independently verified');
    if (!c.pdf?.passed || c.pdf.pageCount < 1 || c.pdf.pages?.length !== c.pdf.pageCount || !verifiedArtifacts.has(c.pdf.file)
      || !c.pdf.pages.every(p => p.passed && verifiedArtifacts.has(p.file)) || !verifiedArtifacts.has(c.pdf.inspection)) throw Error('Missing PDF page verification');
  }
  return { receipt, checks: Object.fromEntries(gates.map(g => [g, { outcome: 'passed', checkedAt: receipt.completedAt,
    evidence: { type: 'ci-rendered-export-verification', commit: receipt.commit, tree: receipt.tree, runId: receipt.runId,
      reportFingerprint: expected.fingerprint, artifactDirectory: directory, cases: cases.length,
      visualReview: 'Automated geometry/text checks and retained page images; human visual inspection recorded separately.' } }])) };
}
if (require.main === module) {
  try { const args = process.argv.slice(2); console.log(JSON.stringify(args[0] === 'target' ? target() : verify(args[0]), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { target, verify, hash, gates };
