/* INACTIVE privileged SQL adapter. NOT an evidence verifier or request handler.
 * A future sole-server authority may call only after ALL real authority gates.
 * Current protected-export-intake NEVER calls this and has no DB handle.
 */
const need=(x,r)=>{if(!x)throw Error(r)};
const exact=(x,ks)=>need(x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join()===ks.sort().join(),'issuer-input');
const hex=(x,n)=>typeof x==='string'&&new RegExp('^[a-f0-9]{'+n+'}$').test(x);
const token=(x,p,n)=>typeof x==='string'&&x.startsWith(p)&&hex(x.slice(p.length),n);
const integer=(x,min=0,max=9007199254740990)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
const hash=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(x)))),b=>b.toString(16).padStart(2,'0')).join('');
function identity(i){need(i&&token(i.operationId,'pub-',32)&&token(i.owner,'github-',64)&&token(i.channel,'engine:engine-',20)&&token(i.bindingId,'binding-',64),'issuer-identity');return[i.operationId,i.owner,i.channel,i.bindingId]}
export async function recordIssuerAudit(db,i,{outcome,reason,evidenceSha256=null}){
 identity(i);need(['denied','uncertain'].includes(outcome)&&['missing-authority','source-drift','policy-denied','stopped','uncertain-write'].includes(reason)&&((outcome==='uncertain')===(reason==='uncertain-write')),'issuer-audit-outcome');need(evidenceSha256===null||hex(evidenceSha256,64),'issuer-audit-evidence');
 const row=[...identity(i),outcome,reason,evidenceSha256],auditId='audit-'+await hash(row);
 const result=await db.prepare('INSERT INTO release_issuer_audit(audit_id,operation_id,owner,channel,binding_id,outcome,reason,evidence_sha256) VALUES(?,?,?,?,?,?,?,?)').bind(auditId,...row).run();need(result?.success===true&&result.meta?.changes===1,'issuer-audit-uncertain');return{auditId,outcome,productionActionAllowed:false};
}
export async function readIssuerPrecondition(db,channel){
 need(token(channel,'engine:engine-',20),'issuer-channel');
 // Single statement gives one local DB snapshot; no remote runtime atomicity claim.
 const row=await db.prepare(`SELECT
 (SELECT operation_id FROM release_admission WHERE channel=?) current_operation,
 (SELECT owner FROM release_admission WHERE channel=?) current_owner,
 (SELECT epoch FROM release_admission WHERE channel=?) current_epoch,
 (SELECT state FROM release_admission WHERE channel=?) current_state,
 (SELECT stopped FROM release_admission WHERE channel=?) current_stopped,
 COALESCE((SELECT MAX(epoch) FROM release_admission_decisions WHERE channel=?),0) max_epoch,
 (SELECT revision FROM release_issuer_stop_events WHERE channel=? ORDER BY revision DESC LIMIT 1) stop_revision,
 (SELECT stopped FROM release_issuer_stop_events WHERE channel=? ORDER BY revision DESC LIMIT 1) stop_stopped`).bind(...Array(8).fill(channel)).first();
 need(row&&integer(row.max_epoch)&&integer(row.stop_revision,0,9007199254740991)&&row.stop_stopped===0,'issuer-stop-or-epoch');
 if(row.current_operation===null)need(row.current_owner===null&&row.current_epoch===null&&row.current_state===null&&row.current_stopped===null&&row.max_epoch===0,'issuer-current-unknown');
 else need(token(row.current_operation,'pub-',32)&&typeof row.current_owner==='string'&&row.current_owner.length>0&&row.current_owner.length<=128&&integer(row.current_epoch,1)&&row.current_epoch===row.max_epoch&&row.current_state==='consumed'&&row.current_stopped===0,'issuer-current-ineligible');
 return{currentOperation:row.current_operation,currentOwner:row.current_owner,currentEpoch:row.current_epoch??0,maxEpoch:row.max_epoch,stopRevision:row.stop_revision};
}
// This name is an explicit trust contract, not proof supplied by a caller flag.
// No HTTP path or export-only receipt can invoke it through this repository.
export async function retainTrustedIssuerRequest(db,i,precondition,digests){
 identity(i);need(token(i.targetRevision,'content-',24)&&hex(i.targetDigest,64)&&hex(i.targetCommit,40)&&integer(i.expectedGeneration),'issuer-target');
 need(i.mode==='bootstrap'?i.expectedRevision===null&&i.expectedGeneration===0:['publish','rollback'].includes(i.mode)&&token(i.expectedRevision,'content-',24)&&i.expectedGeneration>0,'issuer-head');
 exact(precondition,['currentOperation','currentOwner','currentEpoch','maxEpoch','stopRevision']);
 need(integer(precondition.currentEpoch)&&integer(precondition.maxEpoch)&&integer(precondition.stopRevision,0,9007199254740991),'issuer-precondition');
 need(precondition.currentOperation===null?precondition.currentOwner===null&&precondition.currentEpoch===0&&precondition.maxEpoch===0:token(precondition.currentOperation,'pub-',32)&&typeof precondition.currentOwner==='string'&&precondition.currentOwner.length>0&&precondition.currentOwner.length<=128&&precondition.currentEpoch>0&&precondition.currentEpoch===precondition.maxEpoch,'issuer-current');
 exact(digests,['evidenceSet','policy','runtime','rollback']);need(Object.values(digests).every(d=>hex(d,64)),'issuer-evidence-digests');
 const commitAuditId='audit-'+await hash([...identity(i),'preparing-committed',precondition.maxEpoch+1,digests.evidenceSet]);
 const row=[...identity(i),i.targetRevision,i.targetDigest,i.targetCommit,i.expectedRevision,i.expectedGeneration,i.mode,precondition.currentOperation,precondition.currentOwner,precondition.currentEpoch,precondition.maxEpoch,precondition.stopRevision,digests.evidenceSet,digests.policy,digests.runtime,digests.rollback,commitAuditId];
 const result=await db.prepare('INSERT INTO release_issuer_requests VALUES('+Array(row.length).fill('?').join(',')+')').bind(...row).run();need(result?.success===true&&result.meta?.changes===1,'issuer-request-uncertain');
 return{operationId:i.operationId,requestRetained:true,admissionCreated:false,productionActionAllowed:false};
}
export async function commitTrustedIssuerRequest(db,operationId){
 need(token(operationId,'pub-',32),'issuer-operation');
 // Epoch is selected from retained history, not accepted as a caller input.
 // Guards compare that value to the immutable request and all local facts.
 const r=await db.prepare(`INSERT INTO release_issuer_commits(operation_id,channel,epoch)
 SELECT r.operation_id,r.channel,COALESCE((SELECT MAX(d.epoch) FROM release_admission_decisions d WHERE d.channel=r.channel),0)+1
 FROM release_issuer_requests r WHERE r.operation_id=?`).bind(operationId).run();
 need(r&&r.success===true&&Number.isSafeInteger(r.meta?.changes)&&r.meta.changes>=1,'issuer-commit-uncertain');
 return{operationId,status:'preparing-committed',productionActionAllowed:false,deliveryVerified:false};
}
export async function reconcileIssuerCommit(db,operationId){
 need(token(operationId,'pub-',32),'issuer-operation');
 const r=await db.prepare(`SELECT c.operation_id,c.channel,c.epoch,r.owner,r.binding_id,r.commit_audit_id,
 d.target_revision,d.target_digest,d.target_commit,d.expected_revision,d.expected_generation,d.mode,
 (SELECT state FROM release_admission_states WHERE operation_id=c.operation_id ORDER BY sequence DESC LIMIT 1) retained_state,
 (SELECT stopped FROM release_admission_states WHERE operation_id=c.operation_id ORDER BY sequence DESC LIMIT 1) retained_stopped,
 (SELECT operation_id FROM release_admission WHERE channel=c.channel) current_operation
 FROM release_issuer_commits c JOIN release_issuer_requests r ON r.operation_id=c.operation_id AND r.channel=c.channel
 JOIN release_admission_decisions d ON d.operation_id=c.operation_id AND d.channel=c.channel AND d.owner=r.owner AND d.epoch=c.epoch AND d.target_revision=r.target_revision AND d.target_digest=r.target_digest AND d.target_commit=r.target_commit AND d.expected_revision IS r.expected_revision AND d.expected_generation=r.expected_generation AND d.mode=r.mode
 JOIN release_admission_bindings b ON b.operation_id=c.operation_id AND b.epoch=c.epoch AND b.channel=r.channel AND b.owner=r.owner AND b.target_revision=r.target_revision AND b.target_digest=r.target_digest AND b.target_commit=r.target_commit AND b.expected_revision IS r.expected_revision AND b.expected_generation=r.expected_generation AND b.mode=r.mode AND b.evidence_set_sha256=r.evidence_set_sha256 AND b.policy_sha256=r.policy_sha256 AND b.runtime_snapshot_sha256=r.runtime_snapshot_sha256 AND b.rollback_snapshot_sha256=r.rollback_snapshot_sha256
 JOIN release_issuer_audit a ON a.audit_id=r.commit_audit_id AND a.operation_id=c.operation_id AND a.outcome='preparing-committed' AND a.reason='preparing-committed' AND a.owner=r.owner AND a.channel=r.channel AND a.binding_id=r.binding_id AND a.evidence_sha256 IS r.evidence_set_sha256
 WHERE c.operation_id=? AND (SELECT state FROM release_admission_states WHERE operation_id=c.operation_id ORDER BY sequence LIMIT 1)='preparing' AND (SELECT stopped FROM release_admission_states WHERE operation_id=c.operation_id ORDER BY sequence LIMIT 1)=0`).bind(operationId).first();
 need(r&&['preparing','admitted','consumed'].includes(r.retained_state)&&[0,1].includes(r.retained_stopped),'issuer-commit-not-established');
 return{status:'historically-preparing-committed',operationId,epoch:r.epoch,retainedState:r.retained_state,retainedStopped:r.retained_stopped,currentOperation:r.current_operation,productionActionAllowed:false,deliveryVerified:false};
}
