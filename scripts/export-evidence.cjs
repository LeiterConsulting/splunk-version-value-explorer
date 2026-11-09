/* Verify downloaded CI artifacts against the current report inputs, not the date. */
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const gates = ['html-reopen', 'pdf-rendering', 'themes-and-narrow-screens'];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function target(root = process.cwd()) {
  const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).trim().split('\n')
    .filter(f => /^(dist\/(?:ripple\/)?[^/]+\.(?:html|js|css|json|svg)|client\/.*\.js|worker\/.*\.mjs|content\/(?:advisor-(?:admission|goals)\.json|datasets\/.*\.json|publication\.json)|tools\/export-verification\/[^/]+\.(?:mjs|py|json)|tools\/advisor-workflow\/(?:[^/]+\.(?:cjs|js|css|html|json)|shared\/[^/]+\.json|scripts\/[^/]+\.cjs)|tools\/ripple\/.*\.(?:tsx|ts|css|html|json|svg)|scripts\/(?:export-evidence|sync-advisor|advisor-maintenance|build-advisor-workflow-candidate|build-ripple|check-ripple)\.cjs)$/.test(f)).sort();
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
    const route = routes.find(r => c.id === r.id + '-default' || c.id === r.id + '-cisco');
    const invalid = route?.invalid || route?.exportsBlocked;
    if (!c.narrow?.passed || !verifiedArtifacts.has(c.screen) || !verifiedArtifacts.has(c.narrow.file)) throw Error('Missing rendered viewport evidence');
    if (invalid) { if (c.exportsBlocked !== true) throw Error('Invalid route exports were not blocked (including deliberate non-reporting views)'); continue; }
    if (!c.html?.offlineReopened || !c.html.complete || !c.html.networkRequestsBlocked || !verifiedArtifacts.has(c.html.file)) throw Error('Saved HTML was not independently verified');
    if (!c.pdf?.passed || c.pdf.pageCount < 1 || c.pdf.pages?.length !== c.pdf.pageCount || !verifiedArtifacts.has(c.pdf.file)
      || !c.pdf.pages.every(p => p.passed && verifiedArtifacts.has(p.file)) || !verifiedArtifacts.has(c.pdf.inspection)) throw Error('Missing PDF page verification');
    if (route.id.startsWith('advisor')) {
      const coverage=c.advisorPaginationCoverage;
      if (!coverage?.passed || coverage.sections!==4 || !Number.isInteger(coverage.pairs) || coverage.pairs<5
        || c.pdf.pagination?.length!==coverage.pairs || !c.pdf.pagination.every(p=>p.passed)
        || !c.paginationRegression?.passed || !verifiedArtifacts.has(c.paginationRegression.oldNativePdf)) throw Error('Missing Advisor pagination verification');
      if (route.id==='advisor-agent-known') {
        const stress=c.advisorOversized;
        if (!stress?.passed || !stress.complete || !stress.firstPageHasContent || stress.syntheticUnits!==2 || stress.syntheticParagraphs!==96 || stress.endMarkers!==2
          || !stress.printThemeParity?.passed || stress.pageCount<3 || stress.pages?.length!==stress.pageCount
          || !stress.pages.every(p=>p.passed&&verifiedArtifacts.has(p.file)) || !verifiedArtifacts.has(stress.file) || !verifiedArtifacts.has(stress.inspection)) throw Error('Missing oversized Advisor fragmentation verification');
      }
    }
  }
  const workflow=receipt.requirementWorkflow;
  const workflowCases=['light','dark','cisco'].flatMap(t=>[320,390,1220].map(w=>t+'-'+w));
  if(!workflow?.passed || !workflow.synthetic || workflow.customerAcceptance!==false || !workflow.privacy?.passed
    || workflow.privacy.externalRequests!==0 || !workflow.keyboard?.passed || !workflow.stale?.passed
    || workflow.cases?.length!==9 || !workflowCases.every(id=>workflow.cases.some(c=>c.id===id&&c.passed&&c.layout?.passed&&c.externalRequests===0&&c.keyboard&&c.imports&&verifiedArtifacts.has(c.screen)))) throw Error('Missing requirement workflow viewport, privacy or keyboard verification');
  if(workflow.exports?.length!==3 || !['light','dark','cisco'].every(theme=>workflow.exports.some(e=>e.theme===theme&&e.passed&&verifiedArtifacts.has(e.json)
    && [e.html,e.workspace].every(h=>h?.passed&&h.offlineReopened&&h.networkRequests===0&&h.complete&&verifiedArtifacts.has(h.file))
    && e.pdf?.passed&&e.pdf.pagination?.length>=20&&e.pdf.pagination.every(p=>p.passed)&&e.pdf.pageCount>0&&e.pdf.pages?.length===e.pdf.pageCount&&e.pdf.pages.every(p=>p.passed&&verifiedArtifacts.has(p.file))
    && verifiedArtifacts.has(e.pdf.file)&&verifiedArtifacts.has(e.pdf.inspection)))) throw Error('Missing requirement workflow PDF/offline verification');
  const cmp=workflow.cmpReport;
  if(!cmp?.passed||!cmp.wholePathNeedsReview||!cmp.independentMinima||!cmp.completeReport||!cmp.citationsResolved||!cmp.sourceDatesRetained||cmp.externalRequests!==0||!verifiedArtifacts.has(cmp.screen)
    ||![cmp.html,cmp.workspace].every(h=>h?.passed&&h.offlineReopened&&h.networkRequests===0&&h.complete&&verifiedArtifacts.has(h.file))
    ||!cmp.pdf?.passed||cmp.pdf.pageCount<1||cmp.pdf.pages?.length!==cmp.pdf.pageCount||!cmp.pdf.pages.every(p=>p.passed&&verifiedArtifacts.has(p.file))||!verifiedArtifacts.has(cmp.pdf.file)||!verifiedArtifacts.has(cmp.pdf.inspection))throw Error('Missing requirement workflow whole-CMP report verification');
  const integrated=receipt.workflowIntegration;
  if(!integrated?.passed||!integrated.synthetic||integrated.customerAcceptance!==false||integrated.externalRequests!==0
    ||!integrated.hostScope?.passed||integrated.hostScope.cases?.length!==5||!['claim','environment','missing-scope','withdrawal','missing-source'].every(change=>integrated.hostScope.cases.some(c=>c.change===change&&c.passed&&verifiedArtifacts.has(c.screen)))
    ||!integrated.hostScope.unrelated?.passed||!integrated.hostScope.unavailable?.passed||!integrated.hostScope.unavailable.nativeBlocked||!integrated.hostScope.unavailable.explicitSnapshotChoice||!verifiedArtifacts.has(integrated.hostScope.unavailable.screen)
    ||!integrated.hostScope.validatedWithdrawal?.passed||!integrated.hostScope.validatedWithdrawal.hostEvidenceRetained||!integrated.hostScope.validatedWithdrawal.nativeBlocked||!verifiedArtifacts.has(integrated.hostScope.validatedWithdrawal.fixture)||!verifiedArtifacts.has(integrated.hostScope.validatedWithdrawal.screen)
    ||integrated.cases?.length!==9||!workflowCases.every(id=>integrated.cases.some(c=>c.id===id&&c.passed&&c.nativeRoute&&c.blankDefault&&c.legacyIntent&&c.profileRecovery&&c.history&&c.citationHistory&&c.guideHandoff&&c.guideReturn&&c.editorHistory?.passed&&c.editorHistory.noCrossDraftText&&c.editorHistory.staleDetachedSaveBlocked&&c.editorHistory.twoHeldEditors&&c.layout?.passed&&c.externalRequests===0&&verifiedArtifacts.has(c.screen)))
    ||integrated.exports?.length!==3||!['light','dark','cisco'].every(theme=>integrated.exports.some(e=>e.theme===theme&&e.passed
      &&[e.html,e.workspace].every(h=>h?.passed&&h.complete&&h.offlineReopened&&h.externalRequests===0&&verifiedArtifacts.has(h.file))
      &&e.pdf?.passed&&e.pdf.pageCount>0&&e.pdf.pages?.length===e.pdf.pageCount&&e.pdf.pages.every(p=>p.passed&&verifiedArtifacts.has(p.file))&&verifiedArtifacts.has(e.pdf.file)&&verifiedArtifacts.has(e.pdf.inspection))))throw Error('Missing integrated Advisor route, recovery, history or offline/PDF verification');
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
