/* Explicit local-only emulator experiment; requires pinned Miniflare installed separately. */
const {Miniflare}=require('miniflare'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{pathToFileURL}=require('node:url');

const intent={kind:'intent',operationId:'op-1',releaseId:'release-1',target:{projectId:'project',versionId:'version',sourceCommit:'a'.repeat(40),archiveSha256:'b'.repeat(64),environmentRevision:12,controls:{VC_ACTIVE_DELIVERY:'0',VC_PUBLISHER_ACTIVATION:'0',VC_PUBLISHER_OIDC:'1'}},beforeDeploymentId:'old'};
(async()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'vc-d1-reference-')),cwd=process.cwd();process.chdir(dir);for(const file of ['portable-replay.mjs','d1-journal.mjs'])fs.copyFileSync(path.join(__dirname,file),path.join(dir,file));const make=()=>new Miniflare({rootPath:dir,modules:true,scriptPath:path.join(dir,'local-test-entry.mjs'),script:'import {replayPortable} from "./portable-replay.mjs"; import {appendD1Journal} from "./d1-journal.mjs"; export default {async fetch(request,env){const input=await request.json();return Response.json(Array.isArray(input)?await replayPortable(input):await appendD1Journal({...input,db:env.DB}))}}',compatibilityDate:'2026-06-01',d1Databases:{DB:'local-reference'},d1Persist:dir});let mf=make();let passed=0;
 try{const {appendD1Journal:append,readD1Journal:read}=await import(pathToFileURL(path.join(__dirname,'d1-journal.mjs')));let db=await mf.getD1Database('DB');await db.prepare(fs.readFileSync(path.join(__dirname,'d1-journal-reference.sql'),'utf8')).run();let ctx={db,project:'project'};
 const race=await Promise.allSettled([append({...ctx,event:intent,expectedTail:null}),append({...ctx,event:intent,expectedTail:null})]);assert.equal(race.filter(r=>r.status==='fulfilled').length,1);passed++;
 const snapshot=await read(ctx);const native=await mf.dispatchFetch('http://localhost/',{method:'POST',body:JSON.stringify(snapshot.records)});assert.equal(native.status,200);assert.deepEqual(await native.json(),snapshot.state);passed++;
 const workerIntent={...intent,target:{...intent.target,projectId:'worker'}};const nativeWrite=await mf.dispatchFetch('http://localhost/',{method:'POST',body:JSON.stringify({project:'worker',event:workerIntent,expectedTail:null})});assert.equal(nativeWrite.status,200);assert.equal((await nativeWrite.json()).state.status,'intent-recorded');assert.equal((await read({db,project:'worker'})).state.sequence,1);passed++;
 let state=snapshot.state;assert.equal(state.sequence,1);assert.equal(state.pending.operationId,'op-1');passed++;
 await assert.rejects(()=>append({...ctx,event:{...intent,target:{...intent.target,projectId:'other'}},expectedTail:state.tail}),/project-target-mismatch/);passed++;
 await assert.rejects(()=>append({...ctx,event:{...intent,operationId:'op-2'},expectedTail:null}),/tail-moved/);passed++;
 await append({...ctx,event:{kind:'result',operationId:'op-1',status:'denied',deploymentId:null},expectedTail:state.tail});
 state=(await read(ctx)).state;assert.equal(state.status,'denied-terminal');await assert.rejects(()=>append({...ctx,event:{...intent,operationId:'op-2'},expectedTail:state.tail}),/intent-blocked/);passed++;
 await mf.dispose();mf=make();db=await mf.getD1Database('DB');ctx={...ctx,db};assert.equal((await read(ctx)).state.status,'denied-terminal');passed++;
 // Simulate remote commit followed by transport response loss. The actual D1
 // statement commits first; the injected boundary throws instead of returning.
 const lostDb={withSession(){const s=db.withSession('first-primary');return {prepare(sql){const p=s.prepare(sql);return {bind(...v){const b=p.bind(...v);return {all:()=>b.all(),run:async()=>{await b.run();throw Error('lost response')}}}}}}}};
 const other={...intent,target:{...intent.target,projectId:'lost'}};await assert.rejects(()=>append({db:lostDb,project:'lost',event:other,expectedTail:null}),/outcome-unknown/);
 assert.equal((await read({db,project:'lost'})).state.sequence,1);await assert.rejects(()=>append({db,project:'lost',event:other,expectedTail:null}),/tail-moved/);passed++;
 await db.prepare("UPDATE release_journal_reference SET event_hash='tampered' WHERE project_id='lost'").run();await assert.rejects(()=>read({db,project:'lost'}),/chain-mismatch/);passed++;
 console.log(JSON.stringify({kind:'local-miniflare-adapter-qualification',passed,productionD1Verified:false,authenticationVerified:false,remoteFencing:false,productionActionAllowed:false},null,2));
 }finally{await mf.dispose();process.chdir(cwd);fs.rmSync(dir,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exitCode=1});
