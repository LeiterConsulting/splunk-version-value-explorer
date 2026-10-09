/* Independent publication core. HTTP authentication lives in publisher.mjs.
 * Schema changes use managed migrations; active visitor delivery has a separate gate.
 * The repo/CI is the authority; this code does not verify Splunk product claims.
 */
export const REPOSITORY = 'LeiterConsulting/splunk-version-value-explorer';
export const DATASETS = ['platform', 'products', 'guidance', 'environment', 'editions', 'forwarders', 'soar'];
export const REQUIRED_STEPS = [
  'node scripts/sync-release-metadata.cjs --check',
  'node scripts/sync-source-register.cjs --check',
  'node scripts/sync-content-revision.cjs --check',
  'node scripts/sync-content.cjs --check',
  'node --test tests/*.test.cjs',
  'node scripts/build-worker.cjs',
  'node tools/export-verification/verify.mjs',
];
const REVISION = /^content-[a-f0-9]{24}$/;
const ENGINE = /^engine-[a-f0-9]{20}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const DIGEST = /^[a-f0-9]{64}$/;
const MAX_BYTES = 8 * 1024 * 1024;
const encoder = new TextEncoder();
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function requireValue(condition, message) { if (!condition) throw new Error(message); }
function exactKeys(value, keys, at) {
  requireValue(object(value) && Object.keys(value).length === keys.length && keys.every(key => own(value, key)), 'Invalid ' + at + ' fields');
}
function safeJson(value, depth = 0) {
  requireValue(depth <= 64, 'Content nesting limit exceeded');
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') { requireValue(Number.isFinite(value), 'Invalid JSON number'); return; }
  requireValue(object(value) || Array.isArray(value), 'Non-JSON content');
  for (const [key, child] of Object.entries(value)) {
    requireValue(!['__proto__', 'prototype', 'constructor'].includes(key), 'Unsafe content key');
    safeJson(child, depth + 1);
  }
}
export async function sha256(value) {
  const bytes = encoder.encode(typeof value === 'string' ? value : JSON.stringify(value));
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
function snapshot(value) {
  safeJson(value);
  const serialized = JSON.stringify(value);
  requireValue(encoder.encode(serialized).length <= MAX_BYTES, 'Publication exceeds byte limit');
  return JSON.parse(serialized);
}
export async function validateBundle(input, engineRevision) {
  const bundle = snapshot(input);
  exactKeys(bundle, ['manifest', 'globals', 'catalog'], 'bundle');
  const m = bundle.manifest;
  exactKeys(m, ['schemaVersion', 'revision', 'digest', 'engineRevision', 'datasetHashes', 'recordCount', 'provenance', 'verificationPolicy', 'phase'], 'manifest');
  requireValue(m.schemaVersion === 1 && REVISION.test(m.revision) && DIGEST.test(m.digest) && ENGINE.test(m.engineRevision), 'Invalid publication identity');
  requireValue(ENGINE.test(engineRevision) && m.engineRevision === engineRevision, 'Engine mismatch');
  exactKeys(m.datasetHashes, DATASETS, 'dataset hashes');
  requireValue(Object.values(m.datasetHashes).every(hash => typeof hash === 'string' && DIGEST.test(hash)), 'Invalid dataset digest');
  requireValue(['provenance', 'verificationPolicy', 'phase'].every(key => typeof m[key] === 'string' && m[key].length > 0), 'Invalid manifest metadata');
  exactKeys(bundle.globals, ['SPLUNK_DATA', 'VersionCompassEnvironmentData', 'VersionCompassEditions', 'VersionCompassForwarderData', 'VersionCompassSOARData'], 'globals');
  requireValue(Object.values(bundle.globals).every(object), 'Invalid dataset globals');
  exactKeys(bundle.catalog, ['schemaVersion', 'records'], 'catalog');
  const rows = bundle.catalog.records;
  requireValue(bundle.catalog.schemaVersion === 1 && Array.isArray(rows) && Number.isSafeInteger(m.recordCount) && m.recordCount > 0 && m.recordCount <= 10000 && rows.length === m.recordCount, 'Record count mismatch');
  const ids = new Set(), sources = new Map();
  for (const row of rows) {
    requireValue(object(row) && typeof row.id === 'string' && /^(?:vc|source)-[a-f0-9]{20}$/.test(row.id) && !ids.has(row.id), 'Invalid or duplicate record ID');
    ids.add(row.id);
    requireValue(typeof row.kind === 'string' && row.kind.trim().length > 0 && row.kind.length <= 200, 'Invalid record kind');
    if (row.kind === 'source') {
      exactKeys(row, ['id', 'kind', 'dataset', 'url'], 'source record');
      requireValue(row.dataset === 'sources' && /^https:\/\//.test(row.url), 'Invalid source record');
      requireValue(row.id === 'source-' + (await sha256(row.url)).slice(0, 20), 'Source identity mismatch');
      sources.set(row.id, row.url);
    } else {
      exactKeys(row, ['id', 'kind', 'dataset', 'scope', 'evidence', 'verification', 'payload'], 'claim record');
      requireValue(DATASETS.includes(row.dataset) && object(row.scope) && Array.isArray(row.evidence) && object(row.verification), 'Invalid claim record');
      exactKeys(row.verification, ['date', 'outcome'], 'verification');
      requireValue((row.verification.date === null || typeof row.verification.date === 'string') && typeof row.verification.outcome === 'string', 'Invalid verification metadata');
    }
  }
  for (const row of rows) for (const ref of row.evidence || []) {
    exactKeys(ref, ['sourceId', 'url', 'section', 'sectionScope', 'sourceVerified', 'sourceChecked'], 'evidence');
    requireValue(sources.get(ref.sourceId) === ref.url, 'Broken source-to-claim mapping');
    requireValue(typeof ref.sectionScope === 'string' && ['section', 'sourceVerified', 'sourceChecked'].every(key => ref[key] === null || typeof ref[key] === 'string'), 'Invalid evidence metadata');
  }
  requireValue(await sha256({ schemaVersion: 1, globals: bundle.globals, catalog: bundle.catalog }) === m.digest, 'Bundle digest mismatch');
  requireValue('content-' + (await sha256({ digest: m.digest, engineRevision: m.engineRevision, datasetHashes: m.datasetHashes })).slice(0, 24) === m.revision, 'Revision identity mismatch');
  return bundle;
}
async function fetchJson(url, fetcher) {
  let response;
  try { response = await fetcher(url, { redirect: 'manual', headers: { Accept: 'application/json', 'User-Agent': 'VersionCompass-Publication-Verifier' }, signal: AbortSignal.timeout(15000) }); }
  catch { throw Error('Repository evidence unavailable'); }
  requireValue(response.ok && response.body, 'Repository evidence unavailable (HTTP ' + response.status + ')');
  const reader = response.body.getReader(), chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength; requireValue(size <= MAX_BYTES, 'Repository artifact exceeds byte limit'); chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let value;
  try { value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw Error('Repository evidence unavailable'); }
  safeJson(value); return value;
}
export async function verifyRepositoryPublication(input, { engineRevision, fetcher = (...args) => globalThis.fetch(...args) } = {}) {
  // Snapshot before the first await: callers cannot change a candidate while its provenance is checked.
  const candidate = snapshot(input);
  exactKeys(candidate, ['repository', 'commit', 'bundle'], 'candidate');
  requireValue(candidate.repository === REPOSITORY && COMMIT.test(candidate.commit), 'Untrusted repository or commit');
  const bundle = await validateBundle(candidate.bundle, engineRevision);
  const api = 'https://api.github.com/repos/' + REPOSITORY;
  const compare = await fetchJson(`${api}/compare/${candidate.commit}...main`, fetcher);
  requireValue(['identical', 'ahead'].includes(compare.status) && compare.base_commit?.sha === candidate.commit && compare.merge_base_commit?.sha === candidate.commit, 'Commit is not on main');
  const runs = await fetchJson(`${api}/actions/runs?head_sha=${candidate.commit}&event=push&per_page=100`, fetcher);
  const run = (runs.workflow_runs || []).filter(row => row.head_sha === candidate.commit && row.head_branch === 'main' && row.event === 'push' && row.path === '.github/workflows/validate.yml' && row.repository?.full_name === REPOSITORY).sort((a, b) => b.id - a.id)[0];
  requireValue(run?.status === 'completed' && run.conclusion === 'success' && Number.isSafeInteger(run.id), 'Required main CI has not passed');
  const jobs = await fetchJson(`${api}/actions/runs/${run.id}/jobs?per_page=100`, fetcher);
  const job = (jobs.jobs || []).find(row => row.name === 'validate' && row.status === 'completed' && row.conclusion === 'success');
  requireValue(job && REQUIRED_STEPS.every(name => job.steps?.some(step => (step.name === name || step.name === 'Run ' + name) && step.status === 'completed' && step.conclusion === 'success')), 'Required validation or build evidence missing');
  const raw = `https://raw.githubusercontent.com/${REPOSITORY}/${candidate.commit}`;
  const manifest = await fetchJson(`${raw}/content/publication.json`, fetcher);
  const published = await fetchJson(`${raw}/dist/content-bundle.json`, fetcher);
  requireValue(JSON.stringify(manifest) === JSON.stringify(bundle.manifest) && JSON.stringify(published) === JSON.stringify(bundle), 'Candidate differs from the committed publication');
  return { bundle, provenance: { repository: REPOSITORY, commit: candidate.commit, workflowRun: run.id } };
}

// Apply explicitly via the managed migration path before publisher activation, not from public GETs.
export const PUBLICATION_SCHEMA = `CREATE TABLE IF NOT EXISTS content_publication_provenance (
  revision_id TEXT PRIMARY KEY NOT NULL REFERENCES content_revisions(id),
  repository TEXT NOT NULL,
  commit_sha TEXT NOT NULL,
  workflow_run INTEGER NOT NULL,
  verified_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS content_publication_events (
  operation_id TEXT PRIMARY KEY NOT NULL,
  channel TEXT NOT NULL,
  generation INTEGER NOT NULL CHECK (generation > 0),
  from_revision TEXT NOT NULL REFERENCES content_revisions(id),
  to_revision TEXT NOT NULL REFERENCES content_revisions(id),
  provenance_commit TEXT NOT NULL,
  intent TEXT NOT NULL CHECK (intent IN ('publish', 'rollback')),
  created_at TEXT NOT NULL,
  UNIQUE(channel, generation)
);`;

export async function stagePublication(db, candidate, options) {
  requireValue(db?.prepare && db?.batch, 'Content database unavailable');
  const { bundle, provenance } = await verifyRepositoryPublication(candidate, options);
  const m = bundle.manifest, bytes = JSON.stringify(bundle);
  // All network, CI, identity and content checks finish before any database write.
  await db.prepare('INSERT INTO content_revisions (id, engine, schema_version, digest, manifest_json, bundle_json, record_count, completed) VALUES (?, ?, ?, ?, ?, ?, ?, 0) ON CONFLICT(id) DO NOTHING')
    .bind(m.revision, m.engineRevision, m.schemaVersion, m.digest, JSON.stringify(m), bytes, m.recordCount).run();
  const stored = await db.prepare('SELECT bundle_json, manifest_json FROM content_revisions WHERE id = ?').bind(m.revision).first();
  requireValue(stored?.bundle_json === bytes && stored.manifest_json === JSON.stringify(m), 'Immutable revision collision');
  for (let offset = 0; offset < bundle.catalog.records.length; offset += 50) {
    await db.batch(bundle.catalog.records.slice(offset, offset + 50).map(row => db.prepare('INSERT INTO content_records (revision_id, record_id, kind, dataset, payload_json) VALUES (?, ?, ?, ?, ?) ON CONFLICT(revision_id, record_id) DO NOTHING')
      .bind(m.revision, row.id, row.kind, row.dataset, JSON.stringify(row))));
  }
  const result = await db.prepare('SELECT record_id, kind, dataset, payload_json FROM content_records WHERE revision_id = ?').bind(m.revision).all();
  const expected = new Map(bundle.catalog.records.map(row => [row.id, row]));
  requireValue(result.results.length === m.recordCount && result.results.every(row => {
    const value = expected.get(row.record_id);
    return value && row.kind === value.kind && row.dataset === value.dataset && row.payload_json === JSON.stringify(value);
  }), 'Incomplete or corrupt staged records');
  await db.batch([
    db.prepare('INSERT INTO content_publication_provenance (revision_id, repository, commit_sha, workflow_run, verified_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(revision_id) DO NOTHING').bind(m.revision, provenance.repository, provenance.commit, provenance.workflowRun, new Date().toISOString()),
    db.prepare('UPDATE content_revisions SET completed = 1 WHERE id = ? AND digest = ?').bind(m.revision, m.digest),
  ]);
  return { status: 'staged', revision: m.revision, engineRevision: m.engineRevision, recordCount: m.recordCount, provenance };
}
export async function readPublicationHead(db, engineRevision) {
  requireValue(ENGINE.test(engineRevision), 'Invalid engine');
  const channel = 'engine:' + engineRevision;
  const row = await db.prepare('SELECT p.revision_id, COALESCE((SELECT MAX(generation) FROM content_publication_events WHERE channel = p.channel), 0) AS generation FROM content_publication p JOIN content_revisions r ON r.id = p.revision_id WHERE p.channel = ? AND r.engine = ? AND r.completed = 1').bind(channel, engineRevision).first();
  requireValue(row && REVISION.test(row.revision_id) && Number.isSafeInteger(row.generation), 'Verified initial publication required');
  return { revision: row.revision_id, generation: row.generation };
}
export async function activatePublication(db, input, { engineRevision } = {}) {
  const action = snapshot(input);
  exactKeys(action, ['operationId', 'revision', 'expectedRevision', 'expectedGeneration', 'intent'], 'activation');
  requireValue(/^pub-[a-f0-9]{32}$/.test(action.operationId) && REVISION.test(action.revision) && REVISION.test(action.expectedRevision) && Number.isSafeInteger(action.expectedGeneration) && action.expectedGeneration >= 0 && action.expectedGeneration < Number.MAX_SAFE_INTEGER && ['publish', 'rollback'].includes(action.intent) && ENGINE.test(engineRevision), 'Invalid activation');
  requireValue(action.revision !== action.expectedRevision, 'Activation must change the revision');
  const channel = 'engine:' + engineRevision;
  const event = await db.prepare('SELECT * FROM content_publication_events WHERE operation_id = ?').bind(action.operationId).first();
  if (event) {
    requireValue(event.channel === channel && event.from_revision === action.expectedRevision && event.to_revision === action.revision && event.generation === action.expectedGeneration + 1 && event.intent === action.intent, 'Operation ID collision');
    return { status: 'already-applied', applied: { revision: event.to_revision, generation: event.generation }, current: await readPublicationHead(db, engineRevision) };
  }
  const target = await db.prepare('SELECT r.bundle_json, p.commit_sha FROM content_revisions r JOIN content_publication_provenance p ON p.revision_id = r.id WHERE r.id = ? AND r.completed = 1 AND p.repository = ?').bind(action.revision, REPOSITORY).first();
  requireValue(target, 'Complete target revision required');
  const bundle = await validateBundle(JSON.parse(target.bundle_json), engineRevision);
  requireValue(bundle.manifest.revision === action.revision, 'Stored revision mismatch');
  const storedRecords = await db.prepare('SELECT record_id, kind, dataset, payload_json FROM content_records WHERE revision_id = ?').bind(action.revision).all();
  const expectedRecords = new Map(bundle.catalog.records.map(row => [row.id, row]));
  requireValue(storedRecords.results.length === bundle.manifest.recordCount && storedRecords.results.every(row => {
    const expected = expectedRecords.get(row.record_id);
    return expected && row.kind === expected.kind && row.dataset === expected.dataset && row.payload_json === JSON.stringify(expected);
  }), 'Target records are incomplete or corrupt');
  const current = await readPublicationHead(db, engineRevision);
  requireValue(current.revision === action.expectedRevision && current.generation === action.expectedGeneration, 'Stale publication expectation');
  {
    const known = await db.prepare('SELECT operation_id FROM content_publication_events WHERE channel = ? AND (from_revision = ? OR to_revision = ?) LIMIT 1').bind(channel, action.revision, action.revision).first();
    if (action.intent === 'rollback') requireValue(known, 'Rollback target was never active in publisher history');
    else requireValue(!known, 'Previously active content requires an explicit rollback');
  }
  // The event, generation check and pointer swap are one D1 batch/SQL transaction.
  // Recheck the head inside SQL, not merely in the preflight read above.
  await db.batch([
    db.prepare(`INSERT INTO content_publication_events (operation_id, channel, generation, from_revision, to_revision, provenance_commit, intent, created_at)
      SELECT ?, ?, ?, ?, ?, ?, ?, ? FROM content_publication p
      WHERE p.channel = ? AND p.revision_id = ?
      AND COALESCE((SELECT MAX(generation) FROM content_publication_events WHERE channel = ?), 0) = ?
      AND EXISTS (SELECT 1 FROM content_revisions WHERE id = ? AND engine = ? AND completed = 1)
      ON CONFLICT(operation_id) DO NOTHING`)
      .bind(action.operationId, channel, action.expectedGeneration + 1, action.expectedRevision, action.revision, target.commit_sha, action.intent, new Date().toISOString(), channel, action.expectedRevision, channel, action.expectedGeneration, action.revision, engineRevision),
    db.prepare(`UPDATE content_publication SET revision_id = ? WHERE channel = ? AND revision_id = ?
      AND EXISTS (SELECT 1 FROM content_publication_events WHERE operation_id = ? AND channel = ? AND from_revision = ? AND to_revision = ? AND generation = ?)
      AND (SELECT MAX(generation) FROM content_publication_events WHERE channel = ?) = ?`)
      .bind(action.revision, channel, action.expectedRevision, action.operationId, channel, action.expectedRevision, action.revision, action.expectedGeneration + 1, channel, action.expectedGeneration + 1),
  ]);
  const applied = await db.prepare('SELECT * FROM content_publication_events WHERE operation_id = ?').bind(action.operationId).first();
  requireValue(applied && applied.channel === channel && applied.from_revision === action.expectedRevision && applied.to_revision === action.revision && applied.generation === action.expectedGeneration + 1 && applied.intent === action.intent, 'Concurrent publication conflict');
  return { status: 'applied', applied: { revision: action.revision, generation: applied.generation }, current: await readPublicationHead(db, engineRevision) };
}
