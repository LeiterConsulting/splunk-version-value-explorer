/* Portable counterpart of the local journal replay. No I/O or authority. */
const hash=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(v=>v.toString(16).padStart(2,'0')).join('');
function canonical(v){if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';return JSON.stringify(v);}
const fail=m=>{throw Error(m);};
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const keys=(x,want)=>{if(!plain(x)||Reflect.ownKeys(x).some(k=>typeof k!=='string'||!Object.hasOwn(Object.getOwnPropertyDescriptor(x,k),'value'))||Object.keys(x).sort().join(',')!==want.sort().join(','))fail('invalid-fields');};
const token=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(x);
function controls(x){keys(x,['VC_ACTIVE_DELIVERY','VC_PUBLISHER_ACTIVATION','VC_PUBLISHER_OIDC']);if(Object.values(x).some(v=>!['0','1'].includes(v)))fail('invalid-controls');}
function target(x){keys(x,['projectId','versionId','sourceCommit','archiveSha256','environmentRevision','controls']);controls(x.controls);if(!token(x.projectId)||typeof x.versionId!=='string'||x.versionId.length>256||!/^[a-f0-9]{40}$/.test(x.sourceCommit)||!/^[a-f0-9]{64}$/.test(x.archiveSha256)||!Number.isSafeInteger(x.environmentRevision)||x.environmentRevision<1)fail('invalid-target');}
async function inspectEvidence(x){
 if(!plain(x)||x.kind!=='deployment-byte-inspection'||x.authenticatedByThisModule!==false||x.claimedDelivered!==false)fail('invalid-inspection');
 const {receiptSha256,transportOrigin,authenticatedByThisModule,claimedDelivered,...body}=x;
 if(transportOrigin!=='caller-retained-service-response'||receiptSha256!==await hash(canonical(body)))fail('inspection-digest-mismatch');
 return x;
}
export async function replayPortable(records){
 let tail=null,pending=null,status='empty',sequence=0;const operations=new Set();
 for(const record of records){
  keys(record,['sequence','previousSha256','event','sha256']);const {sha256,...body}=record;
  if(record.sequence!==++sequence||record.previousSha256!==tail||sha256!==await hash(canonical(body)))fail('journal-chain-mismatch');
  const e=record.event;if(!plain(e)||!token(e.operationId))fail('invalid-event');
  if(e.kind==='intent'){
   keys(e,['kind','operationId','releaseId','target','beforeDeploymentId']);target(e.target);
   if(!token(e.releaseId)||typeof e.beforeDeploymentId!=='string'||!e.beforeDeploymentId||operations.has(e.operationId)||pending)fail('intent-blocked');
   operations.add(e.operationId);pending=structuredClone(e);pending.result=null;status='intent-recorded';
  }else if(e.kind==='result'){
   keys(e,['kind','operationId','status','deploymentId']);
   if(!pending||pending.operationId!==e.operationId||pending.result||!['reported-success','uncertain','denied'].includes(e.status))fail('result-blocked');
   if(e.deploymentId!==null&&(typeof e.deploymentId!=='string'||!e.deploymentId||e.deploymentId===pending.beforeDeploymentId))fail('invalid-deployment-id');
   if(e.status==='reported-success'&&e.deploymentId===null)fail('missing-deployment-id');
   pending.result=structuredClone(e);status=e.status==='denied'?'denied-terminal':'awaiting-readback';
  }else if(e.kind==='readback'){
   keys(e,['kind','operationId','inspection']);if(!pending||pending.operationId!==e.operationId||pending.result?.status==='denied')fail('readback-blocked');
   const v=await inspectEvidence(e.inspection),t=pending.target;
   if(v.projectId!==t.projectId||v.versionId!==t.versionId||v.sourceCommit!==t.sourceCommit||v.archiveSha256!==t.archiveSha256||v.environmentRevision!==t.environmentRevision||canonical(v.controls)!==canonical(t.controls))fail('readback-target-mismatch');
   if(!pending.result?.deploymentId){status='uncertain-unattributed';}
   else if(v.deploymentId!==pending.result.deploymentId)fail('readback-operation-mismatch');
   else{status='matched-readback-review-required';pending=null;}
  }else fail('unsupported-event');
  tail=record.sha256;
 }
 return {sequence,tail,status,pending,authority:'unverified',transportOrigin:'externally-retained-receipts-required',claimedDelivered:false,productionActionAllowed:false};
}
