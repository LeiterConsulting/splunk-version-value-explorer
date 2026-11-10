'use strict';
// Opt-in GET observation only; supplied transport is not an authentication boundary.
const crypto = require('node:crypto');
const fs = require('node:fs');
const {TextDecoder} = require('node:util');
const {validateRecord} = require('./coordination-planner.cjs');
const ORIGIN='https://api.github.com/repos/LeiterConsulting/splunk-version-value-explorer';
const PIN=fs.readFileSync(require.resolve('../../schemas/coordination-v1.json'));
const SHA=/^[a-f0-9]{40}$/;
const refs=new Set(['main','coordination/offline-planner-20261110','coordination/versioncompass-writer']);
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const assert=(ok,msg)=>{if(!ok){const error=Error(msg);error.observationReason=msg;throw error;}};
const objectHash=(kind,bytes)=>crypto.createHash('sha1').update(Buffer.from(`${kind} ${bytes.length}\0`)).update(bytes).digest('hex');
function treeHash(entries){
 const sorted=[...entries].sort((a,b)=>Buffer.compare(Buffer.from(a.path+(a.type==='tree'?'/':'')),Buffer.from(b.path+(b.type==='tree'?'/':''))));
 return objectHash('tree',Buffer.concat(sorted.map(e=>Buffer.concat([Buffer.from(`${e.mode.replace(/^0/,'')} ${e.path}\0`),Buffer.from(e.sha,'hex')]))));
}
function blob(value,expected,limit){
 assert(plain(value)&&value.sha===expected&&value.encoding==='base64'&&typeof value.content==='string','invalid-blob');
 const compact=value.content.replace(/\n/g,'');
 assert(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(compact),'invalid-base64');
 const bytes=Buffer.from(compact,'base64');
 assert(bytes.toString('base64')===compact&&bytes.length<=limit&&value.size===bytes.length,'blob-size-or-encoding');
 assert(objectHash('blob',bytes)===expected,'blob-hash-mismatch');
 return {bytes,text:new TextDecoder('utf-8',{fatal:true}).decode(bytes)};
}
async function observeRevision(request, dependencies){
 const base={mode:'read-only-observation',transportOrigin:'unverified',commitAuthenticity:'transport-observed-only',authority:'unverified',claimOwnership:'unverified',nativeCompletion:'unverified',claimedDelivered:false};
 let reads=0;
 const deadline=Date.now()+30000;
 try{
  assert(plain(request)&&Object.keys(request).every(k=>['ref','expectedCommit','expectedTree','expectedParent','profile'].includes(k)),'invalid-request');
  assert(refs.has(request.ref)&&SHA.test(request.expectedCommit)&&SHA.test(request.expectedTree)&&SHA.test(request.expectedParent),'invalid-binding');
  assert(['source-identity','claim-state'].includes(request.profile),'invalid-profile');
  assert((request.profile==='claim-state')===(request.ref==='coordination/versioncompass-writer'),'profile-ref-mismatch');
  assert(plain(dependencies)&&typeof dependencies.readJson==='function'&&typeof dependencies.now==='function','invalid-dependencies');
  const normalized=Object.hasOwn(dependencies,'readBlobText');
  assert(!normalized||typeof dependencies.readBlobText==='function','invalid-blob-text-callback');
  const limit=dependencies.maxBytes;
  assert(Number.isSafeInteger(limit)&&limit>=1024&&limit<=1048576,'invalid-byte-limit');
  const start=dependencies.now();
  const time=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
  assert(time(start),'invalid-clock');
  async function get(path,asText=false){
   assert(++reads<=6,'read-bound');
   let value;
   let timer;
   try {
    const remaining=deadline-Date.now();assert(remaining>0,'observation-timeout');
    value=await Promise.race([(asText?dependencies.readBlobText:dependencies.readJson)(ORIGIN+path),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),remaining);})]);
   } catch { assert(false,'transport-unavailable'); } finally { clearTimeout(timer); }
   if(asText) assert(typeof value==='string'&&value.length<=limit&&Buffer.byteLength(value,'utf8')<=limit,'invalid-or-oversized-blob-text');
   else assert(plain(value)&&Buffer.byteLength(JSON.stringify(value))<=limit,'invalid-or-oversized-response');
   return value;
  }
  const refPath='/git/ref/heads/'+request.ref.split('/').map(encodeURIComponent).join('/');
  function checkRef(v){assert(v.ref==='refs/heads/'+request.ref&&plain(v.object)&&v.object.type==='commit'&&v.object.sha===request.expectedCommit,'ref-moved-or-mismatched');}
  checkRef(await get(refPath));
  const commit=await get('/git/commits/'+request.expectedCommit);
  assert(commit.sha===request.expectedCommit&&plain(commit.tree)&&commit.tree.sha===request.expectedTree&&Array.isArray(commit.parents)&&commit.parents.length>=1&&commit.parents.length<=2&&Array.from(commit.parents).every(p=>plain(p)&&SHA.test(p.sha))&&commit.parents[0].sha===request.expectedParent,'commit-binding-mismatch');
  if(request.profile==='claim-state')assert(commit.parents.length===1,'claim-parent-mismatch');
  const tree=await get('/git/trees/'+request.expectedTree);
  assert(tree.sha===request.expectedTree&&tree.truncated===false&&Array.isArray(tree.tree)&&tree.tree.length>0&&tree.tree.length<=200,'invalid-tree');
  const paths=new Set();
  for(const e of tree.tree){
   assert(plain(e)&&typeof e.path==='string'&&/^[A-Za-z0-9_.-]+$/.test(e.path)&&!['.','..'].includes(e.path)&&!paths.has(e.path)&&SHA.test(e.sha),'invalid-tree-entry');paths.add(e.path);
   assert((e.type==='blob'&&e.mode==='100644')||(request.profile==='source-identity'&&e.type==='tree'&&e.mode==='040000'),'unexpected-tree-mode');
  }
  assert(treeHash(tree.tree)===request.expectedTree,'tree-hash-mismatch');
  const names=request.profile==='claim-state'?['schema.json','state.json']:['AGENTS.md','package.json'];
  if(request.profile==='claim-state')assert(tree.tree.length===2&&names.every(n=>paths.has(n)),'unexpected-claim-paths');
  const entries=names.map(n=>{const e=tree.tree.find(e=>e.path===n);assert(e&&e.type==='blob'&&e.mode==='100644','missing-evidence-blob');return e;});
  async function readBlob(entry){
   const value=await get('/git/blobs/'+entry.sha,normalized);
   if(!normalized)return blob(value,entry.sha,limit);
   const bytes=Buffer.from(value,'utf8');
   assert(bytes.toString('utf8')===value,'blob-text-unicode-roundtrip');
   assert(objectHash('blob',bytes)===entry.sha,'blob-text-hash-mismatch');
   return {bytes,text:value};
  }
  const first=await readBlob(entries[0]);
  const second=await readBlob(entries[1]);
  let state;
  if(request.profile==='claim-state'){
   assert(first.bytes.equals(PIN),'reviewed-schema-mismatch');
   state=JSON.parse(second.text);
   assert(second.text===JSON.stringify(state)+'\n','noncanonical-state-json');
   assert(state.previousCommit===request.expectedParent,'state-parent-mismatch');
  }
  checkRef(await get(refPath));
  const end=dependencies.now();
  assert(time(end)&&Date.parse(end)>=Date.parse(start)&&Date.parse(end)-Date.parse(start)<=30000,'observation-window-invalid');
  if(state){const validation=validateRecord(state,{now:end,maxAgeMs:30000});assert(validation.valid,'state-invalid:'+validation.issues.join(','));}
  return {...base,status:'observed-matching-endpoints',reads,blobRepresentation:normalized?'normalized-utf8-text-hash-verified':'raw-json-base64-hash-verified',profile:request.profile,commit:request.expectedCommit,tree:request.expectedTree,parent:request.expectedParent,observedAt:end,qualification:'Ref matched at both observations only; not a lease, authenticated origin, authorization, native completion or Sites fence.'};
 }catch(error){return {...base,status:'unavailable',reads,reason:error?.observationReason||'invalid-observation'};}
}
module.exports={observeRevision};
