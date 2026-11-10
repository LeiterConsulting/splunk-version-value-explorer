'use strict';
// Synthetic local Git object histories only. Never contacts a remote.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync,spawn}=require('node:child_process');
function setup(t,inherited=process.env){
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'vc-synthetic-cas-'));
 t.after(()=>fs.rmSync(temporary,{recursive:true,force:true}));
 const dir=path.join(temporary,'repo'),template=path.join(temporary,'empty-template'),hooks=path.join(temporary,'empty-hooks');
 for(const p of [dir,template,hooks])fs.mkdirSync(p);
 const env=Object.fromEntries(Object.entries(inherited).filter(([key])=>!/^GIT_/i.test(key)));
 Object.assign(env,{GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_AUTHOR_NAME:'Synthetic Test',GIT_AUTHOR_EMAIL:'synthetic@example.invalid',GIT_COMMITTER_NAME:'Synthetic Test',GIT_COMMITTER_EMAIL:'synthetic@example.invalid'});
 const prefix=['-C',dir,'-c','core.hooksPath='+hooks];
 const git=(args,input)=>execFileSync('git',[...prefix,...args],{env,input,encoding:'utf8',timeout:5000,killSignal:'SIGKILL',maxBuffer:1048576}).trim();
 git(['init','--bare','--quiet','--template='+template]);
 const tree=git(['mktree'],'');const commit=(label,parent)=>git(['commit-tree',tree,...(parent?['-p',parent]:[])],label);
 const root=commit('synthetic root'),ref='refs/heads/synthetic-claim';git(['update-ref',ref,root]);
 return {dir,env,prefix,git,root,ref,commit};
}
function update(s,next,old){return new Promise((resolve,reject)=>{
 const p=spawn('git',[...s.prefix,'update-ref',s.ref,next,old],{env:s.env,timeout:5000,killSignal:'SIGKILL'});
 let stderr='';p.stderr.on('data',x=>{stderr+=x;if(stderr.length>1048576){p.kill('SIGKILL');reject(Error('excessive Git output'));}});
 p.on('error',reject);p.on('close',(code,signal)=>{if(signal||code===null)reject(Error('Git interrupted or timed out: '+signal));else resolve({code,stderr});});
});}
test('real local sibling CAS race has one winner, recognizable loser and exact readback',async t=>{const s=setup(t),a=s.commit('synthetic A',s.root),b=s.commit('synthetic B',s.root);const r=await Promise.all([update(s,a,s.root),update(s,b,s.root)]);assert.equal(r.filter(x=>x.code===0).length,1);const loser=r.find(x=>x.code!==0);assert.match(loser.stderr,/cannot lock ref/);assert.match(loser.stderr,/is at .* but expected|File exists/);const winner=r[0].code===0?a:b;assert.equal(s.git(['rev-parse',s.ref]),winner);assert.equal(s.git(['rev-parse',winner+'^']),s.root);});
test('delayed loser after settled winner fails expected-old, not transient lock',async t=>{const s=setup(t),a=s.commit('synthetic A',s.root),b=s.commit('synthetic delayed B',s.root);assert.equal((await update(s,a,s.root)).code,0);const settled=s.commit('synthetic settled',a);assert.equal((await update(s,settled,a)).code,0);const late=await update(s,b,s.root);assert.notEqual(late.code,0);assert.match(late.stderr,/is at .* but expected/);assert.equal(s.git(['rev-parse',s.ref]),settled);});
test('lost local acknowledgement is observation only, not authorization to retry',async t=>{const s=setup(t),next=s.commit('synthetic pending outcome',s.root);// Deliberately discard the completed update acknowledgement; readback alone does not clear planner uncertainty.
await update(s,next,s.root);assert.equal(s.git(['rev-parse',s.ref]),next);const stale=await update(s,s.commit('synthetic forbidden retry',s.root),s.root);assert.notEqual(stale.code,0);assert.match(stale.stderr,/is at .* but expected/);
const {planPublication}=require('../scripts/lib/coordination-planner.cjs');
const now='2030-01-01T12:00:00Z';const facts={configurationMatched:true,exactAttemptMatched:true,requiredScopeAssessed:true,preReleaseChecksPassed:true,mainAndIntegrationCurrent:true,artifactEvidenceMatched:true,siteBaselineMatched:true,budgetReservationValid:true,wrongOrDuplicateReport:false,nativeFailed:false,pendingOrUncertainWrite:true,claimBusy:false,observedAt:now,mode:'handoff',ownTerminalReportMatched:true,actualProducerStillRunning:false,invocationOwnerVerified:false};
const held=planPublication(facts,{now,maxAgeMs:1000});assert.equal(held.eligible,false);assert(held.issues.includes('hold:pendingOrUncertainWrite'));assert.equal(held.claimOwnership,'unverified');
});
test('poisoned inherited Git environment cannot redirect writes or install hooks',async t=>{
 const victim=setup(t);
 const index=path.join(victim.dir,'poison-index');fs.writeFileSync(index,'sentinel');
 const poisonTemplate=path.join(victim.dir,'poison-template');fs.mkdirSync(poisonTemplate);
 fs.writeFileSync(path.join(poisonTemplate,'must-not-copy'),'sentinel');
 const snapshot=dir=>{const out={};function walk(p){for(const e of fs.readdirSync(p,{withFileTypes:true})){const f=path.join(p,e.name);if(e.isDirectory())walk(f);else out[path.relative(dir,f)]=fs.readFileSync(f).toString('hex');}}walk(dir);return out;};
 const before=snapshot(victim.dir);
 const target=setup(t,{...process.env,GIT_DIR:victim.dir,GIT_COMMON_DIR:victim.dir,GIT_WORK_TREE:victim.dir,GIT_INDEX_FILE:index,GIT_OBJECT_DIRECTORY:path.join(victim.dir,'objects'),GIT_ALTERNATE_OBJECT_DIRECTORIES:path.join(victim.dir,'objects'),GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'core.hooksPath',GIT_CONFIG_VALUE_0:poisonTemplate,GIT_TEMPLATE_DIR:poisonTemplate,GIT_CONFIG_SYSTEM: index});
 const next=target.commit('synthetic isolated change',target.root);assert.equal((await update(target,next,target.root)).code,0);
 assert.equal(target.git(['rev-parse',target.ref]),next);assert.deepEqual(snapshot(victim.dir),before);
 assert.equal(fs.existsSync(path.join(target.dir,'must-not-copy')),false);
 for(const key of ['GIT_DIR','GIT_WORK_TREE','GIT_INDEX_FILE','GIT_OBJECT_DIRECTORY','GIT_CONFIG_COUNT','GIT_TEMPLATE_DIR'])assert.equal(Object.hasOwn(target.env,key),false);
});
