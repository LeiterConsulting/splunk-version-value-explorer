// INACTIVE integration slice: no runtime route or automatic admission issuer.
import { validateBundle, readPublicationHead, REPOSITORY } from '../../worker/publication-core.mjs';
const check = (ok, message) => { if (!ok) throw Error(message); };
export async function promoteFenced(db, action, identity, { engineRevision } = {}) {
  action = action && JSON.parse(JSON.stringify(action));
  identity = identity && JSON.parse(JSON.stringify(identity));
  check(action && Object.keys(action).sort().join(',') === 'expectedGeneration,expectedRevision,intent,operationId,revision', 'Exact promotion fields required');
  check(/^engine-[a-f0-9]{20}$/.test(engineRevision) && /^pub-[a-f0-9]{32}$/.test(action.operationId) &&
    /^content-[a-f0-9]{24}$/.test(action.revision) && /^content-[a-f0-9]{24}$/.test(action.expectedRevision) &&
    action.revision !== action.expectedRevision && ['publish','rollback'].includes(action.intent) &&
    Number.isSafeInteger(action.expectedGeneration) && action.expectedGeneration >= 0 && action.expectedGeneration < Number.MAX_SAFE_INTEGER,
    'Invalid promotion');
  check(identity && identity.operationId === action.operationId && typeof identity.owner === 'string' &&
    identity.owner.length > 0 && identity.owner.length <= 128 && Number.isSafeInteger(identity.epoch) && identity.epoch > 0, 'Writer identity required');
  const channel = 'engine:' + engineRevision;
  const admission = await db.prepare('SELECT * FROM release_admission WHERE operation_id=?').bind(action.operationId).first();
  check(admission && admission.channel === channel && admission.owner === identity.owner && admission.epoch === identity.epoch &&
    admission.target_revision === action.revision && admission.expected_revision === action.expectedRevision &&
    admission.expected_generation === action.expectedGeneration && admission.mode === action.intent, 'Promotion admission mismatch');
  const exactEvent = event => event && event.operation_id === action.operationId && event.channel === channel &&
    event.from_revision === action.expectedRevision && event.to_revision === action.revision && event.generation === action.expectedGeneration + 1 &&
    event.intent === action.intent && event.provenance_commit === admission.target_commit && event.writer_operation === action.operationId &&
    event.writer_owner === identity.owner && event.writer_epoch === identity.epoch;
  const existing = await db.prepare('SELECT * FROM content_publication_events WHERE operation_id=?').bind(action.operationId).first();
  if (existing) {
    check(exactEvent(existing) && admission.state === 'consumed', 'Applied operation identity mismatch');
    return {status:'already-applied', applied:{revision:existing.to_revision,generation:existing.generation}, current:await readPublicationHead(db,engineRevision), deliveryVerified:false,productionActionAllowed:false};
  }
  check(admission.state === 'admitted' && admission.stopped === 0, 'Promotion not admitted');
  const row = await db.prepare('SELECT * FROM content_revisions WHERE id=?').bind(action.revision).first();
  check(row?.completed === 1, 'Complete target required');
  const bundle = await validateBundle(JSON.parse(row.bundle_json),engineRevision), m = bundle.manifest;
  check(m.revision === action.revision && m.digest === admission.target_digest && row.digest === m.digest &&
    row.manifest_json === JSON.stringify(m) && row.engine === engineRevision && row.schema_version === m.schemaVersion && row.record_count === m.recordCount,
    'Stored target identity mismatch');
  const provenance = await db.prepare('SELECT * FROM content_publication_provenance WHERE revision_id=?').bind(action.revision).first();
  check(provenance?.repository === REPOSITORY && provenance.commit_sha === admission.target_commit, 'Target provenance mismatch');
  const {results} = await db.prepare('SELECT record_id,kind,dataset,payload_json FROM content_records WHERE revision_id=? LIMIT ?').bind(action.revision,m.recordCount+1).all();
  const expected = new Map(bundle.catalog.records.map(r=>[r.id,r]));
  check(Array.isArray(results) && results.length === m.recordCount && new Set(results.map(r=>r.record_id)).size === results.length && results.every(r=>{
    const e=expected.get(r.record_id);return e && r.kind===e.kind && r.dataset===e.dataset && r.payload_json===JSON.stringify(e);
  }), 'Target record integrity failed');
  const current = await readPublicationHead(db,engineRevision);
  check(current.revision===action.expectedRevision && current.generation===action.expectedGeneration,'Stale publication expectation');
  // SQL guards repeat head/generation/history/ownership/stop checks atomically.
  // No catch-and-retry: unknown outcomes require a separate same-operation readback.
  const result=await db.prepare('INSERT INTO content_publication_events(operation_id,channel,generation,from_revision,to_revision,provenance_commit,intent,created_at,writer_operation,writer_owner,writer_epoch) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
    .bind(action.operationId,channel,action.expectedGeneration+1,action.expectedRevision,action.revision,admission.target_commit,action.intent,new Date().toISOString(),identity.operationId,identity.owner,identity.epoch).run();
  check(result && result.success!==false,'Promotion outcome uncertain');
  const event=await db.prepare('SELECT * FROM content_publication_events WHERE operation_id=?').bind(action.operationId).first();
  const after=await db.prepare('SELECT state FROM release_admission WHERE operation_id=?').bind(action.operationId).first();
  check(exactEvent(event) && after?.state==='consumed','Promotion outcome uncertain');
  return {status:'applied',applied:{revision:event.to_revision,generation:event.generation},current:await readPublicationHead(db,engineRevision),deliveryVerified:false,productionActionAllowed:false};
}
