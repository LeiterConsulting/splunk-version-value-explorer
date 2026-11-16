/* INACTIVE trusted-server identity derivation; no DB writes or route import.
 * A signed principal + structural binding does NOT authenticate authority evidence.
 */
'use strict';
const crypto=require('node:crypto');
const {createBinding,compareLive}=require('./release-binding.cjs');
function canonical(x){if(Array.isArray(x))return'['+x.map(canonical).join(',')+']';if(x&&typeof x==='object')return'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';return JSON.stringify(x)}
const digest=x=>crypto.createHash('sha256').update(canonical(x)).digest('hex');
const need=(v,r)=>{if(!v)throw Error(r)};
async function deriveIssuerIntent(token,input,{fetcher,clock=()=>Date.now()}={}){
 const keys=['releaseInput','observedLive','mode'];need(input&&Object.keys(input).sort().join()===keys.sort().join(),'intent-input');
 const binding=createBinding(input.releaseInput);need(binding.schemaVersion===2,'v2-required');
 need(compareLive(binding,input.observedLive).status==='snapshot-matches-review-required','live-drift');
 const head=binding.input.expectedLive.publicationHead;
 need(head.status==='absent'?input.mode==='bootstrap':['publish','rollback'].includes(input.mode),'mode-head');
 const {inspectPublisherRunIdentity}=await import('../../tools/release-coordination/publisher-run-identity.mjs');
 const {readBounded,strictJSON}=await import('../../tools/release-coordination/qualification-artifact.mjs');
 const signal=AbortSignal.timeout(10000),deadline=new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('issuer-deadline')),{once:true}));
 const boundedFetcher=async url=>{need(url==='https://token.actions.githubusercontent.com/.well-known/jwks','issuer-origin');const r=await Promise.race([(fetcher||globalThis.fetch)(url,{redirect:'manual',signal}),deadline]);need(r.status===200&&!r.redirected,'issuer-http');const bytes=await readBounded(r.body,128*1024,signal);strictJSON(bytes);return new Response(bytes)};
 need(typeof token==='string'&&token.length<=16000&&token.split('.').length===3,'token-shape');strictJSON(Buffer.from(token.split('.')[0],'base64url'));const claims=strictJSON(Buffer.from(token.split('.')[1],'base64url'));
 const now=clock();need(Number.isSafeInteger(now)&&now>=0,'clock');
 const identity=await inspectPublisherRunIdentity(token,{fetcher:boundedFetcher,now});
 need(identity.runAttempt==='1'&&identity.commit===binding.input.candidate.sourceCommit&&identity.workflowSha===identity.commit,'identity-binding');
 // Check verified token expiration again after issuer acquisition/crypto work.
 const end=clock();need(Number.isSafeInteger(end)&&end>=now&&end-now<=10000&&!signal.aborted&&claims.exp>Math.floor(end/1000)&&claims.iat>=Math.floor(end/1000)-600,'identity-stale');
 const principal={repositoryId:'1366223729',workflow:identity.workflowRef,source:identity.commit,workflowSha:identity.workflowSha,runId:identity.runId,runAttempt:identity.runAttempt,event:identity.eventName};
 const owner='github-'+digest(principal);
 const operationId='pub-'+digest({owner,bindingId:binding.bindingId,mode:input.mode}).slice(0,32);
 const c=binding.input.candidate.identity;
 return Object.freeze({operationId,owner,channel:'engine:'+c.engineRevision,bindingId:binding.bindingId,targetRevision:c.contentRevision,targetDigest:c.contentDigest,targetCommit:binding.input.candidate.sourceCommit,expectedRevision:head.status==='absent'?null:head.identity.contentRevision,expectedGeneration:head.status==='absent'?0:head.generation,mode:input.mode,principal:Object.freeze(principal),binding,authority:'not-established',productionActionAllowed:false});
}
module.exports={deriveIssuerIntent};
