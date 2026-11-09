const { test } = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { target, verify, hash, gates } = require('../scripts/export-evidence.cjs');
const { assess } = require('../scripts/check-soak.cjs');
const policy = JSON.parse(fs.readFileSync('content/soak-policy.json'));
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-export-evidence-')); t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const routes = JSON.parse(fs.readFileSync('tools/export-verification/routes.json'));
  fs.writeFileSync(path.join(dir,'fixture.txt'),'Synthetic integrity fixture, not browser verification');
  const receipt = {schemaVersion:1,outcome:'passed',target:target(),commit:'a'.repeat(40),tree:'b'.repeat(40),completedAt:'2026-10-08T12:00:00Z',
    artifacts:[{file:'fixture.txt',sha256:hash(fs.readFileSync(path.join(dir,'fixture.txt')))}],
    cases:routes.flatMap(r=>['default','cisco'].map(theme=>({id:r.id+'-'+theme,outcome:'passed',screen:'fixture.txt',narrow:{passed:true,file:'fixture.txt'},
      ...(r.invalid||r.exportsBlocked?{exportsBlocked:true}:{html:{file:'fixture.txt',offlineReopened:true,complete:true,networkRequestsBlocked:true},pdf:{passed:true,file:'fixture.txt',inspection:'fixture.txt',pageCount:1,pages:[{file:'fixture.txt',passed:true}]}})})))};
  for(const c of receipt.cases.filter(c=>c.id.startsWith('advisor')&&!c.exportsBlocked)) {
    c.advisorPaginationCoverage={passed:true,sections:4,pairs:5};c.pdf.pagination=Array.from({length:5},()=>({passed:true}));c.paginationRegression={passed:true,oldNativePdf:'fixture.txt'};
    if(c.id.startsWith('advisor-agent-known-'))c.advisorOversized={passed:true,complete:true,firstPageHasContent:true,syntheticUnits:2,syntheticParagraphs:96,endMarkers:2,printThemeParity:{passed:true},pageCount:3,pages:Array.from({length:3},()=>({file:'fixture.txt',passed:true})),file:'fixture.txt',inspection:'fixture.txt'};
  }
  receipt.requirementWorkflow={passed:true,synthetic:true,customerAcceptance:false,privacy:{passed:true,externalRequests:0},keyboard:{passed:true},stale:{passed:true},
   cases:['light','dark','cisco'].flatMap(theme=>[320,390,1220].map(width=>({id:theme+'-'+width,passed:true,screen:'fixture.txt',layout:{passed:true},externalRequests:0,keyboard:true,imports:true}))),
   exports:['light','dark','cisco'].map(theme=>({theme,passed:true,json:'fixture.txt',html:{file:'fixture.txt',passed:true,offlineReopened:true,networkRequests:0,complete:true},workspace:{file:'fixture.txt',passed:true,offlineReopened:true,networkRequests:0,complete:true},pdf:{file:'fixture.txt',inspection:'fixture.txt',passed:true,pagination:Array.from({length:20},()=>({passed:true})),pageCount:1,pages:[{file:'fixture.txt',passed:true}]}}))};
  receipt.requirementWorkflow.cmpReport={passed:true,wholePathNeedsReview:true,independentMinima:true,completeReport:true,citationsResolved:true,sourceDatesRetained:true,externalRequests:0,screen:'fixture.txt',html:receipt.requirementWorkflow.exports[0].html,workspace:receipt.requirementWorkflow.exports[0].workspace,pdf:receipt.requirementWorkflow.exports[0].pdf};
  receipt.workflowIntegration={passed:true,synthetic:true,customerAcceptance:false,externalRequests:0,hostScope:{passed:true,validatedWithdrawal:{passed:true,hostEvidenceRetained:true,nativeBlocked:true,fixture:"fixture.txt",screen:"fixture.txt"},unrelated:{passed:true},unavailable:{passed:true,nativeBlocked:true,explicitSnapshotChoice:true,screen:"fixture.txt"},cases:["claim","environment","missing-scope","withdrawal","missing-source"].map(change=>({change,passed:true,screen:"fixture.txt"}))},cases:receipt.requirementWorkflow.cases.map(c=>({...c,nativeRoute:true,blankDefault:true,legacyIntent:true,profileRecovery:true,history:true,citationHistory:true,guideHandoff:true,guideReturn:true,editorHistory:{passed:true,noCrossDraftText:true,staleDetachedSaveBlocked:true,twoHeldEditors:true}})),exports:receipt.requirementWorkflow.exports.map(e=>({...e,html:{...e.html,externalRequests:0},workspace:{...e.workspace,externalRequests:0}}))};
  const save = ()=>fs.writeFileSync(path.join(dir,'evidence.json'),JSON.stringify(receipt)); save(); return {dir,receipt,save};
}
test('candidate evidence requires complete routes, page renders, offline reopening and intact artifact bytes',t=>{
  const f=fixture(t); assert.deepEqual(Object.keys(verify(f.dir).checks),gates);
  for(const mutate of [r=>r.outcome='failed',r=>r.target.fingerprint='0'.repeat(64),r=>r.cases.pop(),r=>r.cases[0].html.offlineReopened=false,
    r=>r.cases[0].pdf.pageCount=2,r=>r.cases[0].pdf.pages[0].passed=false,r=>r.artifacts[0].file='../escape.txt',r=>r.artifacts[0].sha256='0'.repeat(64)]) {
    const original=JSON.stringify(f.receipt); mutate(f.receipt); f.save(); assert.throws(()=>verify(f.dir)); Object.assign(f.receipt,JSON.parse(original)); f.save();
  }
  fs.writeFileSync(path.join(f.dir,'fixture.txt'),'Changed bytes'); assert.throws(()=>verify(f.dir),/digest mismatch/);
});
test('candidate-bound CI verification can precede deployment; current failures still block',t=>{
  const f=fixture(t), validated=verify(f.dir);
  const input={baseline:{deployedAt:'2026-10-09T12:00:00Z'},evaluatedAt:'2026-10-09T13:00:00Z',checks:Object.fromEntries(policy.requiredGates.map(g=>[g,{outcome:'passed',checkedAt:'2026-10-09T12:30:00Z',evidence:'Actual other check'}]))};
  for(const g of gates)input.checks[g]={outcome:'blocked',checkedAt:'2026-10-09T12:30:00Z',evidence:'Interactive browser capability unavailable'};
  assert.equal(assess(input,policy).status,'hold'); assert.equal(assess(input,policy,validated).status,'eligible-to-advance');
  input.checks['pdf-rendering'].outcome='failed'; assert.equal(assess(input,policy,validated).status,'hold');
});
test('an invalid SOAR route cannot borrow validation from a shorter valid route ID',t=>{
  const f=fixture(t);
  const bad=f.receipt.cases.find(c=>c.id==='soar-invalid-cisco');
  assert(bad);
  assert.doesNotThrow(()=>verify(f.dir));
  bad.exportsBlocked=false;f.save();
  assert.throws(()=>verify(f.dir),/Invalid route exports were not blocked/);
});
test('publisher provenance requires the successful rendered-export CI step',async()=>{
  const {REQUIRED_STEPS}=await import('../worker/publication-core.mjs'); assert(REQUIRED_STEPS.includes('node tools/export-verification/verify.mjs'));
});
test('Advisor evidence cannot omit containment, negative replay or oversized completeness checks',t=>{
 const f=fixture(t);
 for(const mutate of [c=>delete c.advisorPaginationCoverage,c=>c.pdf.pagination.pop(),c=>c.paginationRegression.passed=false,c=>c.advisorOversized.complete=false,c=>c.advisorOversized.pages.pop(),c=>c.advisorOversized.firstPageHasContent=false]) {
  const original=JSON.stringify(f.receipt),c=f.receipt.cases.find(c=>c.id==='advisor-agent-known-cisco');mutate(c);f.save();assert.throws(()=>verify(f.dir),/Advisor/);Object.assign(f.receipt,JSON.parse(original));f.save();
 }
});

