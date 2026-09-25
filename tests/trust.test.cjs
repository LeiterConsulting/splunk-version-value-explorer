const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const read=f=>fs.readFileSync(f,'utf8');
test('source verification never masquerades as claim verification; scope and escaping are retained',()=>{
 const c={window:{VersionCompassSources:{sources:[{url:'https://example.com',title:'Source',reviewed:'2026-09-25',status:'Reviewed',section:'Compatibility table',verificationScope:'Only ES 8.7 on Enterprise 10.4'}]}}};
 vm.runInNewContext(read('dist/evidence.js'),c);
 const h=c.window.VersionCompassEvidence.html({claim:'<img onerror=x>',scope:'Cloud',urls:['https://example.com']});
 assert(h.includes('&lt;img'));assert(!h.includes('<img'));assert(h.includes('Claim last verified:</strong> Not separately recorded'));assert(h.includes('Source last verified:</strong> 2026-09-25'));assert(h.includes('Only ES 8.7'));assert(h.includes('source_search='));
});
test('10.4 route table requires intermediate steps from 9.3 and 9.4',()=>{
 const c={window:{}};vm.runInNewContext(read('dist/data.js'),c);const edges=c.window.SPLUNK_DATA.enterprise.edges;
 assert(!edges['9.3'].includes('10.2'));assert(!edges['9.4'].includes('10.4'));
 assert(edges['9.3'].includes('10.0'));assert(edges['9.4'].includes('10.2'));assert(edges['10.0'].includes('10.4'));assert(edges['10.2'].includes('10.4'));
});
test('maintenance requires an attempt, retains failed outcomes, and advances success only after completion',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'maintenance-'));
 try{
  fs.mkdirSync(path.join(dir,'dist'));fs.mkdirSync(path.join(dir,'scripts'));
  fs.copyFileSync('scripts/record-maintenance.cjs',path.join(dir,'scripts/record-maintenance.cjs'));
  fs.writeFileSync(path.join(dir,'dist/maintenance-status.js'),'window.VersionCompassMaintenance='+JSON.stringify({watches:[{id:'test',outcome:'not-recorded',lastSuccess:null,history:[]}]}));
  const run=(outcome,at)=>cp.execFileSync(process.execPath,['scripts/record-maintenance.cjs'],{cwd:dir,input:JSON.stringify({watch:'test',outcome,at,scope:'Three named sources only',summary:'Test event'}),stdio:['pipe','pipe','pipe']});
  assert.throws(()=>run('no-change','2026-09-25T20:00:00Z'));
  run('running','2026-09-25T20:00:00Z');run('failed','2026-09-25T20:01:00Z');
  const state=()=>{const c={window:{}};vm.runInNewContext(read(path.join(dir,'dist/maintenance-status.js')),c);return c.window.VersionCompassMaintenance.watches[0];};
  assert.equal(state().lastSuccess,null);assert.equal(state().outcome,'failed');
  run('running','2026-09-25T21:00:00Z');run('no-change','2026-09-25T21:01:00Z');
  assert.equal(state().lastSuccess,'2026-09-25T21:01:00Z');assert.equal(state().history.length,4);
  assert.throws(()=>run('running','2026-09-25T19:00:00Z'));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('site publication language is distinct from source verification',()=>{
 assert(read('dist/index.html').includes('Site updated September'));
 assert(!read('dist/index.html').includes('Source-backed guidance reviewed'));
 assert(read('dist/webmcp.js').includes('siteUpdatedDate'));
});
