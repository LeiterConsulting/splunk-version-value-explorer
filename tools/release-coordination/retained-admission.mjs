// Inactive read-only lookup. History records are not authenticated issuer proof.
export async function readRetainedAdmission(db, operationId) {
  if (!/^pub-[a-f0-9]{32}$/.test(operationId)) throw Error('Invalid operation');
  return db.prepare(`SELECT d.*,s.state,s.stopped FROM release_admission_decisions d
    JOIN release_admission_states s ON s.operation_id=d.operation_id
    WHERE d.operation_id=? ORDER BY s.sequence DESC LIMIT 1`).bind(operationId).first();
}
import { readPublicationHead, validateBundle } from '../../worker/publication-core.mjs';
// Explicit read-only reconciliation. Does not fall back into a mutating function.
export async function reconcileRetainedPromotion(db, action, identity, engineRevision) {
  action=action&&JSON.parse(JSON.stringify(action));identity=identity&&JSON.parse(JSON.stringify(identity));
  if(!action || !identity || action.operationId!==identity.operationId || !/^engine-[a-f0-9]{20}$/.test(engineRevision)) throw Error('Invalid reconciliation');
  const a=await readRetainedAdmission(db,action.operationId);
  const e=await db.prepare('SELECT * FROM content_publication_events WHERE operation_id=?').bind(action.operationId).first();
  if(!a || a.state!=='consumed' || a.channel!=='engine:'+engineRevision || a.owner!==identity.owner || a.epoch!==identity.epoch ||
    a.target_revision!==action.revision || a.expected_revision!==action.expectedRevision || a.expected_generation!==action.expectedGeneration || a.mode!==action.intent ||
    !e || e.channel!==a.channel || e.from_revision!==a.expected_revision || e.to_revision!==a.target_revision || e.provenance_commit!==a.target_commit ||
    e.generation!==a.expected_generation+1 || e.intent!==a.mode || e.writer_operation!==a.operation_id || e.writer_owner!==a.owner || e.writer_epoch!==a.epoch) throw Error('Retained admission/event mismatch');
  const row=await db.prepare('SELECT * FROM content_revisions WHERE id=?').bind(a.target_revision).first();
  if(!row || row.completed!==1 || row.engine!==engineRevision || row.digest!==a.target_digest) throw Error('Retained target mismatch');
  const bundle=await validateBundle(JSON.parse(row.bundle_json),engineRevision);
  if(bundle.manifest.revision!==a.target_revision || bundle.manifest.digest!==a.target_digest || row.manifest_json!==JSON.stringify(bundle.manifest)) throw Error('Retained target mismatch');
  const provenance=await db.prepare('SELECT commit_sha FROM content_publication_provenance WHERE revision_id=?').bind(a.target_revision).first();
  if(provenance?.commit_sha!==a.target_commit) throw Error('Retained provenance mismatch');
  return {status:'historically-applied',applied:{revision:e.to_revision,generation:e.generation},current:await readPublicationHead(db,engineRevision),productionActionAllowed:false,deliveryVerified:false};
}