test('requirement workflow evidence cannot borrow only legacy route success',t=>{
 const f=fixture(t);
 for(const mutate of [r=>delete r.requirementWorkflow,r=>delete r.requirementWorkflow.cmpReport,r=>r.requirementWorkflow.cmpReport.wholePathNeedsReview=false,r=>r.requirementWorkflow.cases.pop(),r=>r.requirementWorkflow.privacy.externalRequests=1,r=>r.requirementWorkflow.exports[0].workspace.offlineReopened=false,r=>r.requirementWorkflow.exports[0].pdf.pages.pop(),r=>r.requirementWorkflow.exports[0].pdf.pagination=[],r=>r.requirementWorkflow.customerAcceptance=true]){
  const original=JSON.stringify(f.receipt);mutate(f.receipt);f.save();assert.throws(()=>verify(f.dir),/requirement workflow/);Object.assign(f.receipt,JSON.parse(original));f.save();
 }
});

test('integrated route evidence requires blank entry, intent recovery, history and actual offline exports',t=>{const f=fixture(t);for(const mutate of [r=>delete r.workflowIntegration,r=>delete r.workflowIntegration.hostScope,r=>delete r.workflowIntegration.cases[0].editorHistory,r=>r.workflowIntegration.cases[0].editorHistory.noCrossDraftText=false,r=>r.workflowIntegration.hostScope.unrelated.passed=false,r=>delete r.workflowIntegration.hostScope.validatedWithdrawal,r=>r.workflowIntegration.hostScope.unavailable.explicitSnapshotChoice=false,r=>r.workflowIntegration.hostScope.cases.pop(),r=>r.workflowIntegration.cases.pop(),r=>r.workflowIntegration.cases[0].blankDefault=false,r=>r.workflowIntegration.cases[0].profileRecovery=false,r=>r.workflowIntegration.cases[0].history=false,r=>r.workflowIntegration.cases[0].citationHistory=false,r=>r.workflowIntegration.exports[0].workspace.offlineReopened=false,r=>r.workflowIntegration.exports[0].pdf.pages.pop(),r=>r.workflowIntegration.externalRequests=1]){const original=JSON.stringify(f.receipt);mutate(f.receipt);f.save();assert.throws(()=>verify(f.dir),/integrated Advisor/);Object.assign(f.receipt,JSON.parse(original));f.save();}});
