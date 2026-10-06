/* Canonical JSON -> legacy adapters, public catalog and immutable publication bundle. */
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const path = require('node:path');
const hash = value => crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
const specs = [
  ['platform', 'data.js', 'SPLUNK_DATA'],
  ['products', 'product-data.js', null],
  ['guidance', 'guidance-data.js', null],
  ['environment', 'environment-data.js', 'VersionCompassEnvironmentData'],
  ['editions', 'editions-data.js', 'VersionCompassEditions'],
  ['forwarders', 'forwarders-data.js', 'VersionCompassForwarderData'],
  ['soar', 'soar-data.js', 'VersionCompassSOARData'],
];
const check = process.argv.includes('--check');
function write(file, value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n';
  if (check) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text) throw Error(file + ' needs content synchronization');
  } else {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
  }
}
function validate(value, at = 'content') {
  if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) throw Error('Unsafe content key at ' + at);
    validate(child, at + '.' + key);
  }
}
const globals = {}, datasets = {}, datasetHashes = {};
for (const [id, file, global] of specs) {
  const data = JSON.parse(fs.readFileSync('content/datasets/' + id + '.json', 'utf8'));
  validate(data); datasets[id] = data; datasetHashes[id] = hash(data);
  let adapter;
  if (id === 'products') {
    Object.assign(globals.SPLUNK_DATA.categories, data.categories);
    Object.assign(globals.SPLUNK_DATA, { products: data.products, productTracks: data.productTracks });
    adapter = 'Object.assign(window.SPLUNK_DATA.categories, ' + JSON.stringify(data.categories, null, 2) + ');\nObject.assign(window.SPLUNK_DATA, ' + JSON.stringify({ products: data.products, productTracks: data.productTracks }, null, 2) + ');\n';
  } else if (id === 'guidance') {
    globals.SPLUNK_DATA.guidance = data;
    adapter = 'window.SPLUNK_DATA.guidance = ' + JSON.stringify(data, null, 2) + ';\n';
  } else {
    globals[global] = data;
    adapter = 'window.' + global + ' = ' + JSON.stringify(data, null, 2) + ';\n';
  }
  write('dist/' + file, '/* Generated from content/datasets/' + id + '.json. Edit the JSON source, not this adapter. */\n' + adapter);
}
const identityFile = 'content/identities.json';
const identities = fs.existsSync(identityFile) ? JSON.parse(fs.readFileSync(identityFile, 'utf8')) : {};
const records = [], sourceMap = new Map();
function source(url) {
  if (!/^https:\/\//.test(url)) throw Error('Invalid evidence URL: ' + url);
  if (!sourceMap.has(url)) sourceMap.set(url, { id: 'source-' + hash(url).slice(0, 20), kind: 'source', dataset: 'sources', url });
  return sourceMap.get(url);
}
function urls(value) {
  if (typeof value === 'string') return /^https:\/\//.test(value) ? [value] : [];
  if (!value || typeof value !== 'object') return [];
  return Object.values(value).flatMap(urls);
}
function add(dataset, kind, logicalKey, value, scope, references = [], verified = null) {
  const identity = dataset + '|' + kind + '|' + logicalKey;
  if (!identities[identity]) identities[identity] = 'vc-' + hash(identity).slice(0, 20);
  const evidence = references.map(ref => {
    const row = source(ref.url);
    return { sourceId: row.id, url: row.url, section: ref.section || null, sectionScope: ref.section ? 'Recorded source section; claim-specific support is not inferred' : 'Section not recorded', sourceVerified: ref.reviewed || null, sourceChecked: ref.checked || null };
  });
  records.push({ id: identities[identity], kind, dataset, scope, evidence, verification: { date: verified, outcome: verified ? 'Recorded in original claim' : 'Claim verification not recorded' }, payload: value });
}
for (const [dataset, data] of Object.entries(datasets)) {
  const catalog = data.sources || {};
  for (const url of urls(data)) source(url);
  function references(value, inherited) {
    const refs = [];
    for (const key of ['src', 'sources']) for (const id of [].concat(value?.[key] || [])) {
      if (typeof id !== 'string') continue;
      const entry = catalog[id];
      if (entry) refs.push({ url: entry.url || entry.u, section: entry.section, reviewed: entry.reviewed, checked: entry.checked });
    }
    for (const url of urls(value?.source || inherited)) refs.push({ url });
    return [...new Map(refs.filter(r => r.url).map(r => [r.url, r])).values()];
  }
  function visit(value, parts = [], scope = {}, inherited = null) {
    if (!value || typeof value !== 'object') return;
    const key = parts.at(-1);
    const nextScope = { ...scope };
    if (parts.length === 1 && ['enterprise', 'cloud', 'migration'].includes(key)) nextScope.platform = key;
    if (parts.at(-2) === 'productTracks') nextScope.product = key;
    if (parts.at(-2) === 'releasesData') nextScope.release = key;
    for (const k of ['release', 'version', 'deployments', 'availability', 'providers', 'regions', 'compliance']) if (value[k] != null && !Array.isArray(value)) nextScope[k] = value[k];
    const inheritedSource = value.source || inherited;
    if (key === 'edges') for (const [from, targets] of Object.entries(value)) for (const to of targets) add(dataset, 'upgrade-edge', [...parts.slice(0, -1), from, to].join('/'), { from, to, qualification: 'Existing documented route edge; no additional compatibility inference' }, nextScope, references({}, inheritedSource));
    const isTuple = Array.isArray(value) && typeof value[0] === 'string' && parts.length > 1 && /^\d+$/.test(key) && ['features', 'requirements', 'operatingBenefits', 'breakingChanges'].includes(parts.at(-2));
    const isNamedRecord = !Array.isArray(value) && (value.title || value.name || value.t) && !['sources', 'categories', 'products'].includes(parts.at(-2));
    if (isTuple || isNamedRecord) {
      const title = isTuple ? value[0] : value.id || value.title || value.name || value.t;
      const kind = value.kind || (isTuple ? parts.at(-2).replace(/s$/, '') : parts.includes('technicalChanges') ? 'technical' : parts.includes('claimSources') ? 'claim' : 'claim');
      const container = parts.slice(0, -1).join('/');
      let refs = references(value, inheritedSource);
      if (isTuple && ['requirements', 'breakingChanges'].includes(parts.at(-2)) && /^https:\/\//.test(value[3] || '')) refs = [{ url: value[3] }];
      add(dataset, kind, container + '/' + title, value, nextScope, refs, value.verified || null);
    }
    for (const [childKey, child] of Object.entries(value)) if (childKey !== 'sources' && childKey !== 'edges') visit(child, [...parts, childKey], nextScope, inheritedSource);
  }
  visit(data);
}
records.push(...sourceMap.values());
records.sort((a, b) => a.id.localeCompare(b.id));
if (new Set(records.map(r => r.id)).size !== records.length) throw Error('Duplicate stable record identities; assign a distinct explicit identity');
write(identityFile, identities);
const catalog = { schemaVersion: 1, records };
write('content/catalog.json', catalog);
const engineFiles = ['comparison.js', 'forwarders.js', 'soar.js', 'environment.js', 'guidance.js', 'editions.js', 'report-tools.js', 'release-print.js', 'evidence.js', 'decision-support.js', 'perspectives.js', 'webmcp.js', 'navigation.js', 'app.js', 'soar-ui.js', 'forwarders-ui.js', 'content-client.js'].map(file => 'dist/' + file).concat(['worker/publication-core.mjs', 'worker/content-store.mjs', 'worker/index.mjs', 'worker/publisher.mjs', 'client/content-client-active.js', 'client/navigation-deployment-pinned.js']);
const engineRevision = 'engine-' + hash(engineFiles.map(file => [file, fs.readFileSync(file, 'utf8')])).slice(0, 20);
const digest = hash({ schemaVersion: 1, globals, catalog });
// A rules-only change creates a new publication while preserving dataset hashes.
const manifest = { schemaVersion: 1, revision: 'content-' + hash({ digest, engineRevision, datasetHashes }).slice(0, 24), digest, engineRevision, datasetHashes, recordCount: records.length, provenance: 'Canonical content/datasets JSON in the public VersionCompass repository', verificationPolicy: 'Migration and delivery do not create verification dates', phase: 'content-model-and-database-delivery' };
write('content/publication.json', manifest);
write('dist/content-manifest.json', manifest);
write('dist/content-bundle.json', { manifest, globals, catalog });
write('dist/content-catalog.json', catalog);
console.log(JSON.stringify({ revision: manifest.revision, engineRevision, datasets: specs.length, records: records.length }));

module.exports = { hash, specs, validate };
