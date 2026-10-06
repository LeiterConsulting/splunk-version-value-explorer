import { validateBundle } from './publication-core.mjs';

/* D1 is a projection of an immutable repo publication, never a new evidence authority.
 * This path seeds a deployed bundle and never accepts an external publication candidate.
 */
const pending = new WeakMap();

export async function stageBundledRevision(db, seed) {
  if (!db) throw Error('Content database unavailable');
  await validateBundle(seed, seed?.manifest?.engineRevision);
  const id = seed.manifest.revision;
  const existing = await db.prepare('SELECT digest, engine, record_count, manifest_json, bundle_json, completed FROM content_revisions WHERE id = ?').bind(id).first();
  if (existing?.completed === 1) {
    if (existing.digest !== seed.manifest.digest || existing.engine !== seed.manifest.engineRevision || existing.record_count !== seed.manifest.recordCount
      || existing.manifest_json !== JSON.stringify(seed.manifest) || existing.bundle_json !== JSON.stringify(seed)) throw Error('Immutable bundled revision mismatch');
    return;
  }
  let revisions = pending.get(db);
  if (!revisions) { revisions = new Map(); pending.set(db, revisions); }
  if (revisions.has(id)) return revisions.get(id);
  const promise = importBundledRevision(db, seed);
  revisions.set(id, promise);
  try { await promise; } finally { revisions.delete(id); }
}

export async function ensureRevision(db, seed) {
  await stageBundledRevision(db, seed);
  const m = seed.manifest;
  // Initialize an empty engine channel only. Never replace a publisher-managed head.
  await db.prepare('INSERT INTO content_publication (channel, revision_id) SELECT ?, id FROM content_revisions WHERE id = ? AND completed = 1 ON CONFLICT(channel) DO NOTHING')
    .bind('engine:' + m.engineRevision, m.revision).run();
}

async function importBundledRevision(db, seed) {
  const m = seed.manifest, bytes = JSON.stringify(seed);
  await db.prepare('INSERT INTO content_revisions (id, engine, schema_version, digest, manifest_json, bundle_json, record_count, completed) VALUES (?, ?, ?, ?, ?, ?, ?, 0) ON CONFLICT(id) DO NOTHING')
    .bind(m.revision, m.engineRevision, m.schemaVersion, m.digest, JSON.stringify(m), bytes, m.recordCount).run();
  const existing = await db.prepare('SELECT digest, engine, record_count, manifest_json, bundle_json FROM content_revisions WHERE id = ?').bind(m.revision).first();
  if (existing?.digest !== m.digest || existing.engine !== m.engineRevision || existing.record_count !== m.recordCount
    || existing.manifest_json !== JSON.stringify(m) || existing.bundle_json !== bytes) throw Error('Bundled revision collision');
  for (let offset = 0; offset < seed.catalog.records.length; offset += 50) {
    await db.batch(seed.catalog.records.slice(offset, offset + 50).map(row => db.prepare('INSERT INTO content_records (revision_id, record_id, kind, dataset, payload_json) VALUES (?, ?, ?, ?, ?) ON CONFLICT(revision_id, record_id) DO NOTHING')
      .bind(m.revision, row.id, row.kind, row.dataset, JSON.stringify(row))));
  }
  const rows = await db.prepare('SELECT record_id, kind, dataset, payload_json FROM content_records WHERE revision_id = ?').bind(m.revision).all();
  const expected = new Map(seed.catalog.records.map(row => [row.id, row]));
  if (rows.results.length !== m.recordCount || !rows.results.every(row => {
    const value = expected.get(row.record_id);
    return value && row.kind === value.kind && row.dataset === value.dataset && row.payload_json === JSON.stringify(value);
  })) throw Error('Incomplete or corrupt bundled revision');
  await db.prepare('UPDATE content_revisions SET completed = 1 WHERE id = ? AND digest = ?').bind(m.revision, m.digest).run();
}

export async function readBundle(db, revision) {
  const row = await db.prepare('SELECT bundle_json FROM content_revisions WHERE id = ? AND completed = 1').bind(revision).first();
  return row ? JSON.parse(row.bundle_json) : null;
}

export async function readActiveBundle(db, engineRevision) {
  const row = await db.prepare('SELECT r.bundle_json FROM content_publication p JOIN content_revisions r ON r.id = p.revision_id WHERE p.channel = ? AND r.completed = 1 AND r.engine = ?')
    .bind('engine:' + engineRevision, engineRevision).first();
  return row ? JSON.parse(row.bundle_json) : null;
}

export async function readRecords(db, revision, kind, dataset, offset, limit) {
  const result = await db.prepare('SELECT payload_json FROM content_records WHERE revision_id = ? AND (? IS NULL OR kind = ?) AND (? IS NULL OR dataset = ?) ORDER BY record_id LIMIT ? OFFSET ?')
    .bind(revision, kind, kind, dataset, dataset, limit, offset).all();
  return result.results.map(row => JSON.parse(row.payload_json));
}
