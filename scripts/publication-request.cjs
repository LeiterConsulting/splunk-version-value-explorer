#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const DATASETS = ['editions', 'environment', 'forwarders', 'guidance', 'platform', 'products', 'soar'];
const REPOSITORY = 'LeiterConsulting/splunk-version-value-explorer';
const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith('--') || argv[i + 1] == null) throw Error('Arguments must be --name value pairs');
    args[argv[i].slice(2)] = argv[i + 1];
  }
  return args;
}

async function createPublicationRequest({ repository, commit, tree, ref, expectedCurrentRevision }, root = process.cwd()) {
  if (repository !== REPOSITORY) throw Error('Publication repository is not authorized');
  if (!/^[a-f0-9]{40}$/.test(commit || '') || !/^[a-f0-9]{40}$/.test(tree || '')) throw Error('Commit and tree must be full Git object IDs');
  if (ref !== 'refs/heads/main') throw Error('Only the authoritative main branch can publish');
  if (expectedCurrentRevision != null && !/^content-[a-f0-9]{24}$/.test(expectedCurrentRevision)) throw Error('A valid expected current revision is required for activation');

  const publication = JSON.parse(fs.readFileSync(path.join(root, 'content/publication.json'), 'utf8'));
  const bundle = JSON.parse(fs.readFileSync(path.join(root, 'dist/content-bundle.json'), 'utf8'));
  const identities = JSON.parse(fs.readFileSync(path.join(root, 'content/identities.json'), 'utf8'));
  const { validateBundle } = await import('file://' + path.join(root, 'worker/publication-core.mjs'));
  await validateBundle(bundle, publication.engineRevision);
  if (JSON.stringify(bundle.manifest) !== JSON.stringify(publication)) throw Error('Generated manifest does not match the publication authority');
  if (JSON.stringify(Object.keys(publication.datasetHashes).sort()) !== JSON.stringify(DATASETS)) throw Error('Publication does not contain exactly seven dataset identities');
  for (const dataset of DATASETS) {
    const value = JSON.parse(fs.readFileSync(path.join(root, 'content/datasets', dataset + '.json'), 'utf8'));
    if (hash(value) !== publication.datasetHashes[dataset]) throw Error('Dataset hash mismatch: ' + dataset);
  }
  const recordIds = new Set(bundle.catalog.records.map(record => record.id));
  const identityIds = Object.values(identities);
  if (new Set(identityIds).size !== identityIds.length || identityIds.some(id => !recordIds.has(id))) throw Error('Stable identity registry does not match the generated catalog');

  return {
    schemaVersion: 1,
    provenance: { repository, commit, tree, ref },
    expectedCurrentRevision: expectedCurrentRevision || null,
    manifest: publication,
    bundle,
  };
}

if (require.main === module) {
  createPublicationRequest(parseArgs(process.argv.slice(2))).then(value => process.stdout.write(JSON.stringify(value) + '\n')).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { DATASETS, REPOSITORY, createPublicationRequest, parseArgs };
