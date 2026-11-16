// INACTIVE reference: requires separately provisioned, authenticated admission.
// Does not create admission, change its state, or expose a runtime route.
import { validateBundle, REPOSITORY } from '../../worker/publication-core.mjs';
const requireValue = (ok, message) => { if (!ok) throw Error(message); };
export async function prepareFencedBatch(db, input, identity, provenance) {
  identity = identity && JSON.parse(JSON.stringify(identity));
  provenance = provenance && JSON.parse(JSON.stringify(provenance));
  input = input && JSON.parse(JSON.stringify(input));
  requireValue(identity && /^pub-[a-f0-9]{32}$/.test(identity.operationId) &&
    typeof identity.owner === 'string' && identity.owner.length > 0 && identity.owner.length <= 128 &&
    Number.isSafeInteger(identity.epoch) && identity.epoch > 0, 'Explicit writer identity required');
  const bundle = await validateBundle(input, input?.manifest?.engineRevision);
  const m = bundle.manifest, bytes = JSON.stringify(bundle), manifest = JSON.stringify(m);
  requireValue(m.recordCount <= 1000, 'Preparation budget exceeded');
  requireValue(provenance?.repository === REPOSITORY && /^[a-f0-9]{40}$/.test(provenance.commit) &&
    Number.isSafeInteger(provenance.workflowRun) && provenance.workflowRun > 0, 'Provenance identity required');
  const stamp = [identity.operationId, identity.owner, identity.epoch];
  const a = await db.prepare('SELECT * FROM release_admission WHERE operation_id=?').bind(identity.operationId).first();
  requireValue(a && a.owner === identity.owner && a.epoch === identity.epoch && a.stopped === 0 && a.state === 'preparing' &&
    a.channel === 'engine:' + m.engineRevision && a.target_revision === m.revision && a.target_digest === m.digest &&
    a.target_commit === provenance.commit, 'Preparation admission mismatch');
  // Read-before-insert is reconciliation, not the concurrency guard. Triggers
  // recheck admission at every write. A racing duplicate fails closed.
  let stored = await db.prepare('SELECT * FROM content_revisions WHERE id=?').bind(m.revision).first();
  if (!stored) {
    await db.prepare('INSERT INTO content_revisions(id,engine,schema_version,digest,manifest_json,bundle_json,record_count,completed,writer_operation,writer_owner,writer_epoch) VALUES(?,?,?,?,?,?,?,0,?,?,?)')
      .bind(m.revision,m.engineRevision,m.schemaVersion,m.digest,manifest,bytes,m.recordCount,...stamp).run();
    stored = await db.prepare('SELECT * FROM content_revisions WHERE id=?').bind(m.revision).first();
  }
  requireValue(stored && stored.bundle_json === bytes && stored.manifest_json === manifest && stored.digest === m.digest &&
    stored.engine === m.engineRevision && stored.schema_version === m.schemaVersion && [0,1].includes(stored.completed) && stored.record_count === m.recordCount, 'Immutable revision collision');
  const expected = new Map(bundle.catalog.records.map(row => [row.id, row]));
  async function readRows() {
    const { results } = await db.prepare('SELECT record_id,kind,dataset,payload_json FROM content_records WHERE revision_id=? LIMIT ?').bind(m.revision,m.recordCount+1).all();
    requireValue(Array.isArray(results) && results.length <= m.recordCount && new Set(results.map(row => row.record_id)).size === results.length && results.every(row => {
      const e = expected.get(row.record_id);
      return e && e.kind === row.kind && e.dataset === row.dataset && JSON.stringify(e) === row.payload_json;
    }), 'Corrupt prepared records');
    return results;
  }
  let rows = await readRows();
  const present = new Set(rows.map(row => row.record_id));
  const missing = bundle.catalog.records.filter(row => !present.has(row.id));
  requireValue(stored.completed === 0 || missing.length === 0, 'Corrupt completed revision');
  const batch = missing.slice(0, 50);
  if (batch.length) { const outcomes = await db.batch(batch.map(row => db.prepare('INSERT INTO content_records(revision_id,record_id,kind,dataset,payload_json,writer_operation,writer_owner,writer_epoch) VALUES(?,?,?,?,?,?,?,?)')
    .bind(m.revision,row.id,row.kind,row.dataset,JSON.stringify(row),...stamp)));
    requireValue(Array.isArray(outcomes) && outcomes.length === batch.length && outcomes.every(r => r && r.success !== false), 'Batch outcome uncertain');
  }
  rows = await readRows();
  requireValue(batch.every(row => rows.some(stored => stored.record_id === row.id)), 'Batch outcome uncertain');
  if (rows.length !== m.recordCount) return { status:'preparing', count:rows.length, writes:batch.length, productionActionAllowed:false };
  const p = await db.prepare('SELECT * FROM content_publication_provenance WHERE revision_id=?').bind(m.revision).first();
  if (p) requireValue(p.repository === REPOSITORY && p.commit_sha === provenance.commit && p.workflow_run === provenance.workflowRun, 'Provenance collision');
  const statements = [];
  if (!p) statements.push(db.prepare('INSERT INTO content_publication_provenance(revision_id,repository,commit_sha,workflow_run,verified_at,writer_operation,writer_owner,writer_epoch) VALUES(?,?,?,?,?,?,?,?)')
    .bind(m.revision,REPOSITORY,provenance.commit,provenance.workflowRun,new Date().toISOString(),...stamp));
  if (stored.completed === 0) statements.push(db.prepare('UPDATE content_revisions SET completed=1,writer_operation=?,writer_owner=?,writer_epoch=? WHERE id=? AND completed=0').bind(...stamp,m.revision));
  if (statements.length) {
    const outcomes = await db.batch(statements);
    requireValue(Array.isArray(outcomes) && outcomes.length === statements.length && outcomes.every(r => r && r.success !== false), 'Completion outcome uncertain');
  }
  const final = await db.prepare('SELECT completed FROM content_revisions WHERE id=?').bind(m.revision).first();
  const finalProvenance = await db.prepare('SELECT * FROM content_publication_provenance WHERE revision_id=?').bind(m.revision).first();
  requireValue(finalProvenance?.repository === REPOSITORY && finalProvenance.commit_sha === provenance.commit && finalProvenance.workflow_run === provenance.workflowRun, 'Provenance outcome uncertain');
  requireValue(final?.completed === 1, 'Completion uncertain');
  return {status:'prepared', count:rows.length, writes:batch.length, productionActionAllowed:false};
}
