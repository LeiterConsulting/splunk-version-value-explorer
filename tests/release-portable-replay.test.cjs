const test=require('node:test'),assert=require('node:assert/strict');
const {replay}=require('../scripts/lib/release-journal.cjs');
const {hash,canonical}=require('../scripts/lib/release-receipts.cjs');
const portable=import('../tools/release-coordination/portable-replay.mjs');
const target={projectId:'project',versionId:'version',sourceCommit:'a'.repeat(40),archiveSha256:'b'.repeat(64),environmentRevision:12,controls:{VC_ACTIVE_DELIVERY:'0',VC_PUBLISHER_ACTIVATION:'0',VC_PUBLISHER_OIDC:'1'}};
const intent={kind:'intent',operationId:'op-1',releaseId:'release-1',target,beforeDeploymentId:'old'};
function records(events){let prior=null;return events.map((event,i)=>{const body={sequence:i+1,previousSha256:prior,event},record={...body,sha256:hash(canonical(body))};prior=record.sha256;return record})}
function inspection(){const body={kind:'deployment-byte-inspection',...target,deploymentId:'new'};return {...body,receiptSha256:hash(canonical(body)),transportOrigin:'caller-retained-service-response',authenticatedByThisModule:false,claimedDelivered:false}}
const result=status=>({kind:'result',operationId:'op-1',status,deploymentId:status==='reported-success'?'new':null});
for(const [name,events] of Object.entries({empty:[],intent:[intent],denied:[intent,result('denied')],uncertain:[intent,result('uncertain')],unattributed:[intent,result('uncertain'),{kind:'readback',operationId:'op-1',inspection:inspection()}],matched:[intent,result('reported-success'),{kind:'readback',operationId:'op-1',inspection:inspection()}]}))test('portable replay parity: '+name,async()=>{const r=records(events);assert.deepEqual(await (await portable).replayPortable(r),replay(r))});
for(const [name,events] of Object.entries({secondIntent:[intent,{...intent,operationId:'op-2'}],deniedReadback:[intent,result('denied'),{kind:'readback',operationId:'op-1',inspection:inspection()}],wrongOperation:[intent,{...result('uncertain'),operationId:'other'}],wrongControl:[intent,result('reported-success'),{kind:'readback',operationId:'op-1',inspection:{...inspection(),controls:{...target.controls,VC_ACTIVE_DELIVERY:'1'}}}]}))test('portable replay rejects same invalid transition: '+name,async()=>{const r=records(events);let message;try{replay(r)}catch(e){message=e.message}assert(message);await assert.rejects(()=>(awaitable(r)),e=>e.message===message)});
async function awaitable(r){return (await portable).replayPortable(r)}
test('portable rejects tampered chain',async()=>{const r=records([intent]);r[0].event={...intent,releaseId:'different'};await assert.rejects(()=>awaitable(r),/chain-mismatch/)});
