const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
function read(file){const c={window:{}};vm.runInNewContext(fs.readFileSync(file,'utf8'),c);return c.window.VersionCompassSources;}
test('source register is synchronized, unique, and never infers dates from publication',()=>{
 cp.execFileSync(process.execPath,['scripts/sync-source-register.cjs','--check']);
 const d=read('dist/source-register.js');
 assert.equal(new Set(d.sources.map(r=>r.url)).size,d.sources.length);
 assert(d.sources.some(r=>r.status==='Needs reconciliation'));
 assert(d.sources.some(r=>r.status==='Review date unknown'));
 for(const r of d.sources){assert(r.references.length);if(r.firstUsed)assert.match(r.firstUsed,/^\d{4}-\d{2}-\d{2}$/);if(r.status==='Reviewed')assert(r.reviewed);}
});
test('source register retains removed sources without declaring them inaccurate; dated findings are explicit',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'source-ledger-'));
 try{
  for(const d of ['scripts','docs','dist'])fs.mkdirSync(path.join(dir,d));
  fs.copyFileSync('scripts/sync-source-register.cjs',path.join(dir,'scripts/sync-source-register.cjs'));
  for(const f of ['data.js','product-data.js','guidance-data.js','environment-data.js','editions-data.js','source-register.js'])fs.copyFileSync('dist/'+f,path.join(dir,'dist',f));
  const url='https://example.com/historical-source';
  const d=read('dist/source-register.js');d.sources.push({url,title:'Old source',areas:['Release guide'],references:['release.old'],reviews:[],status:'Review date unknown',reviewed:null,usage:'In use',firstRecorded:'2026-09-01',firstUsed:null,events:[]});
  fs.writeFileSync(path.join(dir,'dist/source-register.js'),'window.VersionCompassSources='+JSON.stringify(d));
  const active=d.sources.find(r=>r.usage==='In use').url;
  fs.writeFileSync(path.join(dir,'docs/source-annotations.json'),JSON.stringify({[active]:{outdatedAsOf:'2026-09-25',reason:'Verified replacement document'}}));
  cp.execFileSync(process.execPath,['scripts/sync-source-register.cjs'],{cwd:dir,env:{...process.env,SOURCE_REGISTER_DATE:'2026-09-25'}});
  const result=read(path.join(dir,'dist/source-register.js'));
  assert.equal(result.sources.find(r=>r.url===url).usage,'Retired');
  assert.equal(result.sources.find(r=>r.url===url).status,'Review date unknown');
  assert.equal(result.sources.find(r=>r.url===active).status,'Out of date');
  assert.equal(result.sources.find(r=>r.url===active).outdatedAsOf,'2026-09-25');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
