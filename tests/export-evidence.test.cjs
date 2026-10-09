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
      ...(r.invalid?{exportsBlocked:true}:{html:{file:'fixture.txt',offlineReopened:true,complete:true,networkRequestsBlocked:true},pdf:{passed:true,file:'fixture.txt',inspection:'fixture.txt',pageCount:1,pages:[{file:'fixture.txt',passed:true}]}})})))};
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
test('publisher provenance requires the successful rendered-export CI step',async()=>{
  const {REQUIRED_STEPS}=await import('../worker/publication-core.mjs'); assert(REQUIRED_STEPS.includes('node tools/export-verification/verify.mjs'));
});
