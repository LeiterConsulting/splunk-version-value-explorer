/* Repository-published issue observations; no network, workflow state or site writes. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const VERSION = '1.0.0';
const outcomes = ['still-present', 'partially-addressed', 'addressed-in-reviewed-scope', 'unable-to-verify', 'not-reassessed'];
const concernTypes = ['contradiction', 'suspected-error', 'uncertain-claim', 'coverage-gap'];
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const encode = value => JSON.stringify(value, null, 2) + '\n';
const assert = (condition, message) => { if (!condition) throw Error(message); };
const text = value => typeof value === 'string' && value.trim().length > 0;
const list = value => Array.isArray(value) && value.every(text);
const date = value => typeof value === 'string' && /^(\d{4}-\d{2}-\d{2}|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value.slice(0, 10);
const id = value => typeof value === 'string' && /^[a-z][a-z0-9-]{2,99}$/.test(value);
const key = record => `${record.kind}:${record.kind === 'finding' ? record.findingId : record.assessmentId}@${record.revision}`;
function scope(value) {
  assert(value && ['products', 'versions', 'editions', 'deployments', 'regions', 'audiences'].every(k => value[k] === null || list(value[k])) && list(value.exclusions), 'Invalid structured scope');
}
function evidence(rows) {
  assert(Array.isArray(rows) && rows.length > 0 && rows.length <= 100, 'Missing or excessive evidence');
  assert(new Set(rows.map(r => r.evidenceId)).size === rows.length, 'Duplicate evidence identity');
  for (const row of rows) {
    assert(id(row.evidenceId) && text(row.section) && text(row.statement) && ['observed', 'challenging', 'context'].includes(row.role), 'Invalid evidence locator');
    const url = new URL(row.url);
    assert(url.protocol === 'https:' && !url.username && !url.password, 'Evidence must use public HTTPS locators');
    assert(row.excerpt === null || text(row.excerpt) && row.excerpt.length <= 300, 'Excerpt must be bounded or unknown');
    assert(row.sourceCheckedAt === null || date(row.sourceCheckedAt), 'Invalid source check time');
    assert(['retrieved', 'unavailable', 'not-recorded'].includes(row.availability), 'Invalid availability');
    const revision = row.documentRevision;
    assert(revision && text(revision.qualification) && (revision.type === 'unavailable' && revision.value === null || revision.type === 'sha256' && /^[a-f0-9]{64}$/.test(revision.value)), 'Document revision must be exact or explicitly unavailable');
  }
}
function validateRecord(record, synthetic) {
  assert(record.schemaVersion === VERSION && record.synthetic === synthetic && Number.isInteger(record.revision) && record.revision > 0, 'Invalid record envelope');
  assert(['finding', 'assessment'].includes(record.kind) && id(record.findingId), 'Invalid record identity');
  assert(date(record.recordedAt), 'Invalid record creation time');
  scope(record.kind === 'finding' ? record.scope : record.reviewedScope);
  evidence(record.evidence);
  assert(Array.isArray(record.provenance) && record.provenance.length > 0, 'Missing assessment provenance');
  for (const p of record.provenance) {
    assert(['published-audit-normalization', 'direct-public-review', 'synthetic-example'].includes(p.basis) && text(p.originalLabel) && text(p.pointer), 'Invalid provenance');
    if (synthetic) assert(p.basis === 'synthetic-example', 'Synthetic evidence must stay labeled');
    else assert(p.basis !== 'synthetic-example' && /^https:\/\/github\.com\/LeiterConsulting\/splunk-version-value-explorer\/blob\/[a-f0-9]{40}\/docs\//.test(p.url), 'Real provenance must pin a public repository revision');
  }
  if (record.kind === 'finding') {
    assert(concernTypes.includes(record.concernType) && text(record.title) && text(record.problem), 'Invalid finding description');
    assert(record.impact && text(record.impact.customerScenario) && text(record.impact.consequence) && ['unknown', 'low', 'moderate', 'high'].includes(record.impact.level), 'Missing reader impact');
    assert(record.confidence && ['not-rated', 'low', 'moderate', 'high'].includes(record.confidence.level) && text(record.confidence.rationale), 'Missing confidence qualification');
    assert(list(record.claimIds), 'Claim identities must be explicit');
    assert(record.lifecycle && ['active', 'withdrawn', 'superseded', 'merged'].includes(record.lifecycle.disposition) && text(record.lifecycle.reason), 'Invalid editorial disposition');
    assert(record.relationships && ['related', 'mergedInto', 'supersedes', 'supersededBy'].every(k => list(record.relationships[k])), 'Invalid identity relationships');
    assert(!['merged', 'superseded'].includes(record.lifecycle.disposition) || (record.lifecycle.disposition === 'merged' ? record.relationships.mergedInto.length : record.relationships.supersededBy.length), 'Disposition needs a target identity');
    if (record.concernType === 'contradiction') {
      assert(record.evidence.filter(e => ['observed', 'challenging'].includes(e.role)).length >= 2 && record.evidence.some(e => e.role === 'observed') && record.evidence.some(e => e.role === 'challenging') && text(record.scopeComparison), 'A contradiction needs both statements and a scope comparison');
    }
    if (record.concernType === 'suspected-error') assert(record.evidence.some(e => e.role === 'observed') && record.evidence.some(e => e.role === 'challenging'), 'Suspected error needs observed and challenging evidence');
    if (record.concernType === 'coverage-gap') assert(record.coverageSearch && text(record.coverageSearch.question) && text(record.coverageSearch.expectedAnswer) && list(record.coverageSearch.corpusEvidenceIds) && record.coverageSearch.corpusEvidenceIds.length > 0 && record.coverageSearch.corpusEvidenceIds.every(e => record.evidence.some(r => r.evidenceId === e && r.availability === 'retrieved')) && date(record.coverageSearch.searchedAt) && text(record.coverageSearch.limits), 'A coverage gap needs a finite retrieved corpus and customer question');
  } else {
    assert(id(record.assessmentId) && outcomes.includes(record.outcome) && (record.assessedAt === null && record.outcome === 'not-reassessed' || date(record.assessedAt)), 'Invalid assessment identity, outcome or time');
    assert(text(record.rationale) && list(record.remainingConcerns) && list(record.comparedAssessmentIds), 'Missing assessment rationale/history');
    assert(record.outcome === 'addressed-in-reviewed-scope' || record.remainingConcerns.length > 0, 'Unresolved outcomes must retain concerns');
  }
}
function validateLedger(ledger, previous = null) {
  assert(ledger.schemaVersion === VERSION && typeof ledger.synthetic === 'boolean', 'Unsupported ledger version');
  assert(Array.isArray(ledger.records) && ledger.records.length > 0 && ledger.records.length <= 2000, 'Invalid record collection');
  ledger.records.forEach(r => validateRecord(r, ledger.synthetic));
  const records = new Map(ledger.records.map(r => [key(r), r]));
  assert(records.size === ledger.records.length, 'Duplicate record revision');
  const identities = new Map();
  for (const r of ledger.records) {
    const identity = `${r.kind}:${r.kind === 'finding' ? r.findingId : r.assessmentId}`;
    const revisions = identities.get(identity) || [];
    revisions.push(r.revision); identities.set(identity, revisions);
  }
  for (const revisions of identities.values()) assert(revisions.sort((a, b) => a - b).every((n, i) => n === i + 1), 'Revision history must start at one and remain consecutive');
  for (const r of ledger.records.filter(r => r.kind === 'assessment')) assert(ledger.records.filter(a => a.kind === 'assessment' && a.assessmentId === r.assessmentId).every(a => a.findingId === r.findingId), 'An assessment identity cannot move between findings');
  for (const r of ledger.records) {
    if (r.kind === 'assessment') {
      assert(identities.has(`finding:${r.findingId}`), 'Assessment refers to an unknown finding');
      for (const compared of r.comparedAssessmentIds) assert(compared !== r.assessmentId && ledger.records.some(a => a.kind === 'assessment' && a.assessmentId === compared && a.findingId === r.findingId && a.assessedAt && (!r.assessedAt || a.assessedAt <= r.assessedAt)), 'Compared assessment must belong to the same finding and precede this review');
    } else for (const targets of Object.values(r.relationships)) for (const target of targets) assert(target !== r.findingId && identities.has(`finding:${target}`), 'Unknown or self-related finding identity');
  }
  assert(Array.isArray(ledger.publications) && ledger.publications.length > 0 && ledger.publications.length <= 1000, 'Invalid publication history');
  const published = new Set();
  let lastPublishedAt = '';
  for (const [i, publication] of ledger.publications.entries()) {
    assert(publication.sequence === i + 1 && date(publication.publishedAt) && publication.publishedAt >= lastPublishedAt, 'Publication sequence/time must be monotonic');
    lastPublishedAt = publication.publishedAt;
    assert(Array.isArray(publication.recordKeys) && publication.recordKeys.length <= 2000 && new Set(publication.recordKeys).size === publication.recordKeys.length && publication.recordKeys.every(k => records.has(k)), 'Invalid snapshot record references');
    assert([...published].every(k => publication.recordKeys.includes(k)), 'Snapshots must retain all previously published records');
    publication.recordKeys.forEach(k => published.add(k));
    for (const k of publication.recordKeys) {
      const r = records.get(k);
      assert(r.recordedAt <= publication.publishedAt, 'A record cannot be published before it was recorded');
      if (r.kind === 'assessment') assert(publication.recordKeys.some(other => records.get(other).kind === 'finding' && records.get(other).findingId === r.findingId), 'Snapshot omits assessed finding');
    }
    assert(publication.coverage && publication.coverage.mode === 'bounded-pilot' && list(publication.coverage.watchFamilies) && text(publication.coverage.completeness) && list(publication.coverage.exclusions) && date(publication.coverage.evidenceThrough), 'Coverage must be bounded and explicit');
  }
  assert(published.size === records.size, 'Unpublished ledger records are not allowed');
  if (previous) {
    for (const old of previous.records) assert(records.has(key(old)) && encode(records.get(key(old))) === encode(old), 'Published record history is immutable; append a revision');
    assert(ledger.publications.length >= previous.publications.length && previous.publications.every((p, i) => encode(p) === encode(ledger.publications[i])), 'Published snapshots are immutable; append a publication');
  }
  return ledger;
}
function build(ledger) {
  validateLedger(ledger);
  const files = new Map(), descriptors = new Map();
  for (const record of ledger.records) {
    const bytes = encode(record), digest = sha256(bytes), file = `records/${digest}.json`;
    files.set(file, bytes);
    descriptors.set(key(record), { kind: record.kind, id: record.kind === 'finding' ? record.findingId : record.assessmentId, revision: record.revision, path: file, sha256: digest, byteLength: Buffer.byteLength(bytes) });
  }
  const publications = [];
  for (const publication of ledger.publications) {
    const snapshot = { schemaVersion: VERSION, kind: 'snapshot', synthetic: ledger.synthetic, sequence: publication.sequence, publishedAt: publication.publishedAt, previousPublicationId: publications.at(-1)?.publicationId || null, coverage: publication.coverage, records: publication.recordKeys.map(k => descriptors.get(k)) };
    const bytes = encode(snapshot), digest = sha256(bytes), file = `snapshots/${digest}.json`;
    files.set(file, bytes);
    publications.push({ publicationId: `vci-${digest}`, sequence: snapshot.sequence, publishedAt: snapshot.publishedAt, path: file, sha256: digest, byteLength: Buffer.byteLength(bytes) });
  }
  const index = { schemaVersion: VERSION, publicationVersion: VERSION, kind: 'index', feedId: ledger.synthetic ? 'versioncompass-issues-examples' : 'versioncompass-issues', synthetic: ledger.synthetic, latest: publications.at(-1), publications, cadence: { mode: 'existing-watch-publications', fixedFeedInterval: null, qualification: 'Issue-level review follows the existing watches. No fresh assessment, SLA or exhaustive coverage is implied by an index update.' }, repositoryPublication: { transport: 'commit-pinned-static-json', qualification: 'Resolve one full Git commit and read all paths at that commit. publishedAt is the producer timestamp; Git commit availability is repository publication evidence.' }, liveSiteDelivery: { status: 'not-designated', endpoint: null, qualification: 'This feed is published in the repository. Website deployment or D1 health does not establish feed delivery.' } };
  files.set('index.json', encode(index));
  for (const bytes of files.values()) assert(Buffer.byteLength(bytes) <= 2 * 1024 * 1024, 'Feed object exceeds 2 MiB');
  return { files, index };
}
function sync(root = process.cwd(), check = false) {
  const source = 'content/issue-feed.json';
  const ledger = JSON.parse(fs.readFileSync(path.join(root, source)));
  let previous;
  try { previous = JSON.parse(execFileSync('git', ['show', `HEAD:${source}`], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' })); } catch {}
  validateLedger(ledger, previous);
  const outputs = [[ledger, 'feeds/issues/v1'], [JSON.parse(fs.readFileSync(path.join(root, 'content/issue-feed-examples.json'))), 'feeds/issues/v1/examples']];
  let count = 0;
  for (const [input, destination] of outputs) {
    const { files } = build(input);
    for (const directory of ['records', 'snapshots']) {
      const full = path.join(root, destination, directory);
      for (const name of fs.existsSync(full) ? fs.readdirSync(full) : []) assert(files.has(`${directory}/${name}`), 'Unexpected generated file: ' + path.join(destination, directory, name));
    }
    for (const [file, bytes] of files) {
      const full = path.join(root, destination, file);
      if (check) assert(fs.existsSync(full) && fs.readFileSync(full, 'utf8') === bytes, 'Stale issue feed: ' + path.join(destination, file));
      else {
        if (file !== 'index.json' && fs.existsSync(full)) assert(fs.readFileSync(full, 'utf8') === bytes, 'Refusing immutable file replacement');
        fs.mkdirSync(path.dirname(full), { recursive: true }); fs.writeFileSync(full, bytes);
      }
      count++;
    }
  }
  return { files: count, publications: ledger.publications.length, findings: ledger.records.filter(r => r.kind === 'finding').length, assessments: ledger.records.filter(r => r.kind === 'assessment').length };
}
module.exports = { VERSION, outcomes, concernTypes, sha256, encode, key, validateRecord, validateLedger, build, sync };
