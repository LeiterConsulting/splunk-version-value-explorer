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
  fs.copyFileSync('docs/forwarder-source-mappings.json',path.join(dir,'docs/forwarder-source-mappings.json'));
  for(const f of ['data.js','product-data.js','guidance-data.js','environment-data.js','editions-data.js','forwarders-data.js','soar-data.js','source-register.js'])fs.copyFileSync('dist/'+f,path.join(dir,'dist',f));
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
test('actual UF/HF routes retain sources for steps, receivers, topology and borrowed technical/runtime records',()=>{
 const c={window:{},URLSearchParams};vm.createContext(c);
 for(const f of ['data.js','product-data.js','comparison.js','forwarders-data.js','forwarders.js','source-register.js'])vm.runInContext(fs.readFileSync('dist/'+f,'utf8'),c);
 const api=c.window.VersionCompassForwarders,data=c.window.VersionCompassForwarderData,register=c.window.VersionCompassSources;
 const mappings=JSON.parse(fs.readFileSync('docs/forwarder-source-mappings.json','utf8')).claims;
 assert.equal(new Set(mappings.map(x=>x.claimId)).size,mappings.length);
 const seen=new Set();let routes=0;
 function verifyBorrowed(record,rows=register.sources){
  const release=record.release||record.milestone?.replace(/^Enterprise /,'');
  const mapping=mappings.find(m=>m.release===release&&m.component===record.component);
  assert(mapping,'Missing borrowed HF mapping: '+release+' / '+record.component);
  assert.equal(mapping.url,record.source);
  const row=rows.find(r=>r.url===record.source);
  assert(row?.claimReferences?.some(ref=>ref.claimId===mapping.claimId&&ref.section===mapping.sections.join('; ')&&ref.claimVerified===mapping.claimVerificationDate),'Missing exact borrowed section: '+mapping.claimId);
  seen.add(mapping.claimId);
 }
 for(const type of ['uf','hf'])for(const from of data.releases)for(const to of data.releases){
  if(data.releases.indexOf(from)>=data.releases.indexOf(to))continue;
  for(const destination of api.options.destination)for(const topology of api.options.topology)for(const os of ['unspecified','Ubuntu 24.04','Windows Server 2022']){
   const result=api.assess({...api.defaults,type,from,to,destination,topology,os,receiver:to,cloudReceiver:to});
   assert.equal(result.errors.length,0);routes++;
   for(const claim of [...result.steps,...result.claims,result.os,...result.features,...result.risks,result.security]){
    if(!claim.source)continue;
    const source=data.sources[claim.source];assert(source?.url,'Missing actual route source '+claim.source);
    assert(source.section,'Missing actual route section '+claim.source);
    assert(register.sources.find(r=>r.url===source.url)?.claimReferences?.some(ref=>ref.section===source.section),'Missing consumed catalog section '+claim.source);
   }
   for(const record of [...result.technical,...result.targetRuntime])verifyBorrowed(record);
   if(type==='uf'){assert.equal(result.technical.length,0);assert.equal(result.targetRuntime.length,0);}
  }
 }
 assert.equal(routes,900);assert.equal(seen.size,16);assert.equal(seen.size,mappings.length);
 // A dropped inherited runtime reference must fail even though all declared catalog claims remain.
 const inherited=api.assess({...api.defaults,type:'hf',from:'10.4',to:'10.6'}).targetRuntime.find(t=>t.release==='10.0');
 const damaged=JSON.parse(JSON.stringify(register.sources));
 const id=mappings.find(m=>m.release===inherited.release&&m.component===inherited.component).claimId;
 damaged.find(r=>r.url===inherited.source).claimReferences=damaged.find(r=>r.url===inherited.source).claimReferences.filter(ref=>ref.claimId!==id);
 assert.throws(()=>verifyBorrowed(inherited,damaged),/Missing exact borrowed section/);
});
test('every declared Forwarder claim retains an exact source and section mapping',()=>{
 const c={window:{}};vm.createContext(c);
 for(const f of ['data.js','product-data.js','guidance-data.js','environment-data.js','editions-data.js','forwarders-data.js','soar-data.js','source-register.js'])vm.runInContext(fs.readFileSync('dist/'+f,'utf8'),c);
 const data=c.window.VersionCompassForwarderData,register=c.window.VersionCompassSources;
 for(const [claimId,claim] of Object.entries(data.claimSources)){
  const ids=claim.sources||[claim.src];
  assert(ids.length,claimId+' has no source');
  for(const id of ids){
   const source=data.sources[id];
   assert(source?.url,claimId+' has an unknown source '+id);
   assert(source.section,claimId+' source '+id+' has no supporting section');
   const row=register.sources.find(r=>r.url===source.url);
   assert(row,claimId+' source missing from register');
   assert(row.claimReferences?.some(ref=>ref.path==='forwarders: forwarders.claimSources.'+claimId&&ref.section===source.section),claimId+' lost its exact source-to-claim section mapping');
  }
 }
 for(const required of ['upgrade.uf.10.0','upgrade.uf.10.6','upgrade.hf','receiver.enterprise','receiver.cloud','topology.enterprise-intermediate','topology.cloud-intermediate','package.os-architecture-10.6','technical.hf-kv-store-10.6','technical.hf-tls-10.6'])assert(data.claimSources[required]);
});
