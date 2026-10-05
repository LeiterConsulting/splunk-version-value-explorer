/* D1 is a projection of an immutable repo publication, never a new evidence authority. */
const pending = new WeakMap();
export async function ensureRevision(db, seed) {
  if (!db) throw Error('Content database unavailable');
  const id = seed.manifest.revision;
  const existing = await db.prepare('SELECT digest, completed FROM content_revisions WHERE id = ?').bind(id).first();
  if (existing?.completed === 1) {
    if (existing.digest !== seed.manifest.digest) throw Error('Immutable revision digest mismatch');
    return;
  }
  let revisions = pending.get(db);
  if (!revisions) { revisions = new Map(); pending.set(db, revisions); }
  if (revisions.has(id)) return revisions.get(id);
  const promise = importRevision(db, seed);
  revisions.set(id, promise);
  try { await promise; } finally { revisions.delete(id); }
}
async function importRevision(db, seed) {
  const m = seed.manifest;
  await db.prepare('INSERT INTO content_revisions (id, engine, schema_version, digest, manifest_json, bundle_json, record_count, completed) VALUES (?, ?, ?, ?, ?, ?, ?, 0) ON CONFLICT(id) DO NOTHING')
    .bind(m.revision, m.engineRevision, m.schemaVersion, m.digest, JSON.stringify(m), JSON.stringify(seed), m.recordCount).run();
  const existing = await db.prepare('SELECT digest, record_count FROM content_revisions WHERE id = ?').bind(m.revision).first();
  if (existing?.digest !== m.digest || existing.record_count !== m.recordCount) throw Error('Revision collision');
  for (let offset = 0; offset < seed.catalog.records.length; offset += 50) {
    await db.batch(seed.catalog.records.slice(offset, offset + 50).map(row => db.prepare('INSERT INTO content_records (revision_id, record_id, kind, dataset, payload_json) VALUES (?, ?, ?, ?, ?) ON CONFLICT(revision_id, record_id) DO NOTHING')
      .bind(m.revision, row.id, row.kind, row.dataset, JSON.stringify(row))));
  }
  const count = await db.prepare('SELECT COUNT(*) AS count FROM content_records WHERE revision_id = ?').bind(m.revision).first();
  if (count?.count !== m.recordCount) throw Error('Incomplete content revision');
  // The final batch is the activation boundary. A failed import never replaces a complete revision.
  await db.batch([
    db.prepare('UPDATE content_revisions SET completed = 1 WHERE id = ? AND digest = ?').bind(m.revision, m.digest),
    db.prepare('INSERT INTO content_publication (channel, revision_id) SELECT ?, id FROM content_revisions WHERE id = ? AND completed = 1 ON CONFLICT(channel) DO UPDATE SET revision_id = excluded.revision_id').bind('engine:' + m.engineRevision, m.revision),
  ]);
}
export async function readBundle(db, revision) {
  const row = await db.prepare('SELECT bundle_json FROM content_revisions WHERE id = ? AND completed = 1').bind(revision).first();
  if (!row) return null;
  return JSON.parse(row.bundle_json);
}
export async function readRecords(db, revision, kind, dataset, offset, limit) {
  const result = await db.prepare('SELECT payload_json FROM content_records WHERE revision_id = ? AND (? IS NULL OR kind = ?) AND (? IS NULL OR dataset = ?) ORDER BY record_id LIMIT ? OFFSET ?')
    .bind(revision, kind, kind, dataset, dataset, limit, offset).all();
  return result.results.map(row => JSON.parse(row.payload_json));
}
