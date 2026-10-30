/* Reference read-only consumer. Caller owns persistence and subsequent decisions. */
const { VERSION, outcomes, concernTypes, sha256, validateRecord } = require('./lib/issue-feed.cjs');
const REPOSITORY = 'LeiterConsulting/splunk-version-value-explorer';
const compatible = value => typeof value === 'string' && /^1\.\d+\.\d+$/.test(value);
const check = (value, message) => { if (!value) throw Error(message); };
async function readIssueFeed({ commit, checkpoint = null, synthetic = false, fetchImpl = globalThis.fetch }) {
  check(/^[a-f0-9]{40}$/.test(commit || ''), 'Supply one resolved full Git commit SHA');
  check(checkpoint === null || /^vci-[a-f0-9]{64}$/.test(checkpoint), 'Invalid checkpoint');
  const directory = 'feeds/issues/v1' + (synthetic ? '/examples' : '');
  const base = `https://raw.githubusercontent.com/${REPOSITORY}/${commit}/${directory}/`;
  async function get(file, descriptor = null) {
    check(file === 'index.json' || /^(records|snapshots)\/[a-f0-9]{64}\.json$/.test(file), 'Unsafe feed path');
    const response = await fetchImpl(base + file, { redirect: 'error', signal: AbortSignal.timeout(15000), headers: { Accept: 'application/json' } });
    check(response.ok, `Feed request failed: ${response.status}`);
    const chunks = []; let size = 0;
    for await (const chunk of response.body) { size += chunk.length; check(size <= 2 * 1024 * 1024, 'Feed object exceeds 2 MiB'); chunks.push(chunk); }
    const bytes = Buffer.concat(chunks);
    if (descriptor) check(bytes.length === descriptor.byteLength && sha256(bytes) === descriptor.sha256, 'Feed integrity mismatch');
    const value = JSON.parse(bytes.toString('utf8'));
    check(compatible(value.schemaVersion) && value.synthetic === synthetic, 'Unsupported schema major or mixed synthetic data');
    return value;
  }
  function descriptor(d, type) {
    check(d && /^[a-f0-9]{64}$/.test(d.sha256 || '') && d.path === `${type}/${d.sha256}.json` && Number.isInteger(d.byteLength) && d.byteLength > 0 && d.byteLength <= 2 * 1024 * 1024, 'Invalid immutable descriptor');
    if (type === 'records') check(typeof d.kind === 'string' && /^[a-z][a-z0-9-]{2,99}$/.test(d.id || '') && Number.isInteger(d.revision) && d.revision > 0, 'Invalid record descriptor identity');
  }
  const index = await get('index.json');
  check(index.kind === 'index' && index.feedId === (synthetic ? 'versioncompass-issues-examples' : 'versioncompass-issues') && compatible(index.publicationVersion), 'Invalid feed index');
  check(Array.isArray(index.publications) && index.publications.length > 0 && index.publications.length <= 1000, 'Invalid publication bounds');
  const publicationIds = new Set();
  for (const [i, item] of index.publications.entries()) {
    descriptor(item, 'snapshots');
    check(item.sequence === i + 1 && item.publicationId === `vci-${item.sha256}` && Number.isFinite(Date.parse(item.publishedAt)) && !publicationIds.has(item.publicationId), 'Broken publication sequence');
    publicationIds.add(item.publicationId);
  }
  check(JSON.stringify(index.latest) === JSON.stringify(index.publications.at(-1)), 'Latest checkpoint disagrees with history');
  const start = checkpoint ? index.publications.findIndex(p => p.publicationId === checkpoint) : -1;
  check(!checkpoint || start >= 0, 'Checkpoint is absent: stop and reconcile history; do not assume resolution or silently reset');
  // Bootstrap from the complete latest snapshot; recovery replays each newer one.
  const selected = checkpoint ? index.publications.slice(start + 1) : [index.latest];
  const records = new Map(), publications = [], quarantined = [];
  for (const item of selected) {
    const snapshot = await get(item.path, item);
    check(snapshot.kind === 'snapshot' && snapshot.sequence === item.sequence && snapshot.publishedAt === item.publishedAt && snapshot.previousPublicationId === (index.publications[item.sequence - 2]?.publicationId || null), 'Broken snapshot lineage');
    check(snapshot.coverage?.mode === 'bounded-pilot' && typeof snapshot.coverage.completeness === 'string' && Array.isArray(snapshot.coverage.exclusions) && Array.isArray(snapshot.records) && snapshot.records.length <= 2000, 'Missing snapshot coverage or bounds');
    const seen = new Set();
    for (const ref of snapshot.records) {
      descriptor(ref, 'records');
      const identity = `${ref.kind}:${ref.id}@${ref.revision}`;
      check(!seen.has(identity), 'Duplicate record in snapshot'); seen.add(identity);
      const existing = records.get(identity);
      check(!existing || existing.sha256 === ref.sha256, 'Identity revision collision');
      if (existing) continue;
      const record = await get(ref.path, ref);
      const recordId = record.kind === 'finding' ? record.findingId : record.kind === 'assessment' ? record.assessmentId : record.id;
      check(record.kind === ref.kind && recordId === ref.id && record.revision === ref.revision, 'Record identity mismatch');
      const unknown = !['finding', 'assessment'].includes(record.kind) || record.kind === 'assessment' && !outcomes.includes(record.outcome) || record.kind === 'finding' && !concernTypes.includes(record.concernType);
      if (unknown) quarantined.push({ descriptor: ref, record, reason: 'Unknown record kind or outcome; retain for review without workflow action.' });
      else validateRecord({ ...record, schemaVersion: VERSION }, synthetic);
      records.set(identity, { ...ref, record, quarantined: unknown });
    }
    publications.push({ descriptor: item, snapshot });
  }
  for (const { record, quarantined: unknown } of records.values()) if (!unknown && record.kind === 'assessment') check([...records.values()].some(r => r.record.kind === 'finding' && r.record.findingId === record.findingId), 'Snapshot omits assessed finding');
  // Persist this checkpoint only after a caller atomically persists all returned
  // records, including unknown records; retries are identified by kind/id/revision.
  return { commit, checkpoint: index.latest.publicationId, index, publications, records: [...records.values()], quarantined };
}
if (require.main === module) {
  const args = process.argv.slice(2), option = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
  readIssueFeed({ commit: option('--commit'), checkpoint: option('--checkpoint') || null, synthetic: args.includes('--examples') })
    .then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { readIssueFeed, compatible };
