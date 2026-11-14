/* Explicit bounded manual preparation. Never imports bootstrap, stage or publish. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {loadResumeInputs,resumeSeed} from './resume-seed.mjs';
import {observeSeed,validateContext,validateObservation} from './observe-seed.mjs';
const identityKeys=['commit','ref','seedSourceCommit','seedSourceTree','sitesVersion','engineRevision','revision','digest','recordCount'];
const equalIdentity=(r,e)=>identityKeys.every(k=>r?.[k]===e[k]);
const reject=reason=>{throw Object.assign(Error(reason),{reason})};
const reasons=new Set(['context','initial-observation','identity','resume-failed-or-uncertain','progress','readback','retention','deadline','budget','cancelled']);
// Each call uses the existing module's fixed <=20s deadline. No abort/retry of an
// in-flight write: its eventual receipt or unknown outcome must be reconciled.
export async function recoverSeed({expected,runId,runAttempt,initialPresent,maxBatches,observe,resume,retain,monotonic=()=>performance.now(),cancelled=()=>false}={}) {
 const started=monotonic(); let batches=0,present=initialPresent,inFlight=false,lastStage='preflight';
 const base={mode:'recover-seed-only',claimedDelivered:false,readiness:'not-assessed',qualification:'Bounded preparation only. Final server integrity assertion and separate metadata/count readback are not independent full-row byte verification. No head, provenance, history, activation or delivery action.'};
 const outcome=(status,reason)=>({...base,status,...expected,runId,runAttempt,initialPresent,maxBatches,batches,present,mutationAttempted:batches>0||inFlight,mutationOutcome:inFlight?'uncertain-read-back-before-retry':batches>0?'reported-progress-read-back-required':'not-attempted',lastStage,...(reason?{reason}:{})});
 const save=async(kind,r)=>{try{await retain(kind,r)}catch{reject('retention')}};
 const guard=()=>{if(cancelled())reject('cancelled');if(monotonic()-started>=15*60*1000)reject('deadline')};
 const checkObservation=(r,n,stage)=>{
  if(r?.status!=='observation-returned'||r.mode!=='observe-only'||r.mutationAttempted!==false||!equalIdentity(r,expected))reject(stage);
  try{validateObservation(r.observation,expected,200)}catch{reject(stage)}
  if(r.observation.observedRecordCount!==n||r.observation.head!=='absent')reject(stage);
  if(n===expected.recordCount && r.observation.seed!=='marked-complete-count-consistent')reject(stage);
 };
 try{
  if(!expected||!identityKeys.every(k=>expected[k]!==undefined)||!['commit','seedSourceCommit','seedSourceTree'].every(k=>typeof expected[k]==='string'&&/^[a-f0-9]{40}$/.test(expected[k]))||expected.ref!=='refs/heads/main'||!Number.isSafeInteger(expected.sitesVersion)||expected.sitesVersion<1||!/^engine-[a-f0-9]{20}$/.test(expected.engineRevision)||!/^content-[a-f0-9]{24}$/.test(expected.revision)||! /^[a-f0-9]{64}$/.test(expected.digest)||typeof runId!=='string'||!Number.isSafeInteger(expected.recordCount)||expected.recordCount<1||expected.recordCount>10000||!/^\d{1,20}$/.test(runId||'')||runAttempt!==1||!Number.isSafeInteger(initialPresent)||initialPresent<0||initialPresent>=expected.recordCount||!Number.isSafeInteger(maxBatches)||maxBatches<1||maxBatches>20||Math.ceil((expected.recordCount-initialPresent)/50)>maxBatches)reject('context');
  guard();lastStage='initial-observation';let first=await observe();await save('initial-observation',first);checkObservation(first,initialPresent,'initial-observation');
  while(present<expected.recordCount){
   guard();if(batches>=maxBatches)reject('budget');lastStage='resume';inFlight=true;
   const r=await resume();await save(`batch-${batches+1}-resume`,r);
   if(r?.status!=='resume-reported'||r.mode!=='resume-only'||!equalIdentity(r,expected)||r.runId!==runId||r.runAttempt!==runAttempt||r.mutationAttempted!==true||r.httpStatus!==200)reject('resume-failed-or-uncertain');
   const p=r.progress,delta=Math.min(50,expected.recordCount-present),end=present+delta;
   if(!p||p.revision!==expected.revision||p.engineRevision!==expected.engineRevision||p.present!==end||p.missing!==expected.recordCount-end||p.attemptedRows!==delta||p.status!==(end===expected.recordCount?'complete':'partial')||p.integrity!==(end===expected.recordCount?'all-rows-exact':'present-rows-exact'))reject('progress');
   // Until separately read back, an acknowledged write stays reconciliation-required.
   guard();lastStage='readback';const observed=await observe();await save(`batch-${batches+1}-observation`,observed);checkObservation(observed,end,'readback');
   present=end;batches++;inFlight=false;
  }
  lastStage='prepared';return {...outcome('prepared-not-published'),integrity:'server-all-rows-exact-with-separate-count-readback',mutationOutcome:'prepared-read-back-no-publication'};
 }catch(e){return outcome('held',reasons.has(e?.reason)?e.reason:'resume-failed-or-uncertain')}
}

export function journal(directory){
 fs.mkdirSync(directory,{recursive:false});let index=0;const entries=[];
 return (kind,receipt)=>{
  if(!/^[a-z0-9-]+$/.test(kind))throw Error('journal');
  const name=`${String(++index).padStart(3,'0')}-${kind}.json`, bytes=JSON.stringify(receipt,null,2)+'\n';
  fs.writeFileSync(path.join(directory,name),bytes,{flag:'wx',mode:0o600});
  entries.push({name,sha256:createHash('sha256').update(bytes).digest('hex')});
  // Each index file is immutable too; an incomplete run keeps earlier entries.
  fs.writeFileSync(path.join(directory,`${String(index).padStart(3,'0')}-index.json`),JSON.stringify(entries,null,2)+'\n',{flag:'wx',mode:0o600});
 };
}
export async function main(env=process.env){
 let retain,result;
 try{
  if(env.VC_RECOVERY_MODE!=='recover-seed-only'||env.GITHUB_RUN_ATTEMPT!=='1'||!/^\d+$/.test(env.VC_RECOVERY_INITIAL_PRESENT||'')||!/^\d+$/.test(env.VC_RECOVERY_MAX_BATCHES||''))reject('context');
  const mapped={...env,VC_RESUME_MODE:'resume-only'};
  const inputs=loadResumeInputs({env:mapped}); // clean checkout BEFORE journals
  const observationEnv={...mapped,VC_OBSERVATION_MODE:'observe-only',VC_OBSERVATION_EXPECTED_COMMIT:mapped.VC_RESUME_EXPECTED_COMMIT,VC_OBSERVATION_EXPECTED_REF:mapped.VC_RESUME_EXPECTED_REF,VC_OBSERVATION_EXPECTED_SEED_COMMIT:mapped.VC_RESUME_EXPECTED_SEED_COMMIT,VC_OBSERVATION_EXPECTED_ENGINE:mapped.VC_RESUME_EXPECTED_ENGINE,VC_OBSERVATION_EXPECTED_REVISION:mapped.VC_RESUME_EXPECTED_REVISION};
  const expected=validateContext(observationEnv,inputs.manifest,inputs.checkoutSha,inputs.deployment,inputs.sourceTree);
  if(!env.RUNNER_TEMP||!path.isAbsolute(env.RUNNER_TEMP))reject('context');
  retain=journal(path.join(env.RUNNER_TEMP,'vc-seed-recovery'));
  result=await recoverSeed({expected,runId:env.GITHUB_RUN_ID,runAttempt:Number(env.GITHUB_RUN_ATTEMPT),initialPresent:Number(env.VC_RECOVERY_INITIAL_PRESENT),maxBatches:Number(env.VC_RECOVERY_MAX_BATCHES),observe:()=>observeSeed({...inputs,env:observationEnv}),resume:()=>resumeSeed(inputs),retain});
  retain('outcome',result);
 }catch{result={mode:'recover-seed-only',status:'held',reason:'local-preflight-or-retention',claimedDelivered:false,mutationOutcome:'unknown-reconcile-retained-batches-before-retry'}}
 console.log(JSON.stringify(result));return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const r=await main();if(r.status!=='prepared-not-published')process.exitCode=1;}
