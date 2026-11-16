// INACTIVE: explicit absent-head bootstrap, only against separately sealed admission.
// No route, issuer, migration, stage/preparation, control change or automatic retry.
import {inspectFencedTarget} from './fenced-promotion-reference.mjs';
import {readRetainedAdmission} from './retained-admission.mjs';
import {readPublicationHead} from '../../worker/publication-core.mjs';
const check=(ok,message)=>{if(!ok)throw Error(message)};
function inputs(action,identity,engine){
 action=action&&JSON.parse(JSON.stringify(action));identity=identity&&JSON.parse(JSON.stringify(identity));
 check(action&&Object.keys(action).sort().join(',')==='expectedGeneration,expectedHead,intent,operationId,revision','Exact bootstrap fields required');
 check(typeof engine==='string'&&/^engine-[a-f0-9]{20}$/.test(engine)&&engine.length===27&&
  typeof action.operationId==='string'&&/^pub-[a-f0-9]{32}$/.test(action.operationId)&&action.operationId.length===36&&
  typeof action.revision==='string'&&/^content-[a-f0-9]{24}$/.test(action.revision)&&action.revision.length===32&&
  action.expectedHead==='absent'&&action.expectedGeneration===0&&action.intent==='bootstrap','Explicit absent-head bootstrap required');
 check(identity&&Object.keys(identity).sort().join(',')==='epoch,operationId,owner'&&identity.operationId===action.operationId&&
  typeof identity.owner==='string'&&identity.owner.length>0&&identity.owner.length<=128&&!identity.owner.includes('\0')&&
  Number.isSafeInteger(identity.epoch)&&identity.epoch>0,'Exact bootstrap identity required');
 return {action,identity,channel:'engine:'+engine};
}
const decisionKeys=['operation_id','channel','owner','epoch','target_revision','target_digest','target_commit','expected_revision','expected_generation','mode'];
const hashes=['evidence_set_sha256','policy_sha256','runtime_snapshot_sha256','rollback_snapshot_sha256'];
async function retained(db,x,engine){
 const {action,identity,channel}=x,a=await readRetainedAdmission(db,action.operationId);
 check(a&&a.operation_id===action.operationId&&a.channel===channel&&a.owner===identity.owner&&a.epoch===identity.epoch&&
  a.target_revision===action.revision&&a.expected_revision===null&&a.expected_generation===0&&a.mode==='bootstrap'&&
  typeof a.target_digest==='string'&&/^[a-f0-9]{64}$/.test(a.target_digest)&&a.target_digest.length===64&&
  typeof a.target_commit==='string'&&/^[a-f0-9]{40}$/.test(a.target_commit)&&a.target_commit.length===40,'Retained bootstrap decision mismatch');
 const b=await db.prepare('SELECT * FROM release_admission_bindings WHERE operation_id=?').bind(action.operationId).first();
 const s=await db.prepare('SELECT * FROM release_admission_seals WHERE operation_id=?').bind(action.operationId).first();
 check(b&&s&&decisionKeys.every(k=>a[k]===b[k])&&s.operation_id===a.operation_id&&s.owner===a.owner&&s.epoch===a.epoch&&
  hashes.every(k=>typeof b[k]==='string'&&b[k].length===64&&/^[a-f0-9]{64}$/.test(b[k])&&s[k]===b[k]),'Bootstrap seal mismatch');
 await inspectFencedTarget(db,action.revision,a,engine);
 return a;
}
function exactEvent(e,a){return e&&e.operation_id===a.operation_id&&e.channel===a.channel&&e.generation===1&&
 e.from_revision===a.target_revision&&e.to_revision===a.target_revision&&e.intent==='publish'&&e.provenance_commit===a.target_commit&&
 e.writer_operation===a.operation_id&&e.writer_owner===a.owner&&e.writer_epoch===a.epoch;}
export async function reconcileRetainedBootstrap(db,action,identity,{engineRevision}={}){
 const x=inputs(action,identity,engineRevision),a=await retained(db,x,engineRevision);
 check(a.state==='consumed','Bootstrap is not durably consumed');
 const event=await db.prepare('SELECT * FROM content_publication_events WHERE operation_id=?').bind(a.operation_id).first();
 check(exactEvent(event,a),'Retained bootstrap event mismatch');
 return {status:'historically-applied',applied:{revision:event.to_revision,generation:1},current:await readPublicationHead(db,engineRevision),
  productionActionAllowed:false,deliveryVerified:false};
}
export async function bootstrapFenced(db,action,identity,{engineRevision}={}){
 const x=inputs(action,identity,engineRevision),a=await retained(db,x,engineRevision);
 const current=await db.prepare('SELECT * FROM release_admission WHERE operation_id=?').bind(a.operation_id).first();
 check(current&&decisionKeys.every(k=>current[k]===a[k])&&current.state==='admitted'&&current.stopped===0&&a.state==='admitted'&&a.stopped===0,'Bootstrap admission not current');
 const existing=await db.prepare('SELECT * FROM content_publication_events WHERE operation_id=?').bind(a.operation_id).first();
 check(existing===null,'Bootstrap outcome exists or is unknown; use read-only reconciliation');
 // Query raw rows, not readPublicationHead's joined view: malformed rows are not absence.
 const head=await db.prepare('SELECT channel,revision_id FROM content_publication WHERE channel=?').bind(a.channel).first();
 const event=await db.prepare('SELECT operation_id FROM content_publication_events WHERE channel=? LIMIT 1').bind(a.channel).first();
 check(head===null&&event===null,'Bootstrap head/history is present or unknown');
 // One INSERT. Existing SQL repeats absent-head, epoch, stop, decision and seal
 // predicates atomically, writes the head, consumes admission and records history.
 // A thrown/lost response is never retried; explicit read-only reconciliation follows.
 const result=await db.prepare('INSERT INTO content_publication_events(operation_id,channel,generation,from_revision,to_revision,provenance_commit,intent,created_at,writer_operation,writer_owner,writer_epoch) VALUES(?,?,1,?,?,?,\'publish\',?,?,?,?)')
  .bind(a.operation_id,a.channel,a.target_revision,a.target_revision,a.target_commit,new Date().toISOString(),a.operation_id,a.owner,a.epoch).run();
 check(result&&result.success!==false,'Bootstrap outcome uncertain; use read-only reconciliation');
 const observed=await reconcileRetainedBootstrap(db,x.action,x.identity,{engineRevision});
 return {...observed,status:'applied'};
}
